import { useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route, Link, useLocation, Navigate } from 'react-router-dom'
import Pacientes from './pages/Pacientes'
import Profesionales from './pages/Profesionales'
import Agenda from './pages/Citas'
import Pagos from './pages/Pagos'
import Inicio from './pages/Inicio'
import InicioMatrona from './pages/InicioMatrona'
import Login from './pages/Login'
import Bloqueos from './pages/Bloqueos'
import Usuarios from './pages/Usuarios'
import Reportes from './pages/Reportes'
import CambiarPassword from './pages/CambiarPassword'
import Procedimientos from './pages/Procedimientos'
import Pap from './pages/Pap'
import Flujos from './pages/Flujos'
import Encuesta from './pages/Encuesta'
import Encuestas from './pages/Encuestas'
import Logs from './pages/Logs'

function NavLink({ to, children, onClick }) {
  const location = useLocation()
  const active = location.pathname === to
  return (
    <Link to={to} onClick={onClick}
      className={`px-4 py-2 rounded-lg font-medium transition-colors block md:inline-block ${
        active ? 'bg-white text-green-800' : 'text-white hover:bg-green-700'
      }`}
    >{children}</Link>
  )
}

function Layout({ usuario, onLogout }) {
  const [menuAbierto, setMenuAbierto] = useState(false)
  const rol = usuario.rol

  const linksAdmin = [
    { to: '/', label: 'Inicio' },
    { to: '/pacientes', label: 'Pacientes' },
    { to: '/profesionales', label: 'Profesionales' },
    { to: '/citas', label: 'Agenda' },
    { to: '/pagos', label: 'Pagos' },
    { to: '/usuarios', label: 'Usuarios' },
    { to: '/reportes', label: 'Reportes' },
    { to: '/procedimientos', label: 'Procedimientos' },
    { to: '/pap', label: 'PAP' },
    { to: '/flujos', label: 'Flujos' },
    { to: '/encuestas', label: 'Encuestas' },
    { to: '/logs', label: 'Actividad' },
  ]

  const linksSecretaria = [
    { to: '/', label: 'Inicio' },
    { to: '/pacientes', label: 'Pacientes' },
    { to: '/citas', label: 'Agenda' },
    { to: '/pagos', label: 'Pagos' },
    { to: '/procedimientos', label: 'Procedimientos' },
    { to: '/pap', label: 'PAP' },
    { to: '/flujos', label: 'Flujos' },
    { to: '/encuestas', label: 'Encuestas' },
  ]

  const linksMatrona = [
    { to: '/', label: 'Mi Agenda' },
    { to: '/pacientes', label: 'Pacientes' },
    { to: '/citas', label: 'Agenda' },
    { to: '/pagos', label: 'Pagos' },
    { to: '/pap', label: 'PAP' },
    { to: '/flujos', label: 'Flujos' },
    { to: '/encuestas', label: 'Encuestas' },
  ]

  const links = rol === 'admin' ? linksAdmin : rol === 'secretaria' ? linksSecretaria : linksMatrona

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-green-800 shadow-md px-4 py-3">
        <div className="flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3" onClick={() => setMenuAbierto(false)}>
            <img src="/logo.png" alt="Saberes" className="h-10 w-10 rounded-full object-cover" />
            <div className="leading-tight">
              <div className="text-white font-bold text-base">Saberes</div>
              <div className="text-green-200 text-xs capitalize">{rol}</div>
            </div>
          </Link>

          <button className="md:hidden text-white focus:outline-none" onClick={() => setMenuAbierto(!menuAbierto)}>
            {menuAbierto ? (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            ) : (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
            )}
          </button>

          <div className="hidden md:flex items-center gap-2">
            {links.map(l => <NavLink key={l.to} to={l.to}>{l.label}</NavLink>)}
            <div className="ml-4 flex items-center gap-3 border-l border-green-600 pl-4">
              <span className="text-green-200 text-sm">Hola, {usuario.nombre}</span>
              <Link to="/cambiar-password" className="text-green-200 hover:text-white text-sm">🔑</Link>
              <button onClick={onLogout} className="text-white bg-green-600 hover:bg-green-500 px-3 py-1 rounded-lg text-sm font-medium transition-colors">Salir</button>
            </div>
          </div>
        </div>

        {menuAbierto && (
          <div className="md:hidden flex flex-col gap-1 mt-3 border-t border-green-700 pt-3">
            {links.map(l => <NavLink key={l.to} to={l.to} onClick={() => setMenuAbierto(false)}>{l.label}</NavLink>)}
            <div className="border-t border-green-700 pt-2 mt-1">
              <span className="text-green-200 text-sm block px-4 py-1">Hola, {usuario.nombre}</span>
              <Link to="/cambiar-password" className="text-green-200 hover:text-white text-sm block px-4 py-2">🔑 Cambiar contraseña</Link>
              <button onClick={onLogout} className="text-white text-sm font-medium px-4 py-2 hover:bg-green-700 rounded-lg w-full text-left">Cerrar sesión</button>
            </div>
          </div>
        )}
      </nav>

      <main className="max-w-6xl mx-auto p-4 md:p-6">
        <Routes>
          {rol === 'admin' && <>
            <Route path="/" element={<Inicio />} />
            <Route path="/pacientes" element={<Pacientes />} />
            <Route path="/profesionales" element={<Profesionales />} />
            <Route path="/citas" element={<Agenda />} />
            <Route path="/pagos" element={<Pagos />} />
            <Route path="/usuarios" element={<Usuarios />} />
            <Route path="/reportes" element={<Reportes />} />
            <Route path="/cambiar-password" element={<CambiarPassword />} />
            <Route path="/procedimientos" element={<Procedimientos />} />
            <Route path="/pap" element={<Pap />} />
            <Route path="/flujos" element={<Flujos />} />
            <Route path="/encuestas" element={<Encuestas />} />
            <Route path="/logs" element={<Logs />} />
            <Route path="*" element={<Navigate to="/" />} />
          </>}

          {rol === 'secretaria' && <>
             <Route path="/" element={<Inicio />} />
            <Route path="/pacientes" element={<Pacientes />} />
            <Route path="/citas" element={<Agenda />} />
            <Route path="/pagos" element={<Pagos />} />
            <Route path="/procedimientos" element={<Procedimientos />} />
            <Route path="/cambiar-password" element={<CambiarPassword />} />
            <Route path="/pap" element={<Pap />} />
            <Route path="/flujos" element={<Flujos />} />
            <Route path="/encuestas" element={<Encuestas />} />
            <Route path="*" element={<Navigate to="/pacientes" />} />
          </>}

          {rol === 'matrona' && <>
            <Route path="/" element={<InicioMatrona usuario={usuario} />} />
            <Route path="/pacientes" element={<Pacientes />} />
            <Route path="/citas" element={<Agenda />} />
            <Route path="/pagos" element={<Pagos />} />
            <Route path="/cambiar-password" element={<CambiarPassword />} />
            <Route path="/pap" element={<Pap />} />
            <Route path="/flujos" element={<Flujos />} />
            <Route path="/encuestas" element={<Encuestas />} />
            <Route path="*" element={<Navigate to="/" />} />
          </>}
        </Routes>
      </main>
    </div>
  )
}

function App() {
  const [usuario, setUsuario] = useState(null)

  useEffect(() => {
    const token = localStorage.getItem('token')
    const nombre = localStorage.getItem('nombre')
    const rol = localStorage.getItem('rol')
    if (token && nombre) setUsuario({ token, nombre, rol })
  }, [])

  const handleLogin = data => setUsuario(data)

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('nombre')
    localStorage.removeItem('rol')
    setUsuario(null)
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/encuesta/:token" element={<Encuesta />} />
        <Route path="/*" element={
          usuario ? <Layout usuario={usuario} onLogout={handleLogout} /> : <Login onLogin={handleLogin} />
        } />
      </Routes>
    </BrowserRouter>
  )
}

export default App