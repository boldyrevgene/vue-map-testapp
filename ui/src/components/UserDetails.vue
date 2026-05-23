<script setup lang="ts">
import { watch } from 'vue'
import { storeToRefs } from 'pinia';

import { useAppStore, useUsersStore } from '@/stores';

const { collapseSidePanel } = useAppStore()
const { resetSelection } = useUsersStore()
const { selectedUser } = storeToRefs(useUsersStore())

watch(selectedUser, console.log)
</script>

<template>
    <div class="user-details">
        <SidePanel @collapsed="collapseSidePanel()" @closed="resetSelection()">
            <p>Side panel content</p>
        </SidePanel>
    </div>

</template>

<style scoped lang="scss">
.user-details {

    .side-panel {
        height: 100%;
        width: 100%;
    }
}
</style>