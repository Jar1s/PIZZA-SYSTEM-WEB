# Wolt Admin Button - How It Should Work

## Current Implementation

**Location**: `frontend/components/admin/OrderCard.tsx`

**Current Behavior**:
- Button shows when: `order.status === OrderStatus.PAID` AND `!hasWoltDelivery`
- On click: Directly creates delivery via `/api/delivery/create`
- Problem: **Skips the shipment promise step** required by Wolt Drive API

## How It Should Work According to Documentation

### Official Wolt Drive Flow (Venueful Approach)

According to the [Wolt Drive documentation](https://developer.wolt.com/docs/wolt-drive), the correct flow is:

```
1. Request Shipment Promise → Get quote + promise ID
2. Create Delivery → Use promise ID from step 1
3. Receive Webhooks → Track status updates
```

### Recommended Admin Button Flow

#### Option 1: Two-Step Process (Recommended)

**Step 1: Check Availability & Get Quote**
- Button label: "🚚 Check Wolt Availability"
- Action: Request shipment promise
- Show: Price, ETA, availability status
- If available: Show "Create Delivery" button

**Step 2: Create Delivery**
- Button label: "✅ Create Wolt Delivery"
- Action: Create delivery using promise ID
- Only enabled after successful promise

#### Option 2: One-Click with Confirmation (Simpler)

**Single Button with Modal**
- Button: "🚚 Create Wolt Delivery"
- On click: 
  1. Request shipment promise (show loading)
  2. Show confirmation modal with:
     - Delivery fee
     - Estimated delivery time
     - Customer address
  3. If confirmed: Create delivery using promise ID

## Implementation Details

### Backend Changes Needed

#### 1. Add Shipment Promise Endpoint

```typescript
// backend/src/delivery/delivery.service.ts

async getShipmentPromise(
  tenantId: string,
  orderId: string,
): Promise<{
  promiseId: string;
  feeCents: number;
  etaMinutes: number;
  validUntil: string;
  available: boolean;
}> {
  const order = await this.ordersService.getOrderById(orderId);
  const tenant = await this.prisma.tenant.findUnique({
    where: { id: tenantId },
  });
  
  const deliveryConfig = tenant.deliveryConfig as DeliveryConfig;
  const pickupAddress = this.getPickupAddress(tenantId, deliveryConfig);
  const address = order.address as any;
  const customer = order.customer as any;
  
  // Request shipment promise from Wolt
  const promise = await this.woltDrive.getShipmentPromise(
    deliveryConfig.woltConfig.apiKey,
    pickupAddress,
    address,
    customer.name,
    customer.phone,
  );
  
  // Store promise ID with order (for later use)
  await this.prisma.order.update({
    where: { id: orderId },
    data: {
      // Store in metadata or create separate table
      metadata: {
        ...order.metadata,
        woltPromiseId: promise.promiseId,
        woltPromiseValidUntil: promise.validUntil,
      },
    },
  });
  
  return promise;
}
```

#### 2. Update Delivery Creation to Use Promise ID

```typescript
async createDeliveryForOrder(orderId: string, promiseId?: string) {
  const order = await this.ordersService.getOrderById(orderId);
  
  // Get promise ID from order metadata if not provided
  const shipmentPromiseId = promiseId || order.metadata?.woltPromiseId;
  
  if (!shipmentPromiseId) {
    throw new BadRequestException(
      'Shipment promise required. Please request availability first.'
    );
  }
  
  // Verify promise is still valid
  if (order.metadata?.woltPromiseValidUntil) {
    const validUntil = new Date(order.metadata.woltPromiseValidUntil);
    if (validUntil < new Date()) {
      throw new BadRequestException(
        'Shipment promise expired. Please request a new one.'
      );
    }
  }
  
  // Create delivery with promise ID
  const woltDelivery = await this.woltDrive.createDelivery(
    woltConfig.apiKey,
    order.id,
    pickupAddress,
    address,
    customer.name,
    customer.phone,
    shipmentPromiseId, // Include promise ID
  );
  
  // ... rest of delivery creation
}
```

#### 3. Update WoltDriveService

```typescript
// backend/src/delivery/wolt-drive.service.ts

async getShipmentPromise(
  apiKey: string,
  pickupAddress: Address,
  dropoffAddress: Address,
  customerName: string,
  customerPhone: string,
) {
  const request = {
    pickup: {
      location: {
        lat: pickupAddress.coordinates?.lat || 0,
        lon: pickupAddress.coordinates?.lng || 0,
      },
      // If using venueful with pre-configured venues:
      // venue_id: venueId,
    },
    dropoff: {
      location: {
        lat: dropoffAddress.coordinates?.lat || 0,
        lon: dropoffAddress.coordinates?.lng || 0,
      },
      contact: {
        name: customerName,
        phone: customerPhone,
      },
    },
  };
  
  const response = await fetch(
    `${this.apiUrl}/shipment-promises`, // ✅ Correct endpoint
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    }
  );
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Wolt API error: ${error.message || response.statusText}`);
  }
  
  const data = await response.json();
  
  return {
    promiseId: data.id, // Required for delivery creation
    feeCents: data.fee.amount,
    etaMinutes: data.dropoff_eta,
    validUntil: data.valid_until, // ISO 8601 timestamp
    available: true,
    currency: data.fee.currency,
  };
}

