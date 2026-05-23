'use client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useState } from 'react'
import { ToastContainer } from '@/components/ui'

export { ToastContainer }

export function Providers({ children }) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: { queries: { retry: 1, staleTime: 30000 } }
  }))
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
}
