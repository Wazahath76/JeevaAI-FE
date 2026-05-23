'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuthStore } from '@/store/authStore'
import { authService } from '@/services/auth.service'
import { FieldError } from '@/components/ui'
import { Eye, EyeOff, Zap, Activity, Shield, Lock, Mail, AlertCircle } from 'lucide-react'

export default function LoginPage() {
  const router = useRouter()
  const { setAuth } = useAuthStore()
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [errors, setErrors]     = useState({})
  const [serverError, setServerError] = useState('')
  const [loading, setLoading]   = useState(false)

  const validate = () => {
    const e = {}
    if (!email.trim())                                   e.email    = 'Email is required'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) e.email    = 'Enter a valid email address'
    if (!password)                                       e.password = 'Password is required'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSubmit = async ev => {
    ev.preventDefault()
    if (!validate()) return
    setLoading(true); setServerError('')
    try {
      const res = await authService.login(email.trim().toLowerCase(), password)
      const { doctor, accessToken, refreshToken } = res.data.data
      setAuth(doctor, accessToken, refreshToken)
      router.push('/main/dashboard')
    } catch (err) {
      const status = err?.response?.status
      if (status === 401) setServerError('Invalid email or password. Please check your credentials.')
      else if (status === 403) setServerError('Your account is deactivated. Contact your administrator.')
      else setServerError('Something went wrong. Please try again.')
    } finally { setLoading(false) }
  }

  return (
    <div className="min-h-screen flex bg-navy-900">
      {/* Left panel */}
      <div className="hidden lg:flex flex-col w-1/2 bg-navy-800 border-r border-navy-500 relative overflow-hidden p-12">
        <div className="absolute inset-0 opacity-20" style={{ backgroundImage:'radial-gradient(circle at 1px 1px,#1E2A3E 1px,transparent 0)',backgroundSize:'32px 32px' }} />
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full bg-teal-500/6 blur-3xl" />
        <div className="relative z-10">
          {/* JeevaAI logo */}
          <div className="flex items-center gap-3 mb-16">
            <div className="w-10 h-10 rounded-xl bg-teal-500/20 border border-teal-500/40 flex items-center justify-center">
              <Zap size={20} className="text-teal-400" fill="currentColor" />
            </div>
            <div>
              <div className="flex items-center gap-1">
                <span className="font-bold text-white text-xl leading-none">Jeeva</span>
                <span className="font-bold text-teal-400 text-xl leading-none">AI</span>
              </div>
              <span className="text-slate-400 text-xs">Hospital Management System</span>
            </div>
          </div>
          <h1 className="text-4xl font-bold text-white leading-tight mb-4">
            Clinical Excellence<br />
            <span className="text-teal-400">Powered by AI</span>
          </h1>
          <p className="text-slate-400 text-lg leading-relaxed mb-12">
            A comprehensive platform for modern hospitals. Manage patients, treatments, and clinical insights — all in one place.
          </p>
          <div className="space-y-4">
            {[
              { icon: <Activity size={18} />, title:'Real-time Patient Monitoring',   desc:'Track vitals and clinical progress' },
              { icon: <Shield size={18} />,   title:'AI-Powered Recommendations',     desc:'Claude AI suggests treatment plans' },
              { icon: <Lock size={18} />,     title:'Secure & Role-Based Access',     desc:'Every doctor sees only what they need' },
            ].map(({ icon, title, desc }) => (
              <div key={title} className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-teal-500/10 text-teal-400 mt-0.5">{icon}</div>
                <div>
                  <p className="text-slate-200 font-medium text-sm">{title}</p>
                  <p className="text-slate-400 text-xs">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="relative z-10 mt-auto">
          <p className="text-slate-600 text-xs">© 2026 JeevaAI. All rights reserved.</p>
        </div>
      </div>

      {/* Right form */}
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-2 mb-8">
            <Zap size={20} className="text-teal-400" fill="currentColor" />
            <div className="flex items-center gap-1">
              <span className="font-bold text-xl text-slate-200">Jeeva</span>
              <span className="font-bold text-xl text-teal-400">AI</span>
            </div>
          </div>

          <h2 className="text-2xl font-bold text-slate-200 mb-1">Welcome back</h2>
          <p className="text-slate-400 text-sm mb-8">Sign in to your doctor account</p>
          <p className="text-slate-600 text-xs mb-4">Fields marked <span className="text-red-400">*</span> are required</p>

          {serverError && (
            <div className="flex items-start gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm mb-5">
              <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
              <span>{serverError}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            <div>
              <label className="label">Email Address <span className="text-red-400">*</span></label>
              <div className="relative">
                <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600" />
                <input value={email} onChange={e => { setEmail(e.target.value); if (errors.email) setErrors(v => ({ ...v, email: '' })) }}
                  type="email" placeholder="doctor@hospital.com"
                  className={`input-field pl-9 ${errors.email ? 'input-error' : ''}`} />
              </div>
              <FieldError message={errors.email} />
            </div>
            <div>
              <label className="label">Password <span className="text-red-400">*</span></label>
              <div className="relative">
                <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600" />
                <input value={password} onChange={e => { setPassword(e.target.value); if (errors.password) setErrors(v => ({ ...v, password: '' })) }}
                  type={showPass ? 'text' : 'password'} placeholder="Enter your password"
                  className={`input-field pl-9 pr-9 ${errors.password ? 'input-error' : ''}`} />
                <button type="button" onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-600 hover:text-slate-400">
                  {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
              <FieldError message={errors.password} />
            </div>
            <button type="submit" disabled={loading}
              className="btn-primary w-full justify-center py-2.5 disabled:opacity-60 disabled:cursor-not-allowed">
              {loading ? <><span className="w-4 h-4 border-2 border-navy-900/40 border-t-navy-900 rounded-full animate-spin" />Signing in...</> : 'Sign In'}
            </button>
          </form>

          <p className="text-center text-slate-400 text-sm mt-6">
            New to JeevaAI?{' '}
            <Link href="/auth/register" className="text-teal-400 hover:text-teal-300 font-medium">Create account</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
