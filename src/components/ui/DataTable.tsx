import React, { useState } from 'react';
import {
    useReactTable,
    getCoreRowModel,
    getSortedRowModel,
    getPaginationRowModel,
    getFilteredRowModel,
    ColumnDef,
    flexRender,
    SortingState,
    ColumnFiltersState,
} from '@tanstack/react-table';

interface DataTableProps<TData, TValue> {
    columns: ColumnDef<TData, TValue>[];
    data: TData[];
    title?: string;
    isLoading?: boolean;
    error?: string | null;
    emptyMessage?: string;
}

export function DataTable<TData, TValue>({
    columns,
    data,
    title,
    isLoading = false,
    error = null,
    emptyMessage = "No hay elementos para mostrar."
}: DataTableProps<TData, TValue>) {
    const [sorting, setSorting] = useState<SortingState>([]);
    const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);

    const table = useReactTable({
        data,
        columns,
        getCoreRowModel: getCoreRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        onSortingChange: setSorting,
        onColumnFiltersChange: setColumnFilters,
        state: {
            sorting,
            columnFilters,
        },
    });

    if (isLoading) {
        return (
            <div className="mt-8 bg-white rounded-lg shadow-md p-6">
                <div className="flex justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="mt-8 bg-white rounded-lg shadow-md p-6">
                <div className="text-red-600 text-center py-4">
                    Error al cargar los datos: {error}
                </div>
            </div>
        );
    }

    return (
        <div className="mt-8 bg-white rounded-lg shadow-md p-6 w-full">
            {title && (
                <h2 className="text-xl font-bold text-gray-900 mb-4">
                    {title} ({data.length})
                </h2>
            )}

            {data.length === 0 ? (
                <div className="text-gray-500 text-center py-8">
                    {emptyMessage}
                </div>
            ) : (
                <div className="space-y-4 w-full">
                    {/* Tabla */}
                    <div className="w-full">
                        <table className="w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                {table.getHeaderGroups().map((headerGroup) => (
                                    <tr key={headerGroup.id}>
                                        {headerGroup.headers.map((header) => (
                                            <th
                                                key={header.id}
                                                className="px-8 py-4 text-left text-sm font-medium text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                                                onClick={header.column.getToggleSortingHandler()}
                                            >
                                                <div className="flex items-center space-x-2">
                                                    {flexRender(
                                                        header.column.columnDef.header,
                                                        header.getContext()
                                                    )}
                                                    {header.column.getCanSort() && (
                                                        <span className="text-gray-400 text-lg">
                                                            {{
                                                                asc: '↑',
                                                                desc: '↓',
                                                            }[header.column.getIsSorted() as string] ?? '↕'}
                                                        </span>
                                                    )}
                                                </div>
                                            </th>
                                        ))}
                                    </tr>
                                ))}
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {table.getRowModel().rows.map((row) => (
                                    <tr key={row.id} className="hover:bg-gray-50 transition-colors">
                                        {row.getVisibleCells().map((cell) => (
                                            <td key={cell.id} className="px-8 py-6 text-sm text-gray-900">
                                                {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                            </td>
                                        ))}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Paginación */}
                    <div className="flex items-center justify-between border-t border-gray-200 pt-4">
                        <div className="flex items-center space-x-2">
                            <button
                                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                onClick={() => table.previousPage()}
                                disabled={!table.getCanPreviousPage()}
                            >
                                Anterior
                            </button>
                            <span className="text-sm text-gray-700">
                                Página {table.getState().pagination.pageIndex + 1} de {table.getPageCount()}
                            </span>
                            <button
                                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                onClick={() => table.nextPage()}
                                disabled={!table.getCanNextPage()}
                            >
                                Siguiente
                            </button>
                        </div>
                        <div className="flex items-center space-x-2">
                            <span className="text-sm text-gray-700">Mostrar</span>
                            <select
                                value={table.getState().pagination.pageSize}
                                onChange={(e) => table.setPageSize(Number(e.target.value))}
                                className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            >
                                {[10, 20, 30, 40, 50].map((pageSize) => (
                                    <option key={pageSize} value={pageSize}>
                                        {pageSize}
                                    </option>
                                ))}
                            </select>
                            <span className="text-sm text-gray-700">elementos</span>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
