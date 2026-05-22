<script setup lang="ts">
import { useTemplateRef, onMounted, onUnmounted, watch } from 'vue'
import { storeToRefs } from 'pinia'
import maplibregl from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'

import { MapService } from '@/services'

import { useAppStore } from '@/stores/app-store'
import { usePlacesStore } from '@/stores/places-store'
import { useMapStore } from '@/stores/map-store'

const containerRef = useTemplateRef<HTMLDivElement>('mapContainer')

const { placesGroupedByType } = storeToRefs(useMapStore())
const { fetchPlaces } = usePlacesStore()

let map: maplibregl.Map | null = null
let mapService: MapService | null = null
onMounted(() => {
    if (!containerRef.value) {
        return
    }

    map = new maplibregl.Map({
        container: containerRef.value,
        style: 'https://tiles.openfreemap.org/styles/bright',
        center: [30.5234, 50.4501],
        zoom: 12,
        attributionControl: false,
    })

    // collides with side panel if position of attribution control is default
    map.addControl(new maplibregl.AttributionControl({ compact: false }), 'bottom-left')

    mapService = new MapService(map)
    mapService.renderPlaces(placesGroupedByType.value)
    fetchPlaces()
})

onUnmounted(() => {
    map?.remove()
})

const { isSidePanelExpanded } = storeToRefs(useAppStore())

// moves center of map according to side panel state
watch(isSidePanelExpanded, (isExpanded) => {
    mapService?.shiftMapCenter(isExpanded)
})


watch(placesGroupedByType, (places) => {
    mapService?.renderPlaces(places)
})

</script>

<template>
    <div ref="mapContainer" class="map-view">
    </div>
</template>

<style scoped lang="scss">

</style>
