<script setup lang="ts">
import { useTemplateRef, onMounted, onUnmounted, watch } from 'vue'
import { storeToRefs } from 'pinia'
import maplibregl from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'

import { MapService } from '@/services'

import { useAppStore } from '@/stores/app-store'
import { usePlacesStore } from '@/stores/places-store'
import { useMapStore } from '@/stores/map-store'
import { PlaceType, type Place } from '@/models'
import * as mapConstants from '@/constants/map'

const containerRef = useTemplateRef<HTMLDivElement>('mapContainer')

const { placesGroupedByType, activePlaceTypes } = storeToRefs(useMapStore())
const { fetchPlaces } = usePlacesStore()

let map: maplibregl.Map | null = null
onMounted(() => {
    if (!containerRef.value) {
        return
    }

    map = new maplibregl.Map({
        container: containerRef.value,
        style: 'https://tiles.openfreemap.org/styles/bright',
        center: mapConstants.MAP_INIT_CENTER,
        zoom: mapConstants.MAP_INIT_ZOOM,
        attributionControl: false,
    })

    // attribution control collides with side panel if its position is default
    map.addControl(new maplibregl.AttributionControl({ compact: false }), 'bottom-left')

    const mapService = new MapService(map)
    fetchPlaces()

    const { isSidePanelExpanded } = storeToRefs(useAppStore())

    watch(isSidePanelExpanded, (isExpanded) => mapService.shiftMapCenter(isExpanded))

    // watch each place type separately for single type update only, when possible
    for (let placeType of Object.values(PlaceType)) {
        watch(() => placesGroupedByType.value[placeType], (places: Place[]) => {
            mapService.renderTypePlaces(placeType, places)
            // re-apply filter so a newly-created layer respects current state
            mapService.filterPlaces(activePlaceTypes.value)
        })
    }

    watch(activePlaceTypes, (types) => mapService.filterPlaces(types))
})

onUnmounted(() => {
    map?.remove()
})

</script>

<template>
    <div ref="mapContainer" class="map-view">
    </div>
</template>

<style scoped lang="scss">

</style>
