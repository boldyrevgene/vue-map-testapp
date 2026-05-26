import { readonly, ref } from 'vue'
import { MOBILE_BREAKPOINT } from '@/constants/styles'


// keeps isMobile state acroding to MOBILE_BREAKPOINT display width
let isMobileRef: ReturnType<typeof ref<boolean>> | null = null
function initOnce() {
    if (isMobileRef) return isMobileRef
    if (typeof window === 'undefined') {
        isMobileRef = ref(false)
        return isMobileRef
    }

    const mql = window.matchMedia(`(width < ${MOBILE_BREAKPOINT}px)`)
    isMobileRef = ref(mql.matches)
    mql.addEventListener('change', (event) => {
        isMobileRef!.value = event.matches
    })
    return isMobileRef
}

export function useIsMobile() {
    const state = initOnce()
    return { isMobile: readonly(state) }
}
