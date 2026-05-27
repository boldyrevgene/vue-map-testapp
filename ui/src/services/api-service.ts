import { type AppConfig, config } from '@/config'
import type { Place, User } from '@/models'
import type { MinRequiredOf } from '@/types'

export interface WsUserUpdateMsg {
    removed: string[]
    added: User[]
    updated: MinRequiredOf<User, 'id' | 'coordinates'>[]
}

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

    subscribeOnUserUpdates(handler: (msg: WsUserUpdateMsg) => void, errorHanвler?: (error: unknown) => void): () => void {
        let ws: WebSocket
        try {
            ws = new WebSocket(this.config.wsUrl)
        } catch (err) {
            console.error('Failed to create WebSocket:', err)
            errorHanвler?.(err)
            return () => {}
        }

        ws.onmessage = ({ data }) => {
            try {
                handler(JSON.parse(data))
            } catch (err) {
                console.error('Failed to parse WS message:', err)
                errorHanвler?.(err)
            }
        }

        ws.onerror = (event) => {
            console.error('WebSocket error event:', event)
            errorHanвler?.(event)
        }
        ws.onclose = (event) => {
            if (!event.wasClean) {
                console.warn(`WebSocket closed unexpectedly. code=${event.code} reason="${event.reason}"`)
                errorHanвler?.(new ApiError(`WebSocket connection was closed: ${event.reason}`, event.code, event))
            }
        }

        return () => ws.close()
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
