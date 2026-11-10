export function isMarketOpen(market: 'SET'|'US'): boolean {
  const ict = new Date(new Date().toLocaleString('en-US', {timeZone: 'Asia/Bangkok'}));
  const day = ict.getDay();
  if (day===0 || day===6) return false;
  const h = ict.getHours() + ict.getMinutes()/60;
  if (market === 'SET') return (h>=10 && h<12.5) || (h>=14.5 && h<16.5);
  return h>=21.5 || h<4;
}
