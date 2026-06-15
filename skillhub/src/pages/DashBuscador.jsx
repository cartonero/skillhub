import { RUBROS, getRubroLabel, getRubroColor } from '../services/rubros'
import { useState, useEffect, useRef } from 'react'
import { supabase } from '../services/supabase'
import { Link } from 'react-router-dom'

function DashBuscador() {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768)
  const [profesionales, setProfesionales] = useState([])
  const [rubro, setRubro] = useState('')
  const [localidad, setLocalidad] = useState('')
  const [userId, setUserId] = useState(null)
  const [favoritos, setFavoritos] = useState([])
  const [vistaFavoritos, setVistaFavoritos] = useState(false)
  const [nombreUsuario, setNombreUsuario] = useState('')
  const [perfil, setPerfil] = useState({ nombre: '', foto_perfil: '' })
  const [vistaConfig, setVistaConfig] = useState(false)
  const [editNombre, setEditNombre] = useState('')
  const [mensajeConfig, setMensajeConfig] = useState('')
  const avatarRef = useRef(null)

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768)
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setUserId(user.id)
        cargarFavoritos(user.id)
        const { data: perfilData } = await supabase.from('perfiles').select('nombre, foto_perfil').eq('id', user.id).single()
        if (perfilData) {
          setPerfil(perfilData)
          setEditNombre(perfilData.nombre || '')
          if (perfilData?.nombre) setNombreUsuario(perfilData.nombre.split(' ')[0])
        }
      }
      buscar()
    }
    init()
  }, [])

  async function cargarFavoritos(uid) {
    const { data } = await supabase.from('favoritos').select('profesional_id').eq('buscador_id', uid)
    if (data) setFavoritos(data.map(f => f.profesional_id))
  }

  async function toggleFavorito(profesionalId) {
    if (!userId) return
    const esFavorito = favoritos.includes(profesionalId)
    if (esFavorito) {
      await supabase.from('favoritos').delete().eq('buscador_id', userId).eq('profesional_id', profesionalId)
      setFavoritos(favoritos.filter(id => id !== profesionalId))
    } else {
      await supabase.from('favoritos').insert({ buscador_id: userId, profesional_id: profesionalId })
      setFavoritos([...favoritos, profesionalId])
    }
  }

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

  async function guardarPerfil() {
    if (!editNombre.trim()) { setMensajeConfig('❌ El nombre no puede estar vacío'); return }
    await supabase.from('perfiles').update({ nombre: editNombre.trim() }).eq('id', userId)
    setPerfil(prev => ({ ...prev, nombre: editNombre.trim() }))
    setNombreUsuario(editNombre.trim().split(' ')[0])
    setMensajeConfig('✅ Nombre actualizado correctamente')
    setTimeout(() => setMensajeConfig(''), 3000)
  }

  async function subirFoto() {
    const archivo = avatarRef.current?.files[0]
    if (!archivo) { setMensajeConfig('❌ Seleccioná una imagen primero'); return }
    const ext = archivo.name.split('.').pop()
    const nombreArchivo = `${userId}/avatar_${Date.now()}.${ext}`
    const { error } = await supabase.storage.from('avatares').upload(nombreArchivo, archivo)
    if (error) { setMensajeConfig('❌ Error subiendo la foto'); return }
    const { data: urlData } = supabase.storage.from('avatares').getPublicUrl(nombreArchivo)
    await supabase.from('perfiles').update({ foto_perfil: urlData.publicUrl }).eq('id', userId)
    setPerfil(prev => ({ ...prev, foto_perfil: urlData.publicUrl }))
    avatarRef.current.value = ''
    setMensajeConfig('✅ Foto de perfil actualizada')
    setTimeout(() => setMensajeConfig(''), 3000)
  }

  function calcularPromedio(resenias) {
    if (!resenias || resenias.length === 0) return null
    const suma = resenias.reduce((acc, r) => acc + r.estrellas, 0)
    return (suma / resenias.length).toFixed(1)
  }



  const listaMostrada = vistaFavoritos
    ? profesionales.filter(p => favoritos.includes(p.id))
    : profesionales

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto', padding: '30px 20px' }}>

      {/* Banner bienvenida */}
      {nombreUsuario && (
        <div style={{
          background: 'linear-gradient(135deg, #1a1a2e, #0f3460)',
          borderRadius: '16px', padding: '24px 28px', marginBottom: '24px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <div>
            <h2 style={{ color: 'white', margin: '0 0 4px', fontSize: '22px' }}>
              ¡Bienvenido, {nombreUsuario}! 👋
            </h2>
            <p style={{ color: '#aab', margin: 0, fontSize: '14px' }}>
              Encontrá el profesional que necesitás
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button
              onClick={() => { setVistaConfig(!vistaConfig); setVistaFavoritos(false) }}
              title="Mi perfil"
              style={{
                background: vistaConfig ? '#f4a261' : 'rgba(255,255,255,0.12)',
                border: 'none', borderRadius: '50%', width: '44px', height: '44px',
                cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '20px', transition: 'background 0.2s',
              }}
            >
              {perfil.foto_perfil
                ? <img src={perfil.foto_perfil} alt="perfil"
                    style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover', border: '2px solid #f4a261' }} />
                : '⚙️'
              }
            </button>
            <div style={{ fontSize: '48px' }}>🔧</div>
          </div>
        </div>
      )}

      {/* Sección de configuración */}
      {vistaConfig && (
        <div style={{ background: 'white', borderRadius: '16px', boxShadow: '0 2px 10px rgba(0,0,0,0.08)', padding: '28px', marginBottom: '24px' }}>
          <h3 style={{ margin: '0 0 20px', color: '#1a1a2e' }}>⚙️ Mi perfil</h3>

          {/* Foto de perfil */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '24px', flexWrap: 'wrap' }}>
            {perfil.foto_perfil
              ? <img src={perfil.foto_perfil} alt="perfil"
                  style={{ width: '80px', height: '80px', borderRadius: '50%', objectFit: 'cover', border: '3px solid #f4a261' }} />
              : <div style={{
                  width: '80px', height: '80px', borderRadius: '50%',
                  background: '#f4a261', color: 'white',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '28px', fontWeight: '600', flexShrink: 0,
                }}>
                  {(perfil.nombre || 'U')[0].toUpperCase()}
                </div>
            }
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: '13px', fontWeight: '500', color: '#555', display: 'block', marginBottom: '6px' }}>
                Foto de perfil
              </label>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                <input type="file" accept="image/*" ref={avatarRef}
                  style={{ fontSize: '12px', maxWidth: '200px', margin: 0 }} />
                <button onClick={subirFoto}
                  style={{ padding: '7px 14px', fontSize: '13px', margin: 0 }}>
                  Subir foto
                </button>
              </div>
            </div>
          </div>

          {/* Nombre */}
          <div style={{ marginBottom: '16px' }}>
            <label style={{ fontSize: '13px', fontWeight: '500', color: '#555', display: 'block', marginBottom: '6px' }}>
              Nombre completo
            </label>
            <input
              placeholder="Tu nombre y apellido"
              value={editNombre}
              onChange={(e) => setEditNombre(e.target.value)}
              style={{ maxWidth: '360px' }}
            />
          </div>

          <button onClick={guardarPerfil} style={{ padding: '9px 20px', fontSize: '14px', margin: 0 }}>
            Guardar cambios
          </button>
          {mensajeConfig && (
            <span style={{
              marginLeft: '12px', fontSize: '13px', fontWeight: '500',
              color: mensajeConfig.includes('✅') ? '#1e8449' : '#c0392b',
            }}>
              {mensajeConfig}
            </span>
          )}
        </div>
      )}

      {/* Encabezado buscador / favoritos */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: isMobile ? 'flex-start' : 'center', flexDirection: isMobile ? 'column' : 'row', gap: '10px', marginBottom: '24px' }}>
        <h2 style={{ margin: 0 }}>{vistaFavoritos ? '❤️ Mis favoritos' : '🔍 Buscar profesionales'}</h2>
        <button
          onClick={() => { setVistaFavoritos(!vistaFavoritos); setVistaConfig(false) }}
          style={{
            background: vistaFavoritos ? '#f4a261' : 'white',
            color: vistaFavoritos ? 'white' : '#f4a261',
            border: '1px solid #f4a261', padding: '8px 16px',
            borderRadius: '8px', cursor: 'pointer', fontSize: '14px',
          }}
        >
          {vistaFavoritos ? '← Ver todos' : '❤️ Mis favoritos'}
        </button>
      </div>

      {/* Filtros */}
      {!vistaFavoritos && (
        <div style={{ background: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 2px 10px rgba(0,0,0,0.08)', marginBottom: '24px', display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <select value={rubro} onChange={(e) => setRubro(e.target.value)} style={{ flex: 1 }}>
            <option value="">Todos los rubros</option>
            {RUBROS.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
          </select>
          <input placeholder="Localidad" value={localidad}
            onChange={(e) => setLocalidad(e.target.value)} style={{ flex: 1 }} />
          <button onClick={buscar}>Buscar</button>
        </div>
      )}

      {/* Lista de profesionales */}
      <div>
        {listaMostrada.length === 0 && (
          <p style={{ textAlign: 'center', color: '#666' }}>
            {vistaFavoritos ? 'No tenés favoritos guardados aún.' : 'No se encontraron profesionales.'}
          </p>
        )}
        {listaMostrada.map((p) => {
          const promedio = calcularPromedio(p.resenias)
          const esFavorito = favoritos.includes(p.id)
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
              <div style={{ position: 'relative' }}>
                <button onClick={() => toggleFavorito(p.id)}
                  style={{ position: 'absolute', top: 0, right: 0, background: 'transparent', border: 'none', fontSize: '22px', cursor: 'pointer', padding: '4px' }}
                  title={esFavorito ? 'Quitar de favoritos' : 'Agregar a favoritos'}>
                  {esFavorito ? '❤️' : '🤍'}
                </button>
                <div style={{ display: 'flex', gap: '14px', alignItems: 'flex-start', paddingRight: '36px' }}>
                  <img
                    src={p.perfiles?.foto_perfil || `https://ui-avatars.com/api/?name=${encodeURIComponent(p.perfiles?.nombre || 'P')}&background=f4a261&color=fff&size=80`}
                    alt={p.perfiles?.nombre}
                    style={{ width: '64px', height: '64px', borderRadius: '50%', objectFit: 'cover', border: '2px solid #f4a261', flexShrink: 0 }}
                  />
                  <div style={{ flex: 1, minWidth: 0 }}>
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
              </div>
              <div style={{ marginTop: '14px', display: 'flex', gap: '8px', flexDirection: isMobile ? 'column' : 'row' }}>
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