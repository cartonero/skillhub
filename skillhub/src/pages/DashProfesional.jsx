import { useState, useEffect, useRef } from 'react'
import { supabase } from '../services/supabase'
import { useNavigate } from 'react-router-dom'

function DashProfesional() {
  const [perfil, setPerfil] = useState({ nombre: '', telefono: '', localidad: '', provincia: '', foto_perfil: '' })
  const [prof, setProf] = useState({ rubro: 'plomero', descripcion: '', disponible: true })
  const [userId, setUserId] = useState(null)
  const [mensaje, setMensaje] = useState('')
  const [trabajos, setTrabajos] = useState([])
  const [descFoto, setDescFoto] = useState('')
  const archivoRef = useRef(null)
  const avatarRef = useRef(null)
  const navigate = useNavigate()

  useEffect(() => {
    async function cargarDatos() {
      const { data: { user } } = await supabase.auth.getUser()
      setUserId(user.id)
      const { data: perfilData } = await supabase.from('perfiles').select('*').eq('id', user.id).single()
      if (perfilData) setPerfil(perfilData)
      const { data: profData } = await supabase.from('profesionales').select('*').eq('id', user.id).single()
      if (profData) setProf(profData)
      cargarTrabajos(user.id)
    }
    cargarDatos()
  }, [])

  async function cargarTrabajos(uid) {
    const { data } = await supabase.from('trabajos').select('*').eq('profesional_id', uid)
    if (data) setTrabajos(data)
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
    await supabase.from('perfiles').update(perfil).eq('id', userId)
    await supabase.from('profesionales').update(prof).eq('id', userId)
    setMensaje('✅ Perfil guardado correctamente')
  }

  async function subirFoto() {
    const archivo = archivoRef.current.files[0]
    if (!archivo) return
    const nombreArchivo = `${userId}/${Date.now()}_${archivo.name}`
    const { error: errorSubida } = await supabase.storage.from('trabajos').upload(nombreArchivo, archivo)
    if (errorSubida) { setMensaje('❌ Error subiendo la foto'); return }
    const { data: urlData } = supabase.storage.from('trabajos').getPublicUrl(nombreArchivo)
    await supabase.from('trabajos').insert({ profesional_id: userId, foto_url: urlData.publicUrl, descripcion: descFoto })
    setMensaje('✅ Foto subida correctamente')
    setDescFoto('')
    archivoRef.current.value = ''
    cargarTrabajos(userId)
  }

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '30px 20px' }}>

      <div style={{ background: 'white', borderRadius: '16px', boxShadow: '0 2px 10px rgba(0,0,0,0.08)', padding: '30px', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '24px' }}>
        <div style={{ position: 'relative' }}>
          <img
            src={perfil.foto_perfil || 'https://via.placeholder.com/100x100?text=Foto'}
            alt="Foto de perfil"
            style={{ width: '100px', height: '100px', borderRadius: '50%', objectFit: 'cover', border: '3px solid #f4a261' }}
          />
        </div>
        <div style={{ flex: 1 }}>
          <h2 style={{ marginBottom: '4px' }}>{perfil.nombre || 'Tu nombre'}</h2>
          <p style={{ color: '#666', marginBottom: '12px' }}>{prof.rubro} — {perfil.localidad}, {perfil.provincia}</p>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <input type="file" accept="image/*" ref={avatarRef} style={{ fontSize: '12px', maxWidth: '200px' }} />
            <button onClick={subirAvatar} style={{ padding: '6px 12px', fontSize: '12px' }}>Cambiar foto</button>
          </div>
        </div>
      </div>

      <div style={{ background: 'white', borderRadius: '16px', boxShadow: '0 2px 10px rgba(0,0,0,0.08)', padding: '24px', marginBottom: '24px' }}>
        <h3 style={{ marginBottom: '16px' }}>Datos personales</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
          <input placeholder="Nombre completo" value={perfil.nombre}
            onChange={(e) => setPerfil({ ...perfil, nombre: e.target.value })} />
          <input placeholder="Teléfono / WhatsApp" value={perfil.telefono || ''}
            onChange={(e) => setPerfil({ ...perfil, telefono: e.target.value })} />
          <input placeholder="Localidad" value={perfil.localidad || ''}
            onChange={(e) => setPerfil({ ...perfil, localidad: e.target.value })} />
          <input placeholder="Provincia" value={perfil.provincia || ''}
            onChange={(e) => setPerfil({ ...perfil, provincia: e.target.value })} />
        </div>

        <h3 style={{ margin: '16px 0' }}>Datos profesionales</h3>
        <select value={prof.rubro} onChange={(e) => setProf({ ...prof, rubro: e.target.value })}>
          <option value="plomero">Plomero</option>
          <option value="electricista">Electricista</option>
          <option value="gasista">Gasista</option>
          <option value="constructor">Constructor</option>
          <option value="mecanico">Mecánico</option>
        </select>
        <textarea placeholder="Describí tu experiencia y servicios"
          value={prof.descripcion || ''}
          onChange={(e) => setProf({ ...prof, descripcion: e.target.value })}
          style={{ width: '100%', maxWidth: '100%', height: '100px', marginTop: '10px' }} />
        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '10px' }}>
          <input type="checkbox" checked={prof.disponible}
            onChange={(e) => setProf({ ...prof, disponible: e.target.checked })} />
          Disponible para trabajos
        </label>
        <br />
        <button onClick={guardarPerfil}>Guardar perfil</button>
        {mensaje && <p style={{ marginTop: '10px' }}>{mensaje}</p>}
      </div>

      <div style={{ background: 'white', borderRadius: '16px', boxShadow: '0 2px 10px rgba(0,0,0,0.08)', padding: '24px' }}>
        <h3 style={{ marginBottom: '16px' }}>Portfolio de trabajos</h3>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '16px' }}>
          <input type="file" accept="image/*" ref={archivoRef} style={{ maxWidth: '200px' }} />
          <input placeholder="Descripción del trabajo" value={descFoto}
            onChange={(e) => setDescFoto(e.target.value)} />
          <button onClick={subirFoto}>Subir foto</button>
        </div>
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

    </div>
  )
}

export default DashProfesional