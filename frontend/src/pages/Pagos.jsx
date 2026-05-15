import { useEffect, useState, useRef } from 'react'
import axios from 'axios'

const API = 'https://centro-medico-saberes-production.up.railway.app/pagos'
const API_PAC = 'https://centro-medico-saberes-production.up.railway.app/pacientes'

const metodoBadge = {
  efectivo: 'bg-green-100 text-green-700',
  transferencia: 'bg-blue-100 text-blue-700',
  debito: 'bg-purple-100 text-purple-700',
  credito: 'bg-orange-100 text-orange-700',
}

const estadoBadge = {
  pagado: 'bg-green-100 text-green-700',
  pendiente: 'bg-yellow-100 text-yellow-700',
  condonado: 'bg-gray-100 text-gray-600',
}

const metodoIcono = {
  efectivo: '💵',
  transferencia: '🏦',
  debito: '💳',
  credito: '💳',
}

function formatCLP(n) {
  return new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(n)
}

export default function Pagos() {
  const [pagos, setPagos] = useState([])
  const [pacientes, setPacientes] = useState([])
  const [resumen, setResumen] = useState(null)
  const [busqueda, setBusqueda] = useState('')
  const [filtroEstado, setFiltroEstado] = useState('')
  const [filtroMetodo, setFiltroMetodo] = useState('')
  const [mostrarForm, setMostrarForm] = useState(false)
  const [editando, setEditando] = useState(null)
  const [form, setForm] = useState({ paciente_id: '', monto: '', metodo: 'efectivo', estado: 'pagado', notas: '' })
  const [errores, setErrores] = useState({})
  const [busquedaPaciente, setBusquedaPaciente] = useState('')
  const [mostrarDropdown, setMostrarDropdown] = useState(false)
  const dropdownRef = useRef(null)

  const cargar = async () => {
    const [p, pa, r] = await Promise.all([axios.get(API), axios.get(API_PAC), axios.get(`${API}/resumen`)])
    setPagos(p.data)
    setPacientes(pa.data)
    setResumen(r.data)
  }

  useEffect(() => { cargar() }, [])

  useEffect(() => {
    const handleClick = e => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) setMostrarDropdown(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const pacientesFiltrados = pacientes.filter(p => {
    const q = busquedaPaciente.toLowerCase()
    return p.nombre.toLowerCase().includes(q) || p.apellido.toLowerCase().includes(q) || (p.rut && p.rut.toLowerCase().includes(q))
  }).slice(0, 8)

  const seleccionarPaciente = p => {
    setBusquedaPaciente(`${p.nombre} ${p.apellido}${p.rut ? ' — ' + p.rut : ''}`)
    setForm(f => ({ ...f, paciente_id: p.id }))
    setMostrarDropdown(false)
    setErrores(e => ({ ...e, paciente_id: '' }))
  }

  const handleChange = e => {
    setForm({ ...form, [e.target.name]: e.target.value })
    setErrores({ ...errores, [e.target.name]: '' })
  }

  const validar = () => {
    const e = {}
    if (!form.paciente_id) e.paciente_id = 'Selecciona un paciente'
    if (!form.monto || isNaN(form.monto) || Number(form.monto) <= 0) e.monto = 'Ingresa un monto válido'
    return e
  }

  const guardar = async () => {
    const e = validar()
    if (Object.keys(e).length > 0) { setErrores(e); return }
    if (editando) {
      await axios.put(`${API}/${editando}`, form)
      setEditando(null)
    } else {
      await axios.post(API, form)
    }
    setForm({ paciente_id: '', monto: '', metodo: 'efectivo', estado: 'pagado', notas: '' })
    setBusquedaPaciente('')
    setErrores({})
    setMostrarForm(false)
    cargar()
  }

  const editar = p => {
    setForm({ paciente_id: p.paciente_id, monto: p.monto, metodo: p.metodo, estado: p.estado, notas: p.notas || '' })
    setBusquedaPaciente(`${p.paciente_nombre} ${p.paciente_apellido}`)
    setEditando(p.id)
    setMostrarForm(true)
  }

  const eliminar = async id => {
    if (confirm('¿Eliminar pago?')) {
      await axios.delete(`${API}/${id}`)
      cargar()
    }
  }

  const cancelar = () => {
    setEditando(null)
    setForm({ paciente_id: '', monto: '', metodo: 'efectivo', estado: 'pagado', notas: '' })
    setBusquedaPaciente('')
    setErrores({})
    setMostrarForm(false)
  }

  const filtrados = pagos.filter(p => {
    const q = busqueda.toLowerCase()
    const coincideBusqueda = !busqueda ||
      `${p.paciente_nombre} ${p.paciente_apellido}`.toLowerCase().includes(q) ||
      (p.paciente_rut && p.paciente_rut.toLowerCase().includes(q)) ||
      (p.notas && p.notas.toLowerCase().includes(q))
    const coincideEstado = !filtroEstado || p.estado === filtroEstado
    const coincideMetodo = !filtroMetodo || p.metodo === filtroMetodo
    return coincideBusqueda && coincideEstado && coincideMetodo
  })

  return (
    <div>
      <h2 className="text-2xl font-bold text-green-800 mb-6">Pagos</h2>

      {/* Resumen */}
      {resumen && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-2xl shadow-sm p-5 border-l-4 border-green-600">
            <p className="text-xs text-gray-500 mb-1">Recaudado hoy</p>
            <p className="text-2xl font-bold text-gray-800">{formatCLP(resumen.totalDia)}</p>
          </div>
          <div className="bg-white rounded-2xl shadow-sm p-5 border-l-4 border-blue-500">
            <p className="text-xs text-gray-500 mb-1">Recaudado este mes</p>
            <p className="text-2xl font-bold text-gray-800">{formatCLP(resumen.totalMes)}</p>
          </div>
          <div className="bg-white rounded-2xl shadow-sm p-5 border-l-4 border-yellow-500">
            <p className="text-xs text-gray-500 mb-1">Pagos pendientes</p>
            <p className="text-2xl font-bold text-gray-800">{resumen.pendientes.cantidad}</p>
            <p className="text-xs text-yellow-600 mt-1">{formatCLP(resumen.pendientes.monto)}</p>
          </div>
          <div className="bg-white rounded-2xl shadow-sm p-5 border-l-4 border-purple-500">
            <p className="text-xs text-gray-500 mb-2">Por método (mes)</p>
            <div className="flex flex-col gap-1">
              {resumen.porMetodo.map(m => (
                <div key={m.metodo} className="flex justify-between text-xs">
                  <span className="text-gray-600 capitalize">{metodoIcono[m.metodo]} {m.metodo}</span>
                  <span className="font-medium text-gray-800">{formatCLP(m.total)}</span>
                </div>
              ))}
              {resumen.porMetodo.length === 0 && <span className="text-xs text-gray-400">Sin pagos este mes</span>}
            </div>
          </div>
        </div>
      )}

      {/* Botón nuevo pago */}
      <div className="flex justify-end mb-4">
        <button
          onClick={() => { setMostrarForm(!mostrarForm); if (mostrarForm) cancelar() }}
          className="bg-green-700 text-white px-5 py-2 rounded-lg hover:bg-green-800 font-medium transition-colors"
        >
          {mostrarForm ? 'Cancelar' : '+ Registrar pago'}
        </button>
      </div>

      {/* Formulario */}
      {mostrarForm && (
        <div className="bg-white rounded-xl shadow p-5 mb-6">
          <h3 className="text-lg font-semibold text-gray-700 mb-4">{editando ? 'Editar pago' : 'Registrar nuevo pago'}</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">

            {/* Buscador paciente */}
            <div className="flex flex-col relative" ref={dropdownRef}>
              <label className="text-sm text-gray-600 mb-1">Paciente</label>
              <input
                className={`border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-400 ${errores.paciente_id ? 'border-red-400' : 'border-gray-300'}`}
                placeholder="Buscar por nombre, apellido o RUT..."
                value={busquedaPaciente}
                onChange={e => {
                  setBusquedaPaciente(e.target.value)
                  setMostrarDropdown(true)
                  setForm(f => ({ ...f, paciente_id: '' }))
                  setErrores(er => ({ ...er, paciente_id: '' }))
                }}
                onFocus={() => setMostrarDropdown(true)}
              />
              {errores.paciente_id && <span className="text-red-500 text-xs mt-1">{errores.paciente_id}</span>}
              {mostrarDropdown && busquedaPaciente.length > 0 && (
                <div className="absolute top-full left-0 right-0 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-48 overflow-y-auto mt-1">
                  {pacientesFiltrados.length === 0 ? (
                    <p className="px-3 py-2 text-sm text-gray-400">No se encontraron pacientes</p>
                  ) : (
                    pacientesFiltrados.map(p => (
                      <button key={p.id} className="w-full text-left px-3 py-2 hover:bg-green-50 text-sm border-b border-gray-100 last:border-0" onClick={() => seleccionarPaciente(p)}>
                        <span className="font-medium text-gray-800">{p.nombre} {p.apellido}</span>
                        {p.rut && <span className="text-gray-400 ml-2 text-xs">{p.rut}</span>}
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>

            {/* Monto */}
            <div className="flex flex-col">
              <label className="text-sm text-gray-600 mb-1">Monto ($)</label>
              <input
                className={`border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-400 ${errores.monto ? 'border-red-400' : 'border-gray-300'}`}
                name="monto" type="number" placeholder="25000" value={form.monto} onChange={handleChange}
              />
              {errores.monto && <span className="text-red-500 text-xs mt-1">{errores.monto}</span>}
            </div>

            {/* Método */}
            <div className="flex flex-col">
              <label className="text-sm text-gray-600 mb-1">Método de pago</label>
              <select className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-400" name="metodo" value={form.metodo} onChange={handleChange}>
                <option value="efectivo">💵 Efectivo</option>
                <option value="transferencia">🏦 Transferencia</option>
                <option value="debito">💳 Débito</option>
                <option value="credito">💳 Crédito</option>
              </select>
            </div>

            {/* Estado */}
            <div className="flex flex-col">
              <label className="text-sm text-gray-600 mb-1">Estado</label>
              <select className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-400" name="estado" value={form.estado} onChange={handleChange}>
                <option value="pagado">Pagado</option>
                <option value="pendiente">Pendiente</option>
                <option value="condonado">Condonado</option>
              </select>
            </div>

            {/* Notas */}
            <div className="flex flex-col sm:col-span-2">
              <label className="text-sm text-gray-600 mb-1">Notas (opcional)</label>
              <input className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-400" name="notas" placeholder="Ej: Control mensual, primera consulta..." value={form.notas} onChange={handleChange} />
            </div>
          </div>

          <div className="flex gap-3 mt-4">
            <button onClick={guardar} className="bg-green-700 text-white px-5 py-2 rounded-lg hover:bg-green-800 font-medium">
              {editando ? 'Actualizar' : 'Registrar pago'}
            </button>
            <button onClick={cancelar} className="bg-gray-200 text-gray-700 px-5 py-2 rounded-lg hover:bg-gray-300 font-medium">Cancelar</button>
          </div>
        </div>
      )}

      {/* Filtros */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <input
            className="w-full border border-gray-300 rounded-lg px-4 py-2 pl-10 focus:outline-none focus:ring-2 focus:ring-green-400"
            placeholder="Buscar por paciente, RUT o notas..."
            value={busqueda} onChange={e => setBusqueda(e.target.value)}
          />
          <span className="absolute left-3 top-2.5 text-gray-400">🔍</span>
          {busqueda && <button onClick={() => setBusqueda('')} className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600">✕</button>}
        </div>
        <select className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-400" value={filtroEstado} onChange={e => setFiltroEstado(e.target.value)}>
          <option value="">Todos los estados</option>
          <option value="pagado">Pagado</option>
          <option value="pendiente">Pendiente</option>
          <option value="condonado">Condonado</option>
        </select>
        <select className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-400" value={filtroMetodo} onChange={e => setFiltroMetodo(e.target.value)}>
          <option value="">Todos los métodos</option>
          <option value="efectivo">Efectivo</option>
          <option value="transferencia">Transferencia</option>
          <option value="debito">Débito</option>
          <option value="credito">Crédito</option>
        </select>
      </div>

      {/* Tabla escritorio */}
      <div className="hidden md:block bg-white rounded-xl shadow overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-green-50 text-green-800 uppercase text-xs">
            <tr>
              <th className="px-4 py-3 text-left">Paciente</th>
              <th className="px-4 py-3 text-left">Fecha</th>
              <th className="px-4 py-3 text-left">Monto</th>
              <th className="px-4 py-3 text-left">Método</th>
              <th className="px-4 py-3 text-left">Estado</th>
              <th className="px-4 py-3 text-left">Notas</th>
              <th className="px-4 py-3 text-left">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filtrados.map(p => (
              <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-4 py-3">
                  <p className="font-medium text-gray-800">{p.paciente_nombre} {p.paciente_apellido}</p>
                  {p.paciente_rut && <p className="text-xs text-gray-400">{p.paciente_rut}</p>}
                </td>
                <td className="px-4 py-3 text-gray-600">{new Date(p.fecha).toLocaleDateString('es-CL')}</td>
                <td className="px-4 py-3 font-semibold text-gray-800">{formatCLP(p.monto)}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${metodoBadge[p.metodo]}`}>{metodoIcono[p.metodo]} {p.metodo}</span>
                </td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-1 rounded-full text-xs font-semibold ${estadoBadge[p.estado]}`}>{p.estado}</span>
                </td>
                <td className="px-4 py-3 text-gray-500 text-xs">{p.notas}</td>
                <td className="px-4 py-3 flex gap-2">
                  <button onClick={() => editar(p)} className="text-green-700 hover:underline text-sm font-medium">Editar</button>
                  <button onClick={() => eliminar(p.id)} className="text-red-500 hover:underline text-sm font-medium">Eliminar</button>
                </td>
              </tr>
            ))}
            {filtrados.length === 0 && (
              <tr><td colSpan="7" className="px-4 py-6 text-center text-gray-400">{busqueda || filtroEstado || filtroMetodo ? 'No se encontraron resultados' : 'No hay pagos registrados'}</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Tarjetas móvil */}
      <div className="md:hidden flex flex-col gap-3">
        {filtrados.map(p => (
          <div key={p.id} className="bg-white rounded-xl shadow p-4">
            <div className="flex justify-between items-start mb-2">
              <div>
                <p className="font-semibold text-gray-800">{p.paciente_nombre} {p.paciente_apellido}</p>
                <p className="text-xs text-gray-400">{new Date(p.fecha).toLocaleDateString('es-CL')}</p>
              </div>
              <p className="font-bold text-green-800 text-lg">{formatCLP(p.monto)}</p>
            </div>
            <div className="flex gap-2 mb-2">
              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${metodoBadge[p.metodo]}`}>{metodoIcono[p.metodo]} {p.metodo}</span>
              <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${estadoBadge[p.estado]}`}>{p.estado}</span>
            </div>
            {p.notas && <p className="text-xs text-gray-400 mb-2">{p.notas}</p>}
            <div className="flex gap-3">
              <button onClick={() => editar(p)} className="text-green-700 text-sm font-medium">Editar</button>
              <button onClick={() => eliminar(p.id)} className="text-red-500 text-sm font-medium">Eliminar</button>
            </div>
          </div>
        ))}
        {filtrados.length === 0 && (
          <div className="bg-white rounded-xl shadow p-6 text-center text-gray-400">{busqueda || filtroEstado || filtroMetodo ? 'No se encontraron resultados' : 'No hay pagos registrados'}</div>
        )}
      </div>
    </div>
  )
}