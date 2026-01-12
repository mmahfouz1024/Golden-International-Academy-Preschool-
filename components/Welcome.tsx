
import React from 'react';
import { ArrowRight, Star, Heart, Sun, Sparkles, BookOpen } from 'lucide-react';
import BackgroundPattern from './BackgroundPattern';

interface WelcomeProps {
  onLoginClick: () => void;
}

const Welcome: React.FC<WelcomeProps> = ({ onLoginClick }) => {
  return (
    <div className="min-h-screen bg-indigo-50 relative overflow-hidden flex flex-col">
      <BackgroundPattern />
      
      {/* Content */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center p-6 text-center">
         
         {/* Logo Section */}
         <div className="mb-10 relative group">
            <div className="absolute inset-0 bg-gold-400 rounded-full blur-3xl opacity-20 group-hover:opacity-30 transition-opacity animate-pulse"></div>
            
            {/* Logo Container */}
            <div className="w-52 h-52 bg-white rounded-full shadow-2xl flex items-center justify-center border-4 border-white relative z-10 transform transition-transform group-hover:scale-105 duration-500 overflow-hidden">
               <svg viewBox="0 0 500 500" className="w-full h-full">
                  <circle cx="250" cy="250" r="245" fill="white" stroke="#333" strokeWidth="2" />
                  
                  {/* Thick Split Ring */}
                  <path d="M 30,250 A 220,220 0 0 1 470,250" fill="none" stroke="#9333ea" strokeWidth="40" />
                  <path d="M 30,250 A 220,220 0 0 0 470,250" fill="none" stroke="#f59e0b" strokeWidth="40" />
                  
                  {/* Inner Divider */}
                  <circle cx="250" cy="250" r="200" fill="white" stroke="#333" strokeWidth="2" />
                  
                  {/* Center Content Group */}
                  <g transform="translate(0, -25)">
                      {/* Globe */}
                      <path d="M 170,200 Q 250,130 330,200" fill="none" stroke="#f59e0b" strokeWidth="8" />
                      <path d="M 170,200 Q 250,270 330,200" fill="none" stroke="#f59e0b" strokeWidth="8" />
                      <line x1="250" y1="130" x2="250" y2="270" stroke="#f59e0b" strokeWidth="8" />
                      <line x1="150" y1="200" x2="350" y2="200" stroke="#f59e0b" strokeWidth="8" />
                      <path d="M 170,200 A 80,80 0 0 1 330,200" fill="none" stroke="#f59e0b" strokeWidth="8" />
                      
                      {/* Cap */}
                      <path d="M 200,120 L 250,90 L 300,120 L 250,150 Z" fill="#3b82f6" stroke="#1e40af" strokeWidth="5" strokeLinejoin="round" />
                      <line x1="300" y1="120" x2="300" y2="160" stroke="#1e40af" strokeWidth="4" />
                      
                      {/* Book */}
                      <path d="M 150,260 Q 250,310 350,260" fill="none" stroke="#3b82f6" strokeWidth="12" strokeLinecap="round" />
                      <path d="M 150,280 Q 250,330 350,280" fill="none" stroke="#3b82f6" strokeWidth="12" strokeLinecap="round" />
                      <line x1="250" y1="260" x2="250" y2="310" stroke="#3b82f6" strokeWidth="8" />
                  </g>

                  {/* Text */}
                  <text x="250" y="360" textAnchor="middle" fontFamily="Arial, sans-serif" fontWeight="bold" fontSize="42" fill="#0f172a">Planet of Science</text>
                  <text x="250" y="410" textAnchor="middle" fontFamily="Arial, sans-serif" fontWeight="bold" fontSize="32" fill="#334155">nersuye</text>
              </svg>
            </div>
            
            {/* Decorative Stars */}
            <div className="absolute -top-4 -right-4 text-gold-400 animate-spin-slow">
                <Sun size={48} fill="currentColor" />
            </div>
            <div className="absolute -bottom-2 -left-6 text-indigo-500 animate-bounce" style={{ animationDuration: '3s' }}>
                <Star size={40} fill="currentColor" />
            </div>
         </div>

         <h1 className="text-4xl md:text-6xl font-display font-bold text-slate-800 mb-4 leading-tight drop-shadow-sm">
           Planet of <br/>
           <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600">Science</span>
         </h1>
         
         <p className="text-xl md:text-2xl text-gold-600 font-bold mb-8 uppercase tracking-widest">
            Nursery
         </p>

         <p className="text-lg text-slate-600 max-w-xl mb-10 font-medium leading-relaxed">
           بيئة تعليمية ذكية ومتطورة لنمو طفلك. <br/>
           <span className="text-sm md:text-base text-slate-500 mt-2 block opacity-80">Smart environment for your child's growth. Track attendance, daily reports, and activities in real-time.</span>
         </p>

         <button 
           onClick={onLoginClick}
           className="group relative px-10 py-5 bg-gradient-to-r from-indigo-800 to-indigo-600 text-white rounded-2xl font-bold text-xl shadow-xl shadow-indigo-200 hover:shadow-2xl hover:scale-105 transition-all flex items-center gap-4"
         >
           <span>Login to Portal</span>
           <div className="bg-white/20 p-1 rounded-lg">
             <ArrowRight size={24} className="group-hover:translate-x-1 transition-transform" />
           </div>
         </button>

         {/* Features Grid */}
         <div className="mt-20 grid grid-cols-3 gap-6 md:gap-12 w-full max-w-2xl px-4">
            <div className="flex flex-col items-center gap-3 group cursor-default">
                <div className="p-4 bg-white border-2 border-indigo-100 shadow-lg shadow-indigo-50 text-indigo-500 rounded-2xl group-hover:-translate-y-2 transition-transform duration-300">
                    <Heart fill="currentColor" size={28} />
                </div>
                <span className="text-sm font-bold text-slate-600 uppercase tracking-wider">Care</span>
            </div>
            <div className="flex flex-col items-center gap-3 group cursor-default">
                <div className="p-4 bg-white border-2 border-gold-100 shadow-lg shadow-gold-50 text-gold-500 rounded-2xl group-hover:-translate-y-2 transition-transform duration-300 delay-75">
                    <BookOpen size={28} />
                </div>
                <span className="text-sm font-bold text-slate-600 uppercase tracking-wider">Learn</span>
            </div>
            <div className="flex flex-col items-center gap-3 group cursor-default">
                <div className="p-4 bg-white border-2 border-purple-100 shadow-lg shadow-purple-50 text-purple-500 rounded-2xl group-hover:-translate-y-2 transition-transform duration-300 delay-150">
                    <Sparkles fill="currentColor" size={28} />
                </div>
                <span className="text-sm font-bold text-slate-600 uppercase tracking-wider">Play</span>
            </div>
         </div>
      </div>
      
      <div className="relative z-10 p-6 text-center border-t border-indigo-100/50">
         <p className="text-slate-400 text-[10px] font-bold tracking-[0.2em] uppercase">Planet of Science System © 2025</p>
      </div>
    </div>
  );
};

export default Welcome;