async createDelivery(
  apiKey: string,
  orderId: string,
  pickupAddress: Address,
  dropoffAddress: Address,
  customerName: string,
  customerPhone: string,
  shipmentPromiseId: string, // ✅ Required parameter
) {
  const request = {
    shipment_promise_id: shipmentPromiseId, // ✅ Include promise ID
    pickup: {
      location: {
        lat: pickupAddress.coordinates?.lat || 0,
        lon: pickupAddress.coordinates?.lng || 0,
      },
      address: `${pickupAddress.street}, ${pickupAddress.city}`,
      comment: pickupAddress.instructions || 'Kitchen entrance',
      contact: {
        name: 'Kitchen Staff',
        phone: this.getKitchenPhone(pickupAddress),
      },
    },
    dropoff: {
      location: {
        lat: dropoffAddress.coordinates?.lat || 0,
        lon: dropoffAddress.coordinates?.lng || 0,
      },
      address: `${dropoffAddress.street}, ${dropoffAddress.city}, ${dropoffAddress.postalCode}`,
      comment: dropoffAddress.instructions || '',
      contact: {
        name: customerName,
        phone: customerPhone,
      },
    },
    merchant_order_reference: orderId,
    contents: [
      // ✅ Include detailed parcel information
      {
        description: 'Pizza order',
        identifier: orderId,
        count: 1,
      },
    ],
  };
  
  // ... rest of implementation
}
```

### Frontend Changes Needed

#### Option 1: Two-Step Button Flow

```typescript
// frontend/components/admin/OrderCard.tsx

const [woltPromise, setWoltPromise] = useState<{
  promiseId: string;
  feeCents: number;
  etaMinutes: number;
  validUntil: string;
} | null>(null);
const [checkingWolt, setCheckingWolt] = useState(false);

const handleCheckWoltAvailability = async () => {
  setCheckingWolt(true);
  setWoltMessage(null);
  try {
    const promise = await checkWoltAvailability(order.id);
    setWoltPromise(promise);
    setWoltMessage(
      `✅ Available! Fee: €${(promise.feeCents / 100).toFixed(2)}, ` +
      `ETA: ~${promise.etaMinutes} min`
    );
  } catch (error: any) {
    setWoltMessage(`❌ ${error.message}`);
    setWoltPromise(null);
  } finally {
    setCheckingWolt(false);
  }
};

const handleCreateWoltDelivery = async () => {
  if (!woltPromise) {
    setWoltMessage('❌ Please check availability first');
    return;
  }
  
  setCreatingWolt(true);
  setWoltMessage(null);
  try {
    const result = await createWoltDelivery(order.id, woltPromise.promiseId);
    if (result.success) {
      setWoltMessage(`✅ Delivery created! Tracking: ${result.trackingUrl}`);
      setTimeout(() => window.location.reload(), 1500);
    }
  } catch (error: any) {
    setWoltMessage(`❌ Error: ${error.message}`);
  } finally {
    setCreatingWolt(false);
  }
};

