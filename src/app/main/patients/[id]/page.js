'use client'
import { useState } from 'react'
import { useParams } from 'next/navigation'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { patientService } from '@/services/patient.service'
import { aiService } from '@/services/ai.service'
import { assignmentService } from '@/services/assignment.service'
import { doctorService } from '@/services/doctor.service'
import {
  StatusBadge, BloodGroupBadge, SeverityBadge, RecStatusBadge,
  SlidePanel, EmptyState, showToast, Avatar, InfoRow, SectionHeader, Divider
} from '@/components/ui'
import { formatDate, formatDateTime, timeAgo, cn, getVitalsAlerts } from '@/lib/utils'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import {
  Activity, Heart, Thermometer, Wind, Droplets, Scale,
  Plus, Brain, Check, X, Edit, Lock, FlaskConical,
  Stethoscope, FileText, ClipboardList, ChevronLeft,
  AlertTriangle, Syringe, UserPlus, Printer
} from 'lucide-react'
import Link from 'next/link'

const TABS = [
  { id:'overview',  label:'Overview',      icon:<ClipboardList size={14}/> },
  { id:'vitals',    label:'Vitals',         icon:<Activity size={14}/> },
  { id:'diagnosis', label:'Dx & Treatment', icon:<Stethoscope size={14}/> },
  { id:'ai',        label:'AI Recs',        icon:<Brain size={14}/> },
  { id:'notes',     label:'Notes',          icon:<FileText size={14}/> },
  { id:'labs',      label:'Labs',           icon:<FlaskConical size={14}/> },
  { id:'discharge', label:'Discharge',      icon:<FileText size={14}/> },
]

const TOOLTIP = { backgroundColor:'#131929', border:'1px solid #1E2A3E', borderRadius:'8px', color:'#F1F5F9' }

