import { useEffect, useState } from 'react'
import { supabase } from './services/supabase'

function App() {
  const [conexion, setConexion] = useState('Probando conexión...')

  useEffect(() => {
    async function probarConexion() {
      const { error } = await supabase.from('perfiles').select('*')
      if (error) {
        setConexion('❌ Error: ' + error.message)
      } else {
        setConexion('✅ Conexión con Supabase exitosa')
      }
    }
    probarConexion()
  }, [])

  return (
    <div>
      <h1>SkillHub</h1>
      <p>Buscador de profesionales del hogar</p>
      <p>{conexion}</p>
    </div>
  )
}

export default App