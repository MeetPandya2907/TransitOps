import { useState, useRef, KeyboardEvent, ClipboardEvent } from 'react'
import { useNavigate } from 'react-router'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { supabase } from '@/lib/supabase'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Mail, Lock, ArrowRight, Loader2, User, Shield,
  Eye, EyeOff, CheckCircle2, XCircle, MailCheck, RefreshCw
} from 'lucide-react'

// ─── Schemas ─────────────────────────────────────────────────────────────────
const loginSchema = z.object({
  email: z.string().email('Enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
})
const signupSchema = z.object({
  full_name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Enter a valid email address'),
  password: z.string()
    .min(8, 'At least 8 characters')
    .regex(/[A-Z]/, 'Must contain an uppercase letter')
    .regex(/[0-9]/, 'Must contain a number'),
  role: z.enum(['FleetManager', 'Driver', 'SafetyOfficer', 'FinancialAnalyst']),
})

type LoginValues = z.infer<typeof loginSchema>
type SignupValues = z.infer<typeof signupSchema>

// ─── Shared Helpers ───────────────────────────────────────────────────────────
function AuthInput({ icon: Icon, error, rightElement, ...props }: any) {
  return (
    <div>
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
          <Icon className="h-4 w-4 text-slate-500" />
        </div>
        <input
          {...props}
          className={`w-full bg-[#0d1424] border rounded-xl pl-11 pr-10 py-3 text-sm text-white placeholder-slate-600 focus:outline-none transition-all ${error
              ? 'border-red-500/50 focus:border-red-500/70 focus:ring-1 focus:ring-red-500/20'
              : 'border-white/10 focus:border-indigo-500/60 focus:ring-1 focus:ring-indigo-500/20'
            }`}
        />
        {rightElement && (
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center">{rightElement}</div>
        )}
      </div>
      {error && <p className="mt-1.5 text-xs text-red-400 ml-1">{error}</p>}
    </div>
  )
}

function PasswordStrength({ password }: { password: string }) {
  const checks = [
    { label: 'At least 8 characters', ok: password.length >= 8 },
    { label: 'Contains uppercase letter', ok: /[A-Z]/.test(password) },
    { label: 'Contains a number', ok: /[0-9]/.test(password) },
  ]
  if (!password) return null
  return (
    <div className="mt-2 space-y-1">
      {checks.map(c => (
        <div key={c.label} className={`flex items-center gap-2 text-xs transition-colors ${c.ok ? 'text-emerald-400' : 'text-slate-600'}`}>
          {c.ok ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
          {c.label}
        </div>
      ))}
    </div>
  )
}

function ErrorAlert({ message }: { message: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-5 p-3.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-start gap-2.5"
    >
      <XCircle className="w-4 h-4 shrink-0 mt-0.5" />
      {message}
    </motion.div>
  )
}

// ─── OTP Input Component ──────────────────────────────────────────────────────
function OtpInput({ value, onChange }: { value: string[]; onChange: (v: string[]) => void }) {
  const refs = useRef<(HTMLInputElement | null)[]>([])

  const handleChange = (index: number, val: string) => {
    const digit = val.replace(/\D/g, '').slice(-1)
    const next = [...value]
    next[index] = digit
    onChange(next)
    if (digit && index < 5) {
      refs.current[index + 1]?.focus()
    }
  }

  const handleKeyDown = (index: number, e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      if (!value[index] && index > 0) {
        refs.current[index - 1]?.focus()
        const next = [...value]
        next[index - 1] = ''
        onChange(next)
      } else {
        const next = [...value]
        next[index] = ''
        onChange(next)
      }
    }
    if (e.key === 'ArrowLeft' && index > 0) refs.current[index - 1]?.focus()
    if (e.key === 'ArrowRight' && index < 5) refs.current[index + 1]?.focus()
  }

  const handlePaste = (e: ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault()
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
    const next = Array(6).fill('')
    pasted.split('').forEach((c, i) => { next[i] = c })
    onChange(next)
    // Focus the last filled box
    const lastIndex = Math.min(pasted.length, 5)
    refs.current[lastIndex]?.focus()
  }

  return (
    <div className="flex gap-3 justify-center">
      {Array(6).fill(null).map((_, i) => (
        <input
          key={i}
          ref={el => { refs.current[i] = el }}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={value[i] || ''}
          onChange={e => handleChange(i, e.target.value)}
          onKeyDown={e => handleKeyDown(i, e)}
          onPaste={handlePaste}
          className={`w-12 h-14 text-center text-xl font-bold rounded-xl border bg-[#0d1424] text-white transition-all outline-none focus:scale-105 ${value[i]
              ? 'border-indigo-500 bg-indigo-500/10 shadow-lg shadow-indigo-500/10'
              : 'border-white/10 focus:border-indigo-500/60 focus:ring-1 focus:ring-indigo-500/20'
            }`}
        />
      ))}
    </div>
  )
}

// ─── OTP Verification Screen ──────────────────────────────────────────────────
function OtpScreen({ email, onBack }: { email: string; onBack: () => void }) {
  const navigate = useNavigate()
  const [otp, setOtp] = useState(Array(6).fill(''))
  const [error, setError] = useState<string | null>(null)
  const [isVerifying, setIsVerifying] = useState(false)
  const [isResending, setIsResending] = useState(false)
  const [resendCooldown, setResendCooldown] = useState(0)

  const code = otp.join('')
  const isComplete = code.length === 6

  const verify = async () => {
    if (!isComplete) return
    setIsVerifying(true)
    setError(null)
    try {
      const { error } = await supabase.auth.verifyOtp({
        email,
        token: code,
        type: 'signup',
      })
      if (error) throw error
      navigate('/dashboard')
    } catch (err: any) {
      setError(err.message === 'Token has expired or is invalid'
        ? 'This code is invalid or has expired. Please request a new one.'
        : err.message || 'Verification failed. Please try again.')
      setOtp(Array(6).fill(''))
    } finally {
      setIsVerifying(false)
    }
  }

  // Auto-submit when all 6 digits entered
  const handleOtpChange = (v: string[]) => {
    setOtp(v)
    if (v.every(d => d !== '') && v.join('').length === 6) {
      setTimeout(() => {
        const code = v.join('')
        if (code.length === 6) {
          setIsVerifying(true)
          setError(null)
          supabase.auth.verifyOtp({ email, token: code, type: 'signup' })
            .then(({ error }) => {
              if (error) throw error
              navigate('/dashboard')
            })
            .catch((err: any) => {
              setError(err.message === 'Token has expired or is invalid'
                ? 'This code is invalid or has expired. Please request a new one.'
                : err.message || 'Verification failed.')
              setOtp(Array(6).fill(''))
            })
            .finally(() => setIsVerifying(false))
        }
      }, 100)
    }
  }

  const resendCode = async () => {
    setIsResending(true)
    setError(null)
    try {
      const { error } = await supabase.auth.resend({ type: 'signup', email })
      if (error) throw error
      // Start 60-second cooldown
      setResendCooldown(60)
      const timer = setInterval(() => {
        setResendCooldown(prev => {
          if (prev <= 1) { clearInterval(timer); return 0 }
          return prev - 1
        })
      }, 1000)
    } catch (err: any) {
      setError(err.message || 'Failed to resend code.')
    } finally {
      setIsResending(false)
    }
  }

  return (
    <motion.div
      key="otp"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
    >
      {/* Icon */}
      <div className="flex justify-center mb-6">
        <div className="w-16 h-16 bg-indigo-500/10 rounded-2xl flex items-center justify-center border border-indigo-500/20">
          <MailCheck className="w-8 h-8 text-indigo-400" />
        </div>
      </div>

      <div className="text-center mb-7">
        <h2 className="text-2xl font-bold text-white">Check your email</h2>
        <p className="text-slate-400 text-sm mt-2 leading-relaxed">
          We sent a 6-digit verification code to
        </p>
        <p className="text-indigo-400 font-semibold text-sm mt-1">{email}</p>
      </div>

      {error && <ErrorAlert message={error} />}

      {/* OTP Boxes */}
      <div className="mb-6">
        <OtpInput value={otp} onChange={handleOtpChange} />
      </div>

      {/* Verify Button */}
      <button
        onClick={verify}
        disabled={!isComplete || isVerifying}
        className="w-full flex items-center justify-center gap-2.5 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-semibold py-3 px-4 rounded-xl shadow-lg shadow-indigo-500/20 transition-all duration-200 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none"
      >
        {isVerifying ? (
          <><Loader2 className="w-4 h-4 animate-spin" /> Verifying...</>
        ) : (
          <><CheckCircle2 className="w-4 h-4" /> Verify & Sign In</>
        )}
      </button>

      {/* Resend + Back */}
      <div className="mt-5 flex items-center justify-between">
        <button
          onClick={onBack}
          className="text-sm text-slate-500 hover:text-slate-300 transition-colors"
        >
          ← Use different email
        </button>
        <button
          onClick={resendCode}
          disabled={isResending || resendCooldown > 0}
          className="flex items-center gap-1.5 text-sm font-semibold text-indigo-400 hover:text-indigo-300 transition-colors disabled:opacity-50 disabled:pointer-events-none"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isResending ? 'animate-spin' : ''}`} />
          {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend code'}
        </button>
      </div>
    </motion.div>
  )
}

// ─── Login Section ────────────────────────────────────────────────────────────
function LoginSection({ onSwitch }: { onSwitch: () => void }) {
  const navigate = useNavigate()
  const [error, setError] = useState<string | null>(null)
  const [showPassword, setShowPassword] = useState(false)

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
  })

  const onSubmit = async (data: LoginValues) => {
    try {
      setError(null)
      const { error: authError } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      })
      if (authError) throw authError
      navigate('/dashboard')
    } catch (err: any) {
      const msg = err.message || ''
      if (msg.includes('Invalid login credentials')) {
        setError('Incorrect email or password. Please try again.')
      } else if (msg.includes('Email not confirmed')) {
        setError('Please verify your email first. Check your inbox for the OTP code.')
      } else {
        setError(msg || 'Sign in failed. Please try again.')
      }
    }
  }

  return (
    <motion.div key="login" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.25 }}>
      <div className="mb-7">
        <h2 className="text-2xl font-bold text-white">Welcome back</h2>
        <p className="text-slate-400 text-sm mt-1">Sign in to your TransitOps account</p>
      </div>

      {error && <ErrorAlert message={error} />}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider ml-1 mb-1.5 block">Email Address</label>
          <AuthInput {...register('email')} icon={Mail} type="email" placeholder="you@company.com" error={errors.email?.message} />
        </div>
        <div>
          <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider ml-1 mb-1.5 block">Password</label>
          <AuthInput
            {...register('password')}
            icon={Lock}
            type={showPassword ? 'text' : 'password'}
            placeholder="••••••••"
            error={errors.password?.message}
            rightElement={
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="text-slate-500 hover:text-slate-300 transition-colors">
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            }
          />
        </div>
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-semibold py-3 rounded-xl shadow-lg shadow-indigo-500/20 transition-all active:scale-[0.98] disabled:opacity-60 disabled:pointer-events-none mt-2"
        >
          {isSubmitting ? <><Loader2 className="w-4 h-4 animate-spin" /> Signing in...</> : <>Sign In <ArrowRight className="w-4 h-4" /></>}
        </button>
      </form>
      <div className="mt-6 text-center">
        <span className="text-sm text-slate-500">New to TransitOps? </span>
        <button onClick={onSwitch} className="text-sm font-semibold text-indigo-400 hover:text-indigo-300 transition-colors">Create account</button>
      </div>
    </motion.div>
  )
}

// ─── Signup Section ───────────────────────────────────────────────────────────
function SignupSection({ onSwitch, onOtpSent }: { onSwitch: () => void; onOtpSent: (email: string) => void }) {
  const navigate = useNavigate()
  const [error, setError] = useState<string | null>(null)
  const [showPassword, setShowPassword] = useState(false)

  const { register, handleSubmit, watch, formState: { errors, isSubmitting } } = useForm<SignupValues>({
    resolver: zodResolver(signupSchema),
    defaultValues: { role: 'FleetManager' }
  })

  const password = watch('password', '')

  const onSubmit = async (data: SignupValues) => {
    try {
      setError(null)
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: { full_name: data.full_name, role: data.role }
        }
      })
      if (signUpError) throw signUpError

      // If email confirmation is DISABLED in Supabase, the session is returned immediately
      // In that case, skip OTP and go straight to dashboard
      if (signUpData.session) {
        navigate('/dashboard')
        return
      }

      // Email confirmation is ENABLED — show OTP screen
      onOtpSent(data.email)
    } catch (err: any) {
      const msg = err.message || ''
      if (msg.includes('already registered') || msg.includes('User already registered')) {
        setError('An account with this email already exists. Please sign in instead.')
      } else if (msg.includes('rate limit') || msg.includes('too many requests')) {
        setError('Too many sign up attempts. Please wait a few minutes and try again.')
      } else {
        setError(msg || 'Failed to create account. Please try again.')
      }
    }
  }

  return (
    <motion.div key="signup" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} transition={{ duration: 0.25 }}>
      <div className="mb-7">
        <h2 className="text-2xl font-bold text-white">Create account</h2>
        <p className="text-slate-400 text-sm mt-1">Join your team on TransitOps</p>
      </div>

      {error && <ErrorAlert message={error} />}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider ml-1 mb-1.5 block">Full Name</label>
          <AuthInput {...register('full_name')} icon={User} type="text" placeholder="John Smith" error={errors.full_name?.message} />
        </div>
        <div>
          <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider ml-1 mb-1.5 block">Email Address</label>
          <AuthInput {...register('email')} icon={Mail} type="email" placeholder="you@company.com" error={errors.email?.message} />
        </div>
        <div>
          <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider ml-1 mb-1.5 block">Professional Role</label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Shield className="h-4 w-4 text-slate-500" />
            </div>
            <select {...register('role')} className="w-full bg-[#0d1424] border border-white/10 rounded-xl pl-11 pr-4 py-3 text-sm text-white focus:outline-none focus:border-indigo-500/60 focus:ring-1 focus:ring-indigo-500/20 transition-all appearance-none">
              <option value="FleetManager">🚛 Fleet Manager</option>
              <option value="Driver">🧑‍✈️ Driver</option>
              <option value="SafetyOfficer">🛡️ Safety Officer</option>
              <option value="FinancialAnalyst">📊 Financial Analyst</option>
            </select>
          </div>
        </div>
        <div>
          <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider ml-1 mb-1.5 block">Password</label>
          <AuthInput
            {...register('password')}
            icon={Lock}
            type={showPassword ? 'text' : 'password'}
            placeholder="Min. 8 chars, 1 uppercase, 1 number"
            error={errors.password?.message}
            rightElement={
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="text-slate-500 hover:text-slate-300 transition-colors">
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            }
          />
          <PasswordStrength password={password} />
        </div>
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-semibold py-3 rounded-xl shadow-lg shadow-indigo-500/20 transition-all active:scale-[0.98] disabled:opacity-60 disabled:pointer-events-none mt-2"
        >
          {isSubmitting ? <><Loader2 className="w-4 h-4 animate-spin" /> Sending code...</> : <>Create Account & Get Code <ArrowRight className="w-4 h-4" /></>}
        </button>
      </form>
      <div className="mt-6 text-center">
        <span className="text-sm text-slate-500">Already have an account? </span>
        <button onClick={onSwitch} className="text-sm font-semibold text-indigo-400 hover:text-indigo-300 transition-colors">Sign in</button>
      </div>
    </motion.div>
  )
}

// ─── Main Export ──────────────────────────────────────────────────────────────
export function LoginForm() {
  const [mode, setMode] = useState<'login' | 'signup' | 'otp'>('login')
  const [otpEmail, setOtpEmail] = useState('')

  const handleOtpSent = (email: string) => {
    setOtpEmail(email)
    setMode('otp')
  }

  return (
    <div className="min-h-screen w-full flex bg-[#030a1a] text-slate-50 overflow-hidden font-sans">
      {/* Ambient glows */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute w-[700px] h-[700px] bg-indigo-600/15 rounded-full blur-[140px] -top-48 -left-48" />
        <div className="absolute w-[500px] h-[500px] bg-violet-600/15 rounded-full blur-[120px] bottom-0 right-0" />
        <div className="absolute w-[300px] h-[300px] bg-blue-600/10 rounded-full blur-[80px] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
      </div>

      <div className="relative z-10 w-full flex">
        {/* Left branding panel */}
        <div className="hidden lg:flex w-1/2 p-14 flex-col justify-between border-r border-white/[0.07]">
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/30">
              <span className="text-white font-black text-lg">T</span>
            </div>
            <span className="text-2xl font-extrabold tracking-tight text-white">TransitOps</span>
          </motion.div>

          <motion.div initial={{ opacity: 0, x: -24 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.7, delay: 0.15 }}>
            <p className="text-xs font-semibold uppercase tracking-widest text-indigo-400 mb-4">Enterprise Fleet Management</p>
            <h1 className="text-5xl font-black tracking-tight mb-6 text-white leading-[1.1]">
              Manage your entire fleet from one place.
            </h1>
            <p className="text-slate-400 text-base leading-relaxed max-w-sm">
              Dispatch vehicles, track drivers, manage trips, monitor maintenance, and analyze costs — all in real time.
            </p>
            <div className="mt-10 grid grid-cols-2 gap-4">
              {[
                { num: '99.9%', label: 'Uptime SLA' },
                { num: '< 2s', label: 'Avg. Response' },
                { num: 'RBAC', label: 'Role Security' },
                { num: 'OTP', label: 'Secure Auth' },
              ].map(s => (
                <div key={s.label} className="bg-white/[0.04] border border-white/[0.08] rounded-xl p-4">
                  <div className="text-xl font-black text-white">{s.num}</div>
                  <div className="text-xs text-slate-500 mt-0.5">{s.label}</div>
                </div>
              ))}
            </div>
          </motion.div>
          <p className="text-xs text-slate-600">© 2026 TransitOps · Odoo Hackathon</p>
        </div>

        {/* Right form panel */}
        <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12 overflow-y-auto">
          <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.4 }} className="w-full max-w-md">

            {/* Tab switcher — hidden during OTP */}
            {mode !== 'otp' && (
              <div className="flex bg-white/[0.05] border border-white/[0.08] rounded-2xl p-1 mb-8">
                {(['login', 'signup'] as const).map(m => (
                  <button
                    key={m}
                    onClick={() => setMode(m)}
                    className={`flex-1 py-2.5 text-sm font-semibold rounded-xl transition-all ${mode === m
                        ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20'
                        : 'text-slate-400 hover:text-white'
                      }`}
                  >
                    {m === 'login' ? 'Sign In' : 'Sign Up'}
                  </button>
                ))}
              </div>
            )}

            {/* Animated form content */}
            <AnimatePresence mode="wait">
              {mode === 'login' && (
                <LoginSection key="login" onSwitch={() => setMode('signup')} />
              )}
              {mode === 'signup' && (
                <SignupSection key="signup" onSwitch={() => setMode('login')} onOtpSent={handleOtpSent} />
              )}
              {mode === 'otp' && (
                <OtpScreen key="otp" email={otpEmail} onBack={() => setMode('signup')} />
              )}
            </AnimatePresence>

          </motion.div>
        </div>
      </div>
    </div>
  )
}
