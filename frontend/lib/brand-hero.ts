/**
 * Per-brand hero "flavor": the small emoji accents in the hero section.
 *
 * All brands share one HeroSection; without this every site shows the same
 * 🌶️ badge, "Objednať teraz 🍕" button and 🕐/🍕/⭐ stat tiles. Texts stay
 * shared (translations.ts) – only emojis differ, so there is no i18n impact.
 */

import { normalizeBrandSlug } from './brand-image-overrides';

export interface BrandHeroFlavor {
  /** Emoji in the "Rýchle doručenie do 90 minút" pill. */
  badgeEmoji: string;
  /** Emoji after the "Objednať teraz" CTA label. */
  ctaEmoji: string;
  /** Stat tile icons in order: delivery time, pizza count, customer rating. */
  statIcons: readonly [string, string, string];
}

const DEFAULT_FLAVOR: BrandHeroFlavor = {
  badgeEmoji: '🌶️',
  ctaEmoji: '🍕',
  statIcons: ['🕐', '🍕', '⭐'],
};

/** Keys are canonical slugs (after normalizeBrandSlug). */
const BRAND_HERO_FLAVORS: Record<string, BrandHeroFlavor> = {
  pornopizza: {
    badgeEmoji: '🔥',
    ctaEmoji: '😈',
    statIcons: ['🕶️', '🍕', '💋'],
  },
  partypizza: {
    badgeEmoji: '🎉',
    ctaEmoji: '🥳',
    statIcons: ['🪩', '🍕', '🎊'],
  },
  pizzavnudzi: {
    badgeEmoji: '🚨',
    ctaEmoji: '🚑',
    statIcons: ['⚡', '🍕', '🦸'],
  },
  pizzalover: {
    badgeEmoji: '❤️‍🔥',
    ctaEmoji: '❤️',
    statIcons: ['💘', '🍕', '💖'],
  },
  pizzaprefirmy: {
    badgeEmoji: '⚡',
    ctaEmoji: '💼',
    statIcons: ['⏱️', '🍕', '🤝'],
  },
  threesomepizza: {
    badgeEmoji: '😈',
    ctaEmoji: '😏',
    statIcons: ['🛵', '🍕', '💜'],
  },
  skinnyb1tchpizza: {
    badgeEmoji: '💅',
    ctaEmoji: '✨',
    statIcons: ['🛼', '🍕', '💎'],
  },
  ozemp1cpizza: {
    badgeEmoji: '💉',
    ctaEmoji: '😋',
    statIcons: ['🏃', '🍕', '✨'],
  },
};

export function resolveBrandHeroFlavor(
  tenantSlug: string | null | undefined,
): BrandHeroFlavor {
  return BRAND_HERO_FLAVORS[normalizeBrandSlug(tenantSlug)] ?? DEFAULT_FLAVOR;
}
