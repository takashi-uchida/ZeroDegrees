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
      <body className="bg-gray-50">{children}</body>
    </html>
  )
}
