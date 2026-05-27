import { ref, shallowRef, triggerRef } from 'vue'
import { defineStore } from 'pinia'

import { buildEntitiesIndex, type MapEntitiesIndex, type User } from '@/models'
import { apiService, ApiError, type WsUserUpdateMsg } from '@/services'

export type UsersUpdateListener = (msg: WsUserUpdateMsg) => void

export const useUsersStore = defineStore('users', () => {

    const users = shallowRef<User[]>([])
    const isLoading = ref<boolean>(false)
    const error = ref<ApiError | null>(null)


    const usersUpdatesListeners = new Set<UsersUpdateListener>()
    function addUserUpdatesListener(callback: UsersUpdateListener) {
        usersUpdatesListeners.add(callback)
        return () => usersUpdatesListeners.delete(callback)
    }
    function emitUsersUpdate(msg: WsUserUpdateMsg) {
        usersUpdatesListeners.forEach(callback => {
            try {
                callback(msg)
            } catch (err) {
                console.error('User update listener produced the error: ', err)
            }
        })
    }

    let closeWSConnection: (() => void) | null = null

    let indexById: MapEntitiesIndex = new Map()
    function getUserById(id: string): User | null {
        const index = indexById.get(id)
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
            indexById = buildEntitiesIndex(users.value)
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

    function wsUsersHandler(msg: WsUserUpdateMsg) {
        msg.updated.forEach(updUser => {
            const index = indexById.get(updUser.id ?? '')
            if ('undefined' !== typeof index && users.value[index] && updUser.coordinates) {
                users.value[index].coordinates = updUser.coordinates
            }
        })

        if (msg.removed.length) {
            users.value = users.value.filter(user => !msg.removed.includes(user.id))
        }
        if (msg.added.length) {
            users.value.push(...msg.added)
        }
        if (msg.removed.length || msg.added.length) {
            indexById = buildEntitiesIndex(users.value)
        }

        triggerRef(users)
        emitUsersUpdate(msg)
    }
    function wsErrorHanler(err: unknown) {
        if (err instanceof ApiError) {
                error.value = err
        } else {
            error.value = new ApiError('Unknown error', undefined, err)
            console.error(err)
        }
    }

    function listenUserUpdates(): void {
        if (!closeWSConnection) {
            closeWSConnection = apiService.subscribeOnUserUpdates(wsUsersHandler, wsErrorHanler)
        }
    }
    function stopListenUserUpdates() {
        if (closeWSConnection) {
            closeWSConnection()
            closeWSConnection = null
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
        listenUserUpdates,
        addUserUpdatesListener,
        stopListenUserUpdates,
        selectUser,
        resetSelection,
    }
})
