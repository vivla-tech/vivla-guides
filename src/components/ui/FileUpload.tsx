import React, { useState, useRef, useCallback } from 'react';
import { uploadMultipleFiles, deleteMultipleFiles } from '@/lib/firebase';

interface FileUploadProps {
    label?: string;
    multiple?: boolean;
    accept?: string;
    maxFiles?: number;
    maxSize?: number; // en MB
    onUrlsChange: (urls: string[]) => void;
    error?: string;
    disabled?: boolean;
    className?: string;
    basePath?: string; // Carpeta en Firebase Storage
}

interface FileWithPreview {
    file: File;
    preview: string;
    id: string;
}

export function FileUpload({
    label,
    multiple = true,
    accept = "image/*",
    maxFiles = 10,
    maxSize = 5, // 5MB por defecto
    onUrlsChange,
    error,
    disabled = false,
    className = '',
    basePath = 'uploads'
}: FileUploadProps) {
    const [files, setFiles] = useState<FileWithPreview[]>([]);
    const [isDragging, setIsDragging] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle');
    const [uploadMessage, setUploadMessage] = useState('');
    const [uploadedUrls, setUploadedUrls] = useState<string[]>([]);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Validar archivo
    const validateFile = (file: File): string | null => {
        // Validar tipo
        if (accept && !file.type.match(accept.replace('*', '.*'))) {
            return `Tipo de archivo no permitido: ${file.type}`;
        }

        // Validar tamaño
        if (maxSize && file.size > maxSize * 1024 * 1024) {
            return `Archivo demasiado grande. Máximo ${maxSize}MB`;
        }

        return null;
    };

    // Procesar archivos seleccionados
    const processFiles = useCallback((selectedFiles: FileList | File[]) => {
        const newFiles: FileWithPreview[] = [];
        const fileArray = Array.from(selectedFiles);

        for (const file of fileArray) {
            const validationError = validateFile(file);
            if (validationError) {
                alert(validationError);
                continue;
            }

            if (files.length + newFiles.length >= maxFiles) {
                alert(`Máximo ${maxFiles} archivos permitidos`);
                break;
            }

            const id = `${Date.now()}_${Math.random()}`;
            const preview = file.type.startsWith('image/')
                ? URL.createObjectURL(file)
                : '';

            newFiles.push({ file, preview, id });
        }

        setFiles(prev => [...prev, ...newFiles]);
    }, [files.length, maxFiles, accept, maxSize]);

    // Manejar drag & drop
    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    }, []);

    const handleDragLeave = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
    }, []);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);

        if (disabled) return;

        const droppedFiles = e.dataTransfer.files;
        processFiles(droppedFiles);
    }, [disabled, processFiles]);

    // Manejar click para seleccionar
    const handleClick = () => {
        if (disabled) return;
        fileInputRef.current?.click();
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFiles = e.target.files;
        if (selectedFiles) {
            processFiles(selectedFiles);
        }
        // Limpiar input para permitir seleccionar el mismo archivo
        e.target.value = '';
    };

    // Eliminar archivo
    const removeFile = (id: string) => {
        setFiles(prev => {
            const updated = prev.filter(f => f.id !== id);
            return updated;
        });
    };

    // Limpiar archivos subidos (del storage y del estado)
    const clearUploadedFiles = async () => {
        if (uploadedUrls.length === 0) return;

        try {
            // Mostrar estado de limpieza
            setUploadStatus('uploading');
            setUploadMessage('Eliminando archivos del servidor...');

            // Eliminar archivos del Firebase Storage
            await deleteMultipleFiles(uploadedUrls);

            // Limpiar estado local
            setUploadedUrls([]);
            onUrlsChange([]);

            // Mostrar confirmación
            setUploadStatus('success');
            setUploadMessage(`${uploadedUrls.length} archivo${uploadedUrls.length > 1 ? 's' : ''} eliminado${uploadedUrls.length > 1 ? 's' : ''} del servidor`);

        } catch (error) {
            console.error('Error al eliminar archivos:', error);
            setUploadStatus('error');
            setUploadMessage('Error al eliminar archivos del servidor');
        }
    };

    // Subir archivos
    const uploadFiles = async () => {
        if (files.length === 0) return;

        setIsUploading(true);
        setUploadProgress(0);
        setUploadStatus('uploading');
        setUploadMessage(`Subiendo ${files.length} archivo${files.length > 1 ? 's' : ''}...`);

        try {
            const fileArray = files.map(f => f.file);

            // Simular progreso durante la subida
            const progressInterval = setInterval(() => {
                setUploadProgress(prev => {
                    if (prev >= 90) return prev;
                    return prev + Math.random() * 10;
                });
            }, 200);

            const urls = await uploadMultipleFiles(fileArray, basePath);

            clearInterval(progressInterval);
            setUploadProgress(100);

            onUrlsChange(urls);
            setUploadedUrls(urls);

            // Mostrar mensaje de éxito (mantener progress al 100%)
            setUploadStatus('success');
            setUploadMessage(`¡${files.length} archivo${files.length > 1 ? 's' : ''} subido${files.length > 1 ? 's' : ''} exitosamente!`);

            // Limpiar solo los archivos temporales y previsualizaciones
            setFiles([]);

            // Limpiar previsualizaciones
            files.forEach(f => {
                if (f.preview) {
                    URL.revokeObjectURL(f.preview);
                }
            });

        } catch (error) {
            console.error('Error al subir archivos:', error);
            setUploadStatus('error');
            setUploadMessage('Error al subir archivos. Inténtalo de nuevo.');
        } finally {
            setIsUploading(false);
        }
    };

    // Limpiar previsualizaciones al desmontar
    React.useEffect(() => {
        return () => {
            files.forEach(f => {
                if (f.preview) {
                    URL.revokeObjectURL(f.preview);
                }
            });
        };
    }, [files]);

    return (
        <div className={`space-y-4 ${className}`}>
            {label && (
                <label className="block text-sm font-medium text-gray-700">
                    {label}
                </label>
            )}

            {/* Zona de drag & drop */}
            <div
                className={`
          relative border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors
          ${isDragging
                        ? 'border-blue-400 bg-blue-50'
                        : 'border-gray-300 hover:border-gray-400'
                    }
          ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
        `}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={handleClick}
            >
                <input
                    ref={fileInputRef}
                    type="file"
                    multiple={multiple}
                    accept={accept}
                    onChange={handleFileSelect}
                    className="hidden"
                    disabled={disabled}
                />

                <div className="space-y-2">
                    <div className="text-4xl">📁</div>
                    <p className="text-sm text-gray-600">
                        Arrastra archivos aquí o haz click para seleccionar
                    </p>
                    <p className="text-xs text-gray-500">
                        {accept === "image/*" ? "Imágenes" : "Archivos"} • Máximo {maxSize}MB • {maxFiles} archivos
                    </p>
                </div>
            </div>

            {/* Lista de archivos */}
            {files.length > 0 && (
                <div className="space-y-2">
                    <div className="flex justify-between items-center">
                        <h4 className="text-sm font-medium text-gray-700">
                            Archivos seleccionados ({files.length})
                        </h4>
                        <button
                            type="button"
                            onClick={uploadFiles}
                            disabled={isUploading}
                            className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                        >
                            {isUploading ? (
                                <>
                                    <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
                                    <span>Subiendo...</span>
                                </>
                            ) : (
                                <span>Subir archivos</span>
                            )}
                        </button>
                    </div>

                    {/* Grid de archivos */}
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                        {files.map((fileWithPreview) => (
                            <div key={fileWithPreview.id} className="relative group">
                                <div className="aspect-square rounded-lg overflow-hidden bg-gray-100">
                                    {fileWithPreview.preview ? (
                                        <img
                                            src={fileWithPreview.preview}
                                            alt={fileWithPreview.file.name}
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center">
                                            <span className="text-2xl">📄</span>
                                        </div>
                                    )}
                                </div>

                                {/* Botón eliminar */}
                                <button
                                    type="button"
                                    onClick={() => removeFile(fileWithPreview.id)}
                                    disabled={isUploading}
                                    className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                    ×
                                </button>

                                {/* Nombre del archivo */}
                                <p className="text-xs text-gray-600 mt-1 truncate">
                                    {fileWithPreview.file.name}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Progress bar - FUERA de la condición de files */}
            {(isUploading || uploadStatus === 'success') && (
                <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                        className={`h-2 rounded-full transition-all duration-300 ${uploadStatus === 'success' ? 'bg-green-600' : 'bg-blue-600'
                            }`}
                        style={{ width: `${uploadProgress}%` }}
                    />
                </div>
            )}

            {/* Status message - FUERA de la condición de files */}
            {uploadMessage && (
                <div className={`p-3 rounded-md text-sm font-medium ${uploadStatus === 'success'
                    ? 'bg-green-50 text-green-800 border border-green-200'
                    : uploadStatus === 'error'
                        ? 'bg-red-50 text-red-800 border border-red-200'
                        : 'bg-blue-50 text-blue-800 border border-blue-200'
                    }`}>
                    {uploadStatus === 'uploading' && (
                        <div className="flex items-center space-x-2">
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                            <span>{uploadMessage}</span>
                        </div>
                    )}
                    {uploadStatus === 'success' && (
                        <div className="flex items-center space-x-2">
                            <span className="text-green-600">✓</span>
                            <span>{uploadMessage}</span>
                        </div>
                    )}
                    {uploadStatus === 'error' && (
                        <div className="flex items-center space-x-2">
                            <span className="text-red-600">✗</span>
                            <span>{uploadMessage}</span>
                        </div>
                    )}
                </div>
            )}

            {/* Uploaded files summary - FUERA de la condición de files */}
            {uploadedUrls.length > 0 && (
                <div className="bg-gray-50 border border-gray-200 rounded-md p-4">
                    <div className="flex items-center justify-between mb-2">
                        <h4 className="text-sm font-medium text-gray-700">
                            Archivos subidos ({uploadedUrls.length})
                        </h4>
                        <button
                            type="button"
                            onClick={clearUploadedFiles}
                            disabled={isUploading}
                            className="text-xs text-red-600 hover:text-red-800 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isUploading ? 'Eliminando...' : 'Quitar'}
                        </button>
                    </div>
                    <div className="space-y-1">
                        {uploadedUrls.map((url, index) => (
                            <div key={index} className="flex items-center space-x-2 text-xs text-gray-600">
                                <span className="text-green-500">✓</span>
                                <span className="truncate">
                                    {url.split('/').pop() || `Archivo ${index + 1}`}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Error */}
            {error && (
                <p className="text-sm text-red-600">{error}</p>
            )}
        </div>
    );
}
