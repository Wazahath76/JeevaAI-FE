'use client'
import { useQuery } from '@tanstack/react-query'
import { analyticsService } from '@/services/analytics.service'
import { PageHeader, StatCard, CardSkeleton } from '@/components/ui'
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts'
import { Users, Activity, AlertTriangle, UserCheck, Brain, TrendingUp } from 'lucide-react'

const COLORS = ['#00C6B3','#3B82F6','#F59E0B','#EF4444','#8B5CF6','#10B981']

const TOOLTIP_STYLE = { backgroundColor:'#131929', border:'1px solid #1E2A3E', borderRadius:'8px', color:'#F1F5F9' }

export default function AnalyticsPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['analytics-hospital'],
    queryFn: () => analyticsService.getHospital().then(r => r.data.data),
  })
  const { data: myStats } = useQuery({
    queryKey: ['analytics-me'],
    queryFn: () => analyticsService.getMe().then(r => r.data.data),
  })

  if (isLoading) return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {Array.from({ length: 8 }).map((_,i) => <CardSkeleton key={i} />)}
    </div>
  )
  if (!data) return (
    <div className="flex items-center justify-center h-64">
      <p className="text-slate-400">No analytics data available. Ensure backend is running.</p>
    </div>
  )

  const statusPieData  = Object.entries(data.patientsByStatus || {}).map(([name,value]) => ({ name, value }))
  const aiPieData      = Object.entries(data.aiRecommendationsByStatus || {}).map(([name,value]) => ({ name, value }))
  const topDiagnoses   = (data.topDiagnoses || []).slice(0, 8)
  const admissionTrend = (data.admissionTrend || []).slice(-14)

  return (
    <div className="animate-fade-in space-y-6">
      <PageHeader title="Analytics" subtitle="Hospital-wide insights and AI performance metrics" />

      {/* KPI row */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <StatCard label="Total Patients"    value={data.totalPatients}           icon={<Users size={18}/>}       color="text-teal-400" />
        <StatCard label="OPD"               value={data.opdPatients}             icon={<Activity size={18}/>}    color="text-blue-400" />
        <StatCard label="IPD"               value={data.ipdPatients}             icon={<Activity size={18}/>}    color="text-teal-400" />
        <StatCard label="Critical"          value={data.criticalPatients}        icon={<AlertTriangle size={18}/>} color="text-red-400" />
        <StatCard label="Doctors"           value={data.totalDoctors}            icon={<UserCheck size={18}/>}   color="text-green-400" />
        <StatCard label="AI Recs"           value={data.totalRecommendations}    icon={<Brain size={18}/>}       color="text-purple-400" />
      </div>

      {/* Charts row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="card p-5">
          <h3 className="font-semibold text-slate-200 mb-4 text-sm">Admission Trend — Last 14 Days</h3>
          {admissionTrend.length > 0
            ? <ResponsiveContainer width="100%" height={200}>
                <BarChart data={admissionTrend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1E2A3E" />
                  <XAxis dataKey="date" tick={{ fill:'#64748B', fontSize:10 }} />
                  <YAxis tick={{ fill:'#64748B', fontSize:10 }} />
                  <Tooltip contentStyle={TOOLTIP_STYLE} />
                  <Bar dataKey="count" fill="#00C6B3" radius={[4,4,0,0]} name="Admissions" />
                </BarChart>
              </ResponsiveContainer>
            : <div className="flex items-center justify-center h-48 text-slate-400 text-sm">No admission data yet</div>
          }
        </div>
        <div className="card p-5">
          <h3 className="font-semibold text-slate-200 mb-4 text-sm">Patients by Status</h3>
          {statusPieData.length > 0
            ? <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={statusPieData} cx="50%" cy="50%" outerRadius={75} dataKey="value" nameKey="name"
                    label={({ name, percent }) => `${name} ${(percent*100).toFixed(0)}%`} labelLine={false}>
                    {statusPieData.map((_,i) => <Cell key={i} fill={COLORS[i%COLORS.length]} />)}
                  </Pie>
                  <Tooltip contentStyle={TOOLTIP_STYLE} />
                </PieChart>
              </ResponsiveContainer>
            : <div className="flex items-center justify-center h-48 text-slate-400 text-sm">No data yet</div>
          }
        </div>
      </div>

      {/* Charts row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="card p-5">
          <h3 className="font-semibold text-slate-200 mb-4 text-sm">Top Diagnoses</h3>
          {topDiagnoses.length > 0
            ? <ResponsiveContainer width="100%" height={220}>
                <BarChart data={topDiagnoses} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#1E2A3E" />
                  <XAxis type="number" tick={{ fill:'#64748B', fontSize:10 }} />
                  <YAxis type="category" dataKey="name" tick={{ fill:'#94A3B8', fontSize:10 }} width={140} />
                  <Tooltip contentStyle={TOOLTIP_STYLE} />
                  <Bar dataKey="count" fill="#3B82F6" radius={[0,4,4,0]} name="Cases" />
                </BarChart>
              </ResponsiveContainer>
            : <div className="flex items-center justify-center h-48 text-slate-400 text-sm">No diagnosis data yet</div>
          }
        </div>
        <div className="card p-5">
          <h3 className="font-semibold text-slate-200 mb-4 text-sm">AI Recommendations</h3>
          {aiPieData.length > 0
            ? <>
                <ResponsiveContainer width="100%" height={150}>
                  <PieChart>
                    <Pie data={aiPieData} cx="50%" cy="50%" outerRadius={60} innerRadius={30} dataKey="value" nameKey="name">
                      {aiPieData.map((_,i) => <Cell key={i} fill={COLORS[i%COLORS.length]} />)}
                    </Pie>
                    <Tooltip contentStyle={TOOLTIP_STYLE} />
                    <Legend wrapperStyle={{ fontSize:'11px', color:'#94A3B8' }} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="grid grid-cols-2 gap-3 mt-3">
                  <div className="p-2.5 rounded-lg bg-green-500/10 border border-green-500/20 text-center">
                    <p className="text-green-400 font-bold text-xl">{data.approvedRecommendations}</p>
                    <p className="text-slate-400 text-xs">Approved</p>
                  </div>
                  <div className="p-2.5 rounded-lg bg-red-500/10 border border-red-500/20 text-center">
                    <p className="text-red-400 font-bold text-xl">{data.rejectedRecommendations}</p>
                    <p className="text-slate-400 text-xs">Rejected</p>
                  </div>
                </div>
              </>
            : <div className="flex items-center justify-center h-48 text-slate-400 text-sm">No AI data yet</div>
          }
        </div>
      </div>

      {/* My stats */}
      {myStats && (
        <div className="card p-5">
          <h3 className="font-semibold text-slate-200 mb-4 text-sm">My Performance</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard label="Active Patients"  value={myStats.activePatientsCount} icon={<Users size={16}/>}      color="text-teal-400" />
            <StatCard label="Total Treated"    value={myStats.totalPatientsEver}   icon={<TrendingUp size={16}/>} color="text-blue-400" />
            <StatCard label="AI Approval Rate" value={`${myStats.approvalRate}%`}  icon={<Brain size={16}/>}      color="text-purple-400" />
            <StatCard label="Notes Written"    value={myStats.totalNotes}          icon={<Activity size={16}/>}   color="text-green-400" />
          </div>
        </div>
      )}
    </div>
  )
}
