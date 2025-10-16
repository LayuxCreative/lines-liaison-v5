import { createClient } from '@supabase/supabase-js'
import fs from 'fs'
import path from 'path'

// Usage: node scripts/admin/update-password.mjs <email> <new_password>
const [emailArg, passwordArg] = process.argv.slice(2)
if (!emailArg || !passwordArg) {
  console.error('Usage: node scripts/admin/update-password.mjs <email> <new_password>')
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

// Find auth user by email
const { data: usersData, error: usersError } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 })
if (usersError) {
  console.error('Admin listUsers error:', usersError.message)
  process.exit(1)
}

const target = usersData.users.find(u => (u.email || '').toLowerCase() === emailArg.toLowerCase())
if (!target) {
  console.error(`Auth user not found for email: ${emailArg}`)
  console.log(JSON.stringify({ updated: false, reason: 'auth_user_missing', email: emailArg }))
  process.exit(2)
}

// Update password via Admin API
const { data: updated, error: updateError } = await admin.auth.admin.updateUserById(target.id, { password: passwordArg })
if (updateError) {
  console.error('Update password error:', updateError.message)
  process.exit(1)
}

console.log(JSON.stringify({ updated: true, userId: target.id, email: target.email }))