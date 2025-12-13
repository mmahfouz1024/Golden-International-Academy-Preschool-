
import React, { useState, useEffect } from 'react';
import { DollarSign, User as UserIcon, Plus, Save, History, Check } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { getUsers, saveUsers, getPayroll, savePayroll } from '../services/storageService';
import { User, StaffSalary } from '../types';

const StaffAffairs: React.FC = () => {
  const { t, language } = useLanguage();
  const [staff, setStaff] = useState<User[]>([]);
  const [history, setHistory] = useState<StaffSalary[]>([]);
  
  // Payment Form
  const [selectedStaffId, setSelectedStaffId] = useState('');
  const [amount, setAmount] = useState('');
  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7)); // YYYY-MM

  // Edit Base Salary
  const [editingBaseId, setEditingBaseId] = useState<string | null>(null);
  const [baseSalaryInput, setBaseSalaryInput] = useState('');

  useEffect(() => {
      const allUsers = getUsers();
      // Admin (General Manager) and Manager should not be in payroll usually, but Teachers definitely are.
      // Let's include everyone except the current user maybe? Or generally just Teachers + Managers
      const staffList = allUsers.filter(u => u.role !== 'parent' && u.role !== 'admin');
      setStaff(staffList);
      setHistory(getPayroll());
  }, []);

  const handleRecordPayment = () => {
      if (!selectedStaffId || !amount) return;
      const staffMember = staff.find(s => s.id === selectedStaffId);
      if (!staffMember) return;

      const record: StaffSalary = {
          id: Date.now().toString(),
          staffId: staffMember.id,
          staffName: staffMember.name,
          amount: parseFloat(amount),
          date: new Date().toISOString().split('T')[0],
          month: month,
          status: 'paid'
      };

      const updatedHistory = [record, ...history];
      setHistory(updatedHistory);
      savePayroll(updatedHistory);
      setAmount('');
      alert(t('savedSuccessfully'));
  };

  const handleUpdateBaseSalary = (id: string) => {
      const allUsers = getUsers();
      const updatedUsers = allUsers.map(u => {
          if (u.id === id) {
              return { ...u, salary: parseFloat(baseSalaryInput) };
          }
          return u;
      });
      saveUsers(updatedUsers);
      setStaff(updatedUsers.filter(u => u.role !== 'parent' && u.role !== 'admin'));
      setEditingBaseId(null);
  };

  return (
    <div className="space-y-8 animate-fade-in">
        <div>
            <h2 className="text-2xl font-bold text-gray-800">{t('hrTitle')}</h2>
            <p className="text-gray-500">{t('hrSubtitle')}</p>
        </div>

        {/* 1. Record Payment Section */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <h3 className="font-bold text-lg text-gray-800 mb-4 flex items-center gap-2">
                <div className="p-2 bg-green-100 text-green-600 rounded-lg"><DollarSign size={20}/></div>
                {t('recordSalary')}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                <div>
                    <label className="block text-sm font-bold text-gray-500 mb-1">{t('staffMember')}</label>
                    <select 
                        className="w-full p-2.5 bg-gray-50 rounded-xl border border-gray-200"
                        value={selectedStaffId}
                        onChange={e => {
                            setSelectedStaffId(e.target.value);
                            const s = staff.find(u => u.id === e.target.value);
                            if (s && s.salary) setAmount(s.salary.toString());
                        }}
                    >
                        <option value="">{t('selectOption')}</option>
                        {staff.map(s => (
                            <option key={s.id} value={s.id}>{s.name} ({t(`role${s.role.charAt(0).toUpperCase() + s.role.slice(1)}` as any)})</option>
                        ))}
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-bold text-gray-500 mb-1">{t('paymentMonth')}</label>
                    <input 
                        type="month" 
                        className="w-full p-2.5 bg-gray-50 rounded-xl border border-gray-200"
                        value={month}
                        onChange={e => setMonth(e.target.value)}
                    />
                </div>
                <div>
                    <label className="block text-sm font-bold text-gray-500 mb-1">{t('salaryAmount')}</label>
                    <input 
                        type="number" 
                        className="w-full p-2.5 bg-gray-50 rounded-xl border border-gray-200"
                        value={amount}
                        onChange={e => setAmount(e.target.value)}
                    />
                </div>
                <button 
                    onClick={handleRecordPayment}
                    className="py-2.5 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-colors"
                >
                    {t('save')}
                </button>
            </div>
        </div>

        {/* 2. Staff List & Base Salary */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-4 bg-gray-50 border-b border-gray-100 font-bold text-gray-700">
                {t('staffMember')}
            </div>
            <div className="divide-y divide-gray-50">
                {staff.map(s => (
                    <div key={s.id} className="p-4 flex items-center justify-between hover:bg-gray-50/50">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
                                {s.name.charAt(0)}
                            </div>
                            <div>
                                <p className="font-bold text-gray-800">{s.name}</p>
                                <p className="text-xs text-gray-500">{t(`role${s.role.charAt(0).toUpperCase() + s.role.slice(1)}` as any)}</p>
                            </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                            <span className="text-xs text-gray-400 uppercase font-bold">{t('baseSalary')}:</span>
                            {editingBaseId === s.id ? (
                                <div className="flex items-center gap-1">
                                    <input 
                                        className="w-20 p-1 border rounded text-sm"
                                        type="number"
                                        value={baseSalaryInput}
                                        onChange={e => setBaseSalaryInput(e.target.value)}
                                        autoFocus
                                    />
                                    <button onClick={() => handleUpdateBaseSalary(s.id)} className="text-green-600"><Check size={18}/></button>
                                </div>
                            ) : (
                                <div className="flex items-center gap-2">
                                    <span className="font-mono font-bold text-gray-700">{s.salary || 0} {t('currency')}</span>
                                    <button 
                                        onClick={() => { setEditingBaseId(s.id); setBaseSalaryInput(s.salary?.toString() || ''); }}
                                        className="text-gray-300 hover:text-indigo-500"
                                    >
                                        <Plus size={14} />
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>

        {/* 3. History */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <h3 className="font-bold text-lg text-gray-800 mb-4 flex items-center gap-2">
                <div className="p-2 bg-blue-100 text-blue-600 rounded-lg"><History size={20}/></div>
                {t('paymentHistory')}
            </h3>
            <div className="max-h-60 overflow-y-auto custom-scrollbar space-y-2">
                {history.map((record, idx) => (
                    <div key={idx} className="flex justify-between items-center p-3 bg-gray-50 rounded-xl">
                        <div>
                            <p className="font-bold text-gray-800">{record.staffName}</p>
                            <p className="text-xs text-gray-500">{record.date}</p>
                        </div>
                        <div className="text-right">
                            <p className="font-bold text-indigo-600">{record.amount} {t('currency')}</p>
                            <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded font-bold">{record.month}</span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    </div>
  );
};

export default StaffAffairs;
