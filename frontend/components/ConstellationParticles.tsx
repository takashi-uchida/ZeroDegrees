'use client';

export default function ConstellationParticles({ count = 12 }: { count?: number }) {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {[...Array(count)].map((_, i) => {
        const delay = (i * 0.3).toFixed(1);
        const duration = (2 + (i % 3) * 0.5).toFixed(1);
        const left = 15 + (i * 7) % 70;
        const top = 20 + (i * 11) % 60;
        const size = i % 3 === 0 ? 2 : 1;
        
        return (
          <div
            key={`constellation-particle-${i}`}
            className="absolute rounded-full bg-sky-300"
            style={{
              left: `${left}%`,
              top: `${top}%`,
              width: `${size}px`,
              height: `${size}px`,
              animation: `constellation-pulse ${duration}s ease-in-out ${delay}s infinite`,
              boxShadow: '0 0 8px rgba(125, 211, 252, 0.8)',
            }}
          />
        );
      })}
    </div>
  );
}
