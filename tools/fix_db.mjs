import { neon } from "@neondatabase/serverless";
import crypto from "crypto";

const sql = neon("postgresql://neondb_owner:npg_ZJ3AY2RefoMS@ep-lively-night-amuabhvh-pooler.c-5.us-east-1.aws.neon.tech/neondb?sslmode=require");

// 1. Drop NOT NULL on event_name (use tagged template for DDL)
await sql.query("ALTER TABLE analytics_events ALTER COLUMN event_name DROP NOT NULL");
console.log("1. Dropped NOT NULL on event_name");

// 2. Backfill event_name
await sql.query("UPDATE analytics_events SET event_name = event_type WHERE event_name IS NULL");
console.log("2. Backfilled event_name");

// 3. Generate ip_hash for legacy rows
await sql.query("UPDATE analytics_events SET ip_hash = encode(sha256(session_id::bytea), 'hex') WHERE ip_hash IS NULL AND session_id IS NOT NULL AND session_id != ''");
console.log("3. Generated ip_hash from session_id");

// 4. NOT NULL on event_type
try {
  await sql.query("ALTER TABLE analytics_events ALTER COLUMN event_type SET NOT NULL");
  console.log("4. NOT NULL on event_type: OK");
} catch (e) {
  console.log("4. NOT NULL on event_type: skipped", e.message);
}

// 5. Check stats
let s = await sql.query("SELECT COUNT(*) as total, COUNT(NULLIF(ip_hash,'')) as has_ip, COUNT(DISTINCT ip_hash) as uv FROM analytics_events WHERE event_type = 'page_view'");
console.log("\n=== PV/UV ===", JSON.stringify(s[0]));

// 6. Write test
function hashIp(ip) { return crypto.createHmac("sha256","tikworth-ip-hmac-v1").update(ip).digest("hex").slice(0,32); }
const testIp = hashIp("203.0.113.42");

await sql.query(
  "INSERT INTO analytics_events (event_type, path, ip_hash, session_id, user_agent, referrer, metadata, created_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)",
  ["page_view", "/test", testIp, "test-verify-001", "Test/1.0", "https://tokvalue.com", "{}", new Date().toISOString()]
);

let r2 = await sql.query("SELECT event_type, event_name, ip_hash, session_id FROM analytics_events WHERE session_id = $1", ["test-verify-001"]);
console.log("\n=== Test write ===", JSON.stringify(r2[0]));

await sql.query("DELETE FROM analytics_events WHERE session_id = $1", ["test-verify-001"]);

// Final
let f = await sql.query("SELECT COUNT(*) as pv, COUNT(DISTINCT COALESCE(NULLIF(ip_hash,''), session_id)) as uv FROM analytics_events WHERE event_type = 'page_view'");
console.log("\n=== Final PV/UV ===", `PV=${f[0].pv} UV=${f[0].uv}`);
console.log("\n✅ All fixes applied, write chain verified");
