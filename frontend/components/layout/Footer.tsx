'use client';

import { motion } from 'framer-motion';
import { useLanguage } from '@/contexts/LanguageContext';

interface FooterProps {
  tenantName: string;
  primaryColor: string;
}

export const Footer = ({ tenantName, primaryColor }: FooterProps) => {
  const { t } = useLanguage();
  const year = new Date().getFullYear();
  const quickLinks = [
    { label: t.home, href: '/' },
    { label: t.menu, href: '/#menu' },
    { label: t.orderNow2, href: '/checkout' },
  ];

  const socialLinks = [
    { icon: '📸', label: 'Instagram' },
    { icon: '🎬', label: 'OnlyFans', href: '#' },
    { icon: '🐦', label: 'Twitter', href: '#' },
  ];

  return (
    <footer className="relative mt-24">
      <div className="container mx-auto px-4">
        <div className="relative overflow-hidden rounded-3xl bg-black text-white border border-white/10 footer-grid">
          <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-white/5 pointer-events-none" aria-hidden />
          <div className="relative px-8 py-12 grid grid-cols-1 md:grid-cols-4 gap-10">
            <div className="space-y-4">
              <h3 className="text-3xl font-black" style={{ color: primaryColor }}>
                {tenantName}
              </h3>
              <p className="text-gray-300 leading-relaxed">
                {t.footerTagline}
              </p>
            </div>

            <div>
              <h4 className="text-lg font-bold mb-4 uppercase tracking-[0.3em] text-gray-400">{t.quickLinks}</h4>
              <ul className="space-y-2 text-gray-300">
                {quickLinks.map((link) => (
                  <li key={link.label}>
                    <a href={link.href} className="hover:text-white transition">
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h4 className="text-lg font-bold mb-4 uppercase tracking-[0.3em] text-gray-400">{t.contact}</h4>
              <ul className="space-y-2 text-gray-300 text-sm">
                <li>📍 Tobrucká 82/5, 811 02 Staré Mesto</li>
                <li>
                  <a 
                    href="tel:+421914363363" 
                    className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 border border-white/20 hover:border-white/30 transition-all hover:scale-105 active:scale-95 cursor-pointer"
                  >
                    <span>📞</span>
                    <span className="font-semibold">0914 363 363</span>
                  </a>
                </li>
                <li>✉️ info@{tenantName.toLowerCase()}.sk</li>
                <li>🕐 {t.openingHours}</li>
              </ul>
            </div>

            <div className="space-y-4">
              <h4 className="text-lg font-bold uppercase tracking-[0.3em] text-gray-400">{t.followUs}</h4>
              <p className="text-gray-400 text-sm">
                {t.bestSellersSubtitle}
              </p>
              <div className="flex gap-4">
                {socialLinks.map((social) => (
                  <motion.a
                    key={social.label}
                    href={social.href || '#'}
                    whileHover={{ scale: 1.1, rotate: 2 }}
                    className="w-12 h-12 rounded-full border border-white/20 flex items-center justify-center bg-white/5 hover:bg-white/10 transition"
                  >
                    <span className="text-xl" aria-hidden>{social.icon}</span>
                  </motion.a>
                ))}
              </div>
            </div>
          </div>

          <div className="relative border-t border-white/10 px-8 py-6 text-sm text-gray-400 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <p>© {year} {tenantName}. {t.allRightsReserved}</p>
            <div className="flex gap-4 flex-wrap items-center text-xs uppercase tracking-[0.3em]">
              <a href="/cookies" className="hover:text-white transition underline">
                {t.cookiePolicy || 'Zásady cookie'}
              </a>
              <a href="/terms" className="hover:text-white transition underline">
                {t.termsOfService || 'Podmienky'}
              </a>
              <a href="/privacy" className="hover:text-white transition underline">
                {t.privacyPolicy || 'Súkromie'}
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};
