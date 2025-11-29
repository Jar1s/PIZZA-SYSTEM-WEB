'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useCustomerAuth } from '@/contexts/CustomerAuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { sendCustomerSmsCode } from '@/lib/api';

interface PersonalDataProps {
  tenant: string;
  isDark?: boolean;
}

export default function PersonalData({ tenant, isDark = false }: PersonalDataProps) {
  const { user, loading: authLoading, setUser } = useCustomerAuth();
  const { t } = useLanguage();
  const router = useRouter();
  const [editing, setEditing] = useState<string | null>(null);
  const [phonePrefix, setPhonePrefix] = useState('+421');
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: '',
  });

  const fetchPersonalData = useCallback(async () => {
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
      const token = localStorage.getItem('customer_auth_token');
      
      if (!token || !user) {
        return;
      }
      
      const res = await fetch(`${API_URL}/api/customer/account/profile`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (res.ok) {
        const data = await res.json();
        // Parse phone number to extract prefix and number
        const phone = data.phone || '';
        let prefix = '+421';
        let phoneNumber = phone;
        
        if (phone.startsWith('+421')) {
          prefix = '+421';
          phoneNumber = phone.replace(/^\+421/, '').trim();
        } else if (phone.startsWith('+')) {
          // Extract prefix (first 1-4 digits after +)
          const match = phone.match(/^(\+\d{1,4})/);
          if (match) {
            prefix = match[1];
            phoneNumber = phone.replace(match[1], '').trim();
          }
        }
        
        setPhonePrefix(prefix);
        setFormData({
          name: data.name || user?.name || '',
          email: data.email || user?.email || '',
          phone: phoneNumber,
        });
        
        // Update user in context and localStorage with fetched data
        if (user && setUser) {
          const updatedUser = {
            ...user,
            name: data.name || user.name,
            email: data.email || user.email,
            phone: data.phone || user.phone,
            phoneVerified: data.phoneVerified !== undefined ? data.phoneVerified : user.phoneVerified,
          };
          setUser(updatedUser);
          localStorage.setItem('customer_auth_user', JSON.stringify(updatedUser));
        }
      } else if (res.status === 401) {
        // Token expired or invalid - clear it
        localStorage.removeItem('customer_auth_token');
        localStorage.removeItem('customer_auth_refresh_token');
        localStorage.removeItem('customer_auth_user');
      } else {
        console.error('Failed to fetch personal data:', res.status, res.statusText);
      }
    } catch (error) {
      console.error('Failed to fetch personal data:', error);
    }
  }, [user, setUser]);

  useEffect(() => {
    // Wait for auth to load and user to be available before fetching profile
    if (authLoading || !user) {
      return;
    }
    fetchPersonalData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading, user?.id]);

  const handleSave = async (field: string) => {
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
      const token = localStorage.getItem('customer_auth_token');
      
      if (!token) {
        alert('Nie ste prihlásený');
        return;
      }
      
      // Combine phone prefix and number for phone field
      const valueToSend = field === 'phone' 
        ? `${phonePrefix}${formData.phone.replace(/\D/g, '')}`
        : formData[field as keyof typeof formData];
      
      const res = await fetch(`${API_URL}/api/customer/account/profile`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ [field]: valueToSend }),
      });

      if (res.ok) {
        const data = await res.json();
        setEditing(null);
        
        // Update user in context and localStorage with new data
        if (user) {
          const updatedUser = {
            ...user,
            name: data.name || user.name,
            email: data.email || user.email,
            phone: data.phone || user.phone,
            phoneVerified: data.phoneVerified !== undefined ? data.phoneVerified : user.phoneVerified,
          };
          setUser(updatedUser);
          localStorage.setItem('customer_auth_user', JSON.stringify(updatedUser));
        }
        
        // If phone was changed, send SMS code and redirect to verification
        if (field === 'phone' && data.needsVerification && user?.id) {
          try {
            // Send SMS code to new phone number
            await sendCustomerSmsCode(data.phone, user.id);
            
            // Redirect to SMS verification page
            const returnUrl = `/account?tenant=${tenant}&section=settings`;
            router.push(`/auth/verify-phone?userId=${user.id}&tenant=${tenant}&returnUrl=${encodeURIComponent(returnUrl)}`);
          } catch (smsError) {
            console.error('Failed to send SMS code:', smsError);
            alert('Telefónne číslo bolo zmenené, ale nepodarilo sa odoslať overovací kód. Prosím, skúste to znova.');
            await fetchPersonalData();
          }
        } else {
          await fetchPersonalData();
        }
      } else {
        const error = await res.json().catch(() => ({ message: 'Nepodarilo sa aktualizovať údaje' }));
        alert(error.message || 'Nepodarilo sa aktualizovať údaje');
      }
    } catch (error) {
      console.error('Failed to update personal data:', error);
      alert('Nepodarilo sa aktualizovať údaje');
    }
  };

  // Parse phone for display
  const getDisplayPhone = () => {
    if (!formData.phone) return '';
    // If phone already includes prefix, show as is
    if (formData.phone.startsWith('+')) {
      return formData.phone;
    }
    // Otherwise combine prefix and number
    return `${phonePrefix} ${formData.phone}`;
  };

  const fields = [
    {
      key: 'phone',
      label: t.phone,
      value: formData.phone || '',
      displayValue: getDisplayPhone(),
      editable: true,
    },
    {
      key: 'email',
      label: t.email,
      value: formData.email || user?.email || '',
      editable: false, // Email cannot be changed
    },
    {
      key: 'name',
      label: t.name,
      value: formData.name || user?.name || '',
      editable: true,
    },
  ];

  const mutedText = isDark ? 'text-gray-300' : 'text-gray-600';
  const inputClass = isDark
    ? 'w-full px-3 py-2 border border-white/20 bg-white/5 text-white rounded-lg focus:border-white/40 focus:outline-none placeholder:text-gray-400'
    : 'w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-orange-500';

  if (authLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-orange-600"></div>
          <p className={`mt-4 ${mutedText}`}>{t.loading}</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">{t.settingsAndPersonalData}</h2>
      <div className="space-y-4">
        {fields.map((field) => (
          <div
            key={field.key}
            className={`rounded-2xl p-4 border transition-shadow ${
              isDark ? 'bg-white/5 border-white/10 text-white' : 'border-gray-200 bg-white hover:shadow-md'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className={`font-semibold mb-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>{field.label}</div>
                {editing === field.key ? (
                  field.key === 'phone' ? (
                    <div className="flex gap-2">
                      <select
                        value={phonePrefix}
                        onChange={(e) => setPhonePrefix(e.target.value)}
                        className={isDark
                          ? 'px-3 py-2 border border-white/20 bg-white/5 text-white rounded-lg focus:border-white/40 focus:outline-none'
                          : 'px-3 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-orange-500 bg-white'}
                      >
                        <option value="+421">🇸🇰 +421</option>
                        <option value="+420">🇨🇿 +420</option>
                        <option value="+48">🇵🇱 +48</option>
                        <option value="+36">🇭🇺 +36</option>
                        <option value="+43">🇦🇹 +43</option>
                        <option value="+49">🇩🇪 +49</option>
                        <option value="+1">🇺🇸 +1</option>
                        <option value="+44">🇬🇧 +44</option>
                        <option value="+33">🇫🇷 +33</option>
                        <option value="+39">🇮🇹 +39</option>
                        <option value="+34">🇪🇸 +34</option>
                      </select>
                      <input
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value.replace(/\D/g, '') })}
                        className={`flex-1 ${inputClass}`}
                        placeholder={t.phonePlaceholder || '912345678'}
                        autoFocus
                      />
                    </div>
                  ) : (
                    <input
                      type={field.key === 'email' ? 'email' : 'text'}
                      value={formData[field.key as keyof typeof formData]}
                      onChange={(e) => setFormData({ ...formData, [field.key]: e.target.value })}
                      className={inputClass}
                      autoFocus
                    />
                  )
                ) : (
                  <div className={mutedText}>
                    {field.key === 'phone' && (field as any).displayValue
                      ? (field as any).displayValue
                      : field.value || '-'}
                  </div>
                )}
              </div>
              {editing === field.key ? (
                <div className="flex gap-2 ml-4">
                  <button
                    onClick={() => handleSave(field.key)}
                    className={`px-4 py-2 rounded-full text-sm font-semibold ${isDark ? 'bg-gradient-to-r from-[#ff5e00] via-[#ff0066] to-[#ff2d55]' : 'text-white'}`}
                    style={!isDark ? { backgroundColor: 'var(--color-primary)' } : undefined}
                  >
                    {t.save}
                  </button>
                  <button
                    onClick={() => {
                      setEditing(null);
                      fetchPersonalData();
                    }}
                    className={`px-4 py-2 rounded-full text-sm font-semibold ${
                      isDark ? 'border border-white/20 text-white hover:bg-white/10' : 'border-2 border-gray-300 text-gray-700'
                    }`}
                  >
                    {t.cancel}
                  </button>
                </div>
              ) : (
                field.editable ? (
                <svg
                  className={`w-5 h-5 ml-4 cursor-pointer ${isDark ? 'text-gray-400' : 'text-gray-400'}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                    onClick={() => setEditing(field.key)}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
                ) : (
                  <span className={`text-xs ml-4 ${mutedText}`}>
                    {t.emailCannotBeChanged || 'Email sa nedá zmeniť'}
                  </span>
                )
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
