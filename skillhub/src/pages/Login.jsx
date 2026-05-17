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
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ background: 'white', padding: '40px', borderRadius: '12px', boxShadow: '0 4px 20px rgba(0,0,0,0.1)', width: '100%', maxWidth: '400px' }}>
        <h2 style={{ textAlign: 'center', marginBottom: '8px' }}>🔧 SkillHub</h2>
        <p style={{ textAlign: 'center', color: '#666', marginBottom: '24px' }}>Buscador de profesionales del hogar</p>
        <h3 style={{ marginBottom: '16px' }}>Iniciar sesión</h3>
        <input type="email" placeholder="Email" value={email}
          onChange={(e) => setEmail(e.target.value)} />
        <input type="password" placeholder="Contraseña" value={password}
          onChange={(e) => setPassword(e.target.value)} />
        <button style={{ width: '100%', marginTop: '10px' }} onClick={handleLogin}>Entrar</button>
        {error && <p style={{ color: 'red', marginTop: '10px' }}>{error}</p>}
        <p style={{ textAlign: 'center', marginTop: '16px' }}>
          ¿No tenés cuenta? <a href="/registro">Registrate</a>
        </p>
      </div>
    </div>
  )
}

export default Login