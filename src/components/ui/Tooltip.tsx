import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface TooltipProps {
  content: string | React.ReactNode;
  children: React.ReactNode;
  position?: 'top' | 'bottom' | 'left' | 'right';
}

export const Tooltip: React.FC<TooltipProps> = ({ 
  content, 
  children, 
  position = 'top' 
}) => {
  const [isVisible, setIsVisible] = useState(false);

  const positionStyles = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 -translate-y-1/2 ml-2'
  };

  const arrowStyles = {
    top: 'top-full left-1/2 -translate-x-1/2 -mt-1 border-t-slate-800 border-x-transparent border-b-transparent',
    bottom: 'bottom-full left-1/2 -translate-x-1/2 -mb-1 border-b-slate-800 border-x-transparent border-t-transparent',
    left: 'left-full top-1/2 -translate-y-1/2 -ml-1 border-l-slate-800 border-y-transparent border-r-transparent',
    right: 'right-full top-1/2 -translate-y-1/2 -mr-1 border-r-slate-800 border-y-transparent border-l-transparent'
  };

  return (
    <div 
      className="relative flex items-center"
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
    >
      {children}
      <AnimatePresence>
        {isVisible && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: position === 'top' ? 4 : position === 'bottom' ? -4 : 0 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.1, ease: "easeOut" }}
            className={`absolute z-[100] ${positionStyles[position]}`}
          >
            <div className="bg-slate-900 border border-slate-800 text-white text-[10px] font-bold px-3 py-2 rounded-lg shadow-2xl whitespace-nowrap min-w-[120px] max-w-[240px] leading-relaxed">
              {content}
              <div className={`absolute border-4 ${arrowStyles[position]}`} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
