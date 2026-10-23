"use client";

import { ChangeEvent, useEffect, useMemo, useRef, useState } from "react";

type LyricLine = { id: number; text: string; time: number | null };

const APP_STORE_URL = "https://apps.apple.com/us/app/lyrictap-auto-sync-lyrics/id6789857221";
const faqItems = [
  {
    question: "What is LyricTap?",
    answer: "LyricTap is an iPhone and iPad lyric sync app for creating timed lyrics, exporting LRC and SRT files, and making lyric videos.",
  },
  {
    question: "Is LyricTap free to use?",
    answer: "Yes. LyricTap offers free manual lyric syncing. The browser studio is free, runs locally, and requires no account; AI Auto-Sync is an optional faster workflow in the app.",
  },
  {
    question: "How does LyricTap sync lyrics?",
    answer: "LyricTap can sync lyrics manually as you tap each line, or use AI Auto-Sync to create a full editable first-pass timeline from your audio and lyrics.",
  },
  {
    question: "Which lyric files can LyricTap export?",
    answer: "LyricTap exports LRC files for synchronized lyrics, SRT files for video editors, and plain TXT lyrics.",
  },
  {
    question: "Can LyricTap create lyric videos?",
    answer: "Yes. LyricTap turns synced lyrics into portrait or landscape lyric videos using three visual templates.",
  },
  {
    question: "Which song languages does LyricTap support?",
    answer: "LyricTap supports lyric syncing for English, Japanese, and Chinese songs.",
  },
  {
    question: "Does LyricTap work with Suno or Udio songs?",
    answer: "Yes. You can import audio exported from Suno or Udio like other supported audio files. LyricTap is not officially integrated with or affiliated with either service.",
  },
  {
    question: "Does the browser studio upload my audio?",
    answer: "No. The free browser studio processes audio and lyric timing locally on your device and does not upload the selected song.",
  },
];

const structuredData = [
  {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "LyricTap",
    applicationCategory: "MultimediaApplication",
    operatingSystem: "iOS, iPadOS",
    description: "An iPhone and iPad lyric sync app with free manual syncing, AI Auto-Sync, LRC and SRT export, and lyric video creation.",
    url: "https://569001773-wq.github.io/lyrictap-support/",
    downloadUrl: APP_STORE_URL,
    featureList: [
      "Free manual lyric syncing",
      "AI Auto-Sync",
      "LRC and SRT export",
      "Lyric video creation with three templates",
      "English, Japanese, and Chinese song support",
      "Compatibility with audio exported from Suno and Udio",
    ],
  },
  {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqItems.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: { "@type": "Answer", text: item.answer },
    })),
  },
];

const demoLyrics = `Midnight moving through the glass
Every streetlight turns to gold
I can hear the seconds passing
Still the night is ours to hold`;

function formatClock(value: number, centiseconds = false) {
  if (!Number.isFinite(value)) return centiseconds ? "00:00.00" : "0:00";
  const minutes = Math.floor(value / 60);
  const seconds = Math.floor(value % 60);
  if (!centiseconds) return `${minutes}:${String(seconds).padStart(2, "0")}`;
  const fraction = Math.floor((value % 1) * 100);
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}.${String(fraction).padStart(2, "0")}`;
}

function srtTimestamp(value: number) {
  const ms = Math.max(0, Math.floor(value * 1000));
  const hours = Math.floor(ms / 3_600_000);
  const minutes = Math.floor((ms % 3_600_000) / 60_000);
  const seconds = Math.floor((ms % 60_000) / 1000);
  const milliseconds = ms % 1000;
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")},${String(milliseconds).padStart(3, "0")}`;
}

function WaveMark({ small = false }: { small?: boolean }) {
  return <span className={`wave-mark ${small ? "wave-mark--small" : ""}`} aria-hidden="true"><i /><i /><i /><i /><i /></span>;
}

