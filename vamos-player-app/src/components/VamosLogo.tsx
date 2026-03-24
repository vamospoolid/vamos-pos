import React from 'react';

interface VamosLogoProps {
    className?: string;
    color?: string;
    glowing?: boolean;
}

export const VamosLogo: React.FC<VamosLogoProps> = ({
    className = 'w-10 h-10',
    color = 'currentColor',
    glowing = false,
}) => {
    const styleId = `vgl${Math.random().toString(36).slice(2, 7)}`;

    return (
        <>
            {glowing && (
                <style>{`
                    @keyframes ${styleId}_glow {
                        from { filter: drop-shadow(0 0 4px ${color}80) drop-shadow(0 0 10px ${color}50); }
                        to   { filter: drop-shadow(0 0 14px ${color}) drop-shadow(0 0 26px ${color}bb); }
                    }
                    .${styleId} { animation: ${styleId}_glow 2s ease-in-out infinite alternate; }
                `}</style>
            )}
            <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 200 200"
                className={`${className}${glowing ? ` ${styleId}` : ''}`}
                style={{ color }}
                fill="currentColor"
                aria-label="Vamos Pool Logo"
            >
                {/* V4 — Geometric Interlocking Shards */}
                <g transform="translate(0, 5)">
                    {/* Main Body - Left Shard */}
                    <path d="M 100,190 L 25,20 L 70,20 L 100,75 L 100,190 Z" opacity="0.9" />
                    {/* Main Body - Right Shard */}
                    <path d="M 100,190 L 175,20 L 130,20 L 100,75 L 100,190 Z" />
                    
                    {/* Distinct Outer Notches (Stencil Style) */}
                    <path d="M 54,65 L 44,65 L 44,80 L 59,80 Z" />
                    <path d="M 146,65 L 156,65 L 156,80 L 141,80 Z" />
                    <path d="M 69,115 L 59,115 L 59,130 L 74,130 Z" />
                    <path d="M 131,115 L 141,115 L 141,130 L 126,130 Z" />

                    {/* Sharp Top Cutout */}
                    <path d="M 85,20 L 100,55 L 115,20 Z" fill="#000" />
                </g>
            </svg>
        </>
    );
};

export default VamosLogo;
