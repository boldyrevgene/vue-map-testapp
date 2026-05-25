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
     * Calls place creation API method
     * 
     * @param place - place to create
     * @returns 
     */
    async createPlace(place: Partial<Place>): Promise<Place> {
        return this.handleResponse<Place>(
            await fetch(`${this.config.apiBase}/places`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(place)
            })
        )
    }

    /**
     * Calls API for update the place
     *
     * @param place - place to update
     * @returns
     */
    async updatePlace(place: Place): Promise<Place> {
        return this.handleResponse<Place>(
            await fetch(`${this.config.apiBase}/places/${place.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(place)
            })
        )
    }

    /**
     * Calls deliting API method
     * 
     * @param id - id of place which should be deleted
     * @returns 
     */
    async deletePlace(id: string): Promise<{id: string}> {
        return this.handleResponse<{id: string}>(
            await fetch(`${this.config.apiBase}/places/${id}`, {
                method: 'DELETE'
            })
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
