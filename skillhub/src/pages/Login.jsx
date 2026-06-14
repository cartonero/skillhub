import { useState } from 'react'
import { supabase } from '../services/supabase'
import { useNavigate } from 'react-router-dom'

function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const navigate = useNavigate()

  async function handleLogin() {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) { setError(error.message); return }
    const { data: perfil } = await supabase
      .from('perfiles').select('tipo').eq('id', data.user.id).single()
    if (perfil.tipo === 'profesional') navigate('/dash-profesional')
    else navigate('/dash-buscador')
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
    }}>
      <div style={{
        background: 'white',
        padding: '40px',
        borderRadius: '16px',
        boxShadow: '0 20px 60px rgba(0,0,0,0.4)',
        width: '100%',
        maxWidth: '400px',
      }}>
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <div style={{
            backgroundColor: '#f4a261',
            borderRadius: '12px',
            width: '56px',
            height: '56px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '28px',
            margin: '0 auto 12px',
          }}>🔧</div>
          <h2 style={{ margin: '0 0 4px', fontSize: '24px', color: '#1a1a2e' }}>SkillHub</h2>
          <p style={{ color: '#888', margin: 0, fontSize: '14px' }}>Buscador de profesionales del hogar</p>
        </div>

        <h3 style={{ marginBottom: '16px', color: '#333' }}>Iniciar sesión</h3>

        <div style={{ marginBottom: '12px' }}>
          <label style={{ fontSize: '13px', fontWeight: '500', color: '#555', display: 'block', marginBottom: '4px' }}>Email</label>
          <input type="email" placeholder="tu@email.com" value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={{ width: '100%' }}
          />
        </div>

        <div style={{ marginBottom: '16px' }}>
          <label style={{ fontSize: '13px', fontWeight: '500', color: '#555', display: 'block', marginBottom: '4px' }}>Contraseña</label>
          <input type="password" placeholder="••••••••" value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
            style={{ width: '100%' }}
          />
        </div>

        <button style={{ width: '100%', marginTop: '4px' }} onClick={handleLogin}>Entrar</button>

        {error && <p style={{ color: 'red', marginTop: '10px', fontSize: '14px' }}>{error}</p>}

        <p style={{ textAlign: 'center', marginTop: '20px', fontSize: '14px', color: '#666' }}>
          ¿No tenés cuenta? <a href="/registro" style={{ color: '#f4a261', fontWeight: '500' }}>Registrate</a>
        </p>
      </div>
    </div>
  )
}

export default Login