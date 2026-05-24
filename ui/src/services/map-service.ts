import maplibregl, { GeoJSONSource, type SourceSpecification } from 'maplibre-gl'

import { SIDE_PANEL_TRANSITION_MS, SIDE_PANEL_DESKTOP_WIDTH } from '@/constants/styles'

import { PlaceType, type MapEntity, type Place, type User } from '@/models'
import { mapIconService } from './map-icon-service'

type MarkerClickCallback = (id: string, type: 'user' | 'place') => void

export interface SelectionSnapshot {
    selectedPlace: Place | null
    selectedUser: User | null
    closestUsers: User[]
}

export interface MapPublicApi {
    setPlaces(places: Place[]): void
    addPlace(place: Place): void
    removePlace(place: Place): void
    filterPlaces(activePlaceTypes: Set<PlaceType>): void

    setUsers(users: User[]): void

    setSelection(snapshot: SelectionSnapshot): void

    onMarkerClick(callback: MarkerClickCallback): void

    shiftMapCenter(isSidePanelExpanded: boolean): void
}
export type OnLoadCallback = (map: MapPublicApi) => void

export class MapService {

    static readonly MARKER_HEIGHT = 48
    static readonly USERS_SOURCE_ID = 'users'

    areImagesLoaded: Promise<void>

    private markerClickCallback: MarkerClickCallback | null = null

    // prevents user to use any of method before maplibregl.Map full initialization 
    private publicApi: MapPublicApi = {
        setPlaces: this.setPlaces.bind(this),
        addPlace: this.addPlace.bind(this),
        removePlace: this.removePlace.bind(this),
        filterPlaces: this.filterPlaces.bind(this),

        setUsers: this.setUsers.bind(this),

        setSelection: this.setSelection.bind(this),

        onMarkerClick: this.onMarkerClick.bind(this),

        shiftMapCenter: this.shiftMapCenter.bind(this),
    }

    private placesByType: Map<PlaceType, Place[]> = new Map()

    // list of features grouped by a geoJSONSource id
    private features: Map<string, Map<string, MapEntity>> = new Map()

    constructor(private map: maplibregl.Map) {
        this.areImagesLoaded = this.addCustomMarkers()

        Object.values(PlaceType).forEach(placeType => {
            this.placesByType.set(placeType, [])
            this.features.set(this.getPlaceSourceId(placeType), new Map())
        })
        this.features.set(MapService.USERS_SOURCE_ID, new Map())
    }

    /**
     * Provides access to the MapService API when the map is ready to use
     * 
     * @param callback - callback function for work with the map API
     */
    async onLoad(callback: OnLoadCallback): Promise<void> {
        if (!this.map.isStyleLoaded()) {
            this.map.once('load', () => this.onLoad(callback))
            return
        }
        await this.areImagesLoaded

        // Sets up sources for places (for each place type separetely)
        for (const placeType of Object.values(PlaceType)) {
            const sourceId = this.getPlaceSourceId(placeType)
            this.map.addSource(sourceId, this.getSourceTemplate())

            // markers default state layer
            this.addSymbolLayer(sourceId, sourceId, mapIconService.getMarkerId(placeType, 'default'))
            this.bindLayerEvents(sourceId, 'place')

            // marker selected state layer
            this.addSymbolLayer(
                `${sourceId}__selected`,
                sourceId,
                mapIconService.getMarkerId(placeType, 'selected'),
                ['==', ['get', 'id'], '']
            )
        }

        // Sets up source for users
        const usersSourceId = MapService.USERS_SOURCE_ID
        this.map.addSource(usersSourceId, this.getSourceTemplate())

        // markers default state layer
        this.addSymbolLayer(usersSourceId, usersSourceId, mapIconService.getMarkerId('user', 'default'))
        this.bindLayerEvents(usersSourceId, 'user')

        // markers closest state layer
        const closestLayerId = `${usersSourceId}__closest`
        this.addSymbolLayer(
            `${usersSourceId}__closest`,
            usersSourceId,
            mapIconService.getMarkerId('user', 'closest'),
            ['==', ['get', 'id'], '']
        )
        this.bindLayerEvents(closestLayerId, 'user')

        // markers selected state layer
        this.addSymbolLayer(
            `${usersSourceId}__selected`,
            usersSourceId,
            mapIconService.getMarkerId('user', 'selected'),
            ['==', ['get', 'id'], '']
        )

        callback.call(this, this.publicApi)
    }

    /**
     * Sets/Resets places on the map
     * 
     * @param places - list of places
     */
    private setPlaces(places: Place[]): void {

        // reset
        for (const placeType of this.placesByType.keys()) {
            this.placesByType.set(placeType, [])
            this.features.set(this.getPlaceSourceId(placeType), new Map())
        }

        // populate
        for (const place of places) {
            this.addToPlaceType(place)
            this.addToFeatures(this.getPlaceSourceId(place.type), place)
        }

        // sync to map
        for (const placeType of this.placesByType.keys()) {
            const sourceId = this.getPlaceSourceId(placeType)
            const source = this.map.getSource<GeoJSONSource>(sourceId)
            if (!source) {
                continue
            }

            source.setData({
                type: 'FeatureCollection',
                features: this.entitiesToFeatures(this.placesByType.get(placeType) || [])
            })
        }
    }

