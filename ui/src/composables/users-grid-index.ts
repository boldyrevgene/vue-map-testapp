import { ref } from "vue";

import type { LngLat, User } from "@/models";
import { defineSpatialGridIndex, type ClosestItem } from "@/utils/geo";

const { index, findClosestTo } = defineSpatialGridIndex<User>('users', {
    getId: (user) => user.id,
    getCoordinates: (user) => user.coordinates
})

const closestUsers = ref<ClosestItem<User>[]>([])

export function useUsersGridIndex() {

    function findClosestUsers(query: LngLat) {
        closestUsers.value = findClosestTo(query)
    }
    
    return {
        index,
        findClosestUsers,
        closestUsers
    }
}