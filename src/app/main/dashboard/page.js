'use client'
import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import Link from 'next/link'
import { useAuthStore } from '@/store/authStore'
import { analyticsService } from '@/services/analytics.service'
import { patientService } from '@/services/patient.service'
import { PageHeader, StatCard, StatusBadge, CardSkeleton, TableSkeleton, EmptyState } from '@/components/ui'
import { formatDate, cn } from '@/lib/utils'
import { Users, UserCheck, AlertTriangle, Activity, Plus, Stethoscope, Search, Brain, TrendingUp } from 'lucide-react'

export default function DashboardPage() {
  const { doctor } = useAuthStore()
  const isAdmin = doctor?.role === 'ADMIN' || doctor?.role === 'DOCTOR_SUPER_SPECIALIST'
  const [search, setSearch] = useState('')

  const { data: analytics, isLoading: aLoading } = useQuery({
    queryKey: ['analytics-hospital'],
    queryFn: () => analyticsService.getHospital().then(r => r.data.data),
    enabled: isAdmin,
  })
  const { data: myPatients, isLoading: pLoading } = useQuery({
    queryKey: ['my-patients'],
    queryFn: () => patientService.getMy({ page: 0, size: 20 }).then(r => r.data.data),
  })
  const { data: myStats } = useQuery({
    queryKey: ['analytics-me'],
    queryFn: () => analyticsService.getMe().then(r => r.data.data),
  })

  const allPatients = myPatients?.content || []
  const patients    = allPatients.filter(p =>
    !search || p.fullName.toLowerCase().includes(search.toLowerCase()) ||
    p.patientCode.toLowerCase().includes(search.toLowerCase()) ||
    (p.ward || '').toLowerCase().includes(search.toLowerCase())
  )
  const criticalCount = allPatients.filter(p => p.status === 'CRITICAL').length
  const ipdCount      = allPatients.filter(p => p.status === 'IPD').length

  const stats = isAdmin && analytics ? [
    { label:'Total Patients',    value:analytics.totalPatients,    icon:<Users size={18} />,       color:'text-teal-400' },
    { label:'Active IPD',        value:analytics.ipdPatients,      icon:<Activity size={18} />,    color:'text-blue-400' },
    { label:'Critical',          value:analytics.criticalPatients, icon:<AlertTriangle size={18} />, color:'text-red-400' },
    { label:'Available Doctors', value:analytics.availableDoctors, icon:<UserCheck size={18} />,   color:'text-green-400' },
  ] : myStats ? [
    { label:'My Patients',     value:myStats.activePatientsCount, icon:<Users size={18} />,      color:'text-teal-400' },
    { label:'Total Treated',   value:myStats.totalPatientsEver,   icon:<TrendingUp size={18} />, color:'text-blue-400' },
    { label:'AI Approval Rate',value:`${myStats.approvalRate}%`,  icon:<Brain size={18} />,      color:'text-purple-400' },
    { label:'Notes Written',   value:myStats.totalNotes,          icon:<Activity size={18} />,   color:'text-green-400' },
  ] : []

  return (
    <div className="animate-fade-in">
      <PageHeader
        title={`Good morning, Dr. ${doctor?.fullName?.split(' ').slice(-1)[0] || 'Doctor'} 👋`}
        subtitle={new Date().toLocaleDateString('en-IN', { weekday:'long', day:'numeric', month:'long', year:'numeric' })}
        action={<Link href="/main/patients/new" className="btn-primary"><Plus size={16} />Admit Patient</Link>}
      />

      {/* Critical alert banner */}
      {criticalCount > 0 && (
        <div className="flex items-center gap-3 p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 mb-6">
          <div className="p-1.5 rounded-lg bg-red-500/20 flex-shrink-0"><AlertTriangle size={16} className="text-red-400" /></div>
          <div className="flex-1">
            <p className="text-red-400 font-semibold text-sm">{criticalCount} critical patient{criticalCount > 1 ? 's' : ''} need immediate attention</p>
            <p className="text-red-400/60 text-xs">Review their charts and update clinical notes</p>
          </div>
          <Link href="/main/patients?status=CRITICAL" className="text-xs text-red-400 border border-red-500/30 px-3 py-1.5 rounded-lg hover:bg-red-500/10 transition-colors whitespace-nowrap flex-shrink-0">
            View Critical →
          </Link>
        </div>
      )}

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {aLoading
          ? Array.from({ length: 4 }).map((_, i) => <CardSkeleton key={i} />)
          : stats.map(s => <StatCard key={s.label} {...s} />)
        }
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { href:'/main/patients/new', icon:<Plus size={18} />,        label:'Admit Patient',  desc:'Register new patient',     color:'text-teal-400',   bg:'group-hover:bg-teal-500/10' },
          { href:'/main/patients',     icon:<Users size={18} />,       label:'All Patients',   desc:'Browse records',           color:'text-blue-400',   bg:'group-hover:bg-blue-500/10' },
          { href:'/main/assignments',  icon:<Stethoscope size={18} />, label:'Assignments',    desc:'Doctor assignments',       color:'text-purple-400', bg:'group-hover:bg-purple-500/10' },
          { href:'/main/analytics',    icon:<Activity size={18} />,    label:'Analytics',      desc:'Hospital insights',        color:'text-amber-400',  bg:'group-hover:bg-amber-500/10' },
        ].map(({ href, icon, label, desc, color, bg }) => (
          <Link key={href} href={href} className={`card p-4 hover:border-navy-400 transition-all group ${bg}`}>
            <div className={`mb-3 ${color}`}>{icon}</div>
            <p className="text-slate-200 font-semibold text-sm group-hover:text-teal-400 transition-colors">{label}</p>
            <p className="text-slate-400 text-xs mt-0.5">{desc}</p>
          </Link>
        ))}
      </div>

      {/* Patients table */}
      <div className="card">
        <div className="p-5 border-b border-navy-500 flex items-center justify-between gap-4">
          <div>
            <h3 className="font-semibold text-slate-200">My Patients</h3>
            <p className="text-slate-400 text-xs mt-0.5">{allPatients.length} total · {ipdCount} IPD · {criticalCount} critical</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative hidden sm:block">
              <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600" />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search patients..."
                className="input-field pl-8 py-1.5 text-xs w-48" />
            </div>
            <Link href="/main/patients" className="text-teal-400 text-sm hover:text-teal-300 font-medium whitespace-nowrap">View all →</Link>
          </div>
        </div>

        {pLoading
          ? <div className="p-5"><TableSkeleton /></div>
          : patients.length === 0
            ? search
              ? <div className="py-10 text-center">
                  <p className="text-slate-400 text-sm">No patients match "<span className="text-slate-200">{search}</span>"</p>
                  <button onClick={() => setSearch('')} className="text-teal-400 text-xs mt-1 hover:text-teal-300">Clear search</button>
                </div>
              : <EmptyState icon={<Users size={24} />} title="No patients yet" description="Admit your first patient to get started"
                  action={<Link href="/main/patients/new" className="btn-primary text-xs">Admit First Patient</Link>} />
            : <div className="divide-y divide-navy-500">
                {patients.slice(0, 10).map(p => {
                  const isCritical = p.status === 'CRITICAL'
                  return (
                    <Link key={p.id} href={`/main/patients/${p.id}`}
                      className="flex items-center gap-4 px-5 py-3.5 hover:bg-navy-600 transition-colors group">
                      <div className="relative flex-shrink-0">
                        <div className={cn('w-9 h-9 rounded-full border flex items-center justify-center text-xs font-semibold transition-colors',
                          isCritical ? 'bg-red-500/20 border-red-500/40 text-red-400'
                            : 'bg-navy-600 border-navy-400 text-slate-400 group-hover:bg-teal-500/20 group-hover:text-teal-400 group-hover:border-teal-500/30')}>
                          {p.fullName.split(' ').map(n => n[0]).slice(0, 2).join('')}
                        </div>
                        {isCritical && <div className="absolute -top-0.5 -right-0.5 w-3 h-3 rounded-full bg-red-500 border border-navy-800 animate-pulse-soft" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-slate-200 text-sm font-medium truncate group-hover:text-teal-400 transition-colors">{p.fullName}</p>
                          {isCritical && <span className="text-xs text-red-400 bg-red-500/10 px-1.5 py-0.5 rounded flex-shrink-0">⚠ Critical</span>}
                        </div>
                        <p className="text-slate-400 text-xs mono">{p.patientCode} · {p.age}y {p.gender}</p>
                      </div>
                      <div className="flex items-center gap-3 flex-shrink-0">
                        <StatusBadge status={p.status} />
                        {p.ward && <span className="text-slate-600 text-xs hidden md:block">{p.ward}</span>}
                        <span className="text-slate-600 text-xs hidden lg:block">{formatDate(p.admissionDate)}</span>
                      </div>
                    </Link>
                  )
                })}
                {patients.length > 10 && (
                  <div className="px-5 py-3 text-center">
                    <Link href="/main/patients" className="text-teal-400 text-sm hover:text-teal-300">View {patients.length - 10} more →</Link>
                  </div>
                )}
              </div>
        }
      </div>
    </div>
  )
}
