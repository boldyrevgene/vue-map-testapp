<script setup lang="ts">
import type { Place } from '@/models'
import { onMounted } from 'vue'


const emit = defineEmits(['save'])

const props = defineProps<{place: Partial<Place>}>()

onMounted(() => {
    // todo: render form
    console.log(props.place)
})
</script>

<template>
    <form class="place-form" @submit.prevent="emit('save')">
        <p>Edit place form</p>
    </form>
</template>

<style scoped lang="scss">
</style>