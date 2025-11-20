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
    <section className="relative min-h-[660px] overflow-hidden" style={{ position: 'relative', zIndex: 10 }}>
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
      <div className="relative z-10 container mx-auto px-4 h-full py-20 flex items-center">
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className="max-w-3xl text-white"
        >
          <motion.span
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05, duration: 0.4 }}
            className={`${isDark ? 'hero-badge mb-6 inline-flex' : 'inline-flex items-center gap-2 rounded-full bg-white/80 px-4 py-2 text-xs font-semibold text-black mb-6'}`}
          >
            <span>🌶️</span>
            {t.heroBadge}
          </motion.span>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.4 }}
            className="text-5xl md:text-7xl font-black mb-6 leading-tight"
            style={{
              textShadow: 'none',
              letterSpacing: '0.03em'
            }}
          >
            {t.heroTitle}
            <br className="hidden md:block" />
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
            className="text-lg md:text-xl mb-6 max-w-2xl"
            style={{
              color: isDark ? '#ccc' : '#374151',
              textShadow: 'none'
            }}
          >
            {t.heroSubtitle}
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35, duration: 0.4 }}
            className="flex flex-wrap gap-4 items-center"
          >
            <button
              onClick={scrollToMenu}
              className="px-8 py-4 rounded-full font-bold text-base md:text-lg transition-all hover:opacity-90 shadow-xl"
              style={{
                background: accentColor,
                color: 'white',
                boxShadow: 'none',
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
            className="mt-10 grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm"
          >
            {stats.map((stat) => (
              <div
                key={stat.label}
                className={`rounded-2xl px-5 py-4 flex items-center gap-4 border ${
                  isDark
                    ? 'bg-white/5 border-white/10 text-white'
                    : 'bg-white border-black/5 text-gray-900 shadow-lg'
                }`}
              >
                <span className="text-3xl" aria-hidden>
                  {stat.icon}
                </span>
                <div>
                  <div className="text-2xl font-bold">{stat.value}</div>
                  <div
                    className="uppercase tracking-widest text-xs"
                    style={{ color: isDark ? '#c1c1c1' : '#6b7280' }}
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
