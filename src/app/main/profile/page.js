'use client'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuthStore } from '@/store/authStore'
import { analyticsService } from '@/services/analytics.service'
import { doctorService } from '@/services/doctor.service'
import { PageHeader, RoleBadge, StatCard, showToast, InfoRow, Divider } from '@/components/ui'
import { formatDate, cn } from '@/lib/utils'
import { Activity, Brain, FileText, Users, TrendingUp, Zap } from 'lucide-react'

export default function ProfilePage() {
  const { doctor, updateDoctor } = useAuthStore()
  const qc = useQueryClient()

  const { data: stats } = useQuery({
    queryKey: ['analytics-me'],
    queryFn: () => analyticsService.getMe().then(r => r.data.data),
  })
  const toggleAvail = useMutation({
    mutationFn: available => doctorService.toggleAvail(doctor.id, available),
    onSuccess: (_, available) => {
      updateDoctor({ ...doctor, isAvailable: available })
      showToast(`You are now ${available ? 'available' : 'unavailable'}`, 'info')
    },
    onError: () => showToast('Failed to update availability', 'error'),
  })

  if (!doctor) return null

  return (
    <div className="animate-fade-in max-w-3xl">
      <PageHeader title="My Profile" subtitle="Your account, credentials and performance" />

      {/* Doctor card */}
      <div className="card p-6 mb-5">
        <div className="flex items-start gap-5">
          <div className="w-16 h-16 rounded-full bg-teal-500/20 border-2 border-teal-500/30 flex items-center justify-center text-teal-400 font-bold text-xl flex-shrink-0">
            {doctor.fullName.split(' ').map(n => n[0]).slice(0, 2).join('')}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-1 flex-wrap">
              <h2 className="text-xl font-bold text-slate-200">{doctor.fullName}</h2>
              <RoleBadge role={doctor.role} />
            </div>
            <p className="text-slate-400 text-sm">{doctor.email}</p>
            {doctor.specialization && <p className="text-teal-400 text-sm mt-0.5">{doctor.specialization} · {doctor.department}</p>}
            <div className="flex items-center gap-3 mt-3 flex-wrap">
              <span className={cn('text-xs px-2.5 py-1 rounded-full font-medium', doctor.isAvailable ? 'bg-green-500/20 text-green-400' : 'bg-slate-500/20 text-slate-400')}>
                {doctor.isAvailable ? '● Available' : '○ Unavailable'}
              </span>
              <button onClick={() => toggleAvail.mutate(!doctor.isAvailable)} disabled={toggleAvail.isPending}
                className="text-xs text-teal-400 hover:text-teal-300 underline transition-colors disabled:opacity-50">
                {doctor.isAvailable ? 'Mark Unavailable' : 'Mark Available'}
              </button>
            </div>
          </div>
          {/* JeevaAI badge */}
          <div className="flex items-center gap-1.5 bg-teal-500/10 border border-teal-500/20 px-3 py-1.5 rounded-lg flex-shrink-0">
            <Zap size={12} className="text-teal-400" fill="currentColor" />
            <span className="text-teal-400 text-xs font-semibold">JeevaAI</span>
          </div>
        </div>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-5">
          <StatCard label="Active Patients"  value={stats.activePatientsCount} icon={<Users size={16}/>}      color="text-teal-400" />
          <StatCard label="Total Treated"    value={stats.totalPatientsEver}   icon={<TrendingUp size={16}/>} color="text-blue-400" />
          <StatCard label="AI Approval Rate" value={`${stats.approvalRate}%`}  icon={<Brain size={16}/>}      color="text-purple-400" />
          <StatCard label="Notes Written"    value={stats.totalNotes}          icon={<FileText size={16}/>}   color="text-green-400" />
        </div>
      )}

      {/* Details */}
      <div className="card p-5">
        <h3 className="font-semibold text-slate-200 mb-4">Professional Details</h3>
        <div className="grid grid-cols-2 gap-4">
          <InfoRow label="License Number"  value={doctor.licenseNumber}                                    mono />
          <InfoRow label="Qualification"   value={doctor.qualification} />
          <InfoRow label="Experience"      value={doctor.experienceYears !== undefined ? `${doctor.experienceYears} years` : undefined} />
          <InfoRow label="Phone"           value={doctor.phone} />
          <InfoRow label="Member Since"    value={formatDate(doctor.createdAt)} />
          <InfoRow label="Account Status"  value={doctor.isActive ? 'Active' : 'Inactive'} />
        </div>
        {doctor.specialization && (
          <>
            <Divider />
            <div className="grid grid-cols-2 gap-4">
              <InfoRow label="Specialization" value={doctor.specialization} />
              <InfoRow label="Department"     value={doctor.department} />
            </div>
          </>
        )}
      </div>
    </div>
  )
}
