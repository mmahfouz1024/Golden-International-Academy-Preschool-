
import React from 'react';
import { Sun, Cloud, Star, Sparkles, Heart, Hexagon } from 'lucide-react';

const BackgroundPattern: React.FC = () => {
  return (
    <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none select-none bg-slate-50">
      {/* Gradient Mesh Background */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-indigo-100/40 via-sky-50/20 to-transparent opacity-70"></div>
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,_var(--tw-gradient-stops))] from-pink-100/40 via-purple-50/20 to-transparent opacity-70"></div>

      {/* Floating Animated Icons matching Login Page - Softer Colors */}
      <div className="absolute top-[5%] left-[5%] text-yellow-400/20 animate-bounce" style={{ animationDuration: '6s' }}>
        <Sun size={64} fill="currentColor" />
      </div>
      
      <div className="absolute top-[15%] right-[10%] text-blue-300/20 animate-pulse" style={{ animationDuration: '8s' }}>
        <Cloud size={80} fill="currentColor" />
      </div>

      <div className="absolute bottom-[10%] left-[8%] text-pink-300/20 animate-bounce" style={{ animationDuration: '7s' }}>
        <Star size={48} fill="currentColor" />
      </div>

      <div className="absolute bottom-[20%] right-[5%] text-indigo-300/20 animate-pulse" style={{ animationDuration: '9s' }}>
        <Cloud size={60} fill="currentColor" />
      </div>
      
      <div className="absolute top-[40%] left-[2%] text-purple-300/20 animate-spin-slow">
        <Sparkles size={40} />
      </div>

       <div className="absolute top-[60%] right-[15%] text-red-300/10 animate-bounce" style={{ animationDuration: '5.5s' }}>
        <Heart size={32} fill="currentColor" />
      </div>
      
      <div className="absolute bottom-[40%] left-[40%] text-green-300/10 animate-pulse" style={{ animationDuration: '10s' }}>
        <Hexagon size={50} />
      </div>

      {/* Soft Blobs - More diffuse */}
      <div className="absolute -top-20 -right-20 w-[30rem] h-[30rem] rounded-full mix-blend-multiply filter blur-[64px] opacity-20 animate-blob bg-purple-200"></div>
      <div className="absolute -bottom-20 -left-20 w-[30rem] h-[30rem] rounded-full mix-blend-multiply filter blur-[64px] opacity-20 animate-blob animation-delay-2000 bg-pink-200"></div>
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[30rem] h-[30rem] rounded-full mix-blend-multiply filter blur-[64px] opacity-20 animate-blob animation-delay-4000 bg-yellow-100"></div>

      {/* Pattern Overlay - Dot Grid instead of Lines for cleaner look */}
      <svg className="absolute w-full h-full opacity-[0.4]" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id="dot-grid" width="20" height="20" patternUnits="userSpaceOnUse">
            <circle cx="2" cy="2" r="1" fill="#cbd5e1" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#dot-grid)" />
      </svg>
    </div>
  );
};

export default BackgroundPattern;
