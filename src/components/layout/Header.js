'use client'
import { useAuthStore } from '@/store/authStore'
import { roleLabels, roleColors, cn } from '@/lib/utils'
import { Bell } from 'lucide-react'

export function Header() {
  const { doctor } = useAuthStore()
  return (
    <header className="h-14 bg-navy-900 border-b border-navy-500 flex items-center justify-between px-6 sticky top-0 z-30">
      <div />
      <div className="flex items-center gap-3">
        <button className="relative p-2 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-navy-600 transition-colors">
          <Bell size={17} />
          <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-teal-500" />
        </button>
        {doctor && (
          <div className="flex items-center gap-2.5 pl-3 border-l border-navy-500">
            <div className="text-right hidden sm:block">
              <p className="text-slate-200 text-sm font-medium leading-none">{doctor.fullName}</p>
              <span className={cn('inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium mt-0.5', roleColors[doctor.role] || '')}>
                {roleLabels[doctor.role] || doctor.role}
              </span>
            </div>
            <div className="w-8 h-8 rounded-full bg-teal-500/20 border border-teal-500/30 flex items-center justify-center text-teal-400 font-semibold text-xs">
              {doctor.fullName.split(' ').map(n => n[0]).slice(0, 2).join('')}
            </div>
          </div>
        )}
      </div>
    </header>
  )
}
