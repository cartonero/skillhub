import { useState, useEffect } from 'react'
import { supabase } from '../services/supabase'
import { useParams } from 'react-router-dom'

function PerfilProfesional() {
  const { id } = useParams()
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

      const { data: perfilData } = await supabase
        .from('perfiles').select('*').eq('id', id).single()
      if (perfilData) setPerfil(perfilData)

      const { data: profData } = await supabase
        .from('profesionales').select('*').eq('id', id).single()
      if (profData) setProf(profData)

      const { data: trabajosData } = await supabase
        .from('trabajos').select('*').eq('profesional_id', id)
      if (trabajosData) setTrabajos(trabajosData)

      const { data: reseniasData } = await supabase
        .from('resenias')
        .select('*, perfiles(nombre)')
        .eq('profesional_id', id)
      if (reseniasData) setResenias(reseniasData)
    }
    cargarTodo()
  }, [id])

  async function enviarResenia() {
    if (!userId) {
      setMensaje('❌ Tenés que iniciar sesión para calificar')
      return
    }
    const { error } = await supabase.from('resenias').insert({
      profesional_id: id,
      buscador_id: userId,
      estrellas,
      comentario
    })
    if (error) {
      setMensaje('❌ Error al enviar la reseña')
      return
    }
    setMensaje('✅ Reseña enviada correctamente')
    setComentario('')
    setEstrellas(5)
    const { data } = await supabase
      .from('resenias')
      .select('*, perfiles(nombre)')
      .eq('profesional_id', id)
    if (data) setResenias(data)
  }

  const promedio = resenias.length > 0
    ? (resenias.reduce((sum, r) => sum + r.estrellas, 0) / resenias.length).toFixed(1)
    : null

  if (!perfil || !prof) return <p>Cargando...</p>

  return (
    <div>
      <h2>{perfil.nombre || 'Sin nombre'}</h2>
      <p><strong>Rubro:</strong> {prof.rubro}</p>
      <p><strong>Localidad:</strong> {perfil.localidad} — {perfil.provincia}</p>
      <p><strong>Descripción:</strong> {prof.descripcion}</p>
      <p><strong>Disponible:</strong> {prof.disponible ? '✅ Sí' : '❌ No'}</p>
      {perfil.telefono && (
        <a href={`https://wa.me/${perfil.telefono}`} target="_blank">
          📱 Contactar por WhatsApp
        </a>
      )}
      {promedio && <p><strong>⭐ Promedio:</strong> {promedio} / 5 ({resenias.length} reseñas)</p>}

      <hr />
      <h3>Portfolio de trabajos</h3>
      {trabajos.length === 0 && <p>No hay trabajos cargados aún.</p>}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
        {trabajos.map((t) => (
          <div key={t.id}>
            <img src={t.foto_url} alt={t.descripcion}
              style={{ width: '200px', height: '150px', objectFit: 'cover' }} />
            <p>{t.descripcion}</p>
          </div>
        ))}
      </div>

      <hr />
      <h3>Reseñas ({resenias.length})</h3>
      {resenias.map((r) => (
        <div key={r.id} style={{ border: '1px solid #ccc', margin: '10px', padding: '10px' }}>
          <p><strong>{'⭐'.repeat(r.estrellas)}</strong> — {r.perfiles?.nombre || 'Usuario'}</p>
          <p>{r.comentario}</p>
        </div>
      ))}

      <hr />
      <h3>Dejar una reseña</h3>
      <div>
        <label>Estrellas: </label>
        <select value={estrellas} onChange={(e) => setEstrellas(Number(e.target.value))}>
          <option value={1}>⭐ 1</option>
          <option value={2}>⭐⭐ 2</option>
          <option value={3}>⭐⭐⭐ 3</option>
          <option value={4}>⭐⭐⭐⭐ 4</option>
          <option value={5}>⭐⭐⭐⭐⭐ 5</option>
        </select>
      </div>
      <textarea placeholder="Escribí tu comentario"
        value={comentario}
        onChange={(e) => setComentario(e.target.value)} />
      <br />
      <button onClick={enviarResenia}>Enviar reseña</button>
      {mensaje && <p>{mensaje}</p>}

      <br />
      <a href="/dash-buscador">← Volver al buscador</a>
    </div>
  )
}

export default PerfilProfesional