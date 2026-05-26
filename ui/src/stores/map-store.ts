import { ref, watch } from 'vue'
import { defineStore, storeToRefs } from 'pinia'

import { PlaceType } from '@/models'
import { usePlacesStore } from './places-store'
import { useUsersStore } from './users-store'
import { useUsersGridIndex } from '@/composables'


export const useMapStore = defineStore('mapStore', () => {
    const { selectedPlace } = storeToRefs(usePlacesStore())
    const { selectedUser } = storeToRefs(useUsersStore())

    // for filters - contains types which should be displayed on the map
    const activePlaceTypes = ref<Set<PlaceType>>(new Set())
    function filterPlaces(placeTypes: PlaceType[]) {
        activePlaceTypes.value = new Set(placeTypes)
    }

    // only a single selection at the same time
    const { resetSelection: resetPlaceSelection } = usePlacesStore()
    const { resetSelection: resetUserSelection } = useUsersStore()
    watch(selectedUser, (user) => {
        if (user) {
            resetPlaceSelection()
        }
    })
    const { findClosestUsers, closestUsers } = useUsersGridIndex()
    watch(selectedPlace, (place) => {
        if (place) {
            resetUserSelection()
            findClosestUsers(place.place.coordinates)
        } else {
            closestUsers.value = []
        }
    })

    return {
        activePlaceTypes,
        filterPlaces,
    }
})
function findClosestUsers() {
    throw new Error('Function not implemented.')
}

