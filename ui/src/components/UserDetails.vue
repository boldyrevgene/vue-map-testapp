<script setup lang="ts">
import { storeToRefs } from 'pinia';

import { useAppStore, useUsersStore } from '@/stores';

const { collapseSidePanel } = useAppStore()
const { resetSelection } = useUsersStore()
const { selectedUser } = storeToRefs(useUsersStore())

console.log(selectedUser.value)
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