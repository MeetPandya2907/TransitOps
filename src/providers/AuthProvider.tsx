import { useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/store/authStore'

// Retry helper — waits ms before each attempt
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

async function fetchProfileWithRetry(userId: string, attempts = 3, delayMs = 600) {
  for (let i = 0; i < attempts; i++) {
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()

    if (profileError) {
      if (i < attempts - 1) {
        // Profile trigger may not have fired yet — wait and retry
        await sleep(delayMs)
        continue
      }
      throw profileError
    }

    const { data: roleData, error: roleError } = await supabase
      .from('user_roles')
      .select('roles(name)')
      .eq('user_id', userId)

    if (roleError) throw roleError

    const roles = (roleData as any[]).map(r => r.roles?.name).filter(Boolean)

    return {
      id: profileData.id as string,
      email: profileData.email as string,
      full_name: profileData.full_name as string,
      roles,
    }
  }
  throw new Error('Profile not found after multiple attempts.')
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { setSession, setProfile, setLoading } = useAuthStore()

  useEffect(() => {
    // 1. Check existing session on app load
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      if (session?.user) {
        fetchProfileWithRetry(session.user.id)
          .then(setProfile)
          .catch(err => {
            console.error('Profile fetch failed:', err)
            setProfile(null)
          })
          .finally(() => setLoading(false))
      } else {
        setLoading(false)
      }
    })

    // 2. React to login / logout / token refresh events
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      if (session?.user) {
        fetchProfileWithRetry(session.user.id)
          .then(setProfile)
          .catch(err => {
            console.error('Profile fetch failed:', err)
            setProfile(null)
          })
          .finally(() => setLoading(false))
      } else {
        setProfile(null)
        setLoading(false)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  return <>{children}</>
}
