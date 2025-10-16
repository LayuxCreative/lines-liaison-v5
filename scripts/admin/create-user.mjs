import { createClient } from '@supabase/supabase-js'
import fs from 'fs'
import path from 'path'

const [emailArg, passwordArg, nameArg] = process.argv.slice(2)
if (!emailArg || !passwordArg) {
  console.error('Usage: node scripts/admin/create-user.mjs <email> <password> [full_name]')
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
  // Prefer local overrides over backup
  url = url || fromLocal.SUPABASE_URL || fromBackup.SUPABASE_URL
  key = key || fromLocal.SUPABASE_SERVICE_ROLE_KEY || fromBackup.SUPABASE_SERVICE_ROLE_KEY
}

if (!url || !key) {
  console.error('Missing Supabase admin credentials (SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY)')
  process.exit(1)
}

const admin = createClient(url, key)

// First, check if user already exists
const { data: usersData, error: usersError } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 })
if (usersError) {
  console.error('Admin listUsers error:', usersError.message)
  process.exit(1)
}

const existing = usersData.users.find(u => (u.email || '').toLowerCase() === emailArg.toLowerCase())
if (existing) {
  console.log(JSON.stringify({ created: false, reason: 'already_exists', userId: existing.id, email: existing.email }))
  process.exit(0)
}

// Create user via Admin API and confirm email
const fullName = nameArg || 'System Admin'
const { data: created, error: createError } = await admin.auth.admin.createUser({
  email: emailArg,
  password: passwordArg,
  email_confirm: true,
  user_metadata: { full_name: fullName }
})

if (createError) {
  console.error('Create user error:', createError.message)
  process.exit(1)
}

console.log(JSON.stringify({ created: true, userId: created.user.id, email: created.user.email }))