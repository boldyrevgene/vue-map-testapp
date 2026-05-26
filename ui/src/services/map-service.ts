import maplibregl, { GeoJSONSource, type GeoJSONFeatureDiff, type SourceSpecification } from 'maplibre-gl'

import { SIDE_PANEL_TRANSITION_MS } from '@/constants/styles'

import { PLACE_TYPES_LIST, PlaceType, type MapEntity, type Place, type User } from '@/models'
import { mapIconService } from './map-icon-service'

import { useUsersGridIndex } from '@/composables'

const { index: usersIndex } = useUsersGridIndex()

type MarkerClickCallback = (id: string, type: 'user' | 'place') => void

export interface SelectionSnapshot {
    selectedPlace: Place | null
    selectedUser: User | null
    closestUsers: User[]
}

export interface MapPublicApi {
    setPlaces(places: Place[]): void
    addPlace(place: Place, centerOnNewPlace: boolean): void
    updatePlace(place: Place): void
    removePlace(place: Place): void
    filterPlaces(activePlaceTypes: Set<PlaceType>): void

    setUsers(users: User[]): void

    setSelection(snapshot: SelectionSnapshot): void

    onMarkerClick(callback: MarkerClickCallback): void

    shiftMapCenter(padding: MapPadding): void
}

export interface MapPadding {
    right?: number
    bottom?: number
}
export type OnLoadCallback = (map: MapPublicApi) => void

export class MapService {

    static readonly MARKER_HEIGHT = 48
    static readonly USERS_SOURCE_ID = 'users'

    private areImagesLoaded: Promise<void>

    private markerClickCallback: MarkerClickCallback | null = null

