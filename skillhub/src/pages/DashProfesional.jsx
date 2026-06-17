import { RUBROS } from '../services/rubros'
import { useState, useEffect, useRef } from 'react'
import { supabase } from '../services/supabase'
import { useNavigate } from 'react-router-dom'

function DashProfesional() {
  const [perfil, setPerfil] = useState({ nombre: '', telefono: '', localidad: '', provincia: '', foto_perfil: '' })
  const [prof, setProf] = useState({ rubro: 'albanil', descripcion: '', disponible: true })
  const [userId, setUserId] = useState(null)
  const [mensaje, setMensaje] = useState('')
  const [notificaciones, setNotificaciones] = useState([])
  const [confirmarBorrar, setConfirmarBorrar] = useState(false)
  const [portafolios, setPortafolios] = useState([])
  const [nuevoPortTitulo, setNuevoPortTitulo] = useState('')
  const [nuevoPortDesc, setNuevoPortDesc] = useState('')
  const [editandoPort, setEditandoPort] = useState(null)
  const [descFotos, setDescFotos] = useState({})
  const avatarRef = useRef(null)
  const fotoRefs = useRef({})
  const navigate = useNavigate()

  useEffect(() => {
    async function cargarDatos() {
      const { data: { user } } = await supabase.auth.getUser()
      setUserId(user.id)
      const { data: perfilData } = await supabase.from('perfiles').select('*').eq('id', user.id).single()
      if (perfilData) setPerfil(perfilData)
      const { data: profData } = await supabase.from('profesionales').select('*').eq('id', user.id).single()
      if (profData) setProf(profData)
      cargarNotificaciones(user.id)
      cargarPortafolios(user.id)
    }
    cargarDatos()
  }, [])

  async function cargarNotificaciones(uid) {
    const { data } = await supabase.from('notificaciones').select('*').eq('usuario_id', uid).order('created_at', { ascending: false })
    if (data) setNotificaciones(data)
    // Marcar como leídas sin recargar la página
    await supabase.from('notificaciones').update({ leida: true }).eq('usuario_id', uid).eq('leida', false)
  }

  async function cargarPortafolios(uid) {
    // Join directo: trae portafolios + todas sus imágenes en una sola query
    const { data: ports } = await supabase
      .from('portafolios')
      .select('*, trabajos(*)')
      .eq('profesional_id', uid)
      .order('created_at')
    if (!ports) return
    // Normalizar para que cada portafolio tenga .imagenes igual que antes
    const portsNormalizados = ports.map(p => ({
      ...p,
      imagenes: p.trabajos || []
    }))
    setPortafolios(portsNormalizados)
  }

  async function crearPortafolio() {
    if (!nuevoPortTitulo.trim()) return
    await supabase.from('portafolios').insert({ profesional_id: userId, titulo: nuevoPortTitulo, descripcion: nuevoPortDesc })
    setNuevoPortTitulo('')
    setNuevoPortDesc('')
    cargarPortafolios(userId)
  }

  async function guardarEdicionPort(port) {
    await supabase.from('portafolios').update({ titulo: editandoPort.titulo, descripcion: editandoPort.descripcion }).eq('id', port.id)
    setEditandoPort(null)
    cargarPortafolios(userId)
  }

  async function eliminarPortafolio(portId) {
    if (!window.confirm('¿Eliminar este portafolio y todas sus imágenes?')) return
    await supabase.from('trabajos').delete().eq('portafolio_id', portId)
    await supabase.from('portafolios').delete().eq('id', portId)
    cargarPortafolios(userId)
  }

  async function subirFotoAPort(portId) {
    const ref = fotoRefs.current[portId]
    if (!ref?.files[0]) return
    const archivo = ref.files[0]
    const nombreArchivo = `${userId}/${Date.now()}_${archivo.name}`
    const { error } = await supabase.storage.from('trabajos').upload(nombreArchivo, archivo)
    if (error) { setMensaje('❌ Error subiendo la foto'); return }
    const { data: urlData } = supabase.storage.from('trabajos').getPublicUrl(nombreArchivo)
    await supabase.from('trabajos').insert({
      profesional_id: userId,
      portafolio_id: portId,
      foto_url: urlData.publicUrl,
      descripcion: descFotos[portId] || ''
    })
    setDescFotos({ ...descFotos, [portId]: '' })
    ref.value = ''
    cargarPortafolios(userId)
  }

  async function eliminarImagen(imgId, portId) {
    if (!window.confirm('¿Eliminar esta imagen?')) return
    await supabase.from('trabajos').delete().eq('id', imgId)
    cargarPortafolios(portId ? userId : userId)
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
    const { error: errorPerfil } = await supabase.from('perfiles').update(perfil).eq('id', userId)
    if (errorPerfil) { setMensaje('❌ Error guardando datos personales: ' + errorPerfil.message); return }

    // Usamos upsert: si la fila en profesionales no existe por un bug en el registro, la crea automaticamente
    const { error: errorProf } = await supabase
      .from('profesionales')
      .upsert({ ...prof, id: userId }, { onConflict: 'id' })
    if (errorProf) { setMensaje('❌ Error guardando perfil profesional: ' + errorProf.message); return }

    setMensaje('✅ Perfil guardado correctamente')
  }

  async function borrarCuenta() {
    await supabase.from('resenias').delete().eq('profesional_id', userId)
    await supabase.from('trabajos').delete().eq('profesional_id', userId)
    await supabase.from('portafolios').delete().eq('profesional_id', userId)
    await supabase.from('mensajes').delete().or(`de_id.eq.${userId},para_id.eq.${userId}`)
    await supabase.from('notificaciones').delete().eq('usuario_id', userId)
    await supabase.from('favoritos').delete().eq('profesional_id', userId)
    await supabase.from('profesionales').delete().eq('id', userId)
    await supabase.from('perfiles').delete().eq('id', userId)
    await supabase.auth.signOut()
    navigate('/login')
  }

  function formatFecha(timestamp) {
    return new Date(timestamp).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: '2-digit' })
  }

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '30px 20px' }}>

      {perfil.nombre && (
        <div style={{ background: 'linear-gradient(135deg, #1a1a2e, #0f3460)', borderRadius: '16px', padding: '24px 28px', marginBottom: '24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h2 style={{ color: 'white', margin: '0 0 4px', fontSize: '22px' }}>¡Hola, {perfil.nombre.split(' ')[0]}! 👋</h2>
            <p style={{ color: '#aab', margin: 0, fontSize: '14px' }}>Administrá tu perfil y tus servicios</p>
          </div>
          <div style={{ fontSize: '48px' }}>🛠️</div>
        </div>
      )}

      {/* Foto de perfil */}
      <div className="dash-foto-card" style={{ background: 'white', borderRadius: '16px', boxShadow: '0 2px 10px rgba(0,0,0,0.08)', padding: '24px', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '24px' }}>
        <img src={perfil.foto_perfil || 'https://via.placeholder.com/100x100?text=Foto'} alt="Foto de perfil"
          style={{ width: '100px', height: '100px', borderRadius: '50%', objectFit: 'cover', border: '3px solid #f4a261' }} />
        <div style={{ flex: 1 }}>
          <h2 style={{ marginBottom: '4px' }}>{perfil.nombre || 'Tu nombre'}</h2>
          <p style={{ color: '#666', marginBottom: '12px' }}>{prof.rubro} — {perfil.localidad}, {perfil.provincia}</p>
          <div className="dash-foto-botones" style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            <input type="file" accept="image/*" ref={avatarRef} style={{ fontSize: '12px', maxWidth: '160px', margin: 0 }} />
            <button onClick={subirAvatar} style={{ padding: '6px 12px', fontSize: '12px', margin: 0, whiteSpace: 'nowrap' }}>Cambiar foto</button>
          </div>
        </div>
      </div>

      {/* Notificaciones */}
      {notificaciones.length > 0 && (
        <div style={{ background: 'white', borderRadius: '16px', boxShadow: '0 2px 10px rgba(0,0,0,0.08)', padding: '24px', marginBottom: '24px' }}>
          <h3 style={{ marginBottom: '16px' }}>🔔 Notificaciones</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {notificaciones.map((n) => (
              <div key={n.id} style={{ padding: '12px 16px', borderRadius: '10px', background: n.leida ? '#f8f8f8' : '#fff3e8', border: n.leida ? '1px solid #eee' : '1px solid #f4a261', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '14px', color: '#333' }}>{n.mensaje}</span>
                <span style={{ fontSize: '11px', color: '#999', marginLeft: '12px', whiteSpace: 'nowrap' }}>{formatFecha(n.created_at)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Datos personales */}
      <div style={{ background: 'white', borderRadius: '16px', boxShadow: '0 2px 10px rgba(0,0,0,0.08)', padding: '24px', marginBottom: '24px' }}>
        <h3 style={{ marginBottom: '16px' }}>Datos personales</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
          <input placeholder="Nombre completo" value={perfil.nombre} onChange={(e) => setPerfil({ ...perfil, nombre: e.target.value })} />
          <input placeholder="Teléfono / WhatsApp" value={perfil.telefono || ''} onChange={(e) => setPerfil({ ...perfil, telefono: e.target.value })} />
          <input placeholder="Localidad" value={perfil.localidad || ''} onChange={(e) => setPerfil({ ...perfil, localidad: e.target.value })} />
          <input placeholder="Provincia" value={perfil.provincia || ''} onChange={(e) => setPerfil({ ...perfil, provincia: e.target.value })} />
        </div>
        <h3 style={{ margin: '16px 0' }}>Datos profesionales</h3>
        <select value={prof.rubro} onChange={(e) => setProf({ ...prof, rubro: e.target.value })}>
          {RUBROS.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
        </select>
        <textarea placeholder="Describí tu experiencia y servicios" value={prof.descripcion || ''}
          onChange={(e) => setProf({ ...prof, descripcion: e.target.value })}
          style={{ width: '100%', maxWidth: '100%', height: '100px', marginTop: '10px' }} />
        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '10px', width: '100%' }}>
          <input type="checkbox" checked={prof.disponible} onChange={(e) => setProf({ ...prof, disponible: e.target.checked })} style={{ width: 'auto', maxWidth: 'auto', flex: 'none' }} />
          Disponible para trabajos
        </label>
        <br />
        <button onClick={guardarPerfil}>Guardar perfil</button>
        {mensaje && <p style={{ marginTop: '10px' }}>{mensaje}</p>}
      </div>

      {/* Gestión de portafolios */}
      <div style={{ background: 'white', borderRadius: '16px', boxShadow: '0 2px 10px rgba(0,0,0,0.08)', padding: '24px', marginBottom: '24px' }}>
        <h3 style={{ marginBottom: '16px' }}>📸 Mis portafolios</h3>

        {/* Crear nuevo portafolio */}
        <div style={{ background: '#f8f8f8', borderRadius: '12px', padding: '16px', marginBottom: '20px', border: '1px dashed #ddd' }}>
          <p style={{ fontSize: '13px', fontWeight: '500', color: '#555', marginBottom: '10px' }}>+ Crear nuevo portafolio</p>
          <input placeholder="Título del portafolio (ej: Instalaciones eléctricas)"
            value={nuevoPortTitulo} onChange={(e) => setNuevoPortTitulo(e.target.value)}
            style={{ marginBottom: '6px' }} />
          <input placeholder="Descripción opcional"
            value={nuevoPortDesc} onChange={(e) => setNuevoPortDesc(e.target.value)}
            style={{ marginBottom: '10px' }} />
          <button onClick={crearPortafolio} style={{ padding: '8px 16px', fontSize: '13px' }}>Crear portafolio</button>
        </div>

        {portafolios.length === 0 && (
          <p style={{ color: '#999', fontSize: '13px' }}>No tenés portafolios aún. Creá uno arriba.</p>
        )}

        {portafolios.map((port) => (
          <div key={port.id} style={{ border: '1px solid #eee', borderRadius: '12px', padding: '16px', marginBottom: '16px' }}>

            {/* Header del portafolio */}
            {editandoPort?.id === port.id ? (
              <div style={{ marginBottom: '12px' }}>
                <input value={editandoPort.titulo} onChange={(e) => setEditandoPort({ ...editandoPort, titulo: e.target.value })} style={{ marginBottom: '6px' }} />
                <input value={editandoPort.descripcion || ''} placeholder="Descripción" onChange={(e) => setEditandoPort({ ...editandoPort, descripcion: e.target.value })} style={{ marginBottom: '10px' }} />
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button onClick={() => guardarEdicionPort(port)} style={{ padding: '6px 12px', fontSize: '12px' }}>Guardar</button>
                  <button onClick={() => setEditandoPort(null)} style={{ padding: '6px 12px', fontSize: '12px', background: '#eee', color: '#333' }}>Cancelar</button>
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                <div>
                  <h4 style={{ margin: '0 0 2px', color: '#1a1a2e' }}>{port.titulo}</h4>
                  {port.descripcion && <p style={{ fontSize: '12px', color: '#888', margin: 0 }}>{port.descripcion}</p>}
                </div>
                <div style={{ display: 'flex', gap: '6px' }}>
                  <button onClick={() => setEditandoPort({ id: port.id, titulo: port.titulo, descripcion: port.descripcion || '' })}
                    style={{ padding: '4px 10px', fontSize: '12px', background: '#f0f0f0', color: '#333', margin: 0 }}>✏️</button>
                  <button onClick={() => eliminarPortafolio(port.id)}
                    style={{ padding: '4px 10px', fontSize: '12px', background: '#fde8e8', color: '#c0392b', margin: 0 }}>🗑️</button>
                </div>
              </div>
            )}

            {/* Imágenes del portafolio */}
            {port.imagenes.length > 0 && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '10px', marginBottom: '14px' }}>
                {port.imagenes.map((img) => (
                  <div key={img.id} style={{ borderRadius: '8px', overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.1)', position: 'relative' }}>
                    <img src={img.foto_url} alt={img.descripcion} style={{ width: '100%', height: '100px', objectFit: 'cover', display: 'block' }} />
                    <button
                      onClick={() => eliminarImagen(img.id)}
                      style={{ position: 'absolute', top: '4px', right: '4px', background: 'rgba(0,0,0,0.6)', color: 'white', border: 'none', borderRadius: '50%', width: '22px', height: '22px', fontSize: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: 0, padding: 0 }}
                    >✕</button>
                    {img.descripcion && <p style={{ padding: '4px 6px', fontSize: '11px', color: '#555', margin: 0 }}>{img.descripcion}</p>}
                  </div>
                ))}
              </div>
            )}

            {/* Subir foto al portafolio */}
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center', background: '#fafafa', padding: '10px', borderRadius: '8px' }}>
              <input type="file" accept="image/*"
                ref={el => fotoRefs.current[port.id] = el}
                style={{ fontSize: '12px', maxWidth: '180px', margin: 0 }} />
              <input placeholder="Descripción (opcional)"
                value={descFotos[port.id] || ''}
                onChange={(e) => setDescFotos({ ...descFotos, [port.id]: e.target.value })}
                style={{ flex: 1, fontSize: '12px', margin: 0 }} />
              <button onClick={() => subirFotoAPort(port.id)}
                style={{ padding: '6px 12px', fontSize: '12px', margin: 0 }}>
                + Agregar foto
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Zona de peligro */}
      <div style={{ background: 'white', borderRadius: '16px', boxShadow: '0 2px 10px rgba(0,0,0,0.08)', padding: '24px', border: '1px solid #fde8e8' }}>
        <h3 style={{ marginBottom: '8px', color: '#c0392b' }}>⚠️ Zona de peligro</h3>
        <p style={{ color: '#666', fontSize: '14px', marginBottom: '16px' }}>
          Al borrar tu cuenta se eliminarán todos tus datos: perfil, trabajos, reseñas y mensajes. Esta acción no se puede deshacer.
        </p>
        {!confirmarBorrar ? (
          <button onClick={() => setConfirmarBorrar(true)}
            style={{ background: 'transparent', border: '1px solid #e74c3c', color: '#e74c3c', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer' }}>
            🗑️ Borrar mi cuenta
          </button>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <p style={{ color: '#e74c3c', fontWeight: '500' }}>¿Estás seguro? Esta acción es irreversible.</p>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={borrarCuenta} style={{ background: '#e74c3c', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer' }}>Sí, borrar todo</button>
              <button onClick={() => setConfirmarBorrar(false)} style={{ background: '#eee', color: '#333', border: 'none', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer' }}>Cancelar</button>
            </div>
          </div>
        )}
      </div>

    </div>
  )
}

export default DashProfesional