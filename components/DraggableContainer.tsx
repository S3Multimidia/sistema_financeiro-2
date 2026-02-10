import React, { useState, useCallback, useEffect, useRef } from 'react';

interface DraggableContainerProps {
    children: React.ReactNode;
    initialX?: number;
    initialY?: number;
}

export const DraggableContainer: React.FC<DraggableContainerProps> = ({
    children,
    initialX,
    initialY
}) => {
    // We use a ref for position to avoid callback closure issues, 
    // and state to trigger UI updates.
    const [displayPos, setDisplayPos] = useState({ x: initialX ?? 0, y: initialY ?? 0 });
    const posRef = useRef({ x: initialX ?? 0, y: initialY ?? 0 });
    const [dragging, setDragging] = useState(false);
    const relRef = useRef({ x: 0, y: 0 });

    // Set initial position once window is ready if not provided
    useEffect(() => {
        if (initialX === undefined || initialY === undefined) {
            const x = window.innerWidth - 350;
            const y = 100;
            posRef.current = { x, y };
            setDisplayPos({ x, y });
        }
    }, []);

    const onMouseDown = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
        if (e.button !== 0) return;

        const target = e.target as HTMLElement;
        const handle = target.closest('.handle');

        // Don't drag if clicking buttons or inputs inside handle
        if (!handle || target.closest('button') || target.closest('input')) return;

        setDragging(true);
        relRef.current = {
            x: e.clientX - posRef.current.x,
            y: e.clientY - posRef.current.y,
        };

        e.preventDefault();
        e.stopPropagation();
    }, []);

    const onMouseMove = useCallback((e: MouseEvent) => {
        if (!dragging) return;

        const newX = e.clientX - relRef.current.x;
        const newY = e.clientY - relRef.current.y;

        posRef.current = { x: newX, y: newY };
        setDisplayPos({ x: newX, y: newY });

        e.stopPropagation();
    }, [dragging]);

    const onMouseUp = useCallback(() => {
        setDragging(false);
    }, []);

    useEffect(() => {
        if (dragging) {
            window.addEventListener('mousemove', onMouseMove);
            window.addEventListener('mouseup', onMouseUp);
            document.body.style.cursor = 'grabbing';
            document.body.style.userSelect = 'none';
        } else {
            window.removeEventListener('mousemove', onMouseMove);
            window.removeEventListener('mouseup', onMouseUp);
            document.body.style.cursor = '';
            document.body.style.userSelect = '';
        }
        return () => {
            window.removeEventListener('mousemove', onMouseMove);
            window.removeEventListener('mouseup', onMouseUp);
            document.body.style.cursor = '';
            document.body.style.userSelect = '';
        };
    }, [dragging, onMouseMove, onMouseUp]);

    return (
        <div
            style={{
                position: 'fixed',
                left: 0,
                top: 0,
                transform: `translate3d(${displayPos.x}px, ${displayPos.y}px, 0)`,
                zIndex: 2000,
                transition: 'none',
                willChange: 'transform',
                cursor: dragging ? 'grabbing' : 'auto'
            }}
            onMouseDown={onMouseDown}
        >
            {children}
        </div>
    );
};
