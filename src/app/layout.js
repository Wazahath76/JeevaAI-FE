import './globals.css'
import { Providers } from './providers'

export const metadata = {
  title: 'JeevaAI — Hospital Management System',
  description: 'AI-powered clinical management platform for modern hospitals',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
