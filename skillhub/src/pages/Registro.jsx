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
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    })

    if (error) {
      setError(error.message)
      return
    }

    const { error: errorPerfil } = await supabase
      .from('perfiles')
      .insert({ id: data.user.id, tipo: rol, nombre: '' })

    if (errorPerfil) {
      setError(errorPerfil.message)
      return
    }

    if (rol === 'profesional') {
      await supabase
        .from('profesionales')
        .insert({ id: data.user.id, rubro: 'plomero' })
    }

    alert('Cuenta creada. Revisá tu email para confirmar.')
    navigate('/login')
  }

  return (
    <div>
      <h2>Crear cuenta</h2>
      <input
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <input
        type="password"
        placeholder="Contraseña"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      <select value={rol} onChange={(e) => setRol(e.target.value)}>
        <option value="buscador">Soy buscador</option>
        <option value="profesional">Soy profesional</option>
      </select>
      <button onClick={handleRegistro}>Registrarme</button>
      {error && <p style={{color: 'red'}}>{error}</p>}
      <p>¿Ya tenés cuenta? <a href="/login">Iniciá sesión</a></p>
    </div>
  )
}

export default Registro