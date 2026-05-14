import { useState } from 'react'
import { BrowserRouter, Routes, Route, Link, useLocation } from 'react-router-dom'
import Pacientes from './pages/Pacientes'
import Profesionales from './pages/Profesionales'
import Citas from './pages/Citas'
import Calendario from './pages/Calendario'
import Inicio from './pages/Inicio'

function NavLink({ to, children, onClick }) {
  const location = useLocation()
  const active = location.pathname === to
  return (
    <Link
      to={to}
      onClick={onClick}
      className={`px-4 py-2 rounded-lg font-medium transition-colors block md:inline-block ${
        active ? 'bg-white text-green-800' : 'text-white hover:bg-green-700'
      }`}
    >
      {children}
    </Link>
  )
}

function App() {
  const [menuAbierto, setMenuAbierto] = useState(false)

  return (
    <BrowserRouter>
      <div className="min-h-screen bg-gray-50">
        <nav className="bg-green-800 shadow-md px-4 py-3">
          <div className="flex items-center justify-between">
            <Link to="/" className="flex items-center gap-3" onClick={() => setMenuAbierto(false)}>
              <img src="/logo.png" alt="Saberes" className="h-10 w-10 rounded-full object-cover" />
              <div className="leading-tight">
                <div className="text-white font-bold text-base">Saberes</div>
                <div className="text-green-200 text-xs">Espacio de Salud Integral</div>
              </div>
            </Link>

            {/* Botón hamburguesa móvil */}
            <button
              className="md:hidden text-white focus:outline-none"
              onClick={() => setMenuAbierto(!menuAbierto)}
            >
              {menuAbierto ? (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>

            {/* Links escritorio */}
            <div className="hidden md:flex items-center gap-2">
              <NavLink to="/pacientes">Pacientes</NavLink>
              <NavLink to="/profesionales">Profesionales</NavLink>
              <NavLink to="/citas">Citas</NavLink>
              <NavLink to="/calendario">Calendario</NavLink>
            </div>
          </div>

          {/* Menú móvil desplegable */}
          {menuAbierto && (
            <div className="md:hidden flex flex-col gap-1 mt-3 border-t border-green-700 pt-3">
              <NavLink to="/pacientes" onClick={() => setMenuAbierto(false)}>Pacientes</NavLink>
              <NavLink to="/profesionales" onClick={() => setMenuAbierto(false)}>Profesionales</NavLink>
              <NavLink to="/citas" onClick={() => setMenuAbierto(false)}>Citas</NavLink>
              <NavLink to="/calendario" onClick={() => setMenuAbierto(false)}>Calendario</NavLink>
            </div>
          )}
        </nav>

        <main className="max-w-6xl mx-auto p-4 md:p-6">
          <Routes>
            <Route path="/" element={<Inicio />} />
            <Route path="/pacientes" element={<Pacientes />} />
            <Route path="/profesionales" element={<Profesionales />} />
            <Route path="/citas" element={<Citas />} />
            <Route path="/calendario" element={<Calendario />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  )
}

export default App