import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

// URL e anon key são PÚBLICAS — seguro ter como fallback no código
const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  'https://tkuuwjgokgaveiskfdyj.supabase.co'

const SUPABASE_ANON_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRrdXV3amdva2dhdmVpc2tmZHlqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk5MTQxMzIsImV4cCI6MjA5NTQ5MDEzMn0.UMZyOZIduxW3LLXY8fNsLmJyHobtv1UxO0hgPMTe4ss'

// E-mail do administrador geral (master)
const MASTER_EMAIL =
  process.env.MASTER_EMAIL || 'ronaldocorreia8206@gmail.com'

// ============================================================
// Middleware de autenticação e controle de acesso
//
// Perfis:
//   master  → acessa /master (email == MASTER_EMAIL)
//   dono    → acessa /admin (qualquer auth user que não seja master)
//   público → acessa /[slug] sem autenticação
// ============================================================
export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: { headers: request.headers },
  })

  const supabase = createServerClient(
    SUPABASE_URL,
    SUPABASE_ANON_KEY,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({ name, value, ...options })
          response = NextResponse.next({ request: { headers: request.headers } })
          response.cookies.set({ name, value, ...options })
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({ name, value: '', ...options })
          response = NextResponse.next({ request: { headers: request.headers } })
          response.cookies.set({ name, value: '', ...options })
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()
  const { pathname } = request.nextUrl
  const isMaster = user?.email === MASTER_EMAIL

  // ---- Página de login ----
  if (pathname === '/admin/login') {
    if (user) {
      // Já autenticado — redireciona para o painel correto
      return NextResponse.redirect(
        new URL(isMaster ? '/master' : '/admin', request.url)
      )
    }
    return response
  }

  // ---- Rotas /master — apenas para o administrador geral ----
  if (pathname.startsWith('/master')) {
    if (!user) {
      return NextResponse.redirect(new URL('/admin/login', request.url))
    }
    if (!isMaster) {
      // Dono de restaurante tentando acessar /master → redireciona para /admin
      return NextResponse.redirect(new URL('/admin', request.url))
    }
    return response
  }

  // ---- Rotas /admin — apenas para donos de restaurante ----
  if (pathname.startsWith('/admin')) {
    if (!user) {
      const loginUrl = new URL('/admin/login', request.url)
      loginUrl.searchParams.set('redirect', pathname)
      return NextResponse.redirect(loginUrl)
    }
    if (isMaster) {
      // Master tentando acessar /admin → redireciona para /master
      return NextResponse.redirect(new URL('/master', request.url))
    }
    return response
  }

  return response
}

export const config = {
  matcher: ['/admin', '/admin/:path*', '/master', '/master/:path*'],
}
