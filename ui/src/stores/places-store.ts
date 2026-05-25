import { ref } from 'vue'
import { defineStore } from 'pinia'

import { buildEntitiesIndex, type MapEntitiesIndex, type Place, type SelectedPlace } from '@/models'
import { apiService, ApiError } from '@/services'


export const usePlacesStore = defineStore('places', () => {

    const places = ref<Place[]>([])
    const isLoading = ref<boolean>(false)
    const error = ref<ApiError | null>(null)

    const indexById = ref<MapEntitiesIndex>(new Map())
    function getPlaceById(id: string): Place | null {
        const index = indexById.value.get(id)
        if ('number' === typeof index && index >= 0) {
            return places.value[index] || null 
        }

        return null
    }

    async function fetchPlaces() {
        isLoading.value = true
        error.value = null
        try {
            places.value = await apiService.fetchPlaces()
            indexById.value = buildEntitiesIndex(places.value)
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
    // selects place for view details
    function selectPlace(id: string) {
        const place = getPlaceById(id)
        selectedPlace.value = place
            ? {place, state: 'view'}
            : null
        
        if (place) {
            draftPlace.value = null
        }
    }
    // selects place for edit
    function editPlace(id: string) {
        const place = getPlaceById(id)
        selectedPlace.value = place
            ? {place, state: 'edit'}
            : null
    }

    function resetSelection() {
        if (selectedPlace.value) {
            selectedPlace.value = null
        }
    }


    const draftPlace = ref<Partial<Place> | null>(null)
    function createDraft() {
        draftPlace.value = {}
        selectedPlace.value = null
    }
    function cancelCreation() {
        draftPlace.value = null
    }
    async function createPlace(place: Omit<Place, 'id'>) {
        // todo: call API method

        // todo: update index on success API call
        // indexById.value.set(<Response.place.id>, places.value.length - 1)
        // selectPlace(<Response.place.id>)
    }

    async function savePlace(place: Place) {
        // todo: call API method
    }

    async function removePlace(id: string) {
        // todo: call API method

        // on success removing
        if (selectedPlace.value?.place.id === id) {
            resetSelection()
        }

        // todo: on success API call
        const index = indexById.value.get(id)
        if ('number' === typeof index && index >= 0) {
            places.value.splice(index, 1)
            indexById.value = buildEntitiesIndex(places.value)
        }
    }

    return {
        places,
        getPlaceById,
        fetchPlaces,
        isLoading,
        error,
        selectedPlace,
        selectPlace,
        editPlace,
        resetSelection,
        draftPlace,
        createDraft,
        cancelCreation,
        createPlace,
        savePlace,
        removePlace,
    }
})
