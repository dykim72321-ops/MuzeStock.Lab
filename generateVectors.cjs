require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const { OpenAI } = require('openai');

// 환경변수 체크
if (!process.env.VITE_SUPABASE_URL && !process.env.SUPABASE_URL) {
    console.error('❌ .env.local 파일에 SUPABASE_URL이 필요합니다.');
    process.exit(1);
}

if (!process.env.OPENAI_API_KEY) {
    console.error('❌ .env.local 파일에 OPENAI_API_KEY가 필요합니다.');
    process.exit(1);
}

const supabase = createClient(
    process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY
);
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

async function generateVectors() {
    console.log('🧠 [Admin Tool] 전설적 종목 패턴 학습 시작...');

    // 임베딩이 비어있는(null) 데이터만 조회
    const { data: legends, error } = await supabase
        .from('stock_legends')
        .select('*')
        .is('embedding', null);

    if (error) {
        console.error('❌ DB 조회 실패:', error.message);
        return;
    }

    if (!legends || legends.length === 0) {
        console.log('✅ 모든 데이터가 이미 학습되어 있습니다.');
        return;
    }

    console.log(`총 ${legends.length}개의 새로운 전설을 학습합니다.`);

    for (const legend of legends) {
        try {
            // 학습 텍스트를 풍부하게 구성 (이름 + 티커 + 설명)
            const textToEmbed = `Stock: ${legend.name} (${legend.ticker})\nPeriod: ${legend.period}\nDescription: ${legend.description}`;

            const response = await openai.embeddings.create({
                model: "text-embedding-3-small",
                input: textToEmbed,
            });

            const vector = response.data[0].embedding;

            // DB 업데이트
            const { error: updateError } = await supabase
                .from('stock_legends')
                .update({ embedding: vector })
                .eq('id', legend.id);

            if (updateError) throw updateError;

            console.log(`   ✨ 학습 완료: ${legend.ticker}`);

            // API 속도 제한 방지를 위한 짧은 대기
            await new Promise(r => setTimeout(r, 200));

        } catch (err) {
            console.error(`   ⚠️ 실패 (${legend.ticker}):`, err.message);
        }
    }
    console.log('🎉 모든 학습이 완료되었습니다.');
}

generateVectors();
