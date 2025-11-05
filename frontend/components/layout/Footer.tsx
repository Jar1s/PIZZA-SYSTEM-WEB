'use client';

import { motion } from 'framer-motion';
import { useLanguage } from '@/contexts/LanguageContext';

interface FooterProps {
  tenantName: string;
  primaryColor: string;
}

export const Footer = ({ tenantName, primaryColor }: FooterProps) => {
  const { t } = useLanguage();
  return (
    <footer className="bg-gray-900 text-white py-12 mt-20">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div>
            <h3 className="text-2xl font-bold mb-4" style={{ color: primaryColor }}>
              {tenantName}
            </h3>
            <p className="text-gray-400">
              {t.footerTagline}
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-lg font-bold mb-4">{t.quickLinks}</h4>
            <ul className="space-y-2 text-gray-400">
              <li><a href="/" className="hover:text-white transition">{t.home}</a></li>
              <li><a href="/#menu" className="hover:text-white transition">{t.menu}</a></li>
              <li><a href="/checkout" className="hover:text-white transition">{t.orderNow2}</a></li>
              <li><a href="/track" className="hover:text-white transition">{t.trackOrder}</a></li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-lg font-bold mb-4">{t.contact}</h4>
            <ul className="space-y-2 text-gray-400">
              <li>📍 Bratislava, Slovakia</li>
              <li>📞 +421 123 456 789</li>
              <li>✉️ info@{tenantName.toLowerCase()}.sk</li>
              <li>🕐 Daily 11:00 - 23:00</li>
            </ul>
          </div>

          {/* Social */}
          <div>
            <h4 className="text-lg font-bold mb-4">{t.followUs}</h4>
            <div className="flex gap-4">
              <motion.a
                whileHover={{ scale: 1.2, rotate: 5 }}
                href="#"
                className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center hover:bg-primary transition"
                style={{ '--tw-bg-opacity': '1' } as React.CSSProperties}
              >
                📘
              </motion.a>
              <motion.a
                whileHover={{ scale: 1.2, rotate: -5 }}
                href="#"
                className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center hover:bg-primary transition"
              >
                📷
              </motion.a>
              <motion.a
                whileHover={{ scale: 1.2, rotate: 5 }}
                href="#"
                className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center hover:bg-primary transition"
              >
                🐦
              </motion.a>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400 text-sm">
          <p>© {new Date().getFullYear()} {tenantName}. {t.allRightsReserved}</p>
        </div>
      </div>
    </footer>
  );
};

