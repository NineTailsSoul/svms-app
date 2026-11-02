const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const pad = (n: number) => String(n).padStart(2, '0');

export function formatTime(ts: number): string {
  const d = new Date(ts);
  const h = d.getHours();
  const hh = h % 12 === 0 ? 12 : h % 12;
  return `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}, ${pad(hh)}:${pad(d.getMinutes())} ${h >= 12 ? 'PM' : 'AM'}`;
}

export function timeAgo(ts: number): string {
  const s = Math.max(0, Math.floor((Date.now() - ts) / 1000));
  if (s < 60) return 'just now';
  if (s < 3600) return `${Math.floor(s / 60)} min ago`;
  if (s < 86400) return `${Math.floor(s / 3600)} h ago`;
  return `${Math.floor(s / 86400)} d ago`;
}

export const formatCoord = (lat: number, lng: number) => `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
export const caseId = (id: string) => `#${id.slice(-5).toUpperCase()}`;
export const mapsLink = (lat: number, lng: number) => `https://www.google.com/maps?q=${lat},${lng}`;
export const mapsEmbed = (lat: number, lng: number) =>
  `https://maps.google.com/maps?q=${lat},${lng}&z=16&output=embed`;
