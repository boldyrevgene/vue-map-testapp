import type { LngLat } from '@/models/map-entity'

const EARTH_RADIUS_KM = 6371

/**
 * Calculates distance between two points on a map
 *
 * @param a - point A coordinates
 * @param b - point B coordinates
 * @returns distance in kilometers
 */
export function haversineDistance(a: LngLat, b: LngLat): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180

  const [lngA, latA] = a
  const [lngB, latB] = b

  const dLat = toRad(latB - latA)
  const dLon = toRad(lngB - lngA)

  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(latA)) * Math.cos(toRad(latB)) * Math.sin(dLon / 2) ** 2

  return EARTH_RADIUS_KM * 2 * Math.asin(Math.sqrt(h))
}
