import { Router } from 'express'
import { readFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const router = Router()
const __dirname = dirname(fileURLToPath(import.meta.url))
const DATA_PATH = join(__dirname, '../data/users.json')

async function readUsers() {
  const raw = await readFile(DATA_PATH, 'utf-8')
  return JSON.parse(raw)
}

// GET /api/users
router.get('/', async (req, res) => {
  try {
    const users = await readUsers()
    res.json(users)
  } catch (err) {
    res.status(500).json({ error: 'Failed to read users' })
  }
})

export default router