    /**
     * Adds single place on the map
     * 
     * @param place - place instance
     */
    private addPlace(place: Place): void {
        const sourceId = this.getPlaceSourceId(place.type)

        const source = this.map.getSource<GeoJSONSource>(sourceId)
        if (!source) {
            return
        }

        source.updateData({
            add: this.entitiesToFeatures([place])
        })

        this.addToFeatures(sourceId, place)
        this.addToPlaceType(place)
    }

    private addToFeatures(sourceId: string, entity: MapEntity) {
        this.features.get(sourceId)?.set(entity.id, entity)
    }

    private addToPlaceType(place: Place) {
        this.placesByType.get(place.type)?.push(place)
    }

    /**
     * Removes single place from the map
     * 
     * @param place - place instance
     * @returns 
     */
    private removePlace(place: Place): void {
        const sourceId = this.getPlaceSourceId(place.type)

        const source = this.map.getSource<GeoJSONSource>(sourceId)
        if (!source) {
            return
        }

        source.updateData({
            remove: [place.id]
        })

        this.removeFromFeatures(sourceId, place)
        this.removeFromPlaceType(place)
    }

    private removeFromFeatures(sourceId: string, entity: MapEntity) {
        this.features.get(sourceId)?.delete(entity.id)
    }

    private removeFromPlaceType(place: Place) {
        const byType = this.placesByType.get(place.type)
        if (!byType) {
            return
        }

        const index = byType.findIndex(({id}) => id === place.id)
        if (index < 0 ) {
            return
        }

        byType.splice(index, 1)
    }

    private setUsers(users: User[]): void {
        const sourceId = MapService.USERS_SOURCE_ID
        const source = this.map.getSource<GeoJSONSource>(sourceId)

        if (!source) {
            return
        }

        // reset
        this.features.set(sourceId, new Map())

        // populate
        for (const user of users) {
            this.addToFeatures(sourceId, user)
        }

        // sync to map
        source.setData({
            type: 'FeatureCollection',
            features: this.entitiesToFeatures(users)
        })
    }

    private entitiesToFeatures(entities: MapEntity[]): GeoJSON.Feature[] {
        return entities.map(({ id, name, coordinates }) => ({
            type: 'Feature',
            geometry: { type: 'Point', coordinates },
            properties: { id, name },
        }))
    }

    private getSourceTemplate(): SourceSpecification {
        return {
            type: 'geojson',
            data: {
                type: 'FeatureCollection',
                features: []
            }
        }
    }

    /**
     * Returns the source id for a places layer of the given type.
     * Use USERS_SOURCE_ID for users.
     *
     * @param type place type
     */
    private getPlaceSourceId(type: PlaceType): string {
        return `places-${type}`
    }

    /**
     * Adjusts the map's right padding
     * so the visible center accounts for the side panel
     *
     * @param isSidePanelExpanded side panel state
     */
    private shiftMapCenter(isSidePanelExpanded: boolean): void {
        this.map.easeTo({
            padding: { right: isSidePanelExpanded ? SIDE_PANEL_DESKTOP_WIDTH : 0 },
            duration: SIDE_PANEL_TRANSITION_MS,
        })
    }

    /**
     * Shows/hides layers with places on the map.
     * Empty set means default state — all types are shown.
     *
     * @param activePlaceTypes set of types which should be displayed
     */
    private filterPlaces(activePlaceTypes: Set<PlaceType>): void {
        if (!this.map.isStyleLoaded()) {
            this.map.once('load', () => this.filterPlaces(activePlaceTypes))
            return
        }

        const showAll = activePlaceTypes.size === 0

        for (const placeType of Object.values(PlaceType)) {
            const layerId = this.getPlaceSourceId(placeType)
            if (!this.map.getLayer(layerId)) {
                continue
            }

            const visibility = (showAll || activePlaceTypes.has(placeType)) ? 'visible' : 'none'
            this.map.setLayoutProperty(layerId, 'visibility', visibility)

            const selectedLayerId = `${layerId}__selected`
            if (this.map.getLayer(selectedLayerId)) {
                this.map.setLayoutProperty(selectedLayerId, 'visibility', visibility)
            }
        }
    }

    /**
     * Registers calback for marker click event.
     * Allows to get info about clicked maker on the map
     * 
     * @param callback calls on map.on('click')
     */
    private onMarkerClick(callback: MarkerClickCallback): void {
        this.markerClickCallback = callback
    }

