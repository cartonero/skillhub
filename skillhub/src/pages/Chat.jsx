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
  const inputRef = useRef(null)

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
    inputRef.current?.focus()
  }

  function parseTS(ts) {
    const s = ts && !ts.endsWith("Z") ? ts + "Z" : ts
    return new Date(s)
  }

  function formatHora(timestamp) {
    return parseTS(timestamp).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit', timeZone: 'America/Argentina/Buenos_Aires' })
  }

  function formatFecha(timestamp) {
    return parseTS(timestamp).toLocaleDateString('es-AR', { day: '2-digit', month: 'long', timeZone: 'America/Argentina/Buenos_Aires' })
  }

  // Agrupar mensajes por fecha
  const mensajesConFecha = []
  let fechaActual = null
  for (const m of mensajes) {
    const fecha = parseTS(m.created_at).toLocaleDateString('es-AR', { timeZone: 'America/Argentina/Buenos_Aires' })
    if (fecha !== fechaActual) {
      mensajesConFecha.push({ tipo: 'fecha', fecha: m.created_at, key: `fecha-${m.created_at}` })
      fechaActual = fecha
    }
    mensajesConFecha.push({ tipo: 'mensaje', ...m })
  }

  if (cargando) return <p style={{ textAlign: 'center', marginTop: '40px' }}>Cargando...</p>

  const avatarProfesional = perfilProfesional?.foto_perfil ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(perfilProfesional?.nombre || 'P')}&background=f4a261&color=fff&size=80`

  return (
    <div style={{ maxWidth: '720px', margin: '24px auto', padding: '0 20px' }}>
      <div style={{
        background: 'white', borderRadius: '16px',
        boxShadow: '0 4px 20px rgba(0,0,0,0.1)', overflow: 'hidden',
        display: 'flex', flexDirection: 'column', height: '580px',
      }}>

        {/* Header estilo Messenger */}
        <div style={{
          background: '#1a1a2e', padding: '14px 20px',
          display: 'flex', alignItems: 'center', gap: '12px',
          flexShrink: 0,
        }}>
          <img
            src={avatarProfesional}
            alt="foto"
            style={{ width: '42px', height: '42px', borderRadius: '50%', objectFit: 'cover', border: '2px solid #f4a261' }}
          />
          <div style={{ flex: 1 }}>
            <p style={{ color: 'white', fontWeight: '600', margin: 0, fontSize: '15px' }}>
              {perfilProfesional?.nombre || 'Profesional'}
            </p>
            <p style={{ color: '#8899aa', fontSize: '11px', margin: 0 }}>Conversación privada</p>
          </div>
          <button
            onClick={() => navigate(-1)}
            style={{
              background: 'transparent', border: '1px solid #445',
              color: '#aaa', padding: '6px 14px', borderRadius: '8px',
              cursor: 'pointer', fontSize: '12px',
            }}
          >
            ← Volver
          </button>
        </div>

        {/* Área de mensajes */}
        <div style={{
          flex: 1, overflowY: 'auto', padding: '16px 20px',
          background: '#f0f2f5', display: 'flex', flexDirection: 'column', gap: '4px',
        }}>
          {mensajes.length === 0 && (
            <div style={{ textAlign: 'center', marginTop: '60px' }}>
              <div style={{ fontSize: '48px', marginBottom: '12px' }}>💬</div>
              <p style={{ color: '#999', fontSize: '14px' }}>No hay mensajes aún. ¡Enviá el primero!</p>
            </div>
          )}

          {mensajesConFecha.map((item) => {
            if (item.tipo === 'fecha') {
              return (
                <div key={item.key} style={{ textAlign: 'center', margin: '12px 0 8px' }}>
                  <span style={{
                    background: '#dde0e5', color: '#666', fontSize: '11px',
                    padding: '3px 10px', borderRadius: '10px',
                  }}>{formatFecha(item.fecha)}</span>
                </div>
              )
            }

            const esMio = item.de_id === userId
            return (
              <div key={item.id} style={{
                display: 'flex', justifyContent: esMio ? 'flex-end' : 'flex-start',
                alignItems: 'flex-end', gap: '6px', marginBottom: '2px',
              }}>
                {!esMio && (
                  <img src={avatarProfesional} alt=""
                    style={{ width: '28px', height: '28px', borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
                )}
                <div style={{
                  background: esMio ? '#f4a261' : 'white',
                  color: esMio ? 'white' : '#1a1a2e',
                  padding: '9px 13px',
                  borderRadius: esMio ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                  maxWidth: '65%',
                  boxShadow: '0 1px 2px rgba(0,0,0,0.08)',
                }}>
                  <p style={{ margin: 0, fontSize: '14px', lineHeight: '1.4' }}>{item.contenido}</p>
                  <p style={{ margin: '3px 0 0', fontSize: '10px', opacity: 0.65, textAlign: 'right' }}>
                    {formatHora(item.created_at)}
                  </p>
                </div>
                {esMio && <div style={{ width: '28px', flexShrink: 0 }} />}
              </div>
            )
          })}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div style={{
          padding: '12px 16px', background: 'white',
          borderTop: '1px solid #e8e8e8', display: 'flex', gap: '10px', alignItems: 'center',
          flexShrink: 0,
        }}>
          <input
            ref={inputRef}
            placeholder="Escribí un mensaje..."
            value={nuevoMensaje}
            onChange={(e) => setNuevoMensaje(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && enviar()}
            style={{
              flex: 1, border: '1px solid #e0e0e0', borderRadius: '22px',
              padding: '10px 18px', fontSize: '14px', outline: 'none',
              background: '#f5f5f5', transition: 'border 0.2s',
            }}
            onFocus={e => e.target.style.borderColor = '#f4a261'}
            onBlur={e => e.target.style.borderColor = '#e0e0e0'}
          />
          <button
            onClick={enviar}
            style={{
              background: nuevoMensaje.trim() ? '#f4a261' : '#ddd',
              color: 'white', border: 'none',
              width: '40px', height: '40px', borderRadius: '50%',
              cursor: nuevoMensaje.trim() ? 'pointer' : 'default',
              fontSize: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0, transition: 'background 0.2s',
            }}
          >
            ➤
          </button>
        </div>

      </div>
    </div>
  )
}

export default Chat