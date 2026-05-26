<script setup lang="ts">
import { computed } from 'vue'
import { storeToRefs } from 'pinia'
import { ArrowLeftBold, ArrowUpBold, AddLocation } from '@element-plus/icons-vue'

import { PLACE_TYPES_LIST, PlaceType } from '@/models'
import { useAppStore, useMapStore, usePlacesStore } from '@/stores'
import { useIsMobile } from '@/composables/useIsMobile'

const { isSidePanelExpandable } = storeToRefs(useAppStore())
const { expandSidePanel } = useAppStore()

const { isMobile } = useIsMobile()
const expandIcon = computed(() => isMobile.value ? ArrowUpBold : ArrowLeftBold)

const { activePlaceTypes } = storeToRefs(useMapStore())
const { filterPlaces } = useMapStore()

const { createDraft } = usePlacesStore()
const { draftPlace } = storeToRefs(usePlacesStore())

const placeTypeOptions = PLACE_TYPES_LIST

// bridge between Set in store and array-based v-model of el-select
const selectedPlaceTypes = computed<PlaceType[]>({
    get: () => Array.from(activePlaceTypes.value),
    set: (types) => filterPlaces(types),
})
</script>

<template>
    <div class="app-header">
        <div class="app-header-filters">
            <el-select
                v-model="selectedPlaceTypes"
                multiple
                collapse-tags
                collapse-tags-tooltip
                clearable
                placeholder="All place types"
                class="app-header-filters-select"
            >
                <el-option
                    v-for="type in placeTypeOptions"
                    :key="type"
                    :label="type"
                    :value="type"
                />
            </el-select>
        </div>

        <div class="app-header-actions">
            <el-button
                v-if="!draftPlace"
                :icon="AddLocation" circle
                @click="createDraft()"
            />
            <el-button
                v-if="isSidePanelExpandable"
                :icon="expandIcon" circle
                @click="expandSidePanel()"
            />
        </div>
    </div>
</template>

<style scoped lang="scss">

@use '@/styles/breakpoints' as bp;

.app-header {
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: space-between;

    &-filters {
        &-select {
            width: 280px;

            @include bp.mobile {
                width: 160px;
            }
        }
    }

    &-actions {
        display: flex;
        align-items: center;
        gap: 4px;
        flex-shrink: 0;
    }
}

</style>
