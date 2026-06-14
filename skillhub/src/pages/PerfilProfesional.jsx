import { getRubroColor, getRubroLabel } from '../services/rubros'
import { useState, useEffect } from 'react'
import { supabase } from '../services/supabase'
import { useParams, useNavigate } from 'react-router-dom'

function Estrellas({ valor, onChange }) {
  const [hover, setHover] = useState(0)
  return (
    <div style={{ display: 'flex', gap: '4px' }}>
      {[1,2,3,4,5].map((n) => (
        <span key={n} onClick={() => onChange && onChange(n)}
          onMouseEnter={() => onChange && setHover(n)}
          onMouseLeave={() => onChange && setHover(0)}
          style={{ fontSize: '28px', cursor: onChange ? 'pointer' : 'default', color: n <= (hover || valor) ? '#f4a261' : '#ddd', transition: 'color 0.15s, transform 0.15s', transform: onChange && n <= (hover || valor) ? 'scale(1.15)' : 'scale(1)', display: 'inline-block' }}>★</span>
      ))}
    </div>
  )
}

function EstrellasChicas({ valor }) {
  return (
    <div style={{ display: 'flex', gap: '1px' }}>
      {[1,2,3,4,5].map(n => (
        <span key={n} style={{ fontSize: '13px', color: n <= valor ? '#f4a261' : '#ddd' }}>★</span>
      ))}
    </div>
  )
}

function Lightbox({ imagen, onClose }) {
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])
  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.92)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, animation: 'fadeIn 0.2s ease' }}>
      <style>{`@keyframes fadeIn{from{opacity:0}to{opacity:1}} @keyframes zoomIn{from{transform:scale(0.85);opacity:0}to{transform:scale(1);opacity:1}}`}</style>
      <button onClick={onClose} style={{ position: 'absolute', top: '20px', right: '24px', background: 'rgba(255,255,255,0.15)', border: 'none', color: 'white', width: '40px', height: '40px', borderRadius: '50%', fontSize: '20px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
      <div onClick={e => e.stopPropagation()} style={{ animation: 'zoomIn 0.25s ease', maxWidth: '90vw', maxHeight: '90vh', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
        <img src={imagen.foto_url} alt={imagen.descripcion} style={{ maxWidth: '90vw', maxHeight: '80vh', objectFit: 'contain', borderRadius: '10px', boxShadow: '0 8px 40px rgba(0,0,0,0.5)' }} />
        {imagen.descripcion && <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: '14px', textAlign: 'center', margin: 0 }}>{imagen.descripcion}</p>}
      </div>
    </div>
  )
}

function Carrusel({ imagenes, onImagenClick }) {
  const [indice, setIndice] = useState(0)
  const total = imagenes.length
  if (total === 0) return null
  const anterior = () => setIndice((indice - 1 + total) % total)
  const siguiente = () => setIndice((indice + 1) % total)
  const visibles = []
  for (let i = 0; i < Math.min(3, total); i++) visibles.push(imagenes[(indice + i) % total])
  return (
    <div style={{ position: 'relative' }}>
      <div style={{ display: 'grid', gridTemplateColumns: `repeat(${Math.min(3, total)}, 1fr)`, gap: '12px' }}>
        {visibles.map((img, i) => (
          <div key={img.id + '-' + i} onClick={() => onImagenClick(img)}
            style={{ borderRadius: '10px', overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', cursor: 'pointer', transition: 'transform 0.2s' }}
            onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.03)'}
            onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
          >
            <img src={img.foto_url} alt={img.descripcion} style={{ width: '100%', height: '160px', objectFit: 'cover', display: 'block' }} />
            {img.descripcion && <p style={{ padding: '8px', fontSize: '12px', color: '#555', margin: 0, background: 'white' }}>{img.descripcion}</p>}
          </div>
        ))}
      </div>
      {total > 3 && (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '12px', marginTop: '12px' }}>
          <button onClick={anterior} style={{ background: '#1a1a2e', color: 'white', border: 'none', width: '32px', height: '32px', borderRadius: '50%', cursor: 'pointer', fontSize: '14px', margin: 0, padding: 0 }}>‹</button>
          <span style={{ fontSize: '12px', color: '#999' }}>{indice + 1} - {Math.min(indice + 3, total)} de {total}</span>
          <button onClick={siguiente} style={{ background: '#1a1a2e', color: 'white', border: 'none', width: '32px', height: '32px', borderRadius: '50%', cursor: 'pointer', fontSize: '14px', margin: 0, padding: 0 }}>›</button>
        </div>
      )}
      {total > 1 && total <= 3 && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: '6px', marginTop: '10px' }}>
          {imagenes.map((_, i) => (
            <div key={i} onClick={() => setIndice(i)} style={{ width: '8px', height: '8px', borderRadius: '50%', background: i === indice ? '#f4a261' : '#ddd', cursor: 'pointer', transition: 'background 0.2s' }} />
          ))}
        </div>
      )}
    </div>
  )
}

