import './globals.css'

export const metadata = {
  title: 'ZeroDegrees',
  description: 'Human discovery engine for the Six Degrees era',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="bg-[#04111f] text-slate-100 antialiased">
        <a 
          href="#main-content" 
          className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:rounded-lg focus:bg-sky-300 focus:px-4 focus:py-2 focus:text-slate-950 focus:font-semibold"
        >
          Skip to main content
        </a>
        {children}
      </body>
    </html>
  )
}
