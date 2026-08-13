'use client';

import { useState, useEffect } from 'react';
import { Tenant } from '@pizza-ecosystem/shared';
import { updateTenant } from '@/lib/api';

interface EditBrandModalProps {
  tenant: Tenant | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: () => void;
}

export function EditBrandModal({ 
  tenant, 
  isOpen, 
  onClose, 
  onUpdate 
}: EditBrandModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    subdomain: '',
    domain: '',
    isActive: true,
  });
  const [themeColors, setThemeColors] = useState({
    primaryColor: '#E91E63',
    secondaryColor: '#0F141A',
  });
  const [cashEnabled, setCashEnabled] = useState(false);
  const [cardEnabled, setCardEnabled] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [faviconUrl, setFaviconUrl] = useState('');
  const [googleOAuthConfig, setGoogleOAuthConfig] = useState({
    clientId: '',
    clientSecret: '',
    redirectUri: '',
    enabled: false,
  });
  const [subCategoryLabels, setSubCategoryLabels] = useState({
    foreplay: { titleSk: '', titleEn: '', descSk: '', descEn: '' },
    mainAction: { titleSk: '', titleEn: '', descSk: '', descEn: '' },
    deluxeFetish: { titleSk: '', titleEn: '', descSk: '', descEn: '' },
    premiumSins: { titleSk: '', titleEn: '', descSk: '', descEn: '' },
    stangle: { titleSk: '', titleEn: '', descSk: '', descEn: '' },
    soups: { titleSk: '', titleEn: '', descSk: '', descEn: '' },
    drinks: { titleSk: '', titleEn: '', descSk: '', descEn: '' },
    desserts: { titleSk: '', titleEn: '', descSk: '', descEn: '' },
  });
  
  // GoPay settings
  const [gopayClientId, setGopayClientId] = useState('');
  const [gopayClientSecret, setGopayClientSecret] = useState('');
  const [gopayGoId, setGopayGoId] = useState('');
  const [gopayEnvironment, setGopayEnvironment] = useState('sandbox');

  // Wolt/Delivery settings
  const [woltApiKey, setWoltApiKey] = useState('');
  const [pickupStreet, setPickupStreet] = useState('');
  const [pickupCity, setPickupCity] = useState('');
  const [pickupPostalCode, setPickupPostalCode] = useState('');
  const [pickupCountry, setPickupCountry] = useState('SK');
  const [pickupLat, setPickupLat] = useState('');
  const [pickupLng, setPickupLng] = useState('');
  const [pickupPhone, setPickupPhone] = useState('');
  const [pickupInstructions, setPickupInstructions] = useState('');

  // Email / SMTP settings
  const [fromEmail, setFromEmail] = useState('');
  const [smtpHost, setSmtpHost] = useState('');
  const [smtpPort, setSmtpPort] = useState('587');
  const [smtpUser, setSmtpUser] = useState('');
  const [smtpPassword, setSmtpPassword] = useState('');
  const [smtpSecure, setSmtpSecure] = useState(false);

  // Analytics & Tracking settings
  const [analyticsConfig, setAnalyticsConfig] = useState({
    googleAnalytics: { measurementId: '', enabled: false },
    facebookPixel: { pixelId: '', enabled: false },
    googleTagManager: { containerId: '', enabled: false },
  });

  useEffect(() => {
    if (tenant) {
      // Handle theme as JSON object
      const theme = typeof tenant.theme === 'object' && tenant.theme !== null 
        ? tenant.theme as any
        : {};
      
      const paymentConfig = (tenant.paymentConfig as any) || {};
      const deliveryConfig = (tenant.deliveryConfig as any) || {};
      const woltConfig = deliveryConfig.woltConfig || {};
      const pickupAddress = deliveryConfig.pickupAddress || {};
      const emailConfig = (tenant.emailConfig as any) || {};
      
      setFormData({
        name: tenant.name || '',
        subdomain: tenant.subdomain || tenant.slug || '',
        domain: tenant.domain || '',
        isActive: tenant.isActive !== undefined ? tenant.isActive : true,
      });
      // Load GoPay settings
      setGopayClientId(paymentConfig.clientId || '');
      setGopayClientSecret(paymentConfig.clientSecret || '');
      setGopayGoId(paymentConfig.goId || '');
      setGopayEnvironment(paymentConfig.environment || 'sandbox');

      setThemeColors({
        primaryColor: theme.primaryColor || '#E91E63',
        secondaryColor: theme.secondaryColor || '#0F141A',
      });
      setFaviconUrl(theme.favicon || '');
      setCashEnabled(paymentConfig.cashOnDeliveryEnabled === true);
      setCardEnabled(paymentConfig.cardOnDeliveryEnabled === true);
      const oauthConfig = theme.googleOAuthConfig || {};
      setGoogleOAuthConfig({
        clientId: oauthConfig.clientId || '',
        clientSecret: oauthConfig.clientSecret || '',
        redirectUri: oauthConfig.redirectUri || '',
        enabled: oauthConfig.enabled || false,
      });
      const subLabels = theme.subCategoryLabels || {};
      setSubCategoryLabels({
        foreplay: {
          titleSk: subLabels.foreplay?.titleSk || '',
          titleEn: subLabels.foreplay?.titleEn || '',
          descSk: subLabels.foreplay?.descSk || '',
          descEn: subLabels.foreplay?.descEn || '',
        },
        mainAction: {
          titleSk: subLabels.mainAction?.titleSk || '',
          titleEn: subLabels.mainAction?.titleEn || '',
          descSk: subLabels.mainAction?.descSk || '',
          descEn: subLabels.mainAction?.descEn || '',
        },
        deluxeFetish: {
          titleSk: subLabels.deluxeFetish?.titleSk || '',
          titleEn: subLabels.deluxeFetish?.titleEn || '',
          descSk: subLabels.deluxeFetish?.descSk || '',
          descEn: subLabels.deluxeFetish?.descEn || '',
        },
        premiumSins: {
          titleSk: subLabels.premiumSins?.titleSk || '',
          titleEn: subLabels.premiumSins?.titleEn || '',
          descSk: subLabels.premiumSins?.descSk || '',
          descEn: subLabels.premiumSins?.descEn || '',
        },
        stangle: {
          titleSk: subLabels.stangle?.titleSk || '',
          titleEn: subLabels.stangle?.titleEn || '',
          descSk: subLabels.stangle?.descSk || '',
          descEn: subLabels.stangle?.descEn || '',
        },
        soups: {
          titleSk: subLabels.soups?.titleSk || '',
          titleEn: subLabels.soups?.titleEn || '',
          descSk: subLabels.soups?.descSk || '',
          descEn: subLabels.soups?.descEn || '',
        },
        drinks: {
          titleSk: subLabels.drinks?.titleSk || '',
          titleEn: subLabels.drinks?.titleEn || '',
          descSk: subLabels.drinks?.descSk || '',
          descEn: subLabels.drinks?.descEn || '',
        },
        desserts: {
          titleSk: subLabels.desserts?.titleSk || '',
          titleEn: subLabels.desserts?.titleEn || '',
          descSk: subLabels.desserts?.descSk || '',
          descEn: subLabels.desserts?.descEn || '',
        },
      });
      
      // Load Wolt/Delivery settings
      setWoltApiKey(woltConfig.apiKey || '');
      setPickupStreet(pickupAddress.street || '');
      setPickupCity(pickupAddress.city || '');
      setPickupPostalCode(pickupAddress.postalCode || '');
      setPickupCountry(pickupAddress.country || 'SK');
      setPickupLat(pickupAddress.coordinates?.lat?.toString() || '');
      setPickupLng(pickupAddress.coordinates?.lng?.toString() || '');
      setPickupPhone(pickupAddress.phone || '');
      setPickupInstructions(pickupAddress.instructions || '');
      // Email / SMTP
      setFromEmail(emailConfig.fromEmail || '');
      setSmtpHost(emailConfig.smtpHost || emailConfig.host || '');
      setSmtpPort(
        emailConfig.smtpPort?.toString() ||
        emailConfig.port?.toString() ||
        '587'
      );
      setSmtpUser(emailConfig.smtpUser || emailConfig.user || '');
      setSmtpPassword(''); // never prefill passwords
      setSmtpSecure(
        emailConfig.smtpSecure === true ||
        emailConfig.smtpSecure === 'true' ||
        emailConfig.secure === true ||
        emailConfig.secure === 'true'
      );
      
      // Load analytics config
      const analytics = theme.analyticsConfig || {};
      setAnalyticsConfig({
        googleAnalytics: {
          measurementId: analytics.googleAnalytics?.measurementId || '',
          enabled: analytics.googleAnalytics?.enabled || false,
        },
        facebookPixel: {
          pixelId: analytics.facebookPixel?.pixelId || '',
          enabled: analytics.facebookPixel?.enabled || false,
        },
        googleTagManager: {
          containerId: analytics.googleTagManager?.containerId || '',
          enabled: analytics.googleTagManager?.enabled || false,
        },
      });
      
      setError(null);
    }
  }, [tenant]);

  if (!isOpen || !tenant) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Get existing paymentConfig to preserve other properties
      const existingPaymentConfig = (tenant.paymentConfig as any) || {};
      const existingDeliveryConfig = (tenant.deliveryConfig as any) || {};
      
      // Build deliveryConfig with Wolt settings
      const deliveryConfig: any = {
        ...existingDeliveryConfig,
      };
      
      // Add Wolt config if API key is provided
      if (woltApiKey.trim()) {
        deliveryConfig.woltConfig = {
          ...(existingDeliveryConfig.woltConfig || {}),
          apiKey: woltApiKey.trim(),
        };
      }
      
      // Validate and add pickup address if required fields are present (even without API key)
      if (pickupStreet.trim() && pickupCity.trim() && pickupPostalCode.trim() && pickupCountry.trim() && pickupLat.trim() && pickupLng.trim()) {
        const lat = parseFloat(pickupLat);
        const lng = parseFloat(pickupLng);
        
        if (!isNaN(lat) && !isNaN(lng)) {
          deliveryConfig.pickupAddress = {
            street: pickupStreet.trim(),
            city: pickupCity.trim(),
            postalCode: pickupPostalCode.trim(),
            country: pickupCountry.trim(),
            coordinates: {
              lat: lat,
              lng: lng,
            },
            phone: pickupPhone.trim() || undefined,
            instructions: pickupInstructions.trim() || undefined,
          };
        } else {
          throw new Error('GPS súradnice musia byť platné čísla');
        }
      }
      
      // Build paymentConfig with GoPay credentials
      const paymentConfig: any = {
        ...existingPaymentConfig,
        cashOnDeliveryEnabled: cashEnabled,
        cardOnDeliveryEnabled: cardEnabled,
      };
      
      // Add GoPay credentials if provided
      if (gopayClientId.trim() || gopayClientSecret.trim() || gopayGoId.trim()) {
        paymentConfig.clientId = gopayClientId.trim() || undefined;
        paymentConfig.clientSecret = gopayClientSecret.trim() || undefined;
        paymentConfig.goId = gopayGoId.trim() || undefined;
        paymentConfig.environment = gopayEnvironment || 'sandbox';
      }
      
      const updateData: any = {
        isActive: formData.isActive,
        paymentConfig: paymentConfig,
      };
      const hasEmailConfig =
        fromEmail.trim() ||
        smtpHost.trim() ||
        smtpPort.trim() ||
        smtpUser.trim() ||
        smtpPassword.trim() ||
        smtpSecure;

      if (hasEmailConfig) {
        updateData.emailConfig = {
          fromEmail: fromEmail.trim() || undefined,
          smtpHost: smtpHost.trim() || undefined,
          smtpPort: smtpPort.trim() ? parseInt(smtpPort, 10) : undefined,
          smtpUser: smtpUser.trim() || undefined,
          smtpPassword: smtpPassword.trim() || undefined,
          smtpSecure,
        };
      }

      // Only include deliveryConfig if it has content
      if (Object.keys(deliveryConfig).length > 0 || Object.keys(existingDeliveryConfig).length > 0) {
        updateData.deliveryConfig = deliveryConfig;
      }
      
      // Update theme with analytics config
      const existingTheme = (tenant.theme as any) || {};
      const updatedTheme: any = {
        ...existingTheme,
        primaryColor: themeColors.primaryColor.trim() || existingTheme.primaryColor,
        secondaryColor: themeColors.secondaryColor.trim() || existingTheme.secondaryColor,
        favicon: faviconUrl.trim() || existingTheme.favicon || '/favicon.ico',
        subCategoryLabels,
        analyticsConfig: {
          googleAnalytics: analyticsConfig.googleAnalytics.enabled && analyticsConfig.googleAnalytics.measurementId
            ? { measurementId: analyticsConfig.googleAnalytics.measurementId, enabled: true }
            : undefined,
          facebookPixel: analyticsConfig.facebookPixel.enabled && analyticsConfig.facebookPixel.pixelId
            ? { pixelId: analyticsConfig.facebookPixel.pixelId, enabled: true }
            : undefined,
          googleTagManager: analyticsConfig.googleTagManager.enabled && analyticsConfig.googleTagManager.containerId
            ? { containerId: analyticsConfig.googleTagManager.containerId, enabled: true }
            : undefined,
        },
        googleOAuthConfig: googleOAuthConfig.enabled && googleOAuthConfig.clientId && googleOAuthConfig.clientSecret
          ? {
              clientId: googleOAuthConfig.clientId.trim(),
              clientSecret: googleOAuthConfig.clientSecret.trim(),
              redirectUri: googleOAuthConfig.redirectUri.trim() || existingTheme.googleOAuthConfig?.redirectUri,
              enabled: true,
            }
          : undefined,
      };
      
      // Remove undefined values
      Object.keys(updatedTheme.analyticsConfig).forEach(key => {
        if (updatedTheme.analyticsConfig[key] === undefined) {
          delete updatedTheme.analyticsConfig[key];
        }
      });
      if (!updatedTheme.googleOAuthConfig) {
        delete updatedTheme.googleOAuthConfig;
      }
      
      updateData.theme = updatedTheme;

      await updateTenant(tenant.subdomain || tenant.slug, updateData);

      alert('Nastavenia boli úspešne uložené!');
      onUpdate();
      onClose();
    } catch (err: any) {
      console.error('[EditBrandModal] Failed to update brand:', err);
      setError(err.message || 'Nepodarilo sa uložiť nastavenia. Skúste to znova.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        {/* Background overlay */}
        <div 
          className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75"
          onClick={onClose}
        />

        {/* Modal panel */}
        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
          <form onSubmit={handleSubmit}>
            <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">Edit Brand</h3>
                <button
                  type="button"
                  onClick={onClose}
                  className="text-gray-400 hover:text-gray-500"
                >
                  <span className="sr-only">Close</span>
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              )}

              <div className="space-y-4 max-h-[70vh] overflow-y-auto">
                {/* Brand Name (read-only) */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Brand Name
                  </label>
                  <div className="text-gray-900 font-medium">
                    {formData.name}
                  </div>
                </div>

                {/* Subdomain (read-only) */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Subdomain
                  </label>
                  <div className="text-gray-900 font-medium">
                    {formData.subdomain}
                  </div>
                </div>

                {/* Custom Domain (read-only) */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Custom Domain
                  </label>
                  <div className="text-gray-900 font-medium">
                    {formData.domain || <span className="text-gray-400 italic">Not configured</span>}
                  </div>
                </div>

                {/* Theme Colors */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Theme Colors
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="flex items-center gap-3">
                      <input
                        type="color"
                        value={themeColors.primaryColor}
                        onChange={(e) => setThemeColors({ ...themeColors, primaryColor: e.target.value })}
                        className="h-10 w-12 rounded border border-gray-200"
                        aria-label="Primary color"
                      />
                      <input
                        type="text"
                        value={themeColors.primaryColor}
                        onChange={(e) => setThemeColors({ ...themeColors, primaryColor: e.target.value })}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
                        placeholder="#E91E63"
                      />
                    </div>
                    <div className="flex items-center gap-3">
                      <input
                        type="color"
                        value={themeColors.secondaryColor}
                        onChange={(e) => setThemeColors({ ...themeColors, secondaryColor: e.target.value })}
                        className="h-10 w-12 rounded border border-gray-200"
                        aria-label="Secondary color"
                      />
                      <input
                        type="text"
                        value={themeColors.secondaryColor}
                        onChange={(e) => setThemeColors({ ...themeColors, secondaryColor: e.target.value })}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
                        placeholder="#0F141A"
                      />
                    </div>
                  </div>
                </div>

                {/* Pizza Sub-category Labels */}
                <div className="border-t pt-4 mt-4">
                  <h4 className="text-md font-semibold mb-3 text-gray-900">
                    🍕 Názvy sekcií pizze
                  </h4>
                  <p className="text-sm text-gray-600 mb-4">
                    Uprav názvy a popisy podkategórií (Predohra, Hlavná akcia, Deluxe Fetish, Premium Sins) pre tento tenant. Nechané prázdne = použije sa predvolený preklad.
                  </p>
                  {([
                    { key: 'foreplay', label: 'Predohra' },
                    { key: 'mainAction', label: 'Hlavná akcia' },
                    { key: 'deluxeFetish', label: 'Deluxe Fetish' },
                    { key: 'premiumSins', label: 'Premium Sins' },
                  ] as const).map(({ key, label }) => (
                    <div key={key} className="mb-4 p-3 border border-gray-200 rounded-md space-y-2">
                      <div className="text-sm font-semibold text-gray-800">{label}</div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <input
                          type="text"
                          placeholder="Názov (SK)"
                          value={subCategoryLabels[key].titleSk}
                          onChange={(e) => setSubCategoryLabels({
                            ...subCategoryLabels,
                            [key]: { ...subCategoryLabels[key], titleSk: e.target.value },
                          })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
                        />
                        <input
                          type="text"
                          placeholder="Name (EN)"
                          value={subCategoryLabels[key].titleEn}
                          onChange={(e) => setSubCategoryLabels({
                            ...subCategoryLabels,
                            [key]: { ...subCategoryLabels[key], titleEn: e.target.value },
                          })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
                        />
                        <input
                          type="text"
                          placeholder="Popis (SK)"
                          value={subCategoryLabels[key].descSk}
                          onChange={(e) => setSubCategoryLabels({
                            ...subCategoryLabels,
                            [key]: { ...subCategoryLabels[key], descSk: e.target.value },
                          })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500 sm:col-span-2"
                        />
                        <input
                          type="text"
                          placeholder="Description (EN)"
                          value={subCategoryLabels[key].descEn}
                          onChange={(e) => setSubCategoryLabels({
                            ...subCategoryLabels,
                            [key]: { ...subCategoryLabels[key], descEn: e.target.value },
                          })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500 sm:col-span-2"
                        />
                      </div>
                    </div>
                  ))}
                </div>

                {/* Other Category Labels */}
                <div className="border-t pt-4 mt-4">
                  <h4 className="text-md font-semibold mb-3 text-gray-900">
                    📂 Názvy sekcií ostatných kategórií
                  </h4>
                  <p className="text-sm text-gray-600 mb-4">
                    Uprav názvy a popisy pre Štangle, Polievky, Nápoje a Dezerty pre tento tenant.
                  </p>
                  {([
                    { key: 'stangle', label: 'Štangle & Posúch' },
                    { key: 'soups', label: 'Polievky' },
                    { key: 'drinks', label: 'Nápoje' },
                    { key: 'desserts', label: 'Dezerty' },
                  ] as const).map(({ key, label }) => (
                    <div key={key} className="mb-4 p-3 border border-gray-200 rounded-md space-y-2">
                      <div className="text-sm font-semibold text-gray-800">{label}</div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <input
                          type="text"
                          placeholder="Názov (SK)"
                          value={subCategoryLabels[key].titleSk}
                          onChange={(e) => setSubCategoryLabels({
                            ...subCategoryLabels,
                            [key]: { ...subCategoryLabels[key], titleSk: e.target.value },
                          })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
                        />
                        <input
                          type="text"
                          placeholder="Name (EN)"
                          value={subCategoryLabels[key].titleEn}
                          onChange={(e) => setSubCategoryLabels({
                            ...subCategoryLabels,
                            [key]: { ...subCategoryLabels[key], titleEn: e.target.value },
                          })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
                        />
                        <input
                          type="text"
                          placeholder="Popis (SK)"
                          value={subCategoryLabels[key].descSk}
                          onChange={(e) => setSubCategoryLabels({
                            ...subCategoryLabels,
                            [key]: { ...subCategoryLabels[key], descSk: e.target.value },
                          })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500 sm:col-span-2"
                        />
                        <input
                          type="text"
                          placeholder="Description (EN)"
                          value={subCategoryLabels[key].descEn}
                          onChange={(e) => setSubCategoryLabels({
                            ...subCategoryLabels,
                            [key]: { ...subCategoryLabels[key], descEn: e.target.value },
                          })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500 sm:col-span-2"
                        />
                      </div>
                    </div>
                  ))}
                </div>

                {/* Google OAuth Settings */}
                <div className="border-t pt-4 mt-4">
                  <h4 className="text-md font-semibold mb-3 text-gray-900 flex items-center gap-2">
                    <span role="img" aria-label="lock">🔐</span> Google OAuth
                  </h4>
                  <p className="text-sm text-gray-600 mb-4">
                    Nastav prihlásenie cez Google pre tento tenant. Každý tenant môže mať vlastné Client ID / Secret / Redirect URI.
                  </p>
                  <div className="p-3 border border-gray-200 rounded-md space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-medium text-gray-700">
                        Google OAuth povolené
                      </label>
                      <button
                        type="button"
                        onClick={() => setGoogleOAuthConfig({ ...googleOAuthConfig, enabled: !googleOAuthConfig.enabled })}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                          googleOAuthConfig.enabled ? 'bg-green-600' : 'bg-gray-300'
                        }`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                            googleOAuthConfig.enabled ? 'translate-x-6' : 'translate-x-1'
                          }`}
                        />
                      </button>
                    </div>

                    {googleOAuthConfig.enabled && (
                      <div className="space-y-3">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Client ID</label>
                          <input
                            type="text"
                            value={googleOAuthConfig.clientId}
                            onChange={(e) => setGoogleOAuthConfig({ ...googleOAuthConfig, clientId: e.target.value })}
                            placeholder="Google OAuth Client ID"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Client Secret</label>
                          <input
                            type="password"
                            value={googleOAuthConfig.clientSecret}
                            onChange={(e) => setGoogleOAuthConfig({ ...googleOAuthConfig, clientSecret: e.target.value })}
                            placeholder="Google OAuth Client Secret"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Redirect URI</label>
                          <input
                            type="text"
                            value={googleOAuthConfig.redirectUri}
                            onChange={(e) => setGoogleOAuthConfig({ ...googleOAuthConfig, redirectUri: e.target.value })}
                            placeholder="https://your-domain.com/api/auth/google/callback"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-sm"
                          />
                          <p className="text-xs text-gray-500 mt-1">
                            Zadaj rovnakú URL aj v Google Cloud Console pre tento tenant.
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Active Status */}
                <div className="flex items-center pt-2">
                  <input
                    type="checkbox"
                    id="isActive"
                    checked={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="isActive" className="ml-2 block text-sm text-gray-900">
                    Active (brand is visible to customers)
                  </label>
                </div>

                {/* Payment Settings */}
                <div className="border-t pt-4 mt-4">
                  <h4 className="text-md font-semibold mb-3 text-gray-900">
                    Payment on Delivery Settings
                  </h4>
                  <p className="text-sm text-gray-600 mb-4">
                    Control payment methods available for cash on delivery orders.
                  </p>
                  
                  <div className="space-y-4">
                    {/* Cash Payment Toggle */}
                    <div className="flex items-center justify-between">
                      <div>
                        <label className="text-sm font-medium text-gray-700">
                          Cash Payment
                        </label>
                        <p className="text-xs text-gray-500">
                          Allow customers to pay with cash on delivery
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setCashEnabled(!cashEnabled)}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                          cashEnabled ? 'bg-green-600' : 'bg-gray-300'
                        }`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                            cashEnabled ? 'translate-x-6' : 'translate-x-1'
                          }`}
                        />
                      </button>
                    </div>
                    
                    {/* Card Payment Toggle */}
                    <div className="flex items-center justify-between">
                      <div>
                        <label className="text-sm font-medium text-gray-700">
                          Card Payment (via Courier Terminal)
                        </label>
                        <p className="text-xs text-gray-500">
                          Allow customers to pay with card via courier&apos;s terminal
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setCardEnabled(!cardEnabled)}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                          cardEnabled ? 'bg-green-600' : 'bg-gray-300'
                        }`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                            cardEnabled ? 'translate-x-6' : 'translate-x-1'
                          }`}
                        />
                      </button>
                    </div>
                  </div>
                </div>

                {/* GoPay Settings */}
                <div className="border-t pt-4 mt-4">
                  <h4 className="text-md font-semibold mb-3 text-gray-900">
                    💳 GoPay Settings
                  </h4>
                  <p className="text-sm text-gray-600 mb-4">
                    Konfigurácia GoPay credentials pre online platby kartou.
                  </p>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        GoPay Client ID
                      </label>
                      <input
                        type="text"
                        value={gopayClientId}
                        onChange={(e) => setGopayClientId(e.target.value)}
                        placeholder="Client ID z GoPay dashboardu"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                      />
                      <p className="mt-1 text-xs text-gray-500">
                        Client ID z GoPay administrácie
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        GoPay Client Secret
                      </label>
                      <input
                        type="password"
                        value={gopayClientSecret}
                        onChange={(e) => setGopayClientSecret(e.target.value)}
                        placeholder="Client Secret z GoPay dashboardu"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                      />
                      <p className="mt-1 text-xs text-gray-500">
                        Client Secret z GoPay administrácie
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        GoPay GoID
                      </label>
                      <input
                        type="text"
                        value={gopayGoId}
                        onChange={(e) => setGopayGoId(e.target.value)}
                        placeholder="GoID z GoPay dashboardu"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                      />
                      <p className="mt-1 text-xs text-gray-500">
                        GoID identifikátor z GoPay administrácie
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        GoPay Environment
                      </label>
                      <select
                        value={gopayEnvironment}
                        onChange={(e) => setGopayEnvironment(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="sandbox">Sandbox (testovacie prostredie)</option>
                        <option value="production">Production (produkčné prostredie)</option>
                      </select>
                      <p className="mt-1 text-xs text-gray-500">
                        Vyberte prostredie: Sandbox pre testovanie, Production pre skutočné platby
                      </p>
                    </div>
                  </div>
                </div>

                {/* Wolt Delivery Settings */}
                <div className="border-t pt-4 mt-4">
                  <h4 className="text-md font-semibold mb-3 text-gray-900">
                    🚚 Wolt Delivery Settings
                  </h4>
                  <p className="text-sm text-gray-600 mb-4">
                    Konfigurácia Wolt API a adresy kuchyne pre doručovanie.
                  </p>
                  
                  <div className="space-y-4">
                    {/* Wolt API Key */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Wolt API Kľúč <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="password"
                        value={woltApiKey}
                        onChange={(e) => setWoltApiKey(e.target.value)}
                        placeholder="wolt_api_key_..."
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                      />
                      <p className="mt-1 text-xs text-gray-500">
                        API kľúč z Wolt Drive dashboardu
                      </p>
                    </div>

                    {/* Pickup Address Section */}
                    <div className="border-t pt-4">
                      <h5 className="text-sm font-semibold text-gray-700 mb-3">
                        📍 Adresa Kuchyne (Pickup Address)
                      </h5>
                      
                      <div className="grid grid-cols-2 gap-3">
                        <div className="col-span-2">
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Ulica <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="text"
                            value={pickupStreet}
                            onChange={(e) => setPickupStreet(e.target.value)}
                            placeholder="Hlavná 123"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Mesto <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="text"
                            value={pickupCity}
                            onChange={(e) => setPickupCity(e.target.value)}
                            placeholder="Bratislava"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            PSČ <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="text"
                            value={pickupPostalCode}
                            onChange={(e) => setPickupPostalCode(e.target.value)}
                            placeholder="81101"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Krajina <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="text"
                            value={pickupCountry}
                            onChange={(e) => setPickupCountry(e.target.value)}
                            placeholder="SK"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            GPS Lat <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="number"
                            step="any"
                            value={pickupLat}
                            onChange={(e) => setPickupLat(e.target.value)}
                            placeholder="48.1486"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            GPS Lng <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="number"
                            step="any"
                            value={pickupLng}
                            onChange={(e) => setPickupLng(e.target.value)}
                            placeholder="17.1077"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                          />
                        </div>
                        
                        <div className="col-span-2">
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Telefón Kuchyne
                          </label>
                          <input
                            type="text"
                            value={pickupPhone}
                            onChange={(e) => setPickupPhone(e.target.value)}
                            placeholder="+421900000000"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                          />
                          <p className="mt-1 text-xs text-gray-500">
                            Telefón pre kontakt s kuchyňou (voliteľné, ale odporúčané)
                          </p>
                        </div>
                        
                        <div className="col-span-2">
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Inštrukcie pre kuriéra
                          </label>
                          <textarea
                            value={pickupInstructions}
                            onChange={(e) => setPickupInstructions(e.target.value)}
                            placeholder="Napríklad: Vchod z ulice, 2. poschodie..."
                            rows={2}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                          />
                          <p className="mt-1 text-xs text-gray-500">
                            Voliteľné inštrukcie pre kuriéra pri vyzdvihnutí
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Email / SMTP Settings */}
                <div className="border-t pt-4 mt-4">
                  <h4 className="text-md font-semibold mb-3 text-gray-900">
                    📧 Email & SMTP
                  </h4>
                  <p className="text-sm text-gray-600 mb-4">
                    Nastav odosielateľa a SMTP server pre tento brand (prepíše globálne env). Nechaj prázdne, ak chceš použiť globálne nastavenia.
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="sm:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">From email</label>
                      <input
                        type="email"
                        value={fromEmail}
                        onChange={(e) => setFromEmail(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                        placeholder="orders@brand.sk"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">SMTP host</label>
                      <input
                        type="text"
                        value={smtpHost}
                        onChange={(e) => setSmtpHost(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                        placeholder="smtp.brand.sk"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">SMTP port</label>
                      <input
                        type="number"
                        value={smtpPort}
                        onChange={(e) => setSmtpPort(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                        placeholder="587"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">SMTP user</label>
                      <input
                        type="text"
                        value={smtpUser}
                        onChange={(e) => setSmtpUser(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                        placeholder="orders@brand.sk"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">SMTP password</label>
                      <input
                        type="password"
                        value={smtpPassword}
                        onChange={(e) => setSmtpPassword(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                        placeholder="••••••••"
                      />
                      <p className="text-xs text-gray-500 mt-1">Nechaj prázdne, ak nechceš zmeniť.</p>
                    </div>
                    <div className="flex items-center gap-2 sm:col-span-2">
                      <input
                        id="smtpSecure"
                        type="checkbox"
                        checked={smtpSecure}
                        onChange={(e) => setSmtpSecure(e.target.checked)}
                        className="h-4 w-4 text-blue-600 border-gray-300 rounded"
                      />
                      <label htmlFor="smtpSecure" className="text-sm text-gray-700">
                        Secure (SSL/TLS)
                      </label>
                    </div>
                  </div>
                </div>

                {/* Analytics & Tracking */}
                <div className="border-t pt-4 mt-4">
                  <h4 className="text-md font-semibold mb-3 text-gray-900">
                    📊 Analytics & Tracking
                  </h4>
                  <p className="text-sm text-gray-600 mb-4">
                    Configure tracking scripts for this brand. Each service can be enabled/disabled independently.
                  </p>
                  
                  <div className="space-y-4">
                    {/* Google Analytics 4 */}
                    <div className="p-3 border border-gray-200 rounded-md">
                      <div className="flex items-center justify-between mb-2">
                        <label className="text-sm font-medium text-gray-700">
                          Google Analytics 4
                        </label>
                        <button
                          type="button"
                          onClick={() => setAnalyticsConfig({
                            ...analyticsConfig,
                            googleAnalytics: { ...analyticsConfig.googleAnalytics, enabled: !analyticsConfig.googleAnalytics.enabled }
                          })}
                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                            analyticsConfig.googleAnalytics.enabled ? 'bg-green-600' : 'bg-gray-300'
                          }`}
                        >
                          <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                              analyticsConfig.googleAnalytics.enabled ? 'translate-x-6' : 'translate-x-1'
                            }`}
                          />
                        </button>
                      </div>
                      {analyticsConfig.googleAnalytics.enabled && (
                        <input
                          type="text"
                          value={analyticsConfig.googleAnalytics.measurementId}
                          onChange={(e) => setAnalyticsConfig({
                            ...analyticsConfig,
                            googleAnalytics: { ...analyticsConfig.googleAnalytics, measurementId: e.target.value }
                          })}
                          placeholder="G-XXXXXXXXXX"
                          className="w-full px-3 py-2 mt-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-sm"
                        />
                      )}
                      <p className="text-xs text-gray-500 mt-1">
                        Measurement ID from GA4 (format: G-XXXXXXXXXX)
                      </p>
                    </div>

                    {/* Facebook Pixel */}
                    <div className="p-3 border border-gray-200 rounded-md">
                      <div className="flex items-center justify-between mb-2">
                        <label className="text-sm font-medium text-gray-700">
                          Facebook Pixel
                        </label>
                        <button
                          type="button"
                          onClick={() => setAnalyticsConfig({
                            ...analyticsConfig,
                            facebookPixel: { ...analyticsConfig.facebookPixel, enabled: !analyticsConfig.facebookPixel.enabled }
                          })}
                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                            analyticsConfig.facebookPixel.enabled ? 'bg-green-600' : 'bg-gray-300'
                          }`}
                        >
                          <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                              analyticsConfig.facebookPixel.enabled ? 'translate-x-6' : 'translate-x-1'
                            }`}
                          />
                        </button>
                      </div>
                      {analyticsConfig.facebookPixel.enabled && (
                        <input
                          type="text"
                          value={analyticsConfig.facebookPixel.pixelId}
                          onChange={(e) => setAnalyticsConfig({
                            ...analyticsConfig,
                            facebookPixel: { ...analyticsConfig.facebookPixel, pixelId: e.target.value }
                          })}
                          placeholder="123456789012345"
                          className="w-full px-3 py-2 mt-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-sm"
                        />
                      )}
                      <p className="text-xs text-gray-500 mt-1">
                        Pixel ID from Facebook Events Manager
                      </p>
                    </div>

                    {/* Google Tag Manager */}
                    <div className="p-3 border border-gray-200 rounded-md">
                      <div className="flex items-center justify-between mb-2">
                        <label className="text-sm font-medium text-gray-700">
                          Google Tag Manager
                        </label>
                        <button
                          type="button"
                          onClick={() => setAnalyticsConfig({
                            ...analyticsConfig,
                            googleTagManager: { ...analyticsConfig.googleTagManager, enabled: !analyticsConfig.googleTagManager.enabled }
                          })}
                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                            analyticsConfig.googleTagManager.enabled ? 'bg-green-600' : 'bg-gray-300'
                          }`}
                        >
                          <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                              analyticsConfig.googleTagManager.enabled ? 'translate-x-6' : 'translate-x-1'
                            }`}
                          />
                        </button>
                      </div>
                      {analyticsConfig.googleTagManager.enabled && (
                        <input
                          type="text"
                          value={analyticsConfig.googleTagManager.containerId}
                          onChange={(e) => setAnalyticsConfig({
                            ...analyticsConfig,
                            googleTagManager: { ...analyticsConfig.googleTagManager, containerId: e.target.value }
                          })}
                          placeholder="GTM-XXXXXXX"
                          className="w-full px-3 py-2 mt-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-sm"
                        />
                      )}
                      <p className="text-xs text-gray-500 mt-1">
                        Container ID from GTM (format: GTM-XXXXXXX)
                      </p>
                    </div>

                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
              <button
                type="submit"
                disabled={loading}
                className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Saving...' : 'Save Changes'}
              </button>
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
