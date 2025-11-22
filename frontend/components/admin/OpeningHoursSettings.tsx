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
  const [isExpanded, setIsExpanded] = useState(false);

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
      <div className="bg-gray-100 rounded-lg p-3 animate-pulse">
        <div className="h-6 bg-gray-300 rounded w-1/3 mb-2"></div>
        <div className="h-4 bg-gray-300 rounded w-1/2"></div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg p-3 border border-gray-200">
      <div className="flex items-center justify-between">
        <div className="flex-1 min-w-0">
          <h2 className="text-sm font-bold text-gray-900 mb-1">
            Otváracie hodiny
          </h2>
          <p className="text-xs text-gray-600 truncate">
            Automatické zap./vyp. maintenance mode
          </p>
        </div>
        <div className="ml-3 flex items-center gap-2 flex-shrink-0">
          <span className={`text-xs font-medium ${openingHours.enabled ? 'text-green-600' : 'text-gray-500'}`}>
            {openingHours.enabled ? 'Zap.' : 'Vyp.'}
          </span>
          <button
            onClick={handleToggleEnabled}
            className={`relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-1 ${
              openingHours.enabled ? 'bg-green-600' : 'bg-gray-200'
            }`}
          >
            <span
              className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                openingHours.enabled ? 'translate-x-4' : 'translate-x-0'
              }`}
            />
          </button>
          {openingHours.enabled && (
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="ml-1 text-xs text-blue-600 hover:text-blue-700 font-medium"
            >
              {isExpanded ? '▼' : '▶'}
            </button>
          )}
        </div>
      </div>

      {openingHours.enabled && isExpanded && (
        <div className="mt-3 pt-3 border-t border-gray-200 space-y-3 max-h-96 overflow-y-auto">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Časové pásmo
            </label>
            <select
              value={openingHours.timezone || 'Europe/Bratislava'}
              onChange={(e) => setOpeningHours(prev => ({ ...prev, timezone: e.target.value }))}
              className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="Europe/Bratislava">Europe/Bratislava (SK)</option>
              <option value="Europe/Prague">Europe/Prague (CZ)</option>
              <option value="UTC">UTC</option>
            </select>
          </div>

          <div className="space-y-2">
            {days.map((day) => {
              const daySchedule = openingHours.days[day.key];
              const isClosed = daySchedule?.closed;

              return (
                <div key={day.key} className="flex items-center gap-2 p-2 bg-gray-50 rounded text-xs">
                  <div className="w-20 font-medium text-gray-700">
                    {day.label.substring(0, 3)}
                  </div>
                  
                  <div className="flex items-center gap-1.5">
                    <input
                      type="checkbox"
                      checked={isClosed || false}
                      onChange={(e) => handleDayChange(day.key, 'closed', e.target.checked)}
                      className="h-3.5 w-3.5 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <span className="text-xs text-gray-600">Zatv.</span>
                  </div>

                  {!isClosed && (
                    <>
                      <input
                        type="time"
                        value={daySchedule?.open || '10:00'}
                        onChange={(e) => handleDayChange(day.key, 'open', e.target.value)}
                        className="px-2 py-1 text-xs border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 w-20"
                      />
                      <span className="text-gray-400">-</span>
                      <input
                        type="time"
                        value={daySchedule?.close || '22:00'}
                        onChange={(e) => handleDayChange(day.key, 'close', e.target.value)}
                        className="px-2 py-1 text-xs border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 w-20"
                      />
                    </>
                  )}
                </div>
              );
            })}
          </div>

          <div className="pt-2 border-t">
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-4 py-1.5 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              {saving ? 'Ukladám...' : 'Uložiť'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

