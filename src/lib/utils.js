import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { format, formatDistanceToNow, parseISO } from 'date-fns'

export function cn(...inputs) { return twMerge(clsx(inputs)) }

export function formatDate(date, fmt = 'dd MMM yyyy') {
  if (!date) return '—'
  try { return format(parseISO(date), fmt) } catch { return '—' }
}
export function formatDateTime(date) {
  if (!date) return '—'
  try { return format(parseISO(date), 'dd MMM yyyy, HH:mm') } catch { return '—' }
}
export function timeAgo(date) {
  if (!date) return '—'
  try { return formatDistanceToNow(parseISO(date), { addSuffix: true }) } catch { return '—' }
}
export function calculateAge(dob) {
  if (!dob) return 0
  const birth = new Date(dob)
  const today = new Date()
  let age = today.getFullYear() - birth.getFullYear()
  const m = today.getMonth() - birth.getMonth()
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--
  return age
}

export const statusColors = {
  OPD:        'bg-blue-500/20 text-blue-400 border-blue-500/30',
  IPD:        'bg-teal-500/20 text-teal-400 border-teal-500/30',
  CRITICAL:   'bg-red-500/20 text-red-400 border-red-500/30',
  DISCHARGED: 'bg-slate-500/20 text-slate-400 border-slate-500/30',
  DECEASED:   'bg-gray-500/20 text-gray-400 border-gray-500/30',
}
export const roleColors = {
  ADMIN:                   'bg-purple-500/20 text-purple-400',
  DOCTOR_GENERAL:          'bg-blue-500/20 text-blue-400',
  DOCTOR_SPECIALIST:       'bg-teal-500/20 text-teal-400',
  DOCTOR_SUPER_SPECIALIST: 'bg-amber-500/20 text-amber-400',
  DOCTOR_SURGEON:          'bg-red-500/20 text-red-400',
  DOCTOR_ANAESTHETIST:     'bg-indigo-500/20 text-indigo-400',
}
export const roleLabels = {
  ADMIN:                   'Admin',
  DOCTOR_GENERAL:          'General',
  DOCTOR_SPECIALIST:       'Specialist',
  DOCTOR_SUPER_SPECIALIST: 'Super Specialist',
  DOCTOR_SURGEON:          'Surgeon',
  DOCTOR_ANAESTHETIST:     'Anaesthetist',
}
export const bloodGroupLabel = {
  A_POS:'A+',A_NEG:'A−',B_POS:'B+',B_NEG:'B−',
  AB_POS:'AB+',AB_NEG:'AB−',O_POS:'O+',O_NEG:'O−',UNKNOWN:'?'
}
export const severityColors = {
  LOW:      'bg-green-500/20 text-green-400',
  MODERATE: 'bg-yellow-500/20 text-yellow-400',
  HIGH:     'bg-orange-500/20 text-orange-400',
  CRITICAL: 'bg-red-500/20 text-red-400',
}
export const recStatusColors = {
  PENDING_REVIEW: 'bg-amber-500/20 text-amber-400',
  APPROVED:       'bg-green-500/20 text-green-400',
  REJECTED:       'bg-red-500/20 text-red-400',
  MODIFIED:       'bg-blue-500/20 text-blue-400',
}

export function checkPassword(pwd) {
  return {
    length:    pwd.length >= 8,
    uppercase: /[A-Z]/.test(pwd),
    lowercase: /[a-z]/.test(pwd),
    digit:     /\d/.test(pwd),
    special:   /[@$!%*?&]/.test(pwd),
  }
}
export function getVitalsAlerts(vital) {
  if (!vital) return []
  const alerts = []
  if (vital.bloodPressureSystolic && vital.bloodPressureSystolic > 140) alerts.push('High BP')
  if (vital.spo2Percent && vital.spo2Percent < 95)                       alerts.push('Low SpO₂')
  if (vital.pulseBpm && vital.pulseBpm > 120)                            alerts.push('High Pulse')
  if (vital.temperatureCelsius && vital.temperatureCelsius > 38.5)       alerts.push('Fever')
  return alerts
}
