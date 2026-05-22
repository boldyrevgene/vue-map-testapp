import type { Place, PlaceType } from '@/models'

export type GroupedByTypePlaces = Partial<Record<PlaceType, Place[]>>
