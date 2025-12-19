
import React, { useState, useEffect } from 'react';
import { 
  Search, X, Save, Plus, AlertCircle, Banknote, Building2, 
  History, User, Calendar, Settings2, Trash2, ChevronDown,
  TrendingUp, CreditCard, Receipt, Wallet, ArrowUpRight, CheckCircle
} from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { useNotification } from '../contexts/NotificationContext';
import { getUsers, getStudents, getFees, saveFees } from '../services/storageService';
import { User as UserType, Student, FeeRecord, PaymentTransaction, PaymentMethod } from '../types';

const FeesManagement: React.FC = () => {
  const { t, language } = useLanguage();
  const { addNotification } = useNotification();
  
  const [activeTab, setActiveTab] = useState<'students' | 'setup' | 'history'>('students');
  const [currentUser, setCurrentUser] = useState<UserType | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [fees, setFees] = useState<FeeRecord[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState<'payment' | 'tuition'>('payment');
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [modalError, setModalError] = useState<string | null>(null);
  
  // Form State
  const [searchTerm, setSearchTerm] = useState('');
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [method, setMethod] = useState<PaymentMethod>('Cash');
  const [forMonth, setForMonth] = useState(new Date().toISOString().slice(0, 7)); // YYYY-MM
  const [date] = useState(new Date().toISOString().split('T')[0]);

  const formatMonthYear = (monthStr: string) => {
    if (!monthStr) return '';
    const [year, month] = monthStr.split('-');
    const d = new Date(parseInt(year), parseInt(month) - 1);
    return d.toLocaleDateString(language === 'ar' ? 'ar-SA' : 'en-US', { month: 'long', year: 'numeric' });
  };

  useEffect(() => {
    const storedUid = localStorage.getItem('golden_session_uid');
    const allUsers = getUsers();
    const user = allUsers.find(u => u.id === storedUid);
    setCurrentUser(user || null);

    const allStudents = getStudents();
    const allFees = getFees();

    if (user?.role === 'parent') {
        const myChildren = allStudents.filter(s => user.linkedStudentIds?.includes(s.id) || user.linkedStudentId === s.id);
        setStudents(myChildren);
    } else {
        setStudents(allStudents);
    }
    setFees(allFees);
  }, []);

  // Stats Calculations
  const currentMonth = new Date().toISOString().slice(0, 7);
  const totalExpectedMonthly = fees.reduce((acc, f) => acc + (f.monthlyAmount || 0), 0);
  const totalCollectedThisMonth = fees.reduce((acc, f) => {
    const monthPay = f.history.filter(h => h.forMonth === currentMonth).reduce((sum, h) => sum + h.amount, 0);
    return acc + monthPay;
  }, 0);

  const handleOpenModal = (student: Student, type: 'payment' | 'tuition') => {
    setSelectedStudent(student);
    setModalType(type);
    setModalError(null);
    
    const record = fees.find(f => f.studentId === student.id);
    
    if (type === 'tuition') {
      setAmount(record?.monthlyAmount.toString() || '');
    } else {
      setAmount(record?.monthlyAmount.toString() || '0');
      setNote('');
      setForMonth(new Date().toISOString().slice(0, 7));
    }
    setIsModalOpen(true);
  };

  const handleOpenHistoryModal = (student: Student) => {
    setSelectedStudent(student);
    setIsHistoryModalOpen(true);
  };

  const handleSave = () => {
    if (!selectedStudent || !amount) return;
    const numericAmount = parseFloat(amount);
    if (isNaN(numericAmount) || numericAmount < 0) {
      setModalError(language === 'ar' ? 'يرجى إدخال مبلغ صحيح' : 'Please enter a valid amount');
      return;
    }

    let updatedFees = [...fees];
    const recordIndex = updatedFees.findIndex(f => f.studentId === selectedStudent.id);

    if (modalType === 'tuition') {
      if (recordIndex >= 0) {
        updatedFees[recordIndex] = { ...updatedFees[recordIndex], monthlyAmount: numericAmount };
      } else {
        updatedFees.push({
          id: `f-${Date.now()}`,
          studentId: selectedStudent.id,
          monthlyAmount: numericAmount,
          totalAmount: 0,
          paidAmount: 0,
          history: []
        });
      }
    } else {
      if (recordIndex >= 0) {
          const duplicate = updatedFees[recordIndex].history.some(t => t.forMonth === forMonth);
          if (duplicate) {
              setModalError(t('paymentExistsError'));
              return;
          }
      }

      const transaction: PaymentTransaction = {
        id: `tr-${Date.now()}`,
        date: date,
        amount: numericAmount,
        method: method,
        forMonth: forMonth,
        note: note,
        recordedBy: currentUser?.name || 'System'
      };

      if (recordIndex >= 0) {
        updatedFees[recordIndex] = {
          ...updatedFees[recordIndex],
          paidAmount: updatedFees[recordIndex].paidAmount + numericAmount,
          lastPaymentDate: date,
          history: [transaction, ...updatedFees[recordIndex].history]
        };
      } else {
        updatedFees.push({
          id: `f-${Date.now()}`,
          studentId: selectedStudent.id,
          monthlyAmount: 0,
          totalAmount: 0,
          paidAmount: numericAmount,
          lastPaymentDate: date,
          history: [transaction]
        });
      }
    }

    setFees(updatedFees);
    saveFees(updatedFees);
    setIsModalOpen(false);
    addNotification(t('savedSuccessfully'), t('changesSaved'), 'success');
  };

  const handleDeleteTransaction = (studentId: string, transactionId: string) => {
    if (!window.confirm(language === 'ar' ? 'هل أنت متأكد من حذف هذه العملية؟ سيتم خصم المبلغ من إجمالي المدفوع.' : 'Are you sure? The amount will be deducted from the total paid.')) return;

    const updatedFees = fees.map(f => {
      if (f.studentId === studentId) {
        const transactionToDelete = f.history.find(t => t.id === transactionId);
        if (!transactionToDelete) return f;
        
        return {
          ...f,
          paidAmount: f.paidAmount - transactionToDelete.amount,
          history: f.history.filter(t => t.id !== transactionId)
        };
      }
      return f;
    });

    setFees(updatedFees);
    saveFees(updatedFees);
    addNotification(t('delete'), t('changesSaved'), 'success');
  };

  const filteredStudents = students.filter(s => 
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    s.parentName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const allTransactions = fees.flatMap(f => {
    const student = students.find(s => s.id === f.studentId);
    return f.history.map(h => ({ 
        ...h, 
        studentId: f.studentId,
        studentName: student?.name || 'Unknown', 
        studentAvatar: student?.avatar 
    }));
  }).sort((a, b) => new Date(b.id.split('-')[1]).getTime() - new Date(a.id.split('-')[1]).getTime());

  const canManage = currentUser?.role === 'admin' || currentUser?.role === 'manager';

  return (
    <div className="space-y-6 animate-fade-in pb-24">
      
      {/* Page Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-display font-bold text-gray-800">{t('feesTitle')}</h2>
          <p className="text-gray-500 font-medium">{t('feesSubtitle')}</p>
        </div>

        <div className="flex bg-white/60 backdrop-blur-md p-1.5 rounded-2xl border border-gray-100 shadow-sm">
            <button 
                onClick={() => setActiveTab('students')} 
                className={`px-5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${activeTab === 'students' ? 'bg-indigo-600 text-white shadow-md' : 'text-gray-500 hover:text-gray-700'}`}
            >
                <User size={16} />
                {t('students')}
            </button>
            {canManage && (
                <button 
                    onClick={() => setActiveTab('setup')} 
                    className={`px-5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${activeTab === 'setup' ? 'bg-indigo-600 text-white shadow-md' : 'text-gray-500 hover:text-gray-700'}`}
                >
                    <Settings2 size={16} />
                    {language === 'ar' ? 'الرسوم' : 'Fees'}
                </button>
            )}
            <button 
                onClick={() => setActiveTab('history')} 
                className={`px-5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${activeTab === 'history' ? 'bg-indigo-600 text-white shadow-md' : 'text-gray-500 hover:text-gray-700'}`}
            >
                <History size={16} />
                {t('paymentHistory')}
            </button>
        </div>
      </div>

      {/* Stats Summary - Dashboard Style */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white p-4 rounded-3xl border border-gray-100 shadow-sm flex items-center gap-4">
              <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl"><TrendingUp size={24}/></div>
              <div>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{language === 'ar' ? 'المتوقع شهرياً' : 'Monthly Expected'}</p>
                  <p className="text-xl font-bold text-gray-800">{totalExpectedMonthly} <span className="text-xs font-normal opacity-50">{t('currency')}</span></p>
              </div>
          </div>
          <div className="bg-white p-4 rounded-3xl border border-gray-100 shadow-sm flex items-center gap-4">
              <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl"><CreditCard size={24}/></div>
              <div>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{language === 'ar' ? 'محصل هذا الشهر' : 'Collected this month'}</p>
                  <p className="text-xl font-bold text-gray-800">{totalCollectedThisMonth} <span className="text-xs font-normal opacity-50">{t('currency')}</span></p>
              </div>
          </div>
          <div className="bg-gradient-to-br from-indigo-600 to-purple-600 p-4 rounded-3xl text-white shadow-lg flex items-center gap-4">
              <div className="p-3 bg-white/20 rounded-2xl"><Wallet size={24}/></div>
              <div>
                  <p className="text-[10px] font-bold opacity-80 uppercase tracking-wider">{language === 'ar' ? 'المتبقي' : 'Outstanding'}</p>
                  <p className="text-xl font-bold">{Math.max(0, totalExpectedMonthly - totalCollectedThisMonth)} <span className="text-xs font-normal opacity-70">{t('currency')}</span></p>
              </div>
          </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white p-3 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-3">
        <Search className="text-gray-400" size={20} />
        <input 
            type="text" 
            placeholder={t('searchPlaceholder')} 
            className="flex-1 bg-transparent border-none outline-none text-sm font-medium text-gray-700" 
            value={searchTerm} 
            onChange={(e) => setSearchTerm(e.target.value)} 
        />
      </div>

      {activeTab === 'students' && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {filteredStudents.map(s => {
            const record = fees.find(f => f.studentId === s.id);
            const paidThisMonth = record?.history.filter(h => h.forMonth === currentMonth).reduce((sum, h) => sum + h.amount, 0) || 0;
            const isFullyPaid = paidThisMonth >= (record?.monthlyAmount || 0);

            return (
              <div key={s.id} className="bg-white rounded-[2.5rem] p-6 shadow-sm border border-gray-100 hover:shadow-xl transition-all group relative overflow-hidden flex flex-col">
                
                {/* Visual Status Indicator */}
                <div className={`absolute top-0 right-0 w-32 h-1 rounded-bl-full ${isFullyPaid ? 'bg-emerald-500' : paidThisMonth > 0 ? 'bg-amber-500' : 'bg-gray-100'}`}></div>

                <div className="flex items-center gap-4 mb-6">
                    <div className="relative">
                        <img src={s.avatar} className="w-16 h-16 rounded-3xl object-cover border-4 border-gray-50 shadow-sm" alt="" />
                        {isFullyPaid && (
                            <div className="absolute -top-2 -right-2 bg-emerald-500 text-white p-1 rounded-full border-4 border-white shadow-sm">
                                <CheckCircle size={14} strokeWidth={3} />
                            </div>
                        )}
                    </div>
                    <div className="min-w-0">
                        <h4 className="font-bold text-gray-800 text-lg truncate group-hover:text-indigo-600 transition-colors">{s.name}</h4>
                        <div className="flex items-center gap-2 mt-1">
                            <span className="text-[10px] font-bold bg-indigo-50 text-indigo-600 px-2.5 py-0.5 rounded-full uppercase tracking-tighter">{s.classGroup}</span>
                            <span className="text-[10px] font-bold text-gray-400">{record?.monthlyAmount || 0} {t('currency')}/mo</span>
                        </div>
                    </div>
                </div>

                <div className="flex-1 space-y-4">
                    <div className="bg-gray-50/80 rounded-3xl p-4 border border-gray-100 flex items-center justify-between">
                        <div>
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">{language === 'ar' ? 'إجمالي المدفوع' : 'Total Paid'}</p>
                            <p className="text-xl font-display font-bold text-indigo-600">{record?.paidAmount || 0} <span className="text-[10px]">{t('currency')}</span></p>
                        </div>
                        <div className="text-right">
                             <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">{formatMonthYear(currentMonth)}</p>
                             <span className={`px-3 py-1 rounded-full text-[10px] font-bold border ${isFullyPaid ? 'bg-emerald-50 border-emerald-100 text-emerald-600' : 'bg-amber-50 border-amber-100 text-amber-600'}`}>
                                {paidThisMonth} / {record?.monthlyAmount || 0}
                             </span>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-3 mt-6">
                    <button 
                        onClick={() => handleOpenHistoryModal(s)} 
                        className="flex-1 flex items-center justify-center gap-2 py-3 bg-white border border-gray-200 rounded-2xl text-xs font-bold text-gray-600 hover:bg-gray-50 hover:border-indigo-300 hover:text-indigo-600 transition-all"
                    >
                        <History size={16} />
                        {t('paymentHistory')}
                    </button>
                    {currentUser?.role !== 'parent' && (
                        <button 
                            onClick={() => handleOpenModal(s, 'payment')} 
                            className="flex-1 flex items-center justify-center gap-2 py-3 bg-slate-900 text-white rounded-2xl text-xs font-bold hover:bg-black shadow-md hover:shadow-lg transition-all active:scale-95"
                        >
                            <Plus size={16} />
                            {t('recordPayment')}
                        </button>
                    )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {activeTab === 'setup' && (
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
          <table className={`w-full ${language === 'ar' ? 'text-right' : 'text-left'}`}>
            <thead className="bg-gray-50 text-sm">
              <tr>
                <th className="px-6 py-4 font-bold text-gray-600">{t('studentName')}</th>
                <th className="px-6 py-4 font-bold text-gray-600">{t('monthlyTuition')}</th>
                <th className="px-6 py-4 font-bold text-gray-600"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filteredStudents.map(s => {
                const record = fees.find(f => f.studentId === s.id);
                return (
                  <tr key={s.id} className="hover:bg-gray-50/50 transition-colors group">
                    <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                            <img src={s.avatar} className="w-8 h-8 rounded-full" alt="" />
                            <span className="font-bold text-gray-800 text-sm">{s.name}</span>
                        </div>
                    </td>
                    <td className="px-6 py-4 font-bold text-emerald-600 text-sm">{record?.monthlyAmount || 0} {t('currency')}</td>
                    <td className="px-6 py-4 text-left flex justify-end gap-2">
                       <button onClick={() => handleOpenModal(s, 'tuition')} className="p-2 bg-gray-100 text-gray-500 rounded-xl hover:bg-indigo-50 hover:text-indigo-600 transition-all"><Settings2 size={16} /></button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'history' && (
        <div className="space-y-4">
          <h3 className="font-bold text-gray-800 px-2 flex items-center gap-2">
              <History className="text-indigo-500" size={20} />
              {t('paymentHistory')}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {allTransactions.filter(tr => tr.studentName.toLowerCase().includes(searchTerm.toLowerCase())).map(tr => (
                <div key={tr.id} className="bg-white p-4 rounded-3xl border border-gray-100 shadow-sm flex items-center justify-between group hover:shadow-md transition-all">
                    <div className="flex items-center gap-3 min-w-0">
                        <div className="relative shrink-0">
                            <img src={tr.studentAvatar} className="w-10 h-10 rounded-2xl object-cover border border-gray-100" alt="" />
                            <div className="absolute -bottom-1 -right-1 p-0.5 bg-white rounded-full border shadow-xs">
                                <Receipt size={10} className="text-indigo-500" />
                            </div>
                        </div>
                        <div className="min-w-0">
                            <p className="font-bold text-gray-800 text-sm truncate">{tr.studentName}</p>
                            <p className="text-[10px] text-gray-400 font-bold uppercase">{formatMonthYear(tr.forMonth)}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-4 shrink-0">
                        <div className="text-right">
                            <p className="font-bold text-emerald-600 text-sm">{tr.amount} {t('currency')}</p>
                            <p className="text-[9px] text-gray-400" dir="ltr">{tr.date}</p>
                        </div>
                        {canManage && (
                            <button 
                                onClick={() => handleDeleteTransaction(tr.studentId, tr.id)}
                                className="p-2 text-gray-300 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all opacity-0 group-hover:opacity-100"
                            >
                                <Trash2 size={16} />
                            </button>
                        )}
                    </div>
                </div>
            ))}
          </div>
          {allTransactions.length === 0 && (
             <div className="py-20 text-center text-gray-300 bg-white rounded-[3rem] border-2 border-dashed">
                 <Receipt size={48} className="mx-auto mb-2 opacity-20" />
                 <p className="text-sm font-medium">No transactions recorded yet.</p>
             </div>
          )}
        </div>
      )}

      {/* Payment/Tuition Modal */}
      {isModalOpen && selectedStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-md animate-fade-in border-4 border-white overflow-hidden relative">
            
            <div className="absolute top-0 right-0 p-4 z-10">
                <button onClick={() => setIsModalOpen(false)} className="bg-gray-100 text-gray-400 hover:text-rose-500 p-2 rounded-full transition-colors"><X size={20} /></button>
            </div>

            <div className="bg-indigo-50 p-8 text-center relative overflow-hidden">
                <div className="absolute top-[-50%] left-[-20%] w-48 h-48 bg-white/30 rounded-full blur-3xl"></div>
                <img src={selectedStudent.avatar} className="w-24 h-24 mx-auto rounded-3xl border-4 border-white shadow-lg object-cover mb-4 relative z-10" alt="" />
                <h3 className="text-xl font-bold text-gray-800 relative z-10">{selectedStudent.name}</h3>
                <p className="text-indigo-600 font-bold text-xs relative z-10 uppercase tracking-widest mt-1">{selectedStudent.classGroup}</p>
            </div>

            <div className="p-8 space-y-6">
              {modalError && (
                <div className="bg-rose-50 text-rose-600 p-4 rounded-2xl border border-rose-100 flex items-center gap-2 text-xs font-bold animate-shake">
                  <AlertCircle size={18} />
                  {modalError}
                </div>
              )}
              
              <div className="space-y-4">
                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1 mb-2">
                        {modalType === 'payment' ? t('amount') : (language === 'ar' ? 'المبلغ الشهري' : 'Monthly Fee')}
                    </label>
                    <div className="relative group">
                        <div className="absolute left-4 top-1/2 -translate-y-1/2 p-1.5 bg-indigo-50 text-indigo-500 rounded-lg group-focus-within:bg-indigo-600 group-focus-within:text-white transition-all">
                            <Banknote size={18} />
                        </div>
                        <input 
                            type="number" 
                            className="w-full pl-14 pr-6 py-4 bg-gray-50 border-2 border-transparent rounded-[1.5rem] focus:bg-white focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100 outline-none font-bold text-xl transition-all" 
                            value={amount} 
                            onChange={e => {setAmount(e.target.value); setModalError(null);}} 
                            placeholder="0.00"
                        />
                    </div>
                  </div>

                  {modalType === 'payment' && (
                    <div className="grid grid-cols-2 gap-4 animate-fade-in">
                      <div>
                        <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1 mb-2">{t('forMonth')}</label>
                        <div className="relative">
                            <div className="flex items-center gap-2 bg-gray-50 border border-gray-100 rounded-2xl px-4 py-3 cursor-pointer hover:bg-gray-100 transition-all">
                                <Calendar size={14} className="text-indigo-500" />
                                <span className="font-bold text-[10px] text-gray-700 whitespace-nowrap">{formatMonthYear(forMonth)}</span>
                            </div>
                            <input 
                                type="month" 
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                value={forMonth}
                                onChange={e => { setForMonth(e.target.value); setModalError(null); }}
                            />
                        </div>
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1 mb-2">{t('paymentMethod')}</label>
                        <div className="flex bg-gray-100 p-1 rounded-2xl gap-1">
                            <button onClick={() => setMethod('Cash')} className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-[10px] font-bold transition-all ${method === 'Cash' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-400'}`}>
                                <ArrowUpRight size={12}/> {t('cash')}
                            </button>
                            <button onClick={() => setMethod('Bank')} className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-[10px] font-bold transition-all ${method === 'Bank' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-400'}`}>
                                <Building2 size={12}/> {t('bank')}
                            </button>
                        </div>
                      </div>
                    </div>
                  )}
              </div>

              <button 
                onClick={handleSave} 
                className="w-full py-5 bg-slate-900 text-white rounded-[1.5rem] font-bold flex items-center justify-center gap-3 hover:bg-black transition-all shadow-xl shadow-gray-200 active:scale-95 mt-4"
              >
                <Save size={20} />
                {t('save')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* History Modal - Student Specific */}
      {isHistoryModalOpen && selectedStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-lg animate-fade-in border-4 border-white overflow-hidden max-h-[85vh] flex flex-col">
            <div className="px-8 py-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-indigo-100 text-indigo-600 rounded-xl"><History size={20} /></div>
                    <h3 className="text-lg font-bold text-gray-800">{t('paymentHistory')}</h3>
                </div>
                <button onClick={() => setIsHistoryModalOpen(false)} className="text-gray-400 hover:text-rose-500 p-2 rounded-full hover:bg-gray-100 transition-all"><X size={24} /></button>
            </div>

            <div className="p-6 bg-gradient-to-r from-indigo-50 to-white border-b border-indigo-100 flex items-center gap-4">
                <img src={selectedStudent.avatar} className="w-16 h-16 rounded-2xl border-4 border-white shadow-md object-cover" alt="" />
                <div>
                    <p className="font-bold text-indigo-900 text-lg">{selectedStudent.name}</p>
                    <p className="text-xs font-bold text-indigo-400 uppercase tracking-widest">{selectedStudent.classGroup}</p>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar bg-slate-50/30">
              {fees.find(f => f.studentId === selectedStudent.id)?.history.map(tr => (
                <div key={tr.id} className="bg-white border border-gray-100 p-5 rounded-[2rem] shadow-sm hover:shadow-md transition-all relative group">
                  <div className="flex justify-between items-start mb-3">
                      <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full flex items-center gap-1.5 border border-indigo-100 uppercase tracking-tighter">
                          <Calendar size={12} /> {formatMonthYear(tr.forMonth)}
                      </span>
                      <span className="text-lg font-display font-bold text-gray-800">{tr.amount} <span className="text-[10px] opacity-50">{t('currency')}</span></span>
                  </div>
                  <div className="flex justify-between items-end mt-2 pt-3 border-t border-gray-50">
                    <div className="space-y-1">
                      <p className="text-[10px] text-gray-400 font-bold uppercase flex items-center gap-1"><Banknote size={10} /> {tr.method === 'Cash' ? t('cash') : t('bank')}</p>
                      <p className="text-[10px] text-gray-400 font-bold uppercase flex items-center gap-1"><User size={10} /> {tr.recordedBy}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right text-[10px] text-gray-500 font-bold bg-gray-100 px-2 py-1 rounded-lg" dir="ltr">{tr.date}</div>
                      {canManage && (
                        <button 
                          onClick={() => handleDeleteTransaction(selectedStudent.id, tr.id)}
                          className="p-2 text-gray-300 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all"
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )) || (
                <div className="p-10 text-center text-gray-300 italic">
                    <Receipt size={40} className="mx-auto mb-2 opacity-20" />
                    {language === 'ar' ? 'لا يوجد سجل مدفوعات' : 'No history found'}
                </div>
              )}
            </div>

            <div className="p-6 bg-gray-50 border-t border-gray-100">
                <button onClick={() => setIsHistoryModalOpen(false)} className="w-full py-4 bg-white border-2 border-gray-200 rounded-2xl font-bold text-gray-600 hover:bg-gray-100 transition-all shadow-sm">
                    {t('close')}
                </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FeesManagement;
