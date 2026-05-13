import React, { useState, useRef } from "react";
import * as Popover from "@radix-ui/react-popover";
import { Check, Clock } from "lucide-react";

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
 * Now uses a headless Radix UI Popover to avoid native mobile browser modal bugs (like overflowing viewports
 * and displaying unwanted "Reset" buttons). The Popover ensures predictable styling and logical layout.
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
    dir = "ltr",
}: TimeInputProps) {
    const [open, setOpen] = useState(false);

    // Temp state for popover so changes don't apply until "Confirm"
    const [tempHour, setTempHour] = useState(value ? value.split(":")[0] : "08");
    const [tempMinute, setTempMinute] = useState(value ? value.split(":")[1] : "00");

    const hoursContainerRef = useRef<HTMLDivElement>(null);
    const minutesContainerRef = useRef<HTMLDivElement>(null);

    const handleOpenChange = (isOpen: boolean) => {
        setOpen(isOpen);
        if (isOpen) {
            setTempHour(value ? value.split(":")[0] : "08");
            setTempMinute(value ? value.split(":")[1] : "00");

            // Scroll the selected elements into view
            setTimeout(() => {
                if (hoursContainerRef.current) {
                    const selected = hoursContainerRef.current.querySelector('[data-selected="true"]');
                    if (selected) {
                        selected.scrollIntoView({ block: "center", behavior: "auto" });
                    }
                }
                if (minutesContainerRef.current) {
                    const selected = minutesContainerRef.current.querySelector('[data-selected="true"]');
                    if (selected) {
                        selected.scrollIntoView({ block: "center", behavior: "auto" });
                    }
                }
            }, 10);
        }
    };
    const handleConfirm = () => {
        onChange(`${tempHour}:${tempMinute}`);
        setOpen(false);
    };

    const hours = Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, "0"));
    const minutes = Array.from({ length: 60 }, (_, i) => i.toString().padStart(2, "0"));

    return (
        <div className={`min-w-0 space-y-1 sm:space-y-1.5 ${className}`} dir={dir}>
            <label
                htmlFor={id}
                className="block text-xs font-semibold uppercase tracking-wider text-slate-500 sm:text-sm"
            >
                {label}
                {required && <span className="text-red-500 ms-1">*</span>}
            </label>

            <Popover.Root open={open} onOpenChange={handleOpenChange}>
                <Popover.Trigger asChild>
                    <button
                        id={id}
                        type="button"
                        disabled={disabled}
                        aria-invalid={!!error}
                        aria-describedby={error ? `${id}-error` : helperText ? `${id}-helper` : undefined}
                        className={`
                            flex items-center justify-between min-h-11 w-full min-w-0 max-w-full rounded-lg border px-2.5 py-2 text-base shadow-sm transition-colors box-border sm:min-h-0 sm:rounded-xl sm:px-4 sm:py-3 sm:text-lg
                            focus:outline-none focus:ring-2 focus:ring-sky-500
                            disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400
                            ${error
                                ? "border-red-300 bg-red-50 text-red-900 focus:border-red-500 focus:ring-red-200"
                                : "border-slate-200 bg-white text-slate-900 hover:border-slate-300 focus:border-sky-500 focus:ring-sky-500/20"
                            }
                        `}
                    >
                        <span>{value || "--:--"}</span>
                        <Clock className="h-4 w-4 text-slate-400 shrink-0" />
                    </button>
                </Popover.Trigger>

                <Popover.Portal>
                    <Popover.Content
                        dir={dir}
                        sideOffset={8}
                        collisionPadding={16}
                        className="z-[100] w-[calc(100vw-2rem)] max-w-[320px] rounded-2xl border border-slate-100 bg-white p-4 shadow-xl sm:w-[320px] 
                                   data-[state=open]:animate-in data-[state=closed]:animate-out 
                                   data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 
                                   data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 
                                   data-[side=bottom]:slide-in-from-top-2 data-[side=top]:slide-in-from-bottom-2"
                    >
                        <style dangerouslySetInnerHTML={{ __html: `
                            .no-scrollbar::-webkit-scrollbar { display: none; }
                            .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
                        ` }} />
                        
                        <div className="flex h-48 justify-center gap-2 relative overflow-hidden mb-4 select-none">
                            {/* Selection Overlay */}
                            <div className="absolute top-1/2 left-0 right-0 h-10 -translate-y-1/2 rounded-lg bg-sky-50 border border-sky-100 pointer-events-none" />
                            
                            {/* Hours Column */}
                            <div 
                                ref={hoursContainerRef}
                                className="flex-1 overflow-y-auto snap-y snap-mandatory no-scrollbar flex flex-col items-center pb-[80px] pt-[80px] px-2 relative z-10"
                            >
                                {hours.map((h) => (
                                    <div
                                        key={h}
                                        data-selected={tempHour === h}
                                        onClick={() => {
                                            setTempHour(h);
                                            // Smooth scroll to selected
                                            hoursContainerRef.current?.querySelector('[data-selected="true"]')?.scrollIntoView({ block: 'center', behavior: 'smooth' });
                                        }}
                                        className={`h-10 shrink-0 snap-center flex items-center justify-center cursor-pointer text-xl transition-colors w-full rounded-md
                                            ${tempHour === h ? "text-sky-700 font-bold" : "text-slate-400 font-medium hover:text-slate-600 hover:bg-slate-50"}
                                        `}
                                    >
                                        {h}
                                    </div>
                                ))}
                            </div>

                            {/* Separator */}
                            <div className="flex items-center justify-center text-xl font-bold text-slate-300 pb-2 z-10">
                                :
                            </div>

                            {/* Minutes Column */}
                            <div 
                                ref={minutesContainerRef}
                                className="flex-1 overflow-y-auto snap-y snap-mandatory no-scrollbar flex flex-col items-center pb-[80px] pt-[80px] px-2 relative z-10"
                            >
                                {minutes.map((m) => (
                                    <div
                                        key={m}
                                        data-selected={tempMinute === m}
                                        onClick={() => {
                                            setTempMinute(m);
                                            minutesContainerRef.current?.querySelector('[data-selected="true"]')?.scrollIntoView({ block: 'center', behavior: 'smooth' });
                                        }}
                                        className={`h-10 shrink-0 snap-center flex items-center justify-center cursor-pointer text-xl transition-colors w-full rounded-md
                                            ${tempMinute === m ? "text-sky-700 font-bold" : "text-slate-400 font-medium hover:text-slate-600 hover:bg-slate-50"}
                                        `}
                                    >
                                        {m}
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Confirm Button */}
                        <button
                            type="button"
                            onClick={handleConfirm}
                            className={`
                                flex w-full min-h-11 items-center justify-center rounded-xl bg-sky-600 px-4 py-2.5 sm:py-4 sm:text-lg text-sm font-semibold text-white shadow-sm transition-all hover:bg-sky-500 hover:shadow-md hover:shadow-sky-500/20 active:scale-[0.98]
                            `}
                        >
                            {/* Flex layout automatically handles RTL logical properties when dir="rtl" */}
                            <span className="flex items-center gap-2">
                                <Check className="h-5 w-5 sm:h-6 sm:w-6" />
                                <span>{dir === "rtl" ? "אישור" : "Confirm"}</span>
                            </span>
                        </button>
                    </Popover.Content>
                </Popover.Portal>
            </Popover.Root>

            {error ? (
                <p id={`${id}-error`} className="text-xs leading-snug text-red-600 sm:text-sm sm:leading-normal" role="alert">
                    {error}
                </p>
            ) : helperText ? (
                <p id={`${id}-helper`} className="text-xs text-slate-500 sm:text-sm">
                    {helperText}
                </p>
            ) : null}
        </div>
    );
}
