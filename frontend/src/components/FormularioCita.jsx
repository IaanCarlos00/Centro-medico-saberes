export default function FormularioCita({
  editando,
  form,
  handleChange,
  errores,
  setErrores,
  busquedaPaciente,
  setBusquedaPaciente,
  mostrarDropdown,
  setMostrarDropdown,
  setForm,
  setHistorialPaciente,
  pacientesFiltrados,
  seleccionarPaciente,
  dropdownRef,
  mostrarNuevoPaciente,
  setMostrarNuevoPaciente,
  formNuevoPaciente,
  setFormNuevoPaciente,
  crearPaciente,
  profesionales,
  historialPaciente,
  estadoColor,
  guardar,
  cancelar,
}) {
  return (
    <div className="bg-white rounded-xl shadow p-5 mb-6">
      <h3 className="text-lg font-semibold text-gray-700 mb-4">{editando ? 'Editar cita' : 'Agendar nueva cita'}</h3>
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
              setHistorialPaciente([])
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
                    <span className="text-gray-400 ml-2 text-xs">{p.rut}</span>
                  </button>
                ))
              )}
            </div>
          )}
        </div>

        <div className="flex flex-col gap-2 sm:col-span-full">
          <button
            type="button"
            onClick={() => setMostrarNuevoPaciente(!mostrarNuevoPaciente)}
            className="text-green-700 text-sm hover:underline text-left font-medium"
          >
            + Registrar paciente nuevo
          </button>
          {mostrarNuevoPaciente && (
            <div className="flex flex-col gap-2 bg-green-50 p-3 rounded-lg">
              <div className="grid grid-cols-2 gap-2">
                <div className="flex flex-col">
                  <label className="text-xs text-gray-500 mb-1">Nombre</label>
                  <input className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-400" placeholder="Nombre" value={formNuevoPaciente.nombre} onChange={e => setFormNuevoPaciente(f => ({ ...f, nombre: e.target.value }))} />
                </div>
                <div className="flex flex-col">
                  <label className="text-xs text-gray-500 mb-1">Apellido</label>
                  <input className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-400" placeholder="Apellido" value={formNuevoPaciente.apellido} onChange={e => setFormNuevoPaciente(f => ({ ...f, apellido: e.target.value }))} />
                </div>
              </div>
              <button onClick={crearPaciente} className="w-full bg-green-700 text-white px-4 py-2 rounded-lg hover:bg-green-800 text-sm font-medium">Crear paciente</button>
            </div>
          )}
        </div>

        {/* Profesional */}
        <div className="flex flex-col">
          <label className="text-sm text-gray-600 mb-1">Profesional</label>
          <select
            className={`border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-400 w-full ${errores.profesional_id ? 'border-red-400' : 'border-gray-300'}`}
            name="profesional_id" value={form.profesional_id} onChange={handleChange}
          >
            <option value="">Seleccionar profesional</option>
            {profesionales.map(p => <option key={p.id} value={p.id}>{p.nombre} {p.apellido}</option>)}
          </select>
          {errores.profesional_id && <span className="text-red-500 text-xs mt-1">{errores.profesional_id}</span>}
        </div>

        {/* Fecha */}
        <div className="flex flex-col">
          <label className="text-sm text-gray-600 mb-1">Hora de la cita <span className="text-gray-400 text-xs">(Lun-Vie 08:30-21:00)</span></label>
          <input
            className={`border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-400 ${errores.fecha_hora ? 'border-red-400' : 'border-gray-300'}`}
            name="fecha_hora" type="datetime-local"
            min={`${new Date().toISOString().slice(0,10)}T08:30`}
            value={form.fecha_hora} onChange={handleChange}
          />
          {errores.fecha_hora && <span className="text-red-500 text-xs mt-1">{errores.fecha_hora}</span>}
        </div>

        {/* Estado */}
        <div className="flex flex-col">
          <label className="text-sm text-gray-600 mb-1">Estado</label>
          <select className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-400 w-full" name="estado" value={form.estado} onChange={handleChange}>
            <option value="pendiente">Pendiente</option>
            <option value="confirmada">Confirmada</option>
            <option value="realizada">Realizada</option>
            <option value="cancelada">Cancelada</option>
          </select>
        </div>

        {/* Observaciones */}
        <div className="flex flex-col sm:col-span-2">
          <label className="text-sm text-gray-600 mb-1">Observaciones (opcional)</label>
          <input className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-400" name="observaciones" value={form.observaciones} onChange={handleChange} />
        </div>

        {/* Duración */}
        <div className="flex flex-col">
          <label className="text-sm text-gray-600 mb-1">Duración de la consulta</label>
          <select className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-400" name="duracion_minutos" value={form.duracion_minutos || 30} onChange={handleChange}>
            <option value={30}>30 minutos</option>
            <option value={45}>45 minutos</option>
          </select>
        </div>

        {/* Permite estudiantes */}
        <div className="flex flex-col">
          <label className="text-sm text-gray-600 mb-1">¿Permite atención con estudiantes?</label>
          <select
            className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-400"
            value={form.permite_estudiantes === null || form.permite_estudiantes === undefined ? '' : String(form.permite_estudiantes)}
            onChange={e => {
              const v = e.target.value
              setForm(f => ({ ...f, permite_estudiantes: v === '' ? null : v === 'true' }))
            }}
          >
            <option value="">No preguntado</option>
            <option value="true">Sí</option>
            <option value="false">No</option>
          </select>
        </div>
      </div>

      {/* Historial rápido del paciente */}
      {historialPaciente.length > 0 && (
        <div className="mt-4 p-3 bg-gray-50 rounded-lg">
          <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Últimas citas del paciente</p>
          <div className="flex flex-col gap-1">
            {historialPaciente.map(c => (
              <div key={c.id} className="flex items-center gap-3 text-sm">
                <span className="text-gray-500">{c.fecha_hora?.slice(0,16).replace('T',' ')}</span>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${estadoColor[c.estado]?.badge}`}>{c.estado}</span>
                <span className="text-gray-400">{c.profesional_nombre} {c.profesional_apellido}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex gap-3 mt-4">
        <button onClick={guardar} className="bg-green-700 text-white px-5 py-2 rounded-lg hover:bg-green-800 font-medium">
          {editando ? 'Actualizar' : 'Agendar'}
        </button>
        <button onClick={cancelar} className="bg-gray-200 text-gray-700 px-5 py-2 rounded-lg hover:bg-gray-300 font-medium">Cancelar</button>
      </div>
    </div>
  )
}
