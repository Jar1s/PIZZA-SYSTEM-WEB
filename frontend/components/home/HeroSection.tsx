'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';
import { useLanguage } from '@/contexts/LanguageContext';

interface HeroSectionProps {
  tenantName: string;
  primaryColor: string;
}

export const HeroSection = ({ tenantName, primaryColor }: HeroSectionProps) => {
  const { t } = useLanguage();
  return (
    <section className="relative h-[600px] overflow-hidden" style={{ position: 'relative', zIndex: 10 }}>
      {/* Background Image */}
      <div className="absolute inset-0 z-0" style={{ position: 'absolute', zIndex: 0 }}>
        <Image
          src="/images/hero/pizza-hero.jpg"
          alt="Delicious pizza"
          fill
          sizes="100vw"
          quality={80}
          className="object-cover"
          priority
          placeholder="blur"
          blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDABsSFBcUERsXFhceHBsgKEIrKCUlKFE6PTBCYFVlZF9VXVtqeJmBanGQc1tdhbWGkJ6jq62rZ4C8ybqmx5moq6T/2wBDARweHigjKE4rK06kbl1upKSkpKSkpKSkpKSkpKSkpKSkpKSkpKSkpKSkpKSkpKSkpKSkpKSkpKSkpKSkpKSkpKT/wAARCAAIAAoDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAb/xAAhEAACAQMDBQAAAAAAAAAAAAABAgMABAUGIWEREiMxUf/EABUBAQEAAAAAAAAAAAAAAAAAAAMF/8QAGhEAAgIDAAAAAAAAAAAAAAAAAAECEgMRkf/aAAwDAQACEQMRAD8AltJagyeH0AthI5xdrLcNM91BF5pX2HaH9bcfaSXWGaRmknyJckliyjqTzSlT54b6bk+h0R//2Q=="
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/70 to-black/40" />
      </div>

      {/* Content */}
      <div className="relative z-10 container mx-auto px-4 h-full flex items-center">
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className="max-w-2xl text-white"
        >
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.4 }}
            className="text-6xl font-bold mb-6 leading-tight whitespace-nowrap"
          >
            {t.heroTitle} <span style={{ color: primaryColor }}>{tenantName}</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.4 }}
            className="text-xl mb-8 text-gray-200"
          >
            {t.heroSubtitle}
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.4 }}
          >
            <button
              onClick={() => {
                const menuElement = document.getElementById('menu');
                if (menuElement) {
                  const headerHeight = 80; // Height of sticky header
                  const elementPosition = menuElement.getBoundingClientRect().top;
                  const offsetPosition = elementPosition + window.pageYOffset - headerHeight;
                  
                  window.scrollTo({
                    top: offsetPosition,
                    behavior: 'smooth'
                  });
                }
              }}
              className="px-8 py-4 rounded-lg font-bold text-lg transition-transform hover:scale-105 shadow-lg"
              style={{ backgroundColor: primaryColor, color: 'white' }}
            >
              {t.orderNow} 🍕
            </button>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.4 }}
            className="mt-12 flex gap-8 text-sm"
          >
            <div className="flex items-center gap-2">
              <span className="text-3xl">🕐</span>
              <div>
                <div className="font-bold">{t.deliveryTime}</div>
                <div className="text-gray-300">{t.deliveryLabel}</div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-3xl">🍕</span>
              <div>
                <div className="font-bold">{t.pizzasCount}</div>
                <div className="text-gray-300">{t.pizzasLabel}</div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-3xl">⭐</span>
              <div>
                <div className="font-bold">{t.rating}</div>
                <div className="text-gray-300">{t.ratingLabel}</div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </div>

      {/* Scroll Indicator */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.2, duration: 0.6, repeat: Infinity, repeatType: 'reverse' }}
        className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-10"
      >
        <div className="text-white text-center">
          <div className="text-sm mb-2">{t.scrollToExplore}</div>
          <div className="text-2xl">↓</div>
        </div>
      </motion.div>
    </section>
  );
};

