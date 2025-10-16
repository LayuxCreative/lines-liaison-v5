import { createClient } from '@supabase/supabase-js'
import fs from 'fs'
import path from 'path'

const [emailArg] = process.argv.slice(2)
if (!emailArg) {
  console.error('Usage: node scripts/admin/check-user.mjs <email>')
  process.exit(1)
}

function loadEnv(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf-8')
    const env = {}
    for (const line of content.split('\n')) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/)
      if (m) env[m[1]] = m[2]
    }
    return env
  } catch {
    return {}
  }
}

let url = process.env.SUPABASE_URL
let key = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!url || !key) {
  const envBackupPath = path.resolve(process.cwd(), '.env.backup')
  const envLocalPath = path.resolve(process.cwd(), '.env.local')
  const fromBackup = fs.existsSync(envBackupPath) ? loadEnv(envBackupPath) : {}
  const fromLocal = fs.existsSync(envLocalPath) ? loadEnv(envLocalPath) : {}
  url = url || fromBackup.SUPABASE_URL || fromLocal.SUPABASE_URL
  key = key || fromBackup.SUPABASE_SERVICE_ROLE_KEY || fromLocal.SUPABASE_SERVICE_ROLE_KEY
}

if (!url || !key) {
  console.error('Missing Supabase admin credentials (SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY)')
  process.exit(1)
}

const admin = createClient(url, key)

const { data, error } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 })
if (error) {
  console.error('Admin listUsers error:', error.message)
  process.exit(1)
}

const target = data.users.find(u => (u.email || '').toLowerCase() === emailArg.toLowerCase())
if (!target) {
  console.log(JSON.stringify({ exists: false }))
  process.exit(0)
}

console.log(JSON.stringify({ exists: true, userId: target.id, emailConfirmed: !!target.email_confirmed_at }))