import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import type { Role } from '@/contexts/AuthContext';
import { 
  Truck, User, Shield, BarChart2, 
  Mail, Lock, Eye, EyeOff, Users, 
  ChevronDown, LogIn, ShieldCheck,
  AlertCircle
} from 'lucide-react';
import { toast } from 'sonner';
import { createClient } from '@/lib/supabase/client';

export default function AuthPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [role, setRole] = useState<Role>('Fleet Manager');
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  
  const { login } = useAuth();
  const navigate = useNavigate();
  const supabase = createClient();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    if (!email || !password) {
      setError('Invalid credentials. Please enter email and password.');
      setIsSubmitting(false);
      return;
    }
    
    try {
      if (isSignUp) {
        // Sign Up Flow
        const { data, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              role: role,
              first_name: firstName,
              last_name: lastName
            }
          }
        });
        
        if (signUpError) {
          if (signUpError.message.toLowerCase().includes('rate limit')) {
             // Let the user know exactly what to do!
             toast.error('Supabase Email Rate Limit hit. Please disable Email Confirmations in your Supabase Auth Providers settings, or try again later.', { duration: 8000 });
             setIsSubmitting(false);
             return;
          }
          throw signUpError;
        }
        
        if (data.session) {
           // Auto login if email confirmation is disabled
           login(email, role);
           toast.success(`Welcome to TransitOps, ${role}!`);
           navigate('/dashboard');
        } else {
           toast.error(
             'ACTION REQUIRED: Supabase is blocking your login! You MUST go to your Supabase Dashboard -> Authentication -> Providers -> Email and turn OFF "Confirm Email" to login instantly.',
             { duration: 15000 }
           );
           setIsSignUp(false);
           setPassword('');
        }
        return; // Stop here for sign up
      } else {
        // Sign In Flow
        const { data, error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        
        if (signInError) throw signInError;
        
        // Success
        const metadataRole = data.session?.user.user_metadata?.role as Role || 'Fleet Manager';
        login(email, metadataRole);
        toast.success(`Welcome back, ${metadataRole}!`);
        
        switch (metadataRole) {
          case 'Fleet Manager': navigate('/vehicles'); break;
          case 'Driver': navigate('/dashboard'); break;
          case 'Safety Officer': navigate('/dashboard'); break;
          case 'Financial Analyst': navigate('/fuel'); break;
          default: navigate('/dashboard');
        }
      }
    } catch (err: any) {
      setError(err.message || 'Authentication failed. Please check your credentials.');
      toast.error('Authentication failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex w-full font-sans bg-[#030712] text-slate-200 selection:bg-blue-500/30">
      
      {/* Left Panel - Dark & Visual */}
      <div className="hidden lg:flex w-1/2 flex-col relative overflow-hidden border-r border-blue-900/30">
        
        {/* Background glow and map pattern (simulated with radial gradients) */}
        <div className="absolute inset-0 bg-[#030712] z-0"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(14,165,233,0.03)_0%,transparent_100%)] z-0"></div>
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-20 z-0 mix-blend-screen"></div>
        
        {/* Truck Image at bottom */}
        <div className="absolute bottom-0 left-0 right-0 h-1/2 z-0 pointer-events-none">
           <div className="absolute inset-0 bg-gradient-to-t from-[#030712] via-[#030712]/80 to-transparent z-10"></div>
           <div className="absolute inset-0 bg-gradient-to-r from-[#030712] via-transparent to-[#030712] z-10"></div>
           <img 
             src="/truck-bg.png" 
             alt="Semi Truck at night" 
             className="w-full h-full object-cover object-bottom opacity-50 mix-blend-screen"
           />
        </div>

        {/* Vertical glowing divider line */}
        <div className="absolute right-0 top-0 bottom-0 w-[1px] bg-gradient-to-b from-transparent via-blue-500/20 to-transparent z-20"></div>
        <div className="absolute right-[-4px] top-1/2 -translate-y-1/2 w-[9px] h-[40px] rounded-full bg-blue-500 blur-[8px] z-20"></div>
        <div className="absolute right-[-1px] top-1/2 -translate-y-1/2 w-[3px] h-[20px] rounded-full bg-blue-400 z-20 shadow-[0_0_15px_rgba(59,130,246,1)]"></div>

        <div className="relative z-10 p-12 lg:p-16 xl:p-20 flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center gap-3 mb-16">
             <div className="w-10 h-10 bg-[#0b84ff] rounded-xl flex items-center justify-center shadow-[0_0_20px_rgba(11,132,255,0.3)]">
                <Truck className="w-6 h-6 text-white" strokeWidth={2.5} />
             </div>
             <div>
                <h1 className="text-2xl font-bold tracking-tight text-white leading-none mb-1">TransitOps</h1>
                <p className="text-[9px] uppercase tracking-widest text-slate-400 font-semibold">Smart Transport Operations Platform</p>
             </div>
          </div>

          <div className="max-w-md">
            <h2 className="text-4xl font-bold mb-1 tracking-tight text-white">One Platform.</h2>
            <h2 className="text-4xl font-bold mb-10 tracking-tight">
               <span className="text-[#0b84ff] italic">Four</span> <span className="text-white">Powerful Roles.</span>
            </h2>

            <div className="space-y-6">
              {/* Role 1 */}
              <div className="flex gap-4 group">
                 <div className="w-12 h-12 rounded-xl border border-slate-700/50 bg-slate-800/20 flex items-center justify-center shrink-0 group-hover:border-[#0b84ff]/50 group-hover:bg-[#0b84ff]/10 transition-colors">
                    <Truck className="w-5 h-5 text-slate-300 group-hover:text-[#0b84ff] transition-colors" />
                 </div>
                 <div>
                    <h3 className="text-sm font-bold text-white mb-1">Fleet Manager</h3>
                    <p className="text-xs text-slate-400 leading-relaxed">Oversees fleet assets, maintenance, lifecycle and operational efficiency.</p>
                 </div>
              </div>

              {/* Role 2 */}
              <div className="flex gap-4 group">
                 <div className="w-12 h-12 rounded-xl border border-slate-700/50 bg-slate-800/20 flex items-center justify-center shrink-0 group-hover:border-[#0b84ff]/50 group-hover:bg-[#0b84ff]/10 transition-colors">
                    <User className="w-5 h-5 text-slate-300 group-hover:text-[#0b84ff] transition-colors" />
                 </div>
                 <div>
                    <h3 className="text-sm font-bold text-white mb-1">Driver</h3>
                    <p className="text-xs text-slate-400 leading-relaxed">Creates trips, assigns vehicles and monitors active deliveries.</p>
                 </div>
              </div>

              {/* Role 3 */}
              <div className="flex gap-4 group">
                 <div className="w-12 h-12 rounded-xl border border-slate-700/50 bg-slate-800/20 flex items-center justify-center shrink-0 group-hover:border-[#0b84ff]/50 group-hover:bg-[#0b84ff]/10 transition-colors">
                    <Shield className="w-5 h-5 text-slate-300 group-hover:text-[#0b84ff] transition-colors" />
                 </div>
                 <div>
                    <h3 className="text-sm font-bold text-white mb-1">Safety Officer</h3>
                    <p className="text-xs text-slate-400 leading-relaxed">Ensures driver compliance, tracks license validity and monitors safety.</p>
                 </div>
              </div>

              {/* Role 4 */}
              <div className="flex gap-4 group">
                 <div className="w-12 h-12 rounded-xl border border-slate-700/50 bg-slate-800/20 flex items-center justify-center shrink-0 group-hover:border-[#0b84ff]/50 group-hover:bg-[#0b84ff]/10 transition-colors">
                    <BarChart2 className="w-5 h-5 text-slate-300 group-hover:text-[#0b84ff] transition-colors" />
                 </div>
                 <div>
                    <h3 className="text-sm font-bold text-white mb-1">Financial Analyst</h3>
                    <p className="text-xs text-slate-400 leading-relaxed">Reviews operational expenses, fuel consumption and performance.</p>
                 </div>
              </div>
            </div>
          </div>

          <div className="mt-auto pt-10 flex items-center gap-2 text-[10px] text-slate-500 uppercase tracking-widest font-semibold">
             <ShieldCheck className="w-4 h-4 text-[#0b84ff]" />
             TransitOps © 2026 • RBAC ENABLED
          </div>
        </div>
      </div>

      {/* Right Panel - Form */}
      <div className="flex-1 bg-[#0b0e14] flex flex-col justify-center items-center p-8 relative z-10">
        
        <div className="w-full max-w-[420px]">
           <div className="mb-8">
             <h2 className="text-[28px] font-bold text-white mb-2 tracking-tight">
               {isSignUp ? 'Create an account' : 'Welcome back!'}
             </h2>
             <p className="text-sm text-slate-400 font-medium">
               {isSignUp ? 'Enter your details to register for TransitOps' : 'Sign in to your account to continue'}
             </p>
           </div>

           <form onSubmit={handleSubmit} className="space-y-5">
              {/* First Name & Last Name (Sign Up Only) */}
              {isSignUp && (
                <div className="flex gap-4">
                  <div className="flex-1">
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">First Name</label>
                    <input 
                      type="text" 
                      value={firstName}
                      onChange={e => setFirstName(e.target.value)}
                      className="w-full bg-[#151923] border border-slate-700/50 rounded-xl px-4 py-3 text-white text-sm focus:border-[#0b84ff] focus:ring-1 focus:ring-[#0b84ff] focus:outline-none transition-all placeholder:text-slate-600 font-medium"
                      placeholder="John"
                      required
                    />
                  </div>
                  <div className="flex-1">
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Last Name</label>
                    <input 
                      type="text" 
                      value={lastName}
                      onChange={e => setLastName(e.target.value)}
                      className="w-full bg-[#151923] border border-slate-700/50 rounded-xl px-4 py-3 text-white text-sm focus:border-[#0b84ff] focus:ring-1 focus:ring-[#0b84ff] focus:outline-none transition-all placeholder:text-slate-600 font-medium"
                      placeholder="Doe"
                      required
                    />
                  </div>
                </div>
              )}

              {/* Email */}
              <div>
                 <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Email</label>
                 <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                       <Mail className="h-4 w-4 text-slate-500" />
                    </div>
                    <input 
                      type="email" 
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      className="w-full bg-[#151923] border border-slate-700/50 rounded-xl pl-10 pr-4 py-3 text-white text-sm focus:border-[#0b84ff] focus:ring-1 focus:ring-[#0b84ff] focus:outline-none transition-all placeholder:text-slate-600 font-medium"
                      placeholder="raven.k@transitops.in"
                      required
                    />
                 </div>
              </div>
              
              {/* Password */}
              <div>
                 <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Password</label>
                 <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                       <Lock className="h-4 w-4 text-slate-500" />
                    </div>
                    <input 
                      type={showPassword ? "text" : "password"} 
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      className="w-full bg-[#151923] border border-slate-700/50 rounded-xl pl-10 pr-10 py-3 text-white text-sm focus:border-[#0b84ff] focus:ring-1 focus:ring-[#0b84ff] focus:outline-none transition-all placeholder:text-slate-600 font-medium"
                      placeholder="••••••••"
                    />
                    <button 
                      type="button" 
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-500 hover:text-slate-300 transition-colors focus:outline-none"
                    >
                       {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                 </div>
              </div>

              {/* Role - Only show during sign up */}
              {isSignUp && (
                <div>
                   <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Role (RBAC)</label>
                   <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                         <Users className="h-4 w-4 text-slate-500" />
                      </div>
                      <select 
                        value={role}
                        onChange={(e) => setRole(e.target.value as Role)}
                        className="w-full bg-[#151923] border border-slate-700/50 rounded-xl pl-10 pr-10 py-3 text-white text-sm focus:border-[#0b84ff] focus:ring-1 focus:ring-[#0b84ff] focus:outline-none transition-all cursor-pointer appearance-none font-medium"
                      >
                         <option value="Fleet Manager">Fleet Manager</option>
                         <option value="Driver">Driver</option>
                         <option value="Safety Officer">Safety Officer</option>
                         <option value="Financial Analyst">Financial Analyst</option>
                      </select>
                      <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none">
                         <ChevronDown className="h-4 w-4 text-slate-500" />
                      </div>
                   </div>
                </div>
              )}

              <div className="flex items-center justify-between pt-1 pb-1">
                 <label className="flex items-center gap-2.5 cursor-pointer group">
                    <div className="relative flex items-center justify-center">
                       <input type="checkbox" className="peer appearance-none w-4 h-4 border border-slate-600 rounded bg-[#151923] checked:bg-[#0b84ff] checked:border-[#0b84ff] transition-colors cursor-pointer" defaultChecked />
                       <svg className="absolute w-2.5 h-2.5 text-white pointer-events-none opacity-0 peer-checked:opacity-100 transition-opacity" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M11.6666 3.5L5.24992 9.91667L2.33325 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                       </svg>
                    </div>
                    <span className="text-xs text-slate-400 font-medium group-hover:text-slate-300 transition-colors">Remember me</span>
                 </label>
                 <a href="#" className="text-xs text-[#0b84ff] font-medium hover:text-[#3b9eff] transition-colors">Forgot password?</a>
              </div>

              <button 
                type="submit" 
                disabled={isSubmitting}
                className="w-full bg-[#0b84ff] hover:bg-[#0070e0] disabled:bg-[#0b84ff]/50 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-xl flex items-center justify-center gap-2 transition-all active:scale-[0.98] shadow-[0_4px_20px_rgba(11,132,255,0.3)]"
              >
                 <LogIn className="w-4 h-4" />
                 {isSubmitting ? 'Authenticating...' : (isSignUp ? 'Sign Up' : 'Sign In')}
              </button>

              <div className="text-center mt-4">
                 <button 
                   type="button" 
                   onClick={() => { setIsSignUp(!isSignUp); setError(''); }}
                   className="text-xs text-slate-400 hover:text-white transition-colors"
                 >
                   {isSignUp ? 'Already have an account? Sign in' : "Don't have an account? Sign up"}
                 </button>
              </div>

              <div className="flex items-center gap-4 py-2">
                 <div className="h-px bg-slate-800 flex-1"></div>
                 <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">OR</span>
                 <div className="h-px bg-slate-800 flex-1"></div>
              </div>

              <button 
                type="button"
                className="w-full bg-[#151923] hover:bg-[#1e2330] border border-slate-700/50 text-white font-semibold py-3 rounded-xl flex items-center justify-center gap-3 transition-colors active:scale-[0.98]"
              >
                 <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M22.56 12.25C22.56 11.47 22.49 10.73 22.36 10H12V14.26H17.92C17.67 15.63 16.86 16.81 15.68 17.6V20.35H19.24C21.32 18.43 22.56 15.6 22.56 12.25Z" fill="#4285F4"/>
                    <path d="M12 23C14.97 23 17.46 22.02 19.24 20.35L15.68 17.6C14.72 18.25 13.46 18.66 12 18.66C9.17 18.66 6.78 16.75 5.92 14.17H2.26V17.01C4.06 20.59 7.74 23 12 23Z" fill="#34A853"/>
                    <path d="M5.92 14.17C5.7 13.51 5.58 12.77 5.58 12C5.58 11.23 5.7 10.49 5.92 9.83V6.99H2.26C1.52 8.47 1.1 10.18 1.1 12C1.1 13.82 1.52 15.53 2.26 17.01L5.92 14.17Z" fill="#FBBC05"/>
                    <path d="M12 5.34C13.62 5.34 15.07 5.9 16.21 6.98L19.32 3.87C17.45 2.12 14.97 1 12 1C7.74 1 4.06 3.41 2.26 6.99L5.92 9.83C6.78 7.25 9.17 5.34 12 5.34Z" fill="#EA4335"/>
                 </svg>
                 Sign in with Google
              </button>
           </form>

           {error && (
              <div className="absolute right-8 top-1/3 border border-red-900/50 bg-red-950/40 p-4 rounded-xl max-w-xs shadow-xl backdrop-blur-sm animate-in slide-in-from-right-8 z-50">
                 <p className="text-xs font-bold text-red-400 mb-1 flex items-center gap-1.5"><AlertCircle className="w-3.5 h-3.5"/> Error</p>
                 <p className="text-[11px] text-red-300">{error}</p>
              </div>
           )}

           <div className="mt-8 p-5 bg-[#151923]/80 border border-[#1e2433] rounded-2xl flex gap-4">
              <div className="shrink-0">
                 <div className="w-8 h-8 rounded-full bg-blue-500/10 flex items-center justify-center border border-blue-500/20">
                    <Lock className="w-3.5 h-3.5 text-[#0b84ff]" />
                 </div>
              </div>
              <div>
                 <p className="text-xs text-[#0b84ff] font-semibold mb-2">Access is scoped by role after login:</p>
                 <ul className="text-[10px] text-slate-400 space-y-1.5 font-medium leading-relaxed">
                    <li>• <strong className="text-[#0b84ff]">Fleet Manager:</strong> Oversees fleet assets, maintenance, vehicle lifecycle, and operational efficiency.</li>
                    <li>• <strong className="text-[#0b84ff]">Driver:</strong> Creates trips, assigns vehicles and drivers, and monitors active deliveries.</li>
                    <li>• <strong className="text-[#0b84ff]">Safety Officer:</strong> Ensures driver compliance, tracks license validity, and monitors safety scores.</li>
                    <li>• <strong className="text-[#0b84ff]">Financial Analyst:</strong> Reviews operational expenses, fuel consumption and performance.</li>
                 </ul>
              </div>
           </div>

        </div>
      </div>
    </div>
  );
}
