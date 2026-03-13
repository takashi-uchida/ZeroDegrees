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
      <body className="bg-[#04111f] text-slate-100 antialiased">{children}</body>
    </html>
  )
}
