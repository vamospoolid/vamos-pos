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
                        from { filter: drop-shadow(0 0 4px rgba(0,255,102,0.4)) drop-shadow(0 0 10px rgba(0,255,102,0.2)); }
                        to   { filter: drop-shadow(0 0 12px rgba(0,255,102,0.8)) drop-shadow(0 0 20px rgba(0,255,102,0.4)); }
                    }
                    .${styleId} { animation: ${styleId}_glow 2.5s ease-in-out infinite alternate; }
                `}</style>
            )}
            <img
                src="/logo_vamos.png"
                alt="Vamos Logo"
                className={`${className}${glowing ? ` ${styleId}` : ''} object-contain`}
                style={style}
            />
        </div>
    );
};

export default VamosLogo;
