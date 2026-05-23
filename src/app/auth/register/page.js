'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuthStore } from '@/store/authStore'
import { authService } from '@/services/auth.service'
import { PasswordStrength, FieldError } from '@/components/ui'
import { Zap, Eye, EyeOff, ChevronRight, ChevronLeft, AlertCircle } from 'lucide-react'

const ROLES = [
  { value:'DOCTOR_GENERAL',          label:'General Doctor'   },
  { value:'DOCTOR_SPECIALIST',        label:'Specialist'       },
  { value:'DOCTOR_SUPER_SPECIALIST',  label:'Super Specialist' },
  { value:'DOCTOR_SURGEON',           label:'Surgeon'          },
  { value:'DOCTOR_ANAESTHETIST',      label:'Anaesthetist'     },
  { value:'ADMIN',                    label:'Admin'            },
]

const STEPS = ['Personal', 'Professional', 'Credentials']

export default function RegisterPage() {
  const router = useRouter()
  const { setAuth } = useAuthStore()
  const [step, setStep]           = useState(1)
  const [loading, setLoading]     = useState(false)
  const [serverError, setServerError] = useState('')
  const [fieldErrors, setFieldErrors] = useState({})
  const [showPass, setShowPass]   = useState(false)
  const [form, setForm] = useState({
    fullName:'', email:'', password:'', phone:'',
    role:'DOCTOR_GENERAL', specialization:'', department:'', experienceYears:'',
    licenseNumber:'', qualification:'',
  })

  const u = (k, v) => { setForm(f => ({ ...f, [k]: v })); setFieldErrors(e => ({ ...e, [k]: '' })) }

  const validate = s => {
    const e = {}
    if (s === 1) {
      if (!form.fullName.trim())   e.fullName = 'Full name is required'
      if (!form.email.trim())      e.email    = 'Email is required'
      else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'Enter a valid email'
      if (!form.password)          e.password = 'Password is required'
      else {
        const c = { length:form.password.length>=8, upper:/[A-Z]/.test(form.password), lower:/[a-z]/.test(form.password), digit:/\d/.test(form.password), special:/[@$!%*?&]/.test(form.password) }
        if (!Object.values(c).every(Boolean)) e.password = 'Password must meet all requirements below'
      }
    }
    if (s === 3) {
      if (!form.licenseNumber.trim()) e.licenseNumber = 'Medical license number is required'
    }
    setFieldErrors(e)
    return Object.keys(e).length === 0
  }

  const next = () => { if (validate(step)) setStep(s => s + 1) }

  const handleSubmit = async () => {
    if (!validate(3)) return
    setLoading(true); setServerError('')
    try {
      const res = await authService.register({ ...form, experienceYears: form.experienceYears ? parseInt(form.experienceYears) : 0 })
      const { doctor, accessToken, refreshToken } = res.data.data
      setAuth(doctor, accessToken, refreshToken)
      router.push('/main/dashboard')
    } catch (err) {
      const msg = err?.response?.data?.message || ''
      if (msg.toLowerCase().includes('email'))   setServerError('This email is already registered.')
      else if (msg.toLowerCase().includes('license')) setServerError('This license number is already registered.')
      else if (msg.toLowerCase().includes('password')) setServerError('Password does not meet security requirements.')
      else setServerError(msg || 'Registration failed. Please try again.')
    } finally { setLoading(false) }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-navy-900 px-4 py-12">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex items-center gap-2 mb-8 justify-center">
          <div className="w-9 h-9 rounded-xl bg-teal-500/20 border border-teal-500/40 flex items-center justify-center">
            <Zap size={18} className="text-teal-400" fill="currentColor" />
          </div>
          <div className="flex items-center gap-1">
            <span className="font-bold text-xl text-slate-200">Jeeva</span>
            <span className="font-bold text-xl text-teal-400">AI</span>
          </div>
        </div>

        <div className="card p-8">
          <h2 className="text-xl font-bold text-slate-200 mb-1">Create your account</h2>
          <p className="text-slate-400 text-sm mb-1">Join the JeevaAI platform</p>
          <p className="text-slate-600 text-xs mb-6">Fields marked <span className="text-red-400">*</span> are required</p>

          {/* Step indicator */}
          <div className="flex items-center mb-8">
            {STEPS.map((s, i) => (
              <div key={s} className="flex items-center flex-1">
                <div className="flex items-center gap-2">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all ${
                    i + 1 < step  ? 'bg-teal-500 border-teal-500 text-navy-900'
                    : i + 1 === step ? 'border-teal-500 text-teal-400 bg-teal-500/10'
                    : 'border-navy-400 text-slate-600'}`}>
                    {i + 1 < step ? '✓' : i + 1}
                  </div>
                  <span className={`text-xs font-medium hidden sm:block ${i + 1 === step ? 'text-teal-400' : 'text-slate-600'}`}>{s}</span>
                </div>
                {i < STEPS.length - 1 && <div className={`flex-1 h-px mx-2 ${i + 1 < step ? 'bg-teal-500' : 'bg-navy-500'}`} />}
              </div>
            ))}
          </div>

          {serverError && (
            <div className="flex items-start gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm mb-5">
              <AlertCircle size={15} className="flex-shrink-0 mt-0.5" />{serverError}
            </div>
          )}

          {/* Step 1 */}
          {step === 1 && (
            <div className="space-y-4">
              <div>
                <label className="label">Full Name <span className="text-red-400">*</span></label>
                <input value={form.fullName} onChange={e => u('fullName', e.target.value)} placeholder="Dr. John Smith"
                  className={`input-field ${fieldErrors.fullName ? 'input-error' : ''}`} />
                <FieldError message={fieldErrors.fullName} />
              </div>
              <div>
                <label className="label">Email Address <span className="text-red-400">*</span></label>
                <input value={form.email} onChange={e => u('email', e.target.value)} type="email" placeholder="doctor@hospital.com"
                  className={`input-field ${fieldErrors.email ? 'input-error' : ''}`} />
                <FieldError message={fieldErrors.email} />
              </div>
              <div>
                <label className="label">Password <span className="text-red-400">*</span></label>
                <div className="relative">
                  <input value={form.password} onChange={e => u('password', e.target.value)} type={showPass ? 'text' : 'password'}
                    placeholder="Min 8 chars with uppercase, digit & symbol"
                    className={`input-field pr-9 ${fieldErrors.password ? 'input-error' : form.password && !fieldErrors.password ? 'border-green-500/40' : ''}`} />
                  <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-600 hover:text-slate-400">
                    {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
                <FieldError message={fieldErrors.password} />
                <PasswordStrength password={form.password} />
              </div>
              <div>
                <label className="label">Phone (optional)</label>
                <input value={form.phone} onChange={e => u('phone', e.target.value)} placeholder="+91 98765 43210" className="input-field" />
              </div>
            </div>
          )}

          {/* Step 2 */}
          {step === 2 && (
            <div className="space-y-4">
              <div>
                <label className="label">Role <span className="text-red-400">*</span></label>
                <select value={form.role} onChange={e => u('role', e.target.value)} className="input-field">
                  {ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Specialization</label>
                <input value={form.specialization} onChange={e => u('specialization', e.target.value)} placeholder="e.g. Cardiology, Neurology" className="input-field" />
              </div>
              <div>
                <label className="label">Department</label>
                <input value={form.department} onChange={e => u('department', e.target.value)} placeholder="e.g. OPD, ICU, Surgery" className="input-field" />
              </div>
              <div>
                <label className="label">Years of Experience</label>
                <input value={form.experienceYears} onChange={e => u('experienceYears', e.target.value)} type="number" min="0" placeholder="0" className="input-field" />
              </div>
            </div>
          )}

          {/* Step 3 */}
          {step === 3 && (
            <div className="space-y-4">
              <div>
                <label className="label">Medical License Number <span className="text-red-400">*</span></label>
                <input value={form.licenseNumber} onChange={e => u('licenseNumber', e.target.value)} placeholder="e.g. MED-001-2024"
                  className={`input-field mono ${fieldErrors.licenseNumber ? 'input-error' : ''}`} />
                <FieldError message={fieldErrors.licenseNumber} />
                <p className="text-slate-600 text-xs mt-1">Your official medical council registration number</p>
              </div>
              <div>
                <label className="label">Qualification</label>
                <input value={form.qualification} onChange={e => u('qualification', e.target.value)} placeholder="e.g. MBBS, MD, MS, DNB" className="input-field" />
              </div>
              {/* Review box */}
              <div className="p-4 rounded-lg bg-teal-500/5 border border-teal-500/20">
                <p className="text-teal-400 text-xs font-semibold mb-3 uppercase tracking-wide">Review before submitting</p>
                <div className="grid grid-cols-2 gap-y-2 gap-x-4 text-xs">
                  {[['Name',form.fullName],['Email',form.email],['Role',form.role.replace('DOCTOR_','')],['Dept',form.department||'—'],['License',form.licenseNumber||'—'],['Exp',form.experienceYears?`${form.experienceYears}y`:'—']].map(([k,v])=>(
                    <div key={k}><span className="text-slate-400">{k}: </span><span className="text-slate-200">{v}</span></div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="flex gap-3 mt-8">
            {step > 1 && <button onClick={() => setStep(s => s - 1)} className="btn-secondary"><ChevronLeft size={16} />Back</button>}
            <div className="flex-1" />
            {step < 3
              ? <button onClick={next} className="btn-primary">Next<ChevronRight size={16} /></button>
              : <button onClick={handleSubmit} disabled={loading} className="btn-primary disabled:opacity-60">
                  {loading ? <span className="w-4 h-4 border-2 border-navy-900/40 border-t-navy-900 rounded-full animate-spin" /> : 'Create Account'}
                </button>
            }
          </div>
        </div>

        <p className="text-center text-slate-400 text-sm mt-6">
          Already have an account?{' '}
          <Link href="/auth/login" className="text-teal-400 hover:text-teal-300 font-medium">Sign in</Link>
        </p>
      </div>
    </div>
  )
}
