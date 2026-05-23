import type { Place, PlaceType } from '@/models'

export type GroupedByTypePlaces = Record<PlaceType, Place[]>

export type MarkerType = PlaceType | 'user'
export type MarkerState = 'default' | 'selected' | 'closest'