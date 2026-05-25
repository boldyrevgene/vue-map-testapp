<script setup lang="ts">
import { ArrowRightBold, CloseBold } from '@element-plus/icons-vue'

const emit = defineEmits(['collapsed', 'closed'])
</script>

<template>
    <el-card body-class="side-panel-body" class="side-panel">

        <template #header>
            <div class="side-panel-header">

                <div class="side-panel-header-title">
                </div>

                <div class="side-panel-header-actions">
                    <el-button
                        :icon="ArrowRightBold" circle
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


    </el-card>
</template>

<style scoped lang="scss">

.side-panel {
    &-header {
        display: flex;
        justify-content: space-between;
    }

    &-content {
        padding: 20px;
    }

    :deep(.side-panel-content__view) {
        height: 100%;
        display: flex;
    }

    :deep(.side-panel-body) {
        padding: 0;
    }
}
</style>
