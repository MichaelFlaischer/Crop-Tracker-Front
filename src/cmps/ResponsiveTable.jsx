import { useState } from 'react'

export function ResponsiveTable({ columns, data, renderActions, filterBy, onFilterChange, onClearFilters, filterFields, sortOptions }) {
  const [sortBy, setSortBy] = useState({ key: null, asc: true })

  function handleSort(key) {
    setSortBy((prev) => {
      if (prev.key === key) {
        return { key, asc: !prev.asc }
      } else {
        return { key, asc: true }
      }
    })
  }

  const sortedData = [...data]
  if (sortBy.key) {
    sortedData.sort((a, b) => {
      const aVal = a[sortBy.key]
      const bVal = b[sortBy.key]

      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return sortBy.asc ? aVal - bVal : bVal - aVal
      } else {
        return sortBy.asc ? String(aVal).localeCompare(String(bVal)) : String(bVal).localeCompare(String(aVal))
      }
    })
  }

  return (
    <section className='responsive-table'>
      {filterFields && (
        <div className='filter-bar'>
          {filterFields.map((field) => (
            <input
              key={field.name}
              type={field.type}
              name={field.name}
              placeholder={`סינון לפי ${field.label}`}
              value={filterBy[field.name]}
              onChange={onFilterChange}
            />
          ))}
          {sortOptions && (
            <select name='sort' value={filterBy.sort} onChange={onFilterChange}>
              <option value=''>מיון לפי</option>
              {sortOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          )}
          <button className='btn btn-secondary' onClick={onClearFilters}>
            איפוס
          </button>
        </div>
      )}

      <table className='main-table'>
        <thead>
          <tr>
            {columns.map((col) => (
              <th key={col.key} onClick={() => handleSort(col.key)} className='sortable'>
                {col.label}
                {sortBy.key === col.key && (sortBy.asc ? ' 🔼' : ' 🔽')}
              </th>
            ))}
            {renderActions && <th>פעולות</th>}
          </tr>
        </thead>
        <tbody>
          {sortedData.map((row) => (
            <tr key={row._id || row.id}>
              {columns.map((col) => (
                <td key={col.key}>{row[col.key]}</td>
              ))}
              {renderActions && <td>{renderActions(row)}</td>}
            </tr>
          ))}
        </tbody>
      </table>

      <section className='cards-container'>
        {sortedData.map((row) => (
          <div key={row._id || row.id} className='data-card'>
            {columns.map((col) => (
              <div key={col.key} className='card-row'>
                <span className='label'>{col.label}:</span>
                <span className='value'>{row[col.key]}</span>
              </div>
            ))}
            {renderActions && <div className='card-actions'>{renderActions(row)}</div>}
          </div>
        ))}
      </section>
    </section>
  )
}
