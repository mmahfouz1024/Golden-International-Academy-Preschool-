
import React from 'react';

const BackgroundPattern: React.FC = () => {
  return (
    <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none opacity-30">
      {/* Dynamic Background Elements */}
      <div className="absolute top-0 left-0 w-full h-full bg-slate-50"></div>
      
      {/* Top Right Blob */}
      <div className="absolute -top-20 -right-20 w-96 h-96 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"
           style={{ backgroundColor: 'var(--color-primary-300)' }}></div>
      
      {/* Bottom Left Blob */}
      <div className="absolute -bottom-20 -left-20 w-96 h-96 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"
           style={{ backgroundColor: 'var(--color-primary-400)' }}></div>
           
      {/* Center Blob */}
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000"
           style={{ backgroundColor: 'var(--color-primary-200)' }}></div>

      {/* Pattern Overlay */}
      <svg className="absolute w-full h-full opacity-[0.03]" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id="grid" width="60" height="60" patternUnits="userSpaceOnUse">
             {/* Paw Print */}
            <path d="M 10 20 Q 15 10 20 20 Q 25 30 15 35 Q 5 30 10 20" fill="currentColor" />
            <circle cx="8" cy="12" r="2" fill="currentColor" />
            <circle cx="15" cy="8" r="2" fill="currentColor" />
            <circle cx="22" cy="12" r="2" fill="currentColor" />
            
            {/* Star */}
            <path d="M 40 40 L 42 45 L 47 45 L 43 48 L 44 53 L 40 50 L 36 53 L 37 48 L 33 45 L 38 45 Z" fill="currentColor" transform="scale(0.8)" />
            
            {/* Circle */}
            <circle cx="50" cy="10" r="3" fill="currentColor" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)" />
      </svg>
    </div>
  );
};

export default BackgroundPattern;
