import React, { useState } from 'react';
import { Playbook } from '@/lib/types';
import { createApiClient } from '@/lib/apiClient';
import { config } from '@/lib/config';
import { Modal } from '@/components/ui/Modal';

interface DeletePlaybookConfirmationProps {
    playbook: Playbook;
    onClose: () => void;
    onSuccess: () => void;
}

export function DeletePlaybookConfirmation({ playbook, onClose, onSuccess }: DeletePlaybookConfirmationProps) {
    const [isDeleting, setIsDeleting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const apiClient = createApiClient(config.apiUrl);

    const handleDelete = async () => {
        setIsDeleting(true);
        setError(null);
        try {
            await apiClient.deletePlaybook(playbook.id);
            setTimeout(() => onSuccess(), 1200);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Error de conexión');
        } finally {
            setIsDeleting(false);
        }
    };

    return (
        <Modal isOpen={true} onClose={onClose} title="Confirmar Eliminación">
            <div className="p-6">
                <div className="mb-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-1">Eliminar Playbook</h3>
                    <p className="text-sm text-gray-500 mb-4">Esta acción no se puede deshacer</p>
                    <div className="bg-gray-50 rounded-lg p-4">
                        <div className="text-sm text-gray-700">
                            <div><span className="font-medium">Título:</span> {playbook.title}</div>
                            <div><span className="font-medium">Tipo:</span> {playbook.type}</div>
                        </div>
                    </div>
                    {error && (
                        <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-md text-sm text-red-800">{error}</div>
                    )}
                </div>
                <div className="flex justify-end space-x-3">
                    <button type="button" onClick={onClose} disabled={isDeleting} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50">Cancelar</button>
                    <button type="button" onClick={handleDelete} disabled={isDeleting} className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 disabled:opacity-50">{isDeleting ? 'Eliminando...' : 'Eliminar'}</button>
                </div>
            </div>
        </Modal>
    );
}
