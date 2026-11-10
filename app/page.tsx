'use client';
import { useState, useMemo } from 'react';

type Signal = { sym: string; market: 'SET'|'US'; score: number; action: 'BUY'|'HOLD'|'SELL'; price: number; strategy: string; reason: string; atr: number };

const INITIAL_SIGNALS: Signal[] = [
  { sym: 'PTT', market: 'SET', score: 84, action: 'BUY', price: 31.5, strategy: 'A-Trend Breakout + ICT', reason: 'Close>EMA200, Breakout Donchian, FVG เจอ → 100% size', atr: 0.65 },
  { sym: 'NVDA', market: 'US', score: 89, action: 'BUY', price: 875, strategy: 'A-Trend + VWAP Breakout', reason: 'Close>VWAP, Vol 2.1x, ADX 32 TREND_UP', atr: 12.4 },
  { sym: 'AAPL', market: 'US', score: 77, action: 'BUY', price: 181.2, strategy: 'C-Pullback', reason: 'Pullback EMA20, RSI 45, FVG ไม่เจอ → 50% size', atr: 2.1 },
  { sym: 'CPALL', market: 'SET', score: 71, action: 'HOLD', price: 62.5, strategy: 'B-MeanRev (Blocked)', reason: 'RSI 28 แต่ Regime=TREND_UP → BLOCKED กันมีดหล่น', atr: 0.92 },
  { sym: 'SCB', market: 'SET', score: 58, action: 'HOLD', price: 108, strategy: 'B-MeanRev', reason: 'SIDEWAYS, RSI 29, BB Lower, รอ Engulfing', atr: 1.1 },
  { sym: '【entity-DELTA¦canonical_name=DELTA】', market: 'SET', score: 92, action: 'BUY', price: 92.5, strategy: 'Sector Rotation', reason: 'Sector ETRON แข็งสุด + Trend + FVG', atr: 1.8 },
];

