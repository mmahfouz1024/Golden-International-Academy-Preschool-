
import React, { useState, useEffect } from 'react';
import { 
  Search, X, Save, Plus, AlertCircle, Banknote, Building2, 
  History, User, Calendar, Settings2, Trash2,
  TrendingUp, CreditCard, Receipt, Wallet, ArrowUpRight, CheckCircle, Edit3
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
    <div className="space-y-4 animate-fade-in pb-24">
      
      {/* Page Header - More Compact */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
        <div>
          <h2 className="text-2xl font-display font-bold text-gray-800">{t('feesTitle')}</h2>
          <p className="text-xs text-gray-500 font-medium">{t('feesSubtitle')}</p>
        </div>

        <div className="flex bg-white/60 backdrop-blur-md p-1 rounded-xl border border-gray-100 shadow-sm">
            <button 
                onClick={() => setActiveTab('students')} 
                className={`px-4 py-1.5 rounded-lg text-[11px] font-bold transition-all flex items-center gap-1.5 ${activeTab === 'students' ? 'bg-indigo-600 text-white shadow-md' : 'text-gray-500 hover:text-gray-700'}`}
            >
                <User size={14} />
                {t('students')}
            </button>
            {canManage && (
                <button 
                    onClick={() => setActiveTab('setup')} 
                    className={`px-4 py-1.5 rounded-lg text-[11px] font-bold transition-all flex items-center gap-1.5 ${activeTab === 'setup' ? 'bg-indigo-600 text-white shadow-md' : 'text-gray-500 hover:text-gray-700'}`}
                >
                    <Settings2 size={14} />
                    {language === 'ar' ? 'الرسوم' : 'Fees'}
                </button>
            )}
            <button 
                onClick={() => setActiveTab('history')} 
                className={`px-4 py-1.5 rounded-lg text-[11px] font-bold transition-all flex items-center gap-1.5 ${activeTab === 'history' ? 'bg-indigo-600 text-white shadow-md' : 'text-gray-500 hover:text-gray-700'}`}
            >
                <History size={14} />
                {t('paymentHistory')}
            </button>
        </div>
      </div>

      {/* Stats Summary - More Compact */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <div className="bg-white p-3 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-3">
              <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl"><TrendingUp size={18}/></div>
              <div>
                  <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">{language === 'ar' ? 'المتوقع شهرياً' : 'Monthly Expected'}</p>
                  <p className="text-sm font-bold text-gray-800">{totalExpectedMonthly} <span className="text-[10px] font-normal opacity-50">{t('currency')}</span></p>
              </div>
          </div>
          <div className="bg-white p-3 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-3">
              <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl"><CreditCard size={18}/></div>
              <div>
                  <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">{language === 'ar' ? 'محصل هذا الشهر' : 'Collected'}</p>
                  <p className="text-sm font-bold text-gray-800">{totalCollectedThisMonth} <span className="text-[10px] font-normal opacity-50">{t('currency')}</span></p>
              </div>
          </div>
          <div className="col-span-2 sm:col-span-1 bg-gradient-to-br from-indigo-600 to-purple-600 p-3 rounded-2xl text-white shadow-md flex items-center gap-3">
              <div className="p-2 bg-white/20 rounded-xl"><Wallet size={18}/></div>
              <div>
                  <p className="text-[9px] font-bold opacity-80 uppercase tracking-wider">{language === 'ar' ? 'المتبقي' : 'Outstanding'}</p>
                  <p className="text-sm font-bold">{Math.max(0, totalExpectedMonthly - totalCollectedThisMonth)} <span className="text-[10px] font-normal opacity-70">{t('currency')}</span></p>
              </div>
          </div>
      </div>

      {/* Search Bar - Slimmer */}
      <div className="bg-white p-2.5 rounded-xl shadow-sm border border-gray-100 flex items-center gap-3">
        <Search className="text-gray-400" size={16} />
        <input 
            type="text" 
            placeholder={t('searchPlaceholder')} 
            className="flex-1 bg-transparent border-none outline-none text-xs font-medium text-gray-700" 
            value={searchTerm} 
            onChange={(e) => setSearchTerm(e.target.value)} 
        />
      </div>

      {activeTab === 'students' && (
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
          {filteredStudents.map(s => {
            const record = fees.find(f => f.studentId === s.id);
            const paidThisMonth = record?.history.filter(h => h.forMonth === currentMonth).reduce((sum, h) => sum + h.amount, 0) || 0;
            const isFullyPaid = paidThisMonth >= (record?.monthlyAmount || 0);

            return (
              <div key={s.id} className="bg-white rounded-3xl p-4 shadow-sm border border-gray-100 hover:shadow-lg transition-all group relative overflow-hidden flex flex-col">
                
                {/* Visual Status Indicator */}
                <div className={`absolute top-0 right-0 w-16 h-0.5 ${isFullyPaid ? 'bg-emerald-500' : paidThisMonth > 0 ? 'bg-amber-500' : 'bg-gray-100'}`}></div>

                <div className="flex flex-col items-center text-center mb-4">
                    <div className="relative mb-2">
                        <img src={s.avatar} className="w-12 h-12 rounded-2xl object-cover border-2 border-gray-50 shadow-sm" alt="" />
                        {isFullyPaid && (
                            <div className="absolute -top-1.5 -right-1.5 bg-emerald-500 text-white p-0.5 rounded-full border-2 border-white shadow-sm">
                                <CheckCircle size={10} strokeWidth={3} />
                            </div>
                        )}
                    </div>
                    <div className="min-w-0 px-1">
                        <h4 className="font-bold text-gray-800 text-xs truncate group-hover:text-indigo-600 transition-colors">{s.name}</h4>
                        <div className="flex items-center justify-center gap-1 mt-1">
                            <span className="text-[8px] font-bold bg-indigo-50 text-indigo-600 px-1.5 py-0.5 rounded-md uppercase tracking-tighter">{s.classGroup}</span>
                            <span className="text-[8px] font-bold text-gray-400">{record?.monthlyAmount || 0} {t('currency')}</span>
                        </div>
                    </div>
                </div>

                <div className="flex-1 space-y-2">
                    <div className="bg-gray-50/80 rounded-2xl p-2.5 border border-gray-100 text-center">
                         <p className="text-[8px] font-bold text-gray-400 uppercase tracking-widest mb-1">{formatMonthYear(currentMonth)}</p>
                         <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold border inline-block ${isFullyPaid ? 'bg-emerald-50 border-emerald-100 text-emerald-600' : 'bg-amber-50 border-amber-100 text-amber-600'}`}>
                            {paidThisMonth} / {record?.monthlyAmount || 0}
                         </span>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-2 mt-4">
                    <button 
                        onClick={() => handleOpenHistoryModal(s)} 
                        className="flex items-center justify-center p-2 bg-white border border-gray-200 rounded-xl text-gray-400 hover:bg-gray-50 hover:text-indigo-600 transition-all"
                        title={t('paymentHistory')}
                    >
                        <History size={14} />
                    </button>
                    {currentUser?.role !== 'parent' && (
                        <button 
                            onClick={() => handleOpenModal(s, 'payment')} 
                            className="flex items-center justify-center p-2 bg-slate-900 text-white rounded-xl text-[10px] font-bold hover:bg-black shadow-sm active:scale-95 flex-1"
                        >
                            <Plus size={12} className="mr-1" />
                            {t('add')}
                        </button>
                    )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {activeTab === 'setup' && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <table className={`w-full ${language === 'ar' ? 'text-right' : 'text-left'}`}>
            <thead className="bg-gray-50 text-xs">
              <tr>
                <th className="px-6 py-3 font-bold text-gray-600">{t('studentName')}</th>
                <th className="px-6 py-3 font-bold text-gray-600">{t('monthlyTuition')}</th>
                <th className="px-6 py-3 font-bold text-gray-600"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filteredStudents.map(s => {
                const record = fees.find(f => f.studentId === s.id);
                return (
                  <tr key={s.id} className="hover:bg-gray-50/50 transition-colors group">
                    <td className="px-6 py-3">
                        <div className="flex items-center gap-2">
                            <img src={s.avatar} className="w-6 h-6 rounded-full" alt="" />
                            <span className="font-bold text-gray-800 text-xs">{s.name}</span>
                        </div>
                    </td>
                    <td className="px-6 py-3 font-bold text-emerald-600 text-xs">{record?.monthlyAmount || 0} {t('currency')}</td>
                    <td className="px-6 py-3 text-left flex justify-end gap-2">
                       <button onClick={() => handleOpenModal(s, 'tuition')} className="p-1.5 bg-gray-100 text-gray-500 rounded-lg hover:bg-indigo-50 hover:text-indigo-600 transition-all"><Settings2 size={14} /></button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'history' && (
        <div className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {allTransactions.filter(tr => tr.studentName.toLowerCase().includes(searchTerm.toLowerCase())).map(tr => (
                <div key={tr.id} className="bg-white p-3 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between group hover:shadow-md transition-all">
                    <div className="flex items-center gap-3 min-w-0">
                        <img src={tr.studentAvatar} className="w-8 h-8 rounded-xl object-cover border border-gray-100 shrink-0" alt="" />
                        <div className="min-w-0">
                            <p className="font-bold text-gray-800 text-[11px] truncate">{tr.studentName}</p>
                            <p className="text-[9px] text-gray-400 font-bold uppercase">{formatMonthYear(tr.forMonth)}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                        <div className="text-right">
                            <p className="font-bold text-emerald-600 text-[11px]">{tr.amount} {t('currency')}</p>
                            <p className="text-[8px] text-gray-400 font-mono" dir="ltr">{tr.date}</p>
                        </div>
                        {canManage && (
                            <button 
                                onClick={() => handleDeleteTransaction(tr.studentId, tr.id)}
                                className="p-1.5 text-gray-300 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                            >
                                <Trash2 size={14} />
                            </button>
                        )}
                    </div>
                </div>
            ))}
          </div>
          {allTransactions.length === 0 && (
             <div className="py-16 text-center text-gray-300 bg-white rounded-3xl border-2 border-dashed">
                 <Receipt size={40} className="mx-auto mb-2 opacity-20" />
                 <p className="text-xs font-medium">No transactions found.</p>
             </div>
          )}
        </div>
      )}

      {/* Payment/Tuition Modal - UPDATED TO ALLOW EDITING */}
      {isModalOpen && selectedStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-md animate-fade-in border-4 border-white overflow-hidden relative">
            
            <div className="absolute top-0 right-0 p-4 z-10">
                <button onClick={() => setIsModalOpen(false)} className="bg-gray-100 text-gray-400 hover:text-rose-500 p-1.5 rounded-full transition-colors"><X size={18} /></button>
            </div>

            <div className="bg-indigo-50 p-6 text-center relative overflow-hidden">
                <div className="absolute top-[-50%] left-[-20%] w-48 h-48 bg-white/30 rounded-full blur-3xl"></div>
                <img src={selectedStudent.avatar} className="w-16 h-16 mx-auto rounded-2xl border-4 border-white shadow-lg object-cover mb-3 relative z-10" alt="" />
                <h3 className="text-lg font-bold text-gray-800 relative z-10">{selectedStudent.name}</h3>
                <p className="text-indigo-600 font-bold text-[10px] relative z-10 uppercase tracking-widest mt-0.5">{selectedStudent.classGroup}</p>
            </div>

            <div className="p-6 space-y-5">
              {modalError && (
                <div className="bg-rose-50 text-rose-600 p-3 rounded-xl border border-rose-100 flex items-center gap-2 text-xs font-bold animate-shake">
                  <AlertCircle size={16} />
                  {modalError}
                </div>
              )}
              
              <div className="space-y-4">
                  <div>
                    <label className="block text-[9px] font-bold text-gray-400 uppercase tracking-widest ml-1 mb-1.5">
                        {modalType === 'payment' ? t('amount') : (language === 'ar' ? 'المبلغ الشهري' : 'Monthly Fee')}
                    </label>
                    <div className="relative group">
                        <div className="absolute left-4 top-1/2 -translate-y-1/2 p-1.5 bg-indigo-50 text-indigo-500 rounded-lg group-focus-within:bg-indigo-600 group-focus-within:text-white transition-all">
                            <Banknote size={16} />
                        </div>
                        <input 
                            type="number" 
                            className="w-full pl-12 pr-4 py-3.5 bg-gray-50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100 outline-none font-bold text-lg transition-all" 
                            value={amount} 
                            onChange={e => {setAmount(e.target.value); setModalError(null);}} 
                            placeholder="0.00"
                        />
                    </div>
                    {modalType === 'payment' && (
                         <p className="text-[8px] text-gray-400 mt-2 ml-1 flex items-center gap-1">
                             <Edit3 size={8} /> {language === 'ar' ? 'يمكنك تعديل المبلغ إذا كانت الدفعة جزئية' : 'You can edit the amount for partial payments'}
                         </p>
                    )}
                  </div>

                  {modalType === 'payment' && (
                    <div className="grid grid-cols-2 gap-3 animate-fade-in">
                      <div>
                        <label className="block text-[9px] font-bold text-gray-400 uppercase tracking-widest ml-1 mb-1.5">{t('forMonth')}</label>
                        <div className="relative">
                            <div className="flex items-center gap-2 bg-gray-50 border border-gray-100 rounded-xl px-3 py-2.5 cursor-pointer hover:bg-gray-100 transition-all">
                                <Calendar size={12} className="text-indigo-500" />
                                <span className="font-bold text-[9px] text-gray-700 whitespace-nowrap">{formatMonthYear(forMonth)}</span>
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
                        <label className="block text-[9px] font-bold text-gray-400 uppercase tracking-widest ml-1 mb-1.5">{t('paymentMethod')}</label>
                        <div className="flex bg-gray-100 p-0.5 rounded-xl gap-0.5">
                            <button onClick={() => setMethod('Cash')} className={`flex-1 flex items-center justify-center gap-1 py-2 rounded-lg text-[9px] font-bold transition-all ${method === 'Cash' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-400'}`}>
                                <ArrowUpRight size={10}/> {t('cash')}
                            </button>
                            <button onClick={() => setMethod('Bank')} className={`flex-1 flex items-center justify-center gap-1 py-2 rounded-lg text-[9px] font-bold transition-all ${method === 'Bank' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-400'}`}>
                                <Building2 size={10}/> {t('bank')}
                            </button>
                        </div>
                      </div>
                    </div>
                  )}
              </div>

              <button 
                onClick={handleSave} 
                className="w-full py-4 bg-slate-900 text-white rounded-2xl font-bold flex items-center justify-center gap-3 hover:bg-black transition-all shadow-lg active:scale-95"
              >
                <Save size={18} />
                {t('save')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* History Modal - Compact */}
      {isHistoryModalOpen && selectedStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-md animate-fade-in border-4 border-white overflow-hidden max-h-[80vh] flex flex-col">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-indigo-100 text-indigo-600 rounded-lg"><History size={16} /></div>
                    <h3 className="text-base font-bold text-gray-800">{t('paymentHistory')}</h3>
                </div>
                <button onClick={() => setIsHistoryModalOpen(false)} className="text-gray-400 hover:text-rose-500 p-1 rounded-full hover:bg-gray-100 transition-all"><X size={20} /></button>
            </div>

            <div className="p-4 bg-gradient-to-r from-indigo-50 to-white border-b border-indigo-100 flex items-center gap-3">
                <img src={selectedStudent.avatar} className="w-10 h-10 rounded-xl border-2 border-white shadow-sm object-cover" alt="" />
                <div>
                    <p className="font-bold text-indigo-900 text-sm">{selectedStudent.name}</p>
                    <p className="text-[9px] font-bold text-indigo-400 uppercase tracking-widest">{selectedStudent.classGroup}</p>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar bg-slate-50/30">
              {fees.find(f => f.studentId === selectedStudent.id)?.history.map(tr => (
                <div key={tr.id} className="bg-white border border-gray-100 p-3.5 rounded-2xl shadow-sm hover:shadow-md transition-all relative group">
                  <div className="flex justify-between items-start mb-2">
                      <span className="text-[9px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md flex items-center gap-1 border border-indigo-100 uppercase">
                          <Calendar size={10} /> {formatMonthYear(tr.forMonth)}
                      </span>
                      <span className="text-sm font-bold text-gray-800">{tr.amount} <span className="text-[9px] opacity-50">{t('currency')}</span></span>
                  </div>
                  <div className="flex justify-between items-end mt-1 pt-2 border-t border-gray-50">
                    <div className="space-y-0.5">
                      <p className="text-[8px] text-gray-400 font-bold uppercase flex items-center gap-1"><Banknote size={8} /> {tr.method === 'Cash' ? t('cash') : t('bank')}</p>
                      <p className="text-[8px] text-gray-400 font-bold uppercase flex items-center gap-1"><User size={8} /> {tr.recordedBy}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="text-[8px] text-gray-500 font-bold bg-gray-100 px-1.5 py-0.5 rounded-md" dir="ltr">{tr.date}</div>
                      {canManage && (
                        <button 
                          onClick={() => handleDeleteTransaction(selectedStudent.id, tr.id)}
                          className="p-1 text-gray-300 hover:text-rose-500 transition-all"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )) || (
                <div className="p-8 text-center text-gray-300 italic">
                    <Receipt size={32} className="mx-auto mb-2 opacity-20" />
                    <p className="text-xs">No records found</p>
                </div>
              )}
            </div>

            <div className="p-4 bg-gray-50 border-t border-gray-100">
                <button onClick={() => setIsHistoryModalOpen(false)} className="w-full py-2.5 bg-white border border-gray-200 rounded-xl font-bold text-xs text-gray-500 hover:bg-gray-100 transition-all">
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
