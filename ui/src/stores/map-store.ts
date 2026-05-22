import { computed, ref } from 'vue'
import { defineStore, storeToRefs } from 'pinia'

import { PlaceType, type Place } from '@/models'
import type { GroupedByTypePlaces } from '@/types'
import { usePlacesStore } from './places-store'


export const useMapStore = defineStore('mapStore', () => {
    const { places } = storeToRefs(usePlacesStore())

    const activePlaceTypes = ref<PlaceType[]>([])

    const placesGroupedByType = computed<GroupedByTypePlaces>(() => {
        return places.value.reduce((grouped, place) => {
            if (!grouped[place.type]) {
                grouped[place.type] = []
            }

            grouped[place.type]?.push(place)

            return grouped
        }, {} as GroupedByTypePlaces)
    })

    function filterPlaces(placeTypes: PlaceType[]) {
        activePlaceTypes.value = placeTypes
    }

    return {
        activePlaceTypes,
        placesGroupedByType,
        filterPlaces
    }
})
