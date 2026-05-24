import { ref } from 'vue'
import { defineStore } from 'pinia'

import { buildEntitiesIndex, type MapEntitiesIndex, type User } from '@/models'
import { apiService, ApiError } from '@/services'


export const useUsersStore = defineStore('users', () => {

    const users = ref<User[]>([])
    const isLoading = ref<boolean>(false)
    const error = ref<ApiError | null>(null)

    const indexById = ref<MapEntitiesIndex>(new Map())
    function getUserById(id: string): User | null {
        const index = indexById.value.get(id)
        if ('number' === typeof index && index >= 0) {
            return users.value[index] || null 
        }

        return null
    }

    async function fetchUsers() {
        isLoading.value = true
        error.value = null
        try {
            users.value = await apiService.fetchUsers()
            indexById.value = buildEntitiesIndex(users.value)
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

    const selectedUser = ref<User | null>(null)

    function selectUser(id: string){
        selectedUser.value = getUserById(id)
    }

    function resetSelection() {
        if (selectedUser.value) {
            selectedUser.value = null
        }
    }

    return {
        users,
        getUserById,
        isLoading,
        error,
        selectedUser,
        fetchUsers,
        selectUser,
        resetSelection,
    }
})
