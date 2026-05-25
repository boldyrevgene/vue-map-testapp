import { computed, ref } from 'vue'
import { defineStore, storeToRefs } from 'pinia'

import { useUsersStore } from './users-store';
import { usePlacesStore } from './places-store';

export const useAppStore = defineStore('appStore', () => {

    const isSidePanelDisplayed = ref(false);

    // active only if user/place is selected on map or if form of place creation are rendered
    const { selectedUser  } = storeToRefs(useUsersStore())
    const { resetSelection: resetUserSelection } = useUsersStore()
    const { draftPlace, selectedPlace } = storeToRefs(usePlacesStore())
    const { cancelCreation, resetSelection: resetPlaceSelection } = usePlacesStore()

    const isSidePanelActive = computed(() => selectedUser.value || selectedPlace.value || draftPlace.value)

    const isSidePanelExpanded = computed(() => isSidePanelActive.value && isSidePanelDisplayed.value)
    const isSidePanelExpaтdable = computed(() => isSidePanelActive.value && !isSidePanelDisplayed.value)

    function expandSidePanel() {
        isSidePanelDisplayed.value = true
    }

    function collapseSidePanel() {
        isSidePanelDisplayed.value = false
    }

    function closeSidePanel() {
        isSidePanelDisplayed.value = false
        cancelCreation()
        resetPlaceSelection()
        resetUserSelection()
    }

    return {
        isSidePanelExpanded,
        isSidePanelExpaтdable,
        expandSidePanel,
        collapseSidePanel,
        closeSidePanel,
    }
})
