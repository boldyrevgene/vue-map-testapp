import { ref } from 'vue'
import { defineStore } from 'pinia'

import type { User } from '@/models'

export const useUsersStore = defineStore('users', () => {

    const users = ref<User[]>([])
    const selectedUser = ref<User | null>(null)

    function selectUser(id: string) {

    }

    function resetSelection() {
        if (selectedUser.value) {
            selectedUser.value = null
        }
    }

    return {
        users,
        selectedUser,
        selectUser,
        resetSelection,
    }
})
