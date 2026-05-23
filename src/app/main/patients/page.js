'use client'
import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import Link from 'next/link'
import { patientService } from '@/services/patient.service'
import { PageHeader, StatusBadge, BloodGroupBadge, TableSkeleton, EmptyState } from '@/components/ui'
import { formatDate, cn } from '@/lib/utils'
import { Search, Plus, Users, Filter, AlertTriangle } from 'lucide-react'

const STATUSES = ['ALL','OPD','IPD','CRITICAL','DISCHARGED']
const WARDS    = ['All Wards','ICU','General Ward','Cardiac Ward','Surgical Ward','Neurology Ward','OPD Block A','OPD Block B']

export default function PatientsPage() {
  const [search, setSearch]           = useState('')
  const [status, setStatus]           = useState('ALL')
  const [ward, setWard]               = useState('All Wards')
  const [page, setPage]               = useState(0)
  const [showWardFilter, setShowWardFilter] = useState(false)

  const { data, isLoading } = useQuery({
    queryKey: ['patients', search, status, page],
    queryFn: () => patientService.getAll({
      page, size: 20,
      ...(search && { search }),
      ...(status !== 'ALL' && { status }),
    }).then(r => r.data.data),
    staleTime: 10000,
  })

  const patients = (data?.content || []).filter(p =>
    ward === 'All Wards' || (p.ward || '').toLowerCase().includes(ward.replace('All Wards','').toLowerCase().trim())
  )
  const totalPages = data?.totalPages || 0

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Patients"
        subtitle={`${data?.totalElements || 0} total patients`}
        action={<Link href="/main/patients/new" className="btn-primary"><Plus size={16} />Admit Patient</Link>}
      />

      <div className="card p-4 mb-5 space-y-3">
        {/* Search + filter toggle */}
        <div className="flex gap-3">
          <div className="relative flex-1">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600" />
            <input value={search} onChange={e => { setSearch(e.target.value); setPage(0) }}
              placeholder="Search by name, code, phone..." className="input-field pl-9" />
          </div>
          <button onClick={() => setShowWardFilter(!showWardFilter)}
            className={cn('btn-secondary text-xs', showWardFilter && 'border-teal-500/30 text-teal-400')}>
            <Filter size={14} />Wards
          </button>
        </div>

        {/* Status tabs */}
        <div className="flex gap-1.5 flex-wrap">
          {STATUSES.map(s => (
            <button key={s} onClick={() => { setStatus(s); setPage(0) }}
              className={cn('px-3 py-1.5 rounded-lg text-xs font-medium transition-all',
                status === s ? 'bg-teal-500/20 text-teal-400 border border-teal-500/30' : 'bg-navy-600 text-slate-400 hover:text-slate-200 border border-transparent')}>
              {s}
            </button>
          ))}
        </div>

        {/* Ward chips */}
        {showWardFilter && (
          <div className="pt-2 border-t border-navy-500">
            <p className="text-slate-500 text-xs mb-2 uppercase tracking-wide font-medium">Filter by Ward</p>
            <div className="flex gap-1.5 flex-wrap">
              {WARDS.map(w => (
                <button key={w} onClick={() => setWard(w)}
                  className={cn('px-3 py-1.5 rounded-lg text-xs font-medium transition-all',
                    ward === w ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30' : 'bg-navy-600 text-slate-400 hover:text-slate-200 border border-transparent')}>
                  {w}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="card overflow-hidden">
        {isLoading
          ? <div className="p-5"><TableSkeleton rows={8} /></div>
          : patients.length === 0
            ? <EmptyState icon={<Users size={24} />} title="No patients found" description="Try adjusting your search or filters"
                action={<Link href="/main/patients/new" className="btn-primary text-xs">Admit Patient</Link>} />
            : <>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-navy-500">
                        {['Patient','Code','Age / Gender','Blood','Status','Ward / Bed','Doctor','Admitted'].map(h => (
                          <th key={h} className="text-left px-5 py-3 text-xs text-slate-400 uppercase tracking-wide font-medium">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-navy-500">
                      {patients.map(p => {
                        const isCritical = p.status === 'CRITICAL'
                        return (
                          <tr key={p.id} className={cn('hover:bg-navy-600 transition-colors group', isCritical && 'bg-red-500/5')}>
                            <td className="px-5 py-3.5">
                              <Link href={`/main/patients/${p.id}`} className="flex items-center gap-3">
                                <div className="relative">
                                  <div className={cn('w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold transition-colors',
                                    isCritical ? 'bg-red-500/20 border border-red-500/30 text-red-400'
                                      : 'bg-navy-500 text-slate-400 group-hover:bg-teal-500/20 group-hover:text-teal-400')}>
                                    {p.fullName.split(' ').map(n => n[0]).slice(0, 2).join('')}
                                  </div>
                                  {isCritical && (
                                    <div className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-red-500 border border-navy-800 flex items-center justify-center">
                                      <AlertTriangle size={7} className="text-white" />
                                    </div>
                                  )}
                                </div>
                                <div>
                                  <p className="text-slate-200 text-sm font-medium group-hover:text-teal-400 transition-colors">{p.fullName}</p>
                                  {isCritical && <p className="text-red-400 text-xs">⚠ Immediate attention</p>}
                                </div>
                              </Link>
                            </td>
                            <td className="px-4 py-3.5"><span className="mono text-slate-400 text-xs">{p.patientCode}</span></td>
                            <td className="px-4 py-3.5 text-slate-400 text-sm">{p.age}y / {p.gender}</td>
                            <td className="px-4 py-3.5"><BloodGroupBadge bg={p.bloodGroup} /></td>
                            <td className="px-4 py-3.5"><StatusBadge status={p.status} /></td>
                            <td className="px-4 py-3.5 text-slate-400 text-sm">{p.ward || '—'}{p.bedNumber && <span className="mono text-slate-600 text-xs ml-1">· {p.bedNumber}</span>}</td>
                            <td className="px-4 py-3.5 text-slate-400 text-sm">{p.primaryDoctorName || '—'}</td>
                            <td className="px-4 py-3.5 text-slate-600 text-xs">{formatDate(p.admissionDate)}</td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
                {totalPages > 1 && (
                  <div className="flex items-center justify-between px-5 py-3 border-t border-navy-500">
                    <span className="text-slate-400 text-sm">Page {page + 1} of {totalPages}</span>
                    <div className="flex gap-2">
                      <button onClick={() => setPage(p => p - 1)} disabled={page === 0} className="btn-secondary py-1.5 px-3 text-xs disabled:opacity-40">Prev</button>
                      <button onClick={() => setPage(p => p + 1)} disabled={page >= totalPages - 1} className="btn-secondary py-1.5 px-3 text-xs disabled:opacity-40">Next</button>
                    </div>
                  </div>
                )}
              </>
        }
      </div>
    </div>
  )
}
