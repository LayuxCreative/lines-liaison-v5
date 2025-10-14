import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';

interface Todo {
  id: number;
  task: string;
  is_complete: boolean;
  created_at: string;
}

function SupabaseTest() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function getTodos() {
      try {
        setLoading(true);
        const { data, error } = await supabase.from('todos').select('*');
        
        if (error) {
          setError(error.message);
          console.error('Error fetching todos:', error);
        } else {
          setTodos(data || []);
          console.log('Fetched todos:', data);
        }
      } catch (err) {
        setError('Failed to fetch todos');
        console.error('Error:', err);
      } finally {
        setLoading(false);
      }
    }

    getTodos();
  }, []);

  if (loading) {
    return (
      <div className="p-6 bg-white rounded-lg shadow-lg">
        <h2 className="text-xl font-bold mb-4">Supabase Connection Test</h2>
        <p className="text-gray-600">Loading todos...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-white rounded-lg shadow-lg">
        <h2 className="text-xl font-bold mb-4 text-red-600">Supabase Connection Test</h2>
        <p className="text-red-500">Error: {error}</p>
        <p className="text-sm text-gray-500 mt-2">
          This might be expected if the 'todos' table doesn't exist yet.
        </p>
      </div>
    );
  }

  return (
    <div className="p-6 bg-white rounded-lg shadow-lg">
      <h2 className="text-xl font-bold mb-4 text-green-600">Supabase Connection Test</h2>
      <p className="text-gray-600 mb-4">
        ✅ Successfully connected to Supabase! Found {todos.length} todos.
      </p>
      
      {todos.length > 0 ? (
        <ul className="space-y-2">
          {todos.map((todo) => (
            <li key={todo.id} className="p-2 bg-gray-50 rounded">
              <span className={todo.is_complete ? 'line-through text-gray-500' : ''}>
                {todo.task}
              </span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-gray-500">No todos found. The connection is working but the table is empty.</p>
      )}
    </div>
  );
}

export default SupabaseTest;