// In JSX:
{!hasWoltDelivery && order.status === OrderStatus.PAID && (
  <>
    {!woltPromise ? (
      <button
        onClick={handleCheckWoltAvailability}
        disabled={checkingWolt}
        className="..."
      >
        {checkingWolt ? '⏳' : '🔍 Check Wolt'}
      </button>
    ) : (
      <button
        onClick={handleCreateWoltDelivery}
        disabled={creatingWolt}
        className="..."
      >
        {creatingWolt ? '⏳' : '🚚 Create Delivery'}
      </button>
    )}
  </>
)}
```

#### Option 2: Modal Confirmation Flow

```typescript
const [showWoltModal, setShowWoltModal] = useState(false);
const [woltQuote, setWoltQuote] = useState(null);

const handleWoltButtonClick = async () => {
  setCreatingWolt(true);
  try {
    // Step 1: Get shipment promise
    const promise = await checkWoltAvailability(order.id);
    setWoltQuote(promise);
    setShowWoltModal(true);
  } catch (error: any) {
    setWoltMessage(`❌ ${error.message}`);
  } finally {
    setCreatingWolt(false);
  }
};

const handleConfirmWoltDelivery = async () => {
  if (!woltQuote) return;
  
  setCreatingWolt(true);
  try {
    const result = await createWoltDelivery(order.id, woltQuote.promiseId);
    if (result.success) {
      setShowWoltModal(false);
      setWoltMessage(`✅ Delivery created!`);
      setTimeout(() => window.location.reload(), 1500);
    }
  } catch (error: any) {
    setWoltMessage(`❌ Error: ${error.message}`);
  } finally {
    setCreatingWolt(false);
  }
};

// Modal component
{showWoltModal && woltQuote && (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
    <div className="bg-white p-6 rounded-lg max-w-md">
      <h3 className="text-lg font-bold mb-4">Confirm Wolt Delivery</h3>
      <div className="space-y-2 mb-4">
        <p><strong>Delivery Fee:</strong> €{(woltQuote.feeCents / 100).toFixed(2)}</p>
        <p><strong>Estimated Time:</strong> ~{woltQuote.etaMinutes} minutes</p>
        <p><strong>Address:</strong> {order.address.street}, {order.address.city}</p>
      </div>
      <div className="flex gap-2">
        <button
          onClick={handleConfirmWoltDelivery}
          disabled={creatingWolt}
          className="flex-1 px-4 py-2 bg-orange-600 text-white rounded"
        >
          {creatingWolt ? 'Creating...' : 'Confirm'}
        </button>
        <button
          onClick={() => setShowWoltModal(false)}
          className="flex-1 px-4 py-2 bg-gray-300 rounded"
        >
          Cancel
        </button>
      </div>
    </div>
  </div>
)}
```

## API Endpoints to Add

### 1. Check Availability (Shipment Promise)

```typescript
// backend/src/delivery/delivery.controller.ts

@Post('check-availability')
async checkAvailability(@Body() data: { orderId: string }) {
  const order = await this.ordersService.getOrderById(data.orderId);
  return this.deliveryService.getShipmentPromise(order.tenantId, data.orderId);
}
```

### 2. Update Create Endpoint

```typescript
@Post('create')
async createDelivery(@Body() data: { orderId: string; promiseId?: string }) {
  return this.deliveryService.createDeliveryForOrder(data.orderId, data.promiseId);
}
```

## Error Handling

According to documentation, handle these cases:

1. **Customer outside delivery area** → Show clear message
2. **Outside operating hours** → Show message, suggest scheduled delivery
3. **Promise expired** → Auto-refresh promise
4. **Network errors** → Retry with exponential backoff (already implemented)

## Benefits of This Approach

✅ **Compliant with Wolt API** - Follows official documentation  
✅ **Better UX** - Admin sees quote before creating delivery  
✅ **Error Prevention** - Catches availability issues early  
✅ **Accurate Pricing** - Uses Wolt's real-time pricing  
✅ **Proper Flow** - Shipment promise → Delivery creation

## Migration Path

1. **Phase 1**: Add shipment promise endpoint (non-breaking)
2. **Phase 2**: Update frontend to use two-step flow
3. **Phase 3**: Make promise ID required in delivery creation
4. **Phase 4**: Remove old direct delivery creation

---

**Recommendation**: Implement **Option 2 (Modal Confirmation)** for better UX while maintaining compliance with Wolt Drive API requirements.
