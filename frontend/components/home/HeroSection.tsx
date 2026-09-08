'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';
import { useLanguage } from '@/contexts/LanguageContext';
import { useMemo } from 'react';
import { resolveBrandImage } from '@/lib/brand-image-overrides';
import { resolveBrandHeroFlavor } from '@/lib/brand-hero';
import { getLayoutConfig } from '@/lib/tenant-utils';
import { useTenant } from '@/contexts/TenantContext';

interface HeroSectionProps {
  tenantName: string;
  primaryColor: string;
  isDark?: boolean;
  /** Server-known tenant slug; keeps SSR and client markup identical. */
  tenantSlug?: string;
}

const HERO_BLUR =
  'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDABsSFBcUERsXFhceHBsgKEIrKCUlKFE6PTBCYFVlZF9VXVtqeJmBanGQc1tdhbWGkJ6jq62rZ4C8ybqmx5moq6T/2wBDARweHigjKE4rK06kbl1upKSkpKSkpKSkpKSkpKSkpKSkpKSkpKSkpKSkpKSkpKSkpKSkpKSkpKSkpKSkpKSkpKT/wAARCAAIAAoDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAb/xAAhEAACAQMDBQAAAAAAAAAAAAABAgMABAUGIWEREiMxUf/EABUBAQEAAAAAAAAAAAAAAAAAAAMF/8QAGhEAAgIDAAAAAAAAAAAAAAAAAAECEgMRkf/aAAwDAQACEQMRAD8AltJagyeH0AthI5xdrLcNM91BF5pX2HaH9bcfaSXWGaRmknyJckliyjqTzSlT54b6bk+h0R//2Q==';

