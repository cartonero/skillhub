import { useState, useEffect } from 'react'
import { supabase } from '../services/supabase'
import { Link } from 'react-router-dom'

function DashBuscador() {
  const [profesionales, setProfesionales] = useState([])
  const [rubro, setRubro] = useState('')
  const [localidad, setLocalidad] = useState('')

  useEffect(() => {
    buscar()
  }, [])

  async function buscar() {
    let query = supabase
      .from('profesionales')
      .select(`
        id,
        rubro,
        descripcion,
        disponible,
        perfiles (nombre, telefono, localidad, provincia),
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

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto', padding: '30px 20px' }}>
      <div style={{ marginBottom: '24px' }}>
        <h2>🔍 Buscar profesionales</h2>
      </div>

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

      <div>
        {profesionales.length === 0 && (
          <p style={{ textAlign: 'center', color: '#666' }}>No se encontraron profesionales.</p>
        )}
        {profesionales.map((p) => {
          const promedio = calcularPromedio(p.resenias)
          return (
            <div key={p.id} style={{ background: 'white', borderRadius: '12px', boxShadow: '0 2px 10px rgba(0,0,0,0.08)', padding: '20px', marginBottom: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <h3 style={{ marginBottom: '8px' }}>{p.perfiles?.nombre || 'Sin nombre'}</h3>
                  <p><strong>Rubro:</strong> {p.rubro}</p>
                  <p><strong>Localidad:</strong> {p.perfiles?.localidad || 'No especificada'} — {p.perfiles?.provincia || ''}</p>
                  <p><strong>Descripción:</strong> {p.descripcion || 'Sin descripción'}</p>
                  <p><strong>Disponible:</strong> {p.disponible ? '✅ Sí' : '❌ No'}</p>
                  {promedio
                    ? <p>⭐ <strong>{promedio}</strong> / 5 ({p.resenias.length} reseñas)</p>
                    : <p>⭐ Sin reseñas aún</p>
                  }
                </div>
              </div>
              <div style={{ marginTop: '12px', display: 'flex', gap: '10px' }}>
                {p.perfiles?.telefono && (
                  <a href={`https://wa.me/${p.perfiles.telefono}`} target="_blank"
                    style={{ background: '#25d366', color: 'white', padding: '8px 14px', borderRadius: '6px' }}>
                    📱 WhatsApp
                  </a>
                )}
                <Link to={`/profesional/${p.id}`}
                  style={{ background: '#f4a261', color: 'white', padding: '8px 14px', borderRadius: '6px' }}>
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