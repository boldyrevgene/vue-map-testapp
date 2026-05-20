<script setup lang="ts">
import { useTemplateRef, onMounted } from 'vue'

const containerRef = useTemplateRef<HTMLDivElement>('map-container')

onMounted(() => {
    if (!containerRef.value) {
        return
    }

    // todo: initialize map here
    console.log(containerRef.value)
})

</script>

<template>
    <div ref="map-container" class="map-view">
    </div>
</template>

<style scoped lang="scss">

</style>
