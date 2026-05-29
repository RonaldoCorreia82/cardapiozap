import { createClient } from '@supabase/supabase-js'
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'

// URL e anon key são PÚBLICAS — seguro ter como fallback no código
const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  'https://tkuuwjgokgaveiskfdyj.supabase.co'

const SUPABASE_ANON_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRrdXV3amdva2dhdmVpc2tmZHlqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk5MTQxMzIsImV4cCI6MjA5NTQ5MDEzMn0.UMZyOZIduxW3LLXY8fNsLmJyHobtv1UxO0hgPMTe4ss'

// Service key é SECRETA — deve vir apenas de variável de ambiente
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

// ============================================================
// Cliente para uso no lado do servidor (Server Components, Actions)
// Importa next/headers — use APENAS em arquivos server-side
// ============================================================
export function criarClienteServidor() {
  const cookieStore = cookies()

  return createServerClient(
    SUPABASE_URL,
    SUPABASE_ANON_KEY,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value, ...options })
          } catch {
            // Ignorado em Server Components (sem capacidade de set)
          }
        },
        remove(name: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value: '', ...options })
          } catch {
            // Ignorado em Server Components
          }
        },
      },
    }
  )
}

// ============================================================
// Cliente de serviço — bypass de RLS para Server Actions
// NUNCA usar em Client Components
// ============================================================
export function criarClienteServico() {
  return createClient(
    SUPABASE_URL,
    SUPABASE_SERVICE_KEY,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  )
}
