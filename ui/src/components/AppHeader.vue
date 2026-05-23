<script setup lang="ts">
import { computed } from 'vue'
import { storeToRefs } from 'pinia'
import { ArrowLeftBold, AddLocation } from '@element-plus/icons-vue'

import { useAppStore } from '@/stores/app-store'
import { useMapStore } from '@/stores/map-store'
import { PlaceType } from '@/models'

const { isSidePanelExpaтdable } = storeToRefs(useAppStore())
const { expandSidePanel } = useAppStore()

const { activePlaceTypes } = storeToRefs(useMapStore())
const { filterPlaces } = useMapStore()

const placeTypeOptions = Object.values(PlaceType)

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
            <el-button :icon="AddLocation" circle />
            <el-button
                v-if="isSidePanelExpaтdable"
                :icon="ArrowLeftBold" circle
                @click="expandSidePanel()"
            />
        </div>
    </div>
</template>

<style scoped lang="scss">

.app-header {
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: space-between;

    &-filters {
        &-select {
            width: 280px;
        }
    }

    &-actions {

    }
}

</style>
