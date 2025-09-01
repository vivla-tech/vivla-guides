import React from 'react';
import { UseFormRegisterReturn } from 'react-hook-form';

interface InputProps {
    label?: string;
    error?: string;
    register?: UseFormRegisterReturn;
    type?: 'text' | 'email' | 'url' | 'tel' | 'number' | 'password' | 'textarea' | 'select' | 'date';
    placeholder?: string;
    rows?: number;
    min?: number;
    step?: string;
    disabled?: boolean;
    className?: string;
    children?: React.ReactNode;
    required?: boolean;
}

export function Input({
    label,
    error,
    register,
    type = 'text',
    placeholder,
    rows,
    min,
    step,
    disabled = false,
    className = '',
    children,
    required = false
}: InputProps) {
    const baseClasses = `text-gray-700 w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${error ? 'border-red-300' : 'border-gray-300'} ${className}`;

    const renderInput = () => {
        if (type === 'textarea') {
            return (
                <textarea
                    {...register}
                    rows={rows || 3}
                    className={baseClasses}
                    placeholder={placeholder}
                    disabled={disabled}
                />
            );
        }

        if (type === 'select') {
            return (
                <select
                    {...register}
                    className={baseClasses}
                    disabled={disabled}
                >
                    <option value="">{placeholder || 'Selecciona una opción'}</option>
                    {children}
                </select>
            );
        }

        return (
            <input
                {...register}
                type={type}
                className={baseClasses}
                placeholder={placeholder}
                min={min}
                step={step}
                disabled={disabled}
            />
        );
    };

    return (
        <div>
            {label && (
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    {label} {required && '*'}
                </label>
            )}
            {renderInput()}
            {error && (
                <p className="mt-1 text-sm text-red-600">{error}</p>
            )}
        </div>
    );
}
