<script setup lang="ts">
import { computed } from 'vue'
import { storeToRefs } from 'pinia'

import { SIDE_PANEL_TRANSITION_MS, SIDE_PANEL_DESKTOP_WIDTH } from '@/constants/styles'

import AppHeader from '@/components/AppHeader.vue'
import MapView from '@/components/MapView.vue'
import SidePanelContainer from '@/components/SidePanelContainer.vue'

import { useAppStore } from '@/stores/app-store.ts'

const { isSidePanelExpanded } = storeToRefs(useAppStore())

const styleVariables = computed(() => ({
    '--side-panel-width': `${SIDE_PANEL_DESKTOP_WIDTH}px`,
    '--side-panel-transition-ms': `${SIDE_PANEL_TRANSITION_MS}ms`
}))
</script>

<template>
    <div class="app-layout" :style="styleVariables">
        <el-container>
    
          <el-header>
            <AppHeader />
          </el-header>
    
          <el-main>
            <MapView />
    
            <SidePanelContainer
                :class="{ expanded: isSidePanelExpanded }"
            />
          </el-main>

        </el-container>
    </div>
</template>

<style scoped lang="scss">

.app-layout > .el-container {
    height: 100vh;

    .el-header {
        background-color: var(--el-color-primary);
        color: var(--el-bg-color);
    }

    .el-main {
        padding: 0;
        position: relative;
        overflow: hidden;
        background-color: var(--el-bg-color-page);

        .map-view {
            height: 100%;
            width: 100%;
        }

        .side-panel-container {
            width: var(--side-panel-width);
            height: 100%;
            position: absolute;
            top: 0;
            right: calc(-1 * var(--side-panel-width));

            transition: transform var(--side-panel-transition-ms) ease;

            &.expanded {
                transform: translateX(-100%);
            }
        }
    }
}
</style>