export default function PatientEMRPage() {
  const { id } = useParams()
  const [tab, setTab] = useState('overview')
  const qc = useQueryClient()

  const { data: patient, isLoading } = useQuery({ queryKey:['patient',id], queryFn:()=>patientService.getById(id).then(r=>r.data.data) })
  const { data: vitals=[]     } = useQuery({ queryKey:['vitals',id],    enabled:tab==='vitals',    queryFn:()=>patientService.getVitals(id).then(r=>r.data.data) })
  const { data: diagnoses=[]  } = useQuery({ queryKey:['diagnoses',id], enabled:tab==='diagnosis', queryFn:()=>patientService.getDiagnoses(id).then(r=>r.data.data) })
  const { data: treatments=[] } = useQuery({ queryKey:['treatments',id],enabled:tab==='diagnosis', queryFn:()=>patientService.getTreatments(id).then(r=>r.data.data) })
  const { data: notes=[]      } = useQuery({ queryKey:['notes',id],     enabled:tab==='notes',     queryFn:()=>patientService.getNotes(id).then(r=>r.data.data) })
  const { data: labs=[]       } = useQuery({ queryKey:['labs',id],      enabled:tab==='labs',      queryFn:()=>patientService.getLabResults(id).then(r=>r.data.data) })
  const { data: aiRecs=[]     } = useQuery({ queryKey:['ai-recs',id],   enabled:tab==='ai',        queryFn:()=>aiService.getFor(id).then(r=>r.data.data) })
  const { data: assignments=[]  } = useQuery({ queryKey:['assignments',id], enabled:tab==='overview', queryFn:()=>assignmentService.getForPatient(id).then(r=>r.data.data) })
  const { data: discharge     } = useQuery({ queryKey:['discharge',id], enabled:tab==='discharge', queryFn:()=>patientService.getDischarge(id).then(r=>r.data.data).catch(()=>null) })
  const { data: availDoctors=[] } = useQuery({ queryKey:['avail-docs'], queryFn:()=>doctorService.getAvailable().then(r=>r.data.data), staleTime:60000 })

  // Panel states
  const [vitalPanel,    setVitalPanel]    = useState(false)
  const [diagPanel,     setDiagPanel]     = useState(false)
  const [treatPanel,    setTreatPanel]    = useState(false)
  const [notePanel,     setNotePanel]     = useState(false)
  const [labPanel,      setLabPanel]      = useState(false)
  const [assignPanel,   setAssignPanel]   = useState(false)
  const [dischargePanel,setDischargePanel]= useState(false)
  const [aiLoading,     setAiLoading]     = useState(false)
  const [reviewId,      setReviewId]      = useState(null)
  const [reviewAction,  setReviewAction]  = useState(null)
  const [reviewNotes,   setReviewNotes]   = useState('')
  const [modifiedTx,    setModifiedTx]    = useState('')

  // Forms
  const [vForm, setVForm] = useState({ bloodPressureSystolic:'',bloodPressureDiastolic:'',pulseBpm:'',temperatureCelsius:'',spo2Percent:'',weightKg:'',heightCm:'',respiratoryRate:'',bloodGlucose:'',remarks:'' })
  const [dForm, setDForm] = useState({ diagnosisName:'',icd10Code:'',isPrimary:false,severity:'MODERATE',description:'' })
  const [tForm, setTForm] = useState({ drugName:'',dosage:'',frequency:'',duration:'',routeOfAdministration:'Oral',specialInstructions:'' })
  const [nForm, setNForm] = useState({ noteType:'PROGRESS',content:'' })
  const [lForm, setLForm] = useState({ testName:'',testCategory:'',resultValue:'',referenceRange:'',unit:'',isAbnormal:false,remarks:'' })
  const [assignDoc,    setAssignDoc]    = useState('')
  const [assignRole,   setAssignRole]   = useState('')
  const [assignReason, setAssignReason] = useState('')
  const [disForm, setDisForm] = useState({ finalDiagnosis:'',hospitalCourse:'',proceduresPerformed:'',conditionAtDischarge:'',dischargeMedications:'',followUpInstructions:'',followUpDate:'',dietAdvice:'',activityRestrictions:'' })

  // Mutations
  const addVital = useMutation({
    mutationFn: () => { const p={}; Object.entries(vForm).forEach(([k,v])=>{ if(v!=='') p[k]=isNaN(Number(v))?v:Number(v) }); return patientService.addVital(id,p) },
    onSuccess: ()=>{ qc.invalidateQueries({queryKey:['vitals',id]}); setVitalPanel(false); showToast('Vitals recorded','success') },
    onError: ()=>showToast('Failed','error'),
  })
  const addDiag = useMutation({
    mutationFn: ()=>patientService.addDiagnosis(id,dForm),
    onSuccess: ()=>{ qc.invalidateQueries({queryKey:['diagnoses',id]}); setDiagPanel(false); showToast('Diagnosis added','success') },
    onError: ()=>showToast('Failed','error'),
  })
  const addTreat = useMutation({
    mutationFn: ()=>patientService.addTreatment(id,tForm),
    onSuccess: ()=>{ qc.invalidateQueries({queryKey:['treatments',id]}); setTreatPanel(false); showToast('Treatment prescribed','success') },
    onError: ()=>showToast('Failed','error'),
  })
  const stopTreat = useMutation({
    mutationFn: tid=>patientService.stopTreatment(id,tid),
    onSuccess: ()=>{ qc.invalidateQueries({queryKey:['treatments',id]}); showToast('Treatment stopped','info') },
  })
  const addNote = useMutation({
    mutationFn: ()=>patientService.addNote(id,nForm),
    onSuccess: ()=>{ qc.invalidateQueries({queryKey:['notes',id]}); setNotePanel(false); showToast('Note saved','success') },
    onError: ()=>showToast('Failed','error'),
  })
  const addLab = useMutation({
    mutationFn: ()=>patientService.addLabResult(id,lForm),
    onSuccess: ()=>{ qc.invalidateQueries({queryKey:['labs',id]}); setLabPanel(false); showToast('Lab result added','success') },
    onError: ()=>showToast('Failed','error'),
  })
  const doAssign = useMutation({
    mutationFn: ()=>assignmentService.assign({patientId:id,doctorId:assignDoc,assignmentRole:assignRole,assignmentReason:assignReason}),
    onSuccess: ()=>{ qc.invalidateQueries({queryKey:['assignments',id]}); setAssignPanel(false); showToast('Doctor assigned','success') },
    onError: ()=>showToast('Assignment failed','error'),
  })
  const doDischarge = useMutation({
    mutationFn: ()=>patientService.createDischarge(id,disForm),
    onSuccess: ()=>{ qc.invalidateQueries({queryKey:['discharge',id]}); setDischargePanel(false); showToast('Discharge summary saved','success') },
    onError: ()=>showToast('Failed to save discharge','error'),
  })
  const reviewRec = useMutation({
    mutationFn: async()=>{
      const data={doctorNotes:reviewNotes,rejectionReason:reviewNotes,modifiedTreatment:modifiedTx}
      if(reviewAction==='approve') return aiService.approve(reviewId,data)
      if(reviewAction==='reject')  return aiService.reject(reviewId,data)
      if(reviewAction==='modify')  return aiService.modify(reviewId,data)
    },
    onSuccess: ()=>{ qc.invalidateQueries({queryKey:['ai-recs',id]}); setReviewId(null); setReviewAction(null); setReviewNotes(''); setModifiedTx(''); showToast('Recommendation reviewed','success') },
    onError: ()=>showToast('Review failed','error'),
  })

  const requestAI = async()=>{
    setAiLoading(true)
    try { await aiService.request(id); qc.invalidateQueries({queryKey:['ai-recs',id]}); showToast('AI recommendation generated','success') }
    catch{ showToast('AI service unavailable','error') }
    finally{ setAiLoading(false) }
  }

  if(isLoading||!patient) return (
    <div className="space-y-4">
      <div className="h-32 bg-navy-700 rounded-xl animate-pulse" />
      <div className="h-96 bg-navy-700 rounded-xl animate-pulse" />
    </div>
  )

  const latestVital = vitals[0]
  const vitalsAlerts = latestVital ? getVitalsAlerts(latestVital) : []
  const abnormalLabs = labs.filter(l=>l.isAbnormal).length
  const chartData = [...vitals].reverse().slice(-20).map(v=>({ t:formatDate(v.recordedAt,'dd/MM HH:mm'), BP:v.bloodPressureSystolic, Pulse:v.pulseBpm, SpO2:v.spo2Percent }))

  return (
    <div className="animate-fade-in">
      <Link href="/main/patients" className="inline-flex items-center gap-1.5 text-slate-400 hover:text-slate-200 text-sm mb-4 transition-colors">
        <ChevronLeft size={16}/>Back to Patients
      </Link>

      {/* Patient header */}
      <div className="card p-5 mb-5">
        <div className="flex flex-wrap items-start gap-4">
          <div className="w-14 h-14 rounded-full bg-teal-500/20 border-2 border-teal-500/30 flex items-center justify-center text-teal-400 font-bold text-lg flex-shrink-0">
            {patient.fullName.split(' ').map(n=>n[0]).slice(0,2).join('')}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <h1 className="text-xl font-bold text-slate-200">{patient.fullName}</h1>
              <StatusBadge status={patient.status}/>
              <BloodGroupBadge bg={patient.bloodGroup}/>
              {vitalsAlerts.map(a=>(
                <span key={a} className="flex items-center gap-1 text-xs bg-red-500/20 text-red-400 border border-red-500/30 px-2 py-0.5 rounded-full">
                  <AlertTriangle size={10}/>{a}
                </span>
              ))}
              {abnormalLabs>0 && (
                <span className="flex items-center gap-1 text-xs bg-amber-500/20 text-amber-400 border border-amber-500/30 px-2 py-0.5 rounded-full">
                  <FlaskConical size={10}/>{abnormalLabs} abnormal lab{abnormalLabs>1?'s':''}
                </span>
              )}
            </div>
            <div className="flex flex-wrap gap-3 text-sm text-slate-400">
              <span className="mono">{patient.patientCode}</span>
              <span>·</span><span>{patient.age}y {patient.gender}</span>
              {patient.ward&&<><span>·</span><span>{patient.ward}{patient.bedNumber&&` · Bed ${patient.bedNumber}`}</span></>}
              {patient.primaryDoctor&&<><span>·</span><span>Dr. {patient.primaryDoctor.fullName}</span></>}
            </div>
          </div>
          <div className="flex gap-2 flex-wrap">
            <button onClick={()=>window.print()} className="btn-secondary text-xs py-1.5"><Printer size={14}/>Print</button>
            <button onClick={()=>{setTab('ai');requestAI()}} className="btn-secondary text-xs py-1.5"><Brain size={14}/>AI Rec</button>
            <button onClick={()=>{setVitalPanel(true);setTab('vitals')}} className="btn-secondary text-xs py-1.5"><Activity size={14}/>Vital</button>
            <button onClick={()=>setAssignPanel(true)} className="btn-primary text-xs py-1.5"><UserPlus size={14}/>Assign</button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 overflow-x-auto pb-1 mb-5">
        {TABS.map(t=>(
          <button key={t.id} onClick={()=>setTab(t.id)}
            className={cn('flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition-all',
              tab===t.id?'bg-teal-500/15 text-teal-400 border border-teal-500/20':'text-slate-400 hover:text-slate-200 hover:bg-navy-600')}>
            {t.icon}{t.label}
          </button>
        ))}
      </div>

      {/* Overview */}
      {tab==='overview'&&(
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <div className="card p-5 space-y-4">
            <SectionHeader title="Demographics"/>
            <div className="grid grid-cols-2 gap-3">
              <InfoRow label="Full Name" value={patient.fullName}/>
              <InfoRow label="Date of Birth" value={formatDate(patient.dateOfBirth)}/>
              <InfoRow label="Phone" value={patient.phone}/>
              <InfoRow label="Email" value={patient.email}/>
            </div>
            <Divider/>
            <SectionHeader title="Emergency Contact"/>
            <div className="grid grid-cols-2 gap-3">
              <InfoRow label="Name" value={patient.emergencyContactName}/>
              <InfoRow label="Phone" value={patient.emergencyContactPhone}/>
              <InfoRow label="Relation" value={patient.emergencyContactRelation}/>
            </div>
          </div>
          <div className="card p-5 space-y-4">
            <SectionHeader title="Medical Background"/>
            {patient.knownAllergies&&(
              <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20">
                <p className="text-xs text-red-400 font-medium mb-1 uppercase tracking-wide">⚠ Known Allergies</p>
                <p className="text-slate-200 text-sm">{patient.knownAllergies}</p>
              </div>
            )}
            <div className="space-y-3">
              <InfoRow label="Chronic Conditions" value={patient.chronicConditions}/>
              <InfoRow label="Family History" value={patient.familyHistory}/>
              <InfoRow label="Past Surgeries" value={patient.pastSurgeries}/>
            </div>
            <Divider/>
            <SectionHeader title="Assigned Doctors" action={<button onClick={()=>setAssignPanel(true)} className="btn-primary text-xs py-1 px-2"><Plus size={12}/>Assign</button>}/>
            {assignments.length===0
              ?<p className="text-slate-400 text-sm">No additional doctors assigned.</p>
              :assignments.map(a=>(
                <div key={a.id} className="flex items-center justify-between p-2.5 rounded-lg bg-navy-600">
                  <div className="flex items-center gap-2.5">
                    <Avatar name={a.assignedDoctorName} size="sm"/>
                    <div>
                      <p className="text-slate-200 text-xs font-medium">{a.assignedDoctorName}</p>
                      <p className="text-slate-400 text-xs">{a.assignmentRole.replace('DOCTOR_','')}</p>
                    </div>
                  </div>
                  <span className="text-xs text-green-400 bg-green-500/10 px-2 py-0.5 rounded-full">{a.status}</span>
                </div>
              ))
            }
          </div>
        </div>
      )}

      {/* Vitals */}
      {tab==='vitals'&&(
        <div className="space-y-5">
          {vitalsAlerts.length>0&&(
            <div className="flex items-center gap-3 p-3.5 rounded-xl bg-red-500/10 border border-red-500/30">
              <AlertTriangle size={18} className="text-red-400 flex-shrink-0"/>
              <div><p className="text-red-400 font-semibold text-sm">Vitals Alert</p><p className="text-red-400/70 text-xs">{vitalsAlerts.join(' · ')}</p></div>
            </div>
          )}
          {latestVital&&(
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
              {[
                {label:'BP',         value:latestVital.bloodPressureSystolic?`${latestVital.bloodPressureSystolic}/${latestVital.bloodPressureDiastolic}`:'—', unit:'mmHg', icon:<Heart size={16}/>,       color:latestVital.bloodPressureSystolic>140?'text-red-400':'text-teal-400'},
                {label:'Pulse',      value:latestVital.pulseBpm??'—',             unit:'bpm',   icon:<Activity size={16}/>,    color:latestVital.pulseBpm>120?'text-red-400':'text-teal-400'},
                {label:'Temp',       value:latestVital.temperatureCelsius??'—',   unit:'°C',    icon:<Thermometer size={16}/>, color:latestVital.temperatureCelsius>38.5?'text-orange-400':'text-orange-400'},
                {label:'SpO₂',       value:latestVital.spo2Percent??'—',          unit:'%',     icon:<Wind size={16}/>,        color:latestVital.spo2Percent<95?'text-red-400':'text-blue-400'},
                {label:'Glucose',    value:latestVital.bloodGlucose??'—',         unit:'mg/dL', icon:<Droplets size={16}/>,    color:'text-amber-400'},
                {label:'BMI',        value:latestVital.bmi??'—',                  unit:'',      icon:<Scale size={16}/>,       color:'text-purple-400'},
              ].map(v=>(
                <div key={v.label} className={cn('card p-4 text-center', vitalsAlerts.length&&(v.label==='BP'||v.label==='SpO₂'||v.label==='Pulse')&&'border-red-500/30 bg-red-500/5')}>
                  <div className={cn('flex justify-center mb-2',v.color)}>{v.icon}</div>
                  <p className={cn('text-xl font-bold mono',v.color)}>{v.value}</p>
                  <p className="text-slate-600 text-xs">{v.unit}</p>
                  <p className="text-slate-400 text-xs mt-0.5">{v.label}</p>
                </div>
              ))}
            </div>
          )}
          {chartData.length>1&&(
            <div className="card p-5">
              <SectionHeader title="Vital Trends" action={<button onClick={()=>setVitalPanel(true)} className="btn-primary text-xs py-1 px-2"><Plus size={12}/>Record</button>}/>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1E2A3E"/>
                  <XAxis dataKey="t" tick={{fill:'#64748B',fontSize:10}}/>
                  <YAxis tick={{fill:'#64748B',fontSize:10}}/>
                  <Tooltip contentStyle={TOOLTIP}/>
                  <Line type="monotone" dataKey="BP" stroke="#F87171" strokeWidth={2} dot={false} name="BP"/>
                  <Line type="monotone" dataKey="Pulse" stroke="#00C6B3" strokeWidth={2} dot={false} name="Pulse"/>
                  <Line type="monotone" dataKey="SpO2" stroke="#60A5FA" strokeWidth={2} dot={false} name="SpO₂"/>
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
          <div className="card overflow-hidden">
            <div className="p-4 border-b border-navy-500 flex items-center justify-between">
              <h3 className="font-semibold text-slate-200 text-sm">Vitals History</h3>
              <button onClick={()=>setVitalPanel(true)} className="btn-primary text-xs py-1.5"><Plus size={13}/>Record Vitals</button>
            </div>
            {vitals.length===0
              ?<EmptyState icon={<Activity size={22}/>} title="No vitals recorded" action={<button onClick={()=>setVitalPanel(true)} className="btn-primary text-xs">Record</button>}/>
              :<div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead><tr className="border-b border-navy-500">
                    {['Time','BP','Pulse','Temp','SpO₂','Glucose','BMI','By'].map(h=>(
                      <th key={h} className="text-left px-4 py-2.5 text-xs text-slate-400 uppercase tracking-wide font-medium">{h}</th>
                    ))}
                  </tr></thead>
                  <tbody className="divide-y divide-navy-500">
                    {vitals.map(v=>{
                      const a=getVitalsAlerts(v)
                      return(
                        <tr key={v.id} className={cn('transition-colors',a.length>0?'bg-red-500/5 hover:bg-red-500/10':'hover:bg-navy-600')}>
                          <td className="px-4 py-2.5 text-slate-400 text-xs mono">{formatDateTime(v.recordedAt)}</td>
                          <td className={cn('px-4 py-2.5 mono text-xs font-medium',v.bloodPressureSystolic>140?'text-red-400':'text-slate-200')}>{v.bloodPressureSystolic?`${v.bloodPressureSystolic}/${v.bloodPressureDiastolic}`:'—'}</td>
                          <td className={cn('px-4 py-2.5 mono text-xs',v.pulseBpm>120?'text-red-400':'')}>{v.pulseBpm??'—'}</td>
                          <td className={cn('px-4 py-2.5 mono text-xs',v.temperatureCelsius>38.5?'text-orange-400':'')}>{v.temperatureCelsius??'—'}</td>
                          <td className={cn('px-4 py-2.5 mono text-xs',v.spo2Percent<95?'text-red-400':'')}>{v.spo2Percent??'—'}</td>
                          <td className="px-4 py-2.5 mono text-xs">{v.bloodGlucose??'—'}</td>
                          <td className="px-4 py-2.5 mono text-xs">{v.bmi??'—'}</td>
                          <td className="px-4 py-2.5 text-slate-400 text-xs">{v.recordedByName}</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            }
          </div>
        </div>
      )}

      {/* Diagnosis & Treatment */}
      {tab==='diagnosis'&&(
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <div className="card overflow-hidden">
            <div className="p-4 border-b border-navy-500 flex items-center justify-between">
              <h3 className="font-semibold text-slate-200 text-sm">Diagnoses</h3>
              <button onClick={()=>setDiagPanel(true)} className="btn-primary text-xs py-1.5"><Plus size={13}/>Add</button>
            </div>
            {diagnoses.length===0
              ?<EmptyState icon={<Stethoscope size={22}/>} title="No diagnoses" action={<button onClick={()=>setDiagPanel(true)} className="btn-primary text-xs">Add</button>}/>
              :<div className="divide-y divide-navy-500">
                {diagnoses.map(d=>(
                  <div key={d.id} className="p-4">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <p className="text-slate-200 text-sm font-medium">{d.diagnosisName}</p>
                      <div className="flex gap-1.5 flex-shrink-0">
                        {d.isPrimary&&<span className="text-xs bg-teal-500/20 text-teal-400 px-1.5 py-0.5 rounded">Primary</span>}
                        {d.severity&&<SeverityBadge severity={d.severity}/>}
                      </div>
                    </div>
                    {d.icd10Code&&<p className="text-slate-400 text-xs mono">ICD-10: {d.icd10Code}</p>}
                    {d.description&&<p className="text-slate-400 text-xs mt-1">{d.description}</p>}
                    <p className="text-slate-600 text-xs mt-1">Dr. {d.diagnosedByName} · {timeAgo(d.createdAt)}</p>
                  </div>
                ))}
              </div>
            }
          </div>
          <div className="card overflow-hidden">
            <div className="p-4 border-b border-navy-500 flex items-center justify-between">
              <h3 className="font-semibold text-slate-200 text-sm">Active Medications</h3>
              <button onClick={()=>setTreatPanel(true)} className="btn-primary text-xs py-1.5"><Plus size={13}/>Prescribe</button>
            </div>
            {treatments.length===0
              ?<EmptyState icon={<Syringe size={22}/>} title="No treatments" action={<button onClick={()=>setTreatPanel(true)} className="btn-primary text-xs">Prescribe</button>}/>
              :<div className="divide-y divide-navy-500">
                {treatments.map(t=>(
                  <div key={t.id} className={cn('p-4',!t.isActive&&'opacity-40')}>
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1.5">
                          <div className={cn('w-2 h-2 rounded-full flex-shrink-0',t.isActive?'bg-green-400':'bg-slate-600')}/>
                          <p className="text-slate-200 text-sm font-semibold mono">{t.drugName}</p>
                          {t.isAiSuggested&&<span className="text-xs bg-purple-500/20 text-purple-400 px-1.5 py-0.5 rounded">AI</span>}
                          {!t.isActive&&<span className="text-xs bg-red-500/20 text-red-400 px-1.5 py-0.5 rounded">Stopped</span>}
                        </div>
                        <div className="ml-4">
                          <p className="text-teal-400 text-xs">{t.dosage} · {t.frequency} · {t.duration}</p>
                          <p className="text-slate-400 text-xs">{t.routeOfAdministration}</p>
                          {t.specialInstructions&&<p className="text-slate-500 text-xs italic mt-0.5">{t.specialInstructions}</p>}
                          {t.contraindicationWarning&&(
                            <div className="flex items-start gap-1 mt-2 p-2 rounded bg-amber-500/10 border border-amber-500/20">
                              <AlertTriangle size={11} className="text-amber-400 mt-0.5 flex-shrink-0"/>
                              <p className="text-amber-400 text-xs">{t.contraindicationWarning}</p>
                            </div>
                          )}
                        </div>
                      </div>
                      {t.isActive&&(
                        <button onClick={()=>stopTreat.mutate(t.id)} className="text-xs text-red-400 border border-red-500/30 px-2 py-1 rounded flex-shrink-0 hover:bg-red-500/10 transition-colors">Stop</button>
                      )}
                    </div>
                    <p className="text-slate-600 text-xs mt-2 ml-4">Dr. {t.prescribedByName} · {timeAgo(t.createdAt)}</p>
                  </div>
                ))}
              </div>
            }
          </div>
        </div>
      )}

      {/* AI Recs */}
      {tab==='ai'&&(
        <div className="space-y-5">
          <div className="card p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="font-semibold text-slate-200 flex items-center gap-2"><Brain size={18} className="text-purple-400"/>JeevaAI Clinical Assistant</h3>
                <p className="text-slate-400 text-sm mt-1">Powered by Claude AI — analyzes all patient data and suggests a personalized treatment plan.</p>
              </div>
              <button onClick={requestAI} disabled={aiLoading} className="btn-primary disabled:opacity-60 flex-shrink-0">
                {aiLoading?<><span className="w-4 h-4 border-2 border-navy-900/40 border-t-navy-900 rounded-full animate-spin"/>Analyzing...</>:<><Brain size={15}/>Request AI Rec</>}
              </button>
            </div>
          </div>
          {aiRecs.length===0
            ?<EmptyState icon={<Brain size={24}/>} title="No AI recommendations yet" description="Request one to get JeevaAI's clinical insights"/>
            :aiRecs.map(rec=>(
              <div key={rec.id} className="card p-5">
                <div className="flex items-center gap-2 mb-4">
                  <Brain size={16} className="text-purple-400"/>
                  <span className="text-slate-200 font-semibold text-sm">AI Recommendation</span>
                  <RecStatusBadge status={rec.status}/>
                  {rec.urgencyLevel&&(
                    <span className={cn('text-xs px-2 py-0.5 rounded-full font-medium',rec.urgencyLevel==='EMERGENCY'?'bg-red-500/20 text-red-400':rec.urgencyLevel==='URGENT'?'bg-amber-500/20 text-amber-400':'bg-green-500/20 text-green-400')}>
                      {rec.urgencyLevel}
                    </span>
                  )}
                  <span className="text-slate-600 text-xs ml-auto">{timeAgo(rec.createdAt)}</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  {rec.suggestedTreatment&&<div className="p-3 rounded-lg bg-navy-600"><p className="text-xs text-teal-400 font-medium uppercase tracking-wide mb-1.5">Suggested Treatment</p><p className="text-slate-200 text-sm whitespace-pre-wrap">{rec.suggestedTreatment}</p></div>}
                  {rec.suggestedDrugs&&<div className="p-3 rounded-lg bg-navy-600"><p className="text-xs text-blue-400 font-medium uppercase tracking-wide mb-1.5">Suggested Drugs</p><p className="text-slate-200 text-sm whitespace-pre-wrap">{rec.suggestedDrugs}</p></div>}
                  {rec.contraindicationWarnings&&<div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20"><p className="text-xs text-amber-400 font-medium uppercase tracking-wide mb-1.5 flex items-center gap-1"><AlertTriangle size={11}/>Contraindications</p><p className="text-amber-300 text-sm whitespace-pre-wrap">{rec.contraindicationWarnings}</p></div>}
                  {rec.referralSuggestion&&<div className="p-3 rounded-lg bg-navy-600"><p className="text-xs text-purple-400 font-medium uppercase tracking-wide mb-1.5">Referral</p><p className="text-slate-200 text-sm">{rec.referralSuggestion}</p></div>}
                </div>
                {rec.status==='PENDING_REVIEW'
                  ?reviewId===rec.id
                    ?<div className="p-3 rounded-lg bg-navy-600 space-y-3">
                        {reviewAction==='modify'&&<div><label className="label">Your Modified Treatment Plan</label><textarea value={modifiedTx} onChange={e=>setModifiedTx(e.target.value)} rows={3} className="input-field resize-none"/></div>}
                        <div><label className="label">{reviewAction==='reject'?'Rejection Reason *':'Notes (optional)'}</label><textarea value={reviewNotes} onChange={e=>setReviewNotes(e.target.value)} rows={2} className="input-field resize-none"/></div>
                        <div className="flex gap-2">
                          <button onClick={()=>reviewRec.mutate()} disabled={reviewRec.isPending||(reviewAction==='reject'&&!reviewNotes)} className={cn('btn-primary text-xs disabled:opacity-50',reviewAction==='reject'&&'bg-red-500 hover:bg-red-600 text-white')}>Confirm {reviewAction}</button>
                          <button onClick={()=>{setReviewId(null);setReviewAction(null)}} className="btn-secondary text-xs">Cancel</button>
                        </div>
                      </div>
                    :<div className="flex gap-2">
                        <button onClick={()=>{setReviewId(rec.id);setReviewAction('approve')}} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-green-500/20 text-green-400 border border-green-500/30 hover:bg-green-500/30 transition-colors"><Check size={13}/>Approve</button>
                        <button onClick={()=>{setReviewId(rec.id);setReviewAction('reject')}} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30 transition-colors"><X size={13}/>Reject</button>
                        <button onClick={()=>{setReviewId(rec.id);setReviewAction('modify')}} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-blue-500/20 text-blue-400 border border-blue-500/30 hover:bg-blue-500/30 transition-colors"><Edit size={13}/>Modify</button>
                      </div>
                  :<div className="p-3 rounded-lg bg-navy-600">
                      <p className="text-xs text-slate-400 font-medium mb-1">Review by Dr. {rec.reviewedByName}</p>
                      {rec.doctorNotes&&<p className="text-slate-200 text-sm">{rec.doctorNotes}</p>}
                      {rec.rejectionReason&&<p className="text-red-400 text-sm mt-1">Reason: {rec.rejectionReason}</p>}
                      {rec.modifiedTreatment&&<p className="text-teal-400 text-sm mt-1">Modified: {rec.modifiedTreatment}</p>}
                    </div>
                }
              </div>
            ))
          }
        </div>
      )}

      {/* Notes */}
      {tab==='notes'&&(
        <div className="card overflow-hidden">
          <div className="p-4 border-b border-navy-500 flex items-center justify-between">
            <h3 className="font-semibold text-slate-200 text-sm">Consultation Notes</h3>
            <button onClick={()=>setNotePanel(true)} className="btn-primary text-xs py-1.5"><Plus size={13}/>Add Note</button>
          </div>
          {notes.length===0
            ?<EmptyState icon={<FileText size={22}/>} title="No notes yet" action={<button onClick={()=>setNotePanel(true)} className="btn-primary text-xs">Write Note</button>}/>
            :<div className="divide-y divide-navy-500">
              {notes.map(n=>(
                <div key={n.id} className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Avatar name={n.authorName||'DR'} size="sm"/>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-slate-200 text-xs font-medium">{n.authorName}</span>
                        <span className={cn('text-xs px-1.5 py-0.5 rounded font-medium',n.noteType==='PROGRESS'?'bg-blue-500/20 text-blue-400':n.noteType==='SURGICAL'?'bg-red-500/20 text-red-400':'bg-navy-500 text-slate-400')}>{n.noteType}</span>
                        {n.isLocked&&<Lock size={11} className="text-slate-600"/>}
                      </div>
                      <p className="text-slate-600 text-xs">{formatDateTime(n.createdAt)}</p>
                    </div>
                  </div>
                  <p className="text-slate-200 text-sm leading-relaxed whitespace-pre-wrap">{n.content}</p>
                </div>
              ))}
            </div>
          }
        </div>
      )}

      {/* Labs */}
      {tab==='labs'&&(
        <div className="card overflow-hidden">
          <div className="p-4 border-b border-navy-500 flex items-center justify-between">
            <h3 className="font-semibold text-slate-200 text-sm">
              Lab Results {abnormalLabs>0&&<span className="ml-1.5 text-xs bg-red-500/20 text-red-400 px-2 py-0.5 rounded-full">{abnormalLabs} abnormal</span>}
            </h3>
            <button onClick={()=>setLabPanel(true)} className="btn-primary text-xs py-1.5"><Plus size={13}/>Add Result</button>
          </div>
          {labs.length===0
            ?<EmptyState icon={<FlaskConical size={22}/>} title="No lab results" action={<button onClick={()=>setLabPanel(true)} className="btn-primary text-xs">Add</button>}/>
            :<div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="border-b border-navy-500">
                  {['Test','Category','Result','Reference','Unit','Flag','By','Date'].map(h=>(
                    <th key={h} className="text-left px-4 py-2.5 text-xs text-slate-400 uppercase tracking-wide font-medium">{h}</th>
                  ))}
                </tr></thead>
                <tbody className="divide-y divide-navy-500">
                  {labs.map(l=>(
                    <tr key={l.id} className={cn('hover:bg-navy-600 transition-colors',l.isAbnormal&&'bg-red-500/5')}>
                      <td className="px-4 py-3 font-medium text-slate-200">{l.testName}</td>
                      <td className="px-4 py-3 text-slate-400 text-xs">{l.testCategory||'—'}</td>
                      <td className={cn('px-4 py-3 mono font-semibold',l.isAbnormal?'text-red-400':'text-slate-200')}>{l.resultValue||'—'}</td>
                      <td className="px-4 py-3 text-slate-400 text-xs">{l.referenceRange||'—'}</td>
                      <td className="px-4 py-3 text-slate-400 text-xs">{l.unit||'—'}</td>
                      <td className="px-4 py-3">{l.isAbnormal&&<span className="text-xs bg-red-500/20 text-red-400 px-1.5 py-0.5 rounded font-medium">⚠ Abnormal</span>}</td>
                      <td className="px-4 py-3 text-slate-400 text-xs">{l.orderedByName}</td>
                      <td className="px-4 py-3 text-slate-600 text-xs mono">{formatDate(l.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          }
        </div>
      )}

      {/* Discharge */}
      {tab==='discharge'&&(
        <div className="card p-6">
          {discharge
            ?<div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-slate-200">Discharge Summary</h3>
                <span className="text-xs text-green-400 bg-green-500/10 px-2 py-1 rounded-full">Discharged {formatDate(discharge.dischargeDate)}</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <InfoRow label="Final Diagnosis"         value={discharge.finalDiagnosis}/>
                <InfoRow label="Condition at Discharge"  value={discharge.conditionAtDischarge}/>
                <InfoRow label="Hospital Course"         value={discharge.hospitalCourse}/>
                <InfoRow label="Procedures Performed"    value={discharge.proceduresPerformed}/>
                <InfoRow label="Discharge Medications"   value={discharge.dischargeMedications}/>
                <InfoRow label="Follow-up Instructions"  value={discharge.followUpInstructions}/>
                <InfoRow label="Follow-up Date"          value={formatDate(discharge.followUpDate)}/>
                <InfoRow label="Diet Advice"             value={discharge.dietAdvice}/>
                <InfoRow label="Activity Restrictions"   value={discharge.activityRestrictions}/>
                <InfoRow label="Discharged By"           value={`Dr. ${discharge.dischargedByName}`}/>
              </div>
            </div>
            :<div className="text-center py-8">
              <FileText size={32} className="text-slate-600 mx-auto mb-3"/>
              <h3 className="text-slate-200 font-semibold mb-1">No Discharge Summary</h3>
              <p className="text-slate-400 text-sm mb-4">Patient has not been discharged yet.</p>
              <button onClick={()=>setDischargePanel(true)} className="btn-primary"><FileText size={15}/>Create Discharge Summary</button>
            </div>
          }
        </div>
      )}

      {/* ══ Slide Panels ══ */}

      {/* Vitals */}
      <SlidePanel open={vitalPanel} onClose={()=>setVitalPanel(false)} title="Record Vitals">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            {[['bloodPressureSystolic','BP Systolic (mmHg)'],['bloodPressureDiastolic','BP Diastolic (mmHg)'],['pulseBpm','Pulse (bpm)'],['temperatureCelsius','Temperature (°C)'],['spo2Percent','SpO₂ (%)'],['weightKg','Weight (kg)'],['heightCm','Height (cm)'],['respiratoryRate','Respiratory Rate'],['bloodGlucose','Blood Glucose (mg/dL)']].map(([k,l])=>(
              <div key={k}><label className="label">{l}</label><input type="number" value={vForm[k]} onChange={e=>setVForm(f=>({...f,[k]:e.target.value}))} placeholder="—" className="input-field"/></div>
            ))}
          </div>
          <div><label className="label">Remarks</label><textarea value={vForm.remarks} onChange={e=>setVForm(f=>({...f,remarks:e.target.value}))} rows={2} className="input-field resize-none"/></div>
          <button onClick={()=>addVital.mutate()} disabled={addVital.isPending} className="btn-primary w-full justify-center">{addVital.isPending?'Saving...':'Save Vitals'}</button>
        </div>
      </SlidePanel>

      {/* Diagnosis */}
      <SlidePanel open={diagPanel} onClose={()=>setDiagPanel(false)} title="Add Diagnosis">
        <div className="space-y-4">
          <div><label className="label">Diagnosis Name *</label><input value={dForm.diagnosisName} onChange={e=>setDForm(f=>({...f,diagnosisName:e.target.value}))} placeholder="e.g. Type 2 Diabetes Mellitus" className="input-field"/></div>
          <div><label className="label">ICD-10 Code</label><input value={dForm.icd10Code} onChange={e=>setDForm(f=>({...f,icd10Code:e.target.value}))} placeholder="e.g. E11.9" className="input-field mono"/></div>
          <div><label className="label">Severity</label><select value={dForm.severity} onChange={e=>setDForm(f=>({...f,severity:e.target.value}))} className="input-field">{['LOW','MODERATE','HIGH','CRITICAL'].map(s=><option key={s} value={s}>{s}</option>)}</select></div>
          <div className="flex items-center gap-2"><input type="checkbox" checked={dForm.isPrimary} onChange={e=>setDForm(f=>({...f,isPrimary:e.target.checked}))} className="w-4 h-4 accent-teal-500"/><label className="text-slate-400 text-sm">Mark as primary diagnosis</label></div>
          <div><label className="label">Description</label><textarea value={dForm.description} onChange={e=>setDForm(f=>({...f,description:e.target.value}))} rows={3} className="input-field resize-none"/></div>
          <button onClick={()=>addDiag.mutate()} disabled={addDiag.isPending||!dForm.diagnosisName} className="btn-primary w-full justify-center disabled:opacity-50">{addDiag.isPending?'Saving...':'Add Diagnosis'}</button>
        </div>
      </SlidePanel>

      {/* Treatment */}
      <SlidePanel open={treatPanel} onClose={()=>setTreatPanel(false)} title="Prescribe Treatment">
        <div className="space-y-4">
          <div><label className="label">Drug Name *</label><input value={tForm.drugName} onChange={e=>setTForm(f=>({...f,drugName:e.target.value}))} placeholder="e.g. Amlodipine 5mg" className="input-field mono"/></div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="label">Dosage</label><input value={tForm.dosage} onChange={e=>setTForm(f=>({...f,dosage:e.target.value}))} placeholder="e.g. 5mg" className="input-field"/></div>
            <div><label className="label">Frequency</label><input value={tForm.frequency} onChange={e=>setTForm(f=>({...f,frequency:e.target.value}))} placeholder="Once daily" className="input-field"/></div>
            <div><label className="label">Duration</label><input value={tForm.duration} onChange={e=>setTForm(f=>({...f,duration:e.target.value}))} placeholder="30 days" className="input-field"/></div>
            <div><label className="label">Route</label><select value={tForm.routeOfAdministration} onChange={e=>setTForm(f=>({...f,routeOfAdministration:e.target.value}))} className="input-field">{['Oral','IV','IM','SC','Topical','Inhaled','Sublingual'].map(r=><option key={r} value={r}>{r}</option>)}</select></div>
          </div>
          <div><label className="label">Special Instructions</label><textarea value={tForm.specialInstructions} onChange={e=>setTForm(f=>({...f,specialInstructions:e.target.value}))} rows={2} className="input-field resize-none" placeholder="e.g. Take with food"/></div>
          <button onClick={()=>addTreat.mutate()} disabled={addTreat.isPending||!tForm.drugName} className="btn-primary w-full justify-center disabled:opacity-50">{addTreat.isPending?'Saving...':'Prescribe Treatment'}</button>
        </div>
      </SlidePanel>

      {/* Note */}
      <SlidePanel open={notePanel} onClose={()=>setNotePanel(false)} title="Add Consultation Note">
        <div className="space-y-4">
          <div><label className="label">Note Type</label><select value={nForm.noteType} onChange={e=>setNForm(f=>({...f,noteType:e.target.value}))} className="input-field">{['PROGRESS','CONSULTATION','SURGICAL','ANAESTHESIA','DISCHARGE','GENERAL'].map(t=><option key={t} value={t}>{t}</option>)}</select></div>
          <div><label className="label">Content *</label><textarea value={nForm.content} onChange={e=>setNForm(f=>({...f,content:e.target.value}))} rows={8} className="input-field resize-none" placeholder="Write your clinical note..."/></div>
          <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20"><Lock size={13} className="text-amber-400 mt-0.5 flex-shrink-0"/><p className="text-amber-400 text-xs">Notes are locked immediately after saving and cannot be edited.</p></div>
          <button onClick={()=>addNote.mutate()} disabled={addNote.isPending||!nForm.content} className="btn-primary w-full justify-center disabled:opacity-50">{addNote.isPending?'Saving...':'Save Note'}</button>
        </div>
      </SlidePanel>

      {/* Lab */}
      <SlidePanel open={labPanel} onClose={()=>setLabPanel(false)} title="Add Lab Result">
        <div className="space-y-4">
          <div><label className="label">Test Name *</label><input value={lForm.testName} onChange={e=>setLForm(f=>({...f,testName:e.target.value}))} placeholder="e.g. HbA1c, CBC, LFT" className="input-field"/></div>
          <div><label className="label">Category</label><input value={lForm.testCategory} onChange={e=>setLForm(f=>({...f,testCategory:e.target.value}))} placeholder="e.g. Biochemistry" className="input-field"/></div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="label">Result Value</label><input value={lForm.resultValue} onChange={e=>setLForm(f=>({...f,resultValue:e.target.value}))} className="input-field mono"/></div>
            <div><label className="label">Unit</label><input value={lForm.unit} onChange={e=>setLForm(f=>({...f,unit:e.target.value}))} className="input-field"/></div>
          </div>
          <div><label className="label">Reference Range</label><input value={lForm.referenceRange} onChange={e=>setLForm(f=>({...f,referenceRange:e.target.value}))} placeholder="e.g. 4.0 – 5.6" className="input-field"/></div>
          <div className="flex items-center gap-2"><input type="checkbox" checked={lForm.isAbnormal} onChange={e=>setLForm(f=>({...f,isAbnormal:e.target.checked}))} className="w-4 h-4 accent-red-500"/><label className="text-slate-400 text-sm">Flag as abnormal</label></div>
          <div><label className="label">Remarks</label><textarea value={lForm.remarks} onChange={e=>setLForm(f=>({...f,remarks:e.target.value}))} rows={2} className="input-field resize-none"/></div>
          <button onClick={()=>addLab.mutate()} disabled={addLab.isPending||!lForm.testName} className="btn-primary w-full justify-center disabled:opacity-50">{addLab.isPending?'Saving...':'Save Lab Result'}</button>
        </div>
      </SlidePanel>

      {/* Assign Doctor - LIVE DROPDOWN */}
      <SlidePanel open={assignPanel} onClose={()=>setAssignPanel(false)} title="Assign Doctor">
        <div className="space-y-4">
          <div>
            <label className="label">Select Doctor *</label>
            <select value={assignDoc} onChange={e=>setAssignDoc(e.target.value)} className="input-field">
              <option value="">— Choose an available doctor —</option>
              {availDoctors.map(d=>(
                <option key={d.id} value={d.id}>{d.fullName} · {d.role.replace('DOCTOR_','')} · {d.department||'General'}</option>
              ))}
            </select>
            {availDoctors.length===0&&<p className="text-slate-500 text-xs mt-1">No available doctors found</p>}
          </div>
          {assignDoc&&(()=>{
            const doc=availDoctors.find(d=>d.id===assignDoc)
            if(!doc) return null
            return (
              <div className="p-3 rounded-lg bg-teal-500/10 border border-teal-500/20">
                <p className="text-teal-400 text-xs font-medium mb-1">Selected Doctor</p>
                <p className="text-slate-200 text-sm font-semibold">{doc.fullName}</p>
                <p className="text-slate-400 text-xs">{doc.specialization||'General'} · {doc.experienceYears}y exp</p>
              </div>
            )
          })()}
          <div>
            <label className="label">Assignment Role *</label>
            <select value={assignRole} onChange={e=>setAssignRole(e.target.value)} className="input-field">
              <option value="">— Choose role —</option>
              {['DOCTOR_GENERAL','DOCTOR_SPECIALIST','DOCTOR_SUPER_SPECIALIST','DOCTOR_SURGEON','DOCTOR_ANAESTHETIST'].map(r=>(
                <option key={r} value={r}>{r.replace('DOCTOR_','')}</option>
              ))}
            </select>
          </div>
          <div><label className="label">Reason for Assignment</label><textarea value={assignReason} onChange={e=>setAssignReason(e.target.value)} rows={2} className="input-field resize-none" placeholder="Why is this doctor being assigned?"/></div>
          <button onClick={()=>doAssign.mutate()} disabled={doAssign.isPending||!assignDoc||!assignRole} className="btn-primary w-full justify-center disabled:opacity-50">{doAssign.isPending?'Assigning...':'Assign Doctor'}</button>
        </div>
      </SlidePanel>

      {/* Discharge */}
      <SlidePanel open={dischargePanel} onClose={()=>setDischargePanel(false)} title="Create Discharge Summary" width="max-w-xl">
        <div className="space-y-4">
          <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20"><p className="text-amber-400 text-xs font-medium">⚠ Submitting will mark this patient as DISCHARGED.</p></div>
          <div><label className="label">Final Diagnosis *</label><input value={disForm.finalDiagnosis} onChange={e=>setDisForm(f=>({...f,finalDiagnosis:e.target.value}))} placeholder="Primary diagnosis at discharge" className="input-field"/></div>
          <div><label className="label">Hospital Course</label><textarea value={disForm.hospitalCourse} onChange={e=>setDisForm(f=>({...f,hospitalCourse:e.target.value}))} rows={3} className="input-field resize-none" placeholder="Summary of hospital stay and treatments..."/></div>
          <div><label className="label">Procedures Performed</label><input value={disForm.proceduresPerformed} onChange={e=>setDisForm(f=>({...f,proceduresPerformed:e.target.value}))} placeholder="e.g. Appendectomy" className="input-field"/></div>
          <div><label className="label">Condition at Discharge</label><select value={disForm.conditionAtDischarge} onChange={e=>setDisForm(f=>({...f,conditionAtDischarge:e.target.value}))} className="input-field"><option value="">— Select —</option>{['Stable','Improved','Recovered','Critical but stable','Against medical advice'].map(c=><option key={c} value={c}>{c}</option>)}</select></div>
          <div><label className="label">Discharge Medications</label><textarea value={disForm.dischargeMedications} onChange={e=>setDisForm(f=>({...f,dischargeMedications:e.target.value}))} rows={3} className="input-field resize-none" placeholder="List medications to be continued at home..."/></div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="label">Follow-up Date</label><input type="date" value={disForm.followUpDate} onChange={e=>setDisForm(f=>({...f,followUpDate:e.target.value}))} className="input-field"/></div>
            <div><label className="label">Activity Restrictions</label><input value={disForm.activityRestrictions} onChange={e=>setDisForm(f=>({...f,activityRestrictions:e.target.value}))} placeholder="e.g. Bed rest 2 weeks" className="input-field"/></div>
          </div>
          <div><label className="label">Follow-up Instructions</label><textarea value={disForm.followUpInstructions} onChange={e=>setDisForm(f=>({...f,followUpInstructions:e.target.value}))} rows={2} className="input-field resize-none" placeholder="e.g. OPD review in 2 weeks, repeat labs"/></div>
          <div><label className="label">Diet Advice</label><input value={disForm.dietAdvice} onChange={e=>setDisForm(f=>({...f,dietAdvice:e.target.value}))} placeholder="e.g. Low sodium diet" className="input-field"/></div>
          <button onClick={()=>doDischarge.mutate()} disabled={doDischarge.isPending||!disForm.finalDiagnosis} className="btn-primary w-full justify-center disabled:opacity-50">{doDischarge.isPending?'Saving...':'Submit Discharge Summary'}</button>
        </div>
      </SlidePanel>
    </div>
  )
}
