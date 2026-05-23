<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'
import { storeToRefs } from 'pinia'

import { useAppStore, useUsersStore } from '@/stores'

import { mapIconService } from '@/services/map-icon-service'

const { collapseSidePanel, expandSidePanel } = useAppStore()
const { resetSelection } = useUsersStore()
const { selectedUser } = storeToRefs(useUsersStore())

const iconSrc = ref<string>('')

watch(selectedUser, async (user) => {
    if (!user) {
        iconSrc.value = ''
        return
    }
    const { src } = await mapIconService.getMarkerImage('user', 'selected', 48)
    iconSrc.value = src
}, { immediate: true })

onMounted(() => {
    expandSidePanel()
})
</script>

<template>
    <div class="user-details">
        <SidePanel @collapsed="collapseSidePanel()" @closed="resetSelection()">

            <div v-if="selectedUser" class="user-details-content">

                <div class="details__header">
                    <img :src="iconSrc" class="details__icon" alt="{}" />
                    <span class="details__name">{{ selectedUser.name }}</span>
                </div>

                <div class="details__coords">
                    <div class="details__row">
                        <span class="details__label">lng:</span>
                        <span class="details__value">{{ selectedUser.coordinates[0] }}</span>
                    </div>
                    <div class="details__coords-divider"></div>
                    <div class="details__row">
                        <span class="details__label">lat:</span>
                        <span class="details__value">{{ selectedUser.coordinates[1] }}</span>
                    </div>
                </div>

            </div>

        </SidePanel>
    </div>
</template>

<style scoped lang="scss">
.user-details {

    .side-panel {
        height: 100%;
        width: 100%;
    }
}
</style>