import { computed, ref, watch } from 'vue'
import { defineStore, storeToRefs } from 'pinia'

import { useUsersStore } from './users-store';
import { usePlacesStore } from './places-store';

export const useAppStore = defineStore('appStore', () => {

    const isSidePanelDisplayed = ref(false);

    // active only if user/place is selected on map or if form of place creation are rendered
    const { selectedUser } = storeToRefs(useUsersStore())
    const { selectedPlace } = storeToRefs(usePlacesStore())
    const isSidePanelActive = computed(() => selectedUser.value || selectedPlace.value || true)

    // only a single selection at the same time
    const { resetSelection: resetPlaceSelection } = usePlacesStore()
    const { resetSelection: resetUserSelection } = useUsersStore()
    watch(selectedUser, (user) => {
        if (user) {
            resetPlaceSelection()
        }
    })
    watch(selectedPlace, (place) => {
        if (place) {
            resetUserSelection()
        }
    })


    const isSidePanelExpanded = computed(() => isSidePanelActive.value && isSidePanelDisplayed.value)
    const isSidePanelExpaтdable = computed(() => isSidePanelActive.value && !isSidePanelDisplayed.value)

    function expandSidePanel() {
        isSidePanelDisplayed.value = true
    }

    function collapseSidePanel() {
        isSidePanelDisplayed.value = false
    }

    return {
        isSidePanelExpanded,
        isSidePanelExpaтdable,
        expandSidePanel,
        collapseSidePanel
    }
})
