import { RUBROS, getRubroColor } from '../services/rubros'
import { useState, useEffect } from 'react'
import { supabase } from '../services/supabase'
import { Link } from 'react-router-dom'

function Explorar() {
  const [profesionales, setProfesionales] = useState([])
  const [rubro, setRubro] = useState('')
  const [localidad, setLocalidad] = useState('')

  useEffect(() => {
    buscar()
  }, [])

  async function buscar() {
    let query = supabase.from('profesionales').select(`
      id, rubro, descripcion, disponible,
      perfiles (nombre, telefono, localidad, provincia, foto_perfil),
      resenias (estrellas)
    `)
    if (rubro) query = query.eq('rubro', rubro)
    const { data, error } = await query
    if (error) console.error(error)
    if (data) {
      let resultado = data
      if (localidad) {
        resultado = data.filter(p => p.perfiles?.localidad?.toLowerCase().includes(localidad.toLowerCase()))
      }
      setProfesionales(resultado)
    }
  }

  function calcularPromedio(resenias) {
    if (!resenias || resenias.length === 0) return null
    const suma = resenias.reduce((acc, r) => acc + r.estrellas, 0)
    return (suma / resenias.length).toFixed(1)
  }

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto', padding: '30px 20px' }}>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h2 style={{ margin: 0 }}>🔍 Explorar profesionales</h2>
      </div>

      <div style={{ background: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 2px 10px rgba(0,0,0,0.08)', marginBottom: '24px', display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
        <select value={rubro} onChange={(e) => setRubro(e.target.value)} style={{ flex: 1 }}>
          <option value="">Todos los rubros</option>
          {RUBROS.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
        </select>
        <input placeholder="Localidad" value={localidad}
          onChange={(e) => setLocalidad(e.target.value)} style={{ flex: 1 }} />
        <button onClick={buscar}>Buscar</button>
      </div>

      <div>
        {profesionales.length === 0 && (
          <p style={{ textAlign: 'center', color: '#666' }}>No se encontraron profesionales.</p>
        )}
        {profesionales.map((p) => {
          const promedio = calcularPromedio(p.resenias)
          const colorRubro = getRubroColor(p.rubro)
          const descripcionCorta = p.descripcion && p.descripcion.length > 100
            ? p.descripcion.substring(0, 100) + '...'
            : p.descripcion || 'Sin descripción'

          return (
            <div key={p.id} style={{
              background: 'white', borderRadius: '12px',
              boxShadow: '0 2px 10px rgba(0,0,0,0.08)', padding: '20px',
              marginBottom: '16px', transition: 'box-shadow 0.2s',
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

export default Explorar