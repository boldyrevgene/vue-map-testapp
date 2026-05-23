<script setup lang="ts">
import { storeToRefs } from 'pinia';

import UserDetails from '@/components/UserDetails.vue'
import PlaceDetails from '@/components/PlaceDetails.vue'

import { usePlacesStore, useUsersStore } from '@/stores';

const { selectedUser } = storeToRefs(useUsersStore())
const { selectedPlace } = storeToRefs(usePlacesStore())
</script>

<template>
    <div class="side-panel-container">
        <!-- todo: replace condition by selected state -->
        <PlaceDetails v-if="true"></PlaceDetails>
        <UserDetails v-else></UserDetails>
    </div>
</template>

<style scoped lang="scss">

.side-panel-container {
    padding: 16px 16px 16px 0;
    box-sizing: border-box;

    .user-details, .place-details {
        height: 100%;
        width: 100%;
    }
}

</style>
