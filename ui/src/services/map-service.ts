import maplibregl from 'maplibre-gl'
import type { FeatureCollection, Point } from 'geojson'

import { SIDE_PANEL_TRANSITION_MS, SIDE_PANEL_DESKTOP_WIDTH } from '@/constants/styles'

import { PlaceType, type Place } from '@/models'
import type { MarkerState } from '@/types'
import { mapIconService } from './map-icon-service'

export class MapService {

    static readonly MARKER_HEIGHT = 48

    areImagesLoaded: Promise<void>

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
        if (isSidePanelExpanded) {
            this.map.easeTo({
                padding: { right: SIDE_PANEL_DESKTOP_WIDTH },
                duration: SIDE_PANEL_TRANSITION_MS,
            })
        } else {
            this.map.easeTo({
                padding: { right: 0 },
                duration: SIDE_PANEL_TRANSITION_MS,
            })
        }
    }

    /**
     * Renders places by particular place type
     * 
     * @param placeType type of place
     * @param places list of places with the same type
     * @returns 
     */
    async renderTypePlaces(placeType: PlaceType, places: Place[]) {
        if (!this.map.isStyleLoaded()) {
            this.map.once('load', () => this.renderTypePlaces(placeType, places))
            return
        }
        await this.areImagesLoaded

        const sourceId = `places-${placeType}`
        const sourceData = this.getPlacesGeoJSON(places)

        const source = this.map.getSource(sourceId)
        if (source) {
            (source as maplibregl.GeoJSONSource).setData(sourceData)
            return
        }

        this.map.addSource(sourceId, { type: 'geojson', data: sourceData })

        this.map.addLayer({
            id: sourceId,
            type: 'symbol',
            source: sourceId,
            layout: {
                'icon-image': mapIconService.getMarkerId(placeType, 'default'),
                'icon-size': 1,
                'icon-anchor': 'bottom',
                'icon-allow-overlap': true,
            },
        })

        this.bindEnventsOnPlaces(sourceId)
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

        for (let placeType of Object.values(PlaceType)) {
            const layerId = `places-${placeType}`
            if (!this.map.getLayer(layerId)) {
                continue
            }

            const isVisible = showAll || activePlaceTypes.has(placeType)
            this.map.setLayoutProperty(
                layerId,
                'visibility',
                isVisible ? 'visible' : 'none',
            )
        }
    }

    /**
     * Loads custom icons to the map instance.
     * Icons are rasterized at MARKER_HEIGHT * devicePixelRatio so they stay crisp
     * on high-DPI displays; pixelRatio passed to addImage tells maplibre
     * the intended CSS size.
     */
    private async addCustomMarkers() {
        const dpr = window.devicePixelRatio || 1
        const rasterHeight = MapService.MARKER_HEIGHT * dpr

        // places markers
        const placeStates = ['default', 'selected'] as const
        for (let placeType of Object.values(PlaceType)) {
            for (let markerState of placeStates) {
                const placeImage = await mapIconService.getMarkerImage(placeType, markerState, rasterHeight)
                this.map.addImage(
                    mapIconService.getMarkerId(placeType, markerState),
                    placeImage,
                    { pixelRatio: dpr },
                )
            }
        }

        // user marker with states
        const userStates = [...placeStates, 'closest'] as const
        for (let markerState of userStates) {
            const userImage = await mapIconService.getMarkerImage('user', markerState, rasterHeight)
            this.map.addImage(
                mapIconService.getMarkerId('user', markerState),
                userImage,
                { pixelRatio: dpr },
            )
        }
    }

    private getPlacesGeoJSON(places: Place[]): FeatureCollection<Point> {
        return {
            type: 'FeatureCollection',
            features: places.map(place => {

                const { id, name, coordinates } = place

                return {
                    type: 'Feature',
                    geometry: {
                        type: 'Point',
                        coordinates
                    },
                    properties: {id, name},
                }
            }),
        }
    }

    private bindEnventsOnPlaces(layerId: string) {
        this.map.on('mouseenter', layerId, () => {
            this.map.getCanvas().style.cursor = 'pointer'
        })

        this.map.on('mouseleave', layerId, () => {
            this.map.getCanvas().style.cursor = ''
        })
    }
}