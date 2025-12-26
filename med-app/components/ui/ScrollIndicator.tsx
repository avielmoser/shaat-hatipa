"use client";

import React, { useEffect, useState, useCallback, useRef } from "react";

interface ScrollIndicatorProps {
    containerRef: React.RefObject<HTMLDivElement | null>;
    isRtl: boolean;
}

export function ScrollIndicator({ containerRef, isRtl }: ScrollIndicatorProps) {
    const [hasOverflow, setHasOverflow] = useState(false);
    const [thumbTop, setThumbTop] = useState(0);
    const [thumbHeight, setThumbHeight] = useState(0);
    const [isVisible, setIsVisible] = useState(false);

    const updatePosition = useCallback(() => {
        const el = containerRef.current;
        if (!el) return;

        const { scrollTop, scrollHeight, clientHeight } = el;
        const overflow = scrollHeight > clientHeight + 1;
        setHasOverflow(overflow);

        if (overflow) {
            // track is from top-3 (12px) to bottom-3 (12px)
            const trackHeight = clientHeight - 24;
            const visibleFraction = clientHeight / scrollHeight;
            const h = Math.max(visibleFraction * trackHeight, 24); // min 24px thumb
            setThumbHeight(h);

            const scrollableDist = scrollHeight - clientHeight;
            const scrollRatio = scrollTop / scrollableDist;
            const thumbScrollableDist = trackHeight - h;
            setThumbTop(scrollRatio * thumbScrollableDist + 12);
            setIsVisible(true);
        } else {
            setIsVisible(false);
        }
    }, [containerRef]);

    useEffect(() => {
        const el = containerRef.current;
        if (!el) return;

        updatePosition();

        const handleScroll = () => updatePosition();
        el.addEventListener("scroll", handleScroll, { passive: true });

        const observer = new ResizeObserver(updatePosition);
        observer.observe(el);
        // Also observe the first child to catch content height changes
        if (el.firstElementChild) {
            observer.observe(el.firstElementChild);
        }

        return () => {
            el.removeEventListener("scroll", handleScroll);
            observer.disconnect();
        };
    }, [containerRef, updatePosition]);

    if (!isVisible) return null;

    return (
        <>
            {/* Track */}
            <div
                className={`absolute top-3 bottom-3 w-[6px] rounded-full bg-slate-100 z-20 pointer-events-none
          ${isRtl ? 'left-[6px]' : 'right-[6px]'}`}
            />
            {/* Thumb */}
            <div
                className={`absolute w-[6px] rounded-full bg-slate-300 z-20 pointer-events-none shadow-sm transition-[top,height] duration-75
          ${isRtl ? 'left-[6px]' : 'right-[6px]'}`}
                style={{
                    height: `${thumbHeight}px`,
                    top: `${thumbTop}px`
                }}
            />
        </>
    );
}
