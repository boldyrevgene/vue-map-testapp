import { ref, watch } from 'vue'
import { defineStore } from 'pinia'

import type { Place, SelectedPlace } from '@/models'
import { apiService, ApiError } from '@/services'

// hash map with place.id - array index as key-value pair
type PlacesIdIndex = {[key: string]: number}

function makePlacesIndex(places: Place[]): PlacesIdIndex {
    return places.reduce((index, place, position) => {
        index[place.id] = position
        return index
    }, {} as PlacesIdIndex)
}

export const usePlacesStore = defineStore('places', () => {

    const places = ref<Place[]>([])
    const isLoading = ref<boolean>(false)
    const error = ref<ApiError | null>(null)

    let indexById: PlacesIdIndex = {}
    watch(places, (newPlaces: Place[]) => {
        indexById = makePlacesIndex(newPlaces)
    })

    async function fetchPlaces() {
        isLoading.value = true
        error.value = null
        try {
            places.value = await apiService.fetchPlaces()
        } catch (err) {
            if (err instanceof ApiError) {
                error.value = err
            } else {
                error.value = new ApiError('Unknown error', undefined, err)
                console.error(err)
            }
        } finally {
            isLoading.value = false
        }
    }


    const selectedPlace = ref<SelectedPlace | null>(null)
    function selectPlace(id: string) {
        if (!indexById[id] && indexById[id] !== 0) {
            return
        }

        selectedPlace.value = places.value[indexById[id]]
            ? {place: places.value[indexById[id]] as Place, state: 'view'}
            : null
    }

    function resetSelection() {
        if (selectedPlace.value) {
            selectedPlace.value = null
        }
    }

    function editPlace(id: string) {
        if (id !== selectedPlace.value?.place.id) {
            return
        }

        selectedPlace.value = {
            place: selectedPlace.value.place,
            state: 'edit'
        }
    }

    async function createPlace(place: Omit<Place, 'id'>) {
        // todo: call API method

        // on success response
        // places.value.push(response)
        // indexById[response.id] = places.value.length - 1
    }

    async function savePlace(place: Place) {
        // todo: call API method

        // on success response
        // places.value[indexById[place.id]] = place
    }

    async function removePlace(id: string) {
        // todo: call API method

        // on success removing
        const index = indexById[id];
        if (!index && index !== 0) {
            return
        }

        places.value.splice(index, 1)
        if (selectedPlace.value?.place.id === id) {
            resetSelection()
        }
        indexById = makePlacesIndex(places.value)
    }

    return {
        places,
        isLoading,
        error,
        selectedPlace,
        selectPlace,
        resetSelection,
        editPlace,
        fetchPlaces,
        createPlace,
        savePlace,
        removePlace,
    }
})
