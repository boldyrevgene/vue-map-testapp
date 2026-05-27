import { CLOSEST_USERS_DISPLAY_COUNT, GRID_RESOLUTION } from '@/constants'
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

export type ClosestItem<T> = { distance: number, item: T }


const getCellIdKey = (x: number, y: number) => `${x}_${y}`

function coordsToCellId(coordinates: LngLat, resolution = GRID_RESOLUTION) {
  const x = Math.floor(coordinates[0] * resolution);
  const y = Math.floor(coordinates[1] * resolution);
  return getCellIdKey(x, y);
}

type IdGetter<T> = (item: T) => string
type CoordinatesGetter<T> = (item: T) => LngLat

export type IndexContext<T> = {
  getId: IdGetter<T>,
  getCoordinates: CoordinatesGetter<T>,
}

export class SpatialGridIndex<T> {

  // cellId -> itemId -> item
  private cells: Map<string, Map<string, T>>
  // itemId -> cellId
  private itemsCell: Map<string, string>
  private context: IndexContext<T>

  constructor(context: IndexContext<T>) {
    this.cells = new Map()
    this.itemsCell = new Map()
    this.context = context
  }

  reset() {
    this.cells = new Map()
    this.itemsCell = new Map()
  }

  hasItem(item: T): boolean {
    return this.itemsCell.has(this.getItemId(item))
  }

  addItem(item: T): void {
    const cellId = this.itemCoordsToCellId(item)
    
    let cell = this.cells.get(cellId)
    if (!cell) {
      cell = new Map()
      this.cells.set(cellId, cell)
    }
    
    cell.set(this.getItemId(item), item)

    const itemId = this.getItemId(item)
    this.itemsCell.set(itemId, cellId)
  }

  updateItemIndex(item: T): void {
    this.deleteItem(item)
    this.addItem(item)
  }

  deleteItem(item: T): void {
    const itemId = this.getItemId(item)
    const cellId = this.getCellId(item)

    if (cellId) {
      this.cells.get(cellId)?.delete(itemId)
    }
    this.itemsCell.delete(itemId)
  }

  getItemId(item: T): string {
    return this.context.getId(item)
  }

  getItemCoordinates(item: T): LngLat {
    return this.context.getCoordinates(item)
  }

  itemCoordsToCellId(item: T): string {
    return coordsToCellId(this.getItemCoordinates(item))
  }

  getCellId(item: T): string {
    return this.itemsCell.get(this.getItemId(item)) ?? ''
  }

  cellToClosestTo(cellId: string, coordinates: LngLat): ClosestItem<T>[] {
    const cell = this.cells.get(cellId)
    if (!cell) {
      return []
    }
    const items: ClosestItem<T>[] = []

    for (const item of cell.values()) {
      items.push({
        item,
        distance: haversineDistance(coordinates, this.getItemCoordinates(item))
      })
    }

    return items
  }
}

/**
 * Searches unsorted list of closest items
 * to choosen point
 * 
 * @param index - spatial grid index
 * @param query - coordinate of origin point 
 * @param limit - limit or required closest points
 * @param resolution - index cell size
 * @returns list of closest items to query coordinates
 */
function findClosestInIndex<T>(index: SpatialGridIndex<T>, query: LngLat, limit: number, resolution: number): ClosestItem<T>[] {

  const sX = Math.floor(query[0] * resolution);
  const sY = Math.floor(query[1] * resolution);

  let radius = 0;
  // limit of search iterations
  let maxRadius = Math.max(5, Math.round(GRID_RESOLUTION / 10))

  const closestItems: ClosestItem<T>[] = [];

  let extraRingDone = false
  while (radius <= maxRadius) {

    if (closestItems.length >= limit) {
      if (extraRingDone) {
        break
      }
      extraRingDone = true
    }

    // check only a single cell for R === 0
    if (radius === 0) {
      const cellId = coordsToCellId(query)
      closestItems.push(...index.cellToClosestTo(cellId, query));
    } else {
      // check perimeter if R > 0

      // upper/lower rows of R
      for (let x = sX - radius; x <= sX + radius; x++) {
        const topCellId = getCellIdKey(x, sY + radius)
        const bottomCellId = getCellIdKey(x, sY - radius)

        closestItems.push(...index.cellToClosestTo(topCellId, query));
        closestItems.push(...index.cellToClosestTo(bottomCellId, query));
      }

      // left/right columns of R
      for (let y = sY - radius + 1; y <= sY + radius - 1; y++) {
        const leftCellId = getCellIdKey(sX - radius, y)
        const rightCellId = getCellIdKey(sX + radius, y)
        closestItems.push(...index.cellToClosestTo(leftCellId, query))
        closestItems.push(...index.cellToClosestTo(rightCellId, query))
      }
    }

    // next R
    radius++;
  }

  return closestItems.sort((a, b) => a.distance - b.distance)
    .slice(0, limit)
}

const _indexes = new Map<string, SpatialGridIndex<any>>()

/**
 * Defines spatial grid index and functions to manipulate with it
 * 
 * @param indexKey - uniq key for index to reuse in different places
 * @param params - getters to get id, coordinates from item
 * @returns 
 */
export function defineSpatialGridIndex<T>(indexKey: string, params: IndexContext<T>) {

  let index: SpatialGridIndex<T> | undefined = _indexes.get(indexKey)
  if (!index) {
    index = new SpatialGridIndex<T>(params)
    _indexes.set(indexKey, index)
  }


  function findClosestTo(query: LngLat, limit = CLOSEST_USERS_DISPLAY_COUNT, resolution = GRID_RESOLUTION): ClosestItem<T>[] {
    return findClosestInIndex(index as SpatialGridIndex<T> , query, limit, resolution)
  }

  return {
    coordsToCellId,
    index,
    findClosestTo,
  }
}
