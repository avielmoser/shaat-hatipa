"use client";

import { useState, useEffect } from 'react';
import { Settings2, X, Eye, Type, Activity } from 'lucide-react';

type AccessibilityFeatures = {
    highContrast: boolean;
    largeText: boolean;
    reduceMotion: boolean;
};

export default function AccessibilityWidget() {
    const [isOpen, setIsOpen] = useState(false);
    const [mounted, setMounted] = useState(false);
    const [features, setFeatures] = useState<AccessibilityFeatures>({
        highContrast: false,
        largeText: false,
        reduceMotion: false,
    });

    // Load preferences from localStorage on mount
    useEffect(() => {
        setMounted(true);
        try {
            const saved = localStorage.getItem('accessibility-prefs');
            if (saved) {
                const parsed = JSON.parse(saved);
                setFeatures(parsed);
                applyFeatures(parsed);
            }
        } catch (e) {
            console.error('Failed to load accessibility preferences:', e);
        }
    }, []);

    // Apply features to HTML element
    const applyFeatures = (prefs: AccessibilityFeatures) => {
        const html = document.documentElement;

        if (prefs.highContrast) html.classList.add('a11y-high-contrast');
        else html.classList.remove('a11y-high-contrast');

        if (prefs.largeText) html.classList.add('a11y-large-text');
        else html.classList.remove('a11y-large-text');

        if (prefs.reduceMotion) html.classList.add('a11y-reduce-motion');
        else html.classList.remove('a11y-reduce-motion');
    };

    // Toggle individual feature
    const toggleFeature = (key: keyof AccessibilityFeatures) => {
        const newFeatures = { ...features, [key]: !features[key] };
        setFeatures(newFeatures);
        applyFeatures(newFeatures);
        localStorage.setItem('accessibility-prefs', JSON.stringify(newFeatures));
    };

    // Keyboard support for closing dialog
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && isOpen) {
                setIsOpen(false);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen]);

    if (!mounted) return null;

    return (
        <>
            {/* Floating Trigger Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="fixed bottom-6 left-6 z-50 p-4 rounded-full bg-blue-600 text-white shadow-lg hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-300 transition-all duration-300 hover:scale-110 print:hidden"
                aria-label="Accessibility Settings"
                aria-expanded={isOpen}
                aria-controls="accessibility-panel"
            >
                <Settings2 className="w-6 h-6" />
                <span className="sr-only">Open Accessibility Menu</span>
            </button>

            {/* Panel Overlay */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50 print:hidden"
                    onClick={() => setIsOpen(false)}
                    aria-hidden="true"
                />
            )}

            {/* Accessibility Panel */}
            <div
                id="accessibility-panel"
                role="dialog"
                aria-modal="true"
                aria-labelledby="a11y-title"
                className={`fixed bottom-24 left-6 z-50 w-80 bg-white rounded-2xl shadow-2xl p-6 transition-all duration-300 transform print:hidden border border-slate-100 ${isOpen
                        ? 'opacity-100 translate-y-0 scale-100'
                        : 'opacity-0 translate-y-4 scale-95 pointer-events-none'
                    }`}
            >
                <div className="flex justify-between items-center mb-6">
                    <h2 id="a11y-title" className="text-xl font-bold text-slate-900">
                        Accessibility
                    </h2>
                    <button
                        onClick={() => setIsOpen(false)}
                        className="p-2 -mr-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-colors"
                        aria-label="Close accessibility menu"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="space-y-4">
                    {/* High Contrast Toggle */}
                    <button
                        onClick={() => toggleFeature('highContrast')}
                        className={`w-full flex items-center justify-between p-4 rounded-xl border-2 transition-all ${features.highContrast
                                ? 'border-blue-600 bg-blue-50'
                                : 'border-slate-100 hover:border-slate-200'
                            }`}
                        aria-pressed={features.highContrast}
                    >
                        <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-lg ${features.highContrast ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'}`}>
                                <Eye className="w-5 h-5" />
                            </div>
                            <span className={`font-semibold ${features.highContrast ? 'text-blue-900' : 'text-slate-700'}`}>
                                High Contrast
                            </span>
                        </div>
                        <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${features.highContrast ? 'border-blue-600 bg-blue-600' : 'border-slate-300'
                            }`}>
                            {features.highContrast && <div className="w-2.5 h-2.5 bg-white rounded-full" />}
                        </div>
                    </button>

                    {/* Large Text Toggle */}
                    <button
                        onClick={() => toggleFeature('largeText')}
                        className={`w-full flex items-center justify-between p-4 rounded-xl border-2 transition-all ${features.largeText
                                ? 'border-blue-600 bg-blue-50'
                                : 'border-slate-100 hover:border-slate-200'
                            }`}
                        aria-pressed={features.largeText}
                    >
                        <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-lg ${features.largeText ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'}`}>
                                <Type className="w-5 h-5" />
                            </div>
                            <span className={`font-semibold ${features.largeText ? 'text-blue-900' : 'text-slate-700'}`}>
                                Large Text
                            </span>
                        </div>
                        <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${features.largeText ? 'border-blue-600 bg-blue-600' : 'border-slate-300'
                            }`}>
                            {features.largeText && <div className="w-2.5 h-2.5 bg-white rounded-full" />}
                        </div>
                    </button>

                    {/* Reduce Motion Toggle */}
                    <button
                        onClick={() => toggleFeature('reduceMotion')}
                        className={`w-full flex items-center justify-between p-4 rounded-xl border-2 transition-all ${features.reduceMotion
                                ? 'border-blue-600 bg-blue-50'
                                : 'border-slate-100 hover:border-slate-200'
                            }`}
                        aria-pressed={features.reduceMotion}
                    >
                        <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-lg ${features.reduceMotion ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'}`}>
                                <Activity className="w-5 h-5" />
                            </div>
                            <span className={`font-semibold ${features.reduceMotion ? 'text-blue-900' : 'text-slate-700'}`}>
                                Reduce Motion
                            </span>
                        </div>
                        <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${features.reduceMotion ? 'border-blue-600 bg-blue-600' : 'border-slate-300'
                            }`}>
                            {features.reduceMotion && <div className="w-2.5 h-2.5 bg-white rounded-full" />}
                        </div>
                    </button>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-100 text-center">
                    <button
                        onClick={() => {
                            const reset = { highContrast: false, largeText: false, reduceMotion: false };
                            setFeatures(reset);
                            applyFeatures(reset);
                            localStorage.setItem('accessibility-prefs', JSON.stringify(reset));
                        }}
                        className="text-sm text-slate-400 hover:text-slate-600 underline font-medium"
                    >
                        Reset all preferences
                    </button>
                </div>
            </div>
        </>
    );
}
