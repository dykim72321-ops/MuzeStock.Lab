import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY

const supabase = createClient(supabaseUrl, supabaseKey)

async function test() {
  const { data, error } = await supabase.from('watchlist').select('*').limit(1)
  console.log("Data:", data)

  // fetch schema if possible, but standard postgrest doesn't allow it easily.
  // We can just dump the first row to see keys.
  if (data && data.length > 0) {
     console.log("Columns:", Object.keys(data[0]))
  }
}
test()
