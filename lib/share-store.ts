import type { Evaluation } from '@/types'
import { existsSync, mkdirSync, readFileSync, writeFileSync, renameSync } from 'fs'
import { join } from 'path'
import { withFileLock } from '@/lib/file-lock'

const DATA_DIR = process.env.DATA_DIR || join(process.cwd(), 'data')
const SHARES_PATH = join(DATA_DIR, 'shares.json')

interface ShareEntry {
  id: string
  evaluation: Evaluation
  createdAt: string
}

function readShares(): ShareEntry[] {
  try {
    if (!existsSync(SHARES_PATH)) return []
    const raw = readFileSync(SHARES_PATH, 'utf-8')
    return JSON.parse(raw) as ShareEntry[]
  } catch {
    return []
  }
}

function writeShares(data: ShareEntry[]) {
  try {
    if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true })
    const tmp = `${SHARES_PATH}.tmp.${Date.now()}.${Math.random().toString(36).slice(2)}`
    writeFileSync(tmp, JSON.stringify(data, null, 2), 'utf-8')
    renameSync(tmp, SHARES_PATH)
  } catch {
    console.warn('[share-store] Failed to write shares file')
  }
}

// Clean old shares (older than 30 days)
function cleanOldShares() {
  try {
    const shares = readShares()
    const cutoff = Date.now() - 30 * 24 * 60 * 60 * 1000
    const filtered = shares.filter(s => new Date(s.createdAt).getTime() > cutoff)
    if (filtered.length !== shares.length) {
      writeShares(filtered)
    }
  } catch {}
}

export async function createShare(evaluation: Evaluation): Promise<string> {
  cleanOldShares()

  const id = crypto.randomUUID().replace(/-/g, '').slice(0, 12)
  const entry: ShareEntry = {
    id,
    evaluation,
    createdAt: new Date().toISOString(),
  }

  return withFileLock(SHARES_PATH, async () => {
    const shares = readShares()
    shares.push(entry)
    writeShares(shares)
    return id
  })
}

export async function getShare(id: string): Promise<Evaluation | null> {
  return withFileLock(SHARES_PATH, async () => {
    const shares = readShares()
    const entry = shares.find(s => s.id === id)
    return entry ? entry.evaluation : null
  })
}