export const HeroSection = ({ tenantName, primaryColor, isDark = false, tenantSlug }: HeroSectionProps) => {
  const { tenant } = useTenant();
  // Brands can ship their own hero photo (public/images/brands/<slug>/hero/pizza-hero.jpg).
  // Never read window here – it differs between server and client and caused a
  // hydration mismatch (the shared hero sometimes stayed on branded sites).
  const heroImage =
    resolveBrandImage('/images/hero/pizza-hero.jpg', tenantSlug ?? tenant?.slug) || '/images/hero/pizza-hero.jpg';
  const { t } = useLanguage();
  const accentColor = primaryColor || 'var(--color-primary)';
  // Slug comes from the same SSR-safe source as heroImage – flavor must not
  // differ between server and client either.
  const flavor = resolveBrandHeroFlavor(tenantSlug ?? tenant?.slug);
  const { heroVariant } = getLayoutConfig(tenant);

  const stats = useMemo(() => (
    [
      { icon: flavor.statIcons[0], label: t.deliveryLabel, value: t.deliveryTime },
      { icon: flavor.statIcons[1], label: t.pizzasLabel, value: t.pizzasCount },
      { icon: flavor.statIcons[2], label: t.ratingLabel, value: t.rating },
    ]
  ), [t, flavor]);

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

  const badge = (
    <motion.span
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.05, duration: 0.4 }}
      className="inline-flex items-center gap-1.5 sm:gap-2 rounded-full px-3 sm:px-4 py-1.5 sm:py-2 text-[11px] sm:text-xs font-semibold mb-4 sm:mb-6"
      style={{ backgroundColor: accentColor, color: '#fff' }}
    >
      <span className="text-sm sm:text-base">{flavor.badgeEmoji}</span>
      <span className="whitespace-nowrap">{t.heroBadge}</span>
    </motion.span>
  );

  const ctaButton = (
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
      {t.orderNow} {flavor.ctaEmoji}
    </button>
  );

  const statTiles = (
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
  );

  if (heroVariant === 'split') {
    // Solid brand-toned background, content left, photo in a tilted card right.
    return (
      <section
        className="relative overflow-hidden"
        style={{
          position: 'relative',
          zIndex: 10,
          background: isDark
            ? `linear-gradient(135deg, rgba(0,0,0,0.97) 0%, rgba(10,10,12,0.94) 55%, ${accentColor}33 130%)`
            : `linear-gradient(135deg, #ffffff 0%, #fafaf9 55%, ${accentColor}1f 130%)`,
        }}
      >
        <div className="relative z-10 container mx-auto px-4 sm:px-6 pt-28 sm:pt-16 md:pt-20 pb-10 sm:pb-14 md:pb-16 grid md:grid-cols-2 gap-8 md:gap-12 items-center min-h-[80vh] sm:min-h-[560px]">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            className={`w-full text-center sm:text-left ${isDark ? 'text-white' : 'text-gray-900'}`}
          >
            {badge}
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.4 }}
              className="text-4xl sm:text-4xl md:text-5xl lg:text-6xl font-black mb-3 sm:mb-4 md:mb-6 leading-[1.1]"
              style={{ letterSpacing: '0.03em' }}
            >
              {t.heroTitle} <span style={{ color: accentColor }}>{tenantName}</span>
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.4 }}
              className="text-base md:text-lg mb-5 sm:mb-6 max-w-xl leading-relaxed"
              style={{ color: isDark ? '#d4d4d4' : '#4b5563' }}
            >
              {t.heroSubtitle}
            </motion.p>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35, duration: 0.4 }}
              className="flex flex-wrap gap-3 sm:gap-4 items-center"
            >
              {ctaButton}
            </motion.div>
            {statTiles}
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.94, rotate: 0 }}
            animate={{ opacity: 1, scale: 1, rotate: 1.5 }}
            transition={{ delay: 0.15, duration: 0.5 }}
            className="relative hidden md:block"
          >
            <div
              className="relative aspect-[4/3] rounded-3xl overflow-hidden shadow-2xl"
              style={{ boxShadow: `0 25px 60px -20px rgba(0,0,0,0.5), 0 0 0 6px ${accentColor}22` }}
            >
              <Image
                src={heroImage}
                alt={`${tenantName} - rozvoz pizze`}
                fill
                sizes="(max-width: 768px) 100vw, 50vw"
                quality={80}
                className="object-cover"
                priority
                placeholder="blur"
                blurDataURL={HERO_BLUR}
              />
            </div>
          </motion.div>
        </div>
      </section>
    );
  }

  if (heroVariant === 'minimal') {
    // No photo: flat typographic hero with an accent rule and inline stats.
    return (
      <section
        className="relative overflow-hidden"
        style={{ position: 'relative', zIndex: 10 }}
      >
        <div className="relative z-10 container mx-auto px-4 sm:px-6 pt-32 sm:pt-24 md:pt-28 pb-12 sm:pb-16 flex flex-col items-center text-center min-h-[60vh] sm:min-h-[480px] justify-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className={`w-full max-w-3xl ${isDark ? 'text-white' : 'text-gray-900'}`}
          >
            {badge}
            <h1
              className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black mb-4 leading-[1.05]"
              style={{ letterSpacing: '0.02em' }}
            >
              {t.heroTitle} <span style={{ color: accentColor }}>{tenantName}</span>
            </h1>
            <div
              className="mx-auto mb-5 sm:mb-6 h-1 w-24 rounded-full"
              style={{ backgroundColor: accentColor }}
              aria-hidden
            />
            <p
              className="text-base md:text-lg mb-7 sm:mb-8 max-w-xl mx-auto leading-relaxed"
              style={{ color: isDark ? '#d4d4d4' : '#6b7280' }}
            >
              {t.heroSubtitle}
            </p>
            <div className="flex justify-center mb-8 sm:mb-10">{ctaButton}</div>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4, duration: 0.4 }}
              className={`flex items-center justify-center divide-x ${isDark ? 'divide-white/20' : 'divide-black/10'}`}
            >
              {stats.map((stat) => (
                <div key={stat.label} className="px-4 sm:px-8 text-center">
                  <div className="text-lg sm:text-2xl font-bold leading-tight">
                    <span className="mr-1.5" aria-hidden>{stat.icon}</span>
                    {stat.value}
                  </div>
                  <div
                    className="uppercase tracking-widest text-[9px] sm:text-[10px] mt-1"
                    style={{ color: isDark ? '#a3a3a3' : '#9ca3af' }}
                  >
                    {stat.label}
                  </div>
                </div>
              ))}
            </motion.div>
          </motion.div>
        </div>
      </section>
    );
  }

  // classic (default): full-bleed photo with gradient overlay.
  return (
    <section className="relative min-h-[85vh] sm:min-h-[600px] md:min-h-[660px] overflow-hidden" style={{ position: 'relative', zIndex: 10 }}>
      {/* Background Image */}
      <div className="absolute inset-0" style={{ position: 'absolute', zIndex: 0 }}>
        <Image
          src={heroImage}
          alt={`${tenantName} - rozvoz pizze`}
          fill
          sizes="100vw"
          quality={80}
          className="object-cover"
          priority
          placeholder="blur"
          blurDataURL={HERO_BLUR}
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
      <div className="relative z-10 container mx-auto px-4 sm:px-6 h-full pt-32 sm:pt-12 md:pt-16 lg:pt-20 pb-10 sm:pb-12 md:pb-16 lg:pb-20 flex flex-col justify-start sm:justify-center">
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className="max-w-3xl text-white w-full text-center sm:text-left"
        >
          {badge}

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
            {t.heroTitle}{' '}
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
            {ctaButton}
          </motion.div>

          {statTiles}
        </motion.div>
      </div>
    </section>
  );
};
