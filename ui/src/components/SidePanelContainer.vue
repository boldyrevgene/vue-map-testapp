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
        <PlaceDetails v-if="selectedPlace"></PlaceDetails>
        <UserDetails v-if="selectedUser"></UserDetails>
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

// common styles for both childrens (PlaceDetails, UserDetails)
<style lang="scss">
@use '@/styles/map-entity-details';
</style>
