import "./globals.css";

export const metadata = {
  title: "Options Strategy Lab",
  description: "Interactive decision platform for multi-leg options strategies.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <div className="container py-10">
          <header className="flex items-center justify-between border-b border-sand-200 pb-6">
            <div>
              <p className="text-sm font-mono text-ink-500">Options Strategy Lab</p>
              <h1 className="text-3xl font-semibold tracking-tight">Decision Platform</h1>
            </div>
            <nav className="flex gap-6 text-sm text-ink-700">
              <a className="hover:text-ink-900" href="/">Home</a>
              <a className="hover:text-ink-900" href="/strategies">Strategies</a>
            </nav>
          </header>
          <main className="py-10">{children}</main>
          <footer className="border-t border-sand-200 pt-6 text-sm text-ink-500">
            Built for scenario exploration and risk insights.
          </footer>
        </div>
      </body>
    </html>
  );
}
