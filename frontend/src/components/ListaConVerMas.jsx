import { useState } from 'react'

export default function ListaConVerMas({ items, limite = 5, renderItem, emptyText = 'Sin registros' }) {
  const [verTodos, setVerTodos] = useState(false)
  const visibles = verTodos ? items : items.slice(0, limite)

  if (items.length === 0) return <p className="text-sm text-gray-400">{emptyText}</p>

  return (
    <div>
      <div className="flex flex-col gap-2">
        {visibles.map((item, i) => renderItem(item, i))}
      </div>
      {items.length > limite && (
        <button
          onClick={() => setVerTodos(!verTodos)}
          className="mt-3 text-sm text-green-700 hover:underline font-medium w-full text-center"
        >
          {verTodos ? '▲ Ver menos' : `▼ Ver ${items.length - limite} más`}
        </button>
      )}
    </div>
  )
}