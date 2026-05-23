export type LngLat = [lng: number, lat: number]

export interface MapEntity {
    id: string
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
    name: string
    type: PlaceType
    description?: string
}

export interface SelectedPlace {
    place: Place,
    state: 'view' | 'edit'
}

export interface User extends MapEntity {
    name: string
}
