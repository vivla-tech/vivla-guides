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
    // Props para paginación del servidor
    totalCount?: number;
    currentPage?: number;
    pageSize?: number;
    onPageChange?: (page: number) => void;
    onPageSizeChange?: (pageSize: number) => void;
    serverSidePagination?: boolean;
    // Prop para controlar si usar contenedor propio
    useContainer?: boolean;
}

export function DataTable<TData, TValue>({
    columns,
    data,
    title,
    isLoading = false,
    error = null,
    emptyMessage = "No hay elementos para mostrar.",
    // Props para paginación del servidor
    totalCount,
    currentPage = 1,
    pageSize = 20,
    onPageChange,
    onPageSizeChange,
    serverSidePagination = false,
    // Prop para controlar si usar contenedor propio
    useContainer = true
}: DataTableProps<TData, TValue>) {
    const [sorting, setSorting] = useState<SortingState>([]);
    const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);

    const table = useReactTable({
        data,
        columns,
        getCoreRowModel: getCoreRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getPaginationRowModel: serverSidePagination ? undefined : getPaginationRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        onSortingChange: setSorting,
        onColumnFiltersChange: setColumnFilters,
        initialState: {
            pagination: {
                pageSize: serverSidePagination ? pageSize : 50,
                pageIndex: serverSidePagination ? currentPage - 1 : 0,
            },
        },
        state: {
            sorting,
            columnFilters,
        },
        // Deshabilitar paginación del cliente cuando usamos paginación del servidor
        manualPagination: serverSidePagination,
        pageCount: serverSidePagination ? Math.ceil((totalCount || 0) / pageSize) : undefined,
    });

    if (isLoading) {
        const content = (
            <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
        );

        return useContainer ? (
            <div className="mt-8 bg-white rounded-lg shadow-md p-6">
                {content}
            </div>
        ) : content;
    }

    if (error) {
        const content = (
            <div className="text-red-600 text-center py-4">
                Error al cargar los datos: {error}
            </div>
        );

        return useContainer ? (
            <div className="mt-8 bg-white rounded-lg shadow-md p-6">
                {content}
            </div>
        ) : content;
    }

    const tableContent = (
        <>
            {title && (
                <h2 className="text-xl font-bold text-gray-900 mb-4">
                    {title} ({serverSidePagination ? totalCount : data.length})
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
                                onClick={() => {
                                    if (serverSidePagination && onPageChange) {
                                        onPageChange(currentPage - 1);
                                    } else {
                                        table.previousPage();
                                    }
                                }}
                                disabled={serverSidePagination ? currentPage <= 1 : !table.getCanPreviousPage()}
                            >
                                Anterior
                            </button>
                            <span className="text-sm text-gray-700">
                                {serverSidePagination ? (
                                    `Página ${currentPage} de ${Math.ceil((totalCount || 0) / pageSize)}`
                                ) : (
                                    `Página ${table.getState().pagination.pageIndex + 1} de ${table.getPageCount()}`
                                )}
                            </span>
                            <button
                                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                onClick={() => {
                                    if (serverSidePagination && onPageChange) {
                                        onPageChange(currentPage + 1);
                                    } else {
                                        table.nextPage();
                                    }
                                }}
                                disabled={serverSidePagination ? currentPage >= Math.ceil((totalCount || 0) / pageSize) : !table.getCanNextPage()}
                            >
                                Siguiente
                            </button>
                        </div>
                        <div className="flex items-center space-x-2">
                            <span className="text-sm text-gray-700">Mostrar</span>
                            <select
                                value={serverSidePagination ? pageSize : table.getState().pagination.pageSize}
                                onChange={(e) => {
                                    const newPageSize = Number(e.target.value);
                                    if (serverSidePagination && onPageSizeChange) {
                                        onPageSizeChange(newPageSize);
                                    } else {
                                        table.setPageSize(newPageSize);
                                    }
                                }}
                                className="text-gray-700 border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            >
                                {[10, 20, 50, 100, 200].map((size) => (
                                    <option key={size} value={size}>
                                        {size}
                                    </option>
                                ))}
                            </select>
                            <span className="text-sm text-gray-700">elementos</span>
                        </div>
                    </div>
                </div>
            )}
        </>
    );

    return useContainer ? (
        <div className="mt-8 bg-white rounded-lg shadow-md p-6 w-full">
            {tableContent}
        </div>
    ) : (
        <div className="w-full">
            {tableContent}
        </div>
    );
}
