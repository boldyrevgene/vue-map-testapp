import express from 'express'
import cors from 'cors'
import { createServer } from 'node:http'
import { WebSocketServer } from 'ws'
import placesRouter from './routes/places.js'
import usersRouter from './routes/users.js'
import { loadUsers, getSnapshot, tick } from './simulation.js'

const app = express()
const PORT = 3000
const TICK_INTERVAL_MS = 500

app.use(cors({}))
app.use(express.json())

app.use('/api/places', placesRouter)
app.use('/api/users', usersRouter)

const httpServer = createServer(app)
const wss = new WebSocketServer({ server: httpServer })

wss.on('connection', (ws) => {
  console.log('WebSocket client connected')

  // First message acts as a snapshot for the newly connected client:
  // the full current state arrives in `added`, so the initial render
  // works the same way as subsequent incremental updates.
  ws.send(JSON.stringify({ removed: [], added: getSnapshot(), updated: [] }))

  ws.on('close', () => console.log('WebSocket client disconnected'))
})

function broadcast(data) {
  const message = JSON.stringify(data)
  for (const client of wss.clients) {
    if (client.readyState === client.OPEN) {
      client.send(message)
    }
  }
}

await loadUsers()
setInterval(() => broadcast(tick()), TICK_INTERVAL_MS)

httpServer.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`)
  console.log(`WebSocket server ready at ws://localhost:${PORT}`)
})
