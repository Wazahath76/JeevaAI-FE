'use client'
import { cn, statusColors, roleColors, roleLabels, bloodGroupLabel, severityColors, recStatusColors } from '@/lib/utils'
import { X, AlertCircle, CheckCircle, Info, AlertTriangle } from 'lucide-react'
import { useEffect, useState } from 'react'

export function StatusBadge({ status }) {
  return <span className={cn('inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border', statusColors[status] || 'bg-gray-500/20 text-gray-400')}>{status}</span>
}
export function RoleBadge({ role }) {
  return <span className={cn('inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium', roleColors[role] || 'bg-gray-500/20 text-gray-400')}>{roleLabels[role] || role}</span>
}
export function BloodGroupBadge({ bg }) {
  return <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-bold bg-red-500/20 text-red-400 border border-red-500/30 mono">{bloodGroupLabel[bg] || bg}</span>
}
export function SeverityBadge({ severity }) {
  return <span className={cn('inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium', severityColors[severity] || '')}>{severity}</span>
}
export function RecStatusBadge({ status }) {
  const labels = { PENDING_REVIEW:'Pending', APPROVED:'Approved', REJECTED:'Rejected', MODIFIED:'Modified' }
  return <span className={cn('inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium', recStatusColors[status] || '')}>{labels[status] || status}</span>
}

export function StatCard({ label, value, icon, color = 'text-teal-400', trend }) {
  return (
    <div className="card p-5 hover:shadow-card-hover transition-all duration-200">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-slate-400 text-xs uppercase tracking-wide font-medium">{label}</p>
          <p className={cn('text-3xl font-bold mt-1', color)}>{value}</p>
          {trend && <p className="text-slate-500 text-xs mt-1">{trend}</p>}
        </div>
        <div className={cn('p-2.5 rounded-lg bg-navy-600', color)}>{icon}</div>
      </div>
    </div>
  )
}

export function Skeleton({ className }) { return <div className={cn('animate-pulse bg-navy-600 rounded', className)} /> }
export function CardSkeleton() {
  return <div className="card p-5 space-y-3"><Skeleton className="h-4 w-1/3" /><Skeleton className="h-8 w-1/2" /><Skeleton className="h-3 w-2/3" /></div>
}
export function TableSkeleton({ rows = 5 }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex gap-4 p-3">
          <Skeleton className="h-4 w-1/4" /><Skeleton className="h-4 w-1/5" />
          <Skeleton className="h-4 w-1/6" /><Skeleton className="h-4 w-1/5" />
        </div>
      ))}
    </div>
  )
}

export function EmptyState({ icon, title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center py-14 text-center">
      <div className="p-4 rounded-full bg-navy-600 text-slate-400 mb-4">{icon}</div>
      <h3 className="text-slate-200 font-semibold text-lg">{title}</h3>
      {description && <p className="text-slate-400 text-sm mt-1 max-w-sm">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}

export function PageHeader({ title, subtitle, action }) {
  return (
    <div className="flex items-start justify-between mb-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-200">{title}</h1>
        {subtitle && <p className="text-slate-400 text-sm mt-1">{subtitle}</p>}
      </div>
      {action && <div>{action}</div>}
    </div>
  )
}

export function SlidePanel({ open, onClose, title, children, width = 'max-w-lg' }) {
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [open])
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="flex-1 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className={cn('bg-navy-800 border-l border-navy-500 h-full overflow-y-auto animate-slide-in w-full', width)}>
        <div className="flex items-center justify-between p-5 border-b border-navy-500 sticky top-0 bg-navy-800 z-10">
          <h2 className="font-semibold text-slate-200 text-lg">{title}</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-navy-600 text-slate-400 hover:text-slate-200 transition-colors"><X size={18} /></button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  )
}

export function ConfirmModal({ open, onClose, onConfirm, title, description, confirmLabel = 'Confirm', variant = 'danger' }) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative card p-6 max-w-sm w-full mx-4 animate-fade-in">
        <h3 className="font-semibold text-slate-200 text-lg">{title}</h3>
        {description && <p className="text-slate-400 text-sm mt-2">{description}</p>}
        <div className="flex gap-3 mt-6 justify-end">
          <button onClick={onClose} className="btn-secondary">Cancel</button>
          <button onClick={onConfirm} className={variant === 'danger' ? 'btn-danger' : 'btn-primary'}>{confirmLabel}</button>
        </div>
      </div>
    </div>
  )
}

