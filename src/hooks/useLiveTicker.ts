import { useState, useEffect, useRef } from 'react';

interface TradeData {
  p: number; // Price
  s: string; // Symbol
  t: number; // Timestamp
  v: number; // Volume
}

interface WebSocketMessage {
  type: string;
  data: TradeData[];
}

export function useLiveTicker(ticker: string | null) {
  const [currentPrice, setCurrentPrice] = useState<number | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const ws = useRef<WebSocket | null>(null);

  useEffect(() => {
    if (!ticker) return;

    // Use environment variable for security. 
    // IF MISSING: We default to a placeholder or fail gracefully without crashing.
    const API_KEY = import.meta.env.VITE_FINNHUB_API_KEY;

    if (!API_KEY) {
      console.warn('⚠️ Live Ticker Disabled: Missing VITE_FINNHUB_API_KEY');
      return;
    }

    const socket = new WebSocket(`wss://ws.finnhub.io?token=${API_KEY}`);

    socket.onopen = () => {
      console.log('🟢 Live Ticker Connected:', ticker);
      setIsConnected(true);
      socket.send(JSON.stringify({ 'type': 'subscribe', 'symbol': ticker }));
    };

    socket.onmessage = (event) => {
      try {
        const message: WebSocketMessage = JSON.parse(event.data);
        if (message.type === 'trade' && message.data) {
          // Get the most recent trade
          const trade = message.data[0];
          setCurrentPrice(trade.p);
          setLastUpdate(new Date(trade.t));
        }
      } catch (err) {
        console.error('Ticker Parse Error:', err);
      }
    };

    socket.onclose = () => {
      console.log('🔴 Live Ticker Disconnected');
      setIsConnected(false);
    };

    socket.onerror = (error) => {
      console.error('Ticker WebSocket Error:', error);
      setIsConnected(false);
    };

    ws.current = socket;

    return () => {
      if (ws.current) {
        ws.current.close();
      }
    };
  }, [ticker]);

  return { currentPrice, lastUpdate, isConnected };
}
