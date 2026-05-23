'use client'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { cn, roleLabels, roleColors } from '@/lib/utils'
import { useAuthStore } from '@/store/authStore'
import { authService } from '@/services/auth.service'
import { showToast } from '@/components/ui'
import { LayoutDashboard, Users, GitBranch, BarChart3, User, LogOut, ChevronRight, Zap } from 'lucide-react'

const NAV = [
  { href: '/main/dashboard',   icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/main/patients',    icon: Users,            label: 'Patients' },
  { href: '/main/assignments', icon: GitBranch,        label: 'Assignments' },
  { href: '/main/analytics',   icon: BarChart3,        label: 'Analytics',  roles: ['ADMIN','DOCTOR_SUPER_SPECIALIST'] },
  { href: '/main/profile',     icon: User,             label: 'My Profile' },
]

export function Sidebar() {
  const pathname = usePathname()
  const router   = useRouter()
  const { doctor, clearAuth } = useAuthStore()

  const logout = async () => {
    try { await authService.logout() } catch {}
    clearAuth()
    router.push('/auth/login')
    showToast('Logged out', 'info')
  }

  const items = NAV.filter(n => !n.roles || (doctor && n.roles.includes(doctor.role)))

  return (
    <aside className="fixed left-0 top-0 h-full w-64 bg-navy-900 border-r border-navy-500 flex flex-col z-40">
      {/* Logo */}
      <div className="px-6 py-5 border-b border-navy-500">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-teal-500/20 border border-teal-500/40 flex items-center justify-center">
            <Zap size={16} className="text-teal-400" fill="currentColor" />
          </div>
          <div>
            <div className="flex items-center gap-1">
              <span className="font-bold text-slate-200 text-lg leading-none">Jeeva</span>
              <span className="font-bold text-teal-400 text-lg leading-none">AI</span>
            </div>
            <span className="text-slate-500 text-xs">Hospital Management</span>
          </div>
        </div>
      </div>

      {/* Doctor chip */}
      {doctor && (
        <div className="px-4 py-4 border-b border-navy-500">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-teal-500/20 border border-teal-500/30 flex items-center justify-center text-teal-400 font-semibold text-sm flex-shrink-0">
              {doctor.fullName.split(' ').map(n => n[0]).slice(0, 2).join('')}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-slate-200 text-sm font-medium truncate">{doctor.fullName}</p>
              <span className={cn('inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium mt-0.5', roleColors[doctor.role] || '')}>
                {roleLabels[doctor.role] || doctor.role}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        <p className="px-3 text-xs text-slate-600 uppercase tracking-widest font-medium mb-3">Navigation</p>
        {items.map(({ href, icon: Icon, label }) => {
          const active = pathname.startsWith(href)
          return (
            <Link key={href} href={href}
              className={cn('flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all group',
                active
                  ? 'bg-teal-500/15 text-teal-400 border border-teal-500/20'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-navy-600')}>
              <Icon size={16} className={active ? 'text-teal-400' : 'text-slate-600 group-hover:text-slate-400'} />
              {label}
              {active && <ChevronRight size={14} className="ml-auto text-teal-400" />}
            </Link>
          )
        })}
      </nav>

      {/* Bottom */}
      <div className="px-4 py-3 border-t border-navy-500">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse-soft" />
          <span className="text-xs text-slate-400">System Online</span>
        </div>
        <button onClick={logout}
          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-all">
          <LogOut size={15} />Logout
        </button>
      </div>
    </aside>
  )
}
