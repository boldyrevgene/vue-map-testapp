<script setup lang="ts">
import {
    useTemplateRef,
    onMounted,
    onUnmounted,
    watch,
    toRaw,
    computed,
    effectScope,
} from 'vue'
import { storeToRefs } from 'pinia'
import maplibregl from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'

import { MapService } from '@/services'

import {
    useAppStore,
    useMapStore,
    usePlacesStore,
    useUsersStore
} from '@/stores'
import * as mapConstants from '@/constants/map'

const containerRef = useTemplateRef<HTMLDivElement>('mapContainer')

const appStore = useAppStore()
const mapStore = useMapStore()
const placesStore = usePlacesStore()
const usersStore = useUsersStore()

const { isSidePanelExpanded } = storeToRefs(appStore)
const {
    activePlaceTypes,
    closestUsers,
} = storeToRefs(mapStore)
const { places, selectedPlace } = storeToRefs(placesStore)
const { users, selectedUser } = storeToRefs(usersStore)

const { fetchPlaces, selectPlace } = placesStore
const { fetchUsers, selectUser } = usersStore

const selectionSnapshot = computed(() => ({
    selectedPlace: selectedPlace.value?.place ?? null,
    selectedUser: selectedUser.value,
    closestUsers: closestUsers.value
        .map(({ user }) => user),
}))

let maplibreInst: maplibregl.Map | null = null
const scope = effectScope()

onMounted(() => {
    if (!containerRef.value) {
        return
    }

    maplibreInst = new maplibregl.Map({
        container: containerRef.value,
        style: {
            version: 8,
            sources: {
                osm: {
                    type: 'raster',
                    tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
                    tileSize: 256,
                    attribution: '© OpenStreetMap contributors',
                },
            },
            layers: [{ id: 'osm', type: 'raster', source: 'osm' }],
        },
        center: mapConstants.MAP_INIT_CENTER,
        zoom: mapConstants.MAP_INIT_ZOOM,
        attributionControl: false,
    })

    // attribution control collides with side panel if its position is default
    maplibreInst.addControl(new maplibregl.AttributionControl({ compact: false }), 'bottom-left')

    const mapService = new MapService(maplibreInst)
    fetchPlaces()
    fetchUsers()

    mapService.onLoad(map => {

        scope.run(() => {

            if (places.value.length) {
                map.setPlaces(toRaw(places.value))
            } else {
                watch(places, (loadedPlaces) => map.setPlaces(toRaw(loadedPlaces)), { once: true })
            }

            if (users.value.length) {
                map.setUsers(toRaw(users.value))
            } else {
                watch(users, (loadedUsers) => map.setUsers(toRaw(loadedUsers)), { once: true })
            }

            // applys places filter
            watch(activePlaceTypes, (types) => map.filterPlaces(types))

            // syncs the full selection snapshot (place + user + closest users) to the map
            watch(selectionSnapshot, (snapshot) => map.setSelection(toRaw(snapshot)), { immediate: true })

            watch(isSidePanelExpanded, (isExpanded) => map.shiftMapCenter(isExpanded || false))

            map.onMarkerClick((id, type) => {
                if (type === 'user') {
                    selectUser(id)
                }

                if (type === 'place') {
                    selectPlace(id)
                }
            })
        })
    })
})

onUnmounted(() => {
    scope.stop()
    maplibreInst?.remove()
})

</script>

<template>
    <div ref="mapContainer" class="map-view">
    </div>
</template>

<style scoped lang="scss">

</style>
