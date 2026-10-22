import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://569001773-wq.github.io/lyrictap-support/"),
  title: "LyricTap — Lyric Sync App for iPhone & iPad",
  description: "LyricTap is an iPhone and iPad lyric sync app with free manual sync, AI Auto-Sync, LRC/SRT export, lyric videos, and English, Japanese, and Chinese song support.",
  keywords: ["lyric sync app", "LRC editor", "SRT lyrics", "lyric video maker", "AI lyric sync", "Suno lyrics", "Udio lyrics"],
  alternates: { canonical: "https://569001773-wq.github.io/lyrictap-support/" },
  robots: { index: true, follow: true },
  icons: { icon: "/lyrictap-support/studio-favicon.svg", shortcut: "/lyrictap-support/studio-favicon.svg" },
  openGraph: { title: "LyricTap — Lyric Sync App for iPhone & iPad", description: "Free manual lyric sync, AI Auto-Sync, LRC/SRT export, and lyric video creation for English, Japanese, and Chinese songs.", type: "website", url: "https://569001773-wq.github.io/lyrictap-support/" },
  twitter: { card: "summary", title: "LyricTap — Lyric Sync App for iPhone & iPad", description: "Free manual lyric sync, AI Auto-Sync, LRC/SRT export, and lyric video creation." },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
