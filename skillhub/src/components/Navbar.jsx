import { useNavigate, useLocation } from 'react-router-dom'
import { supabase } from '../services/supabase'
import { useEffect, useState } from 'react'

function NavbarContenido() {
  const navigate = useNavigate()
  const location = useLocation()
  const [nombreUsuario, setNombreUsuario] = useState('')
  const [notifs, setNotifs] = useState(0)
  const [userId, setUserId] = useState(null)
  const [rol, setRol] = useState(null)

  useEffect(() => {
    const obtenerDatos = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      setUserId(user.id)
      const { data } = await supabase
        .from('perfiles')
        .select('nombre, tipo')
        .eq('id', user.id)
        .single()
      if (data?.nombre) setNombreUsuario(data.nombre)
      if (data?.tipo) setRol(data.tipo)
      if (data?.tipo === 'profesional') {
        const { data: nData } = await supabase
          .from('notificaciones')
          .select('id')
          .eq('usuario_id', user.id)
          .eq('leida', false)
        if (nData) setNotifs(nData.length)
      }
    }
    obtenerDatos()
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

        {rol === 'profesional' && (
          <div style={{ position: 'relative', cursor: 'pointer' }} onClick={() => navigate('/dash-profesional')}>
            <span style={{ fontSize: '20px' }}>🔔</span>
            {notifs > 0 && (
              <span style={{
                position: 'absolute',
                top: '-6px',
                right: '-8px',
                background: '#e74c3c',
                color: 'white',
                borderRadius: '50%',
                width: '18px',
                height: '18px',
                fontSize: '11px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 'bold',
              }}>{notifs}</span>
            )}
          </div>
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