
import React, { useState, useEffect } from 'react';
import { Search, X, Save, Plus, AlertCircle, Banknote, Building2 } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { useNotification } from '../contexts/NotificationContext';
import { getUsers, getStudents, getFees, saveFees } from '../services/storageService';
import { User, Student, FeeRecord, PaymentTransaction, PaymentMethod } from '../types';

const FeesManagement: React.FC = () => {
  const { t, language } = useLanguage();
  const { addNotification } = useNotification();
  
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [fees, setFees] = useState<FeeRecord[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [modalError, setModalError] = useState<string | null>(null);
  
  // Filters
  const [searchTerm, setSearchTerm] = useState('');

  // Form State
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [method, setMethod] = useState<PaymentMethod>('Cash');
  const [forMonth, setForMonth] = useState(new Date().toISOString().slice(0, 7)); // YYYY-MM
  const [date] = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    // Load Data
    const storedUid = localStorage.getItem('golden_session_uid');
    const allUsers = getUsers();
    const user = allUsers.find(u => u.id === storedUid);
    setCurrentUser(user || null);

    const allStudents = getStudents();
    const allFees = getFees();

    // Filter students for Parent View
    if (user?.role === 'parent') {
        const myChildren = allStudents.filter(s => {
          if (user.linkedStudentIds?.includes(s.id)) return true;
          if (user.linkedStudentId === s.id) return true;
          return false;
        });
        setStudents(myChildren);
    } else {
        setStudents(allStudents);
    }
    
    setFees(allFees);
  }, []);

  const handleOpenModal = (student: Student) => {
    setSelectedStudent(student);
    setModalError(null);
    
    const record = fees.find(f => f.studentId === student.id);
    // Set default amount to monthly tuition if exists, or blank
    setAmount(record?.monthlyAmount ? record.monthlyAmount.toString() : '');
    setNote('');
    setForMonth(new Date().toISOString().slice(0, 7));
    setIsModalOpen(true);
  };

  const handleSave = () => {
    if (!selectedStudent || !amount) return;

    const numericAmount = parseFloat(amount);
    if (isNaN(numericAmount)) return;

    let updatedFees = [...fees];
    const recordIndex = updatedFees.findIndex(f => f.studentId === selectedStudent.id);

    // --- DUPLICATE CHECK WITH IN-MODAL ERROR ---
    if (recordIndex >= 0) {
      const currentRecord = updatedFees[recordIndex];
      const alreadyPaid = currentRecord.history.some(p => p.forMonth === forMonth);
      
      if (alreadyPaid) {
        setModalError(t('paymentExistsError'));
        return;
      }
    }

    // Record the Payment
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

    setFees(updatedFees);
    saveFees(updatedFees);
    setIsModalOpen(false);
    addNotification(t('savedSuccessfully'), t('changesSaved'), 'success');
  };

  const filteredStudents = students.filter(s => 
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    s.parentName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusBadge = (studentId: string) => {
    const record = fees.find(f => f.studentId === studentId);
    if (!record) return { label: t('statusUnpaid'), color: 'bg-rose-100 text-rose-700 border-rose-200' };
    
    // Check if current month is in history
    const currentMonthStr = new Date().toISOString().slice(0, 7);
    const isPaidThisMonth = record.history.some(p => p.forMonth === currentMonthStr);

    if (isPaidThisMonth) {
      return { label: t('statusPaid'), color: 'bg-emerald-100 text-emerald-700 border-emerald-200' };
    } else {
      return { label: t('statusUnpaid'), color: 'bg-rose-100 text-rose-700 border-rose-200' };
    }
  };

  return (
    <div className="space-y-6 animate-fade-in pb-20">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">{t('feesTitle')}</h2>
          <p className="text-gray-500">{t('feesSubtitle')}</p>
        </div>
      </div>

      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
        <div className="relative max-w-md">
          <Search className={`absolute ${language === 'ar' ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2 text-gray-400`} size={20} />
          <input 
            type="text" 
            placeholder={t('searchPlaceholder')}
            className={`w-full ${language === 'ar' ? 'pl-4 pr-10' : 'pr-4 pl-10'} py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm`}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className={`w-full ${language === 'ar' ? 'text-right' : 'text-left'}`}>
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100 text-sm">
                <th className="px-6 py-4 font-semibold text-gray-600">{t('studentName')}</th>
                <th className="px-6 py-4 font-semibold text-gray-600">{t('paidAmount')}</th>
                <th className="px-6 py-4 font-semibold text-gray-600">{t('feeStatus')}</th>
                <th className="px-6 py-4 font-semibold text-gray-600"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filteredStudents.map(s => {
                const record = fees.find(f => f.studentId === s.id);
                const status = getStatusBadge(s.id);
                return (
                  <tr key={s.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <img src={s.avatar} alt="" className="w-10 h-10 rounded-full object-cover border border-gray-100" />
                        <div>
                          <p className="font-bold text-gray-900 text-sm">{s.name}</p>
                          <p className="text-[10px] text-gray-500 uppercase tracking-wide">{s.classGroup}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-bold text-indigo-600 text-sm">
                      {record?.paidAmount || 0} <span className="text-[10px] font-medium opacity-50">{t('currency')}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${status.color}`}>
                        {status.label}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-left">
                      <div className="flex gap-2">
                        {currentUser?.role !== 'parent' && (
                          <button 
                            onClick={() => handleOpenModal(s)}
                            className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700 transition-colors shadow-sm active:scale-95"
                          >
                            <Plus size={14} />
                            {t('recordPayment')}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && selectedStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md animate-fade-in border-4 border-white overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <h3 className="text-lg font-bold text-gray-800">
                {t('recordPayment')}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-red-500"><X size={24} /></button>
            </div>
            
            <div className="p-6 space-y-5">
              {/* ERROR MESSAGE BOX */}
              {modalError && (
                <div className="bg-rose-50 border-2 border-rose-100 p-4 rounded-2xl flex items-start gap-3 text-rose-700 animate-fade-in">
                  <AlertCircle size={20} className="shrink-0 mt-0.5" />
                  <div className="text-sm font-bold leading-relaxed">
                    {modalError}
                  </div>
                </div>
              )}

              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-2xl border border-gray-100">
                <img src={selectedStudent.avatar} alt="" className="w-12 h-12 rounded-full border-2 border-white shadow-sm" />
                <div>
                  <p className="font-bold text-gray-900">{selectedStudent.name}</p>
                  <p className="text-xs text-gray-500">{selectedStudent.classGroup}</p>
                </div>
              </div>
              
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wide">{t('amount')} ({t('currency')})</label>
                <input 
                  type="number"
                  required
                  className="w-full px-4 py-3 bg-gray-50 border-transparent rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-bold"
                  value={amount}
                  onChange={e => {
                    setAmount(e.target.value);
                    setModalError(null); // Clear error on change
                  }}
                  placeholder="0.00"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wide">{t('forMonth')}</label>
                  <input 
                    type="month"
                    className="w-full px-4 py-2.5 bg-gray-50 border-transparent rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 font-bold"
                    value={forMonth}
                    onChange={e => {
                      setForMonth(e.target.value);
                      setModalError(null); // Clear error on change
                    }}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wide">{t('paymentMethod')}</label>
                  <div className="flex bg-gray-100 p-1 rounded-xl gap-1">
                    <button 
                      onClick={() => setMethod('Cash')}
                      className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-[10px] font-bold transition-all ${method === 'Cash' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-400'}`}
                    >
                      <Banknote size={14} />
                      {t('cash')}
                    </button>
                    <button 
                      onClick={() => setMethod('Bank')}
                      className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-[10px] font-bold transition-all ${method === 'Bank' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-400'}`}
                    >
                      <Building2 size={14} />
                      {t('bank')}
                    </button>
                  </div>
                </div>
              </div>
              
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wide">{t('note')}</label>
                <textarea 
                  className="w-full px-4 py-3 bg-gray-50 border-transparent rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 font-medium resize-none"
                  rows={2}
                  value={note}
                  onChange={e => setNote(e.target.value)}
                  placeholder="..."
                />
              </div>

              <button 
                onClick={handleSave}
                className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 active:scale-95"
              >
                <Save size={20} />
                {t('save')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FeesManagement;
