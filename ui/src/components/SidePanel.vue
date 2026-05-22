<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { ArrowRightBold, CloseBold } from '@element-plus/icons-vue'

import { useAppStore } from '@/stores/app-store'

const { collapseSidePanel } = useAppStore()

function closePanel() {
    collapseSidePanel();
    // todo: reset selection/creation
}
</script>

<template>
    <el-card class="side-panel">

        <template #header>
            <div class="side-panel-header">

                <div class="side-panel-header-title">
                </div>

                <div class="side-panel-header-actions">
                    <el-button
                        :icon="ArrowRightBold" circle
                        @click="collapseSidePanel()"
                    />
                    <el-button
                        :icon="CloseBold" circle
                        @click="closePanel()"
                    />
                </div>
            </div>
        </template>

        <slot />

    </el-card>
</template>

<style scoped lang="scss">

.side-panel {
    &-header {
        display: flex;
        justify-content: space-between;

        &-actions {

        }
    }
}
</style>
