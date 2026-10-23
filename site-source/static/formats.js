// Pure, shared format logic. No file, storage or network access.
export const MAX_LINES = 3000;
export const MAX_TEXT = 500000;
export function parseLyrics(text) {
  if (text.length > MAX_TEXT) throw new Error('Lyrics are too long. Use fewer than 500,000 characters.');
  const rows = text.replace(/^\uFEFF/, '').split(/\r\n?|\n/).map(x => x.trim()).filter(Boolean);
  if (!rows.length) throw new Error('Paste at least one lyric line.');
  if (rows.length > MAX_LINES) throw new Error('Use at most 3,000 lyric lines per project.');
  return rows.map((text, id) => ({ id, text, time: null }));
}
export function toClock(n) {
  const cs = Math.round(Math.max(0, n || 0) * 100);
  return `${String(Math.floor(cs / 6000)).padStart(2, '0')}:${String(Math.floor(cs / 100) % 60).padStart(2, '0')}.${String(cs % 100).padStart(2, '0')}`;
}
export function toSRT(n) {
  const ms = Math.max(0, Math.round(n * 1000));
  return `${String(Math.floor(ms / 3600000)).padStart(2,'0')}:${String(Math.floor(ms / 60000) % 60).padStart(2,'0')}:${String(Math.floor(ms / 1000) % 60).padStart(2,'0')},${String(ms % 1000).padStart(3,'0')}`;
}
export function parseClock(text) {
  const m = /^(\d+):([0-5]\d)(?:\.(\d{1,3}))?$/.exec(text.trim());
  if (!m) throw new Error('Use a timestamp such as 01:23.45 (minutes:seconds).');
  const seconds = Number(m[1]) * 60 + Number(m[2]) + Number(`0.${m[3] || '0'}`);
  if (!Number.isFinite(seconds)) throw new Error('Timestamp is too large.');
  return seconds;
}
export function validateTimed(lines, duration = 0) {
  if (!lines.length || lines.some(x => !Number.isFinite(x.time) || x.time < 0)) throw new Error('Sync every lyric line before timed export.');
  for (let i = 0; i < lines.length; i++) {
    if (i && Math.round(lines[i].time * 100) <= Math.round(lines[i-1].time * 100)) throw new Error(`Timestamps must increase by at least 0.01 seconds. Check line ${i+1}.`);
    if (duration > 0 && lines[i].time >= duration) throw new Error(`Line ${i+1} must start before the audio ends.`);
  }
}
export function exportLyrics(format, lines, duration = 0) {
  if (!lines.length) throw new Error('Paste lyrics and build a timeline first.');
  if (format === 'txt') return lines.map(x => x.text).join('\n') + '\n';
  validateTimed(lines, duration);
  if (format === 'lrc') return lines.map(x => `[${toClock(x.time)}]${x.text}`).join('\n') + '\n';
  if (format !== 'srt') throw new Error('Unsupported export format.');
  return lines.map((x, i) => {
    const start = Math.round(x.time * 1000);
    const next = i+1 < lines.length ? Math.round(lines[i+1].time * 1000) : Infinity;
    const end = Math.min(start + 4000, next - 1, duration > 0 ? Math.floor(duration * 1000) : Infinity);
    if (end <= start) throw new Error(`Subtitle ${i+1} has no display time. Move it earlier.`);
    return `${i+1}\n${toSRT(start / 1000)} --> ${toSRT(end / 1000)}\n${x.text}`;
  }).join('\n\n') + '\n';
}
