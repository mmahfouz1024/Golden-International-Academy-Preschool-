
import React, { useState, useEffect } from 'react';
import { Bus, User, MapPin, Plus, Trash2, Save, X } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { getTransportRoutes, saveTransportRoutes, getStudents } from '../services/storageService';
import { BusRoute, Student } from '../types';

const TransportTracker: React.FC = () => {
  const { t } = useLanguage();
  const [routes, setRoutes] = useState<BusRoute[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // New Route Form
  const [newRoute, setNewRoute] = useState<Partial<BusRoute>>({
    name: '',
    driverName: '',
    supervisorName: '',
    studentIds: []
  });

  useEffect(() => {
    setRoutes(getTransportRoutes());
    setStudents(getStudents());
  }, []);

  const handleSaveRoute = () => {
    if (!newRoute.name || !newRoute.driverName) return;
    
    const route: BusRoute = {
        id: Date.now().toString(),
        name: newRoute.name!,
        driverName: newRoute.driverName!,
        supervisorName: newRoute.supervisorName || '',
        studentIds: newRoute.studentIds || []
    };
    
    const updated = [...routes, route];
    setRoutes(updated);
    saveTransportRoutes(updated);
    setIsModalOpen(false);
    setNewRoute({ name: '', driverName: '', supervisorName: '', studentIds: [] });
  };

  const handleDeleteRoute = (id: string) => {
      if (confirm(t('deleteRouteConfirm'))) {
          const updated = routes.filter(r => r.id !== id);
          setRoutes(updated);
          saveTransportRoutes(updated);
      }
  };

  const toggleStudent = (studentId: string) => {
      const current = newRoute.studentIds || [];
      if (current.includes(studentId)) {
          setNewRoute({...newRoute, studentIds: current.filter(id => id !== studentId)});
      } else {
          setNewRoute({...newRoute, studentIds: [...current, studentId]});
      }
  };

  return (
    <div className="space-y-6 animate-fade-in">
        <div className="flex justify-between items-center">
            <div>
                <h2 className="text-2xl font-bold text-gray-800">{t('transportTitle')}</h2>
                <p className="text-gray-500">{t('manageRoutes')}</p>
            </div>
            <button 
                onClick={() => setIsModalOpen(true)}
                className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-xl hover:bg-indigo-700 transition-colors shadow-sm font-bold"
            >
                <Plus size={20} />
                {t('addRoute')}
            </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {routes.map(route => (
                <div key={route.id} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow relative group">
                    <button 
                        onClick={() => handleDeleteRoute(route.id)}
                        className="absolute top-4 right-4 text-gray-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                    >
                        <Trash2 size={18} />
                    </button>
                    
                    <div className="flex items-center gap-4 mb-4">
                        <div className="p-3 bg-yellow-100 text-yellow-600 rounded-full">
                            <Bus size={24} />
                        </div>
                        <div>
                            <h3 className="font-bold text-lg text-gray-800">{route.name}</h3>
                            <p className="text-sm text-gray-500">{route.driverName} • {route.supervisorName}</p>
                        </div>
                    </div>

                    <div className="border-t border-gray-50 pt-4">
                        <h4 className="text-xs font-bold text-gray-400 uppercase mb-2">{t('assignedStudents')} ({route.studentIds.length})</h4>
                        <div className="flex flex-wrap gap-2">
                            {route.studentIds.map(sid => {
                                const s = students.find(st => st.id === sid);
                                return s ? (
                                    <span key={sid} className="bg-gray-50 text-gray-600 text-xs px-2 py-1 rounded-lg border border-gray-100 flex items-center gap-1">
                                        <User size={10} /> {s.name}
                                    </span>
                                ) : null;
                            })}
                        </div>
                    </div>
                </div>
            ))}
            
            {routes.length === 0 && (
                <div className="col-span-full py-12 text-center text-gray-400 bg-white rounded-2xl border border-dashed border-gray-200">
                    <MapPin size={40} className="mx-auto mb-3 opacity-30" />
                    <p>{t('noRoutes')}</p>
                </div>
            )}
        </div>

        {isModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
                <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto animate-fade-in">
                    <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                        <h3 className="text-lg font-bold text-gray-800">{t('addRoute')}</h3>
                        <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-red-500"><X size={20} /></button>
                    </div>
                    <div className="p-6 space-y-4">
                        <input 
                            className="w-full px-4 py-2 border rounded-xl"
                            placeholder={t('routeName')}
                            value={newRoute.name}
                            onChange={e => setNewRoute({...newRoute, name: e.target.value})}
                        />
                        <input 
                            className="w-full px-4 py-2 border rounded-xl"
                            placeholder={t('driverName')}
                            value={newRoute.driverName}
                            onChange={e => setNewRoute({...newRoute, driverName: e.target.value})}
                        />
                        <input 
                            className="w-full px-4 py-2 border rounded-xl"
                            placeholder={t('supervisorName')}
                            value={newRoute.supervisorName}
                            onChange={e => setNewRoute({...newRoute, supervisorName: e.target.value})}
                        />
                        
                        <div>
                            <label className="block text-sm font-bold text-gray-500 mb-2">{t('assignedStudents')}</label>
                            <div className="max-h-40 overflow-y-auto border rounded-xl p-2 bg-gray-50">
                                {students.map(s => (
                                    <label key={s.id} className="flex items-center gap-2 p-2 hover:bg-white rounded cursor-pointer">
                                        <input 
                                            type="checkbox"
                                            checked={newRoute.studentIds?.includes(s.id)}
                                            onChange={() => toggleStudent(s.id)}
                                        />
                                        <span className="text-sm">{s.name}</span>
                                    </label>
                                ))}
                            </div>
                        </div>

                        <button 
                            onClick={handleSaveRoute}
                            className="w-full py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2"
                        >
                            <Save size={18} />
                            {t('save')}
                        </button>
                    </div>
                </div>
            </div>
        )}
    </div>
  );
};

export default TransportTracker;
