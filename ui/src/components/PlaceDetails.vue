<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'
import { storeToRefs } from 'pinia'

import { useAppStore, usePlacesStore } from '@/stores'

import PlaceForm from '@/components/PlaceForm.vue'
import { mapIconService } from '@/services/map-icon-service'

const { collapseSidePanel, expandSidePanel } = useAppStore()
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
    expandSidePanel()
})
</script>

<template>
    <div class="place-details">
        <SidePanel @collapsed="collapseSidePanel()" @closed="resetSelection()">

            <div v-if="selectedPlace?.state === 'edit'" class="form">
                <PlaceForm />
            </div>
            <div v-else v-if="selectedPlace?.place" class="place-details-content">

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

        </SidePanel>
    </div>
</template>

<style scoped lang="scss">

.place-details {

    .side-panel {
        height: 100%;
        width: 100%;
    }

    &-content {}
}
</style>