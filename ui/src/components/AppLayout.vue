<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { storeToRefs } from 'pinia'

import { SIDE_PANEL_TRANSITION_MS, SIDE_PANEL_DESKTOP_WIDTH, SIDE_PANEL_MOBILE_HEIGHT_DVH } from '@/constants/styles'
import { useIsMobile } from '@/composables'

import AppHeader from '@/components/AppHeader.vue'
import MapView from '@/components/MapView.vue'
import SidePanelContainer from '@/components/SidePanelContainer.vue'

import { useAppStore } from '@/stores/app-store'

const { isSidePanelExpanded } = storeToRefs(useAppStore())
const { isMobile } = useIsMobile()

const elemPlusSize = ref<'default' | 'large'>('default')
watch(isMobile, (mobile) => {
    elemPlusSize.value = mobile ? 'large' : 'default'
})

const styleVariables = computed(() => ({
    '--side-panel-width': `${SIDE_PANEL_DESKTOP_WIDTH}px`,
    '--side-panel-mobile-height': `${SIDE_PANEL_MOBILE_HEIGHT_DVH}dvh`,
    '--side-panel-transition-ms': `${SIDE_PANEL_TRANSITION_MS}ms`
}))
</script>

<template>
    <el-config-provider :size="elemPlusSize">
        <div class="app-layout" :style="styleVariables">
            <el-container>

              <el-header>
                <AppHeader />
              </el-header>

              <el-main>
                <MapView />

                <SidePanelContainer
                    :class="{ expanded: isSidePanelExpanded, mobile: isMobile }"
                />
              </el-main>

            </el-container>
        </div>
    </el-config-provider>
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
            position: absolute;
            transition: transform var(--side-panel-transition-ms) ease;

            // Desktop: slide from the right
            width: var(--side-panel-width);
            height: 100%;
            top: 0;
            right: calc(-1 * var(--side-panel-width));

            &.expanded {
                transform: translateX(-100%);
            }

            // Mobile: slide from the bottom
            &.mobile {
                width: 100%;
                height: var(--side-panel-mobile-height);
                top: auto;
                right: 0;
                bottom: calc(-1 * var(--side-panel-mobile-height));

                &.expanded {
                    transform: translateY(-100%);
                }
            }
        }
    }
}
</style>
