import { ref, toRaw } from 'vue'
import { defineStore } from 'pinia'

import {
    buildEntitiesIndex,
    type MapEntitiesIndex,
    type Place,
    type PlaceEvent,
    type SelectedPlace,
} from '@/models'
import { apiService, ApiError } from '@/services'


export const usePlacesStore = defineStore('places', () => {

    const places = ref<Place[]>([])
    const isLoading = ref<boolean>(false)
    const error = ref<ApiError | null>(null)

    let indexById = new Map()
    function getPlaceById(id: string): Place | null {
        const index = indexById.get(id)
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
            indexById = buildEntitiesIndex(places.value)
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
        
        draftPlace.value = null
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

    // A single place operation events
    // fires on success server response for POST/PUT/DELETE methods
    type PlaceEventListener = (event: PlaceEvent) => void
    const placeEventListeners = new Set<PlaceEventListener>()

    function addPlaceEventListener(cb: PlaceEventListener) {
        placeEventListeners.add(cb)
        return () => placeEventListeners.delete(cb)
    }

    function emitPlaceEvent(event: PlaceEvent) {
        placeEventListeners.forEach(cb => {
            try {
                cb(event)
            } catch (err) {
                console.error('place event listener threw', err)
            }
        })
    }


    async function createPlace(place: Omit<Place, 'id'>) {
        isLoading.value = true
        error.value = null
        try {
            const created = await apiService.createPlace(place)

            // add created place to the places list
            places.value.push(created)
            // update the index
            indexById.set(created.id, places.value.length - 1)
            // select just created place
            selectPlace(created.id)

            emitPlaceEvent({ action: 'created', place: created })
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

    async function savePlace(place: Place) {
        isLoading.value = true
        error.value = null
        try {
            const updated = await apiService.updatePlace(place)

            const index = indexById.get(place.id)
            if ('number' === typeof index && index >= 0) {
                places.value[index] = updated
            }
            selectPlace(place.id)

            emitPlaceEvent({ action: 'updated', place: updated })
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

    async function deletePlace(id: string) {
        isLoading.value = true
        error.value = null

        const placeToDelete = toRaw(getPlaceById(id))

        try {
            await apiService.deletePlace(id)

            if (selectedPlace.value?.place.id === id) {
                resetSelection()
            }

            // remove place from the places list and update the index
            const index = indexById.get(id)
            if ('number' === typeof index && index >= 0) {
                places.value.splice(index, 1)
                indexById = buildEntitiesIndex(places.value)
            }

            if (placeToDelete) {
                emitPlaceEvent({ action: 'deleted', place: placeToDelete })
            }
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
        deletePlace,
        addPlaceEventListener,
    }
})
