import { BrowserRouter, Routes, Route, Link, useLocation } from 'react-router-dom'
import Pacientes from './pages/Pacientes'
import Profesionales from './pages/Profesionales'
import Citas from './pages/Citas'
import Inicio from './pages/Inicio'
import Calendario from './pages/Calendario'

function NavLink({ to, children }) {
  const location = useLocation()
  const active = location.pathname === to
  return (
    <Link
      to={to}
      className={`px-4 py-2 rounded-lg font-medium transition-colors ${
        active ? 'bg-white text-green-800' : 'text-white hover:bg-green-700'
      }`}
    >
      {children}
    </Link>
  )
}

function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-gray-50">
        <nav className="bg-green-800 shadow-md px-6 py-3 flex items-center gap-4">
          <Link to="/" className="flex items-center gap-3 mr-4">
            <img src="/logo.png" alt="Saberes" className="h-10 w-10 rounded-full object-cover" />
            <div className="leading-tight">
              <div className="text-white font-bold text-base">Saberes</div>
              <div className="text-green-200 text-xs">Espacio de Salud Integral</div>
            </div>
          </Link>
          <NavLink to="/pacientes">Pacientes</NavLink>
          <NavLink to="/profesionales">Profesionales</NavLink>
          <NavLink to="/citas">Citas</NavLink>
          <NavLink to="/calendario">Calendario</NavLink>
        </nav>
        <main className="max-w-6xl mx-auto p-6">
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