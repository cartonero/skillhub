import { useNavigate, useLocation } from 'react-router-dom'
import { supabase } from '../services/supabase'
import { useEffect, useState, useRef } from 'react'

function NavbarContenido() {
  const navigate = useNavigate()
  const location = useLocation()
  const [nombreUsuario, setNombreUsuario] = useState('')
  const [notifs, setNotifs] = useState([])
  const [userId, setUserId] = useState(null)
  const [rol, setRol] = useState(null)
  const [dropdownAbierto, setDropdownAbierto] = useState(false)
  const dropdownRef = useRef(null)

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
          .select('*')
          .eq('usuario_id', user.id)
          .order('created_at', { ascending: false })
          .limit(10)
        if (nData) setNotifs(nData)
      }
    }
    obtenerDatos()
  }, [location.pathname])

  // Cerrar dropdown al hacer click fuera
  useEffect(() => {
    function handleClickFuera(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownAbierto(false)
      }
    }
    document.addEventListener('mousedown', handleClickFuera)
    return () => document.removeEventListener('mousedown', handleClickFuera)
  }, [])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    navigate('/login')
  }

  const noLeidas = notifs.filter(n => !n.leida).length

  const marcarLeidas = async () => {
    if (!userId || noLeidas === 0) return
    await supabase
      .from('notificaciones')
      .update({ leida: true })
      .eq('usuario_id', userId)
      .eq('leida', false)
    setNotifs(prev => prev.map(n => ({ ...n, leida: true })))
  }

  const toggleDropdown = () => {
    setDropdownAbierto(prev => {
      if (!prev) marcarLeidas()
      return !prev
    })
  }

  const formatFecha = (ts) => {
    if (!ts) return ''
    const d = new Date(ts)
    return d.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: '2-digit' })
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
          <div ref={dropdownRef} style={{ position: 'relative' }}>
            {/* Campanita */}
            <div
              onClick={toggleDropdown}
              style={{ position: 'relative', cursor: 'pointer', padding: '4px' }}
            >
              <span style={{ fontSize: '20px' }}>🔔</span>
              {noLeidas > 0 && (
                <span style={{
                  position: 'absolute',
                  top: '-2px',
                  right: '-4px',
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
                }}>{noLeidas}</span>
              )}
            </div>

            {/* Dropdown */}
            {dropdownAbierto && (
              <div style={{
                position: 'absolute',
                top: 'calc(100% + 12px)',
                right: 0,
                width: '320px',
                background: 'white',
                borderRadius: '12px',
                boxShadow: '0 8px 30px rgba(0,0,0,0.18)',
                overflow: 'hidden',
                zIndex: 2000,
              }}>
                <div style={{
                  padding: '14px 18px',
                  borderBottom: '1px solid #f0f0f0',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}>
                  <span style={{ fontWeight: '700', fontSize: '15px', color: '#1a1a2e' }}>🔔 Notificaciones</span>
                  {noLeidas > 0 && (
                    <span style={{
                      background: '#e74c3c',
                      color: 'white',
                      borderRadius: '12px',
                      padding: '2px 8px',
                      fontSize: '11px',
                      fontWeight: 'bold',
                    }}>{noLeidas} nueva{noLeidas > 1 ? 's' : ''}</span>
                  )}
                </div>

                {notifs.length === 0 ? (
                  <div style={{ padding: '24px', textAlign: 'center', color: '#999', fontSize: '14px' }}>
                    Sin notificaciones
                  </div>
                ) : (
                  <div style={{ maxHeight: '320px', overflowY: 'auto' }}>
                    {notifs.map((n) => (
                      <div key={n.id} style={{
                        padding: '12px 18px',
                        borderBottom: '1px solid #f5f5f5',
                        background: n.leida ? 'white' : '#fff8f2',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'flex-start',
                        gap: '10px',
                      }}>
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                          {!n.leida && (
                            <div style={{
                              width: '8px', height: '8px', borderRadius: '50%',
                              background: '#f4a261', flexShrink: 0, marginTop: '5px',
                            }} />
                          )}
                          {n.leida && <div style={{ width: '8px', flexShrink: 0 }} />}
                          <span style={{ fontSize: '13px', color: '#333', lineHeight: '1.4' }}>{n.mensaje}</span>
                        </div>
                        <span style={{ fontSize: '11px', color: '#bbb', whiteSpace: 'nowrap', flexShrink: 0 }}>
                          {formatFecha(n.created_at)}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
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