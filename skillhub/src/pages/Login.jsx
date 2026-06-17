import { useState } from 'react'
import { supabase } from '../services/supabase'
import { useNavigate } from 'react-router-dom'

// Traducciones de errores de Supabase al español
function traducirError(msg) {
  if (!msg) return 'Ocurrió un error. Intentá de nuevo.'
  if (msg.includes('Invalid login credentials')) return 'Email o contraseña incorrectos.'
  if (msg.includes('Email not confirmed')) return 'Tenés que confirmar tu email antes de iniciar sesión. Revisá tu bandeja de entrada.'
  if (msg.includes('User not found')) return 'No existe una cuenta con ese email.'
  if (msg.includes('too many requests') || msg.includes('rate limit')) return 'Demasiados intentos. Esperá unos minutos e intentá de nuevo.'
  if (msg.includes('network') || msg.includes('fetch')) return 'Error de conexión. Verificá tu internet.'
  return msg
}

function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [cargando, setCargando] = useState(false)
  const [vistaRecuperar, setVistaRecuperar] = useState(false)
  const [emailRecuperar, setEmailRecuperar] = useState('')
  const [mensajeRecuperar, setMensajeRecuperar] = useState('')
  const [enviandoRecuperar, setEnviandoRecuperar] = useState(false)
  const navigate = useNavigate()

  async function handleLogin() {
    setError('')
    if (!email.trim()) { setError('Ingresá tu email.'); return }
    if (!password) { setError('Ingresá tu contraseña.'); return }
    if (password.length < 6) { setError('La contraseña debe tener al menos 6 caracteres.'); return }

    setCargando(true)
    const { data, error } = await supabase.auth.signInWithPassword({ email: email.trim(), password })
    setCargando(false)

    if (error) { setError(traducirError(error.message)); return }

    const { data: perfil } = await supabase
      .from('perfiles').select('tipo').eq('id', data.user.id).single()
    if (perfil?.tipo === 'profesional') navigate('/dash-profesional')
    else navigate('/dash-buscador')
  }

  async function handleRecuperar() {
    setMensajeRecuperar('')
    if (!emailRecuperar.trim()) { setMensajeRecuperar('❌ Ingresá tu email.'); return }
    setEnviandoRecuperar(true)
    const { error } = await supabase.auth.resetPasswordForEmail(emailRecuperar.trim(), {
      redirectTo: `${window.location.origin}/reset-password`,
    })
    setEnviandoRecuperar(false)
    if (error) {
      setMensajeRecuperar('❌ ' + traducirError(error.message))
    } else {
      setMensajeRecuperar('✅ Te enviamos un email con las instrucciones. Revisá tu bandeja de entrada.')
    }
  }

  const cardStyle = {
    background: 'white', padding: '40px', borderRadius: '16px',
    boxShadow: '0 20px 60px rgba(0,0,0,0.4)', width: '100%', maxWidth: '400px',
  }
  const labelStyle = { fontSize: '13px', fontWeight: '500', color: '#555', display: 'block', marginBottom: '4px' }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)' }}>
      <div style={cardStyle}>

        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <div style={{ backgroundColor: '#f4a261', borderRadius: '12px', width: '56px', height: '56px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '28px', margin: '0 auto 12px' }}>🔧</div>
          <h2 style={{ margin: '0 0 4px', fontSize: '24px', color: '#1a1a2e' }}>SkillHub</h2>
          <p style={{ color: '#888', margin: 0, fontSize: '14px' }}>Buscador de profesionales del hogar</p>
        </div>

        {/* ── Vista recuperar contraseña ── */}
        {vistaRecuperar ? (
          <>
            <h3 style={{ marginBottom: '6px', color: '#333' }}>Recuperar contraseña</h3>
            <p style={{ fontSize: '13px', color: '#666', marginBottom: '16px' }}>
              Ingresá tu email y te enviamos un enlace para restablecer tu contraseña.
            </p>
            <div style={{ marginBottom: '16px' }}>
              <label style={labelStyle}>Email</label>
              <input
                type="email"
                placeholder="tu@email.com"
                value={emailRecuperar}
                onChange={(e) => setEmailRecuperar(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleRecuperar()}
                style={{ width: '100%' }}
              />
            </div>
            <button
              onClick={handleRecuperar}
              disabled={enviandoRecuperar}
              style={{ width: '100%', opacity: enviandoRecuperar ? 0.7 : 1 }}
            >
              {enviandoRecuperar ? 'Enviando...' : 'Enviar enlace'}
            </button>
            {mensajeRecuperar && (
              <p style={{ marginTop: '12px', fontSize: '14px', color: mensajeRecuperar.startsWith('✅') ? '#1e8449' : 'red' }}>
                {mensajeRecuperar}
              </p>
            )}
            <p style={{ textAlign: 'center', marginTop: '20px', fontSize: '14px', color: '#666' }}>
              <button
                onClick={() => { setVistaRecuperar(false); setMensajeRecuperar('') }}
                style={{ background: 'none', border: 'none', color: '#f4a261', fontWeight: '500', cursor: 'pointer', padding: 0, fontSize: '14px', width: 'auto', margin: 0 }}
              >
                ← Volver al inicio de sesión
              </button>
            </p>
          </>
        ) : (
          /* ── Vista login ── */
          <>
            <h3 style={{ marginBottom: '16px', color: '#333' }}>Iniciar sesión</h3>

            <div style={{ marginBottom: '12px' }}>
              <label style={labelStyle}>Email</label>
              <input
                type="email"
                placeholder="tu@email.com"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setError('') }}
                style={{ width: '100%' }}
              />
            </div>

            <div style={{ marginBottom: '8px' }}>
              <label style={labelStyle}>Contraseña</label>
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => { setPassword(e.target.value); setError('') }}
                onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                style={{ width: '100%' }}
              />
            </div>

            {/* Olvidé mi contraseña */}
            <div style={{ textAlign: 'right', marginBottom: '16px' }}>
              <button
                onClick={() => { setVistaRecuperar(true); setEmailRecuperar(email); setError('') }}
                style={{ background: 'none', border: 'none', color: '#f4a261', fontSize: '13px', cursor: 'pointer', padding: 0, width: 'auto', margin: 0 }}
              >
                ¿Olvidaste tu contraseña?
              </button>
            </div>

            <button
              onClick={handleLogin}
              disabled={cargando}
              style={{ width: '100%', opacity: cargando ? 0.7 : 1 }}
            >
              {cargando ? 'Ingresando...' : 'Entrar'}
            </button>

            {error && (
              <p style={{ color: '#c0392b', marginTop: '12px', fontSize: '14px', background: '#fdf2f2', padding: '10px 14px', borderRadius: '8px', border: '1px solid #f5c6cb' }}>
                {error}
              </p>
            )}

            <p style={{ textAlign: 'center', marginTop: '20px', fontSize: '14px', color: '#666' }}>
              ¿No tenés cuenta? <a href="/registro" style={{ color: '#f4a261', fontWeight: '500' }}>Registrate</a>
            </p>
          </>
        )}
      </div>
    </div>
  )
}

export default Login