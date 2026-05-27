import { computed, ref, watch } from 'vue'
import { defineStore, storeToRefs } from 'pinia'

import { useUsersStore } from './users-store';
import { usePlacesStore } from './places-store';

export const useAppStore = defineStore('appStore', () => {

    const isSidePanelDisplayed = ref(false);

    // active only if user/place is selected on map or if form of place creation are rendered
    const { selectedUser, error: usersError  } = storeToRefs(useUsersStore())
    const { resetSelection: resetUserSelection } = useUsersStore()
    const { draftPlace, selectedPlace, error: placesError } = storeToRefs(usePlacesStore())
    const { cancelCreation, resetSelection: resetPlaceSelection } = usePlacesStore()

    watch([placesError, usersError], ([placesErr, usersErr]) => {
        if (placesErr) {
            ElNotification({
                title: 'Error',
                message: placesErr.message,
                type: 'error',
                position: 'top-left',
                offset: 60
            })
        }
        if (usersErr) {
            ElNotification({
                title: 'Error',
                message: usersErr.message,
                type: 'error',
                position: 'top-left',
                offset: 60
            })
        }
    })

    const isSidePanelActive = computed(() => selectedUser.value || selectedPlace.value || draftPlace.value)

    const isSidePanelExpanded = computed(() => isSidePanelActive.value && isSidePanelDisplayed.value)
    const isSidePanelExpandable = computed(() => isSidePanelActive.value && !isSidePanelDisplayed.value)

    // auto-expand whenever the underlying selection changes while the panelis currently hidden.
    watch([selectedUser, selectedPlace, draftPlace], () => {
        if (isSidePanelActive.value && !isSidePanelDisplayed.value) {
            isSidePanelDisplayed.value = true
        }
    })

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
        isSidePanelExpandable,
        expandSidePanel,
        collapseSidePanel,
        closeSidePanel,
    }
})
