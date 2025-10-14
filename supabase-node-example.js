import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

// Load environment variables
dotenv.config()

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://mtpnlowzrbdqkbxjgpvm.supabase.co'
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || '[YOUR_SUPABASE_ANON_KEY]'

const supabase = createClient(supabaseUrl, supabaseKey)

// Example query to fetch todos
const fetchTodos = async () => {
  try {
    const { data, error } = await supabase
      .from('todos')
      .select()
    
    if (error) {
      console.error('Error fetching todos:', error)
      return null
    }
    
    console.log('Todos:', data)
    return data
  } catch (err) {
    console.error('Unexpected error:', err)
    return null
  }
}

// Call the function
fetchTodos()

export { supabase }