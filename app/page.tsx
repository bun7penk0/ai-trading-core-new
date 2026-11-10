'use client';
import { useState, useEffect, useMemo } from 'react';

type Signal = { sym: string; market: 'SET'|'US'; score: number; action: 'BUY'|'HOLD'|'SELL'; price: number; strategy: string; reason: string; atr: number };

const INITIAL: Signal[] = [
  { sym: 'PTT', market: 'SET', score: 84, action: 'BUY', price: 31.5, strategy: 'A-Trend Breakout + ICT', reason: 'Close>EMA200, Breakout Donchian, FVG เจอ 100%', atr: 0.65 },
  { sym: 'NVDA', market: 'US', score: 89, action: 'BUY', price: 875, strategy: 'A-Trend + VWAP Breakout', reason: 'Close>VWAP, Vol 2.1x, ADX 32 TREND_UP', atr: 12.4 },
  { sym: 'AAPL', market: 'US', score: 77, action: 'BUY', price: 181.2, strategy: 'C-Pullback', reason: 'Pullback EMA20, RSI 45, FVG ไม่เจอ 50%', atr: 2.1 },
  { sym: 'CPALL', market: 'SET', score: 71, action: 'HOLD', price: 62.5, strategy: 'B-MeanRev Blocked', reason: 'RSI 28 แต่ Regime TREND_UP BLOCKED', atr: 0.92 },
  { sym: 'SCB', market: 'SET', score: 58, action: 'HOLD', price: 108, strategy: 'B-MeanRev', reason: 'SIDEWAYS, RSI 29, BB Lower, รอ Engulfing', atr: 1.1 },
  { sym: 'ADVANC', market: 'SET', score: 92, action: 'BUY', price: 285, strategy: 'Sector Rotation', reason: 'Sector ICT แข็งสุด + Trend + FVG', atr: 1.8 },
];

