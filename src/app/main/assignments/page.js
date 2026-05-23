'use client'
import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { assignmentService } from '@/services/assignment.service'
import { doctorService } from '@/services/doctor.service'
import { PageHeader, RoleBadge, Avatar, EmptyState, showToast } from '@/components/ui'
import { timeAgo, cn } from '@/lib/utils'
import { GitBranch, UserPlus, X, Search } from 'lucide-react'

export default function AssignmentsPage() {
  const qc = useQueryClient()
  const [search, setSearch]       = useState('')
  const [filterRole, setFilterRole] = useState('')

  const { data: myAssignments = [] } = useQuery({
    queryKey: ['my-assignments'],
    queryFn: () => assignmentService.getMy().then(r => r.data.data),
  })
  const { data: availDoctors = [] } = useQuery({
    queryKey: ['available-doctors', filterRole],
    queryFn: () => doctorService.getAvailable(filterRole ? { role: filterRole } : {}).then(r => r.data.data),
  })

  const revoke = useMutation({
    mutationFn: id => assignmentService.revoke({ assignmentId: id, revocationReason: 'Consultation completed' }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['my-assignments'] }); showToast('Assignment revoked', 'info') },
    onError: () => showToast('Failed to revoke', 'error'),
  })

  const filtered = availDoctors.filter(d =>
    !search || d.fullName.toLowerCase().includes(search.toLowerCase()) ||
    (d.specialization||'').toLowerCase().includes(search.toLowerCase()) ||
    (d.department||'').toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="animate-fade-in">
      <PageHeader title="Assignments" subtitle="Manage doctor assignments to patients" />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Available doctors */}
        <div className="card overflow-hidden">
          <div className="p-4 border-b border-navy-500">
            <h3 className="font-semibold text-slate-200 text-sm mb-3">Available Doctors</h3>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600" />
                <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search..." className="input-field pl-8 py-2 text-xs" />
              </div>
              <select value={filterRole} onChange={e => setFilterRole(e.target.value)} className="input-field text-xs w-36">
                <option value="">All Roles</option>
                {['DOCTOR_GENERAL','DOCTOR_SPECIALIST','DOCTOR_SUPER_SPECIALIST','DOCTOR_SURGEON','DOCTOR_ANAESTHETIST'].map(r => (
                  <option key={r} value={r}>{r.replace('DOCTOR_','')}</option>
                ))}
              </select>
            </div>
          </div>
          {filtered.length === 0
            ? <EmptyState icon={<UserPlus size={22} />} title="No available doctors" description="All doctors are currently unavailable" />
            : <div className="divide-y divide-navy-500 max-h-96 overflow-y-auto">
                {filtered.map(d => (
                  <div key={d.id} className="p-4 hover:bg-navy-600 transition-colors">
                    <div className="flex items-center gap-3">
                      <Avatar name={d.fullName} />
                      <div className="flex-1 min-w-0">
                        <p className="text-slate-200 text-sm font-medium">{d.fullName}</p>
                        <p className="text-slate-400 text-xs">{d.specialization || 'General'} · {d.department}</p>
                        {d.experienceYears > 0 && <p className="text-slate-600 text-xs">{d.experienceYears}y experience</p>}
                      </div>
                      <RoleBadge role={d.role} />
                    </div>
                  </div>
                ))}
              </div>
          }
        </div>

        {/* My assignments */}
        <div className="card overflow-hidden">
          <div className="p-4 border-b border-navy-500">
            <h3 className="font-semibold text-slate-200 text-sm">My Active Assignments</h3>
            <p className="text-slate-400 text-xs mt-0.5">{myAssignments.length} active</p>
          </div>
          {myAssignments.length === 0
            ? <EmptyState icon={<GitBranch size={22} />} title="No active assignments" description="You have no active doctor assignments" />
            : <div className="divide-y divide-navy-500 max-h-96 overflow-y-auto">
                {myAssignments.map(a => (
                  <div key={a.id} className="p-4 hover:bg-navy-600 transition-colors">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-slate-200 text-sm font-medium">{a.patientName}</p>
                        <p className="text-slate-400 text-xs mono">{a.patientCode}</p>
                        <p className="text-slate-400 text-xs mt-1">{a.assignmentReason || 'No reason provided'}</p>
                        <p className="text-slate-600 text-xs mt-1">Assigned {timeAgo(a.createdAt)}</p>
                      </div>
                      <button onClick={() => revoke.mutate(a.id)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors">
                        <X size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
          }
        </div>
      </div>
    </div>
  )
}
