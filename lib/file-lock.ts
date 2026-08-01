/**
 * Shared file locking and atomic write utilities.
 * Prevents race conditions in read-modify-write operations on JSON files.
 */

import fs from 'fs'
import path from 'path'

const dataDir = path.join(process.cwd(), 'data')

function ensureDataDir() {
  try {
    if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true })
  } catch {}
}

// Simple in-process file lock to serialize read-modify-write across concurrent requests
const fileQueues = new Map<string, Promise<unknown>>()

export async function withFileLock<T>(filePath: string, fn: () => Promise<T>): Promise<T> {
  const prev = fileQueues.get(filePath) || Promise.resolve()
  const next = prev.then(async () => fn(), async () => fn())
  fileQueues.set(filePath, next.catch(() => {}))
  return next
}

export function atomicWriteJson(filePath: string, data: unknown) {
  ensureDataDir()
  const tmp = `${filePath}.tmp.${Date.now()}.${Math.random().toString(36).slice(2)}`
  fs.writeFileSync(tmp, JSON.stringify(data, null, 2), 'utf-8')
  fs.renameSync(tmp, filePath)
}

export { dataDir }
