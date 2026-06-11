import { useState, useEffect } from 'react'
import { supabase } from '../services/supabase'
import { Link } from 'react-router-dom'

function DashBuscador() {
  const [profesionales, setProfesionales] = useState([])
  const [rubro, setRubro] = useState('')
  const [localidad, setLocalidad] = useState('')
  const [userId, setUserId] = useState(null)
  const [favoritos, setFavoritos] = useState([])
  const [vistaFavoritos, setVistaFavoritos] = useState(false)
  const [nombreUsuario, setNombreUsuario] = useState('')

  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setUserId(user.id)
        cargarFavoritos(user.id)
        const { data: perfilData } = await supabase.from('perfiles').select('nombre').eq('id', user.id).single()
        if (perfilData?.nombre) setNombreUsuario(perfilData.nombre.split(' ')[0])
      }
      buscar()
    }
    init()
  }, [])

  async function cargarFavoritos(uid) {
    const { data } = await supabase
      .from('favoritos')
      .select('profesional_id')
      .eq('buscador_id', uid)
    if (data) setFavoritos(data.map(f => f.profesional_id))
  }

  async function toggleFavorito(profesionalId) {
    if (!userId) return
    const esFavorito = favoritos.includes(profesionalId)
    if (esFavorito) {
      await supabase.from('favoritos').delete()
        .eq('buscador_id', userId)
        .eq('profesional_id', profesionalId)
      setFavoritos(favoritos.filter(id => id !== profesionalId))
    } else {
      await supabase.from('favoritos').insert({ buscador_id: userId, profesional_id: profesionalId })
      setFavoritos([...favoritos, profesionalId])
    }
  }

  async function buscar() {
    let query = supabase
      .from('profesionales')
      .select(`
        id,
        rubro,
        descripcion,
        disponible,
        perfiles (nombre, telefono, localidad, provincia, foto_perfil),
        resenias (estrellas)
      `)
    if (rubro) query = query.eq('rubro', rubro)
    const { data, error } = await query
    if (error) console.error(error)
    if (data) {
      let resultado = data
      if (localidad) {
        resultado = data.filter(p =>
          p.perfiles?.localidad?.toLowerCase().includes(localidad.toLowerCase())
        )
      }
      setProfesionales(resultado)
    }
  }

  function calcularPromedio(resenias) {
    if (!resenias || resenias.length === 0) return null
    const suma = resenias.reduce((acc, r) => acc + r.estrellas, 0)
    return (suma / resenias.length).toFixed(1)
  }

  const rubroColores = {
    plomero: { bg: '#e8f4fd', color: '#1a6fa8' },
    electricista: { bg: '#fef9e7', color: '#b7950b' },
    gasista: { bg: '#fdebd0', color: '#ca6f1e' },
    constructor: { bg: '#eafaf1', color: '#1e8449' },
    mecanico: { bg: '#f4ecf7', color: '#7d3c98' },
  }

  const listaMostrada = vistaFavoritos
    ? profesionales.filter(p => favoritos.includes(p.id))
    : profesionales

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto', padding: '30px 20px' }}>

      {nombreUsuario && (
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
              ¡Bienvenido, {nombreUsuario}! 👋
            </h2>
            <p style={{ color: '#aab', margin: 0, fontSize: '14px' }}>
              Encontrá el profesional que necesitás
            </p>
          </div>
          <div style={{ fontSize: '48px' }}>🔧</div>
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h2 style={{ margin: 0 }}>{vistaFavoritos ? '❤️ Mis favoritos' : '🔍 Buscar profesionales'}</h2>
        <button
          onClick={() => setVistaFavoritos(!vistaFavoritos)}
          style={{
            background: vistaFavoritos ? '#f4a261' : 'white',
            color: vistaFavoritos ? 'white' : '#f4a261',
            border: '1px solid #f4a261',
            padding: '8px 16px',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '14px',
          }}
        >
          {vistaFavoritos ? '← Ver todos' : '❤️ Mis favoritos'}
        </button>
      </div>

      {!vistaFavoritos && (
        <div style={{ background: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 2px 10px rgba(0,0,0,0.08)', marginBottom: '24px', display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <select value={rubro} onChange={(e) => setRubro(e.target.value)} style={{ flex: 1 }}>
            <option value="">Todos los rubros</option>
            <option value="plomero">Plomero</option>
            <option value="electricista">Electricista</option>
            <option value="gasista">Gasista</option>
            <option value="constructor">Constructor</option>
            <option value="mecanico">Mecánico</option>
          </select>
          <input placeholder="Localidad" value={localidad}
            onChange={(e) => setLocalidad(e.target.value)} style={{ flex: 1 }} />
          <button onClick={buscar}>Buscar</button>
        </div>
      )}

      <div>
        {listaMostrada.length === 0 && (
          <p style={{ textAlign: 'center', color: '#666' }}>
            {vistaFavoritos ? 'No tenés favoritos guardados aún.' : 'No se encontraron profesionales.'}
          </p>
        )}
        {listaMostrada.map((p) => {
          const promedio = calcularPromedio(p.resenias)
          const esFavorito = favoritos.includes(p.id)
          const colorRubro = rubroColores[p.rubro] || { bg: '#f0f0f0', color: '#555' }
          const descripcionCorta = p.descripcion && p.descripcion.length > 100
            ? p.descripcion.substring(0, 100) + '...'
            : p.descripcion || 'Sin descripción'

          return (
            <div key={p.id} style={{
              background: 'white',
              borderRadius: '12px',
              boxShadow: '0 2px 10px rgba(0,0,0,0.08)',
              padding: '20px',
              marginBottom: '16px',
              transition: 'box-shadow 0.2s',
            }}
              onMouseEnter={e => e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.14)'}
              onMouseLeave={e => e.currentTarget.style.boxShadow = '0 2px 10px rgba(0,0,0,0.08)'}
            >
              <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
                <img
                  src={p.perfiles?.foto_perfil || `https://ui-avatars.com/api/?name=${encodeURIComponent(p.perfiles?.nombre || 'P')}&background=f4a261&color=fff&size=80`}
                  alt={p.perfiles?.nombre}
                  style={{ width: '72px', height: '72px', borderRadius: '50%', objectFit: 'cover', border: '2px solid #f4a261', flexShrink: 0 }}
                />
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <h3 style={{ marginBottom: '6px' }}>{p.perfiles?.nombre || 'Sin nombre'}</h3>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px', flexWrap: 'wrap' }}>
                        <span style={{
                          background: colorRubro.bg, color: colorRubro.color,
                          padding: '2px 10px', borderRadius: '999px', fontSize: '12px',
                          fontWeight: '500', textTransform: 'capitalize',
                        }}>{p.rubro}</span>
                        <span style={{ color: '#888', fontSize: '13px' }}>📍 {p.perfiles?.localidad || 'No especificada'}, {p.perfiles?.provincia || ''}</span>
                      </div>
                      <p style={{ color: '#555', fontSize: '14px', marginBottom: '6px' }}>{descripcionCorta}</p>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                        <span style={{ fontSize: '13px' }}>{p.disponible ? '✅ Disponible' : '❌ No disponible'}</span>
                        {promedio
                          ? <span style={{ fontSize: '13px' }}>⭐ <strong>{promedio}</strong> / 5 ({p.resenias.length} reseñas)</span>
                          : <span style={{ fontSize: '13px', color: '#999' }}>⭐ Sin reseñas aún</span>
                        }
                      </div>
                    </div>
                    <button onClick={() => toggleFavorito(p.id)}
                      style={{ background: 'transparent', border: 'none', fontSize: '22px', cursor: 'pointer', padding: '4px', flexShrink: 0 }}
                      title={esFavorito ? 'Quitar de favoritos' : 'Agregar a favoritos'}>
                      {esFavorito ? '❤️' : '🤍'}
                    </button>
                  </div>
                </div>
              </div>
              <div style={{ marginTop: '14px', display: 'flex', gap: '10px' }}>
                {p.perfiles?.telefono && (
                  <a href={`https://wa.me/${p.perfiles.telefono}`} target="_blank"
                    style={{ background: '#25d366', color: 'white', padding: '8px 14px', borderRadius: '6px', fontSize: '14px' }}>
                    📱 WhatsApp
                  </a>
                )}
                <Link to={`/profesional/${p.id}`}
                  style={{ background: '#f4a261', color: 'white', padding: '8px 14px', borderRadius: '6px', fontSize: '14px' }}>
                  Ver perfil →
                </Link>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default DashBuscador