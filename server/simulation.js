import { readFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const DATA_PATH = join(__dirname, 'data/users.json')

// --- Constants ---
const ADD_REMOVE_N_TICKS = 10 // each N ticks some users will be removed, some users added
const ADD_REMOVE_LIMIT = 10 // max users count which could be removed or deleted each N ticks
const MAX_TURN = Math.PI / 6   // max turn per tick (30°)

// Speed — in degrees per tick (tick = 500ms). At Kyiv latitude (~50.44°):
//   1° lat ≈ 111 km, 1° lng ≈ 70.7 km; convert to km/h: speed * (70.7..111) * 7200
// Range depends on direction (lng-only → min, lat-only → max).
const MIN_SPEED = 0.000005  // ≈ 2.5–4 km/h (pedestrian)
const MAX_SPEED = 0.00025   // ≈ 127–200 km/h (fast car / highway)


// Kyiv bbox — covers all 10 districts. Used both to spawn new users
// and to softly keep existing ones inside during wander.
const KYIV_BBOX = {
  minLat: 50.36,
  maxLat: 50.56,
  minLng: 30.34,
  maxLng: 30.70,
}
const KYIV_CENTER = {
  lat: (KYIV_BBOX.minLat + KYIV_BBOX.maxLat) / 2,
  lng: (KYIV_BBOX.minLng + KYIV_BBOX.maxLng) / 2,
}
const BBOX_MARGIN = 0.01     // ≈ 1 km — zone where we start biasing angle toward center
const BIAS_STRENGTH = 0.15   // 0..1 — fraction of the target angle blended in each tick

// --- State ---
// Internal representation: { id, name, lat, lng, speed, angle }
let users = []
let initialCount = 0
let tickCounter = 0
let nextUserId = 1

// --- Private helpers ---
function rand(min, max) {
  return Math.random() * (max - min) + min
}

function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function generateUser() {
  return {
    id: `gen-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    name: `User ${nextUserId++}`,
    lat: rand(KYIV_BBOX.minLat, KYIV_BBOX.maxLat),
    lng: rand(KYIV_BBOX.minLng, KYIV_BBOX.maxLng),
    speed: rand(MIN_SPEED, MAX_SPEED),
    angle: rand(0, Math.PI * 2),
  }
}

/**
 * Biases user's angle toward the bbox center when they get close to a boundary.
 * Smooth blending with BIAS_STRENGTH — no abrupt turns.
 * Does nothing while the user is at a safe distance from the boundary.
 */
function biasAngleToCenter(u) {
  const nearTop    = u.lat > KYIV_BBOX.maxLat - BBOX_MARGIN
  const nearBottom = u.lat < KYIV_BBOX.minLat + BBOX_MARGIN
  const nearRight  = u.lng > KYIV_BBOX.maxLng - BBOX_MARGIN
  const nearLeft   = u.lng < KYIV_BBOX.minLng + BBOX_MARGIN

  if (!nearTop && !nearBottom && !nearRight && !nearLeft) {
    return
  }

  // angle: 0 = north (lat += cos*speed, lng += sin*speed),
  // so targetAngle = atan2(dlng, dlat).
  const targetAngle = Math.atan2(
    KYIV_CENTER.lng - u.lng,
    KYIV_CENTER.lat - u.lat,
  )

  // Find the shortest path on the circle — handle the ±2π wrap-around.
  let delta = targetAngle - u.angle
  while (delta >  Math.PI) delta -= Math.PI * 2
  while (delta < -Math.PI) delta += Math.PI * 2
  u.angle += delta * BIAS_STRENGTH
}

// --- Public API ---

export async function loadUsers() {
  const raw = await readFile(DATA_PATH, 'utf-8')
  const data = JSON.parse(raw) // [{ id, name, coordinates: [lng, lat] }]
  users = data.map(u => ({
    id: u.id,
    name: u.name,
    lng: u.coordinates[0],
    lat: u.coordinates[1],
    speed: rand(MIN_SPEED, MAX_SPEED),
    angle: rand(0, Math.PI * 2),
  }))
  initialCount = users.length
  console.log(`Loaded ${initialCount} users from users.json`)
}

/**
 * Returns a snapshot of current coordinates — sent to a freshly connected WS client.
 * @returns {{ id: string, coordinates: [number, number] }[]}
 */
export function getSnapshot() {
  return users.map(u => ({ id: u.id, name: u.name, coordinates: [u.lng, u.lat] }))
}

/**
 * One simulation tick.
 * @returns {{ removed: string[], added: object[], updated: object[] }}
 */
export function tick() {
  tickCounter++

  // 1. Move existing users (only those that existed before this tick started).
  const updated = users.map(u => {
    biasAngleToCenter(u)
    u.angle += rand(-MAX_TURN, MAX_TURN)
    u.lat += u.speed * Math.cos(u.angle)
    u.lng += u.speed * Math.sin(u.angle)
    return { id: u.id, coordinates: [u.lng, u.lat] }
  })

  // 2. Every N ticks — adjust the user count.
  const removed = []
  const added = []

  if (tickCounter % ADD_REMOVE_N_TICKS === 0) {
    const a = randInt(1, ADD_REMOVE_LIMIT)
    const b = randInt(1, ADD_REMOVE_LIMIT)
    const bigger = Math.max(a, b)
    const smaller = Math.min(a, b)

    let toAdd, toRemove

    if (users.length > initialCount) {
      // Above the norm: larger number = how many to remove, smaller = how many to add
      toRemove = Math.min(bigger, users.length)
      toAdd = smaller
    } else {
      // At or below the norm: larger number = how many to add, smaller = how many to remove
      toAdd = bigger
      toRemove = Math.min(smaller, users.length)
    }

    for (let i = 0; i < toRemove; i++) {
      const idx = Math.floor(Math.random() * users.length)
      removed.push(users[idx].id)
      users.splice(idx, 1)
    }
    for (let i = 0; i < toAdd; i++) {
      const u = generateUser()
      users.push(u)
      added.push({ id: u.id, name: u.name, coordinates: [u.lng, u.lat] })
    }
  }

  return { removed, added, updated }
}
