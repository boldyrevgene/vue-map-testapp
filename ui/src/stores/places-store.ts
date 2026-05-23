import { ref } from 'vue'
import { defineStore } from 'pinia'

import type { Place } from '@/models'
import { apiService, ApiError } from '@/services'

export const usePlacesStore = defineStore('places', () => {

    const places = ref<Place[]>([])
    const isLoading = ref<boolean>(false)
    const error = ref<ApiError | null>(null)

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

    async function createPlace(place: Omit<Place, 'id'>) {
        // todo: call API method
    }

    async function removePlace(id: string) {
        // todo: call API method
    }

    return {
        places,
        isLoading,
        error,
        fetchPlaces,
        createPlace,
        removePlace,
    }
})
