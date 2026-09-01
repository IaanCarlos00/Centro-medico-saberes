import { useState, useEffect, useRef } from 'react'
import { BrowserRouter, Routes, Route, Link, useLocation, Navigate, useNavigate } from 'react-router-dom'
import Pacientes from './pages/Pacientes'
import Profesionales from './pages/Profesionales'
import Agenda from './pages/Citas'
import Pagos from './pages/Pagos'
import Inicio from './pages/Inicio'
import InicioMatrona from './pages/InicioMatrona'
import Login from './pages/Login'
import Usuarios from './pages/Usuarios'
import Reportes from './pages/Reportes'
import CambiarPassword from './pages/CambiarPassword'
import Procedimientos from './pages/Procedimientos'
import Pap from './pages/Pap'
import Flujos from './pages/Flujos'
import Encuesta from './pages/Encuesta'
import Encuestas from './pages/Encuestas'
import Logs from './pages/Logs'
import Controles from './pages/Controles'
import InicioRecepcionista from './pages/InicioRecepcionista'
import PcrVph from './pages/PcrVph'
import HorariosMatronas from './pages/HorariosMatronas'
import AsistenteIA from './components/AsistenteIA'

function NavLink({ to, children, onClick }) {
  const location = useLocation()
  const active = location.pathname === to
  return (
    <Link to={to} onClick={onClick}
      className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 block md:inline-block ${
        active
          ? 'bg-white text-green-800 shadow-[0_0_16px_rgba(74,222,128,0.45)]'
          : 'text-green-100 hover:text-white hover:bg-white/10'
      }`}
    >{children}</Link>
  )
}

function NavDropdown({ links }) {
  const location = useLocation()
  const [abierto, setAbierto] = useState(false)
  const ref = useRef(null)
  const activoAdentro = links.some(l => l.to === location.pathname)

  useEffect(() => {
    const handleClick = e => {
      if (ref.current && !ref.current.contains(e.target)) setAbierto(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setAbierto(v => !v)}
        className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 flex items-center gap-1.5 ${
          activoAdentro
            ? 'bg-white text-green-800 shadow-[0_0_16px_rgba(74,222,128,0.45)]'
            : 'text-green-100 hover:text-white hover:bg-white/10'
        }`}
      >
        Más
        <svg className={`w-3.5 h-3.5 transition-transform duration-300 ${abierto ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {abierto && (
        <div
          className="nav-dropdown-in absolute right-0 top-full mt-3 w-64 z-50 rounded-2xl border border-white/10 overflow-hidden"
          style={{
            background: 'linear-gradient(160deg, rgba(5,46,22,0.98), rgba(15,64,33,0.98))',
            backdropFilter: 'blur(16px)',
            boxShadow: '0 20px 50px -10px rgba(5,46,22,0.65), 0 0 0 1px rgba(255,255,255,0.04)',
          }}
        >
          {/* Caret apuntando al botón */}
          <div
            className="absolute -top-1.5 right-6 w-3 h-3 rotate-45 border-t border-l border-white/10"
            style={{ background: 'rgba(5,46,22,0.98)' }}
          />
          <div className="relative px-4 pt-3 pb-2">
            <p className="text-[10px] uppercase tracking-widest font-bold text-green-300/70">Más opciones</p>
          </div>
          <div className="relative flex flex-col px-2 pb-2">
            {links.map(l => {
              const active = location.pathname === l.to
              return (
                <Link
                  key={l.to} to={l.to} onClick={() => setAbierto(false)}
                  className={`group relative flex items-center px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${
                    active ? 'text-white bg-white/10' : 'text-green-100/90 hover:text-white hover:bg-white/10'
                  }`}
                >
                  <span
                    className={`absolute left-0 top-1/2 -translate-y-1/2 h-4 w-[3px] rounded-full transition-all duration-200 ${
                      active ? 'bg-emerald-400 opacity-100' : 'bg-emerald-400 opacity-0 group-hover:opacity-70'
                    }`}
                  />
                  <span className="pl-2">{l.label}</span>
                </Link>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

function BottomNav({ links, onLogout, darkMode, setDarkMode }) {
  const location = useLocation()
  const navigate = useNavigate()
  const [mostrarMas, setMostrarMas] = useState(false)

  const principales = links.slice(0, 4)
  const secundarios = links.slice(4)

  const iconos = {
    '/': '🏠',
    '/pacientes': '👤',
    '/citas': '📅',
    '/pagos': '💰',
    '/pap': '🧪',
    '/flujos': '🔬',
    '/pcr-vph': '🔬',
    '/encuestas': '📋',
    '/procedimientos': '🩺',
    '/reportes': '📊',
    '/usuarios': '👥',
    '/profesionales': '👩‍⚕️',
    '/horarios': '🗓️',
    '/logs': '📝',
    '/controles': '📆',
    '/': '🖥️',
  }

  return (
    <>
      {mostrarMas && (
        <div className="fixed inset-0 z-40" onClick={() => setMostrarMas(false)}>
          <div className="fixed bottom-20 left-0 right-0 mx-4 bg-white rounded-2xl shadow-xl p-4 z-50" onClick={e => e.stopPropagation()}>
            <p className="text-xs text-gray-400 uppercase font-semibold mb-3">Más opciones</p>
            <div className="grid grid-cols-3 gap-3">
              {secundarios.map(l => {
                const active = location.pathname === l.to
                return (
                  <Link key={l.to} to={l.to} onClick={() => setMostrarMas(false)}
                    className={`flex flex-col items-center gap-1 p-3 rounded-xl text-center transition-colors ${active ? 'bg-green-50 text-green-800' : 'text-gray-600 hover:bg-gray-50'}`}
                  >
                    <span className="text-2xl">{iconos[l.to] || '📌'}</span>
                    <span className="text-xs font-medium">{l.label}</span>
                  </Link>
                )
              })}
              <Link to="/cambiar-password" onClick={() => setMostrarMas(false)}
                className="flex flex-col items-center gap-1 p-3 rounded-xl text-center text-gray-600 hover:bg-gray-50"
              >
                <span className="text-2xl">🔑</span>
                <span className="text-xs font-medium">Contraseña</span>
              </Link>
              <button onClick={() => { setDarkMode(d => !d) }}
                className="flex flex-col items-center gap-1 p-3 rounded-xl text-center text-gray-600 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-700"
              >
                <span className="text-2xl">{darkMode ? '☀️' : '🌙'}</span>
                <span className="text-xs font-medium">{darkMode ? 'Claro' : 'Oscuro'}</span>
              </button>
              <button onClick={() => { setMostrarMas(false); onLogout() }}
                className="flex flex-col items-center gap-1 p-3 rounded-xl text-center text-red-500 hover:bg-red-50"
              >
                <span className="text-2xl">🚪</span>
                <span className="text-xs font-medium">Salir</span>
              </button>
            </div>
          </div>
        </div>
      )}

      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 z-30 shadow-lg">
        <div className="flex items-center justify-around px-2 py-2">
          {principales.map(l => {
            const active = location.pathname === l.to
            return (
              <Link key={l.to} to={l.to}
                className={`flex flex-col items-center gap-0.5 px-3 py-1 rounded-xl transition-colors min-w-0 ${active ? 'text-green-700' : 'text-gray-400'}`}
              >
                <span className="text-2xl">{iconos[l.to] || '📌'}</span>
                <span className="text-xs font-medium truncate">{l.label}</span>
              </Link>
            )
          })}
          {secundarios.length > 0 && (
            <button onClick={() => setMostrarMas(!mostrarMas)}
              className={`flex flex-col items-center gap-0.5 px-3 py-1 rounded-xl transition-colors ${mostrarMas ? 'text-green-700' : 'text-gray-400'}`}
            >
              <span className="text-2xl">⋯</span>
              <span className="text-xs font-medium">Más</span>
            </button>
          )}
        </div>
      </nav>
    </>
  )
}

function Layout({ usuario, onLogout, darkMode, setDarkMode }) {
  const [menuAbierto, setMenuAbierto] = useState(false)
  const rol = usuario.rol

  // Navbar flotante: se oculta al hacer scroll hacia abajo y reaparece al subir,
  // o si el mouse se acerca al borde superior de la pantalla.
  const [navVisible, setNavVisible] = useState(true)
  const [navFloating, setNavFloating] = useState(false)
  const [navHeight, setNavHeight] = useState(72)
  const navRef = useRef(null)
  const ultimoScrollY = useRef(0)

  useEffect(() => {
    if (navRef.current) setNavHeight(navRef.current.offsetHeight)
  }, [menuAbierto, navFloating])

  useEffect(() => {
    const UMBRAL = 80
    const manejarScroll = () => {
      const y = window.scrollY
      setNavFloating(y > 24)
      if (y < UMBRAL) {
        setNavVisible(true)
      } else if (y > ultimoScrollY.current) {
        setNavVisible(false)
      } else if (y < ultimoScrollY.current) {
        setNavVisible(true)
      }
      ultimoScrollY.current = y
    }
    const manejarMouse = e => {
      if (e.clientY < 60) setNavVisible(true)
    }
    window.addEventListener('scroll', manejarScroll, { passive: true })
    window.addEventListener('mousemove', manejarMouse)
    return () => {
      window.removeEventListener('scroll', manejarScroll)
      window.removeEventListener('mousemove', manejarMouse)
    }
  }, [])

  const linksAdmin = [
    { to: '/', label: 'Inicio' },
    { to: '/pacientes', label: 'Pacientes' },
    { to: '/profesionales', label: 'Profesionales' },
    { to: '/horarios', label: 'Horarios' },
    { to: '/citas', label: 'Agenda' },
    { to: '/pagos', label: 'Pagos' },
    { to: '/usuarios', label: 'Usuarios' },
    { to: '/reportes', label: 'Reportes' },
    { to: '/procedimientos', label: 'Procedimientos' },
    { to: '/pap', label: 'PAP' },
    { to: '/flujos', label: 'Flujos' },
    { to: '/pcr-vph', label: 'PCR VPH' },
    { to: '/encuestas', label: 'Encuestas' },
    { to: '/logs', label: 'Actividad' },
    { to: '/controles', label: 'Controles' },
  ]

  const linksSecretaria = [
    { to: '/', label: 'Inicio' },
    { to: '/citas', label: 'Agenda' },
    { to: '/pacientes', label: 'Pacientes' },
    { to: '/pagos', label: 'Pagos' },
    { to: '/procedimientos', label: 'Procedimientos' },
    { to: '/horarios', label: 'Horarios' },
    { to: '/pap', label: 'PAP' },
    { to: '/flujos', label: 'Flujos' },
    { to: '/pcr-vph', label: 'PCR VPH' },
    { to: '/encuestas', label: 'Encuestas' },
    { to: '/controles', label: 'Controles' },
  ]

  const linksMatrona = [
    { to: '/', label: 'Mi Agenda' },
    { to: '/pacientes', label: 'Pacientes' },
    { to: '/citas', label: 'Agenda' },
    { to: '/pagos', label: 'Pagos' },
    { to: '/pap', label: 'PAP' },
    { to: '/flujos', label: 'Flujos' },
    { to: '/pcr-vph', label: 'PCR VPH' },
    { to: '/horarios', label: 'Horarios' },
    { to: '/encuestas', label: 'Encuestas' },
    { to: '/reportes', label: 'Reportes' },
  ]

  const linksRecepcionista = [
    { to: '/', label: 'Agenda' },
  ]

  const links = rol === 'admin' ? linksAdmin : rol === 'secretaria' ? linksSecretaria : rol === 'matrona' ? linksMatrona : linksRecepcionista

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
      <nav
        ref={navRef}
        className={`fixed z-40 transition-all duration-500 ease-out ${
          navVisible ? 'translate-y-0 opacity-100' : '-translate-y-[130%] opacity-0'
        } ${
          navFloating
            ? 'top-3 left-3 right-3 md:left-6 md:right-6 rounded-2xl px-4 py-2.5 border border-white/10 dark:border-gray-700 backdrop-blur-xl shadow-[0_10px_40px_-6px_rgba(5,46,22,0.55)]'
            : 'top-0 left-0 right-0 px-4 py-3 shadow-md'
        }`}
        style={{
          background: navFloating
            ? 'linear-gradient(135deg, rgba(5,46,22,0.92), rgba(22,101,52,0.92))'
            : 'linear-gradient(135deg, #052e16, #166534)',
        }}
      >
        {/* Línea de energía animada en el borde inferior */}
        <div className="absolute left-4 right-4 -bottom-px h-px overflow-hidden rounded-full">
          <div className="nav-aurora h-full w-full" />
        </div>

        {/* Brillo que recorre el navbar de tanto en tanto */}
        <div className={`absolute inset-0 overflow-hidden pointer-events-none ${navFloating ? 'rounded-2xl' : ''}`}>
          <div className="nav-sheen absolute top-0 h-full w-1/4" style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.12), transparent)' }} />
        </div>

        <div className="relative flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3" onClick={() => setMenuAbierto(false)}>
            <div className="relative">
              <div className="nav-logo-halo absolute -inset-1 rounded-full blur-md" style={{ background: 'radial-gradient(circle, #4ade80, transparent 70%)' }} />
              <img src="/logo.png" alt="Saberes" className="relative h-10 w-10 rounded-full object-cover ring-2 ring-white/20" />
            </div>
            <div className="leading-tight">
              <div className="text-white font-bold text-base tracking-wide">Saberes</div>
              <div className="text-green-200 text-xs capitalize">{rol}</div>
            </div>
          </Link>

          <button className="hidden text-white focus:outline-none" onClick={() => setMenuAbierto(!menuAbierto)}>
            {menuAbierto ? (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            ) : (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
            )}
          </button>

          <div className="hidden md:flex items-center gap-2">
            {links.slice(0, 4).map(l => <NavLink key={l.to} to={l.to}>{l.label}</NavLink>)}
            {links.length > 4 && <NavDropdown links={links.slice(4)} />}
            <div className="ml-4 flex items-center gap-3 border-l border-white/15 pl-4">
              <span className="text-green-200 text-sm">Hola, {usuario.nombre}</span>
              <Link to="/cambiar-password" className="text-green-200 hover:text-white text-sm transition-colors">🔑</Link>
              <button onClick={() => setDarkMode(!darkMode)} className="text-green-200 hover:text-white text-lg transition-colors" title={darkMode ? 'Modo claro' : 'Modo oscuro'}>
                {darkMode ? '☀️' : '🌙'}
              </button>
              <button onClick={onLogout} className="text-white bg-white/10 hover:bg-red-500/80 border border-white/10 px-3 py-1 rounded-lg text-sm font-medium transition-all">Salir</button>
            </div>
          </div>
        </div>

        {menuAbierto && (
          <div className="hidden flex flex-col gap-1 mt-3 border-t border-green-700 pt-3">
            {links.map(l => <NavLink key={l.to} to={l.to} onClick={() => setMenuAbierto(false)}>{l.label}</NavLink>)}
            <div className="border-t border-green-700 pt-2 mt-1">
              <span className="text-green-200 text-sm block px-4 py-1">Hola, {usuario.nombre}</span>
              <Link to="/cambiar-password" className="text-green-200 hover:text-white text-sm block px-4 py-2">🔑 Cambiar contraseña</Link>
              <button onClick={onLogout} className="text-white text-sm font-medium px-4 py-2 hover:bg-green-700 rounded-lg w-full text-left">Cerrar sesión</button>
            </div>
          </div>
        )}
      </nav>

      {/* Espaciador para compensar el navbar fijo */}
      <div style={{ height: navHeight }} />

      <main className="max-w-6xl mx-auto p-4 md:p-6 pb-40 md:pb-6 dark:text-gray-100">
        <Routes>
          {rol === 'admin' && <>
            <Route index element={<Inicio />} />
            <Route path="pacientes" element={<Pacientes />} />
            <Route path="profesionales" element={<Profesionales />} />
            <Route path="horarios" element={<HorariosMatronas />} />
            <Route path="citas" element={<Agenda />} />
            <Route path="pagos" element={<Pagos />} />
            <Route path="usuarios" element={<Usuarios />} />
            <Route path="reportes" element={<Reportes />} />
            <Route path="cambiar-password" element={<CambiarPassword />} />
            <Route path="procedimientos" element={<Procedimientos />} />
            <Route path="pap" element={<Pap />} />
            <Route path="flujos" element={<Flujos />} />
            <Route path="pcr-vph" element={<PcrVph />} />
            <Route path="encuestas" element={<Encuestas />} />
            <Route path="logs" element={<Logs />} />
            <Route path="controles" element={<Controles />} />
            <Route path="*" element={<Navigate to="/" />} />
          </>}
          {rol === 'secretaria' && <>
            <Route index element={<Inicio />} />
            <Route path="pacientes" element={<Pacientes />} />
            <Route path="citas" element={<Agenda />} />
            <Route path="pagos" element={<Pagos />} />
            <Route path="procedimientos" element={<Procedimientos />} />
            <Route path="cambiar-password" element={<CambiarPassword />} />
            <Route path="pap" element={<Pap />} />
            <Route path="flujos" element={<Flujos />} />
            <Route path="pcr-vph" element={<PcrVph />} />
            <Route path="encuestas" element={<Encuestas />} />
            <Route path="controles" element={<Controles />} />
            <Route path="horarios" element={<Horarios />} />
            <Route path="*" element={<Navigate to="/pacientes" />} />
          </>}
          {rol === 'matrona' && <>
            <Route index element={<InicioMatrona usuario={usuario} />} />
            <Route path="pacientes" element={<Pacientes />} />
            <Route path="citas" element={<Agenda />} />
            <Route path="pagos" element={<Pagos />} />
            <Route path="cambiar-password" element={<CambiarPassword />} />
            <Route path="pap" element={<Pap />} />
            <Route path="flujos" element={<Flujos />} />
            <Route path="pcr-vph" element={<PcrVph />} />
            <Route path="encuestas" element={<Encuestas />} />
            <Route path="reportes" element={<Reportes />} />
            <Route path="horarios" element={<Horarios />} />
            <Route path="*" element={<Navigate to="/" />} />
          </>}
          {rol === 'recepcionista' && <>
            <Route index element={<InicioRecepcionista />} />
            <Route path="cambiar-password" element={<CambiarPassword />} />
            <Route path="*" element={<Navigate to="/" />} />
          </>}
        </Routes>
      </main>
      
      <AsistenteIA />

     <BottomNav links={links} onLogout={onLogout} usuario={usuario} darkMode={darkMode} setDarkMode={setDarkMode} />
    </div>
  )
}

function App() {
  const [usuario, setUsuario] = useState(null)
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem('darkMode') === 'true')

  useEffect(() => {
    const token = localStorage.getItem('token')
    const nombre = localStorage.getItem('nombre')
    const rol = localStorage.getItem('rol')
    if (token && nombre) setUsuario({ token, nombre, rol })
  }, [])

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
    localStorage.setItem('darkMode', darkMode)
  }, [darkMode])

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
          usuario
            ? <Layout usuario={usuario} onLogout={handleLogout} darkMode={darkMode} setDarkMode={setDarkMode} />
            : <Login onLogin={handleLogin} />
        } />
      </Routes>
    </BrowserRouter>
  )
}

export default App