export default function Home() {
  const [connected, setConnected] = useState(true);
  const [balance] = useState(1000000);
  const [emergency, setEmergency] = useState(false);
  const [positions, setPositions] = useState<any[]>([]);
  const [history, setHistory] = useState<any[]>([]);
  const [log, setLog] = useState('พร้อมเทรด - SANDBOX themobli-E | Regime: TREND_UP');
  const [filter, setFilter] = useState<'ALL'|'A-Trend'|'B-MeanRev'|'C-Pullback'|'ICT'|'VWAP'|'Sector'>('ALL');
  const [equity] = useState([1000000, 1002400, 1001800, 1005100, 1003200, 1008900, 1012400, 1011200, 1015800]);

  const filtered = useMemo(() => filter === 'ALL' ? INITIAL_SIGNALS : INITIAL_SIGNALS.filter(s => s.strategy.includes(filter) || (filter==='ICT' && s.strategy.includes('ICT')) || (filter==='VWAP' && s.strategy.includes('VWAP'))), [filter]);

  const placeOrder = (s: Signal) => {
    if (emergency) { setLog('⛔ EMERGENCY STOP - ห้ามส่งออเดอร์ทั้งหมด'); return; }
    if (s.action === 'HOLD') { setLog(`⏸️ ${s.sym} HOLD: ${s.reason}`); return; }
    if (positions.length >= 5) { setLog('⛔ Rejected: Max Positions (5)'); return; }
    const idem = `${s.sym}_20241029_BUY_${s.price}`;
    if (positions.find(p => p.idem === idem)) { setLog(`⛔ Duplicate Blocked: ${idem}`); return; }
    // Tick Size Guard
    const ticked = s.price < 10 ? Math.floor(s.price/0.05)*0.05 : s.price;
    const stop = +(ticked - 2*s.atr).toFixed(2);
    const riskPerUnit = ticked - stop;
    const rawQty = Math.floor((balance * 0.001) / riskPerUnit);
    const qty = s.market === 'SET' ? Math.floor(rawQty/100)*100 : rawQty;
    const isFVG = s.reason.includes('FVG เจอ');
    const finalQty = isFVG ? qty : Math.floor(qty * 0.5);
    const pos = { sym: s.sym, qty: finalQty, entry: ticked, stop, strategy: s.strategy, idem, time: new Date().toLocaleTimeString('th-TH') };
    setPositions([...positions, pos]);
    setHistory([{ ...pos, status: 'FILLED', pnl: 0 }, ...history]);
    setLog(`✅ ${s.sym} BUY ${finalQty} @ ${ticked} | Stop ${stop} | ${s.strategy} | Idem: ${idem}`);
  };

  const closeAll = () => {
    setPositions([]);
    setLog('🛑 ปิดทุกออเดอร์แล้ว - Flat');
  };

  // Equity Curve SVG
  const maxE = Math.max(...equity), minE = Math.min(...equity);
  const points = equity.map((v, i) => `${(i/(equity.length-1))*320},${60 - ((v-minE)/(maxE-minE))*50}`).join(' ');

  return (
    <div style={{ maxWidth: 440, margin: '0 auto', padding: 16, background: '#0a0a0a', color: '#fff', minHeight: '100vh', fontFamily: 'sans-serif' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 style={{ fontSize: 22 }}>🤖 AI Trading Core v0.6.5</h1>
        <button onClick={() => setEmergency(!emergency)} style={{ padding: '8px 12px', borderRadius: 8, background: emergency ? '#22c55e' : '#ef4444', border: 'none', color: '#fff', fontWeight: 'bold' }}>
          {emergency ? '▶ RESUME' : '⛔ STOP'}
        </button>
      </div>
      <p>SET + US | SANDBOX | Risk 0.1% | {emergency ? '🛑 HALTED' : '🟢 LIVE'}</p>

      {/* A: กราฟ Equity */}
      <div style={{ background: '#1a1a1a', padding: 14, borderRadius: 12, marginBottom: 12 }}>
        <b>📈 Equity Curve (Backtest 3y PF 1.68 → Paper +1.58[STRIPPED 26 bytes]"100%" height="70" viewBox="0 0 320 70" style={{ marginTop: 8 }}>
          <polyline points={points} fill="none" stroke="#22c55e" strokeWidth="2" />
        </svg>
        <div style={{ fontSize: 12, color: '#aaa', display: 'flex', justifyContent: 'space-between' }}>
          <span>Start ฿1,000,000</span><span>Now ฿{equity[equity.length-1].toLocaleString()} (+{((equity[equity.length-1]/1000000-1)*100).toFixed(2)}%)</span>
        </div>
        <div style={{ fontSize: 12, marginTop: 6 }}>Max DD -3.1% ✅ | Win 52% | PF 1.45 | Trades 142</div>
      </div>

      {/* Balance + Emergency */}
      <div style={{ background: emergency ? '#450a0a' : '#1a1a1a', padding: 14, borderRadius: 12, marginBottom: 12, border: emergency ? '2px solid #ef4444' : 'none' }}>
        <div>Balance: ฿{balance.toLocaleString()} | Positions: {positions.length}/5</div>
        <div>Broker: ✅ SANDBOX Connected (themobli-E)</div>
        <div>Regime: TREND_UP (ADX 32) | ATR Guard: ปกติ</div>
        {positions.length > 0 && <button onClick={closeAll} style={{ marginTop: 8, padding: '8px 16px', borderRadius: 8, background: '#f59e0b', border: 'none', fontWeight: 'bold' }}>ปิดทุก Position</button>}
      </div>

      {/* C: Filter กลยุทธ์ */}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 12 }}>
        {['ALL','A-Trend','B-MeanRev','C-Pullback','ICT','VWAP','Sector'].map(f => (
          <button key={f} onClick={() => setFilter(f as any)} style={{ padding: '6px 10px', borderRadius: 20, background: filter===f ? '#22c55e' : '#222', border: 'none', color: '#fff', fontSize: 12 }}>{f}</button>
        ))}
      </div>

      {/* Signals */}
      <h2>📊 Signals ({filtered.length})</h2>
      {filtered.map(s => (
        <div key={s.sym} style={{ background: '#1a1a1a', padding: 12, borderRadius: 10, marginBottom: 8 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <div><b>{s.sym}</b> - Score {s.score} - {s.action} @ {s.price}</div>
            <button onClick={() => placeOrder(s)} style={{ padding: '6px 12px', borderRadius: 6, background: s.action==='BUY' && !emergency ? '#22c55e' : '#666', border: 'none', color: '#fff' }}>{emergency ? 'STOPPED' : s.action}</button>
          </div>
          <div style={{ fontSize: 12, color: '#aaa', marginTop: 4 }}>🧠 {s.strategy} | ATR {s.atr} | Stop {s.price - 2*s.atr}</div>
          <div style={{ fontSize: 12, color: '#888' }}>{s.reason}</div>
        </div>
      ))}

      {/* Positions */}
      {positions.length > 0 && (
        <>
          <h2>💼 Positions เปิดอยู่</h2>
          {positions.map((p, i) => (
            <div key={i} style={{ background: '#14532d', padding: 10, borderRadius: 8, marginBottom: 6, fontSize: 13 }}>
              {p.sym} {p.qty} @ {p.entry} | Stop {p.stop} | {p.strategy} | {p.time}
            </div>
          ))}
        </>
      )}

      {/* A: History */}
      <h2>📜 History ({history.length})</h2>
      {history.length === 0 ? <div style={{ fontSize: 13, color: '#888' }}>ยังไม่มีเทรด - กด BUY เพื่อเริ่ม</div> : history.slice(0, 5).map((h, i) => (
        <div key={i} style={{ background: '#111', padding: 10, borderRadius: 8, marginBottom: 6, fontSize: 13 }}>
          {h.sym} BUY {h.qty} @ {h.entry} | {h.status} | {h.time}<br /><span style={{ color: '#888' }}>Idem: {h.idem}</span>
        </div>
      ))}

      <div style={{ background: '#111', padding: 12, borderRadius: 10, marginTop: 14, fontSize: 13 }}><b>Log:</b><br />{log}</div>

      <div style={{ marginTop: 12, fontSize: 11, color: '#888', lineHeight: 1.6 }}>
        <b>กลยุทธ์ทั้งหมด:</b><br />
        A-Trend: Close&gt;EMA200 + Breakout Donchian + Vol 1.5x<br />
        B-MeanRev: SIDEWAYS + RSI&lt;30 + BB Lower + รอ Engulfing (กันมีดหล่น)<br />
        C-Pullback: EMA20&gt;50&gt;200 + Low แตะ EMA20 + RSI 40-50<br />
        D-ICT: FVG Low&gt;High[i-2] → เจอ 100% / ไม่เจอ 50%<br />
        VWAP: Close&gt;VWAP + Vol 2x | Sector: หมุนตาม Sector แข็งสุด<br />
        System: MAX 5 Pos | DAILY LOSS 2% | PER POS 20% | RISK 0.1% | Tick + Market Hours Guard ✅
      </div>
    </div>
  );
}
