<script setup lang="ts">
import { ArrowRightBold, CloseBold } from '@element-plus/icons-vue'

const emit = defineEmits(['collapsed', 'closed'])
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
                        @click="emit('collapsed')"
                    />
                    <el-button
                        :icon="CloseBold" circle
                        @click="emit('closed')"
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
