import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { ticker, price, change, volume } = await req.json();
    const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');

    if (!OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY is not set');
    }

    const systemPrompt = `You are a professional stock analyst for MuzeStock.Lab. 
    Analyze the provided stock data and generate a JSON response with the following fields:
    - matchReasoning (string): A brief, insightful pattern recognition note (1-2 sentences).
    - bullCase (string[]): 3 concise bullet points for optimistic scenarios.
    - bearCase (string[]): 3 concise bullet points for pessimistic scenarios.
    - dnaScore (number): A score from 0-100 based on the data provided (be critical).
    
    Response must be purely valid JSON. Language: Korean.`;

    const userPrompt = `Analyze this stock:
    Ticker: ${ticker}
    Price: ${price}
    Change: ${change}%
    Volume: ${volume}`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        response_format: { type: "json_object" }
      }),
    });

    const data = await response.json();
    
    if (data.error) {
      throw new Error(data.error.message);
    }

    const content = data.choices[0].message.content;
    const analysis = JSON.parse(content);

    return new Response(JSON.stringify(analysis), {
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
