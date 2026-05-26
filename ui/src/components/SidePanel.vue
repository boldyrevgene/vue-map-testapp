<script setup lang="ts">
import { computed, useSlots } from 'vue'
import { ArrowRightBold, ArrowDownBold, CloseBold } from '@element-plus/icons-vue'
import { useIsMobile } from '@/composables'

const emit = defineEmits(['collapsed', 'closed'])
const slots = useSlots()

const { isMobile } = useIsMobile()
const collapseIcon = computed(() => isMobile.value ? ArrowDownBold : ArrowRightBold)
</script>

<template>
    <el-card body-class="side-panel-body" class="side-panel">

        <template #header>
            <div class="side-panel-header">

                <div class="side-panel-header-title">
                </div>

                <div class="side-panel-header-actions">
                    <el-button
                        :icon="collapseIcon" circle
                        @click="emit('collapsed')"
                    />
                    <el-button
                        :icon="CloseBold" circle
                        @click="emit('closed')"
                    />
                </div>
            </div>
        </template>

        <el-scrollbar view-class="side-panel-content__view" class="side-panel-content">
            <slot />
        </el-scrollbar>

        <div v-if="slots.actions" class="side-panel-actions">
            <slot name="actions" />
        </div>

    </el-card>
</template>

<style scoped lang="scss">

.side-panel {
    height: 100%;
    width: 100%;
    display: flex;
    flex-direction: column;

    &-header {
        display: flex;
        justify-content: space-between;
    }

    &-content {
        flex: 1;
        min-height: 0;
        padding: 20px;
    }

    &-actions {
        flex: 0 0 auto;
        display: flex;
        justify-content: flex-end;
        gap: 8px;
        padding: 12px 20px;
        border-top: 1px solid var(--el-border-color-lighter);
    }

    :deep(.side-panel-body) {
        flex: 1;
        display: flex;
        flex-direction: column;
        min-height: 0;
        padding: 0;
    }

    // makes the slot content fill the scrollable area
    // (forms inside rely on this to push their actions to the bottom)
    :deep(.side-panel-content__view) {
        height: 100%;
        display: flex;
        flex-direction: column;
    }
}
</style>
