import { useState, useEffect } from 'react'
import { supabase } from '../services/supabase'
import { useParams, useNavigate } from 'react-router-dom'

const rubroColores = {
  plomero: { bg: '#e8f4fd', color: '#1a6fa8' },
  electricista: { bg: '#fef9e7', color: '#b7950b' },
  gasista: { bg: '#fdebd0', color: '#ca6f1e' },
  constructor: { bg: '#eafaf1', color: '#1e8449' },
  mecanico: { bg: '#f4ecf7', color: '#7d3c98' },
}

function PerfilProfesional() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [perfil, setPerfil] = useState(null)
  const [prof, setProf] = useState(null)
  const [trabajos, setTrabajos] = useState([])
  const [resenias, setResenias] = useState([])
  const [estrellas, setEstrellas] = useState(5)
  const [comentario, setComentario] = useState('')
  const [mensaje, setMensaje] = useState('')
  const [userId, setUserId] = useState(null)
  const [nombreBuscador, setNombreBuscador] = useState('')

  useEffect(() => {
    async function cargarTodo() {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setUserId(user.id)
        const { data: perfilBuscador } = await supabase.from('perfiles').select('nombre').eq('id', user.id).single()
        if (perfilBuscador?.nombre) setNombreBuscador(perfilBuscador.nombre)
      }
      const { data: perfilData } = await supabase.from('perfiles').select('*').eq('id', id).single()
      if (perfilData) setPerfil(perfilData)
      const { data: profData } = await supabase.from('profesionales').select('*').eq('id', id).single()
      if (profData) setProf(profData)
      const { data: trabajosData } = await supabase.from('trabajos').select('*').eq('profesional_id', id)
      if (trabajosData) setTrabajos(trabajosData)
      const { data: reseniasData } = await supabase.from('resenias').select('*, perfiles(nombre)').eq('profesional_id', id)
      if (reseniasData) setResenias(reseniasData)
    }
    cargarTodo()
  }, [id])

  async function enviarResenia() {
    if (!userId) { setMensaje('❌ Tenés que iniciar sesión para calificar'); return }
    const { error } = await supabase.from('resenias').insert({ profesional_id: id, buscador_id: userId, estrellas, comentario })
    if (error) { setMensaje('❌ Error al enviar la reseña'); return }
    await supabase.from('notificaciones').insert({
      usuario_id: id,
      mensaje: `⭐ ${nombreBuscador || 'Un buscador'} te dejó una reseña de ${estrellas} estrella${estrellas !== 1 ? 's' : ''}.`,
      leida: false,
    })
    setMensaje('✅ Reseña enviada correctamente')
    setComentario('')
    setEstrellas(5)
    const { data } = await supabase.from('resenias').select('*, perfiles(nombre)').eq('profesional_id', id)
    if (data) setResenias(data)
  }

  const promedio = resenias.length > 0
    ? (resenias.reduce((sum, r) => sum + r.estrellas, 0) / resenias.length).toFixed(1)
    : null

  if (!perfil || !prof) return <p style={{ textAlign: 'center', marginTop: '40px' }}>Cargando...</p>

  const colorRubro = rubroColores[prof.rubro] || { bg: '#f0f0f0', color: '#555' }

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '30px 20px' }}>

      {/* Header del perfil */}
      <div style={{ background: 'white', borderRadius: '16px', boxShadow: '0 2px 10px rgba(0,0,0,0.08)', overflow: 'hidden', marginBottom: '24px' }}>
        <div style={{ background: 'linear-gradient(135deg, #1a1a2e, #0f3460)', height: '80px' }} />
        <div style={{ padding: '0 30px 30px' }}>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: '20px', marginTop: '-40px', marginBottom: '16px' }}>
            <img
              src={perfil.foto_perfil || `https://ui-avatars.com/api/?name=${encodeURIComponent(perfil.nombre || 'P')}&background=f4a261&color=fff&size=120`}
              alt="Foto de perfil"
              style={{ width: '100px', height: '100px', borderRadius: '50%', objectFit: 'cover', border: '4px solid white', boxShadow: '0 2px 8px rgba(0,0,0,0.2)', flexShrink: 0 }}
            />
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
            {promedio
              ? <span style={{ fontSize: '14px' }}>⭐ <strong>{promedio}</strong> / 5 ({resenias.length} reseñas)</span>
              : <span style={{ fontSize: '14px', color: '#999' }}>⭐ Sin reseñas aún</span>
            }
          </div>

          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            {perfil.telefono && (
              <a href={`https://wa.me/${perfil.telefono}`} target="_blank"
                style={{ background: '#25d366', color: 'white', padding: '10px 18px', borderRadius: '8px', textDecoration: 'none', fontSize: '14px' }}>
                📱 WhatsApp
              </a>
            )}
            {userId && userId !== id && (
              <button onClick={() => navigate(`/chat/${id}`)}
                style={{ background: '#1a1a2e', color: 'white', padding: '10px 18px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontSize: '14px' }}>
                💬 Enviar mensaje
              </button>
            )}
            <button onClick={() => navigate('/dash-buscador')}
              style={{ background: '#f0f0f0', color: '#555', padding: '10px 18px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontSize: '14px' }}>
              ← Volver
            </button>
          </div>
        </div>
      </div>

      {/* Portfolio */}
      <div style={{ background: 'white', borderRadius: '16px', boxShadow: '0 2px 10px rgba(0,0,0,0.08)', padding: '24px', marginBottom: '24px' }}>
        <h3 style={{ marginBottom: '16px' }}>📸 Portfolio de trabajos</h3>
        {trabajos.length === 0 && <p style={{ color: '#666' }}>No hay trabajos cargados aún.</p>}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '16px' }}>
          {trabajos.map((t) => (
            <div key={t.id} style={{ borderRadius: '10px', overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', transition: 'transform 0.2s' }}
              onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.02)'}
              onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
            >
              <img src={t.foto_url} alt={t.descripcion} style={{ width: '100%', height: '150px', objectFit: 'cover' }} />
              <p style={{ padding: '8px', fontSize: '13px', color: '#555', margin: 0 }}>{t.descripcion}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Reseñas */}
      <div style={{ background: 'white', borderRadius: '16px', boxShadow: '0 2px 10px rgba(0,0,0,0.08)', padding: '24px', marginBottom: '24px' }}>
        <h3 style={{ marginBottom: '16px' }}>💬 Reseñas ({resenias.length})</h3>
        {resenias.length === 0 && <p style={{ color: '#666' }}>Todavía no hay reseñas.</p>}
        {resenias.map((r) => (
          <div key={r.id} style={{ borderBottom: '1px solid #f0f0f0', padding: '14px 0' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <span>{'⭐'.repeat(r.estrellas)}</span>
              <span style={{ fontWeight: '500', fontSize: '14px', color: '#333' }}>{r.perfiles?.nombre || 'Usuario'}</span>
            </div>
            <p style={{ color: '#666', fontSize: '14px', margin: 0 }}>{r.comentario}</p>
          </div>
        ))}
      </div>

      {/* Dejar reseña */}
      <div style={{ background: 'white', borderRadius: '16px', boxShadow: '0 2px 10px rgba(0,0,0,0.08)', padding: '24px' }}>
        <h3 style={{ marginBottom: '16px' }}>⭐ Dejar una reseña</h3>
        <div style={{ marginBottom: '12px' }}>
          <label style={{ fontSize: '13px', fontWeight: '500', color: '#555', display: 'block', marginBottom: '4px' }}>Calificación</label>
          <select value={estrellas} onChange={(e) => setEstrellas(Number(e.target.value))} style={{ width: 'auto' }}>
            <option value={1}>⭐ 1</option>
            <option value={2}>⭐⭐ 2</option>
            <option value={3}>⭐⭐⭐ 3</option>
            <option value={4}>⭐⭐⭐⭐ 4</option>
            <option value={5}>⭐⭐⭐⭐⭐ 5</option>
          </select>
        </div>
        <div style={{ marginBottom: '12px' }}>
          <label style={{ fontSize: '13px', fontWeight: '500', color: '#555', display: 'block', marginBottom: '4px' }}>Comentario</label>
          <textarea placeholder="Contá tu experiencia con este profesional..." value={comentario}
            onChange={(e) => setComentario(e.target.value)}
            style={{ width: '100%', maxWidth: '100%', height: '80px' }} />
        </div>
        <button onClick={enviarResenia}>Enviar reseña</button>
        {mensaje && <p style={{ marginTop: '10px' }}>{mensaje}</p>}
      </div>

    </div>
  )
}

export default PerfilProfesional