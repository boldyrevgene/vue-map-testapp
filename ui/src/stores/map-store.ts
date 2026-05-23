import { computed, ref, watch } from 'vue'
import { defineStore, storeToRefs } from 'pinia'

import { PlaceType, type Place } from '@/models'
import type { GroupedByTypePlaces } from '@/types'
import { usePlacesStore } from './places-store'


export const useMapStore = defineStore('mapStore', () => {
    const { places } = storeToRefs(usePlacesStore())

    // Each place type watched separately so each should be exist from the beginning
    const groupedPlacesInitState = Object.values(PlaceType)
        .reduce<Partial<GroupedByTypePlaces>>((state, placeType) => {
            state[placeType] = []
            return state
        }, {}) as GroupedByTypePlaces

    const placesGroupedByType = ref<GroupedByTypePlaces>(groupedPlacesInitState)

    // full update from server
    watch(places, (newPlaces) => {
        const groupedPlaces = newPlaces.reduce((grouped, place) => {
            if (!grouped[place.type]) {
                grouped[place.type] = []
            }

            grouped[place.type]?.push(place)

            return grouped
        }, {} as GroupedByTypePlaces)

        for (let placeType of Object.keys(placesGroupedByType.value)) {
            placesGroupedByType.value[placeType as PlaceType] = groupedPlaces[placeType as PlaceType] || []
        }
    })

    // update typed list only - should be called on success POST /api/places
    function addPlaceToType(placeType: PlaceType, place: Place) {
        placesGroupedByType.value[placeType] = [...placesGroupedByType.value[placeType], place]
    }

    // updates typed list only - should be called on success DELETE /api/places/{id}
    function removePlaceFromType(placeType: PlaceType, id: string) {
        placesGroupedByType.value[placeType] = placesGroupedByType.value[placeType].filter(place => place.id !== id)
    }

    // for filters - contains types which should be displayed on the map
    const activePlaceTypes = ref<Set<PlaceType>>(new Set())
    function filterPlaces(placeTypes: PlaceType[]) {
        activePlaceTypes.value = new Set(placeTypes)
    }

    return {
        activePlaceTypes,
        placesGroupedByType,
        addPlaceToType,
        removePlaceFromType,
        filterPlaces
    }
})
