export type LngLat = [lng: number, lat: number]

export interface MapEntity {
    id: string
    name: string
    coordinates: LngLat
}

export type MapEntitiesIndex = Map<string, number>

export function buildEntitiesIndex(entities: MapEntity[]): MapEntitiesIndex {
    return new Map(
        entities.map((entity, index) => [entity.id, index])
    )
}

export enum PlaceType {
    Building = 'building',
    Transport = 'transport',
    Sport = 'sport',
    Food = 'food',
    Shop = 'shop',
}

export const PLACE_TYPES_LIST = Object.values(PlaceType)

export interface Place extends MapEntity {
    type: PlaceType
    description?: string
}

export interface SelectedPlace {
    place: Place,
    state: 'view' | 'edit'
}


//events that fire when server successfully handled operation on single a place item
export type PlaceEventType = 'created' | 'updated' | 'deleted'
export interface PlaceEvent {
    action: PlaceEventType
    place: Place
}

export type User = MapEntity
