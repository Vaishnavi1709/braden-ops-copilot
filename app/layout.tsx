import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Braden Ops Co-Pilot — AI Daily Briefings",
  description:
    "AI-generated morning briefings for every store in the Braden Auto Group. Yesterday's KPIs, anomalies explained, three actions for today.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <header className="sticky top-0 z-30 backdrop-blur border-b border-[var(--color-border)] bg-[color-mix(in_oklab,var(--color-background)_85%,transparent)]">
          <div className="mx-auto max-w-7xl px-6 h-14 flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2.5 group">
              <span className="size-6 rounded-md bg-gradient-to-br from-[var(--color-accent)] to-[var(--color-positive)] grid place-items-center">
                <span className="size-2 rounded-sm bg-[var(--color-background)]" />
              </span>
              <span className="font-semibold tracking-tight text-[15px]">
                Braden Ops Co-Pilot
              </span>
              <span className="text-[10px] font-medium tracking-widest text-[var(--color-muted)] uppercase border border-[var(--color-border-strong)] rounded px-1.5 py-0.5 ml-1">
                Daily Briefings
              </span>
            </Link>
            <nav className="flex items-center gap-1 text-sm">
              <Link
                href="/"
                className="px-3 py-1.5 rounded-md text-[var(--color-muted)] hover:text-[var(--color-foreground)] hover:bg-[var(--color-surface-2)] transition-colors"
              >
                Command Center
              </Link>
              <Link
                href="/about"
                className="px-3 py-1.5 rounded-md text-[var(--color-muted)] hover:text-[var(--color-foreground)] hover:bg-[var(--color-surface-2)] transition-colors"
              >
                How it works
              </Link>
            </nav>
          </div>
        </header>
        <main className="flex-1 flex flex-col">{children}</main>
        <footer className="border-t border-[var(--color-border)] py-6 px-6 text-xs text-[var(--color-subtle)]">
          <div className="mx-auto max-w-7xl flex items-center justify-between">
            <span>
              Built for the Braden Auto Group AI Operations Builder application.
            </span>
            <span className="font-mono">v0.1.0</span>
          </div>
        </footer>
      </body>
    </html>
  );
}
