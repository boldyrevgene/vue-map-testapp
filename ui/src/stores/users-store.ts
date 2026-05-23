import { computed, ref, toRaw } from 'vue'
import { defineStore } from 'pinia'

import type { User } from '@/models'
import { apiService, ApiError } from '@/services'

type UsersIdIndex = Map<string, number>

function makeUsersIndex(users: User[]): UsersIdIndex {
    return new Map(
        users.map((user, index) => [user.id, index])
    )
}

export const useUsersStore = defineStore('users', () => {

    const users = ref<User[]>([])
    const isLoading = ref<boolean>(false)
    const error = ref<ApiError | null>(null)

    const indexById = computed<UsersIdIndex>(() => makeUsersIndex(users.value))

    async function fetchUsers() {
        isLoading.value = true
        error.value = null
        try {
            users.value = await apiService.fetchUsers()
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

    function selectUser(id: string) {
        if ('number' !== typeof indexById.value.get(id)) {
            return
        }

        selectedUser.value = users.value[indexById.value.get(id) as number]
            ? toRaw(users.value[indexById.value.get(id) as number]) as User
            : null
    }

    function resetSelection() {
        if (selectedUser.value) {
            selectedUser.value = null
        }
    }

    return {
        users,
        isLoading,
        error,
        selectedUser,
        fetchUsers,
        selectUser,
        resetSelection,
    }
})
