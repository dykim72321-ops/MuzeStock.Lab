import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY

const supabase = createClient(supabaseUrl, supabaseKey)

async function test() {
  const { data, error } = await supabase.from('watchlist').insert({ ticker: 'AAPL', user_id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', entry_price: 150 })
  console.log("Error inserting with entry_price:", error)
}
test()
