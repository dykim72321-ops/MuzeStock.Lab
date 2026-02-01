require('dotenv').config({ path: '.env.local' });
require('dotenv').config(); // Load secondary .env if exists
const { createClient } = require('@supabase/supabase-js');
const { OpenAI } = require('openai');

// Use VITE_ or direct env vars depending on context
const supabase = createClient(
  process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL, 
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY
);
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

async function generateVectors() {
  console.log('🧠 [Legend Memory] 과거 전설적인 종목들의 패턴을 학습합니다...');

  // 1. 임베딩이 없는(null) 데이터만 가져오기
  const { data: legends, error } = await supabase
    .from('stock_legends')
    .select('*')
    .is('embedding', null);

  if (error) return console.error('Error fetching legends:', error);
  if (!legends || legends.length === 0) return console.log('✅ 모든 종목이 이미 학습되어 있습니다.');

  console.log(`총 ${legends.length}개의 새로운 전설을 벡터화합니다.`);

  for (const legend of legends) {
    console.log(`   Processing: ${legend.ticker} (${legend.period})...`);

    // 2. 학습할 텍스트 구성 (이름 + 설명 + 주요 지표)
    const textToEmbed = `
      Stock: ${legend.ticker} - ${legend.name} (${legend.period})
      Pattern Description: ${legend.description}
      Key Metrics: ${JSON.stringify(legend.metrics)}
    `;

    try {
      // 3. OpenAI Embedding API 호출
      const embeddingResponse = await openai.embeddings.create({
        model: "text-embedding-3-small",
        input: textToEmbed,
      });

      const vector = embeddingResponse.data[0].embedding;

      // 4. DB 업데이트
      const { error: updateError } = await supabase
        .from('stock_legends')
        .update({ embedding: vector })
        .eq('id', legend.id);

      if (updateError) console.error(`   ❌ Failed to update ${legend.ticker}:`, updateError.message);
      else console.log(`   ✨ 학습 완료: ${legend.ticker}`);

    } catch (err) {
      console.error(`   ⚠️ OpenAI API Error for ${legend.ticker}:`, err.message);
    }
  }
  console.log('🎉 모든 전설적 패턴의 벡터화가 완료되었습니다.');
}

generateVectors();
