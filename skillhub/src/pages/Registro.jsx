import { useState } from 'react'
import { supabase } from '../services/supabase'
import { useNavigate } from 'react-router-dom'

function Registro() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [rol, setRol] = useState('buscador')
  const [error, setError] = useState('')
  const navigate = useNavigate()

  async function handleRegistro() {
    const { data, error } = await supabase.auth.signUp({ email, password })
    if (error) { setError(error.message); return }

    const { error: errorPerfil } = await supabase
      .from('perfiles')
      .insert({ id: data.user.id, tipo: rol, nombre: '' })
    if (errorPerfil) { setError(errorPerfil.message); return }

    if (rol === 'profesional') {
      await supabase.from('profesionales').insert({ id: data.user.id, rubro: 'plomero' })
    }

    navigate('/login')
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ background: 'white', padding: '40px', borderRadius: '12px', boxShadow: '0 4px 20px rgba(0,0,0,0.1)', width: '100%', maxWidth: '400px' }}>
        <h2 style={{ textAlign: 'center', marginBottom: '8px' }}>🔧 SkillHub</h2>
        <p style={{ textAlign: 'center', color: '#666', marginBottom: '24px' }}>Buscador de profesionales del hogar</p>
        <h3 style={{ marginBottom: '16px' }}>Crear cuenta</h3>
        <input type="email" placeholder="Email" value={email}
          onChange={(e) => setEmail(e.target.value)} />
        <input type="password" placeholder="Contraseña (mínimo 6 caracteres)" value={password}
          onChange={(e) => setPassword(e.target.value)} />
        <select value={rol} onChange={(e) => setRol(e.target.value)}>
          <option value="buscador">🔍 Soy buscador — busco profesionales</option>
          <option value="profesional">🔧 Soy profesional — ofrezco servicios</option>
        </select>
        <button style={{ width: '100%', marginTop: '10px' }} onClick={handleRegistro}>Registrarme</button>
        {error && <p style={{ color: 'red', marginTop: '10px' }}>{error}</p>}
        <p style={{ textAlign: 'center', marginTop: '16px' }}>
          ¿Ya tenés cuenta? <a href="/login">Iniciá sesión</a>
        </p>
      </div>
    </div>
  )
}

export default Registro