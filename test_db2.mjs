import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY

const supabase = createClient(supabaseUrl, supabaseKey)

async function test() {
  const { data, error } = await supabase.from('watchlist').insert({ ticker: 'TEST', entry_price: 150 })
  console.log("Error inserting with entry_price:", error)

  const { data: d2, error: e2 } = await supabase.from('watchlist').insert({ ticker: 'TEST2', notes: JSON.stringify({ buy_price: 150 }) })
  console.log("Error inserting with notes:", e2)
}
test()
