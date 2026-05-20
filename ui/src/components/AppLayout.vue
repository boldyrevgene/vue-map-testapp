<script setup lang="ts">
import AppHeader from '@/components/AppHeader.vue'
import MapView from '@/components/MapView.vue'
import SidePanel from '@/components/SidePanel.vue'
</script>

<template>
    <div class="app-layout">
        <el-container>
    
          <el-header>
            <AppHeader />
          </el-header>
    
          <el-main>
            <MapView />
    
            <SidePanel />
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

        .side-panel {
            width: 384px;
            height: 100%;
            position: absolute;
            top: 0;
            right: 0;

            &.hidden {
                transform: translateX(100%);
            }
        }
    }
}
</style>
