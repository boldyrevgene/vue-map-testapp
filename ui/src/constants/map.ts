export const MAP_INIT_CENTER: [number, number] = [30.518, 50.445]
export const MAP_INIT_ZOOM = 13.5

export const CLOSEST_USERS_DISPLAY_COUNT = 3


/**
 * Spatial grid index resolution options.
 * Relevant for Ukraine but should be recalculated
 * if latitude significantly different
 */
export const GRID_INDEX_CONFIG = {
    CELL_100M: 1000, // ~110м x 74м
    CELL_500M: 200,  // ~550м x 370м
    CELL_1KM:  100,  // ~1.1км x 740м
    CELL_5KM:  20,   // ~5.5км x 3.7км
    CELL_10KM: 10,   // ~11.1км x 7.4км
} as const

export const GRID_RESOLUTION: number = GRID_INDEX_CONFIG.CELL_1KM