    /**
     * Applies a full selection snapshot to the map.
     * Recomputes all user/place layer filters from the snapshot
     *
     * TODO: optimize by diffing the incoming snapshot against the previously
     * applied one and updating only the marker groups that actually changed,
     * to avoid setFilter calls on layers whose state stays the same.
     *
     * @param snapshot full selection state — selected place, selected user, closest users
     */
    private setSelection(snapshot: SelectionSnapshot): void {
        this.setUserMarkerStates(snapshot.selectedUser, snapshot.closestUsers)
        this.setPlaceMarkerStates(snapshot.selectedPlace)
    }

    /**
     * Loads custom icons to the map instance.
     * For each user and place type own icon with several states ('default' | 'selected' | 'closest')
     * Icons are rasterized at MARKER_HEIGHT * devicePixelRatio for hier quality render;
     * pixelRatio passed to addImage tells maplibre the intended CSS size.
     */
    private async addCustomMarkers() {
        const dpr = window.devicePixelRatio || 1
        const rasterHeight = MapService.MARKER_HEIGHT * dpr

        const placeStates = ['default', 'selected'] as const
        for (const placeType of Object.values(PlaceType)) {
            for (const state of placeStates) {
                const image = await mapIconService.getMarkerImage(placeType, state, rasterHeight)
                this.map.addImage(mapIconService.getMarkerId(placeType, state), image, { pixelRatio: dpr })
            }
        }

        const userStates = [...placeStates, 'closest'] as const
        for (const state of userStates) {
            const image = await mapIconService.getMarkerImage('user', state, rasterHeight)
            this.map.addImage(mapIconService.getMarkerId('user', state), image, { pixelRatio: dpr })
        }
    }

    /**
     * Sets each user marker to its visual state — default, selected or closest —
     * according to the given selection.
     * Implementation switches per-state layers' filters so every user feature
     * is shown only on the layer that matches its current state.
     *
     * @param selectedUser currently selected user, or null
     * @param closestUsers currently highlighted closest users
     */
    private setUserMarkerStates(selectedUser: User | null, closestUsers: User[]): void {
        const selectedId = selectedUser?.id ?? ''
        const closestIds = closestUsers.map(({ id }) => id)
        const specialIds = selectedId ? [...closestIds, selectedId] : closestIds

        const usersSourceId = MapService.USERS_SOURCE_ID

        this.map.setFilter(usersSourceId,
            specialIds.length ? ['!', ['in', ['get', 'id'], ['literal', specialIds]]] : null
        )
        this.map.setFilter(`${usersSourceId}__selected`,
            selectedId ? ['==', ['get', 'id'], selectedId] : ['==', ['get', 'id'], '']
        )
        this.map.setFilter(`${usersSourceId}__closest`,
            closestIds.length
                ? ['all', ['in', ['get', 'id'], ['literal', closestIds]], ['!=', ['get', 'id'], selectedId]]
                : ['==', ['get', 'id'], '']
        )
    }

    /**
     * Sets each place marker to its visual state — default or selected —
     * across every place type.
     * Implementation switches per-state layers' filters so the selected place
     * appears only on its type's selected layer, while all other places stay default.
     *
     * @param selectedPlace currently selected place, or null
     */
    private setPlaceMarkerStates(selectedPlace: Place | null): void {
        const selectedId = selectedPlace?.id ?? ''
        const selectedType = selectedPlace?.type ?? null

        for (const placeType of Object.values(PlaceType)) {
            const sourceId = this.getPlaceSourceId(placeType)
            const isSelectedType = placeType === selectedType

            this.map.setFilter(sourceId,
                isSelectedType ? ['!=', ['get', 'id'], selectedId] : null
            )
            this.map.setFilter(`${sourceId}__selected`,
                isSelectedType ? ['==', ['get', 'id'], selectedId] : ['==', ['get', 'id'], '']
            )
        }
    }

    /**
     * Adds markers to the map source
     * 
     * @param iconId specific to data type and it's state icon
     * @param filter used for filtering by marker state ('default' | 'selected' | 'closest')
     */
    private addSymbolLayer(
        layerId: string,
        sourceId: string,
        iconId: string,
        filter?: maplibregl.FilterSpecification,
    ): void {
        const layer: maplibregl.LayerSpecification = {
            id: layerId,
            type: 'symbol',
            source: sourceId,
            layout: {
                'icon-image': iconId,
                'icon-size': 1,
                'icon-anchor': 'bottom',
                'icon-allow-overlap': true,
            },
        }

        if (filter) {
            layer.filter = filter
        }

        this.map.addLayer(layer)
    }

    private bindLayerEvents(layerId: string, type: 'user' | 'place'): void {
        this.map.on('mouseenter', layerId, () => {
            this.map.getCanvas().style.cursor = 'pointer'
        })

        this.map.on('mouseleave', layerId, () => {
            this.map.getCanvas().style.cursor = ''
        })

        this.map.on('click', layerId, (event) => {
            const feature = event.features?.[0]
            if (!feature || !this.markerClickCallback) {
                return
            }

            const id = feature.properties?.id as string
            this.markerClickCallback.call(this, id, type)
        })
    }
}
