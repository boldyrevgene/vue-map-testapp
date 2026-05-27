export * from './map-types'

export type MinRequiredOf<T, K extends keyof T> = Partial<T> & Required<Pick<T, K>>
