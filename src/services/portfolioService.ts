import { supabase } from '../lib/supabase';

/**
 * 시뮬레이션 포트폴리오(Alpha Fund)에 종목 추가
 */
export async function addToPortfolio(ticker: string, price: number): Promise<{ success: boolean; message: string }> {
  try {
    const { error } = await supabase
      .from('paper_portfolio')
      .upsert({
        ticker: ticker.toUpperCase(),
        status: 'OPEN',
        entry_price: price,
        current_price: price,
        pnl_percent: 0,
        updated_at: new Date().toISOString()
      }, { onConflict: 'ticker' });

    if (error) {
      console.error('Error adding to portfolio:', error);
      return { success: false, message: error.message };
    }

    return { success: true, message: `${ticker}가 포트폴리오에 추가되었습니다.` };
  } catch (error) {
    console.error('Portfolio service error:', error);
    return { success: false, message: '서버 오류가 발생했습니다.' };
  }
}
