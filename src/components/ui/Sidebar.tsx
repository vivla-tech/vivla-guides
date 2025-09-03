'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useCallback, useEffect } from 'react';

type SidebarProps = {
    open: boolean;
    onToggle: () => void;
    onClose: () => void;
};

export function Sidebar({ open, onToggle, onClose }: SidebarProps) {
    const pathname = usePathname();

    const isActive = useCallback((path: string) => pathname === path, [pathname]);

    const navItems = [
        {
            href: '/', label: 'Inicio', icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
                </svg>
            )
        },
        {
            href: '/wizard/inventory', label: 'Gestionar Inventario', icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
            )
        },
        {
            href: '/wizard/styling-guides', label: 'Gestionar Guías de Estilo', icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zM21 5H9a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V7a2 2 0 00-2-2z" />
                </svg>
            )
        },
        {
            href: '/wizard/technical-docs', label: 'Gestionar Documentación', icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
            )
        },
        {
            href: '/wizard/catalog', label: 'Gestionar Catálogo', icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
            )
        },
    ];

    return (
        <>
            {/* Botón toggle */}
            <button
                type="button"
                aria-label="Abrir/cerrar menú"
                onClick={onToggle}
                className="fixed top-4 left-4 z-50 inline-flex items-center justify-center rounded-md border border-gray-300 bg-white p-2 text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
            </button>

            {/* Overlay móvil (eliminado para evitar fondo oscuro al cerrar) */}

            {/* Sidebar */}
            <aside
                className={`fixed left-0 top-0 z-40 h-full w-64 transform border-r border-gray-200 bg-white shadow-sm transition-transform duration-200 ${open ? 'translate-x-0' : '-translate-x-full'}`}
            >
                <div className="flex h-16 items-center px-4">
                    <span className="text-lg font-semibold text-gray-900">VIVLA Guides</span>
                </div>
                <nav className="px-2 py-4">
                    <ul className="space-y-1">
                        {navItems.map(item => (
                            <li key={item.href}>
                                <Link
                                    href={item.href}
                                    className={`flex items-center space-x-2 rounded-md px-3 py-2 text-sm font-medium transition-colors ${isActive(item.href)
                                        ? 'bg-blue-50 text-blue-700'
                                        : 'text-gray-700 hover:bg-gray-50'}`}
                                    onClick={onClose}
                                >
                                    {item.icon}
                                    <span>{item.label}</span>
                                </Link>
                            </li>
                        ))}
                    </ul>
                </nav>
            </aside>
        </>
    );
}


