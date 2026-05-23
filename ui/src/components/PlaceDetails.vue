<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'
import { storeToRefs } from 'pinia'

import { useAppStore, usePlacesStore } from '@/stores'

import PlaceForm from '@/components/PlaceForm.vue'
import { mapIconService } from '@/services/map-icon-service'

const { collapseSidePanel } = useAppStore()
const { resetSelection } = usePlacesStore()
const { selectedPlace } = storeToRefs(usePlacesStore())

const iconSrc = ref<string>('')

watch(selectedPlace, async (selected) => {
    if (!selected) {
        iconSrc.value = ''
        return
    }
    const { src } = await mapIconService.getMarkerImage(selected.place.type, 'selected', 48)
    iconSrc.value = src

}, { immediate: true })

onMounted(() => {
    const { expandSidePanel } = useAppStore()
    expandSidePanel()
})
</script>

<template>
    <div class="place-details">
        <SidePanel @collapsed="collapseSidePanel()" @closed="resetSelection()">

            <div v-if="selectedPlace?.state === 'view'" class="place-details-content">

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

            </div>

            <div v-else class="form">
                <PlaceForm />
            </div>

        </SidePanel>
    </div>
</template>

<style scoped lang="scss">

.place-details {

    .side-panel {
        height: 100%;
        width: 100%;
    }

    &-content {
        .details {
            padding: 16px;
            display: flex;
            flex-direction: column;
            gap: 12px;

            &__header {
                margin-bottom: 12px;
                display: flex;
                align-items: center;
                gap: 10px;
            }

            &__icon {
                height: 48px;
                width: auto;
                flex-shrink: 0;
            }

            &__name {
                font-size: 22px;
                font-weight: 600;
                color: var(--el-text-color-primary);
            }

            &__row {
                margin-bottom: 8px;
                display: flex;
                gap: 6px;
                align-items: baseline;
            }

            &__label {
                font-size: 14px;
                color: var(--el-text-color-secondary);
            }

            &__value {
                font-size: 16px;
                color: var(--el-text-color-primary);
            }

            &__coords {
                display: flex;
                align-items: center;
                gap: 12px;
            }

            &__coords-divider {
                width: 1px;
                height: 14px;
                background: #dcdfe6;
            }

            &__description {
                display: flex;
                flex-direction: column;
                gap: 2px;

                p {
                    margin: 0;
                }
            }
        }
    }
}
</style>