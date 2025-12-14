import React from 'react';

export const Background: React.FC = () => {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden bg-stone-50 dark:bg-stone-950 transition-colors duration-500">
      <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-emerald-50/50 to-lime-50/50 dark:from-stone-900/80 dark:to-emerald-950/40" />
      
      {/* Animated Blobs */}
      <div className="absolute top-0 -left-4 w-72 h-72 bg-emerald-300 dark:bg-emerald-600/30 rounded-full mix-blend-multiply dark:mix-blend-normal filter blur-xl opacity-30 dark:opacity-20 animate-blob"></div>
      <div className="absolute top-0 -right-4 w-72 h-72 bg-lime-300 dark:bg-lime-600/30 rounded-full mix-blend-multiply dark:mix-blend-normal filter blur-xl opacity-30 dark:opacity-20 animate-blob animation-delay-2000"></div>
      <div className="absolute -bottom-8 left-20 w-72 h-72 bg-teal-300 dark:bg-teal-700/30 rounded-full mix-blend-multiply dark:mix-blend-normal filter blur-xl opacity-30 dark:opacity-20 animate-blob animation-delay-4000"></div>
      
      {/* Noise Texture Overlay for natural feel */}
      <div className="absolute inset-0 opacity-[0.03] dark:opacity-[0.05] pointer-events-none" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }}></div>
    </div>
  );
};