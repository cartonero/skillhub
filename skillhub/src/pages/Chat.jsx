import { useState, useEffect, useRef } from 'react'
import { supabase } from '../services/supabase'
import { useParams, useNavigate } from 'react-router-dom'

function Chat() {
  const { profesionalId } = useParams()
  const navigate = useNavigate()
  const [mensajes, setMensajes] = useState([])
  const [nuevoMensaje, setNuevoMensaje] = useState('')
  const [userId, setUserId] = useState(null)
  const [perfilProfesional, setPerfilProfesional] = useState(null)
  const [cargando, setCargando] = useState(true)
  const bottomRef = useRef(null)

  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { navigate('/login'); return }
      setUserId(user.id)

      const { data: perfil } = await supabase
        .from('perfiles')
        .select('nombre, foto_perfil')
        .eq('id', profesionalId)
        .single()
      if (perfil) setPerfilProfesional(perfil)

      await cargarMensajes(user.id)
      setCargando(false)
    }
    init()
  }, [profesionalId])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [mensajes])

  async function cargarMensajes(uid) {
    const { data } = await supabase
      .from('mensajes')
      .select('*')
      .or(`and(de_id.eq.${uid},para_id.eq.${profesionalId}),and(de_id.eq.${profesionalId},para_id.eq.${uid})`)
      .order('created_at', { ascending: true })
    if (data) setMensajes(data)
  }

  async function enviar() {
    if (!nuevoMensaje.trim()) return
    await supabase.from('mensajes').insert({
      de_id: userId,
      para_id: profesionalId,
      contenido: nuevoMensaje.trim()
    })
    setNuevoMensaje('')
    await cargarMensajes(userId)
  }

  function formatHora(timestamp) {
    return new Date(timestamp).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })
  }

  if (cargando) return <p style={{ textAlign: 'center', marginTop: '40px' }}>Cargando...</p>

  return (
    <div style={{ maxWidth: '700px', margin: '0 auto', padding: '24px 20px' }}>

      <div style={{ background: 'white', borderRadius: '16px', boxShadow: '0 2px 10px rgba(0,0,0,0.08)', overflow: 'hidden' }}>

        <div style={{ background: '#1a1a2e', padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <img
            src={perfilProfesional?.foto_perfil || 'https://via.placeholder.com/40x40?text=?'}
            alt="foto"
            style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover', border: '2px solid #f4a261' }}
          />
          <div>
            <p style={{ color: 'white', fontWeight: '500', margin: 0 }}>{perfilProfesional?.nombre || 'Profesional'}</p>
            <p style={{ color: '#aaa', fontSize: '12px', margin: 0 }}>Conversación privada</p>
          </div>
          <button
            onClick={() => navigate(-1)}
            style={{ marginLeft: 'auto', background: 'transparent', border: '1px solid #555', color: '#aaa', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '12px' }}
          >
            ← Volver
          </button>
        </div>

        <div style={{ height: '420px', overflowY: 'auto', padding: '20px', background: '#f8f8f8', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {mensajes.length === 0 && (
            <p style={{ textAlign: 'center', color: '#999', marginTop: '40px' }}>No hay mensajes aún. ¡Enviá el primero!</p>
          )}
          {mensajes.map((m) => {
            const esMio = m.de_id === userId
            return (
              <div key={m.id} style={{ display: 'flex', justifyContent: esMio ? 'flex-end' : 'flex-start' }}>
                <div style={{
                  background: esMio ? '#f4a261' : 'white',
                  color: esMio ? 'white' : '#333',
                  padding: '10px 14px',
                  borderRadius: esMio ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                  maxWidth: '70%',
                  boxShadow: '0 1px 4px rgba(0,0,0,0.1)',
                }}>
                  <p style={{ margin: 0, fontSize: '14px' }}>{m.contenido}</p>
                  <p style={{ margin: '4px 0 0', fontSize: '10px', opacity: 0.7, textAlign: 'right' }}>{formatHora(m.created_at)}</p>
                </div>
              </div>
            )
          })}
          <div ref={bottomRef} />
        </div>

        <div style={{ padding: '16px 20px', background: 'white', borderTop: '1px solid #eee', display: 'flex', gap: '10px' }}>
          <input
            placeholder="Escribí un mensaje..."
            value={nuevoMensaje}
            onChange={(e) => setNuevoMensaje(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && enviar()}
            style={{ flex: 1 }}
          />
          <button onClick={enviar} style={{ background: '#f4a261', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer', fontWeight: '500' }}>
            Enviar
          </button>
        </div>

      </div>
    </div>
  )
}

export default Chat