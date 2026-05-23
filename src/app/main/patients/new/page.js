'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { patientService } from '@/services/patient.service'
import { PageHeader, showToast } from '@/components/ui'
import { calculateAge, cn } from '@/lib/utils'
import { ChevronLeft, ChevronRight, UserPlus } from 'lucide-react'

const BG = ['A_POS','A_NEG','B_POS','B_NEG','AB_POS','AB_NEG','O_POS','O_NEG','UNKNOWN']
const BGL = { A_POS:'A+',A_NEG:'A−',B_POS:'B+',B_NEG:'B−',AB_POS:'AB+',AB_NEG:'AB−',O_POS:'O+',O_NEG:'O−',UNKNOWN:'?' }
const STEPS = ['Demographics','Medical History','Admission','Insurance']

export default function NewPatientPage() {
  const router = useRouter()
  const [step, setStep]     = useState(1)
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    fullName:'', dateOfBirth:'', gender:'MALE', bloodGroup:'UNKNOWN',
    phone:'', email:'', address:'',
    emergencyContactName:'', emergencyContactPhone:'', emergencyContactRelation:'',
    knownAllergies:'', chronicConditions:'', familyHistory:'', pastSurgeries:'',
    status:'OPD', ward:'', bedNumber:'',
    insuranceProvider:'', insurancePolicyNo:'', notes:'',
  })

  const u = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const handleSubmit = async () => {
    setLoading(true)
    try {
      const res = await patientService.create(form)
      showToast('Patient admitted successfully', 'success')
      router.push(`/main/patients/${res.data.data.id}`)
    } catch (err) {
      showToast(err?.response?.data?.message || 'Failed to admit patient', 'error')
    } finally { setLoading(false) }
  }

  return (
    <div className="animate-fade-in max-w-2xl mx-auto">
      <PageHeader title="Admit New Patient" subtitle="Register a new patient in JeevaAI" />

      {/* Steps */}
      <div className="flex items-center mb-8">
        {STEPS.map((s, i) => (
          <div key={s} className="flex items-center flex-1">
            <div className="flex items-center gap-2">
              <div className={cn('w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all',
                i+1<step  ? 'bg-teal-500 border-teal-500 text-navy-900'
                :i+1===step? 'border-teal-500 text-teal-400 bg-teal-500/10'
                            :'border-navy-400 text-slate-600')}>
                {i+1<step?'✓':i+1}
              </div>
              <span className={cn('text-xs font-medium hidden sm:block', i+1===step?'text-teal-400':'text-slate-600')}>{s}</span>
            </div>
            {i<STEPS.length-1 && <div className={cn('flex-1 h-px mx-3 transition-all', i+1<step?'bg-teal-500':'bg-navy-500')} />}
          </div>
        ))}
      </div>

      <div className="card p-6">
        {/* Step 1 */}
        {step===1 && (
          <div className="space-y-4">
            <div><label className="label">Full Name *</label>
              <input value={form.fullName} onChange={e=>u('fullName',e.target.value)} placeholder="Patient's full name" className="input-field" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><label className="label">Date of Birth *</label>
                <input value={form.dateOfBirth} onChange={e=>u('dateOfBirth',e.target.value)} type="date" className="input-field" />
                {form.dateOfBirth && <p className="text-teal-400 text-xs mt-1">Age: {calculateAge(form.dateOfBirth)} years</p>}
              </div>
              <div><label className="label">Gender *</label>
                <select value={form.gender} onChange={e=>u('gender',e.target.value)} className="input-field">
                  <option value="MALE">Male</option><option value="FEMALE">Female</option><option value="OTHER">Other</option>
                </select>
              </div>
            </div>
            <div><label className="label">Blood Group</label>
              <div className="grid grid-cols-5 gap-2">
                {BG.map(bg=>(
                  <button key={bg} type="button" onClick={()=>u('bloodGroup',bg)}
                    className={cn('py-2 rounded-lg text-xs font-bold border transition-all mono',
                      form.bloodGroup===bg?'bg-red-500/20 border-red-500/50 text-red-400':'border-navy-500 text-slate-400 hover:border-navy-400')}>
                    {BGL[bg]}
                  </button>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><label className="label">Phone</label><input value={form.phone} onChange={e=>u('phone',e.target.value)} placeholder="Mobile number" className="input-field" /></div>
              <div><label className="label">Email</label><input value={form.email} onChange={e=>u('email',e.target.value)} type="email" placeholder="Email" className="input-field" /></div>
            </div>
            <div><label className="label">Address</label><textarea value={form.address} onChange={e=>u('address',e.target.value)} rows={2} className="input-field resize-none" /></div>
          </div>
        )}

        {/* Step 2 */}
        {step===2 && (
          <div className="space-y-4">
            <div className="p-3 rounded-lg bg-navy-600">
              <p className="text-xs text-slate-400 font-medium uppercase tracking-wide mb-3">Emergency Contact</p>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="label">Name</label><input value={form.emergencyContactName} onChange={e=>u('emergencyContactName',e.target.value)} placeholder="Contact name" className="input-field" /></div>
                <div><label className="label">Phone</label><input value={form.emergencyContactPhone} onChange={e=>u('emergencyContactPhone',e.target.value)} placeholder="Phone" className="input-field" /></div>
                <div><label className="label">Relation</label><input value={form.emergencyContactRelation} onChange={e=>u('emergencyContactRelation',e.target.value)} placeholder="e.g. Spouse" className="input-field" /></div>
              </div>
            </div>
            {[['knownAllergies','Known Allergies','e.g. Penicillin, Sulfa drugs'],['chronicConditions','Chronic Conditions','e.g. Hypertension, Diabetes'],['familyHistory','Family History','Relevant family medical history'],['pastSurgeries','Past Surgeries','Previous surgical procedures']].map(([k,l,p])=>(
              <div key={k}><label className="label">{l}</label><textarea value={form[k]} onChange={e=>u(k,e.target.value)} rows={2} placeholder={p} className="input-field resize-none" /></div>
            ))}
          </div>
        )}

        {/* Step 3 */}
        {step===3 && (
          <div className="space-y-4">
            <div><label className="label">Admission Status *</label>
              <div className="grid grid-cols-3 gap-2">
                {['OPD','IPD','CRITICAL'].map(s=>(
                  <button key={s} type="button" onClick={()=>u('status',s)}
                    className={cn('py-3 rounded-lg text-sm font-semibold border transition-all',
                      form.status===s
                        ? s==='CRITICAL'?'bg-red-500/20 border-red-500/50 text-red-400'
                          :s==='IPD'?'bg-teal-500/20 border-teal-500/50 text-teal-400'
                                    :'bg-blue-500/20 border-blue-500/50 text-blue-400'
                        :'border-navy-500 text-slate-400 hover:border-navy-400')}>
                    {s}
                  </button>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><label className="label">Ward</label><input value={form.ward} onChange={e=>u('ward',e.target.value)} placeholder="e.g. General Ward B" className="input-field" /></div>
              <div><label className="label">Bed Number</label><input value={form.bedNumber} onChange={e=>u('bedNumber',e.target.value)} placeholder="e.g. B-12" className="input-field mono" /></div>
            </div>
            <div><label className="label">Notes</label><textarea value={form.notes} onChange={e=>u('notes',e.target.value)} rows={3} className="input-field resize-none" /></div>
          </div>
        )}

        {/* Step 4 */}
        {step===4 && (
          <div className="space-y-4">
            <div className="p-4 rounded-lg bg-navy-600 space-y-4">
              <p className="text-xs text-slate-400 font-medium uppercase tracking-wide">Insurance (Optional)</p>
              <div><label className="label">Provider</label><input value={form.insuranceProvider} onChange={e=>u('insuranceProvider',e.target.value)} placeholder="e.g. Star Health" className="input-field" /></div>
              <div><label className="label">Policy Number</label><input value={form.insurancePolicyNo} onChange={e=>u('insurancePolicyNo',e.target.value)} placeholder="Policy number" className="input-field mono" /></div>
            </div>
            <div className="p-4 rounded-lg bg-teal-500/5 border border-teal-500/20">
              <p className="text-teal-400 text-xs font-semibold mb-3">Admission Summary</p>
              <div className="grid grid-cols-2 gap-2 text-xs">
                {[['Name',form.fullName],['DOB',form.dateOfBirth],['Gender',form.gender],['Blood',BGL[form.bloodGroup]],['Status',form.status],['Ward',form.ward||'—']].map(([k,v])=>(
                  <div key={k}><span className="text-slate-400">{k}: </span><span className="text-slate-200">{v}</span></div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Nav */}
        <div className="flex gap-3 mt-8">
          {step>1 && <button onClick={()=>setStep(s=>s-1)} className="btn-secondary"><ChevronLeft size={16} />Back</button>}
          <div className="flex-1" />
          {step<4
            ? <button onClick={()=>setStep(s=>s+1)} disabled={step===1&&!form.fullName} className="btn-primary disabled:opacity-50">Next<ChevronRight size={16} /></button>
            : <button onClick={handleSubmit} disabled={loading||!form.fullName||!form.dateOfBirth} className="btn-primary disabled:opacity-50">
                {loading?<span className="w-4 h-4 border-2 border-navy-900/40 border-t-navy-900 rounded-full animate-spin"/>:<><UserPlus size={16}/>Admit Patient</>}
              </button>
          }
        </div>
      </div>
    </div>
  )
}
