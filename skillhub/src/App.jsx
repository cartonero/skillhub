import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Login from './pages/Login'
import Registro from './pages/Registro'
import DashBuscador from './pages/DashBuscador'
import DashProfesional from './pages/DashProfesional'
import PerfilProfesional from './pages/PerfilProfesional'
import Navbar from './components/Navbar'
import NotFound from './pages/NotFound'
import Chat from './pages/Chat'

function App() {
  return (
    <BrowserRouter>
      <Navbar />
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/login" element={<Login />} />
        <Route path="/registro" element={<Registro />} />
        <Route path="/dash-buscador" element={<DashBuscador />} />
        <Route path="/dash-profesional" element={<DashProfesional />} />
        <Route path="/profesional/:id" element={<PerfilProfesional />} />
        <Route path="/chat/:profesionalId" element={<Chat />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App