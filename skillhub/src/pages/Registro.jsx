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

        <h3 style={{ marginBottom: '16px', color: '#333' }}>Crear cuenta</h3>

        <div style={{ marginBottom: '12px' }}>
          <label style={{ fontSize: '13px', fontWeight: '500', color: '#555', display: 'block', marginBottom: '4px' }}>Email</label>
          <input type="email" placeholder="tu@email.com" value={email}
            onChange={(e) => setEmail(e.target.value)} style={{ width: '100%' }} />
        </div>

        <div style={{ marginBottom: '12px' }}>
          <label style={{ fontSize: '13px', fontWeight: '500', color: '#555', display: 'block', marginBottom: '4px' }}>Contraseña</label>
          <input type="password" placeholder="Mínimo 6 caracteres" value={password}
            onChange={(e) => setPassword(e.target.value)} style={{ width: '100%' }} />
        </div>

        <div style={{ marginBottom: '16px' }}>
          <label style={{ fontSize: '13px', fontWeight: '500', color: '#555', display: 'block', marginBottom: '8px' }}>¿Qué tipo de cuenta querés?</label>
          <div style={{ display: 'flex', gap: '10px' }}>
            <div
              onClick={() => setRol('buscador')}
              style={{
                flex: 1,
                padding: '12px',
                borderRadius: '10px',
                border: rol === 'buscador' ? '2px solid #f4a261' : '2px solid #eee',
                background: rol === 'buscador' ? '#fff8f3' : 'white',
                cursor: 'pointer',
                textAlign: 'center',
              }}
            >
              <div style={{ fontSize: '24px', marginBottom: '4px' }}>🔍</div>
              <p style={{ margin: 0, fontSize: '13px', fontWeight: '500', color: '#333' }}>Buscador</p>
              <p style={{ margin: 0, fontSize: '11px', color: '#888' }}>Busco profesionales</p>
            </div>
            <div
              onClick={() => setRol('profesional')}
              style={{
                flex: 1,
                padding: '12px',
                borderRadius: '10px',
                border: rol === 'profesional' ? '2px solid #f4a261' : '2px solid #eee',
                background: rol === 'profesional' ? '#fff8f3' : 'white',
                cursor: 'pointer',
                textAlign: 'center',
              }}
            >
              <div style={{ fontSize: '24px', marginBottom: '4px' }}>🔧</div>
              <p style={{ margin: 0, fontSize: '13px', fontWeight: '500', color: '#333' }}>Profesional</p>
              <p style={{ margin: 0, fontSize: '11px', color: '#888' }}>Ofrezco servicios</p>
            </div>
          </div>
        </div>

        <button style={{ width: '100%', marginTop: '4px' }} onClick={handleRegistro}>Registrarme</button>

        {error && <p style={{ color: 'red', marginTop: '10px', fontSize: '14px' }}>{error}</p>}

        <p style={{ textAlign: 'center', marginTop: '20px', fontSize: '14px', color: '#666' }}>
          ¿Ya tenés cuenta? <a href="/login" style={{ color: '#f4a261', fontWeight: '500' }}>Iniciá sesión</a>
        </p>
      </div>
    </div>
  )
}

export default Registro