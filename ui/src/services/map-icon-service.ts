import type { MarkerState, MarkerType } from '@/types'

export class MapIconService {

    private svgs: Partial<Record<MarkerType, string>> = {}

    /**
     * Returns a marker image rasterized at the given height.
     * Size is baked into the SVG before rasterization so the browser
     * renders directly from vector at the target resolution — no bitmap upscaling.
     *
     * @param markerType type of place | 'user'
     * @param state default | selected | closest
     * @param height target raster height in pixels
     */
    async getMarkerImage(markerType: MarkerType, state: MarkerState, height: number): Promise<HTMLImageElement> {
        const svgTemplate = await this.getIconImageTxt(markerType)
        const colored = svgTemplate.replace(/MARKER_COLOR/g, this.getColorByState(state))
        const sized = this.applySize(colored, height)

        const dataUrl = 'data:image/svg+xml,' + encodeURIComponent(sized)

        return new Promise((resolve) => {
            const img = new Image()
            img.onload = () => resolve(img)
            img.src = dataUrl
        })
    }

    /**
     * Provides consistent icon names for use inside the maplibre API
     *
     * @param markerType type of place | 'user'
     * @param state default | selected | closest
     * @returns id string to use inside maplibre
     */
    getMarkerId(markerType: string, state: string): string {
        return `icon-marker-${markerType}__${state}`
    }

    /**
     * Bakes width/height into the root <svg> preserving aspect ratio from viewBox
     * (falling back to original width/height attributes if viewBox is absent).
     */
    private applySize(svgText: string, height: number): string {
        const doc = new DOMParser().parseFromString(svgText, 'image/svg+xml')
        const svg = doc.documentElement

        const aspect = this.getSvgAspect(svg)
        const width = Math.round(height * aspect)

        svg.setAttribute('width', String(width))
        svg.setAttribute('height', String(height))

        return new XMLSerializer().serializeToString(svg)
    }

    private getSvgAspect(svg: Element): number {
        const viewBox = svg.getAttribute('viewBox')?.split(/[\s,]+/).map(Number)
        if (viewBox?.length === 4 && viewBox[2] && viewBox[3]) {
            return viewBox[2] / viewBox[3]
        }

        const w = Number(svg.getAttribute('width'))
        const h = Number(svg.getAttribute('height'))
        if (w && h) {
            return w / h
        }

        return 1
    }

    private async getIconImageTxt(markerType: MarkerType): Promise<string> {
        if (!this.svgs[markerType]) {
            this.svgs[markerType] = await fetch(`/icons/icon-marker-${markerType}.svg`)
                .then(resp => resp.text())
        }

        return this.svgs[markerType] ?? ''
    }

    // todo: move colors to global accessible variables
    private getColorByState(state: MarkerState): string {
        switch (state) {

            case 'selected':
                return '#409EFF'

            case 'closest':
                return '#E6A23C'

            default:
                return '#909399'
        }
    }
}

export const mapIconService = new MapIconService()
