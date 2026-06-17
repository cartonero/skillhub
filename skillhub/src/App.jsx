import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { supabase } from './services/supabase'
import Login from './pages/Login'
import Registro from './pages/Registro'
import DashBuscador from './pages/DashBuscador'
import DashProfesional from './pages/DashProfesional'
import PerfilProfesional from './pages/PerfilProfesional'
import Navbar from './components/Navbar'
import NotFound from './pages/NotFound'
import Chat from './pages/Chat'
import Explorar from './pages/Explorar'

// Protege rutas: si no hay sesión redirige a /login
// Si hay sesión pero el rol no coincide, redirige al dash correcto
function ProtectedRoute({ children, rolRequerido }) {
  const [estado, setEstado] = useState('cargando') // 'cargando' | 'ok' | 'sin-sesion' | 'rol-incorrecto'
  const [rolUsuario, setRolUsuario] = useState(null)

  useEffect(() => {
    async function verificar() {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { setEstado('sin-sesion'); return }

      if (rolRequerido) {
        const { data: perfil } = await supabase
          .from('perfiles').select('tipo').eq('id', session.user.id).single()
        const rol = perfil?.tipo
        setRolUsuario(rol)
        if (rol !== rolRequerido) { setEstado('rol-incorrecto'); return }
      }

      setEstado('ok')
    }
    verificar()
  }, [rolRequerido])

  if (estado === 'cargando') return (
    <div style={{ textAlign: 'center', marginTop: '80px', color: '#999', fontSize: '14px' }}>
      Cargando...
    </div>
  )
  if (estado === 'sin-sesion') return <Navigate to="/login" replace />
  if (estado === 'rol-incorrecto') {
    return <Navigate to={rolUsuario === 'profesional' ? '/dash-profesional' : '/dash-buscador'} replace />
  }
  return children
}

function App() {
  return (
    <BrowserRouter>
      <Navbar />
      <Routes>
        {/* Rutas públicas */}
        <Route path="/" element={<Login />} />
        <Route path="/login" element={<Login />} />
        <Route path="/registro" element={<Registro />} />
        <Route path="/profesional/:id" element={<PerfilProfesional />} />

        {/* Rutas protegidas — solo buscadores */}
        <Route path="/dash-buscador" element={
          <ProtectedRoute rolRequerido="buscador"><DashBuscador /></ProtectedRoute>
        } />
        <Route path="/explorar" element={
          <ProtectedRoute><Explorar /></ProtectedRoute>
        } />

        {/* Rutas protegidas — solo profesionales */}
        <Route path="/dash-profesional" element={
          <ProtectedRoute rolRequerido="profesional"><DashProfesional /></ProtectedRoute>
        } />

        {/* Rutas protegidas — cualquier usuario autenticado */}
        <Route path="/chat/:profesionalId" element={
          <ProtectedRoute><Chat /></ProtectedRoute>
        } />

        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App