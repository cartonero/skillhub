import { useState } from 'react'
import { supabase } from '../services/supabase'
import { useNavigate } from 'react-router-dom'

function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const navigate = useNavigate()

  async function handleLogin() {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      setError(error.message)
      return
    }

    const { data: perfil } = await supabase
      .from('perfiles')
      .select('tipo')
      .eq('id', data.user.id)
      .single()

    if (perfil.tipo === 'profesional') {
      navigate('/dash-profesional')
    } else {
      navigate('/dash-buscador')
    }
  }

  return (
    <div>
      <h2>Iniciar sesión</h2>
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
      <button onClick={handleLogin}>Entrar</button>
      {error && <p style={{color: 'red'}}>{error}</p>}
      <p>¿No tenés cuenta? <a href="/registro">Registrate</a></p>
    </div>
  )
}

export default Login