import React from 'react';

interface VamosLogoProps {
    className?: string;
    style?: React.CSSProperties;
    glowing?: boolean;
}

export const VamosLogo: React.FC<VamosLogoProps> = ({
    className = 'w-10 h-10',
    style = {},
    glowing = false,
}) => {
    const styleId = `vgl${Math.random().toString(36).slice(2, 7)}`;

    return (
        <div className="relative inline-block">
            {glowing && (
                <style>{`
                    @keyframes ${styleId}_glow {
                        from { filter: drop-shadow(0 0 4px rgba(255,87,34,0.4)) drop-shadow(0 0 10px rgba(255,87,34,0.2)); }
                        to   { filter: drop-shadow(0 0 12px rgba(255,87,34,0.8)) drop-shadow(0 0 20px rgba(255,87,34,0.4)); }
                    }
                    .${styleId} { animation: ${styleId}_glow 2.5s ease-in-out infinite alternate; }
                `}</style>
            )}
            <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 100 100"
                className={`${className}${glowing ? ` ${styleId}` : ''} object-contain`}
                style={{ ...style, fill: 'currentColor' }}
                aria-label="Vamos Logo"
            >
                {/* Minimalist Sharp V */}
                <path d="M 10,5 L 50,95 L 90,5 L 75,5 L 50,65 L 25,5 Z" />
            </svg>
        </div>
    );
};

export default VamosLogo;
