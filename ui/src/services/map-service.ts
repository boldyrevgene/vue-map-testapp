import maplibregl from 'maplibre-gl'

import { SIDE_PANEL_TRANSITION_MS, SIDE_PANEL_DESKTOP_WIDTH } from '@/constants/styles'

import type { PlaceType } from '@/models'
import type { GroupedByTypePlaces } from '@/types'

export class MapService {
    constructor(private map: maplibregl.Map) {
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
     * Adds/updates map layers with places grouped by place type
     * 
     * @param places grouped by type places
     */
    renderPlaces(places: GroupedByTypePlaces): void {
        // todo: place markers of places on map
        console.log('Places: ', places)
    }

    /**
     * Shows/hides layers with places on the map
     * 
     * @param activePlaceTypes list of types which should be displayed
     */
    filterPlaces(activePlaceTypes: PlaceType[]): void {
        // todo: show/hide layers with places
    }
}