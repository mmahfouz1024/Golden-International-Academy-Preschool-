
import React, { useState, useEffect } from 'react';
import { 
  DollarSign, Plus, History, Check, Trash2, Calendar, 
  UserCog, AlertCircle, ShieldAlert, 
  Wallet, Settings2, X, Users, TrendingUp, Search,
  ArrowUpRight, CreditCard, Lock
} from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { getUsers, saveUsers, getPayroll, savePayroll } from '../services/storageService';
import { User as UserType, StaffSalary } from '../types';

const StaffAffairs: React.FC = () => {
  const { t, language } = useLanguage();
  const [activeTab, setActiveTab] = useState<'payroll' | 'base-salary'>('payroll');
  const [staff, setStaff] = useState<UserType[]>([]);
  const [history, setHistory] = useState<StaffSalary[]>([]);
  const [currentUser, setCurrentUser] = useState<UserType | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Payment Form
  const [selectedStaffId, setSelectedStaffId] = useState('');
  const [amount, setAmount] = useState('');
  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7)); // YYYY-MM

  // Edit Base Salary
  const [editingBaseId, setEditingBaseId] = useState<string | null>(null);
  const [baseSalaryInput, setBaseSalaryInput] = useState('');

  // Formatter for YYYY-MM to Readable Month Year
  const formatMonthYear = (monthStr: string) => {
    if (!monthStr) return '';
    const [year, monthPart] = monthStr.split('-');
    const d = new Date(parseInt(year), parseInt(monthPart) - 1);
    return d.toLocaleDateString(language === 'ar' ? 'ar-SA' : 'en-US', { month: 'long', year: 'numeric' });
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
      setFormError(null);
      if (!selectedStaffId || !amount) return;
      const staffMember = staff.find(s => s.id === selectedStaffId);
      if (!staffMember) return;

      const alreadyPaid = history.some(r => r.staffId === selectedStaffId && r.month === month);
      if (alreadyPaid) {
          setFormError(t('salaryExistsError'));
          return;
      }

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
      setSelectedStaffId('');
  };

  const handleUpdateBaseSalary = (id: string) => {
      const allUsers = getUsers();
      const updatedUsers = allUsers.map(u => {
          if (u.id === id) {
              return { ...u, salary: parseFloat(baseSalaryInput) || 0 };
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
          <div className="p-20 text-center bg-white rounded-3xl border border-gray-100 shadow-sm">
              <ShieldAlert size={64} className="mx-auto mb-4 text-rose-200" />
              <h2 className="text-xl font-bold text-gray-800">{t('contactAdmin')}</h2>
              <p className="text-gray-400 text-sm mt-2">Access restricted to school management.</p>
          </div>
      );
  }

  // Calculate Stats
  const totalMonthlyBase = staff.reduce((acc, s) => acc + (s.salary || 0), 0);
  const currentMonthPaid = history.filter(h => h.month === month).reduce((acc, h) => acc + h.amount, 0);

  const filteredStaff = staff.filter(s => s.name.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div className="space-y-5 animate-fade-in pb-20 max-w-7xl mx-auto">
        
        {/* Header Section - Compact */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
            <div>
                <h2 className="text-2xl font-display font-bold text-gray-800">{t('staffAffairs')}</h2>
                <p className="text-xs text-gray-500 font-medium">{t('hrSubtitle')}</p>
            </div>

            <div className="flex bg-gray-100 p-1 rounded-xl shadow-inner w-full md:w-auto">
                <button 
                    onClick={() => setActiveTab('payroll')}
                    className={`flex-1 md:flex-none px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                        activeTab === 'payroll' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                    }`}
                >
                    <Wallet size={16} />
                    {t('recordSalaryTab' as any)}
                </button>
                <button 
                    onClick={() => setActiveTab('base-salary')}
                    className={`flex-1 md:flex-none px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                        activeTab === 'base-salary' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                    }`}
                >
                    <Settings2 size={16} />
                    {t('baseSalaryTab' as any)}
                </button>
            </div>
        </div>

        {/* Stats Overview Bar - Smaller */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
             <div className="bg-white p-3 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-3">
                 <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl"><Users size={18}/></div>
                 <div>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">{t('statsTeachers')}</p>
                    <p className="text-lg font-bold text-gray-800">{staff.length}</p>
                 </div>
             </div>
             <div className="bg-white p-3 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-3">
                 <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl"><TrendingUp size={18}/></div>
                 <div>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">Monthly Est.</p>
                    <p className="text-lg font-bold text-gray-800">{totalMonthlyBase} <span className="text-[10px] font-normal">{t('currency')}</span></p>
                 </div>
             </div>
             <div className="col-span-2 md:col-span-1 bg-gradient-to-br from-indigo-600 to-purple-600 p-3 rounded-2xl text-white shadow-md flex items-center gap-3">
                 <div className="p-2 bg-white/20 rounded-xl"><DollarSign size={18}/></div>
                 <div>
                    <p className="text-[10px] font-bold opacity-80 uppercase tracking-tight">Paid this Month</p>
                    <p className="text-lg font-bold">{currentMonthPaid} <span className="text-[10px] font-normal">{t('currency')}</span></p>
                 </div>
             </div>
        </div>

        {activeTab === 'payroll' ? (
            <div className="space-y-6">
                {/* Record New Payment Form */}
                <div className="bg-white p-5 rounded-[2rem] shadow-sm border border-gray-100 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-2.5 bg-indigo-50 rounded-bl-2xl">
                        <ArrowUpRight size={16} className="text-indigo-400" />
                    </div>

                    <h3 className="font-bold text-base text-gray-800 mb-4 flex items-center gap-2">
                        <CreditCard className="text-indigo-500" size={20} />
                        {t('recordSalary')}
                    </h3>

                    {formError && (
                        <div className="mb-4 bg-rose-50 text-rose-600 p-3 rounded-xl border border-rose-100 flex items-center gap-2 text-xs font-bold animate-shake">
                            <AlertCircle size={16} />
                            {formError}
                        </div>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 items-end">
                        <div className="space-y-1">
                            <label className="block text-[10px] font-bold text-gray-400 uppercase ml-1">{t('staffMember')}</label>
                            <select 
                                className="w-full p-2.5 bg-gray-50 rounded-xl border border-gray-100 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all text-sm font-bold"
                                value={selectedStaffId}
                                onChange={e => {
                                    setSelectedStaffId(e.target.value);
                                    setFormError(null);
                                    const s = staff.find(u => u.id === e.target.value);
                                    if (s && s.salary) setAmount(s.salary.toString());
                                    else setAmount('0');
                                }}
                            >
                                <option value="">{t('selectOption')}</option>
                                {staff.map(s => (
                                    <option key={s.id} value={s.id}>{s.name}</option>
                                ))}
                            </select>
                        </div>
                        <div className="space-y-1">
                            <label className="block text-[10px] font-bold text-gray-400 uppercase ml-1">{t('paymentMonth')}</label>
                            <div className="relative">
                                <div className="flex items-center gap-2 bg-gray-50 border border-gray-100 rounded-xl px-3 py-2.5 cursor-pointer hover:bg-gray-100 transition-all">
                                    <Calendar size={14} className="text-indigo-500" />
                                    <span className="font-bold text-xs text-gray-700">{formatMonthYear(month)}</span>
                                </div>
                                <input 
                                    type="month" 
                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                    value={month}
                                    onChange={e => { setMonth(e.target.value); setFormError(null); }}
                                />
                            </div>
                        </div>
                        <div className="space-y-1">
                            <label className="block text-[10px] font-bold text-gray-400 uppercase ml-1 flex items-center gap-1">
                                {t('salaryAmount')}
                                <Lock size={10} className="text-gray-300" />
                            </label>
                            <div className="relative group">
                                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                                <input 
                                    type="text" 
                                    readOnly
                                    className="w-full pl-8 pr-3 py-2.5 bg-gray-100 border border-gray-200 rounded-xl text-sm font-bold text-indigo-700 cursor-not-allowed select-none focus:outline-none"
                                    value={amount}
                                    dir="ltr"
                                    style={{ fontVariantNumeric: 'tabular-nums' }}
                                />
                            </div>
                        </div>
                        <button 
                            onClick={handleRecordPayment}
                            className="py-2.5 bg-slate-900 text-white rounded-xl font-bold hover:bg-black transition-all shadow-md active:scale-95 flex items-center justify-center gap-2 text-sm"
                        >
                            <Check size={16} />
                            {t('save')}
                        </button>
                    </div>
                </div>

                {/* Payroll History - List */}
                <div className="space-y-3">
                    <h3 className="font-bold text-gray-800 flex items-center gap-2 px-2 text-sm">
                        <History className="text-gray-400" size={18} />
                        {t('paymentHistory')}
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {history.map((record) => (
                            <div key={record.id} className="bg-white p-3 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all group flex items-center justify-between">
                                <div className="flex items-center gap-3 min-w-0">
                                    <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold shrink-0">
                                        {record.staffName.charAt(0)}
                                    </div>
                                    <div className="min-w-0">
                                        <p className="font-bold text-gray-800 text-sm truncate">{record.staffName}</p>
                                        <p className="text-[9px] text-gray-400 font-bold uppercase flex items-center gap-1">
                                            <Calendar size={8}/> {record.date}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4 shrink-0">
                                    <div className="text-right">
                                        <p className="font-bold text-indigo-600 text-sm">{record.amount} <span className="text-[9px]">{t('currency')}</span></p>
                                        <span className="text-[9px] bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-bold" dir="ltr">
                                            {formatMonthYear(record.month)}
                                        </span>
                                    </div>
                                    <button 
                                        onClick={() => handleDeleteHistoryItem(record.id)}
                                        className="p-1.5 text-gray-300 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                    {history.length === 0 && (
                        <div className="py-12 text-center text-gray-300">
                           <History size={32} className="mx-auto mb-2 opacity-20" />
                           <p className="text-xs font-medium">No payroll records yet.</p>
                        </div>
                    )}
                </div>
            </div>
        ) : (
            /* Redesigned Base Salary Management (COMPACT CARD GRID) */
            <div className="space-y-4 animate-fade-in">
                <div className="bg-white p-3 rounded-xl border border-gray-100 shadow-sm flex items-center gap-2">
                    <Search className="text-gray-400" size={18} />
                    <input 
                        type="text"
                        placeholder={t('searchPlaceholder')}
                        className="flex-1 bg-transparent border-none outline-none text-xs font-medium"
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                    />
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                    {filteredStaff.map(s => (
                        <div key={s.id} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 hover:shadow-lg transition-all group relative overflow-hidden flex flex-col">
                            
                            {/* Decorative Background Icon - Smaller */}
                            <div className="absolute -bottom-2 -right-2 opacity-5 pointer-events-none group-hover:scale-110 transition-transform">
                                <DollarSign size={60} />
                            </div>

                            <div className="flex flex-col items-center text-center mb-3">
                                <div className="relative">
                                    <img src={s.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(s.name)}&background=random`} alt={s.name} className="w-14 h-14 rounded-2xl object-cover border-2 border-white shadow-sm" />
                                    <div className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-lg border-2 border-white flex items-center justify-center ${s.role === 'teacher' ? 'bg-blue-500' : 'bg-orange-500'} text-white shadow-sm`}>
                                        <UserCog size={10}/>
                                    </div>
                                </div>
                                <h4 className="mt-2 font-bold text-gray-800 text-xs line-clamp-1">{s.name}</h4>
                                <span className="text-[9px] font-bold text-gray-400 uppercase tracking-tighter">
                                    {t(`role${s.role.charAt(0).toUpperCase() + s.role.slice(1)}` as any)}
                                </span>
                            </div>

                            <div className="bg-gray-50/80 rounded-xl p-2.5 flex flex-col items-center gap-0.5 border border-gray-100 mt-auto relative z-10">
                                {editingBaseId === s.id ? (
                                    <div className="flex items-center gap-1.5 w-full animate-fade-in">
                                        <input 
                                            className="flex-1 w-full p-1.5 bg-white rounded-lg border border-indigo-200 text-xs font-bold focus:ring-2 focus:ring-indigo-500/20 outline-none"
                                            type="number"
                                            value={baseSalaryInput}
                                            onChange={e => setBaseSalaryInput(e.target.value)}
                                            autoFocus
                                        />
                                        <button onClick={() => handleUpdateBaseSalary(s.id)} className="p-1.5 bg-green-500 text-white rounded-lg hover:bg-green-600"><Check size={14}/></button>
                                        <button onClick={() => setEditingBaseId(null)} className="p-1.5 bg-white text-gray-400 rounded-lg hover:bg-gray-100"><X size={14}/></button>
                                    </div>
                                ) : (
                                    <>
                                        <p className="text-[8px] font-bold text-gray-400 uppercase leading-none">{t('baseSalary')}</p>
                                        <div className="flex items-baseline gap-0.5">
                                            <span className="text-xl font-display font-bold text-indigo-600">{s.salary || 0}</span>
                                            <span className="text-[8px] font-bold text-indigo-400 uppercase">{t('currency')}</span>
                                        </div>
                                        <button 
                                            onClick={() => { setEditingBaseId(s.id); setBaseSalaryInput(s.salary?.toString() || ''); }}
                                            className="mt-1 text-[9px] font-bold text-indigo-500 hover:text-indigo-700 flex items-center gap-1 transition-colors"
                                        >
                                            <Plus size={10} /> {t('edit')}
                                        </button>
                                    </>
                                )}
                            </div>
                        </div>
                    ))}
                    
                    {filteredStaff.length === 0 && (
                        <div className="col-span-full py-16 text-center text-gray-300">
                             <Search size={32} className="mx-auto mb-2 opacity-20" />
                             <p className="text-xs">No staff found matching search.</p>
                        </div>
                    )}
                </div>
            </div>
        )}
    </div>
  );
};

export default StaffAffairs;
