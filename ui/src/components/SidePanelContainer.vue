<script setup lang="ts">
import SidePanel from '@/components/SidePanel.vue'
</script>

<template>
    <div class="side-panel-container">
        <SidePanel>
            <p>Side panel content</p>
        </SidePanel>
    </div>
</template>

<style scoped lang="scss">

.side-panel-container {
    padding: 16px 16px 16px 0;
    box-sizing: border-box;

    .side-panel {
        height: 100%;
        width: 100%;
    }
}

</style>
