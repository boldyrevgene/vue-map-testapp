<script setup lang="ts">
const emit = defineEmits(['save'])
</script>

<template>
    <form class="place-form" @submit.prevent="emit('save')">

    </form>
</template>

<style scoped lang="scss">
</style>