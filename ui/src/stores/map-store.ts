import { computed, ref } from 'vue'
import { defineStore, storeToRefs } from 'pinia'

import { PlaceType, type ClosestUser } from '@/models'
import { haversineDistance } from '@/utils/geo'
import { usePlacesStore } from './places-store'
import { useUsersStore } from './users-store'
import { CLOSEST_USERS_DISPLAY_COUNT } from '@/constants'


export const useMapStore = defineStore('mapStore', () => {
    const { selectedPlace } = storeToRefs(usePlacesStore())
    const { users } = storeToRefs(useUsersStore())

    // for filters - contains types which should be displayed on the map
    const activePlaceTypes = ref<Set<PlaceType>>(new Set())
    function filterPlaces(placeTypes: PlaceType[]) {
        activePlaceTypes.value = new Set(placeTypes)
    }

    const closestUsers = computed<ClosestUser[]>(() => {
        if (!selectedPlace.value) return []

        const coords = selectedPlace.value.place.coordinates
        return users.value
            .map<ClosestUser>(user => ({ user, distance: haversineDistance(coords, user.coordinates) }))
            .sort((a, b) => a.distance - b.distance)
            .slice(0, CLOSEST_USERS_DISPLAY_COUNT)
            
    })

    return {
        activePlaceTypes,
        filterPlaces,
        closestUsers,
    }
})
