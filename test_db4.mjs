import fetch from 'node-fetch'

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY

async function checkSchema() {
  const url = `${supabaseUrl}/rest/v1/watchlist?select=*`
  const res = await fetch(url, {
    method: 'OPTIONS',
    headers: {
      'apikey': supabaseKey,
      'Authorization': `Bearer ${supabaseKey}`
    }
  })
  const text = await res.text()
  console.log(text)
}
checkSchema()
