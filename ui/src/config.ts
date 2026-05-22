export interface AppConfig {
    readonly apiBase: string
    readonly wsUrl: string
}

export const config: AppConfig = {
    apiBase: import.meta.env.VITE_API_BASE,
    wsUrl: import.meta.env.VITE_WS_URL,
} as const