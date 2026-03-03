import fetch from 'node-fetch'

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY

async function checkSchema() {
  const url = `${supabaseUrl}/rest/v1/?apikey=${supabaseKey}`
  const res = await fetch(url)
  const json = await res.json()
  console.log(JSON.stringify(json.definitions.watchlist, null, 2))
}
checkSchema()
