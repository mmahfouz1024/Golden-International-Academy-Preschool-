
import React, { useState, useEffect } from 'react';
import { Search, X, Save, Plus, AlertCircle, Banknote, Building2, History, User, Calendar, Settings2, Trash2, ChevronDown } from 'lucide-react';
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
  const [forMonth, setForMonth] = useState(new Date().toISOString().split('T')[0]); // YYYY-MM-DD
  const [date] = useState(new Date().toISOString().split('T')[0]);

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
      setForMonth(new Date().toISOString().split('T')[0]);
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
    if (isNaN(numericAmount)) return;

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
      // Check for duplicate forMonth in history to avoid duplicate entries for the same day
      if (recordIndex >= 0) {
        const duplicate = updatedFees[recordIndex].history.some(t => t.forMonth === forMonth);
        if (duplicate) {
          setModalError(t('paymentExistsError'));
          return;
        }
      }

      // In payment mode
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
    if (!window.confirm(language === 'ar' ? 'هل أنت متأكد من حذف هذه العملية؟' : 'Are you sure you want to delete this transaction?')) return;

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
    <div className="space-y-6 animate-fade-in pb-20">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">{t('feesTitle')}</h2>
          <p className="text-gray-500">{t('feesSubtitle')}</p>
        </div>
      </div>

      <div className="flex bg-gray-100 p-1 rounded-2xl w-fit">
        <button onClick={() => setActiveTab('students')} className={`px-6 py-2 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${activeTab === 'students' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500'}`}><User size={16} />{t('students')}</button>
        {canManage && (
          <button onClick={() => setActiveTab('setup')} className={`px-6 py-2 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${activeTab === 'setup' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500'}`}><Settings2 size={16} />{language === 'ar' ? 'إعداد الرسوم' : 'Setup Fees'}</button>
        )}
        <button onClick={() => setActiveTab('history')} className={`px-6 py-2 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${activeTab === 'history' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500'}`}><History size={16} />{t('paymentHistory')}</button>
      </div>

      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
        <div className="relative max-w-md">
          <Search className={`absolute ${language === 'ar' ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2 text-gray-400`} size={20} />
          <input type="text" placeholder={t('searchPlaceholder')} className={`w-full ${language === 'ar' ? 'pl-4 pr-10' : 'pr-4 pl-10'} py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-sm`} value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
        </div>
      </div>

      {activeTab === 'students' && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <table className={`w-full ${language === 'ar' ? 'text-right' : 'text-left'}`}>
            <thead className="bg-gray-50 text-sm">
              <tr>
                <th className="px-6 py-4 font-semibold text-gray-600">{t('studentName')}</th>
                <th className="px-6 py-4 font-semibold text-gray-600">{t('paidAmount')}</th>
                <th className="px-6 py-4 font-semibold text-gray-600"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filteredStudents.map(s => {
                const record = fees.find(f => f.studentId === s.id);
                return (
                  <tr key={s.id} className="hover:bg-gray-50/50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <img src={s.avatar} className="w-10 h-10 rounded-full border" alt="" />
                        <div><p className="font-bold text-gray-900 text-sm">{s.name}</p><p className="text-[10px] text-gray-500 uppercase">{s.classGroup}</p></div>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-bold text-indigo-600 text-sm">{record?.paidAmount || 0} {t('currency')}</td>
                    <td className="px-6 py-4 text-left flex gap-2 justify-end">
                      <button onClick={() => handleOpenHistoryModal(s)} className="p-2 bg-indigo-50 text-indigo-600 rounded-xl transition-all hover:scale-105 active:scale-95"><History size={16} /></button>
                      {currentUser?.role !== 'parent' && (
                        <button onClick={() => handleOpenModal(s, 'payment')} className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700 shadow-sm transition-all active:scale-95"><Plus size={14} />{t('recordPayment')}</button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'setup' && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <table className={`w-full ${language === 'ar' ? 'text-right' : 'text-left'}`}>
            <thead className="bg-gray-50 text-sm">
              <tr>
                <th className="px-6 py-4 font-semibold text-gray-600">{t('studentName')}</th>
                <th className="px-6 py-4 font-semibold text-gray-600">{t('monthlyTuition')}</th>
                <th className="px-6 py-4 font-semibold text-gray-600"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filteredStudents.map(s => {
                const record = fees.find(f => f.studentId === s.id);
                return (
                  <tr key={s.id} className="hover:bg-gray-50/50 transition-colors group">
                    <td className="px-6 py-4 font-bold text-gray-800 text-sm">{s.name}</td>
                    <td className="px-6 py-4 font-bold text-emerald-600 text-sm">{record?.monthlyAmount || 0} {t('currency')}</td>
                    <td className="px-6 py-4 text-left flex justify-end gap-2">
                       <button onClick={() => handleOpenModal(s, 'tuition')} className="p-2 bg-gray-100 text-gray-500 rounded-lg hover:bg-indigo-50 hover:text-indigo-600 transition-all"><Settings2 size={16} /></button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'history' && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <table className={`w-full ${language === 'ar' ? 'text-right' : 'text-left'}`}>
            <thead className="bg-gray-50 text-sm">
              <tr>
                <th className="px-6 py-4 font-semibold text-gray-600">{t('studentName')}</th>
                <th className="px-6 py-4 font-semibold text-gray-600">{t('amount')}</th>
                <th className="px-6 py-4 font-semibold text-gray-600">{language === 'ar' ? 'تاريخ الاستحقاق' : 'Due Date'}</th>
                <th className="px-6 py-4 font-semibold text-gray-600">{t('paymentDate')}</th>
                <th className="px-6 py-4 font-semibold text-gray-600"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {allTransactions.filter(tr => tr.studentName.toLowerCase().includes(searchTerm.toLowerCase())).map(tr => (
                <tr key={tr.id} className="hover:bg-gray-50/50">
                  <td className="px-6 py-4 font-bold text-gray-800 text-xs">
                    <div className="flex items-center gap-2">
                      <img src={tr.studentAvatar} className="w-8 h-8 rounded-full" alt="" />
                      <span>{tr.studentName}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 font-bold text-emerald-600 text-sm">{tr.amount} {t('currency')}</td>
                  <td className="px-6 py-4 text-sm text-gray-600 font-bold" dir="ltr">{formatFullDate(tr.forMonth)}</td>
                  <td className="px-6 py-4 text-sm text-gray-600 font-medium" dir="ltr">{formatFullDate(tr.date)}</td>
                  <td className="px-6 py-4 text-left flex justify-end">
                    {canManage && (
                      <button 
                        onClick={() => handleDeleteTransaction(tr.studentId, tr.id)}
                        className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {isModalOpen && selectedStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md animate-fade-in border-4 border-white overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <h3 className="text-lg font-bold text-gray-800">{modalType === 'payment' ? t('recordPayment') : (language === 'ar' ? 'تحديد الرسوم' : 'Set Tuition')}</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-red-500"><X size={24} /></button>
            </div>
            <div className="p-6 space-y-5">
              {modalError && (
                <div className="bg-rose-50 text-rose-600 p-4 rounded-xl border border-rose-100 flex items-center gap-2 text-xs font-bold animate-fade-in">
                  <AlertCircle size={16} />
                  {modalError}
                </div>
              )}
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-2xl border border-gray-100"><img src={selectedStudent.avatar} className="w-12 h-12 rounded-full border-2 border-white shadow-sm" alt="" /><div><p className="font-bold text-gray-900">{selectedStudent.name}</p><p className="text-xs text-gray-500">{selectedStudent.classGroup}</p></div></div>
              <div><label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase">{t('amount')} ({t('currency')})</label><input type="number" className={`w-full px-4 py-3 bg-gray-50 border-transparent rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 font-bold ${modalType === 'payment' ? 'text-indigo-600' : ''}`} value={amount} onChange={e => setAmount(e.target.value)} /></div>
              {modalType === 'payment' && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase">{language === 'ar' ? 'تاريخ الاستحقاق' : 'Due Date'}</label>
                    <div className="relative group">
                        <div className="flex items-center gap-2 bg-gray-50 border border-gray-100 rounded-xl px-4 py-2.5 cursor-pointer">
                            <Calendar size={14} className="text-indigo-500" />
                            <span className="font-bold text-[10px] text-gray-700 whitespace-nowrap" dir="ltr">{formatFullDate(forMonth)}</span>
                            <ChevronDown size={12} className="text-gray-400 ml-auto" />
                        </div>
                        <input 
                            type="date" 
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                            value={forMonth}
                            onChange={e => {setForMonth(e.target.value); setModalError(null);}}
                        />
                    </div>
                  </div>
                  <div><label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase">{t('paymentMethod')}</label><div className="flex bg-gray-100 p-1 rounded-xl gap-1"><button onClick={() => setMethod('Cash')} className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-[10px] font-bold transition-all ${method === 'Cash' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-400'}`}><Banknote size={14}/>{t('cash')}</button><button onClick={() => setMethod('Bank')} className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-[10px] font-bold transition-all ${method === 'Bank' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-400'}`}><Building2 size={14}/>{t('bank')}</button></div></div>
                </div>
              )}
              <button onClick={handleSave} className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-indigo-700 transition-all shadow-lg active:scale-95"><Save size={20} />{t('save')}</button>
            </div>
          </div>
        </div>
      )}

      {isHistoryModalOpen && selectedStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg animate-fade-in border-4 border-white overflow-hidden max-h-[85vh] flex flex-col">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50"><h3 className="text-lg font-bold text-gray-800 flex items-center gap-2"><History size={20} className="text-indigo-600" />{t('paymentHistory')}</h3><button onClick={() => setIsHistoryModalOpen(false)} className="text-gray-400 hover:text-red-500"><X size={24} /></button></div>
            <div className="p-6 bg-indigo-50 border-b border-indigo-100 flex items-center gap-3"><img src={selectedStudent.avatar} className="w-14 h-14 rounded-full border-2 border-white shadow-sm" alt="" /><div><p className="font-bold text-indigo-900">{selectedStudent.name}</p><p className="text-xs text-indigo-600">{selectedStudent.classGroup}</p></div></div>
            <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
              {fees.find(f => f.studentId === selectedStudent.id)?.history.map(tr => (
                <div key={tr.id} className="bg-white border border-gray-100 p-4 rounded-2xl shadow-sm hover:shadow-md transition-shadow relative">
                  <div className="flex justify-between items-start mb-2"><span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-lg flex items-center gap-1.5" dir="ltr"><Calendar size={12} /> {formatFullDate(tr.forMonth)}</span><span className="font-bold text-gray-800">{tr.amount} {t('currency')}</span></div>
                  <div className="flex justify-between items-end">
                    <div className="space-y-1">
                      <p className="text-[10px] text-gray-400 flex items-center gap-1"><Banknote size={10} /> {tr.method === 'Cash' ? t('cash') : t('bank')}</p>
                      <p className="text-[10px] text-gray-400 flex items-center gap-1"><User size={10} /> {tr.recordedBy}</p>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <div className="text-right text-sm text-gray-600 font-medium" dir="ltr">{formatFullDate(tr.date)}</div>
                      {canManage && (
                        <button 
                          onClick={() => handleDeleteTransaction(selectedStudent.id, tr.id)}
                          className="p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                          title={t('delete')}
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )) || (
                <div className="p-10 text-center text-gray-400 italic">{language === 'ar' ? 'لا يوجد سجل مدفوعات' : 'No history'}</div>
              )}
            </div>
            <div className="p-4 bg-gray-50 border-t border-gray-100"><button onClick={() => setIsHistoryModalOpen(false)} className="w-full py-3 bg-white border border-gray-200 rounded-xl font-bold text-gray-600 hover:bg-gray-100 transition-all shadow-sm">{t('close')}</button></div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FeesManagement;
