import { useState } from 'react'
import { useNavigate } from 'react-router'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { supabase } from '@/lib/supabase'
import { motion, AnimatePresence } from 'framer-motion'
import { Mail, Lock, ArrowRight, Loader2, MapPin, User, Shield } from 'lucide-react'

const authSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  full_name: z.string().optional(),
  role: z.enum(['FleetManager', 'Driver', 'SafetyOfficer', 'FinancialAnalyst']).optional(),
})

type AuthValues = z.infer<typeof authSchema>

export function LoginForm() {
  const navigate = useNavigate()
  const [isSignUp, setIsSignUp] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<AuthValues>({
    resolver: zodResolver(authSchema),
    defaultValues: { role: 'FleetManager' }
  })

  const onSubmit = async (data: AuthValues) => {
    try {
      setError(null)
      
      if (isSignUp) {
        if (!data.full_name) throw new Error("Full name is required for sign up")
        if (!data.role) throw new Error("Role is required for sign up")
        
        const { error: signUpError } = await supabase.auth.signUp({
          email: data.email,
          password: data.password,
          options: {
            data: {
              full_name: data.full_name,
              role: data.role
            }
          }
        })
        if (signUpError) throw signUpError
        // Automatically sign in after sign up since auto-confirm is enabled in local supabase
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: data.email,
          password: data.password,
        })
        if (signInError) throw signInError
      } else {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: data.email,
          password: data.password,
        })
        if (signInError) throw signInError
      }
      
      navigate('/dashboard')
    } catch (err: any) {
      setError(err.message || 'Authentication failed')
    }
  }

  return (
    <div className="min-h-screen w-full flex bg-[#030712] text-slate-50 selection:bg-indigo-500/30 overflow-hidden font-sans">
      <div className="absolute inset-0 z-0 flex items-center justify-center overflow-hidden pointer-events-none">
        <div className="absolute w-[800px] h-[800px] bg-indigo-600/20 rounded-full blur-[120px] -top-64 -left-64 animate-pulse duration-[4000ms]" />
        <div className="absolute w-[600px] h-[600px] bg-violet-600/20 rounded-full blur-[100px] bottom-0 right-0" />
      </div>

      <div className="relative z-10 w-full flex">
        <div className="hidden lg:flex w-1/2 p-12 flex-col justify-between border-r border-white/10 bg-white/5 backdrop-blur-3xl">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="flex items-center gap-3"
          >
            <div className="bg-gradient-to-br from-indigo-500 to-violet-600 p-2.5 rounded-xl shadow-lg shadow-indigo-500/20">
              <MapPin className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-bold tracking-tight text-white">TransitOps</span>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <h1 className="text-5xl font-extrabold tracking-tight mb-6 bg-gradient-to-br from-white to-slate-400 bg-clip-text text-transparent leading-tight">
              Enterprise Fleet<br />Management.
            </h1>
            <p className="text-lg text-slate-400 max-w-md font-medium leading-relaxed">
              Digitize your vehicle, driver, and dispatch operations in one centralized, high-performance platform.
            </p>
          </motion.div>

          <div className="flex items-center gap-4 text-sm text-slate-500 font-medium">
            <span>© 2026 Odoo Hackathon</span>
            <span className="w-1.5 h-1.5 rounded-full bg-slate-700" />
            <span>Team Alpha</span>
          </div>
        </div>

        <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12 overflow-y-auto custom-scrollbar">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="w-full max-w-md bg-slate-900/50 backdrop-blur-xl border border-white/10 p-8 rounded-3xl shadow-2xl"
          >
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold tracking-tight text-white mb-2">
                {isSignUp ? 'Create an account' : 'Welcome back'}
              </h2>
              <p className="text-slate-400">
                {isSignUp ? 'Enter your details to register' : 'Enter your credentials to access the dashboard'}
              </p>
            </div>

            {error && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }} 
                animate={{ opacity: 1, y: 0 }}
                className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm font-medium flex items-center gap-2"
              >
                <div className="w-1.5 h-1.5 rounded-full bg-red-400 shrink-0" />
                {error}
              </motion.div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              
              <AnimatePresence>
                {isSignUp && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="space-y-5 overflow-hidden"
                  >
                    <div className="space-y-2 relative">
                      <label className="text-sm font-medium text-slate-300 ml-1">Full Name</label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                          <User className="h-5 w-5 text-slate-500" />
                        </div>
                        <input
                          {...register('full_name')}
                          type="text"
                          className="w-full bg-slate-950/50 border border-white/10 rounded-xl pl-11 pr-4 py-3.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all"
                          placeholder="John Doe"
                        />
                      </div>
                      {errors.full_name && <p className="text-xs text-red-400 ml-1">{errors.full_name.message}</p>}
                    </div>

                    <div className="space-y-2 relative">
                      <label className="text-sm font-medium text-slate-300 ml-1">Professional Role</label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                          <Shield className="h-5 w-5 text-slate-500" />
                        </div>
                        <select
                          {...register('role')}
                          className="w-full bg-slate-950/50 border border-white/10 rounded-xl pl-11 pr-4 py-3.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all appearance-none"
                        >
                          <option value="FleetManager">Fleet Manager (Dispatcher)</option>
                          <option value="Driver">Driver</option>
                          <option value="SafetyOfficer">Safety Officer</option>
                          <option value="FinancialAnalyst">Financial Analyst</option>
                        </select>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="space-y-2 relative">
                <label className="text-sm font-medium text-slate-300 ml-1">Email Address</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-slate-500" />
                  </div>
                  <input
                    {...register('email')}
                    type="email"
                    className="w-full bg-slate-950/50 border border-white/10 rounded-xl pl-11 pr-4 py-3.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all"
                    placeholder="name@company.com"
                  />
                </div>
                {errors.email && <p className="text-xs text-red-400 ml-1">{errors.email.message}</p>}
              </div>

              <div className="space-y-2 relative">
                <label className="text-sm font-medium text-slate-300 ml-1">Password</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-slate-500" />
                  </div>
                  <input
                    {...register('password')}
                    type="password"
                    className="w-full bg-slate-950/50 border border-white/10 rounded-xl pl-11 pr-4 py-3.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all"
                    placeholder="••••••••"
                  />
                </div>
                {errors.password && <p className="text-xs text-red-400 ml-1">{errors.password.message}</p>}
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full group relative flex items-center justify-center gap-2 bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-400 hover:to-violet-500 text-white font-semibold py-3.5 px-4 rounded-xl shadow-lg shadow-indigo-500/25 transition-all duration-200 active:scale-[0.98] disabled:opacity-70 disabled:pointer-events-none mt-4"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    {isSignUp ? 'Creating Account...' : 'Authenticating...'}
                  </>
                ) : (
                  <>
                    {isSignUp ? 'Create Account' : 'Sign In'}
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </button>
            </form>
            
            <div className="mt-6 text-center">
              <button
                onClick={() => { setIsSignUp(!isSignUp); setError(null) }}
                className="text-sm font-medium text-slate-400 hover:text-white transition-colors"
              >
                {isSignUp ? 'Already have an account? Sign in' : "Don't have an account? Sign up"}
              </button>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  )
}
