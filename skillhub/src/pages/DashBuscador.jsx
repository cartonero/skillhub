import { useState, useEffect } from 'react'
import { supabase } from '../services/supabase'

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
        perfiles (nombre, telefono, localidad, provincia)
      `)

    if (rubro) query = query.eq('rubro', rubro)
    if (localidad) query = query.ilike('perfiles.localidad', `%${localidad}%`)

    const { data, error } = await query
    if (error) console.error(error)
    if (data) setProfesionales(data)
  }

  async function cerrarSesion() {
    await supabase.auth.signOut()
    window.location.href = '/login'
  }

  return (
    <div>
      <h2>Buscar profesionales</h2>

      <div>
        <select value={rubro} onChange={(e) => setRubro(e.target.value)}>
          <option value="">Todos los rubros</option>
          <option value="plomero">Plomero</option>
          <option value="electricista">Electricista</option>
          <option value="gasista">Gasista</option>
          <option value="constructor">Constructor</option>
          <option value="mecanico">Mecánico</option>
        </select>
        <input placeholder="Localidad" value={localidad}
          onChange={(e) => setLocalidad(e.target.value)} />
        <button onClick={buscar}>Buscar</button>
      </div>

      <div>
        {profesionales.length === 0 && <p>No se encontraron profesionales.</p>}
        {profesionales.map((p) => (
          <div key={p.id} style={{ border: '1px solid #ccc', margin: '10px', padding: '10px' }}>
            <h3>{p.perfiles?.nombre || 'Sin nombre'}</h3>
            <p><strong>Rubro:</strong> {p.rubro}</p>
            <p><strong>Localidad:</strong> {p.perfiles?.localidad || 'No especificada'}</p>
            <p><strong>Provincia:</strong> {p.perfiles?.provincia || 'No especificada'}</p>
            <p><strong>Descripción:</strong> {p.descripcion || 'Sin descripción'}</p>
            <p><strong>Disponible:</strong> {p.disponible ? '✅ Sí' : '❌ No'}</p>
            {p.perfiles?.telefono && (
              <a href={`https://wa.me/${p.perfiles.telefono}`} target="_blank">
                📱 Contactar por WhatsApp
              </a>
            )}
          </div>
        ))}
      </div>

      <br />
      <button onClick={cerrarSesion}>Cerrar sesión</button>
    </div>
  )
}

export default DashBuscador