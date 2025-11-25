'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';
import { useLanguage } from '@/contexts/LanguageContext';
import { useMemo } from 'react';

interface HeroSectionProps {
  tenantName: string;
  primaryColor: string;
  isDark?: boolean;
}

export const HeroSection = ({ tenantName, primaryColor, isDark = false }: HeroSectionProps) => {
  const { t } = useLanguage();
  const accentColor = primaryColor || 'var(--color-primary)';

  const stats = useMemo(() => (
    [
      { icon: '🕐', label: t.deliveryLabel, value: t.deliveryTime },
      { icon: '🍕', label: t.pizzasLabel, value: t.pizzasCount },
      { icon: '⭐', label: t.ratingLabel, value: t.rating },
    ]
  ), [t]);

  const highlight = useMemo(() => ({
    name: t.heroFloatingHighlightName,
    description: t.heroFloatingHighlightDesc,
    price: t.heroFloatingHighlightPrice,
    label: t.heroFloatingHighlightLabel,
  }), [t]);

  const scrollToMenu = () => {
    const menuElement = document.getElementById('menu');
    if (!menuElement) return;

    const headerHeight = 80;
    const elementPosition = menuElement.getBoundingClientRect().top;
    const offsetPosition = elementPosition + window.pageYOffset - headerHeight;

    window.scrollTo({
      top: offsetPosition,
      behavior: 'smooth'
    });
  };

  return (
    <section className="relative min-h-[85vh] sm:min-h-[600px] md:min-h-[660px] overflow-hidden" style={{ position: 'relative', zIndex: 10 }}>
      {/* Background Image */}
      <div className="absolute inset-0" style={{ position: 'absolute', zIndex: 0 }}>
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
        <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/60 to-transparent" />
        <div
          className="absolute inset-0 opacity-40 mix-blend-soft-light"
          style={{
            backgroundImage:
              'linear-gradient(120deg, rgba(255,255,255,0.12) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.08) 1px, transparent 1px)',
            backgroundSize: '220px 220px'
          }}
        />
      </div>

      {/* Content */}
      <div className="relative z-10 container mx-auto px-4 sm:px-6 h-full pt-20 sm:pt-12 md:pt-16 lg:pt-20 pb-10 sm:pb-12 md:pb-16 lg:pb-20 flex flex-col justify-start sm:justify-center">
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className="max-w-3xl text-white w-full text-center sm:text-left"
        >
          <motion.span
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05, duration: 0.4 }}
            className={`${isDark ? 'hero-badge mb-4 sm:mb-6 inline-flex' : 'inline-flex items-center gap-1.5 sm:gap-2 rounded-full bg-white/90 sm:bg-white/80 px-3 sm:px-4 py-1.5 sm:py-2 text-[11px] sm:text-xs font-semibold text-black mb-4 sm:mb-6'}`}
          >
            <span className="text-sm sm:text-base">🌶️</span>
            <span className="whitespace-nowrap">{t.heroBadge}</span>
          </motion.span>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.4 }}
            className="text-4xl sm:text-4xl md:text-5xl lg:text-7xl font-black mb-3 sm:mb-4 md:mb-6 leading-[1.1] sm:leading-tight"
            style={{
              textShadow: 'none',
              letterSpacing: '0.03em'
            }}
          >
            {t.heroTitle}
            <br className="hidden sm:block" />
            <span
              style={{
                color: accentColor,
                textShadow: 'none',
                letterSpacing: '0.03em'
              }}
            >
              {tenantName}
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.4 }}
            className="text-base sm:text-base md:text-lg lg:text-xl mb-5 sm:mb-6 max-w-2xl leading-relaxed"
            style={{
              color: isDark ? '#e5e5e5' : '#f3f4f6',
              textShadow: isDark ? '0 1px 2px rgba(0,0,0,0.5)' : '0 1px 2px rgba(0,0,0,0.3)'
            }}
          >
            {t.heroSubtitle}
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35, duration: 0.4 }}
            className="flex flex-wrap gap-3 sm:gap-4 items-center mb-6 sm:mb-0"
          >
            <button
              onClick={scrollToMenu}
              className="px-6 sm:px-6 md:px-8 py-3.5 sm:py-3 md:py-4 rounded-full font-bold text-base sm:text-base md:text-lg transition-all hover:opacity-90 active:opacity-75 shadow-xl touch-manipulation min-h-[48px] sm:min-h-[48px] w-full sm:w-auto"
              style={{
                background: accentColor,
                color: 'white',
                boxShadow: '0 4px 14px 0 rgba(0, 0, 0, 0.3)',
                border: 'none'
              }}
            >
              {t.orderNow} 🍕
            </button>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.4 }}
            className="mt-6 sm:mt-10 grid grid-cols-3 gap-2.5 sm:gap-4 pb-4 sm:pb-0"
          >
            {stats.map((stat) => (
              <div
                key={stat.label}
                className={`rounded-xl sm:rounded-2xl px-3 py-4 sm:px-5 sm:py-4 flex flex-col items-center justify-center gap-2 sm:gap-3 border ${
                  isDark
                    ? 'bg-white/10 border-white/20 text-white'
                    : 'bg-white/95 border-black/10 text-gray-900 shadow-lg'
                }`}
              >
                <span className="text-2xl sm:text-3xl md:text-4xl" aria-hidden>
                  {stat.icon}
                </span>
                <div className="text-center">
                  <div className="text-base sm:text-xl md:text-2xl font-bold leading-tight mb-0.5 sm:mb-1">{stat.value}</div>
                  <div
                    className="uppercase tracking-wider sm:tracking-widest text-[9px] sm:text-[10px] md:text-xs leading-tight px-1"
                    style={{ color: isDark ? '#d1d1d1' : '#6b7280' }}
                  >
                    {stat.label}
                  </div>
                </div>
              </div>
            ))}
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
};
