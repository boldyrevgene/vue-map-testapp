<script setup lang="ts">
import { watch } from 'vue'
import { useAppStore, usePlacesStore } from '@/stores';
import { storeToRefs } from 'pinia';

import PlaceForm from '@/components/PlaceForm.vue'

const { collapseSidePanel } = useAppStore()
const { resetSelection } = usePlacesStore()
const { selectedPlace } = storeToRefs(usePlacesStore())

watch(selectedPlace, console.log)

</script>

<template>
    <div class="place-details">
        <SidePanel @collapsed="collapseSidePanel()" @closed="resetSelection()">

            <div v-if="selectedPlace?.state === 'view'" class="details">

            </div>
            
            <div v-else class="form">
                <PlaceForm />
            </div>


        </SidePanel>
    </div>
</template>

<style scoped lang="scss">

.place-details {

    .side-panel {
        height: 100%;
        width: 100%;
    }
}
</style>