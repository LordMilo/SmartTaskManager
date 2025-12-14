import React from 'react';

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  hoverEffect?: boolean;
}

export const GlassCard: React.FC<GlassCardProps> = ({ children, className = '', onClick, hoverEffect = false }) => {
  return (
    <div 
      onClick={onClick}
      className={`
        bg-white/40 dark:bg-stone-900/60 backdrop-blur-xl 
        border border-white/60 dark:border-stone-700/50 
        shadow-lg dark:shadow-stone-950/50 rounded-2xl p-4
        transition-all duration-300 ease-out
        ${hoverEffect ? 'hover:scale-[1.02] hover:bg-white/50 dark:hover:bg-stone-800/60 cursor-pointer hover:shadow-xl' : ''}
        ${className}
      `}
    >
      {children}
    </div>
  );
};