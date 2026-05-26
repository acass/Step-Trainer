import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'VisionFlow AI — Video to Tutorial',
  description: 'Transform any video into a structured, step-by-step instructional guide with AI.',
  openGraph: {
    title: 'VisionFlow AI',
    description: 'AI-powered video tutorial generator',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-surface-950 text-white antialiased">
        {children}
      </body>
    </html>
  )
}
