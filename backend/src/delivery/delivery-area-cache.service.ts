import { Injectable, Logger } from '@nestjs/common';
import { WoltDriveService } from './wolt-drive.service';

interface WoltApiConfigForAreas {
  apiUrl?: string;
  venueId?: string;
}

interface WoltPoint {
  lat: number;
  lng: number;
}

interface WoltDeliveryAreaPolygon {
  id: string;
  rings: WoltPoint[][];
}

interface WoltAreaCacheEntry {
  polygons: WoltDeliveryAreaPolygon[];
  fetchedAt: number;
  ttlMs: number;
  staleUntilMs: number;
}

export interface WoltAreaCheckResult {
  insideArea: boolean | null;
  source: 'cache' | 'live' | 'fallback';
  reason: string | null;
  fetchedAt?: string;
}

@Injectable()
export class DeliveryAreaCacheService {
  private readonly logger = new Logger(DeliveryAreaCacheService.name);
  private readonly ttlMs = 10 * 60 * 1000;
  private readonly staleExtensionMs = 5 * 60 * 1000;

  private readonly cache = new Map<string, WoltAreaCacheEntry>();
  private readonly refreshPromises = new Map<string, Promise<WoltAreaCacheEntry>>();

  constructor(private readonly woltDriveService: WoltDriveService) {}

  async refreshTenantAreas(
    tenantId: string,
    apiKey: string,
    merchantId: string,
    apiConfig?: WoltApiConfigForAreas,
  ): Promise<WoltAreaCacheEntry> {
    const key = this.getCacheKey(tenantId, merchantId);
    const refreshed = await this.fetchAndNormalize(tenantId, apiKey, merchantId, apiConfig);
    this.cache.set(key, refreshed);
    return refreshed;
  }

  async checkPoint(
    tenantId: string,
    apiKey: string,
    merchantId: string,
    point: WoltPoint,
    apiConfig?: WoltApiConfigForAreas,
  ): Promise<WoltAreaCheckResult> {
    const key = this.getCacheKey(tenantId, merchantId);
    const now = Date.now();
    const cached = this.cache.get(key);

    // Fresh cache
    if (cached && now - cached.fetchedAt <= cached.ttlMs) {
      return {
        insideArea: this.isPointInsideAnyPolygon(point, cached.polygons),
        source: 'cache',
        reason: null,
        fetchedAt: new Date(cached.fetchedAt).toISOString(),
      };
    }

    // stale-while-revalidate window
    if (cached && now <= cached.staleUntilMs) {
      this.refreshInBackground(tenantId, apiKey, merchantId, apiConfig).catch((error) => {
        this.logger.warn('[checkPoint] Background refresh failed', {
          tenantId,
          merchantId,
          error: error?.message,
        });
      });

      return {
        insideArea: this.isPointInsideAnyPolygon(point, cached.polygons),
        source: 'fallback',
        reason: null,
        fetchedAt: new Date(cached.fetchedAt).toISOString(),
      };
    }

    // No cache or fully expired -> live fetch required
    try {
      const live = await this.refreshTenantAreas(tenantId, apiKey, merchantId, apiConfig);
      return {
        insideArea: this.isPointInsideAnyPolygon(point, live.polygons),
        source: 'live',
        reason: null,
        fetchedAt: new Date(live.fetchedAt).toISOString(),
      };
    } catch (error: any) {
      if (cached) {
        return {
          insideArea: this.isPointInsideAnyPolygon(point, cached.polygons),
          source: 'fallback',
          reason: `Delivery areas fallback cache used: ${error?.message || 'unknown error'}`,
          fetchedAt: new Date(cached.fetchedAt).toISOString(),
        };
      }

      return {
        insideArea: null,
        source: 'fallback',
        reason: `Wolt delivery areas unavailable: ${error?.message || 'unknown error'}`,
      };
    }
  }

  private getCacheKey(tenantId: string, merchantId: string): string {
    return `${tenantId}:${merchantId}`;
  }

