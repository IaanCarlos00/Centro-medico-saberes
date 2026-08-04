export default function ModalAgendarRapido({
  editando,
  cerrarModalAgendar,
  tipoAgendamiento,
  setTipoAgendamiento,
  dropdownRef,
  errores,
  busquedaPaciente,
  setBusquedaPaciente,
  setMostrarDropdown,
  setForm,
  setErrores,
  mostrarDropdown,
  pacientesFiltrados,
  seleccionarPaciente,
  mostrarNuevoPaciente,
  setMostrarNuevoPaciente,
  formNuevoPaciente,
  setFormNuevoPaciente,
  crearPaciente,
  profesionales,
  form,
  handleChange,
  procedimientoSeleccionado,
  setProcedimientoSeleccionado,
  catalogo,
  metodoPago,
  setMetodoPago,
  numeroBono,
  setNumeroBono,
  guardarAgendamiento,
  finalizarAtencion,
}) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 px-4" onClick={cerrarModalAgendar}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] flex flex-col overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className="px-6 py-5 flex items-center justify-between shrink-0" style={{ background: 'linear-gradient(135deg, #052e16, #166534)' }}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl" style={{ background: 'rgba(255,255,255,0.15)' }}>
              {editando ? '✏️' : '🗓️'}
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">{editando ? 'Editar cita' : 'Nueva cita'}</h3>
              <p className="text-green-300 text-xs">{editando ? 'Modifica los datos' : 'Agenda una nueva cita'}</p>
            </div>
          </div>
          <button onClick={cerrarModalAgendar} className="text-white hover:text-green-200 text-2xl">✕</button>
        </div>
        <div className="p-6 overflow-y-auto flex-1 min-h-0">
        <div className="flex gap-2 mb-4">
          <button onClick={() => setTipoAgendamiento('confirmado')} className={`flex-1 py-2 rounded-lg text-sm font-medium border-2 transition-colors ${tipoAgendamiento === 'confirmado' ? 'border-green-600 bg-green-50 text-green-800' : 'border-gray-200 text-gray-500'}`}>✅ Confirmada</button>
          <button onClick={() => setTipoAgendamiento('tentativo')} className={`flex-1 py-2 rounded-lg text-sm font-medium border-2 transition-colors ${tipoAgendamiento === 'tentativo' ? 'border-yellow-500 bg-yellow-50 text-yellow-800' : 'border-gray-200 text-gray-500'}`}>⏳ Tentativa</button>
        </div>
        {tipoAgendamiento === 'confirmado' ? (
        <div className="flex flex-col gap-4">
          <div className="flex flex-col relative" ref={dropdownRef}>
            <label className="text-sm text-gray-600 mb-1">Paciente</label>
            <input
              className={`border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-400 ${errores.paciente_id ? 'border-red-400' : 'border-gray-300'}`}
              placeholder="Buscar por nombre, apellido o RUT..."
              value={busquedaPaciente}
              onChange={e => { setBusquedaPaciente(e.target.value); setMostrarDropdown(true); setForm(f => ({ ...f, paciente_id: '' })); setErrores(er => ({ ...er, paciente_id: '' })) }}
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

          <div className="flex flex-col gap-2">
            <button type="button" onClick={() => setMostrarNuevoPaciente(!mostrarNuevoPaciente)} className="text-green-700 text-sm hover:underline text-left font-medium">
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

          <div className="flex flex-col">
            <label className="text-sm text-gray-600 mb-1">Profesional</label>
            <select className={`border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-400 w-full ${errores.profesional_id ? 'border-red-400' : 'border-gray-300'}`} name="profesional_id" value={form.profesional_id} onChange={handleChange}>
              <option value="">Seleccionar profesional</option>
              {profesionales.map(p => <option key={p.id} value={p.id}>{p.nombre} {p.apellido}</option>)}
            </select>
            {errores.profesional_id && <span className="text-red-500 text-xs mt-1">{errores.profesional_id}</span>}
          </div>

          <div className="flex flex-col">
            <label className="text-sm text-gray-600 mb-1">Hora de la cita</label>
            <input className={`border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-400 ${errores.fecha_hora ? 'border-red-400' : 'border-gray-300'}`} name="fecha_hora" type="datetime-local" value={form.fecha_hora} onChange={handleChange} />
            {errores.fecha_hora && <span className="text-red-500 text-xs mt-1">{errores.fecha_hora}</span>}
          </div>

          <div className="flex flex-col">
            <label className="text-sm text-gray-600 mb-1">Observaciones (opcional)</label>
            <input className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-400" name="observaciones" value={form.observaciones} onChange={handleChange} />
          </div>

          <div className="flex flex-col">
            <label className="text-sm text-gray-600 mb-1">Duración de la consulta</label>
            <select className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-400" name="duracion_minutos" value={form.duracion_minutos || 30} onChange={handleChange}>
              <option value={15}>15 minutos</option>
              <option value={30}>30 minutos</option>
              <option value={45}>45 minutos</option>
            </select>
          </div>

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

          <div className="flex flex-col">
            <label className="text-sm text-gray-600 mb-1">Procedimiento (opcional)</label>
            <select className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-400" value={procedimientoSeleccionado?.id || ''} onChange={e => {
              const proc = catalogo.find(c => c.id === parseInt(e.target.value))
              setProcedimientoSeleccionado(proc || null)
            }}>
              <option value="">Sin procedimiento — quedará pendiente</option>
              {catalogo.map(c => <option key={c.id} value={c.id}>{c.nombre} — ${Number(c.monto).toLocaleString('es-CL')}</option>)}
            </select>
          </div>

          {procedimientoSeleccionado && (
            <>
              <div className="flex flex-col">
                <label className="text-sm text-gray-600 mb-1">Método de pago</label>
                <select className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-400" value={metodoPago} onChange={e => setMetodoPago(e.target.value)}>
                  <option value="debito">💳 Débito</option>
                  <option value="efectivo">💵 Efectivo</option>
                  <option value="transferencia">🏦 Transferencia</option>
                  <option value="fonasa">🏥 Fonasa</option>
                  <option value="credito">💳 Crédito</option>
                </select>
              </div>
              {metodoPago === 'fonasa' && (
                <div className="flex flex-col">
                  <label className="text-sm text-gray-600 mb-1">Número de bono</label>
                  <input
                    className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-400"
                    placeholder="Ej: 123456789"
                    value={numeroBono}
                    onChange={e => setNumeroBono(e.target.value)}
                  />
                </div>
              )}
            </>
          )}
        </div>
  ) : (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col">
        <label className="text-sm text-gray-600 mb-1">Referencia (opcional)</label>
        <input
          className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-yellow-400"
          placeholder="Nombre, teléfono, últimos 4 dígitos..."
          value={form.referencia || ''}
          onChange={e => setForm(f => ({ ...f, referencia: e.target.value }))}
        />
        <p className="text-xs text-gray-400 mt-1">Puede dejarse en blanco si no hay datos</p>
      </div>
      <div className="flex flex-col">
        <label className="text-sm text-gray-600 mb-1">Profesional *</label>
        <select className={`border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-yellow-400 w-full ${errores.profesional_id ? 'border-red-400' : 'border-gray-300'}`} name="profesional_id" value={form.profesional_id} onChange={handleChange}>
          <option value="">Seleccionar profesional</option>
          {profesionales.map(p => <option key={p.id} value={p.id}>{p.nombre} {p.apellido}</option>)}
        </select>
        {errores.profesional_id && <span className="text-red-500 text-xs mt-1">{errores.profesional_id}</span>}
      </div>
      <div className="flex flex-col">
        <label className="text-sm text-gray-600 mb-1">Hora de la cita</label>
        <input className={`border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-yellow-400 ${errores.fecha_hora ? 'border-red-400' : 'border-gray-300'}`} name="fecha_hora" type="datetime-local" value={form.fecha_hora} onChange={handleChange} />
        {errores.fecha_hora && <span className="text-red-500 text-xs mt-1">{errores.fecha_hora}</span>}
      </div>
    </div>
  )}

  </div>
        <div className="px-6 py-4 flex gap-3 border-t border-gray-100 shrink-0">
          <button onClick={guardarAgendamiento} className="flex-1 text-white py-2.5 rounded-xl font-bold hover:opacity-90 transition-all" style={{ background: 'linear-gradient(135deg, #166534, #15803d)' }}>
            {editando ? '✓ Actualizar cita' : tipoAgendamiento === 'tentativo' ? '⏳ Reservar tentativa' : '+ Agendar'}
          </button>
          {editando && form.estado !== 'realizada' && (
            <button onClick={finalizarAtencion} className="flex-1 bg-teal-600 text-white py-2 rounded-lg hover:bg-teal-700 font-medium">
              ✅ Finalizar atención
            </button>
          )}
          <button onClick={cerrarModalAgendar} className="flex-1 bg-gray-100 text-gray-700 py-2.5 rounded-xl font-medium hover:bg-gray-200 transition-colors">Cancelar</button>
        </div>
      </div>
    </div>
  )
}