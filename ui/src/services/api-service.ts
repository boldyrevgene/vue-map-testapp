import { type AppConfig, config } from '@/config'
import type { Place, User } from '@/models'

export class ApiService {

    constructor(private config: AppConfig) {}

    /**
     * Fetches the full list of places from the server
     * 
     * @returns list of places
     */
    async fetchPlaces(): Promise<Place[]> {
        return this.handleResponse<Place[]>(
            await fetch(`${this.config.apiBase}/places`)
        )
    }

    /**
     * Fetches the full list of users from the server
     *
     * @returns list of users
     */
    async fetchUsers(): Promise<User[]> {
        return this.handleResponse<User[]>(
            await fetch(`${this.config.apiBase}/users`)
        )
    }

    /**
     * Handles HTTP errors
     * 
     * @param resp output of fetch function call
     * @returns JSON response from the server
     */
    private async handleResponse<T>(resp: Response) {
        if (!resp.ok) {
            throw new ApiError(`Request failed: ${resp.statusText}`, resp.status)
        }

        return resp.json() as Promise<T>
    }
}

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status?: number,
    public readonly cause?: unknown
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

export const apiService = new ApiService(config)