export default function Home() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const timelineRef = useRef<HTMLDivElement | null>(null);
  const hasTimelineInteractionRef = useRef(false);
  const [audioUrl, setAudioUrl] = useState("");
  const [fileName, setFileName] = useState("");
  const [lyricsInput, setLyricsInput] = useState(demoLyrics);
  const [lines, setLines] = useState<LyricLine[]>(() => demoLyrics.split("\n").map((text, id) => ({ id, text, time: null })));
  const [activeIndex, setActiveIndex] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [error, setError] = useState("");

  const syncedCount = useMemo(() => lines.filter((line) => line.time !== null).length, [lines]);
  const exportReady = lines.length > 0 && syncedCount === lines.length;

  function stampCurrentLine() {
    const audio = audioRef.current;
    if (!audioUrl || !audio) { setError("Choose an audio file before you start tapping."); return; }
    if (!lines.length || activeIndex >= lines.length) return;
    hasTimelineInteractionRef.current = true;
    const stamp = Math.max(0, audio.currentTime);
    setLines((current) => current.map((line, index) => index === activeIndex ? { ...line, time: stamp } : line));
    setActiveIndex((index) => Math.min(index + 1, lines.length));
    setError("");
  }

  useEffect(() => () => { if (audioUrl) URL.revokeObjectURL(audioUrl); }, [audioUrl]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const element = event.target as HTMLElement;
      if (element.tagName === "TEXTAREA" || element.tagName === "INPUT") return;
      if (event.code === "Space") { event.preventDefault(); stampCurrentLine(); }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  });

  useEffect(() => {
    if (!hasTimelineInteractionRef.current) return;
    const container = timelineRef.current;
    const row = container?.querySelector(`[data-line="${activeIndex}"]`);
    if (!container || !(row instanceof HTMLElement)) return;
    const containerRect = container.getBoundingClientRect();
    const rowRect = row.getBoundingClientRect();
    const top = container.scrollTop + rowRect.top - containerRect.top - (container.clientHeight - rowRect.height) / 2;
    container.scrollTo({ top: Math.max(0, top), behavior: "smooth" });
  }, [activeIndex]);

  function importAudio(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    if (audioUrl) URL.revokeObjectURL(audioUrl);
    setAudioUrl(URL.createObjectURL(file));
    setFileName(file.name.replace(/\.[^.]+$/, ""));
    setCurrentTime(0); setDuration(0); setIsPlaying(false); setError("");
  }

  function buildTimeline() {
    const next = lyricsInput.split(/\r?\n/).map((text) => text.trim()).filter(Boolean).map((text, id) => ({ id, text, time: null }));
    if (!next.length) { setError("Paste at least one lyric line to build the timeline."); return; }
    hasTimelineInteractionRef.current = true;
    setLines(next); setActiveIndex(0); setError("");
  }

  function togglePlayback() {
    const audio = audioRef.current;
    if (!audioUrl || !audio) { setError("Choose an audio file first. Your file stays on this device."); return; }
    setError("");
    if (audio.paused) void audio.play(); else audio.pause();
  }

  function undoStamp() {
    if (!lines.length) return;
    hasTimelineInteractionRef.current = true;
    const target = activeIndex > 0 ? activeIndex - 1 : 0;
    setLines((current) => current.map((line, index) => index === target ? { ...line, time: null } : line));
    setActiveIndex(target);
  }

  function resetTimeline() {
    hasTimelineInteractionRef.current = true;
    setLines((current) => current.map((line) => ({ ...line, time: null })));
    setActiveIndex(0);
  }

  function adjustTime(index: number, delta: number) {
    setLines((current) => current.map((line, lineIndex) => lineIndex === index && line.time !== null ? { ...line, time: Math.max(0, line.time + delta) } : line));
  }

  function seekToLine(index: number) {
    const line = lines[index];
    if (line.time === null || !audioRef.current) return;
    hasTimelineInteractionRef.current = true;
    audioRef.current.currentTime = line.time; setCurrentTime(line.time); setActiveIndex(index);
  }

  function download(format: "lrc" | "srt" | "txt") {
    if (!exportReady) { setError("Tap every lyric line before exporting a timed file."); return; }
    let body = "";
    if (format === "lrc") body = lines.map((line) => `[${formatClock(line.time ?? 0, true)}]${line.text}`).join("\n");
    else if (format === "srt") body = lines.map((line, index) => {
      const start = line.time ?? 0;
      const next = lines[index + 1]?.time ?? Math.min(start + 4, duration || start + 4);
      return `${index + 1}\n${srtTimestamp(start)} --> ${srtTimestamp(Math.max(start + 0.5, next - 0.05))}\n${line.text}`;
    }).join("\n\n");
    else body = lines.map((line) => line.text).join("\n");
    const href = URL.createObjectURL(new Blob([body], { type: "text/plain;charset=utf-8" }));
    const anchor = document.createElement("a");
    anchor.href = href; anchor.download = `${fileName || "lyrictap-timeline"}.${format}`; anchor.click(); URL.revokeObjectURL(href);
  }

  return (
    <main>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} />
      <header className="site-header">
        <a className="brand" href="#top" aria-label="LyricTap home"><WaveMark small /><strong>LYRICTAP</strong></a>
        <nav aria-label="Primary navigation"><a href="#app">iOS App</a><a href="#studio">Free Studio</a><a href="#how">How it works</a><a href="#faq">FAQ</a></nav>
        <a className="header-download" href={APP_STORE_URL} target="_blank" rel="noreferrer">Download <span>↗</span></a>
      </header>

      <section className="intro" id="top">
        <div><p className="eyebrow"><span /> LyricTap for iPhone + iPad</p><h1>Sync lyrics.<br />Make them move.</h1></div>
        <div className="intro-side">
          <p className="intro-copy">LyricTap is a lyric sync app with free manual syncing and AI Auto-Sync. Create editable timelines, export LRC or SRT, and make lyric videos for English, Japanese, and Chinese songs.</p>
          <div className="intro-actions"><a className="primary-download" href={APP_STORE_URL} target="_blank" rel="noreferrer">Download on the App Store <span>↗</span></a><a className="studio-link" href="#studio">Try free manual sync <span>↓</span></a></div>
        </div>
      </section>

      <section className="app-section" id="app">
        <div className="app-copy">
          <p className="eyebrow light"><span /> Built for iPhone and iPad</p><h2>From first tap<br />to finished lyrics.</h2>
          <p>Start with free manual syncing, or use AI Auto-Sync to build a full editable timeline and separate vocals from the instrumental in the same task.</p>
          <a className="app-store-button" href={APP_STORE_URL} target="_blank" rel="noreferrer"><span className="apple-mark">●</span><span><small>Download on the</small><strong>App Store</strong></span></a>
        </div>
        <div className="feature-stack" aria-label="LyricTap app features">
          <article className="feature-card feature-main"><span className="feature-number">01</span><div className="mini-waveform"><i /><i /><i /><i /><i /><i /><i /><i /><i /><i /><i /></div><div><h3>AI Auto-Sync</h3><p>A full-song, editable lyric timeline from your own audio and lyrics.</p></div></article>
          <article className="feature-card"><span className="feature-number">02</span><div><h3>Lyric video creation</h3><p>Turn synced lyrics into portrait or landscape videos with three visual templates.</p></div></article>
          <article className="feature-card"><span className="feature-number">03</span><div><h3>Fine-tune & export</h3><p>Adjust every timestamp, then export LRC, SRT or TXT for English, Japanese, and Chinese songs.</p></div></article>
        </div>
      </section>

      <section className="studio-shell" id="studio">
        <div className="studio-topbar"><div className="studio-title"><WaveMark small /><span>Manual Sync Studio</span></div><div className="privacy-pill"><span>●</span> Local only · Nothing uploaded</div></div>
        <div className="studio-grid">
          <aside className="setup-panel">
            <div className="step-block">
              <div className="step-label"><span>01</span> Choose your audio</div>
              <input ref={fileInputRef} type="file" accept="audio/*" onChange={importAudio} hidden />
              <button className={`audio-drop ${audioUrl ? "has-file" : ""}`} onClick={() => fileInputRef.current?.click()}>
                <span className="upload-icon">↑</span><span><strong>{fileName || "Drop a song or browse"}</strong><small>{audioUrl ? "Ready to play · Click to replace" : "MP3, WAV, M4A and more"}</small></span>
              </button>
            </div>
            <div className="step-block lyrics-step">
              <div className="step-label"><span>02</span> Paste your lyrics</div>
              <textarea value={lyricsInput} onChange={(event) => setLyricsInput(event.target.value)} aria-label="Lyrics, one line per row" />
              <div className="textarea-meta"><span>One lyric line per row</span><span>{lyricsInput.split(/\r?\n/).filter((line) => line.trim()).length} lines</span></div>
              <button className="build-button" onClick={buildTimeline}>Build timeline <span>→</span></button>
            </div>
          </aside>

          <div className="timeline-panel">
            <audio ref={audioRef} src={audioUrl || undefined} onLoadedMetadata={(e) => setDuration(e.currentTarget.duration || 0)} onTimeUpdate={(e) => setCurrentTime(e.currentTarget.currentTime)} onPlay={() => setIsPlaying(true)} onPause={() => setIsPlaying(false)} onEnded={() => setIsPlaying(false)} />
            <div className="player-row">
              <button className="play-button" onClick={togglePlayback} aria-label={isPlaying ? "Pause" : "Play"}>{isPlaying ? "Ⅱ" : "▶"}</button>
              <div className="track-info"><strong>{fileName || "No audio selected"}</strong><span>{formatClock(currentTime)} / {duration ? formatClock(duration) : "0:00"}</span></div>
              <input className="seek" type="range" min="0" max={duration || 1} step="0.01" value={Math.min(currentTime, duration || 1)} onChange={(e) => { const next = Number(e.target.value); if (audioRef.current) audioRef.current.currentTime = next; setCurrentTime(next); }} aria-label="Audio position" />
              <button className="mini-control" onClick={() => { if (audioRef.current) audioRef.current.currentTime = Math.max(0, audioRef.current.currentTime - 5); }}>−5s</button>
            </div>
            <div className="timeline-head"><div><span className="live-dot" /> Timeline</div><span>{syncedCount} / {lines.length} synced</span></div>
            <div className="lyric-timeline" ref={timelineRef}>
              {lines.map((line, index) => (
                <div className={`lyric-row ${index === activeIndex ? "is-active" : ""} ${line.time !== null ? "is-synced" : ""}`} key={line.id} data-line={index} onDoubleClick={() => seekToLine(index)}>
                  <button className="timecode" onClick={() => seekToLine(index)} aria-label={`Seek to ${line.text}`}>{line.time === null ? "—:—.—" : formatClock(line.time, true).slice(3)}</button>
                  <span className="line-number">{String(index + 1).padStart(2, "0")}</span><p>{line.text}</p>
                  {line.time !== null && <div className="nudge-controls"><button onClick={() => adjustTime(index, -0.1)} aria-label="Move 0.1 seconds earlier">−</button><button onClick={() => adjustTime(index, 0.1)} aria-label="Move 0.1 seconds later">+</button></div>}
                </div>
              ))}
              {!lines.length && <div className="empty-state">Paste your lyrics to build a timeline.</div>}
              {activeIndex >= lines.length && lines.length > 0 && <div className="done-state">All lines synced. Your files are ready.</div>}
            </div>
            <div className="tap-console">
              <button className="tap-button" onClick={stampCurrentLine} disabled={activeIndex >= lines.length}><span>{activeIndex >= lines.length ? "SYNC COMPLETE" : "TAP CURRENT LINE"}</span><kbd>SPACE</kbd></button>
              <div className="tap-secondary"><button onClick={undoStamp}>↶ Undo</button><button onClick={resetTimeline}>↺ Start over</button></div>
            </div>
            <div className="export-row">
              <div><span className="step-label"><span>03</span> Export</span><small>{exportReady ? "Your timeline is ready" : "Sync every line to unlock export"}</small></div>
              <div className="export-buttons"><button onClick={() => download("lrc")} disabled={!exportReady}>LRC</button><button onClick={() => download("srt")} disabled={!exportReady}>SRT</button><button onClick={() => download("txt")} disabled={!exportReady}>TXT</button></div>
            </div>
            {error && <p className="error-message" role="alert">{error}</p>}
          </div>
        </div>
      </section>

      <section className="how-section" id="how">
        <div className="section-heading"><p className="eyebrow"><span /> Three moves. One clean timeline.</p><h2>Your lyrics,<br />properly timed.</h2></div>
        <div className="how-grid">
          <article><span>01</span><h3>Bring your own song</h3><p>Choose audio from your device, including tracks exported from Suno or Udio. No official integration is required.</p></article>
          <article><span>02</span><h3>Tap as each line starts</h3><p>Play the track and press Space. Nudge any timestamp by 0.1 seconds.</p></article>
          <article><span>03</span><h3>Export or make a video</h3><p>Save LRC, SRT or TXT, or use the app’s three templates to create a lyric video.</p></article>
        </div>
      </section>

      <section className="faq-section" id="faq">
        <div className="faq-heading"><p className="eyebrow"><span /> Quick answers</p><h2>LyricTap FAQ</h2></div>
        <div className="faq-grid">
          {faqItems.map((item, index) => (
            <article key={item.question}>
              <span>{String(index + 1).padStart(2, "0")}</span>
              <div><h3>{item.question}</h3><p>{item.answer}</p></div>
            </article>
          ))}
        </div>
      </section>

      <footer><a className="brand footer-brand" href="#top"><WaveMark small /><strong>LYRICTAP</strong></a><p>Your music. Your lyrics. Right on time.</p><div><a href={APP_STORE_URL} target="_blank" rel="noreferrer">App Store ↗</a><a href="/lyrictap-support/privacy/">Privacy</a><a href="/lyrictap-support/support/">Support</a><span>© 2026 LyricTap</span></div></footer>
    </main>
  );
}
