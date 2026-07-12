import { useTrips, useUpdateTripStatus } from '../hooks/useTrips'
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from '@tanstack/react-table'

const columnHelper = createColumnHelper<any>()

export function TripList() {
  const { data: trips, isLoading } = useTrips()
  const updateStatus = useUpdateTripStatus()

  const columns = [
    columnHelper.accessor('id', {
      header: 'ID',
      cell: info => <span className="text-xs text-muted-foreground">{info.getValue().substring(0, 8)}...</span>,
    }),
    columnHelper.accessor('source', {
      header: 'Route',
      cell: info => <span className="font-medium">{info.row.original.source} &rarr; {info.row.original.destination}</span>,
    }),
    columnHelper.accessor('vehicles.registration_number', {
      header: 'Vehicle',
    }),
    columnHelper.accessor('drivers.name', {
      header: 'Driver',
    }),
    columnHelper.accessor('status', {
      header: 'Status',
      cell: info => (
        <span className={`px-2 py-1 rounded-full text-xs font-medium uppercase tracking-wider
          ${info.getValue() === 'draft' ? 'bg-secondary text-secondary-foreground' : ''}
          ${info.getValue() === 'dispatched' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' : ''}
          ${info.getValue() === 'completed' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' : ''}
          ${info.getValue() === 'cancelled' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' : ''}
        `}>
          {info.getValue()}
        </span>
      ),
    }),
    columnHelper.display({
      id: 'actions',
      header: 'Actions',
      cell: props => (
        <div className="flex gap-2">
          {props.row.original.status === 'draft' && (
            <button
              onClick={() => updateStatus.mutate({ id: props.row.original.id, status: 'dispatched' })}
              className="text-xs px-2 py-1 bg-primary text-primary-foreground rounded hover:bg-primary/90"
            >
              Dispatch
            </button>
          )}
          {props.row.original.status === 'dispatched' && (
            <>
              <button
                onClick={() => {
                  const odometer = prompt('Enter final odometer:')
                  const fuel = prompt('Enter fuel consumed:')
                  if (odometer && fuel) {
                    updateStatus.mutate({ 
                      id: props.row.original.id, 
                      status: 'completed',
                      updates: { final_odometer: Number(odometer), fuel_consumed: Number(fuel) }
                    })
                  }
                }}
                className="text-xs px-2 py-1 bg-green-600 text-white rounded hover:bg-green-700"
              >
                Complete
              </button>
              <button
                onClick={() => updateStatus.mutate({ id: props.row.original.id, status: 'cancelled' })}
                className="text-xs px-2 py-1 bg-destructive text-destructive-foreground rounded hover:bg-destructive/90"
              >
                Cancel
              </button>
            </>
          )}
        </div>
      ),
    }),
  ]

  const table = useReactTable({
    data: trips || [],
    columns,
    getCoreRowModel: getCoreRowModel(),
  })

  if (isLoading) return <div className="p-8 text-center text-muted-foreground animate-pulse">Loading trips...</div>

  return (
    <div className="rounded-md border border-border">
      <table className="w-full text-sm text-left">
        <thead className="bg-muted/50 text-muted-foreground border-b border-border">
          {table.getHeaderGroups().map(headerGroup => (
            <tr key={headerGroup.id}>
              {headerGroup.headers.map(header => (
                <th key={header.id} className="h-10 px-4 font-medium align-middle">
                  {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody className="divide-y divide-border bg-card">
          {table.getRowModel().rows.length > 0 ? (
            table.getRowModel().rows.map(row => (
              <tr key={row.id} className="hover:bg-muted/50 transition-colors">
                {row.getVisibleCells().map(cell => (
                  <td key={cell.id} className="p-4 align-middle">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={columns.length} className="p-8 text-center text-muted-foreground">
                No trips found.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  )
}
