import { createClient } from '@supabase/supabase-js'

const url = process.env.VITE_SUPABASE_URL
const key = process.env.VITE_SUPABASE_ANON_KEY

if (url && key) {
  const supabase = createClient(url, key)
  supabase.from('stock_analysis_cache').select('analysis').limit(1).then(res => {
    console.log(JSON.stringify(res.data, null, 2))
  })
} else {
  console.log("No env vars")
}
