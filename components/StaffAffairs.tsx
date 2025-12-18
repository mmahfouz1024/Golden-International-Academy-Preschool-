
import React, { useState, useEffect } from 'react';
import { DollarSign, Plus, History, Check, Trash2, Calendar, User, UserCog, ChevronDown } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { getUsers, saveUsers, getPayroll, savePayroll } from '../services/storageService';
import { User as UserType, StaffSalary } from '../types';

const StaffAffairs: React.FC = () => {
  const { t, language } = useLanguage();
  const [staff, setStaff] = useState<UserType[]>([]);
  const [history, setHistory] = useState<StaffSalary[]>([]);
  const [currentUser, setCurrentUser] = useState<UserType | null>(null);
  
  // Payment Form
  const [selectedStaffId, setSelectedStaffId] = useState('');
  const [amount, setAmount] = useState('');
  const [month, setMonth] = useState(new Date().toISOString().split('T')[0]); // YYYY-MM-DD

  // Edit Base Salary
  const [editingBaseId, setEditingBaseId] = useState<string | null>(null);
  const [baseSalaryInput, setBaseSalaryInput] = useState('');

  // English Full Date Formatter: "25 October 2025"
  const formatFullDate = (dateStr: string) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-GB', { 
      day: '2-digit', 
      month: 'long', 
      year: 'numeric' 
    });
  };

  useEffect(() => {
      const allUsers = getUsers();
      const storedUid = localStorage.getItem('golden_session_uid');
      const foundUser = allUsers.find(u => u.id === storedUid);
      setCurrentUser(foundUser || null);

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
          month: month, // Storing full date
          status: 'paid'
      };

      const updatedHistory = [record, ...history];
      setHistory(updatedHistory);
      savePayroll(updatedHistory);
      setAmount('');
      setSelectedStaffId('');
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

  const handleDeleteHistoryItem = (id: string) => {
      if (!window.confirm(language === 'ar' ? 'هل أنت متأكد من حذف هذا السجل؟' : 'Are you sure you want to delete this record?')) return;
      const updated = history.filter(item => item.id !== id);
      setHistory(updated);
      savePayroll(updated);
  };

  const canManage = currentUser?.role === 'admin' || currentUser?.role === 'manager';

  if (!canManage) {
      return (
          <div className="p-20 text-center bg-white rounded-3xl border border-gray-100">
              <UserCog size={48} className="mx-auto mb-4 text-gray-300" />
              <h2 className="text-xl font-bold text-gray-800">{t('contactAdmin')}</h2>
              <p className="text-gray-500">Only admins can manage staff payroll.</p>
          </div>
      );
  }

  return (
    <div className="space-y-8 animate-fade-in pb-20">
        <div className="flex flex-col gap-1">
            <h2 className="text-2xl font-bold text-gray-800">{t('hrTitle')}</h2>
            <p className="text-gray-500">{t('hrSubtitle')}</p>
        </div>

        {/* 1. Record Payment Section */}
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
            <h3 className="font-bold text-lg text-gray-800 mb-4 flex items-center gap-2">
                <div className="p-2 bg-green-100 text-green-600 rounded-lg"><DollarSign size={20}/></div>
                {t('recordSalary')}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                <div>
                    <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase">{t('staffMember')}</label>
                    <select 
                        className="w-full p-3 bg-gray-50 rounded-xl border border-gray-100 focus:bg-white focus:outline-none transition-all text-sm font-bold"
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
                    <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase">{t('paymentMonth')}</label>
                    <div className="relative group">
                        <div className="flex items-center gap-2 bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 cursor-pointer group-focus-within:bg-white transition-all">
                            <Calendar size={18} className="text-indigo-500" />
                            <span className="font-bold text-sm text-gray-700 whitespace-nowrap" dir="ltr">{formatFullDate(month)}</span>
                            <ChevronDown size={14} className="text-gray-400 ml-auto" />
                        </div>
                        <input 
                            type="date" 
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                            value={month}
                            onChange={e => setMonth(e.target.value)}
                        />
                    </div>
                </div>
                <div>
                    <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase">{t('salaryAmount')}</label>
                    <input 
                        type="number" 
                        className="w-full p-3 bg-gray-50 rounded-xl border border-gray-100 focus:bg-white focus:outline-none transition-all text-sm font-bold"
                        value={amount}
                        onChange={e => setAmount(e.target.value)}
                    />
                </div>
                <button 
                    onClick={handleRecordPayment}
                    className="py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-all shadow-md active:scale-95"
                >
                    {t('save')}
                </button>
            </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* 2. Staff List & Base Salary */}
            <div className="lg:col-span-1 bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden flex flex-col h-fit">
                <div className="p-4 bg-gray-50 border-b border-gray-100 font-bold text-gray-700 flex items-center gap-2">
                    <User size={18} className="text-indigo-500" />
                    {t('staffMember')}
                </div>
                <div className="divide-y divide-gray-50">
                    {staff.map(s => (
                        <div key={s.id} className="p-4 flex items-center justify-between hover:bg-gray-50/50 group">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold border-2 border-white shadow-sm">
                                    {s.name.charAt(0)}
                                </div>
                                <div>
                                    <p className="font-bold text-gray-800 text-sm">{s.name}</p>
                                    <p className="text-[10px] text-gray-500 uppercase tracking-tighter">{t(`role${s.role.charAt(0).toUpperCase() + s.role.slice(1)}` as any)}</p>
                                </div>
                            </div>
                            
                            <div className="flex items-center gap-2">
                                {editingBaseId === s.id ? (
                                    <div className="flex items-center gap-1 animate-fade-in">
                                        <input 
                                            className="w-16 p-1 bg-gray-50 border rounded text-xs font-bold focus:outline-none"
                                            type="number"
                                            value={baseSalaryInput}
                                            onChange={e => setBaseSalaryInput(e.target.value)}
                                            autoFocus
                                        />
                                        <button onClick={() => handleUpdateBaseSalary(s.id)} className="text-green-600 p-1 hover:bg-green-50 rounded-lg"><Check size={16}/></button>
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-2">
                                        <span className="font-bold text-gray-700 text-xs">{s.salary || 0}</span>
                                        <button 
                                            onClick={() => { setEditingBaseId(s.id); setBaseSalaryInput(s.salary?.toString() || ''); }}
                                            className="text-gray-300 hover:text-indigo-500 opacity-0 group-hover:opacity-100 transition-opacity"
                                        >
                                            <Plus size={14} />
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                    {staff.length === 0 && <div className="p-10 text-center text-gray-400 italic">No staff members found.</div>}
                </div>
            </div>

            {/* 3. History */}
            <div className="lg:col-span-2 bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex flex-col">
                <h3 className="font-bold text-lg text-gray-800 mb-6 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="p-2 bg-blue-100 text-blue-600 rounded-lg"><History size={20}/></div>
                        {t('paymentHistory')}
                    </div>
                </h3>
                <div className="space-y-3">
                    {history.map((record) => (
                        <div key={record.id} className="group relative flex justify-between items-center p-4 bg-gray-50 hover:bg-indigo-50/50 rounded-2xl border border-transparent hover:border-indigo-100 transition-all">
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-indigo-500 shadow-sm">
                                    <Calendar size={18} />
                                </div>
                                <div>
                                    <p className="font-bold text-gray-800">{record.staffName}</p>
                                    <p className="text-[10px] text-gray-400" dir="ltr">{formatFullDate(record.date)}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-6">
                                <div className="text-right">
                                    <p className="font-bold text-indigo-600">{record.amount} {t('currency')}</p>
                                    <span className="text-[10px] bg-green-100 text-green-700 px-2.5 py-0.5 rounded-full font-bold uppercase" dir="ltr">
                                        {formatFullDate(record.month)}
                                    </span>
                                </div>
                                <button 
                                    onClick={() => handleDeleteHistoryItem(record.id)}
                                    className="p-2 text-gray-300 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all opacity-0 group-hover:opacity-100"
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        </div>
                    ))}
                    {history.length === 0 && (
                        <div className="py-20 text-center text-gray-400">
                           <History size={40} className="mx-auto mb-3 opacity-20" />
                           <p>No payroll history found.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    </div>
  );
};

export default StaffAffairs;
