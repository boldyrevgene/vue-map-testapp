import express from 'express'
import cors from 'cors'
import placesRouter from './routes/places.js'
import usersRouter from './routes/users.js'

const app = express()
const PORT = 3000

app.use(cors({ origin: 'http://localhost:5173' })) // Vite dev server
app.use(express.json())

app.use('/api/places', placesRouter)
app.use('/api/users', usersRouter)

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`)
})