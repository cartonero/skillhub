import { useState, useEffect, useRef } from 'react'
import { supabase } from '../services/supabase'
import { useNavigate } from 'react-router-dom'

function DashProfesional() {
  const [perfil, setPerfil] = useState({ nombre: '', telefono: '', localidad: '', provincia: '', foto_perfil: '' })
  const [prof, setProf] = useState({ rubro: 'plomero', descripcion: '', disponible: true })
  const [userId, setUserId] = useState(null)
  const [mensaje, setMensaje] = useState('')
  const [trabajos, setTrabajos] = useState([])
  const [descFoto, setDescFoto] = useState('')
  const [conversaciones, setConversaciones] = useState([])
  const [chatAbierto, setChatAbierto] = useState(null)
  const [mensajesChat, setMensajesChat] = useState([])
  const [nuevoMensaje, setNuevoMensaje] = useState('')
  const [notificaciones, setNotificaciones] = useState([])
  const [confirmarBorrar, setConfirmarBorrar] = useState(false)
  const archivoRef = useRef(null)
  const avatarRef = useRef(null)
  const bottomRef = useRef(null)
  const navigate = useNavigate()

  useEffect(() => {
    async function cargarDatos() {
      const { data: { user } } = await supabase.auth.getUser()
      setUserId(user.id)
      const { data: perfilData } = await supabase.from('perfiles').select('*').eq('id', user.id).single()
      if (perfilData) setPerfil(perfilData)
      const { data: profData } = await supabase.from('profesionales').select('*').eq('id', user.id).single()
      if (profData) setProf(profData)
      cargarTrabajos(user.id)
      cargarConversaciones(user.id)
      cargarNotificaciones(user.id)
    }
    cargarDatos()
  }, [])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [mensajesChat])

  async function cargarNotificaciones(uid) {
    const { data } = await supabase
      .from('notificaciones')
      .select('*')
      .eq('usuario_id', uid)
      .order('created_at', { ascending: false })
    if (data) setNotificaciones(data)
    const tieneSinLeer = data?.some(n => !n.leida)
    await supabase
      .from('notificaciones')
      .update({ leida: true })
      .eq('usuario_id', uid)
      .eq('leida', false)
    if (tieneSinLeer) window.location.reload()
  }

  async function cargarTrabajos(uid) {
    const { data } = await supabase.from('trabajos').select('*').eq('profesional_id', uid)
    if (data) setTrabajos(data)
  }

  async function cargarConversaciones(uid) {
    const { data } = await supabase
      .from('mensajes')
      .select('de_id, perfiles!mensajes_de_id_fkey(nombre, foto_perfil)')
      .eq('para_id', uid)
    if (data) {
      const unicos = []
      const vistos = new Set()
      for (const m of data) {
        if (!vistos.has(m.de_id)) {
          vistos.add(m.de_id)
          unicos.push({ id: m.de_id, nombre: m.perfiles?.nombre || 'Usuario', foto: m.perfiles?.foto_perfil })
        }
      }
      setConversaciones(unicos)
    }
  }

  async function abrirChat(buscadorId, buscadorNombre) {
    setChatAbierto({ id: buscadorId, nombre: buscadorNombre })
    const { data } = await supabase
      .from('mensajes')
      .select('*')
      .or(`and(de_id.eq.${buscadorId},para_id.eq.${userId}),and(de_id.eq.${userId},para_id.eq.${buscadorId})`)
      .order('created_at', { ascending: true })
    if (data) setMensajesChat(data)
  }

  async function responder() {
    if (!nuevoMensaje.trim() || !chatAbierto) return
    await supabase.from('mensajes').insert({
      de_id: userId,
      para_id: chatAbierto.id,
      contenido: nuevoMensaje.trim()
    })
    setNuevoMensaje('')
    await abrirChat(chatAbierto.id, chatAbierto.nombre)
  }

  async function borrarCuenta() {
    await supabase.from('resenias').delete().eq('profesional_id', userId)
    await supabase.from('trabajos').delete().eq('profesional_id', userId)
    await supabase.from('mensajes').delete().or(`de_id.eq.${userId},para_id.eq.${userId}`)
    await supabase.from('notificaciones').delete().eq('usuario_id', userId)
    await supabase.from('favoritos').delete().eq('profesional_id', userId)
    await supabase.from('profesionales').delete().eq('id', userId)
    await supabase.from('perfiles').delete().eq('id', userId)
    await supabase.auth.signOut()
    navigate('/login')
  }

  function formatHora(timestamp) {
    return new Date(timestamp).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })
  }

  function formatFecha(timestamp) {
    return new Date(timestamp).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: '2-digit' })
  }

  async function subirAvatar() {
    const archivo = avatarRef.current.files[0]
    if (!archivo) return
    const nombreArchivo = `${userId}/avatar_${Date.now()}.${archivo.name.split('.').pop()}`
    const { error } = await supabase.storage.from('avatares').upload(nombreArchivo, archivo)
    if (error) { setMensaje('❌ Error subiendo la foto de perfil'); return }
    const { data: urlData } = supabase.storage.from('avatares').getPublicUrl(nombreArchivo)
    await supabase.from('perfiles').update({ foto_perfil: urlData.publicUrl }).eq('id', userId)
    setPerfil({ ...perfil, foto_perfil: urlData.publicUrl })
    setMensaje('✅ Foto de perfil actualizada')
    avatarRef.current.value = ''
  }

  async function guardarPerfil() {
    await supabase.from('perfiles').update(perfil).eq('id', userId)
    await supabase.from('profesionales').update(prof).eq('id', userId)
    setMensaje('✅ Perfil guardado correctamente')
  }

  async function subirFoto() {
    const archivo = archivoRef.current.files[0]
    if (!archivo) return
    const nombreArchivo = `${userId}/${Date.now()}_${archivo.name}`
    const { error: errorSubida } = await supabase.storage.from('trabajos').upload(nombreArchivo, archivo)
    if (errorSubida) { setMensaje('❌ Error subiendo la foto'); return }
    const { data: urlData } = supabase.storage.from('trabajos').getPublicUrl(nombreArchivo)
    await supabase.from('trabajos').insert({ profesional_id: userId, foto_url: urlData.publicUrl, descripcion: descFoto })
    setMensaje('✅ Foto subida correctamente')
    setDescFoto('')
    archivoRef.current.value = ''
    cargarTrabajos(userId)
  }

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '30px 20px' }}>

      {perfil.nombre && (
        <div style={{
          background: 'linear-gradient(135deg, #1a1a2e, #0f3460)',
          borderRadius: '16px',
          padding: '24px 28px',
          marginBottom: '24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <div>
            <h2 style={{ color: 'white', margin: '0 0 4px', fontSize: '22px' }}>
              ¡Hola, {perfil.nombre.split(' ')[0]}! 👋
            </h2>
            <p style={{ color: '#aab', margin: 0, fontSize: '14px' }}>
              Administrá tu perfil y tus servicios
            </p>
          </div>
          <div style={{ fontSize: '48px' }}>🛠️</div>
        </div>
      )}

      <div style={{ background: 'white', borderRadius: '16px', boxShadow: '0 2px 10px rgba(0,0,0,0.08)', padding: '30px', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '24px' }}>
        <div style={{ position: 'relative' }}>
          <img
            src={perfil.foto_perfil || 'https://via.placeholder.com/100x100?text=Foto'}
            alt="Foto de perfil"
            style={{ width: '100px', height: '100px', borderRadius: '50%', objectFit: 'cover', border: '3px solid #f4a261' }}
          />
        </div>
        <div style={{ flex: 1 }}>
          <h2 style={{ marginBottom: '4px' }}>{perfil.nombre || 'Tu nombre'}</h2>
          <p style={{ color: '#666', marginBottom: '12px' }}>{prof.rubro} — {perfil.localidad}, {perfil.provincia}</p>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <input type="file" accept="image/*" ref={avatarRef} style={{ fontSize: '12px', maxWidth: '200px' }} />
            <button onClick={subirAvatar} style={{ padding: '6px 12px', fontSize: '12px' }}>Cambiar foto</button>
          </div>
        </div>
      </div>



      <div style={{ background: 'white', borderRadius: '16px', boxShadow: '0 2px 10px rgba(0,0,0,0.08)', padding: '24px', marginBottom: '24px' }}>
        <h3 style={{ marginBottom: '16px' }}>Datos personales</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
          <input placeholder="Nombre completo" value={perfil.nombre}
            onChange={(e) => setPerfil({ ...perfil, nombre: e.target.value })} />
          <input placeholder="Teléfono / WhatsApp" value={perfil.telefono || ''}
            onChange={(e) => setPerfil({ ...perfil, telefono: e.target.value })} />
          <input placeholder="Localidad" value={perfil.localidad || ''}
            onChange={(e) => setPerfil({ ...perfil, localidad: e.target.value })} />
          <input placeholder="Provincia" value={perfil.provincia || ''}
            onChange={(e) => setPerfil({ ...perfil, provincia: e.target.value })} />
        </div>
        <h3 style={{ margin: '16px 0' }}>Datos profesionales</h3>
        <select value={prof.rubro} onChange={(e) => setProf({ ...prof, rubro: e.target.value })}>
          <option value="plomero">Plomero</option>
          <option value="electricista">Electricista</option>
          <option value="gasista">Gasista</option>
          <option value="constructor">Constructor</option>
          <option value="mecanico">Mecánico</option>
        </select>
        <textarea placeholder="Describí tu experiencia y servicios"
          value={prof.descripcion || ''}
          onChange={(e) => setProf({ ...prof, descripcion: e.target.value })}
          style={{ width: '100%', maxWidth: '100%', height: '100px', marginTop: '10px' }} />
        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '10px' }}>
          <input type="checkbox" checked={prof.disponible}
            onChange={(e) => setProf({ ...prof, disponible: e.target.checked })} />
          Disponible para trabajos
        </label>
        <br />
        <button onClick={guardarPerfil}>Guardar perfil</button>
        {mensaje && <p style={{ marginTop: '10px' }}>{mensaje}</p>}
      </div>

      {/* MENSAJES ESTILO MESSENGER */}
      <div style={{ background: 'white', borderRadius: '16px', boxShadow: '0 2px 10px rgba(0,0,0,0.08)', marginBottom: '24px', overflow: 'hidden' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid #f0f0f0' }}>
          <h3 style={{ margin: 0, fontSize: '16px' }}>💬 Mensajes</h3>
        </div>

        <div style={{ display: 'flex', height: '460px' }}>

          {/* Panel izquierdo — lista de conversaciones */}
          <div style={{
            width: '240px',
            flexShrink: 0,
            borderRight: '1px solid #f0f0f0',
            overflowY: 'auto',
            background: '#fafafa',
          }}>
            {conversaciones.length === 0 ? (
              <p style={{ color: '#999', fontSize: '13px', padding: '20px', textAlign: 'center' }}>Sin mensajes aún</p>
            ) : (
              conversaciones.map((c) => (
                <div
                  key={c.id}
                  onClick={() => abrirChat(c.id, c.nombre)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '10px',
                    padding: '12px 14px', cursor: 'pointer',
                    background: chatAbierto?.id === c.id ? '#fff3e8' : 'transparent',
                    borderLeft: chatAbierto?.id === c.id ? '3px solid #f4a261' : '3px solid transparent',
                    transition: 'background 0.15s',
                  }}
                  onMouseEnter={e => { if (chatAbierto?.id !== c.id) e.currentTarget.style.background = '#f5f5f5' }}
                  onMouseLeave={e => { if (chatAbierto?.id !== c.id) e.currentTarget.style.background = 'transparent' }}
                >
                  <img
                    src={c.foto || `https://ui-avatars.com/api/?name=${encodeURIComponent(c.nombre)}&background=f4a261&color=fff&size=80`}
                    alt={c.nombre}
                    style={{ width: '38px', height: '38px', borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }}
                  />
                  <span style={{ fontSize: '13px', fontWeight: chatAbierto?.id === c.id ? '600' : '500', color: '#1a1a2e', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {c.nombre}
                  </span>
                </div>
              ))
            )}
          </div>

          {/* Panel derecho — ventana de chat */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
            {!chatAbierto ? (
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#bbb' }}>
                <span style={{ fontSize: '40px', marginBottom: '10px' }}>💬</span>
                <p style={{ fontSize: '14px', margin: 0 }}>Seleccioná una conversación</p>
              </div>
            ) : (
              <>
                {/* Header del chat */}
                <div style={{
                  background: '#1a1a2e', padding: '12px 16px',
                  display: 'flex', alignItems: 'center', gap: '10px',
                }}>
                  <img
                    src={conversaciones.find(c => c.id === chatAbierto.id)?.foto ||
                      `https://ui-avatars.com/api/?name=${encodeURIComponent(chatAbierto.nombre)}&background=f4a261&color=fff&size=80`}
                    alt={chatAbierto.nombre}
                    style={{ width: '34px', height: '34px', borderRadius: '50%', objectFit: 'cover', border: '2px solid #f4a261' }}
                  />
                  <div>
                    <p style={{ color: 'white', margin: 0, fontWeight: '600', fontSize: '14px' }}>{chatAbierto.nombre}</p>
                    <p style={{ color: '#8899aa', margin: 0, fontSize: '11px' }}>Conversación privada</p>
                  </div>
                </div>

                {/* Burbujas */}
                <div style={{
                  flex: 1, overflowY: 'auto', padding: '16px',
                  background: '#f0f2f5', display: 'flex', flexDirection: 'column', gap: '6px',
                }}>
                  {mensajesChat.length === 0 && (
                    <p style={{ textAlign: 'center', color: '#999', fontSize: '13px', marginTop: '20px' }}>No hay mensajes aún.</p>
                  )}
                  {mensajesChat.map((m) => {
                    const esMio = m.de_id === userId
                    return (
                      <div key={m.id} style={{ display: 'flex', justifyContent: esMio ? 'flex-end' : 'flex-start', alignItems: 'flex-end', gap: '6px' }}>
                        {!esMio && (
                          <img
                            src={conversaciones.find(c => c.id === chatAbierto.id)?.foto ||
                              `https://ui-avatars.com/api/?name=${encodeURIComponent(chatAbierto.nombre)}&background=f4a261&color=fff&size=80`}
                            alt=""
                            style={{ width: '26px', height: '26px', borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }}
                          />
                        )}
                        <div style={{
                          background: esMio ? '#f4a261' : 'white',
                          color: esMio ? 'white' : '#1a1a2e',
                          padding: '8px 12px',
                          borderRadius: esMio ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                          maxWidth: '65%',
                          boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
                        }}>
                          <p style={{ margin: 0, fontSize: '13px', lineHeight: '1.4' }}>{m.contenido}</p>
                          <p style={{ margin: '3px 0 0', fontSize: '10px', opacity: 0.65, textAlign: 'right' }}>{formatHora(m.created_at)}</p>
                        </div>
                      </div>
                    )
                  })}
                  <div ref={bottomRef} />
                </div>

                {/* Input */}
                <div style={{
                  padding: '10px 14px', background: 'white',
                  borderTop: '1px solid #eee', display: 'flex', gap: '8px', alignItems: 'center',
                }}>
                  <input
                    placeholder="Escribí un mensaje..."
                    value={nuevoMensaje}
                    onChange={(e) => setNuevoMensaje(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && responder()}
                    style={{
                      flex: 1, border: '1px solid #e0e0e0', borderRadius: '20px',
                      padding: '8px 16px', fontSize: '13px', outline: 'none',
                      background: '#f5f5f5',
                    }}
                  />
                  <button
                    onClick={responder}
                    style={{
                      background: '#f4a261', color: 'white', border: 'none',
                      width: '36px', height: '36px', borderRadius: '50%',
                      cursor: 'pointer', fontSize: '16px', display: 'flex',
                      alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                    }}
                  >
                    ➤
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      <div style={{ background: 'white', borderRadius: '16px', boxShadow: '0 2px 10px rgba(0,0,0,0.08)', padding: '24px', marginBottom: '24px' }}>
        <h3 style={{ marginBottom: '16px' }}>Portfolio de trabajos</h3>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '16px' }}>
          <input type="file" accept="image/*" ref={archivoRef} style={{ maxWidth: '200px' }} />
          <input placeholder="Descripción del trabajo" value={descFoto}
            onChange={(e) => setDescFoto(e.target.value)} />
          <button onClick={subirFoto}>Subir foto</button>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '16px' }}>
          {trabajos.map((t) => (
            <div key={t.id} style={{ borderRadius: '10px', overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
              <img src={t.foto_url} alt={t.descripcion}
                style={{ width: '100%', height: '150px', objectFit: 'cover' }} />
              <p style={{ padding: '8px', fontSize: '13px', color: '#555' }}>{t.descripcion}</p>
            </div>
          ))}
        </div>
      </div>

      <div style={{ background: 'white', borderRadius: '16px', boxShadow: '0 2px 10px rgba(0,0,0,0.08)', padding: '24px', border: '1px solid #fde8e8' }}>
        <h3 style={{ marginBottom: '8px', color: '#c0392b' }}>⚠️ Zona de peligro</h3>
        <p style={{ color: '#666', fontSize: '14px', marginBottom: '16px' }}>
          Al borrar tu cuenta se eliminarán todos tus datos: perfil, trabajos, reseñas y mensajes. Esta acción no se puede deshacer.
        </p>
        {!confirmarBorrar ? (
          <button
            onClick={() => setConfirmarBorrar(true)}
            style={{ background: 'transparent', border: '1px solid #e74c3c', color: '#e74c3c', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer' }}
          >
            🗑️ Borrar mi cuenta
          </button>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <p style={{ color: '#e74c3c', fontWeight: '500' }}>¿Estás seguro? Esta acción es irreversible.</p>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                onClick={borrarCuenta}
                style={{ background: '#e74c3c', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer' }}
              >
                Sí, borrar todo
              </button>
              <button
                onClick={() => setConfirmarBorrar(false)}
                style={{ background: '#eee', color: '#333', border: 'none', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer' }}
              >
                Cancelar
              </button>
            </div>
          </div>
        )}
      </div>

    </div>
  )
}

export default DashProfesional