    // prevents user to use any of method before maplibregl.Map full initialization 
    private publicApi: MapPublicApi = {
        setPlaces: this.setPlaces.bind(this),
        addPlace: this.addPlace.bind(this),
        updatePlace: this.updatePlace.bind(this),
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

    private selectionSnapshot: SelectionSnapshot = {
        selectedPlace: null,
        selectedUser: null,
        closestUsers: []
    }

    constructor(private map: maplibregl.Map) {
        this.areImagesLoaded = this.addCustomMarkers()

        PLACE_TYPES_LIST.forEach(placeType => {
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
        for (const placeType of PLACE_TYPES_LIST) {
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
    private addPlace(place: Place, centerOnNewPlace = false): void {
        const sourceId = this.getPlaceSourceId(place.type)

        const source = this.map.getSource<GeoJSONSource>(sourceId)
        if (!source) {
            return
        }

        source.updateData({
            add: this.entitiesToFeatures([place])
        })
        if (centerOnNewPlace) {
            this.map.flyTo({
                center: place.coordinates,
                duration: 1500,
            });
        }

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
     * Updates place source
     * 
     * @param place - updated place
     * @returns 
     */
    private updatePlace(place: Place): void {
        const sourceId = this.getPlaceSourceId(place.type)

        const feature = this.features.get(sourceId)?.get(place.id)
        if (feature) {
            const source = this.map.getSource<GeoJSONSource>(sourceId)
            if (!source) {
                return
            }

            source.updateData({
                update: [this.getPlaceFeatureDiff(place, feature as Place)]
            })

            this.features.get(sourceId)?.set(place.id, place)
            return
        } else {

            for (const [currSourceId, currFeatures] of this.features) {
                if (currSourceId === sourceId) {
                    continue
                }

                const currFeature = currFeatures.get(place.id)
                if (!currFeature) {
                    continue
                }

                this.removePlace({ ...place, type: (currFeature as Place).type})
                this.addPlace(place)

                break
            }
        }
    }

    private getPlaceFeatureDiff(newPlace: Place, prevPlace: Place): GeoJSONFeatureDiff {
        const diff: GeoJSONFeatureDiff = {
            id: prevPlace.id
        }

        if (newPlace.name !== prevPlace.name) {
            diff.addOrUpdateProperties = [
                { key: 'name', value: newPlace.name }
            ]
        }

        const { coordinates } = newPlace
        if (coordinates[0] !== prevPlace.coordinates[0] || coordinates[1] !== prevPlace.coordinates[1]) {
            diff.newGeometry = {
                type: 'Point',
                coordinates
            }
        }

        return diff
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
            usersIndex.addItem(user)
        }

        // sync to map
        source.setData({
            type: 'FeatureCollection',
            features: this.entitiesToFeatures(users)
        })
    }

    private entitiesToFeatures(entities: MapEntity[]): GeoJSON.Feature[] {
        return entities.map(({ id, name, coordinates }) => ({
            id,
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
     * Adjusts the map's padding so the visible center accounts for an overlay
     * (side panel on desktop — `right`, or bottom sheet on mobile — `bottom`).
     * Pass an empty object to reset.
     *
     * @param padding side(s) to inset in pixels; unspecified sides are reset to 0
     */
    private shiftMapCenter(padding: MapPadding): void {
        this.map.easeTo({
            padding: { right: 0, bottom: 0, ...padding },
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

        for (const placeType of PLACE_TYPES_LIST) {
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
     * @param snapshot full selection state — selected place, selected user, closest users
     */
    private setSelection(snapshot: SelectionSnapshot): void {
        this.setUserMarkerStates(snapshot.selectedUser, snapshot.closestUsers)
        this.setPlaceMarkerStates(snapshot.selectedPlace)
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
        const usersSourceId = MapService.USERS_SOURCE_ID
        
        const selectedId = selectedUser?.id ?? ''
        const selectedWasChanged = selectedId !== (this.selectionSnapshot.selectedUser?.id ?? '')
        if (selectedWasChanged) {
            this.map.setFilter(`${usersSourceId}__selected`,
                ['==', ['get', 'id'], selectedId || '']
            )
        }

        const closestIds = closestUsers.map(({ id }) => id)
        const prevClosestIds = this.selectionSnapshot.closestUsers.map(({ id }) => id)
        const closestSet = new Set([
            ...closestIds,
            ...prevClosestIds
        ])
        // was not changed if closestSet.size === closestIds.length === prevClosestIds.length
        const closestWasChanged = closestSet.size !== closestIds.length || closestSet.size !== prevClosestIds.length
        if (closestWasChanged) {
            this.map.setFilter(`${usersSourceId}__closest`,
                closestIds.length
                    ? ['all', ['in', ['get', 'id'], ['literal', closestIds]], ['!=', ['get', 'id'], selectedId]]
                    : ['==', ['get', 'id'], '']
            )
        }

        const specialIds = selectedId ? [...closestIds, selectedId] : closestIds
        if (selectedWasChanged || closestWasChanged) {
            this.map.setFilter(usersSourceId,
                specialIds.length
                    ? ['!', ['in', ['get', 'id'], ['literal', specialIds]]]
                    : null
            )
        }

        this.selectionSnapshot.selectedUser = selectedUser
        this.selectionSnapshot.closestUsers = closestUsers
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

        const changedTypes = new Set()
        if (selectedType) {
            changedTypes.add(selectedType)
        }
        if (this.selectionSnapshot.selectedPlace?.type) {
            changedTypes.add(this.selectionSnapshot.selectedPlace?.type)
        }

        // changedTypes.size === 1 means that type was not changed
        if (this.selectionSnapshot.selectedPlace?.id === selectedId && changedTypes.size === 1) {
            return
        }

        for (const changedType of changedTypes) {
            const sourceId = this.getPlaceSourceId(changedType as PlaceType)
            const isSelectedType = changedType === selectedType

            this.map.setFilter(sourceId,
                isSelectedType
                    ? ['!=', ['get', 'id'], selectedId]
                    : null
            )
            this.map.setFilter(`${sourceId}__selected`,
                ['==', ['get', 'id'], selectedId || '']
            )
        }

        this.selectionSnapshot.selectedPlace = selectedPlace
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
        for (const placeType of PLACE_TYPES_LIST) {
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