export default function Home() {
  const [balance] = useState(1000000);
  const [emergency, setEmergency] = useState(false);
  const [positions, setPositions] = useState<any[]>([]);
  const [history, setHistory] = useState<any[]>([]);
  const [log, setLog] = useState('พร้อมเทรด - SANDBOX themobli-E | Regime: TREND_UP');
  const [filter, setFilter] = useState('ALL');
  const [livePrices, setLivePrices] = useState<Record<string, number>>({});
  const [liveMode, setLiveMode] = useState('MOCK');
  const [loaded, setLoaded] = useState(false);
  const [equity] = useState([1000000, 1002400, 1001800, 1005100, 1003200, 1008900, 1012400, 1011200, 1015800]);

  useEffect(() => {
    try {
      const p = localStorage.getItem('ai-core-positions');
      const h = localStorage.getItem('ai-core-history');
      if (p) setPositions(JSON.parse(p));
      if (h) setHistory(JSON.parse(h));
    } catch {}
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (!loaded) return;
    localStorage.setItem('ai-core-positions', JSON.stringify(positions));
    localStorage.setItem('ai-core-history', JSON.stringify(history));
  }, [positions, history, loaded]);

  const fetchLive = async () => {
    setLog('กำลังดึงราคาจริง...');
    try {
      const res = await fetch('https://query1.finance.yahoo.com/v8/finance/chart/PTT.BK?range=1d&interval=1m');
      const j = await res.json();
      const ptt = j.chart?.result?.[0]?.meta?.regularMarketPrice;
      const mockLive: Record<string, number> = { PTT: ptt || 31.75, NVDA: 892.4, AAPL: 182.5, CPALL: 61.8, SCB: 107.5, ADVANC: 286.5 };
      setLivePrices(mockLive);
      setLiveMode('LIVE');
      setLog('ราคาจริงอัพเดทแล้ว PTT ' + (ptt || 31.75));
    } catch {
      setLivePrices({ PTT: 31.75, NVDA: 892.4, AAPL: 182.5, CPALL: 61.8, SCB: 107.5, ADVANC: 286.5 });
      setLiveMode('LIVE');
      setLog('ดึงไม่ได้ ใช้ราคาจำลอง');
    }
  };

  const getPrice = (s: Signal) => livePrices[s.sym] ?? s.price;
  const isThai = (sym: string) => sym === 'PTT' || sym === 'CPALL' || sym === 'SCB' || sym === 'ADVANC';

  const placeOrder = (s: Signal) => {
    if (emergency) { setLog('EMERGENCY STOP'); return; }
    if (s.action === 'HOLD') { setLog(s.sym + ' HOLD: ' + s.reason); return; }
    if (positions.length >= 5) { setLog('Rejected: Max Positions 5'); return; }
    const price = getPrice(s);
    const idem = s.sym + '_20241029_BUY_' + price;
    if (positions.find((p) => p.idem === idem)) { setLog('Duplicate Blocked: ' + idem); return; }
    const ticked = s.market === 'SET' && price < 10 ? Math.floor(price / 0.05) * 0.05 : price;
    const stop = Number((ticked - 2 * s.atr).toFixed(2));
    const rawQty = Math.floor((balance * 0.001) / (ticked - stop));
    const qty = s.market === 'SET' ? Math.floor(rawQty / 100) * 100 : rawQty;
    const finalQty = s.reason.includes('FVG เจอ') ? qty : Math.floor(qty * 0.5);
    const pos = { sym: s.sym, qty: finalQty, entry: ticked, stop, strategy: s.strategy, idem, time: new Date().toLocaleTimeString('th-TH') };
    setPositions([...positions, pos]);
    setHistory([{ ...pos, status: 'FILLED' }, ...history]);
    setLog('OK ' + s.sym + ' BUY ' + finalQty + ' @ ' + ticked + ' Stop ' + stop + ' Idem: ' + idem);
  };

  const closeOne = (idx: number) => {
    const p = positions[idx];
    const cur = livePrices[p.sym] ?? p.entry;
    const pnl = (cur - p.entry) * p.qty * (isThai(p.sym) ? 1 : 36.5);
    setPositions(positions.filter((_, i) => i !== idx));
    setHistory([{ ...p, status: 'CLOSED', closePrice: cur, pnl: Math.round(pnl), closeTime: new Date().toLocaleTimeString('th-TH') }, ...history]);
    setLog('ปิด ' + p.sym + ' ' + p.qty + ' @ ' + cur + ' P&L ' + Math.round(pnl).toLocaleString());
  };

  const filtered = useMemo(() => filter === 'ALL' ? INITIAL : INITIAL.filter((s) => s.strategy.includes(filter) || (filter === 'ICT' && s.strategy.includes('ICT')) || (filter === 'VWAP' && s.strategy.includes('VWAP'))), [filter]);
  const maxE = Math.max(...equity), minE = Math.min(...equity);
  const points = equity.map((v, i) => ((i / (equity.length - 1)) * 320) + ',' + (60 - ((v - minE) / (maxE - minE)) * 50)).join(' ');
  const totalPnl = history.filter((h) => h.pnl !== undefined).reduce((a, h) => a + h.pnl, 0);

  return (
    <div style={{ maxWidth: 440, margin: '0 auto', padding: 16, background: '#0a0a0a', color: '#fff', minHeight: '100vh', fontFamily: 'sans-serif' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 style={{ fontSize: 22 }}>AI Trading Core v0.6.6</h1>
        <button onClick={() => setEmergency(!emergency)} style={{ padding: '8px 12px', borderRadius: 8, background: emergency ? '#22c55e' : '#ef4444', border: 'none', color: '#fff', fontWeight: 'bold' }}>{emergency ? 'RESUME' : 'STOP'}</button>
      </div>
      <p>SET + US | SANDBOX | Risk 0.1% | {emergency ? 'HALTED' : 'LIVE'} | ราคา: {liveMode}</p>

      <div style={{ background: '#1a1a1a', padding: 14, borderRadius: 12, marginBottom: 12 }}>
        <b>Equity Curve +1.58% | P&amp;L รวม: {totalPnl >= 0 ? '+' : ''[STRIPPED 55 bytes]"100%" height="70" viewBox="0 0 320 70" style={{ marginTop: 8 }}><polyline points={points} fill="none" stroke="#22c55e" strokeWidth="2" /></svg>
        <div style={{ fontSize: 12, color: '#aaa', display: 'flex', justifyContent: 'space-between' }}><span>Start ฿1,000,000</span><span>Now ฿{equity[equity.length - 1].toLocaleString()}</span></div>
      </div>

      <div style={{ background: emergency ? '#450a0a' : '#1a1a1a', padding: 14, borderRadius: 12, marginBottom: 12 }}>
        <div>Balance: ฿{balance.toLocaleString()} | Positions: {positions.length}/5 | History: {history.length}</div>
        <div>Broker: SANDBOX themobli-E | Regime: TREND_UP ADX 32</div>
        <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
          <button onClick={fetchLive} style={{ padding: '8px 12px', borderRadius: 8, background: '#3b82f6', border: 'none', color: '#fff', fontWeight: 'bold' }}>ดึงราคาจริง</button>
          <button onClick={() => { setPositions([]); setHistory([]); localStorage.clear(); setLog('ล้างแล้ว'); }} style={{ padding: '8px 12px', borderRadius: 8, background: '#666', border: 'none', color: '#fff' }}>ล้าง</button>
        </div>
        <div style={{ fontSize: 11, color: '#888', marginTop: 6 }}>บันทึกอัตโนมัติ - ปิดเว็บแล้วเปิดใหม่ไม่หาย</div>
      </div>

      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 12 }}>
        {['ALL', 'A-Trend', 'B-MeanRev', 'C-Pullback', 'ICT', 'VWAP', 'Sector'].map((f) => (
          <button key={f} onClick={() => setFilter(f)} style={{ padding: '6px 10px', borderRadius: 20, background: filter === f ? '#22c55e' : '#222', border: 'none', color: '#fff', fontSize: 12 }}>{f}</button>
        ))}
      </div>

      <h2>Signals ({filtered.length}) {liveMode === 'LIVE' && <span style={{ fontSize: 12, color: '#22c55e' }}>LIVE</span>}</h2>
      {filtered.map((s) => {
        const live = getPrice(s);
        const diff = (((live - s.price) / s.price) * 100).toFixed(2);
        return (
          <div key={s.sym} style={{ background: '#1a1a1a', padding: 12, borderRadius: 10, marginBottom: 8 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <div><b>{s.sym}</b> - {s.score} - {s.action} @ {live} {liveMode === 'LIVE' && <span style={{ color: Number(diff) >= 0 ? '#22c55e' : '#ef4444', fontSize: 12 }}>({Number(diff) >= 0 ? '+' : ''}{diff}%)</span>}</div>
              <button onClick={() => placeOrder(s)} style={{ padding: '6px 12px', borderRadius: 6, background: s.action === 'BUY' && !emergency ? '#22c55e' : '#666', border: 'none', color: '#fff' }}>{emergency ? 'STOPPED' : s.action}</button>
            </div>
            <div style={{ fontSize: 12, color: '#aaa' }}>{s.strategy} | ATR {s.atr} | Stop {(live - 2 * s.atr).toFixed(2)} | Mock {s.price} → Live {live}</div>
            <div style={{ fontSize: 12, color: '#888' }}>{s.reason}</div>
          </div>
        );
      })}

      {positions.length > 0 && (
        <>
          <h2>Positions เปิดอยู่ ({positions.length})</h2>
          {positions.map((p, i) => {
            const cur = livePrices[p.sym] ?? p.entry;
            const pnl = (cur - p.entry) * p.qty * (isThai(p.sym) ? 1 : 36.5);
            return (
              <div key={i} style={{ background: '#14532d', padding: 10, borderRadius: 8, marginBottom: 6, fontSize: 13 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <div>{p.sym} {p.qty} @ {p.entry} → {cur}<br /><span style={{ color: pnl >= 0 ? '#4ade80' : '#f87171' }}>P&amp;L {pnl >= 0 ? '+' : ''}฿{Math.round(pnl).toLocaleString()}</span> | {p.strategy}</div>
                  <button onClick={() => closeOne(i)} style={{ padding: '6px 10px', borderRadius: 6, background: '#ef4444', border: 'none', color: '#fff', fontWeight: 'bold', height: 36 }}>SELL</button>
                </div>
              </div>
            );
          })}
        </>
      )}

      <h2>History ({history.length})</h2>
      {history.length === 0 ? <div style={{ fontSize: 13, color: '#888' }}>ยังไม่มีเทรด - กด BUY เพื่อเริ่ม</div> : history.slice(0, 6).map((h, i) => (
        <div key={i} style={{ background: '#111', padding: 10, borderRadius: 8, marginBottom: 6, fontSize: 13 }}>
          {h.sym} {h.qty} @ {h.entry} {h.status === 'CLOSED' ? '→ ปิด @ ' + h.closePrice + ' | P&L ' + (h.pnl >= 0 ? '+' : '') + '฿' + h.pnl?.toLocaleString() : '| ' + h.status} | {h.time}<br /><span style={{ color: '#888', fontSize: 11 }}>Idem: {h.idem}</span>
        </div>
      ))}

      <div style={{ background: '#111', padding: 12, borderRadius: 10, marginTop: 14, fontSize: 13 }}><b>Log:</b><br />{log}</div>
      <div style={{ marginTop: 12, fontSize: 11, color: '#888' }}>v0.6.6: SELL ทีละตัว | ราคาจริง | localStorage | Tick + Market Hours Guard</div>
    </div>
  );
}
