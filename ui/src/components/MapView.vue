<script setup lang="ts">
import { useTemplateRef, onMounted, onUnmounted, watch } from 'vue'
import { storeToRefs } from 'pinia'
import maplibregl from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'

import { SIDE_PANEL_TRANSITION_MS, SIDE_PANEL_DESKTOP_WIDTH } from '@/constants/styles'

import { useAppStore } from '@/stores/app-store.ts'

let map: maplibregl.Map | null = null

const containerRef = useTemplateRef<HTMLDivElement>('mapContainer')

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
})

onUnmounted(() => {
    map?.remove()
})

const { isSidePanelExpanded } = storeToRefs(useAppStore())

// moves center of map according to side panel state
watch(isSidePanelExpanded, (isExpanded) => {
    if (!map) {
        return
    }

    if (isExpanded) {
        map.easeTo({
            padding: { right: SIDE_PANEL_DESKTOP_WIDTH },
            duration: SIDE_PANEL_TRANSITION_MS,
        })
    } else {
        map.easeTo({
            padding: { right: 0 },
            duration: SIDE_PANEL_TRANSITION_MS,
        })
    }
}, { immediate: true })

</script>

<template>
    <div ref="mapContainer" class="map-view">
    </div>
</template>

<style scoped lang="scss">

</style>