  private async refreshInBackground(
    tenantId: string,
    apiKey: string,
    merchantId: string,
    apiConfig?: WoltApiConfigForAreas,
  ): Promise<WoltAreaCacheEntry> {
    const key = this.getCacheKey(tenantId, merchantId);
    const inFlight = this.refreshPromises.get(key);
    if (inFlight) {
      return inFlight;
    }

    const refreshPromise = this.fetchAndNormalize(tenantId, apiKey, merchantId, apiConfig)
      .then((entry) => {
        this.cache.set(key, entry);
        return entry;
      })
      .finally(() => {
        this.refreshPromises.delete(key);
      });

    this.refreshPromises.set(key, refreshPromise);
    return refreshPromise;
  }

  private async fetchAndNormalize(
    tenantId: string,
    apiKey: string,
    merchantId: string,
    apiConfig?: WoltApiConfigForAreas,
  ): Promise<WoltAreaCacheEntry> {
    const raw = await this.woltDriveService.getDeliveryAreas(apiKey, merchantId, 2, apiConfig);
    const polygons = this.normalizeAreas(raw);

    this.logger.log('[fetchAndNormalize] Wolt delivery areas loaded', {
      tenantId,
      merchantId,
      polygons: polygons.length,
    });

    const now = Date.now();
    return {
      polygons,
      fetchedAt: now,
      ttlMs: this.ttlMs,
      staleUntilMs: now + this.ttlMs + this.staleExtensionMs,
    };
  }

  private normalizeAreas(raw: any): WoltDeliveryAreaPolygon[] {
    const areaCandidates = this.extractAreaCandidates(raw);
    const normalized: WoltDeliveryAreaPolygon[] = [];

    for (const candidate of areaCandidates) {
      const rings = this.extractRings(candidate);
      if (rings.length === 0) {
        continue;
      }

      const polygon: WoltDeliveryAreaPolygon = {
        id:
          String(candidate?.id || candidate?.name || candidate?.zone_id || `area-${normalized.length + 1}`),
        rings,
      };
      normalized.push(polygon);
    }

    return normalized;
  }

  private extractAreaCandidates(raw: any): any[] {
    if (Array.isArray(raw)) {
      return raw;
    }

    const knownCollections = [
      raw?.delivery_areas,
      raw?.deliveryAreas,
      raw?.areas,
      raw?.zones,
      raw?.data,
      raw?.results,
      raw?.polygons,
    ];

    for (const collection of knownCollections) {
      if (Array.isArray(collection)) {
        return collection;
      }
      // Wolt Drive returns delivery_areas as a NAME-KEYED MAP, not an array:
      // { delivery_areas: { "Drive Bratislava": { coordinates: [...], type: "Polygon" } } }
      if (collection && typeof collection === 'object') {
        const entries = Object.entries(collection).filter(
          ([, value]) => value && typeof value === 'object',
        );
        if (entries.length > 0) {
          return entries.map(([name, value]) => ({ id: name, ...(value as object) }));
        }
      }
    }

    return raw ? [raw] : [];
  }

  private extractRings(area: any): WoltPoint[][] {
    const geometryCandidates = [
      area?.polygon,
      area?.polygons,
      area?.geometry?.coordinates,
      area?.coordinates,
      area?.shape,
      area?.boundary,
      area?.boundaries,
      area,
    ];

    for (const candidate of geometryCandidates) {
      const rings = this.parseRings(candidate);
      if (rings.length > 0) {
        return rings;
      }
    }

    return [];
  }

