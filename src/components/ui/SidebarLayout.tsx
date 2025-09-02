'use client';

import { useEffect, useState } from 'react';
import { Sidebar } from '@/components/ui/Sidebar';

type SidebarLayoutProps = {
    children: React.ReactNode;
};

export default function SidebarLayout({ children }: SidebarLayoutProps) {
    const [open, setOpen] = useState(false);

    useEffect(() => {
        if (typeof window !== 'undefined' && window.innerWidth >= 768) {
            setOpen(true);
        }
    }, []);

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Sidebar como overlay, no desplaza el contenido */}
            <Sidebar open={open} onToggle={() => setOpen(o => !o)} onClose={() => setOpen(false)} />
            <div>
                {children}
            </div>
        </div>
    );
}


