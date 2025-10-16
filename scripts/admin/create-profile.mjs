import { createClient } from '@supabase/supabase-js'
import fs from 'fs'
import path from 'path'

// Usage: node scripts/admin/create-profile.mjs <email> [full_name]
const [emailArg, fullNameArg] = process.argv.slice(2)
if (!emailArg) {
  console.error('Usage: node scripts/admin/create-profile.mjs <email> [full_name]')
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
  console.log(JSON.stringify({ created: false, reason: 'auth_user_missing', email: emailArg }))
  process.exit(2)
}

// Check if profile already exists
const { data: existingProfile, error: selectError } = await admin
  .from('profiles')
  .select('id,email,full_name,role,status')
  .eq('id', target.id)
  .maybeSingle()

if (selectError) {
  console.error('Select profile error:', selectError.message)
  // Continue; if policy blocks, service role should bypass, but just in case
}

if (existingProfile) {
  console.log(JSON.stringify({ created: false, exists: true, profile: existingProfile }))
  process.exit(0)
}

const derivedName = fullNameArg || target.user_metadata?.full_name || target.user_metadata?.name || (target.email?.split('@')[0] ?? null)

const insertPayload = {
  id: target.id,
  email: target.email,
  full_name: derivedName,
  role: 'team_member',
  status: 'active'
}

const { data: inserted, error: insertError } = await admin
  .from('profiles')
  .insert([insertPayload])
  .select()

if (insertError) {
  console.error('Insert profile error:', insertError.message)
  process.exit(1)
}

console.log(JSON.stringify({ created: true, profile: inserted?.[0] ?? insertPayload }))