  private parseRings(candidate: any): WoltPoint[][] {
    if (!Array.isArray(candidate) || candidate.length === 0) {
      return [];
    }

    // Ring as array of point objects
    if (this.isPointObject(candidate[0])) {
      const ring = this.parsePointRing(candidate);
      return ring.length >= 3 ? [ring] : [];
    }

    // Ring as array of [lon, lat] tuples
    if (Array.isArray(candidate[0]) && this.isNumericTuple(candidate[0])) {
      const ring = this.parseTupleRing(candidate);
      return ring.length >= 3 ? [ring] : [];
    }

    // Nested arrays (multi-ring or geojson)
    if (Array.isArray(candidate[0])) {
      const rings: WoltPoint[][] = [];

      for (const maybeRing of candidate) {
        if (Array.isArray(maybeRing) && maybeRing.length > 0) {
          if (this.isPointObject(maybeRing[0])) {
            const parsed = this.parsePointRing(maybeRing);
            if (parsed.length >= 3) rings.push(parsed);
            continue;
          }

          if (Array.isArray(maybeRing[0]) && this.isNumericTuple(maybeRing[0])) {
            const parsed = this.parseTupleRing(maybeRing);
            if (parsed.length >= 3) rings.push(parsed);
            continue;
          }

          // GeoJSON multipolygon: [[[...]], [[...]]]
          if (Array.isArray(maybeRing[0]) && Array.isArray(maybeRing[0][0])) {
            const nested = this.parseRings(maybeRing);
            if (nested.length > 0) {
              rings.push(...nested);
            }
          }
        }
      }

      return rings;
    }

    return [];
  }

  private isPointObject(value: any): boolean {
    return (
      value &&
      typeof value === 'object' &&
      (this.isFiniteNumber(value.lat) || this.isFiniteNumber(value.latitude)) &&
      (this.isFiniteNumber(value.lng) || this.isFiniteNumber(value.lon) || this.isFiniteNumber(value.longitude))
    );
  }

  private isNumericTuple(value: any): boolean {
    return Array.isArray(value) && value.length >= 2 && this.isFiniteNumber(value[0]) && this.isFiniteNumber(value[1]);
  }

  private parsePointRing(points: any[]): WoltPoint[] {
    const ring: WoltPoint[] = [];
    for (const point of points) {
      const lat = this.toNumber(point?.lat ?? point?.latitude);
      const lng = this.toNumber(point?.lng ?? point?.lon ?? point?.longitude);
      if (lat == null || lng == null) continue;
      ring.push({ lat, lng });
    }
    return ring;
  }

  private parseTupleRing(points: any[]): WoltPoint[] {
    const ring: WoltPoint[] = [];
    for (const point of points) {
      if (!Array.isArray(point) || point.length < 2) continue;
      const first = this.toNumber(point[0]);
      const second = this.toNumber(point[1]);
      if (first == null || second == null) continue;

      // Most geojson tuples are [lng, lat]
      ring.push({ lat: second, lng: first });
    }
    return ring;
  }

  private toNumber(value: unknown): number | null {
    if (typeof value === 'number' && Number.isFinite(value)) {
      return value;
    }
    if (typeof value === 'string') {
      const parsed = Number.parseFloat(value.replace(',', '.').trim());
      return Number.isFinite(parsed) ? parsed : null;
    }
    return null;
  }

  private isFiniteNumber(value: unknown): boolean {
    return this.toNumber(value) !== null;
  }

  // Empty polygon list means "we could not parse any boundary", not
  // "everywhere is outside" — returning null keeps callers fail-open instead
  // of rejecting every address (which would silently break checkout).
  private isPointInsideAnyPolygon(
    point: WoltPoint,
    polygons: WoltDeliveryAreaPolygon[],
  ): boolean | null {
    if (polygons.length === 0) {
      return null;
    }
    return polygons.some((polygon) => this.isPointInsidePolygon(point, polygon));
  }

  private isPointInsidePolygon(point: WoltPoint, polygon: WoltDeliveryAreaPolygon): boolean {
    if (!polygon.rings.length) {
      return false;
    }

    const [outer, ...holes] = polygon.rings;
    if (!this.isPointInRing(point, outer)) {
      return false;
    }

    for (const hole of holes) {
      if (this.isPointInRing(point, hole)) {
        return false;
      }
    }

    return true;
  }

  private isPointInRing(point: WoltPoint, ring: WoltPoint[]): boolean {
    let inside = false;

    for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
      const xi = ring[i].lng;
      const yi = ring[i].lat;
      const xj = ring[j].lng;
      const yj = ring[j].lat;

      const intersects =
        yi > point.lat !== yj > point.lat &&
        point.lng < ((xj - xi) * (point.lat - yi)) / (yj - yi + Number.EPSILON) + xi;

      if (intersects) {
        inside = !inside;
      }
    }

    return inside;
  }
}
