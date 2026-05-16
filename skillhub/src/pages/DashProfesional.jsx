import { useState, useEffect, useRef } from 'react'
import { supabase } from '../services/supabase'

function DashProfesional() {
  const [perfil, setPerfil] = useState({ nombre: '', telefono: '', localidad: '', provincia: '' })
  const [prof, setProf] = useState({ rubro: 'plomero', descripcion: '', disponible: true })
  const [userId, setUserId] = useState(null)
  const [mensaje, setMensaje] = useState('')
  const [trabajos, setTrabajos] = useState([])
  const [descFoto, setDescFoto] = useState('')
  const archivoRef = useRef(null)

  useEffect(() => {
    async function cargarDatos() {
      const { data: { user } } = await supabase.auth.getUser()
      setUserId(user.id)

      const { data: perfilData } = await supabase
        .from('perfiles')
        .select('*')
        .eq('id', user.id)
        .single()
      if (perfilData) setPerfil(perfilData)

      const { data: profData } = await supabase
        .from('profesionales')
        .select('*')
        .eq('id', user.id)
        .single()
      if (profData) setProf(profData)

      cargarTrabajos(user.id)
    }
    cargarDatos()
  }, [])

  async function cargarTrabajos(uid) {
    const { data } = await supabase
      .from('trabajos')
      .select('*')
      .eq('profesional_id', uid)
    if (data) setTrabajos(data)
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
    const { error: errorSubida } = await supabase.storage
      .from('trabajos')
      .upload(nombreArchivo, archivo)

    if (errorSubida) {
      setMensaje('❌ Error subiendo la foto')
      return
    }

    const { data: urlData } = supabase.storage
      .from('trabajos')
      .getPublicUrl(nombreArchivo)

    await supabase.from('trabajos').insert({
      profesional_id: userId,
      foto_url: urlData.publicUrl,
      descripcion: descFoto
    })

    setMensaje('✅ Foto subida correctamente')
    setDescFoto('')
    archivoRef.current.value = ''
    cargarTrabajos(userId)
  }

  async function cerrarSesion() {
    await supabase.auth.signOut()
    window.location.href = '/login'
  }

  return (
    <div>
      <h2>Mi perfil profesional</h2>

      <h3>Datos personales</h3>
      <input placeholder="Nombre completo" value={perfil.nombre}
        onChange={(e) => setPerfil({ ...perfil, nombre: e.target.value })} />
      <input placeholder="Teléfono / WhatsApp" value={perfil.telefono || ''}
        onChange={(e) => setPerfil({ ...perfil, telefono: e.target.value })} />
      <input placeholder="Localidad" value={perfil.localidad || ''}
        onChange={(e) => setPerfil({ ...perfil, localidad: e.target.value })} />
      <input placeholder="Provincia" value={perfil.provincia || ''}
        onChange={(e) => setPerfil({ ...perfil, provincia: e.target.value })} />

      <h3>Datos profesionales</h3>
      <select value={prof.rubro} onChange={(e) => setProf({ ...prof, rubro: e.target.value })}>
        <option value="plomero">Plomero</option>
        <option value="electricista">Electricista</option>
        <option value="gasista">Gasista</option>
        <option value="constructor">Constructor</option>
        <option value="mecanico">Mecánico</option>
      </select>
      <textarea placeholder="Describí tu experiencia y servicios"
        value={prof.descripcion || ''}
        onChange={(e) => setProf({ ...prof, descripcion: e.target.value })} />
      <label>
        <input type="checkbox" checked={prof.disponible}
          onChange={(e) => setProf({ ...prof, disponible: e.target.checked })} />
        Disponible para trabajos
      </label>

      <br /><br />
      <button onClick={guardarPerfil}>Guardar perfil</button>
      {mensaje && <p>{mensaje}</p>}

      <hr />
      <h3>Mi portfolio de trabajos</h3>
      <input type="file" accept="image/*" ref={archivoRef} />
      <input placeholder="Descripción del trabajo" value={descFoto}
        onChange={(e) => setDescFoto(e.target.value)} />
      <button onClick={subirFoto}>Subir foto</button>

      <div>
        {trabajos.map((t) => (
          <div key={t.id} style={{ marginTop: '20px' }}>
            <img src={t.foto_url} alt={t.descripcion}
              style={{ width: '200px', height: '150px', objectFit: 'cover' }} />
            <p>{t.descripcion}</p>
          </div>
        ))}
      </div>

      <br />
      <button onClick={cerrarSesion}>Cerrar sesión</button>
    </div>
  )
}

export default DashProfesional