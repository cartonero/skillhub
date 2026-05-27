import { useState, useEffect } from 'react'
import { supabase } from '../services/supabase'
import { useParams, useNavigate } from 'react-router-dom'

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

  useEffect(() => {
    async function cargarTodo() {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) setUserId(user.id)
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

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '30px 20px' }}>

      <div style={{ background: 'white', borderRadius: '16px', boxShadow: '0 2px 10px rgba(0,0,0,0.08)', padding: '30px', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '24px' }}>
        <img
          src={perfil.foto_perfil || 'https://via.placeholder.com/100x100?text=Foto'}
          alt="Foto de perfil"
          style={{ width: '100px', height: '100px', borderRadius: '50%', objectFit: 'cover', border: '3px solid #f4a261' }}
        />
        <div style={{ flex: 1 }}>
          <h2 style={{ marginBottom: '4px' }}>{perfil.nombre || 'Sin nombre'}</h2>
          <p style={{ color: '#666', marginBottom: '8px' }}>{prof.rubro} — {perfil.localidad}, {perfil.provincia}</p>
          <p style={{ marginBottom: '8px' }}>{prof.descripcion}</p>
          <p>{prof.disponible ? '✅ Disponible' : '❌ No disponible'}</p>
          {promedio && <p style={{ marginTop: '8px' }}>⭐ <strong>{promedio}</strong> / 5 ({resenias.length} reseñas)</p>}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {perfil.telefono && (
            <a href={`https://wa.me/${perfil.telefono}`} target="_blank"
              style={{ background: '#25d366', color: 'white', padding: '10px 16px', borderRadius: '8px', textAlign: 'center' }}>
              📱 WhatsApp
            </a>
          )}
          <button onClick={() => navigate('/dash-buscador')}
            style={{ background: '#eee', color: '#333', padding: '10px 16px', borderRadius: '8px', border: 'none', cursor: 'pointer' }}>
            ← Volver
          </button>
        </div>
      </div>

      <div style={{ background: 'white', borderRadius: '16px', boxShadow: '0 2px 10px rgba(0,0,0,0.08)', padding: '24px', marginBottom: '24px' }}>
        <h3 style={{ marginBottom: '16px' }}>Portfolio de trabajos</h3>
        {trabajos.length === 0 && <p style={{ color: '#666' }}>No hay trabajos cargados aún.</p>}
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

      <div style={{ background: 'white', borderRadius: '16px', boxShadow: '0 2px 10px rgba(0,0,0,0.08)', padding: '24px', marginBottom: '24px' }}>
        <h3 style={{ marginBottom: '16px' }}>Reseñas ({resenias.length})</h3>
        {resenias.length === 0 && <p style={{ color: '#666' }}>Todavía no hay reseñas.</p>}
        {resenias.map((r) => (
          <div key={r.id} style={{ borderBottom: '1px solid #eee', padding: '12px 0' }}>
            <p><strong>{'⭐'.repeat(r.estrellas)}</strong> — {r.perfiles?.nombre || 'Usuario'}</p>
            <p style={{ color: '#555', marginTop: '4px' }}>{r.comentario}</p>
          </div>
        ))}
      </div>

      <div style={{ background: 'white', borderRadius: '16px', boxShadow: '0 2px 10px rgba(0,0,0,0.08)', padding: '24px' }}>
        <h3 style={{ marginBottom: '16px' }}>Dejar una reseña</h3>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
          <label>Estrellas:</label>
          <select value={estrellas} onChange={(e) => setEstrellas(Number(e.target.value))} style={{ width: 'auto' }}>
            <option value={1}>⭐ 1</option>
            <option value={2}>⭐⭐ 2</option>
            <option value={3}>⭐⭐⭐ 3</option>
            <option value={4}>⭐⭐⭐⭐ 4</option>
            <option value={5}>⭐⭐⭐⭐⭐ 5</option>
          </select>
        </div>
        <textarea placeholder="Escribí tu comentario" value={comentario}
          onChange={(e) => setComentario(e.target.value)}
          style={{ width: '100%', maxWidth: '100%', height: '80px' }} />
        <br />
        <button onClick={enviarResenia} style={{ marginTop: '10px' }}>Enviar reseña</button>
        {mensaje && <p style={{ marginTop: '10px' }}>{mensaje}</p>}
      </div>

    </div>
  )
}

export default PerfilProfesional