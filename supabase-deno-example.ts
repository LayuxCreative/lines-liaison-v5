import { createClient } from '@supabase/supabase-js'

// Type declaration for Deno environment
declare global {
  const Deno: {
    env: {
      get(key: string): string | undefined;
    };
  };
}

// Environment variables configuration for Deno
const getEnvVar = (key: string, defaultValue: string = ''): string => {
  if (typeof Deno !== 'undefined' && Deno.env) {
    return Deno.env.get(key) || defaultValue;
  }
  return defaultValue;
};

// Load environment variables
const supabaseUrl = getEnvVar('VITE_SUPABASE_URL', 'https://mtpnlowzrbdqkbxjgpvm.supabase.co')
const supabaseKey = getEnvVar('VITE_SUPABASE_ANON_KEY', '[YOUR_SUPABASE_ANON_KEY]')

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

// Example: Insert a new todo
const insertTodo = async (title: string, completed: boolean = false) => {
  try {
    const { data, error } = await supabase
      .from('todos')
      .insert([
        { title, completed }
      ])
      .select()
    
    if (error) {
      console.error('Error inserting todo:', error)
      return null
    }
    
    console.log('New todo created:', data)
    return data
  } catch (err) {
    console.error('Unexpected error:', err)
    return null
  }
}

// Main function
const main = async () => {
  console.log('🚀 Deno Supabase Example')
  console.log('📊 Fetching todos...')
  
  await fetchTodos()
  
  // Uncomment to test inserting a new todo
  // await insertTodo('Test todo from Deno', false)
}

// Run the main function
if (import.meta.main) {
  main()
}

export { supabase, fetchTodos, insertTodo }