
import React from 'react';
import { Sun, Cloud, Star, Sparkles, Heart } from 'lucide-react';

const BackgroundPattern: React.FC = () => {
  return (
    <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none select-none">
      {/* Floating Animated Icons matching Login Page */}
      <div className="absolute top-[5%] left-[5%] text-yellow-400/30 animate-bounce" style={{ animationDuration: '3s' }}>
        <Sun size={64} fill="currentColor" />
      </div>
      
      <div className="absolute top-[15%] right-[10%] text-blue-200/50 animate-pulse" style={{ animationDuration: '4s' }}>
        <Cloud size={80} fill="currentColor" />
      </div>

      <div className="absolute bottom-[10%] left-[8%] text-pink-400/20 animate-bounce" style={{ animationDuration: '3.5s' }}>
        <Star size={48} fill="currentColor" />
      </div>

      <div className="absolute bottom-[20%] right-[5%] text-indigo-300/30 animate-pulse" style={{ animationDuration: '5s' }}>
        <Cloud size={60} fill="currentColor" />
      </div>
      
      <div className="absolute top-[40%] left-[2%] text-purple-400/20 animate-spin-slow">
        <Sparkles size={40} />
      </div>

       <div className="absolute top-[60%] right-[15%] text-red-400/10 animate-bounce" style={{ animationDuration: '4.5s' }}>
        <Heart size={32} fill="currentColor" />
      </div>

      {/* Soft Blobs */}
      <div className="absolute -top-20 -right-20 w-96 h-96 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob bg-purple-300"></div>
      <div className="absolute -bottom-20 -left-20 w-96 h-96 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000 bg-pink-300"></div>
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000 bg-yellow-200"></div>

      {/* Pattern Overlay */}
      <svg className="absolute w-full h-full opacity-[0.03]" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id="grid" width="60" height="60" patternUnits="userSpaceOnUse">
             <path d="M 10 20 Q 15 10 20 20 Q 25 30 15 35 Q 5 30 10 20" fill="currentColor" className="text-indigo-900" />
            <circle cx="50" cy="10" r="3" fill="currentColor" className="text-pink-900" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)" />
      </svg>
    </div>
  );
};

export default BackgroundPattern;
