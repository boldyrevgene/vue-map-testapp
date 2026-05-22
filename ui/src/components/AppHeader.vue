<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { ArrowLeftBold, AddLocation } from '@element-plus/icons-vue'

import { useAppStore } from '@/stores/app-store'

const { isSidePanelExpaтdable } = storeToRefs(useAppStore())
const { expandSidePanel } = useAppStore()
</script>

<template>
    <div class="app-header">
        <div class="app-header-filters">
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

    &-actions {

    }
}

</style>