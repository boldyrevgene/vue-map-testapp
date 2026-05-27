<script setup lang="ts">
import {
    useTemplateRef,
    onMounted,
    onUnmounted,
    onScopeDispose,
    watch,
    toRaw,
    computed,
    effectScope,
} from 'vue'
import { storeToRefs } from 'pinia'
import maplibregl from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'

import { MapService, type WsUserUpdateMsg } from '@/services'
import { useIsMobile } from '@/composables'
import {
    useAppStore,
    useMapStore,
    usePlacesStore,
    useUsersStore
} from '@/stores'
import * as mapConstants from '@/constants/map'
import { SIDE_PANEL_DESKTOP_WIDTH, SIDE_PANEL_MOBILE_HEIGHT_DVH } from '@/constants/styles'
import { useUsersGridIndex } from '@/composables'

const containerRef = useTemplateRef<HTMLDivElement>('mapContainer')

const { isMobile } = useIsMobile()

const appStore = useAppStore()
const mapStore = useMapStore()
const placesStore = usePlacesStore()
const usersStore = useUsersStore()

const { isSidePanelExpanded } = storeToRefs(appStore)
const { activePlaceTypes } = storeToRefs(mapStore)
const {
    places,
    selectedPlace,
} = storeToRefs(placesStore)
const { selectedUser } = storeToRefs(usersStore)
const { closestUsers, index: usersIndex } = useUsersGridIndex()

const { fetchPlaces, selectPlace, addPlaceEventListener } = placesStore
const {
    selectUser,
    addUserUpdatesListener,
    listenUserUpdates,
    stopListenUserUpdates
} = usersStore

const selectionSnapshot = computed(() => ({
    selectedPlace: selectedPlace.value?.place ?? null,
    selectedUser: selectedUser.value,
    closestUsers: closestUsers.value
        .map(({ item }) => item),
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

    const mapService = new MapService(maplibreInst, usersIndex)
    fetchPlaces()

    mapService.onLoad(map => {

        scope.run(() => {

            const cancelUsersListener = addUserUpdatesListener((msg) => {
                if (msg.added.length && !msg.removed.length && !msg.updated.length) {
                    map.setUsers(toRaw(msg.added))
                    return
                }

                map.updateUsers(toRaw(msg))
                    .then(() => mapStore.refreshClosestUsers())
                    .catch((err) => console.warn('Updates users on the map are failed: ', err))
            })
            listenUserUpdates()

            if (places.value.length) {
                map.setPlaces(toRaw(places.value))
            } else {
                watch(places, (loadedPlaces) => map.setPlaces(toRaw(loadedPlaces)), { once: true })
            }

            const unsubscribePlaceEvent = addPlaceEventListener(event => {
                switch (event.action) {
                    case 'created':
                        map.addPlace(event.place, true)
                        break
                    case 'updated':
                        map.updatePlace(event.place)
                        break
                    case 'deleted':
                        map.removePlace(event.place)
                        break
                }
            })
            onScopeDispose(() => {
                cancelUsersListener()
                unsubscribePlaceEvent()
            })

            // applys places filter
            watch(activePlaceTypes, (types) => map.filterPlaces(types))

            // syncs the full selection snapshot (place + user + closest users) to the map
            watch(selectionSnapshot, (snapshot) => map.setSelection(toRaw(snapshot)), { immediate: true })


            // shifts map center according to side panel visibility
            // left/right for desktop view
            // up/down for mobile view
            watch([isSidePanelExpanded, isMobile], ([isExpanded, mobile]) => {
                if (!isExpanded) {
                    map.shiftMapCenter({})
                    return
                }
                map.shiftMapCenter(mobile
                    ? { bottom: Math.round(window.innerHeight * SIDE_PANEL_MOBILE_HEIGHT_DVH / 100) }
                    : { right: SIDE_PANEL_DESKTOP_WIDTH }
                )
            })
            
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
    stopListenUserUpdates()
    maplibreInst?.remove()
})

</script>

<template>
    <div ref="mapContainer" class="map-view">
    </div>
</template>

<style scoped lang="scss">

</style>
