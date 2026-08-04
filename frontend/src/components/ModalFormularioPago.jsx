export default function ModalFormularioPago({
  editando,
  cerrarModal,
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
  form,
  handleChange,
  catalogo,
  profesionales,
  guardar,
}) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 px-4" onClick={cerrarModal}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className="px-6 py-5 flex items-center justify-between" style={{ background: 'linear-gradient(135deg, #052e16, #166534)' }}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl" style={{ background: 'rgba(255,255,255,0.15)' }}>
              {editando ? '✏️' : '💰'}
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">{editando ? 'Editar pago' : 'Registrar pago'}</h3>
              <p className="text-green-300 text-xs">{editando ? 'Modifica los datos del pago' : 'Registra un nuevo pago'}</p>
            </div>
          </div>
          <button onClick={cerrarModal} className="text-white hover:text-green-200 text-2xl leading-none">✕</button>
        </div>
        <div className="p-6 max-h-[70vh] overflow-y-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col relative sm:col-span-2" ref={dropdownRef}>
              <label className="text-sm font-semibold text-gray-700 mb-1">Paciente *</label>
              <input className={`border rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-green-400 ${errores.paciente_id ? 'border-red-400 bg-red-50' : 'border-gray-200 hover:border-gray-300'}`} placeholder="Buscar por nombre, apellido o RUT..." value={busquedaPaciente} onChange={e => { setBusquedaPaciente(e.target.value); setMostrarDropdown(true); setForm(f => ({ ...f, paciente_id: '' })); setErrores(er => ({ ...er, paciente_id: '' })) }} onFocus={() => setMostrarDropdown(true)} />
              {errores.paciente_id && <span className="text-red-500 text-xs mt-1">{errores.paciente_id}</span>}
              {mostrarDropdown && busquedaPaciente.length > 0 && (
                <div className="absolute top-full left-0 right-0 bg-white border border-gray-200 rounded-xl shadow-lg z-50 max-h-48 overflow-y-auto mt-1">
                  {pacientesFiltrados.length === 0
                    ? <p className="px-3 py-2 text-sm text-gray-400">No se encontraron pacientes</p>
                    : pacientesFiltrados.map(p => (
                      <button key={p.id} className="w-full text-left px-3 py-2 hover:bg-green-50 text-sm border-b border-gray-100 last:border-0" onClick={() => seleccionarPaciente(p)}>
                        <span className="font-semibold text-gray-800">{p.nombre} {p.apellido}</span>
                        {p.rut && <span className="text-gray-400 ml-2 text-xs">{p.rut}</span>}
                      </button>
                    ))
                  }
                </div>
              )}
            </div>

            {[
              { label: 'Monto ($) *', name: 'monto', type: 'number', placeholder: '25000', error: errores.monto },
            ].map(f => (
              <div key={f.name} className="flex flex-col gap-1">
                <label className="text-sm font-semibold text-gray-700">{f.label}</label>
                <input type={f.type} className={`border rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-green-400 ${f.error ? 'border-red-400 bg-red-50' : 'border-gray-200 hover:border-gray-300'}`} name={f.name} placeholder={f.placeholder} value={form[f.name]} onChange={handleChange} />
                {f.error && <span className="text-red-500 text-xs">{f.error}</span>}
              </div>
            ))}

            <div className="flex flex-col gap-1">
              <label className="text-sm font-semibold text-gray-700">Método de pago</label>
              <select className="border border-gray-200 hover:border-gray-300 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-green-400" name="metodo" value={form.metodo} onChange={handleChange}>
                <option value="debito">💳 Débito</option>
                <option value="efectivo">💵 Efectivo</option>
                <option value="transferencia">🏦 Transferencia</option>
                <option value="fonasa">🏥 Fonasa</option>
                <option value="credito">💳 Crédito</option>
              </select>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-sm font-semibold text-gray-700">Estado</label>
              <select className="border border-gray-200 hover:border-gray-300 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-green-400" name="estado" value={form.estado} onChange={handleChange}>
                <option value="pagado">Pagado</option>
                <option value="pendiente">Pendiente</option>
                <option value="condonado">Condonado</option>
              </select>
            </div>

            {form.metodo === 'fonasa' && (
              <>
                <div className="flex flex-col gap-1">
                  <label className="text-sm font-semibold text-gray-700">Número de bono</label>
                  <input className="border border-gray-200 hover:border-gray-300 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-green-400" name="numero_bono" placeholder="Ej: 123456789" value={form.numero_bono || ''} onChange={handleChange} />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-sm font-semibold text-gray-700">Estado del bono</label>
                  <select className="border border-gray-200 hover:border-gray-300 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-green-400" name="estado_bono" value={form.estado_bono || 'pendiente'} onChange={handleChange}>
                    <option value="pendiente">⏳ Pendiente</option>
                    <option value="verificado">✅ Verificado</option>
                    <option value="rechazado">❌ Rechazado</option>
                  </select>
                </div>
              </>
            )}

            {(form.metodo === 'efectivo' || form.metodo === 'transferencia') && (
              <div className="flex flex-col gap-1">
                <label className="text-sm font-semibold text-gray-700">Estado boleta</label>
                <select className="border border-gray-200 hover:border-gray-300 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-green-400" name="estado_boleta" value={form.estado_boleta || 'pendiente'} onChange={handleChange}>
                  <option value="pendiente">⏳ Pendiente emisión</option>
                  <option value="emitida">✅ Emitida</option>
                </select>
              </div>
            )}

            <div className="flex flex-col gap-1">
              <label className="text-sm font-semibold text-gray-700">Procedimiento <span className="text-gray-400 font-normal text-xs">(opcional)</span></label>
              <select className="border border-gray-200 hover:border-gray-300 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-green-400" name="procedimiento_nombre" value={form.procedimiento_nombre} onChange={handleChange}>
                <option value="">Sin procedimiento</option>
                {catalogo.map(c => <option key={c.id} value={c.nombre}>{c.nombre}</option>)}
              </select>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-sm font-semibold text-gray-700">Matrona *</label>
              <select className={`border rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-green-400 ${errores.profesional_id ? 'border-red-400 bg-red-50' : 'border-gray-200 hover:border-gray-300'}`} name="profesional_id" value={form.profesional_id} onChange={handleChange}>
                <option value="">Seleccionar matrona</option>
                {profesionales.map(p => <option key={p.id} value={p.id}>{p.nombre} {p.apellido}</option>)}
              </select>
              {errores.profesional_id && <span className="text-red-500 text-xs">{errores.profesional_id}</span>}
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-sm font-semibold text-gray-700">Fecha del pago</label>
              <input type="date" className="border border-gray-200 hover:border-gray-300 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-green-400" name="fecha" value={form.fecha || ''} onChange={handleChange} />
            </div>

            <div className="flex flex-col gap-1 sm:col-span-2">
              <label className="text-sm font-semibold text-gray-700">Notas <span className="text-gray-400 font-normal text-xs">(opcional)</span></label>
              <input className="border border-gray-200 hover:border-gray-300 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-green-400" name="notas" placeholder="Ej: Control mensual..." value={form.notas} onChange={handleChange} />
            </div>

            {/* Nota de abono — solo visible al editar */}
            {editando && (
              <div className="flex flex-col gap-1 sm:col-span-2">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-bold text-purple-700">📝 Nota de abono</span>
                  <span className="text-xs text-gray-400 font-normal">— solo para recordatorio interno</span>
                </div>
                <textarea
                  className="border border-purple-200 hover:border-purple-300 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-purple-400 resize-none text-sm bg-purple-50"
                  name="notas_abono"
                  placeholder="Ej: Abonó $10.000 el 15/06, resta $15.000 para el 30/06..."
                  rows={3}
                  value={form.notas_abono}
                  onChange={handleChange}
                />
                {form.notas_abono && (
                  <p className="text-xs text-purple-500 font-medium">💾 Esta nota se guardará junto al pago</p>
                )}
              </div>
            )}
          </div>
        </div>
        <div className="px-6 pb-6 flex gap-3">
          <button onClick={cerrarModal} className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-xl hover:bg-gray-200 font-medium transition-colors">Cancelar</button>
          <button onClick={guardar} className="flex-1 text-white py-3 rounded-xl font-bold transition-all hover:opacity-90" style={{ background: 'linear-gradient(135deg, #166534, #15803d)' }}>
            {editando ? '✓ Actualizar' : '+ Registrar pago'}
          </button>
        </div>
      </div>
    </div>
  )
}
