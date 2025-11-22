'use client';

import { useState, useEffect } from 'react';
import { getTenant, updateTenant } from '@/lib/api';
import { Tenant } from '@pizza-ecosystem/shared';

// OpeningHours type - defined locally since it's not exported from shared
interface OpeningHours {
  enabled: boolean;
  timezone?: string;
  days: {
    [key: string]: {
      open: string;
      close: string;
      closed?: boolean;
    };
  };
}
import { getDefaultOpeningHours } from '@/lib/opening-hours';

export function OpeningHoursSettings() {
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [openingHours, setOpeningHours] = useState<OpeningHours>(getDefaultOpeningHours());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const days = [
    { key: 'monday', label: 'Pondelok' },
    { key: 'tuesday', label: 'Utorok' },
    { key: 'wednesday', label: 'Streda' },
    { key: 'thursday', label: 'Štvrtok' },
    { key: 'friday', label: 'Piatok' },
    { key: 'saturday', label: 'Sobota' },
    { key: 'sunday', label: 'Nedeľa' },
  ];

  useEffect(() => {
    const loadTenant = async () => {
      try {
        const tenantData = await getTenant('pornopizza');
        setTenant(tenantData);
        
        const theme = typeof tenantData.theme === 'object' && tenantData.theme !== null 
          ? tenantData.theme as any
          : {};
        
        if (theme.openingHours) {
          setOpeningHours(theme.openingHours);
        }
      } catch (error) {
        console.error('Failed to load tenant:', error);
      } finally {
        setLoading(false);
      }
    };

    loadTenant();
  }, []);

  const handleSave = async () => {
    if (!tenant) return;
    
    setSaving(true);
    try {
      const theme = typeof tenant.theme === 'object' && tenant.theme !== null 
        ? tenant.theme as any
        : {};
      
      await updateTenant(tenant.subdomain || tenant.slug, {
        theme: {
          ...theme,
          openingHours,
        },
      });
      
      // Reload tenant
      const updatedTenant = await getTenant('pornopizza');
      setTenant(updatedTenant);
      
      alert('Otváracie hodiny uložené!');
    } catch (error: any) {
      console.error('Failed to save opening hours:', error);
      alert('Nepodarilo sa uložiť otváracie hodiny: ' + (error.message || 'Unknown error'));
    } finally {
      setSaving(false);
    }
  };

  const handleDayChange = (dayKey: string, field: 'open' | 'close' | 'closed', value: string | boolean) => {
    setOpeningHours(prev => ({
      ...prev,
      days: {
        ...prev.days,
        [dayKey]: {
          ...prev.days[dayKey],
          [field]: value,
        },
      },
    }));
  };

  const handleToggleEnabled = () => {
    setOpeningHours(prev => ({
      ...prev,
      enabled: !prev.enabled,
    }));
  };

  if (loading) {
    return (
      <div className="bg-gray-100 rounded-lg p-6 mb-6 animate-pulse">
        <div className="h-8 bg-gray-300 rounded w-1/3 mb-2"></div>
        <div className="h-4 bg-gray-300 rounded w-1/2"></div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg p-6 mb-6 border border-gray-200">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">
            Otváracie hodiny
          </h2>
          <p className="text-sm text-gray-600">
            Nastavte otváracie hodiny pre automatické zapínanie/vypínanie maintenance mode
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className={`text-sm font-medium ${openingHours.enabled ? 'text-green-600' : 'text-gray-500'}`}>
            {openingHours.enabled ? 'Zapnuté' : 'Vypnuté'}
          </span>
          <button
            onClick={handleToggleEnabled}
            className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 ${
              openingHours.enabled ? 'bg-green-600' : 'bg-gray-200'
            }`}
          >
            <span
              className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                openingHours.enabled ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>
      </div>

      {openingHours.enabled && (
        <div className="space-y-4">
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Časové pásmo
            </label>
            <select
              value={openingHours.timezone || 'Europe/Bratislava'}
              onChange={(e) => setOpeningHours(prev => ({ ...prev, timezone: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="Europe/Bratislava">Europe/Bratislava (SK)</option>
              <option value="Europe/Prague">Europe/Prague (CZ)</option>
              <option value="UTC">UTC</option>
            </select>
          </div>

          <div className="space-y-3">
            {days.map((day) => {
              const daySchedule = openingHours.days[day.key];
              const isClosed = daySchedule?.closed;

              return (
                <div key={day.key} className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
                  <div className="w-24 text-sm font-medium text-gray-700">
                    {day.label}
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={isClosed || false}
                      onChange={(e) => handleDayChange(day.key, 'closed', e.target.checked)}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <span className="text-sm text-gray-600">Zatvorené</span>
                  </div>

                  {!isClosed && (
                    <>
                      <input
                        type="time"
                        value={daySchedule?.open || '10:00'}
                        onChange={(e) => handleDayChange(day.key, 'open', e.target.value)}
                        className="px-3 py-1.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                      />
                      <span className="text-gray-500">-</span>
                      <input
                        type="time"
                        value={daySchedule?.close || '22:00'}
                        onChange={(e) => handleDayChange(day.key, 'close', e.target.value)}
                        className="px-3 py-1.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                      />
                    </>
                  )}
                </div>
              );
            })}
          </div>

          <div className="pt-4 border-t">
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
            >
              {saving ? 'Ukladám...' : 'Uložiť otváracie hodiny'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

