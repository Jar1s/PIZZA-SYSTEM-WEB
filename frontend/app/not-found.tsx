'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useLanguage } from '@/contexts/LanguageContext';
import { getTenant } from '@/lib/api';
import { Tenant } from '@pizza-ecosystem/shared';
import { motion } from 'framer-motion';

export default function NotFound() {
  const { t, language } = useLanguage();
  const router = useRouter();
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadTenant = async () => {
      try {
        // Get tenant slug from hostname
        const hostname = window.location.hostname;
        let tenantSlug = 'pornopizza'; // default
        
        if (hostname.includes('pornopizza')) {
          tenantSlug = 'pornopizza';
        } else if (hostname.includes('pizzavnudzi')) {
          tenantSlug = 'pizzavnudzi';
        } else if (hostname.includes('localhost')) {
          // Check for tenant query param or default
          const params = new URLSearchParams(window.location.search);
          tenantSlug = params.get('tenant') || 'pornopizza';
        }
        
        const tenantData = await getTenant(tenantSlug);
        setTenant(tenantData);
      } catch (error) {
        console.error('Failed to load tenant:', error);
        // Fallback theme
        setTenant({
          theme: {
            primaryColor: '#FF6B00',
            secondaryColor: '#000000',
            favicon: '/favicon.ico',
          }
        } as Tenant);
      } finally {
        setLoading(false);
      }
    };

    loadTenant();
  }, []);

  const primaryColor = tenant?.theme?.primaryColor || '#FF6B00';

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="bg-white rounded-2xl shadow-lg p-8 md:p-12 max-w-md w-full text-center"
      >
        {/* Magnifying Glass Icon */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
          className="flex justify-center mb-6 relative"
        >
          <svg
            width="80"
            height="80"
            viewBox="0 0 80 80"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="relative"
          >
            {/* Metallic rim/gradient effect */}
            <defs>
              <linearGradient id="metallicGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#cbd5e1" stopOpacity="1" />
                <stop offset="50%" stopColor="#e2e8f0" stopOpacity="1" />
                <stop offset="100%" stopColor="#94a3b8" stopOpacity="1" />
              </linearGradient>
              <linearGradient id="handleGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#64748b" stopOpacity="1" />
                <stop offset="100%" stopColor="#475569" stopOpacity="1" />
              </linearGradient>
            </defs>
            
            {/* Magnifying glass circle - metallic rim */}
            <circle
              cx="35"
              cy="35"
              r="20"
              stroke="url(#metallicGradient)"
              strokeWidth="3.5"
              strokeLinecap="round"
              fill="none"
            />
            
            {/* Lens area - white/transparent center */}
            <circle
              cx="35"
              cy="35"
              r="15"
              fill="white"
              opacity="0.9"
            />
            
            {/* Lens highlight */}
            <circle
              cx="30"
              cy="30"
              r="4"
              fill="white"
              opacity="0.6"
            />
            
            {/* Magnifying glass handle - darker */}
            <path
              d="M50 50 L65 65"
              stroke="url(#handleGradient)"
              strokeWidth="4"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </motion.div>

        {/* 404 Title */}
        <motion.h1
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="text-4xl md:text-5xl font-bold text-gray-900 mb-4"
        >
          {t.notFoundTitle}
        </motion.h1>

        {/* Description */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="text-gray-600 text-lg mb-8"
        >
          {t.notFoundDescription}
        </motion.p>

        {/* Back to Home Button */}
        <motion.button
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => router.push('/')}
          className="px-8 py-3 rounded-lg text-white font-semibold text-lg shadow-md hover:shadow-lg transition-all duration-200"
          style={{ backgroundColor: primaryColor }}
        >
          {t.backToHome}
        </motion.button>
      </motion.div>
    </div>
  );
}
