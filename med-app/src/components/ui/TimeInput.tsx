import React from "react";

interface TimeInputProps {
    id: string;
    label: string;
    value: string;
    onChange: (value: string) => void;
    helperText?: string;
    error?: string;
    required?: boolean;
    disabled?: boolean;
    className?: string;
    dir?: "rtl" | "ltr";
}

/**
 * TimeInput Component
 * 
 * ARCHITECTURAL NOTE:
 * Do not place icons, emojis, or absolute positioned elements inside the native <input type="time">.
 * On mobile devices (especially iOS Safari), the native controls overlap with any internal elements,
 * leading to a broken UI. Always use wrapper elements or external labels for icons.
 */
export default function TimeInput({
    id,
    label,
    value,
    onChange,
    helperText,
    error,
    required,
    disabled,
    className = "",
    dir,
}: TimeInputProps) {
    return (
        <div className={`space-y-1.5 ${className}`} dir={dir}>
            <label
                htmlFor={id}
                className="block text-xs sm:text-sm font-semibold uppercase tracking-wider text-slate-500"
            >
                {label}
                {required && <span className="text-red-500 ml-1">*</span>}
            </label>
            <input
                id={id}
                type="time"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                disabled={disabled}
                required={required}
                aria-invalid={!!error}
                aria-describedby={error ? `${id}-error` : helperText ? `${id}-helper` : undefined}
                className={`
          block w-full rounded-xl border px-4 py-3 text-base sm:text-lg shadow-sm transition-colors
          focus:outline-none focus:ring-2 focus:ring-sky-500
          disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400
          ${error
                        ? "border-red-300 bg-red-50 text-red-900 focus:border-red-500 focus:ring-red-200"
                        : "border-slate-200 bg-white text-slate-900 focus:border-sky-500 focus:ring-sky-500/20"
                    }
        `}
            />
            {error ? (
                <p id={`${id}-error`} className="text-sm text-red-600" role="alert">
                    {error}
                </p>
            ) : helperText ? (
                <p id={`${id}-helper`} className="text-sm text-slate-500">
                    {helperText}
                </p>
            ) : null}
        </div>
    );
}
