
import React, { useState, useEffect } from 'react';
import { Database, Save, UploadCloud, DownloadCloud, CheckCircle, AlertTriangle, Copy, Code, Lock, ArrowRight, Unlock } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { getDatabaseConfig, saveDatabaseConfig, forceSyncToCloud, forceSyncFromCloud } from '../services/storageService';
import { checkConnection, generateSQLSchema } from '../services/supabaseClient';
import { DatabaseConfig } from '../types';

const DatabaseControl: React.FC = () => {
  const { t } = useLanguage();
  
  // Security State
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [authError, setAuthError] = useState(false);

  const [config, setConfig] = useState<DatabaseConfig>({
    isEnabled: false,
    url: '',
    key: '',
    autoSync: false
  });
  const [status, setStatus] = useState<'connected' | 'disconnected' | 'checking'>('checking');
  const [msg, setMsg] = useState<{type: 'success' | 'error', text: string} | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [showSql, setShowSql] = useState(false);

  useEffect(() => {
    const saved = getDatabaseConfig();
    setConfig(saved);
    if (saved.isEnabled) {
      checkStatus(saved);
    } else {
      setStatus('disconnected');
    }
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordInput === "H@mzafarida123") {
      setIsAuthenticated(true);
      setAuthError(false);
    } else {
      setAuthError(true);
      setPasswordInput('');
    }
  };

  const checkStatus = async (conf: DatabaseConfig) => {
    if (!conf.isEnabled || !conf.url || !conf.key) {
      setStatus('disconnected');
      return;
    }
    const isConnected = await checkConnection();
    setStatus(isConnected ? 'connected' : 'disconnected');
  };

  const handleSave = async () => {
    saveDatabaseConfig(config);
    setMsg({ type: 'success', text: t('dbSaved') });
    await checkStatus(config);
    setTimeout(() => setMsg(null), 3000);
  };

  const handleSync = async (direction: 'up' | 'down') => {
    setIsSyncing(true);
    let success = false;
    if (direction === 'up') {
      success = await forceSyncToCloud();
    } else {
      success = await forceSyncFromCloud();
      if (success) {
        // Reload page to reflect new data from cloud
        window.location.reload(); 
        return;
      }
    }
    setIsSyncing(false);
    
    if (success) {
      setMsg({ type: 'success', text: t('syncSuccess') });
      const newConfig = getDatabaseConfig(); // reload to get lastSync time
      setConfig(prev => ({ ...prev, lastSync: newConfig.lastSync }));
    } else {
      setMsg({ type: 'error', text: t('syncError') });
    }
    setTimeout(() => setMsg(null), 3000);
  };

  const copySql = () => {
    navigator.clipboard.writeText(generateSQLSchema());
    setMsg({ type: 'success', text: t('savedSuccessfully') }); // reusing saved msg
    setTimeout(() => setMsg(null), 2000);
  };

  if (!isAuthenticated) {
    return (
      <div className="h-[60vh] flex flex-col items-center justify-center p-4">
        <div className="bg-white p-8 rounded-3xl shadow-xl border-4 border-white max-w-sm w-full text-center animate-fade-in">
          <div className="w-20 h-20 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
            <Lock size={40} />
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">{t('security')}</h2>
          <p className="text-gray-500 mb-6 text-sm">Protected Area. Enter password to access database settings.</p>
          
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="relative">
              <input 
                type="password" 
                className={`w-full px-4 py-3 rounded-xl border-2 ${authError ? 'border-red-300 bg-red-50 focus:border-red-500' : 'border-gray-200 bg-gray-50 focus:border-indigo-500'} focus:outline-none transition-all text-center font-bold text-lg tracking-widest`}
                placeholder="••••••"
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                autoFocus
              />
            </div>
            {authError && <p className="text-red-500 text-xs font-bold animate-pulse">Incorrect Password</p>}
            <button 
              type="submit"
              className="w-full bg-indigo-600 text-white py-3 rounded-xl font-bold shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition-all flex items-center justify-center gap-2"
            >
              <Unlock size={18} />
              Access
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12 animate-fade-in">
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <div className="flex items-center gap-4 mb-6">
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
            <Database size={32} />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-800">{t('dbSettings')}</h2>
            <p className="text-gray-500">{t('dbSubtitle')}</p>
          </div>
        </div>

        {msg && (
          <div className={`mb-6 p-4 rounded-xl flex items-center gap-2 ${msg.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
            {msg.type === 'success' ? <CheckCircle size={20} /> : <AlertTriangle size={20} />}
            {msg.text}
          </div>
        )}

        <div className="space-y-6">
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100">
             <span className="font-medium text-gray-700">{t('connectionStatus')}</span>
             <div className="flex items-center gap-2">
               <div className={`w-3 h-3 rounded-full ${status === 'connected' ? 'bg-green-500' : 'bg-red-500'}`}></div>
               <span className={`font-bold ${status === 'connected' ? 'text-green-600' : 'text-red-600'}`}>
                 {status === 'connected' ? t('connected') : t('disconnected')}
               </span>
             </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">{t('supabaseUrl')}</label>
              <input 
                type="text" 
                className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                value={config.url}
                onChange={(e) => setConfig({ ...config, url: e.target.value })}
                placeholder="https://xyz.supabase.co"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">{t('supabaseKey')}</label>
              <input 
                type="password" 
                className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                value={config.key}
                onChange={(e) => setConfig({ ...config, key: e.target.value })}
                placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI..."
              />
            </div>
          </div>

          <div className="flex items-center gap-4">
             <label className="flex items-center gap-2 cursor-pointer">
               <input 
                 type="checkbox" 
                 checked={config.isEnabled}
                 onChange={(e) => setConfig({ ...config, isEnabled: e.target.checked })}
                 className="w-5 h-5 text-indigo-600 rounded focus:ring-indigo-500"
               />
               <span className="font-medium text-gray-700">{t('connected')} (Enable)</span>
             </label>

             <label className="flex items-center gap-2 cursor-pointer">
               <input 
                 type="checkbox" 
                 checked={config.autoSync}
                 onChange={(e) => setConfig({ ...config, autoSync: e.target.checked })}
                 className="w-5 h-5 text-indigo-600 rounded focus:ring-indigo-500"
               />
               <span className="font-medium text-gray-700">{t('autoSync')}</span>
             </label>
          </div>

          <div className="pt-4 border-t border-gray-100 flex justify-end">
            <button 
              onClick={handleSave}
              className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-colors flex items-center gap-2"
            >
              <Save size={18} />
              {t('save')}
            </button>
          </div>
        </div>
      </div>

      {config.isEnabled && (
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
           <div className="flex justify-between items-center mb-6">
             <h3 className="text-lg font-bold text-gray-800">{t('syncNow')}</h3>
             {config.lastSync && (
               <span className="text-xs text-gray-500">{t('lastSync')}: {new Date(config.lastSync).toLocaleString()}</span>
             )}
           </div>

           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <button 
                onClick={() => handleSync('up')}
                disabled={isSyncing}
                className="p-4 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors flex flex-col items-center gap-2 text-center group"
              >
                <div className="p-3 bg-indigo-50 text-indigo-600 rounded-full group-hover:scale-110 transition-transform">
                  <UploadCloud size={24} className={isSyncing ? "animate-bounce" : ""} />
                </div>
                <span className="font-bold text-gray-700">{t('uploadLocal')}</span>
                <span className="text-xs text-gray-500">Local Storage ➔ Supabase</span>
              </button>

              <button 
                onClick={() => handleSync('down')}
                disabled={isSyncing}
                className="p-4 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors flex flex-col items-center gap-2 text-center group"
              >
                <div className="p-3 bg-purple-50 text-purple-600 rounded-full group-hover:scale-110 transition-transform">
                  <DownloadCloud size={24} className={isSyncing ? "animate-bounce" : ""} />
                </div>
                <span className="font-bold text-gray-700">{t('downloadCloud')}</span>
                <span className="text-xs text-gray-500">Supabase ➔ Local Storage</span>
              </button>
           </div>
        </div>
      )}

      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
         <button 
           onClick={() => setShowSql(!showSql)}
           className="flex items-center gap-2 text-gray-600 font-medium hover:text-indigo-600 mb-4"
         >
           <Code size={20} />
           {t('generateSql')}
         </button>

         {showSql && (
           <div className="bg-slate-900 rounded-xl p-4 relative group">
              <p className="text-gray-400 text-xs mb-2">{t('sqlInstructions')}</p>
              <pre className="text-green-400 text-sm overflow-x-auto p-2 font-mono">
                {generateSQLSchema()}
              </pre>
              <button 
                onClick={copySql}
                className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors"
                title={t('copySql')}
              >
                <Copy size={16} />
              </button>
           </div>
         )}
      </div>
    </div>
  );
};

export default DatabaseControl;
