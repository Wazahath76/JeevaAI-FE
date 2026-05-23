'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuthStore } from '@/store/authStore'
import { Sidebar } from '@/components/layout/Sidebar'
import { Header } from '@/components/layout/Header'
import { ToastContainer } from '@/app/providers'
import { Plus } from 'lucide-react'

export default function MainLayout({ children }) {
  const router = useRouter()
  const { isAuthenticated } = useAuthStore()
  useEffect(() => { if (!isAuthenticated) router.replace('/auth/login') }, [isAuthenticated, router])
  if (!isAuthenticated) return null
  return (
    <div className="flex h-screen bg-navy-900">
      <Sidebar />
      <div className="flex-1 flex flex-col ml-64 overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto p-6 animate-fade-in">{children}</main>
      </div>
      {/* Floating admit button */}
      <Link href="/main/patients/new" title="Admit New Patient"
        className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-teal-500 text-navy-900 flex items-center justify-center shadow-glow-teal hover:bg-teal-400 transition-all hover:scale-110 active:scale-95">
        <Plus size={24} strokeWidth={2.5} />
      </Link>
      <ToastContainer />
    </div>
  )
}
