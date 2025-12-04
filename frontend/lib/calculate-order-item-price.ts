import { calculateModifierPrice } from '@pizza-ecosystem/shared';
import { OrderItem } from '@pizza-ecosystem/shared';

/**
 * Calculates the correct price for an order item
 * Handles both old orders (where priceCents doesn't include modifiers) 
 * and new orders (where priceCents already includes modifiers)
 * 
 * Strategy: Use heuristic to detect old orders:
 * - If priceCents is very low (< 700 cents = 7€) and item has modifiers with price,
 *   it's likely an old order where priceCents = basePrice only
 * - Otherwise, assume it's a new order where priceCents already includes modifiers
 * 
 * @param item - Order item from database
 * @param productCategory - Product category (PIZZA, STANGLE, etc.) - defaults to PIZZA
 * @returns Total price for the item (price per unit * quantity)
 */
export function calculateOrderItemPrice(
  item: OrderItem,
  productCategory: string = 'PIZZA'
): number {
  const storedPricePerUnit = item.priceCents;
  const modifierPrice = calculateModifierPrice(item.modifiers, productCategory);
  
  // Heuristic: If price is very low (< 7€) and we have modifiers with price,
  // it's likely an old order where priceCents doesn't include modifiers
  // Typical pizza base price is 8-12€, so < 7€ with modifiers = old order
  const isLikelyOldOrder = storedPricePerUnit < 700 && modifierPrice > 0;
  
  const finalPricePerUnit = isLikelyOldOrder
    ? storedPricePerUnit + modifierPrice // For old orders, add modifierPrice
    : storedPricePerUnit; // For new orders, priceCents already includes modifiers
  
  return finalPricePerUnit * item.quantity;
}

/**
 * Gets the price per unit for an order item
 * Handles both old and new orders
 */
export function getOrderItemPricePerUnit(
  item: OrderItem,
  productCategory: string = 'PIZZA'
): number {
  const storedPricePerUnit = item.priceCents;
  const modifierPrice = calculateModifierPrice(item.modifiers, productCategory);
  
  // Heuristic: If price is very low (< 7€) and we have modifiers with price,
  // it's likely an old order where priceCents doesn't include modifiers
  const isLikelyOldOrder = storedPricePerUnit < 700 && modifierPrice > 0;
  
  return isLikelyOldOrder
    ? storedPricePerUnit + modifierPrice
    : storedPricePerUnit;
}

