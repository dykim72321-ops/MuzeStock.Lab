import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
    const NEWS_API_KEY = Deno.env.get('NEWS_API_KEY');
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!OPENAI_API_KEY || !SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error('Missing environment variables: OPENAI_API_KEY, SUPABASE_URL, or SUPABASE_SERVICE_ROLE_KEY');
    }

    // 1. Fetch Top Headlines (Politics, Business)
    let newsText = "";
    let sourceCount = 0;
    
    // Fallback news if no API key provided (Dev mode)
    if (!NEWS_API_KEY) {
       console.warn("No NEWS_API_KEY provided. Using mock news data.");
       newsText = "The Federal Reserve is signaling interest rate cuts later this year as inflation cools. Tech stocks are rallying on AI optimism. Geopolitical tensions in the Middle East remain high, affecting oil prices.";
       sourceCount = 3;
    } else {
       try {
          const newsResponse = await fetch(`https://newsapi.org/v2/top-headlines?country=us&category=business&apiKey=${NEWS_API_KEY}`);
          const newsData = await newsResponse.json();
          if (newsData.articles) {
             newsText = newsData.articles.slice(0, 10).map((a: any) => `- ${a.title}: ${a.description || ''}`).join('\n');
             sourceCount = newsData.articles.length;
          }
       } catch (err) {
          console.error("Failed to fetch news:", err);
          throw new Error("News fetch failed");
       }
    }

    // 2. Summarize with OpenAI
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: "You are a specialized macro-economic analyst. Summarize the following news headlines into a SINGLE paragraph (approx 200 words) describing the current global market sentiment, key risks, and opportunities. Focus on factors affecting stock markets (Rates, Geopolitics, Tech trends). Language: Korean." },
          { role: 'user', content: newsText },
        ],
      }),
    });

    const aiData = await response.json();
    const summary = aiData.choices[0].message.content;

    // 3. Store in Supabase
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    
    const { error } = await supabase
      .from('market_context')
      .insert({
        summary: summary,
        source_count: sourceCount
      });

    if (error) throw error;

    return new Response(JSON.stringify({ success: true, summary }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    });
  }
});
