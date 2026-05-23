import maplibregl from 'maplibre-gl'
import type { FeatureCollection, Point } from 'geojson'

import { SIDE_PANEL_TRANSITION_MS, SIDE_PANEL_DESKTOP_WIDTH } from '@/constants/styles'

import { PlaceType, type MapEntity, type Place, type User } from '@/models'
import type { MarkerType } from '@/types'
import { mapIconService } from './map-icon-service'

type MarkerClickCallback = (id: string, type: 'user' | 'place') => void

export class MapService {

    static readonly MARKER_HEIGHT = 48

    areImagesLoaded: Promise<void>

    private selectedUserId: string = ''
    private selectedPlaceId: string = ''
    private selectedPlaceType: PlaceType | null = null

    private markerClickCallback: MarkerClickCallback | null = null

    constructor(private map: maplibregl.Map) {
        this.areImagesLoaded = this.addCustomMarkers()
    }

    /**
     * Adjusts the map's right padding
     * so the visible center accounts for the side panel
     *
     * @param isSidePanelExpanded side panel state
     */
    shiftMapCenter(isSidePanelExpanded: boolean): void {
        this.map.easeTo({
            padding: { right: isSidePanelExpanded ? SIDE_PANEL_DESKTOP_WIDTH : 0 },
            duration: SIDE_PANEL_TRANSITION_MS,
        })
    }

    /**
     * Renders places by particular place type
     *
     * @param placeType type of place
     * @param places list of places with the same type
     */
    async renderTypePlaces(placeType: PlaceType, places: Place[]) {
        if (!this.map.isStyleLoaded()) {
            this.map.once('load', () => this.renderTypePlaces(placeType, places))
            return
        }
        await this.areImagesLoaded
        this.renderSource(`places-${placeType}`, placeType, places)
    }

    /**
     * Renders all users as markers on the map
     *
     * @param users list of users
     */
    async renderUsers(users: User[]) {
        if (!this.map.isStyleLoaded()) {
            this.map.once('load', () => this.renderUsers(users))
            return
        }
        await this.areImagesLoaded
        this.renderSource('users', 'user', users)
    }

    /**
     * Shows/hides layers with places on the map.
     * Empty set means default state — all types are shown.
     *
     * @param activePlaceTypes set of types which should be displayed
     */
    filterPlaces(activePlaceTypes: Set<PlaceType>): void {
        if (!this.map.isStyleLoaded()) {
            this.map.once('load', () => this.filterPlaces(activePlaceTypes))
            return
        }

        const showAll = activePlaceTypes.size === 0

        for (const placeType of Object.values(PlaceType)) {
            const layerId = `places-${placeType}`
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
    onMarkerClick(callback: MarkerClickCallback) {
        this.markerClickCallback = callback
    }

    /**
     * Changes user marker to the 'selected' state
     *
     * @param id user id
     */
    selectUser(id: string): void {
        if (id === this.selectedUserId) {
            return
        }

        this.unselectUser(this.selectedUserId)
        this.selectMarker('users', id)
        this.selectedUserId = id
    }

    unselectUser(id: string): void {
        if (id !== this.selectedUserId) {
            return
        }

        this.unselectMarker('users')
        this.selectedUserId = ''
    }

    resetUserSelection(): void {
        this.unselectUser(this.selectedUserId)
    }

    /**
     * Changes place marker to the 'selected' state
     *
     * @param id place id
     * @param type place type
     */
    selectPlace(id: string, type: PlaceType): void {
        if (id === this.selectedPlaceId || type === this.selectedPlaceType) {
            return
        }

        this.unselectPlace(this.selectedPlaceId, this.selectedPlaceType)
        this.selectMarker(`places-${type}`, id)
        this.selectedPlaceId = id
        this.selectedPlaceType = type
    }

    unselectPlace(id: string, type: PlaceType | null): void {
        if (!id || !type || id !== this.selectedPlaceId || type !== this.selectedPlaceType) {
            return
        }

        this.unselectMarker(`places-${type}`)
        this.selectedPlaceId = ''
        this.selectedPlaceType = null
    }

    resetPlaceSelection(): void {
        this.unselectPlace(this.selectedPlaceId, this.selectedPlaceType)
    }

    resetSelection(): void {
        this.resetUserSelection()
        this.resetPlaceSelection()
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
     * Sets the marker on the map to 'selected' state
     * 
     * @param featureId id of User or Place
     */
    private selectMarker(sourceId: string, featureId: string): void {
        this.map.setFilter(sourceId, ['!=', ['get', 'id'], featureId])
        this.map.setFilter(`${sourceId}__selected`, ['==', ['get', 'id'], featureId])
    }

    /**
     * Resets marker state from 'selected' to 'default
     * 
     */
    private unselectMarker(sourceId: string): void {
        this.map.setFilter(sourceId, null)
        this.map.setFilter(`${sourceId}__selected`, ['==', ['get', 'id'], ''])
    }

    /**
     * Creates map source or updates it if it's already exist
     * 
     * @param iconType specific for data type icon
     * @param entities list of users or places
     */
    private renderSource(sourceId: string, iconType: MarkerType, entities: MapEntity[]): void {
        const data = this.toGeoJSON(entities)

        const source = this.map.getSource(sourceId)
        if (source) {
            (source as maplibregl.GeoJSONSource).setData(data)
            return
        }

        const callbackType: 'user' | 'place' = iconType === 'user' ? 'user' : 'place'

        this.map.addSource(sourceId, { type: 'geojson', data })

        this.addSymbolLayer(sourceId, sourceId, mapIconService.getMarkerId(iconType, 'default'))
        this.bindLayerEvents(sourceId, callbackType)

        const selectedLayerId = `${sourceId}__selected`
        this.addSymbolLayer(selectedLayerId, sourceId, mapIconService.getMarkerId(iconType, 'selected'), ['==', ['get', 'id'], ''])
    }

    /**
     * Converts list of users or places to geoJSON
     * 
     * @param entities User[] | Place[]
     * @returns geoJSON to set in a source
     */
    private toGeoJSON(entities: MapEntity[]): FeatureCollection<Point> {
        return {
            type: 'FeatureCollection',
            features: entities.map(({ id, name, coordinates }) => ({
                type: 'Feature',
                geometry: { type: 'Point', coordinates },
                properties: { id, name },
            })),
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
            this.markerClickCallback(id, type)
        })
    }
}
