<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { storeToRefs } from 'pinia'

import { useAppStore, usePlacesStore, useMapStore, useUsersStore } from '@/stores'

import PlaceForm from '@/components/PlaceForm.vue'
import { mapIconService } from '@/services/map-icon-service'
import type { Place } from '@/models'

const { collapseSidePanel, expandSidePanel, closeSidePanel } = useAppStore()
const { closestUsers } = storeToRefs(useMapStore())
const { draftPlace, selectedPlace } = storeToRefs(usePlacesStore())
const { createPlace, savePlace } = usePlacesStore()
const { selectUser } = useUsersStore()

const iconSrc = ref<string>('')
const closestUserIconSrc = ref<string>('')


const placeToEdit = computed(() => {
    return selectedPlace.value?.state === 'edit'
        ? selectedPlace.value.place
        : draftPlace.value
})

watch(selectedPlace, async (selected) => {
    if (!selected) {
        iconSrc.value = ''
        return
    }
    const { src } = await mapIconService.getMarkerImage(selected.place.type, 'selected', 48)
    iconSrc.value = src

}, { immediate: true })

async function saveForm(formData: Partial<Place>) {
    if (selectedPlace.value && selectedPlace.value.state === 'edit') {
        await savePlace({ ...selectedPlace.value.place, ...formData, id: selectedPlace.value.place.id! } as Place)
    } else if (draftPlace.value) {
        await createPlace(formData as Place)
    }
}

function cancelEditing() {
    if (selectedPlace.value) {
        selectedPlace.value.state = 'view'
    }
}

onMounted(async () => {
    expandSidePanel()
    const img = await mapIconService.getMarkerImage('user', 'closest', 32)
    closestUserIconSrc.value = img.src
})
</script>

<template>
    <div class="place-details">
        <SidePanel @collapsed="collapseSidePanel()" @closed="closeSidePanel()">

            <div v-if="placeToEdit" class="form">
                <PlaceForm
                    :key="placeToEdit.id ?? 'draft'"
                    :place="placeToEdit"
                    @canceled="cancelEditing"
                    @submitted="saveForm"
                />
            </div>
            <div v-else-if="selectedPlace?.place" class="place-details-content">

                <div class="details__header">
                    <img :src="iconSrc" class="details__icon" alt="{}" />
                    <span class="details__name">{{ selectedPlace.place.name }}</span>
                </div>

                <div class="details__row">
                    <span class="details__label">type:</span>
                    <span class="details__value">{{ selectedPlace.place.type }}</span>
                </div>

                <div class="details__coords">
                    <div class="details__row">
                        <span class="details__label">lng:</span>
                        <span class="details__value">{{ selectedPlace.place.coordinates[0] }}</span>
                    </div>
                    <div class="details__coords-divider"></div>
                    <div class="details__row">
                        <span class="details__label">lat:</span>
                        <span class="details__value">{{ selectedPlace.place.coordinates[1] }}</span>
                    </div>
                </div>

                <div v-if="selectedPlace.place.description" class="details__description">
                    <span class="details__label">Description:</span>
                    <p class="details__value">{{ selectedPlace.place.description }}</p>
                </div>

                <el-table v-if="closestUsers.length" :data="closestUsers" :show-header="false" class="closest-users"
                    @row-click="(row) => selectUser(row.user.id)">
                    <el-table-column width="44">
                        <template #default>
                            <img :src="closestUserIconSrc" class="closest-users__icon" alt="" />
                        </template>
                    </el-table-column>
                    <el-table-column>
                        <template #default="{ row }">{{ row.user.name }}</template>
                    </el-table-column>
                    <el-table-column width="80" align="right">
                        <template #default="{ row }">
                            <span class="closest-users__distance">{{ row.distance.toFixed(2) }} km</span>
                        </template>
                    </el-table-column>
                </el-table>

            </div>

        </SidePanel>
    </div>
</template>

<style scoped lang="scss">

.place-details {

    .side-panel {
        height: 100%;
        width: 100%;
        display: flex;
        flex-direction: column;

        :deep(.el-card__body) {
            flex: 1;
            display: flex;
            flex-direction: column;
            min-height: 0;
        }
    }

    .form {
        min-height: 0;
        display: flex;
        flex: 1;
        flex-direction: column;
    }
}

.closest-users {
    margin-top: 12px;
    border: 1px solid var(--el-border-color);
    border-radius: 0;
    overflow: hidden;

    &__icon {
        display: block;
    }

    &__distance {
        color: var(--el-text-color-secondary);
        font-size: 0.85em;
    }

    :deep(.el-table__cell) {
        padding: 4px 0;
    }

    :deep(.el-table__row) {
        cursor: pointer;
    }
}
</style>