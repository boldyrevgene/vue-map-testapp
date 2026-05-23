export type LngLat = [lng: number, lat: number]

export interface MapEntity {
    id: string
    name: string
    coordinates: LngLat
}

export enum PlaceType {
    Building = 'building',
    Transport = 'transport',
    Sport = 'sport',
    Food = 'food',
    Shop = 'shop',
}

export interface Place extends MapEntity {
    type: PlaceType
    description?: string
}

export interface SelectedPlace {
    place: Place,
    state: 'view' | 'edit'
}

export type User = MapEntity
