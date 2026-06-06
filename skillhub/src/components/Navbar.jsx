import { useNavigate, useLocation } from 'react-router-dom'
import { supabase } from '../services/supabase'
import { useEffect, useState } from 'react'

function NavbarContenido() {
  const navigate = useNavigate()
  const location = useLocation()
  const [nombreUsuario, setNombreUsuario] = useState('')

  useEffect(() => {
    const obtenerNombre = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data } = await supabase
        .from('perfiles')
        .select('nombre')
        .eq('id', user.id)
        .single()
      if (data?.nombre) setNombreUsuario(data.nombre)
    }
    obtenerNombre()
  }, [location.pathname])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    navigate('/login')
  }

  return (
    <nav style={{
      backgroundColor: '#1a1a2e',
      padding: '12px 24px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
      position: 'sticky',
      top: 0,
      zIndex: 1000,
    }}>
      <div onClick={() => navigate(-1)} style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
        <div style={{
          backgroundColor: '#f4a261',
          borderRadius: '8px',
          width: '36px',
          height: '36px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontWeight: 'bold',
          fontSize: '18px',
          color: 'white',
        }}>S</div>
        <span style={{ color: 'white', fontSize: '20px', fontWeight: 'bold' }}>SkillHub</span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        {nombreUsuario && (
          <span style={{ color: '#ccc', fontSize: '14px' }}>
            Hola, <strong style={{ color: 'white' }}>{nombreUsuario.split(' ')[0]}</strong>
          </span>
        )}
        <button
          onClick={handleLogout}
          style={{
            backgroundColor: 'transparent',
            border: '1px solid #f4a261',
            color: '#f4a261',
            padding: '6px 14px',
            borderRadius: '6px',
            fontSize: '13px',
            cursor: 'pointer',
            margin: 0,
          }}
        >
          Cerrar sesión
        </button>
      </div>
    </nav>
  )
}

function Navbar() {
  const location = useLocation()
  const rutasSinNavbar = ['/', '/login', '/registro']
  if (rutasSinNavbar.includes(location.pathname)) return null
  return <NavbarContenido />
}

export default Navbar