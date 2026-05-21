import { computed, ref } from 'vue'
import { defineStore } from 'pinia'

export const useAppStore = defineStore('appStore', () => {

    const isSidePanelDisplayed = ref(false);
    // active only if user/place is selected on map or if form of place creation are rendered
    const isSidePanelActive = computed(() => true)

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
