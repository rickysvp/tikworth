import type { Evaluation } from '@/types'
import type { NeonQueryFunction } from '@neondatabase/serverless'

const DATABASE_URL = (process.env.DATABASE_URL || process.env.POSTGRES_URL || '').replace(/\s+/g, '')

let sql: NeonQueryFunction<false, false> | null = null
let initPromise: Promise<void> | null = null

async function getSql(): Promise<NeonQueryFunction<false, false>> {
  if (sql) return sql
  const { neon } = await import('@neondatabase/serverless')
  sql = neon(DATABASE_URL)
  return sql
}

async function initTable(): Promise<void> {
  if (!initPromise) {
    initPromise = (async () => {
      const s = await getSql()
      await s`
        CREATE TABLE IF NOT EXISTS shares (
          id TEXT PRIMARY KEY,
          evaluation JSONB NOT NULL,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
      `
      await s`CREATE INDEX IF NOT EXISTS idx_shares_created ON shares(created_at)`
    })()
  }
  return initPromise
}

export async function createShare(evaluation: Evaluation): Promise<string> {
  await initTable()
  const s = await getSql()

  const id = crypto.randomUUID().replace(/-/g, '').slice(0, 12)

  await s`
    INSERT INTO shares (id, evaluation, created_at)
    VALUES (${id}, ${JSON.stringify(evaluation)}::jsonb, NOW())
  `

  return id
}

export async function getShare(id: string): Promise<Evaluation | null> {
  await initTable()
  const s = await getSql()

  const rows = await s`SELECT evaluation FROM shares WHERE id = ${id}`
  if (!rows[0]) return null

  return rows[0].evaluation as Evaluation
}

// Clean old shares (older than 30 days) — called periodically
export async function cleanOldShares(): Promise<void> {
  try {
    await initTable()
    const s = await getSql()
    await s`DELETE FROM shares WHERE created_at < NOW() - INTERVAL '30 days'`
  } catch (err) {
    console.warn('[share-store] cleanOldShares failed:', err)
  }
}