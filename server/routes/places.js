import { Router } from 'express'
import { readFile, writeFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { randomUUID } from 'node:crypto'

const router = Router()
const __dirname = dirname(fileURLToPath(import.meta.url))
const DATA_PATH = join(__dirname, '../data/places.json')

async function readPlaces() {
  const raw = await readFile(DATA_PATH, 'utf-8')
  return JSON.parse(raw)
}

async function writePlaces(places) {
  await writeFile(DATA_PATH, JSON.stringify(places, null, 2), 'utf-8')
}

// GET /api/places
router.get('/', async (req, res) => {
  try {
    const places = await readPlaces()
    res.json(places)
  } catch (err) {
    res.status(500).json({ error: 'Failed to read places' })
  }
})

// POST /api/places
router.post('/', async (req, res) => {
  try {
    const { name, type, coordinates, description } = req.body

    if (!name || !type || !coordinates) {
      return res.status(400).json({ error: 'name, type and coordinates are required' })
    }

    const places = await readPlaces()
    const newPlace = { id: randomUUID(), name, type, coordinates, description: description ?? '' }
    places.push(newPlace)
    await writePlaces(places)

    res.status(201).json(newPlace)
  } catch (err) {
    res.status(500).json({ error: 'Failed to save place' })
  }
})

export default router