// Toast
let _listeners = []
export function showToast(message, type = 'info') {
  const id = Math.random().toString(36).slice(2)
  _listeners.forEach(fn => fn({ id, message, type }))
}
function Toast({ message, type, onClose }) {
  useEffect(() => { const t = setTimeout(onClose, 4500); return () => clearTimeout(t) }, [onClose])
  const icons = { success: <CheckCircle size={16} />, error: <AlertCircle size={16} />, info: <Info size={16} />, warning: <AlertTriangle size={16} /> }
  const colors = {
    success: 'border-green-500/50 bg-green-500/10 text-green-400',
    error:   'border-red-500/50   bg-red-500/10   text-red-400',
    info:    'border-teal-500/50  bg-teal-500/10  text-teal-400',
    warning: 'border-amber-500/50 bg-amber-500/10 text-amber-400',
  }
  return (
    <div className={cn('flex items-center gap-3 px-4 py-3 rounded-lg border animate-fade-in min-w-72 shadow-lg', colors[type] || colors.info)}>
      {icons[type] || icons.info}
      <span className="text-sm font-medium flex-1">{message}</span>
      <button onClick={onClose} className="opacity-60 hover:opacity-100 ml-2"><X size={14} /></button>
    </div>
  )
}
export function ToastContainer() {
  const [toasts, setToasts] = useState([])
  useEffect(() => {
    const fn = t => setToasts(p => [...p, t])
    _listeners.push(fn)
    return () => { _listeners = _listeners.filter(f => f !== fn) }
  }, [])
  const remove = id => setToasts(p => p.filter(t => t.id !== id))
  return (
    <div className="fixed bottom-4 right-4 z-[100] space-y-2">
      {toasts.map(t => <Toast key={t.id} {...t} onClose={() => remove(t.id)} />)}
    </div>
  )
}

export function Avatar({ name, size = 'md' }) {
  const initials = (name || 'DR').split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()
  const sizes = { sm: 'w-7 h-7 text-xs', md: 'w-9 h-9 text-sm', lg: 'w-12 h-12 text-base' }
  return <div className={cn('rounded-full bg-teal-500/20 text-teal-400 font-semibold flex items-center justify-center border border-teal-500/30', sizes[size])}>{initials}</div>
}
export function SectionHeader({ title, action }) {
  return <div className="flex items-center justify-between mb-4"><h3 className="font-semibold text-slate-200">{title}</h3>{action}</div>
}
export function Divider() { return <div className="border-t border-navy-500 my-4" /> }
export function InfoRow({ label, value, mono = false }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-slate-400 text-xs uppercase tracking-wide">{label}</span>
      <span className={cn('text-slate-200 text-sm', mono && 'mono')}>{value || '—'}</span>
    </div>
  )
}

// Password strength
export function PasswordStrength({ password }) {
  const checks = {
    length:    password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    digit:     /\d/.test(password),
    special:   /[@$!%*?&]/.test(password),
  }
  const passed = Object.values(checks).filter(Boolean).length
  const colors = ['bg-red-500','bg-red-400','bg-amber-500','bg-amber-400','bg-green-500']
  const labels = ['Very Weak','Weak','Fair','Good','Strong']
  if (!password) return null
  return (
    <div className="mt-2 space-y-2">
      <div className="flex gap-1">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className={cn('h-1 flex-1 rounded-full transition-all', i < passed ? colors[passed - 1] : 'bg-navy-500')} />
        ))}
      </div>
      {passed > 0 && <p className={cn('text-xs font-medium', passed < 3 ? 'text-red-400' : passed < 5 ? 'text-amber-400' : 'text-green-400')}>{labels[passed - 1]}</p>}
      <div className="space-y-1">
        {[
          [checks.length,    'At least 8 characters'],
          [checks.uppercase, 'One uppercase letter (A–Z)'],
          [checks.lowercase, 'One lowercase letter (a–z)'],
          [checks.digit,     'One number (0–9)'],
          [checks.special,   'One special character (@$!%*?&)'],
        ].map(([ok, label]) => (
          <div key={label} className="flex items-center gap-1.5">
            {ok ? <CheckCircle size={11} className="text-green-400 flex-shrink-0" /> : <X size={11} className="text-slate-600 flex-shrink-0" />}
            <span className={cn('text-xs', ok ? 'text-green-400' : 'text-slate-500')}>{label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
export function FieldError({ message }) {
  if (!message) return null
  return <div className="flex items-center gap-1.5 mt-1"><AlertCircle size={11} className="text-red-400 flex-shrink-0" /><p className="text-red-400 text-xs">{message}</p></div>
}
export function RequiredStar() { return <span className="text-red-400 ml-0.5">*</span> }
