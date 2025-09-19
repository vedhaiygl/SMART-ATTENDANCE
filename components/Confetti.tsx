import React, { useEffect, useState } from 'react';

const ConfettiPiece: React.FC<{ style: React.CSSProperties }> = ({ style }) => (
    <div className="absolute w-2 h-4" style={style}></div>
);

const Confetti: React.FC = () => {
    const [pieces, setPieces] = useState<React.CSSProperties[]>([]);

    useEffect(() => {
        const newPieces = Array.from({ length: 50 }).map(() => ({
            left: `${Math.random() * 100}%`,
            animation: `fall ${3 + Math.random() * 4}s linear forwards`,
            backgroundColor: `hsl(${Math.random() * 360}, 70%, 50%)`,
            transform: `rotate(${Math.random() * 360}deg)`,
            opacity: 1,
        }));
        setPieces(newPieces);
    }, []);

    return (
        <div className="fixed top-0 left-0 w-full h-full pointer-events-none z-[100] overflow-hidden">
            {pieces.map((style, index) => (
                <ConfettiPiece key={index} style={style} />
            ))}
        </div>
    );
};

export default Confetti;