function PerfilProfesional() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [perfil, setPerfil] = useState(null)
  const [prof, setProf] = useState(null)
  const [portafolios, setPortafolios] = useState([])
  const [resenias, setResenias] = useState([])
  const [estrellas, setEstrellas] = useState(5)
  const [comentario, setComentario] = useState('')
  const [mensaje, setMensaje] = useState('')
  const [userId, setUserId] = useState(null)
  const [nombreBuscador, setNombreBuscador] = useState('')
  const [fotoBuscador, setFotoBuscador] = useState(null)
  const [lightbox, setLightbox] = useState(null)
  const [editandoResenia, setEditandoResenia] = useState(null)
  const [editEstrellas, setEditEstrellas] = useState(5)
  const [editComentario, setEditComentario] = useState('')

  useEffect(() => {
    async function cargarTodo() {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setUserId(user.id)
        const { data: pb } = await supabase.from('perfiles').select('nombre, foto_perfil').eq('id', user.id).single()
        if (pb?.nombre) setNombreBuscador(pb.nombre)
        if (pb?.foto_perfil) setFotoBuscador(pb.foto_perfil)
      }
      const { data: perfilData } = await supabase.from('perfiles').select('*').eq('id', id).single()
      if (perfilData) setPerfil(perfilData)
      const { data: profData } = await supabase.from('profesionales').select('*').eq('id', id).single()
      if (profData) setProf(profData)
      await cargarPortafolios()
      await cargarResenias()
    }
    cargarTodo()
  }, [id])

  async function cargarResenias() {
    const { data } = await supabase.from('resenias').select('*, perfiles(nombre, foto_perfil)').eq('profesional_id', id).order('created_at', { ascending: false })
    if (data) setResenias(data)
  }

  async function cargarPortafolios() {
    const { data: ports } = await supabase.from('portafolios').select('*').eq('profesional_id', id).order('created_at')
    if (!ports) return
    const portsConImagenes = await Promise.all(ports.map(async (p) => {
      const { data: imgs } = await supabase.from('trabajos').select('*').eq('portafolio_id', p.id)
      return { ...p, imagenes: imgs || [] }
    }))
    const { data: sinPortafolio } = await supabase.from('trabajos').select('*').eq('profesional_id', id).is('portafolio_id', null)
    const todos = [...portsConImagenes]
    if (sinPortafolio && sinPortafolio.length > 0) todos.unshift({ id: 'sin-portafolio', titulo: 'Trabajos', descripcion: '', imagenes: sinPortafolio })
    setPortafolios(todos)
  }

  async function enviarResenia() {
    if (!userId) { setMensaje('❌ Tenés que iniciar sesión para calificar'); return }
    if (!comentario.trim()) { setMensaje('❌ Escribí un comentario'); return }
    const { error } = await supabase.from('resenias').insert({ profesional_id: id, buscador_id: userId, estrellas, comentario })
    if (error) { setMensaje('❌ Error al enviar la reseña'); return }
    await supabase.from('notificaciones').insert({
      usuario_id: id,
      mensaje: `⭐ ${nombreBuscador || 'Un buscador'} te dejó una reseña de ${estrellas} estrella${estrellas !== 1 ? 's' : ''}.`,
      leida: false,
    })
    setMensaje('✅ ¡Reseña publicada!')
    setComentario('')
    setEstrellas(5)
    await cargarResenias()
  }

  async function guardarEdicion(reseniaId) {
    await supabase.from('resenias').update({ estrellas: editEstrellas, comentario: editComentario }).eq('id', reseniaId)
    setEditandoResenia(null)
    await cargarResenias()
  }

  async function eliminarResenia(reseniaId) {
    if (!window.confirm('¿Estás seguro que querés eliminar esta reseña? Esta acción no se puede deshacer.')) return
    await supabase.from('resenias').delete().eq('id', reseniaId)
    await cargarResenias()
  }

  const promedio = resenias.length > 0
    ? (resenias.reduce((sum, r) => sum + r.estrellas, 0) / resenias.length).toFixed(1)
    : null

  const distribucion = [5,4,3,2,1].map(n => ({
    estrellas: n,
    cantidad: resenias.filter(r => r.estrellas === n).length,
    porcentaje: resenias.length > 0 ? Math.round((resenias.filter(r => r.estrellas === n).length / resenias.length) * 100) : 0
  }))

  if (!perfil || !prof) return <p style={{ textAlign: 'center', marginTop: '40px' }}>Cargando...</p>

  const colorRubro = getRubroColor(prof.rubro)

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '30px 20px' }}>

      {lightbox && <Lightbox imagen={lightbox} onClose={() => setLightbox(null)} />}

      {/* Header */}
      <div style={{ background: 'white', borderRadius: '16px', boxShadow: '0 2px 10px rgba(0,0,0,0.08)', overflow: 'hidden', marginBottom: '24px' }}>
        <div style={{ background: 'linear-gradient(135deg, #1a1a2e, #0f3460)', height: '80px' }} />
        <div style={{ padding: '0 30px 30px' }}>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: '20px', marginTop: '-40px', marginBottom: '16px' }}>
            <img src={perfil.foto_perfil || `https://ui-avatars.com/api/?name=${encodeURIComponent(perfil.nombre || 'P')}&background=f4a261&color=fff&size=120`}
              alt="Foto de perfil" style={{ width: '100px', height: '100px', borderRadius: '50%', objectFit: 'cover', border: '4px solid white', boxShadow: '0 2px 8px rgba(0,0,0,0.2)', flexShrink: 0 }} />
            <div style={{ paddingBottom: '4px' }}>
              <h2 style={{ margin: '0 0 4px', color: '#1a1a2e' }}>{perfil.nombre || 'Sin nombre'}</h2>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <span style={{ background: colorRubro.bg, color: colorRubro.color, padding: '2px 10px', borderRadius: '999px', fontSize: '12px', fontWeight: '500', textTransform: 'capitalize' }}>{prof.rubro}</span>
                <span style={{ color: '#888', fontSize: '13px' }}>📍 {perfil.localidad}, {perfil.provincia}</span>
              </div>
            </div>
          </div>
          <p style={{ color: '#555', marginBottom: '12px', lineHeight: '1.6' }}>{prof.descripcion}</p>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap', marginBottom: '20px' }}>
            <span style={{ fontSize: '14px' }}>{prof.disponible ? '✅ Disponible' : '❌ No disponible'}</span>
            {promedio ? <span style={{ fontSize: '14px' }}>⭐ <strong>{promedio}</strong> / 5 ({resenias.length} reseñas)</span>
              : <span style={{ fontSize: '14px', color: '#999' }}>⭐ Sin reseñas aún</span>}
          </div>
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            {perfil.telefono && <a href={`https://wa.me/${perfil.telefono}`} target="_blank" style={{ background: '#25d366', color: 'white', padding: '10px 18px', borderRadius: '8px', textDecoration: 'none', fontSize: '14px' }}>📱 WhatsApp</a>}
            {userId && userId !== id && <button onClick={() => navigate(`/chat/${id}`)} style={{ background: '#1a1a2e', color: 'white', padding: '10px 18px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontSize: '14px' }}>💬 Enviar mensaje</button>}
            <button onClick={() => navigate('/dash-buscador')} style={{ background: '#f0f0f0', color: '#555', padding: '10px 18px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontSize: '14px' }}>← Volver</button>
          </div>
        </div>
      </div>

      {/* Portafolios */}
      {portafolios.map((port) => (
        <div key={port.id} style={{ background: 'white', borderRadius: '16px', boxShadow: '0 2px 10px rgba(0,0,0,0.08)', padding: '24px', marginBottom: '24px' }}>
          <h3 style={{ marginBottom: '4px' }}>📸 {port.titulo || 'Portfolio'}</h3>
          {port.descripcion && <p style={{ color: '#888', fontSize: '13px', marginBottom: '16px' }}>{port.descripcion}</p>}
          {!port.descripcion && <div style={{ marginBottom: '16px' }} />}
          {port.imagenes.length === 0 ? <p style={{ color: '#999', fontSize: '13px' }}>Sin imágenes aún.</p>
            : <Carrusel imagenes={port.imagenes} onImagenClick={setLightbox} />}
        </div>
      ))}
      {portafolios.length === 0 && (
        <div style={{ background: 'white', borderRadius: '16px', boxShadow: '0 2px 10px rgba(0,0,0,0.08)', padding: '24px', marginBottom: '24px' }}>
          <h3 style={{ marginBottom: '16px' }}>📸 Portfolio de trabajos</h3>
          <p style={{ color: '#666' }}>No hay trabajos cargados aún.</p>
        </div>
      )}

      {/* RESEÑAS */}
      <div style={{ background: 'white', borderRadius: '16px', boxShadow: '0 2px 10px rgba(0,0,0,0.08)', overflow: 'hidden', marginBottom: '24px' }}>
        <div style={{ padding: '24px 24px 0' }}>
          <h3 style={{ margin: '0 0 20px' }}>⭐ Calificaciones y reseñas</h3>

          {resenias.length > 0 && (
            <div style={{ display: 'flex', gap: '24px', alignItems: 'center', padding: '20px', background: '#fafafa', borderRadius: '12px', marginBottom: '24px', flexWrap: 'wrap' }}>
              <div style={{ textAlign: 'center', minWidth: '80px' }}>
                <div style={{ fontSize: '52px', fontWeight: '700', color: '#1a1a2e', lineHeight: 1 }}>{promedio}</div>
                <div style={{ display: 'flex', justifyContent: 'center', gap: '2px', margin: '6px 0' }}>
                  {[1,2,3,4,5].map(n => <span key={n} style={{ fontSize: '16px', color: n <= Math.round(promedio) ? '#f4a261' : '#ddd' }}>★</span>)}
                </div>
                <div style={{ fontSize: '12px', color: '#888' }}>{resenias.length} reseña{resenias.length !== 1 ? 's' : ''}</div>
              </div>
              <div style={{ flex: 1, minWidth: '160px' }}>
                {distribucion.map(d => (
                  <div key={d.estrellas} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                    <span style={{ fontSize: '12px', color: '#666', width: '12px', textAlign: 'right' }}>{d.estrellas}</span>
                    <span style={{ fontSize: '12px', color: '#f4a261' }}>★</span>
                    <div style={{ flex: 1, height: '8px', background: '#eee', borderRadius: '4px', overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${d.porcentaje}%`, background: '#f4a261', borderRadius: '4px', transition: 'width 0.4s ease' }} />
                    </div>
                    <span style={{ fontSize: '12px', color: '#999', width: '28px' }}>{d.cantidad}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Formulario nueva reseña */}
        <div style={{ padding: '0 24px 24px', borderBottom: '1px solid #f0f0f0' }}>
          <h4 style={{ margin: '0 0 14px', color: '#333', fontSize: '15px' }}>Dejá tu opinión</h4>
          <div style={{ marginBottom: '14px' }}>
            <p style={{ fontSize: '13px', color: '#666', margin: '0 0 8px' }}>¿Cómo calificás el servicio?</p>
            <Estrellas valor={estrellas} onChange={setEstrellas} />
          </div>
          <textarea placeholder="Contá tu experiencia con este profesional..." value={comentario}
            onChange={(e) => setComentario(e.target.value)}
            style={{ width: '100%', maxWidth: '100%', height: '90px', resize: 'vertical', borderRadius: '8px', border: '1.5px solid #e0e0e0', padding: '10px 12px', fontSize: '14px', fontFamily: 'inherit' }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '10px', flexWrap: 'wrap' }}>
            <button onClick={enviarResenia} style={{ padding: '10px 24px', fontSize: '14px', margin: 0 }}>Publicar reseña</button>
            {mensaje && <span style={{ fontSize: '13px', color: mensaje.includes('✅') ? '#1e8449' : '#c0392b', fontWeight: '500' }}>{mensaje}</span>}
          </div>
        </div>

        {/* Lista de reseñas */}
        <div style={{ padding: '0 24px 8px' }}>
          {resenias.length === 0 && <p style={{ color: '#999', fontSize: '14px', textAlign: 'center', padding: '24px 0' }}>Todavía no hay reseñas. ¡Sé el primero!</p>}
          {resenias.map((r, i) => (
            <div key={r.id} style={{ padding: '18px 0', borderBottom: i < resenias.length - 1 ? '1px solid #f5f5f5' : 'none' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                {/* Avatar */}
                {r.perfiles?.foto_perfil
                  ? <img src={r.perfiles.foto_perfil} alt={r.perfiles?.nombre} style={{ width: '38px', height: '38px', borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
                  : <div style={{ width: '38px', height: '38px', borderRadius: '50%', background: '#1a1a2e', color: '#f4a261', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '600', fontSize: '14px', flexShrink: 0 }}>
                      {(r.perfiles?.nombre || 'U')[0].toUpperCase()}
                    </div>
                }
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '8px' }}>
                    <div>
                      <p style={{ margin: '0 0 2px', fontWeight: '600', fontSize: '14px', color: '#1a1a2e' }}>{r.perfiles?.nombre || 'Usuario'}</p>
                      <EstrellasChicas valor={r.estrellas} />
                    </div>
                    {/* Botones editar/eliminar solo para el autor */}
                    {userId === r.buscador_id && (
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <button onClick={() => { setEditandoResenia(r.id); setEditEstrellas(r.estrellas); setEditComentario(r.comentario) }}
                          style={{ background: '#f0f0f0', color: '#555', border: 'none', padding: '4px 10px', borderRadius: '6px', fontSize: '12px', cursor: 'pointer', margin: 0 }}>✏️ Editar</button>
                        <button onClick={() => eliminarResenia(r.id)}
                          style={{ background: '#fde8e8', color: '#c0392b', border: 'none', padding: '4px 10px', borderRadius: '6px', fontSize: '12px', cursor: 'pointer', margin: 0 }}>🗑️ Eliminar</button>
                      </div>
                    )}
                  </div>

                  {/* Formulario de edición inline */}
                  {editandoResenia === r.id ? (
                    <div style={{ marginTop: '10px', background: '#f8f8f8', padding: '12px', borderRadius: '8px' }}>
                      <p style={{ fontSize: '12px', color: '#666', margin: '0 0 6px' }}>Nueva calificación:</p>
                      <Estrellas valor={editEstrellas} onChange={setEditEstrellas} />
                      <textarea value={editComentario} onChange={(e) => setEditComentario(e.target.value)}
                        style={{ width: '100%', maxWidth: '100%', height: '70px', marginTop: '8px', borderRadius: '8px', border: '1.5px solid #e0e0e0', padding: '8px 10px', fontSize: '13px', fontFamily: 'inherit', resize: 'vertical' }} />
                      <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                        <button onClick={() => guardarEdicion(r.id)} style={{ padding: '6px 14px', fontSize: '12px', margin: 0 }}>Guardar</button>
                        <button onClick={() => setEditandoResenia(null)} style={{ padding: '6px 14px', fontSize: '12px', background: '#eee', color: '#333', margin: 0 }}>Cancelar</button>
                      </div>
                    </div>
                  ) : (
                    r.comentario && <p style={{ margin: '6px 0 0', fontSize: '14px', color: '#444', lineHeight: '1.6' }}>{r.comentario}</p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  )
}

export default PerfilProfesional