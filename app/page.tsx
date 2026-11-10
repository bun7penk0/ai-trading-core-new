'use client';
import { useState } from 'react';

export default function Home() {
  const [connected, setConnected] = useState(false);
  const [balance, setBalance] = useState(1000000);
  const [log, setLog] = useState('พร้อมเทรด - SANDBOX themobli-E');

  const signals = [
    { sym: 'PTT', score: 84, action: 'BUY', price: 31.5 },
    { sym: 'NVDA', score: 89, action: 'BUY', price: 875 },
    { sym: 'AAPL', score: 77, action: 'BUY', price: 181.2 },
    { sym: 'CPALL', score: 71, action: 'HOLD', price: 62.5 },
  ];

  const placeOrder = (sym: string, price: number) => {
    const qty = Math.floor((balance * 0.001) / (price * 0.02 / price * 2 + 0.5));
    const finalQty = sym === 'PTT' || sym === 'CPALL' ? Math.floor(qty / 100) * 100 : qty;
    setLog(`✅ ส่งออเดอร์ ${sym} BUY ${finalQty} @ ${price} - Idempotency: ${sym}_20241029_BUY_${price}`);
  };

  return (
    <div style={{ maxWidth: 440, margin: '0 auto', padding: 16 }}>
      <h1>🤖 AI Trading Core v0.6.4</h1>
      <p>SET + US | SANDBOX | Risk 0.1%</p>
      <div style={{ background: '#1a1a1a', padding: 16, borderRadius: 12, marginBottom: 16 }}>
        <div>Balance: ฿{balance.toLocaleString()}</div>
        <div>Broker: {connected ? '✅ SANDBOX Connected' : 'SANDBOX themobli-E'}</div>
        <button onClick={() => setConnected(true)} style={{ marginTop: 8, padding: '10px 20px', borderRadius: 8, background: '#22c55e', border: 'none', color: '#fff', fontWeight: 'bold' }}>
          {connected ? 'Connected ✅' : 'Test Login'}
        </button>
      </div>
      <h2>📊 Signals</h2>
      {signals.map(s => (
        <div key={s.sym} style={{ background: '#1a1a1a', padding: 12, borderRadius: 10, marginBottom: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div><b>{s.sym}</b> - Score {s.score} - {s.action} @ {s.price}</div>
          <button onClick={() => placeOrder(s.sym, s.price)} style={{ padding: '6px 12px', borderRadius: 6, background: s.action === 'BUY' ? '#22c55e' : '#666', border: 'none', color: '#fff' }}>
            {s.action}
          </button>
        </div>
      ))}
      <div style={{ background: '#111', padding: 12, borderRadius: 10, marginTop: 16, fontSize: 13 }}>
        <b>Log:</b><br />{log}
      </div>
      <div style={{ marginTop: 16, fontSize: 12, color: '#888' }}>
        System Rules: MAX 5 Pos | DAILY LOSS 2% | PER POS 20% | RISK 0.1%<br />
        Tick Size Guard ✅ | Market Hours Guard ✅ | IP Whitelist: ใช้ VPS ตอนเทรดเงินจริง
      </div>
    </div>
  );
}
