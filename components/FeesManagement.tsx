
import React, { useState, useEffect } from 'react';
import { Wallet, DollarSign, CheckCircle, AlertCircle, Clock, Search, Filter, Send, X, Save, Edit2, Printer, Receipt, Banknote, Building2, Calendar as CalendarIcon } from 'lucide-react';
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
  const [modalType, setModalType] = useState<'payment' | 'tuition'>('payment');
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  
  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'paid' | 'partial' | 'unpaid'>('all');

  // Form State
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [method, setMethod] = useState<PaymentMethod>('Cash');
  const [forMonth, setForMonth] = useState(new Date().toISOString().slice(0, 7)); // YYYY-MM
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

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
        let childIds: string[] = [];
        if (user.linkedStudentIds && user.linkedStudentIds.length > 0) {
            childIds = user.linkedStudentIds;
        } else if (user.linkedStudentId) {
            childIds = [user.linkedStudentId];
        }
        
        const myChildren = allStudents.filter(s => childIds.includes(s.id));
        setStudents(myChildren);
    } else {
        setStudents(allStudents);
    }
    setFees(allFees);
  }, []);

  const getFeeRecord = (studentId: string) => {
    return fees.find(f => f.studentId === studentId) || {
        id: `fee-${studentId}`,
        studentId,
        monthlyAmount: 0,
        totalAmount: 0,
        paidAmount: 0,
        history: []
    } as FeeRecord;
  };

  const getStatus = (record: FeeRecord) => {
    // Check current month
    const currentMonthStr = new Date().toISOString().slice(0, 7);
    const isThisMonthPaid = record.history.some(p => p.forMonth === currentMonthStr);
    
    if (isThisMonthPaid) return 'paid';
    if (record.monthlyAmount > 0 && !isThisMonthPaid) return 'unpaid';
    return 'unpaid';
  };

  const getStatusColor = (status: string) => {
    switch(status) {
        case 'paid': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
        case 'partial': return 'bg-amber-100 text-amber-700 border-amber-200';
        case 'unpaid': return 'bg-rose-100 text-rose-700 border-rose-200';
        default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const handleOpenModal = (student: Student, type: 'payment' | 'tuition') => {
    setSelectedStudent(student);
    setModalType(type);
    setAmount('');
    setNote('');
    setMethod('Cash');
    setForMonth(new Date().toISOString().slice(0, 7));
    setIsModalOpen(true);
    
    const record = getFeeRecord(student.id);
    if (type === 'tuition') {
        setAmount(record.monthlyAmount > 0 ? record.monthlyAmount.toString() : '');
    } else {
        setAmount(record.monthlyAmount > 0 ? record.monthlyAmount.toString() : '');
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudent || !amount) return;

    const val = parseFloat(amount);
    if (isNaN(val) || val < 0) return;

    const currentFees = [...fees];
    let recordIndex = currentFees.findIndex(f => f.studentId === selectedStudent.id);
    let record = recordIndex >= 0 ? { ...currentFees[recordIndex] } : {
        id: `fee-${Date.now()}`,
        studentId: selectedStudent.id,
        monthlyAmount: 0,
        totalAmount: 0,
        paidAmount: 0,
        history: []
    } as FeeRecord;

    if (modalType === 'tuition') {
        record.monthlyAmount = val;
    } else {
        // Payment
        record.paidAmount += val;
        record.lastPaymentDate = date;
        record.history.push({
            id: `${Date.now()}`,
            date: date,
            amount: val,
            method: method,
            forMonth: forMonth,
            note: note,
            recordedBy: currentUser?.name || 'Admin'
        });
    }

    if (recordIndex >= 0) {
        currentFees[recordIndex] = record;
    } else {
        currentFees.push(record);
    }

    setFees(currentFees);
    saveFees(currentFees);
    setIsModalOpen(false);
    addNotification(t('savedSuccessfully'), `${modalType === 'tuition' ? 'Tuition updated' : 'Payment recorded'} for ${selectedStudent.name}`, 'success');
  };

  const handlePrintReceipt = (transaction: PaymentTransaction, student: Student) => {
      const receiptWindow = window.open('', '', 'width=600,height=600');
      if (!receiptWindow) return;

      const htmlContent = `
        <!DOCTYPE html>
        <html dir="${language === 'ar' ? 'rtl' : 'ltr'}">
        <head>
            <title>${t('paymentReceipt')}</title>
            <style>
                body { font-family: sans-serif; padding: 40px; border: 2px dashed #ccc; margin: 20px; }
                .header { text-align: center; margin-bottom: 30px; }
                .logo { font-size: 24px; font-weight: bold; color: #4f46e5; margin-bottom: 5px; }
                .title { font-size: 20px; font-weight: bold; text-decoration: underline; margin-bottom: 20px; }
                .row { display: flex; justify-content: space-between; margin-bottom: 15px; border-bottom: 1px solid #eee; padding-bottom: 5px; }
                .label { font-weight: bold; color: #555; }
                .value { font-weight: bold; font-size: 16px; }
                .footer { margin-top: 40px; text-align: center; font-size: 12px; color: #777; }
                .signature { margin-top: 50px; display: flex; justify-content: space-between; }
                .sig-line { border-top: 1px solid #000; width: 150px; text-align: center; padding-top: 5px; }
            </style>
        </head>
        <body>
            <div class="header">
                <div class="logo">${t('appTitle')}</div>
                <div>${new Date().toLocaleDateString()}</div>
            </div>
            
            <div style="text-align: center;">
                <div class="title">${t('paymentReceipt')}</div>
            </div>

            <div class="row">
                <span class="label">${t('receiptNo')}</span>
                <span class="value">#${transaction.id}</span>
            </div>
            <div class="row">
                <span class="label">${t('paymentDate')}</span>
                <span class="value">${transaction.date}</span>
            </div>
            <div class="row">
                <span class="label">${t('forMonth')}</span>
                <span class="value" dir="ltr">${transaction.forMonth}</span>
            </div>
            <div class="row">
                <span class="label">${t('paymentMethod')}</span>
                <span class="value">${transaction.method === 'Cash' ? t('cash') : t('bank')}</span>
            </div>
            <div class="row">
                <span class="label">${t('receivedFrom')}</span>
                <span class="value">${student.parentName}</span>
            </div>
            <div class="row">
                <span class="label">${t('forStudent')}</span>
                <span class="value">${student.name} (${student.classGroup})</span>
            </div>
            <div class="row">
                <span class="label">${t('amount')}</span>
                <span class="value" style="font-size: 20px; color: #4f46e5;">${transaction.amount} ${t('currency')}</span>
            </div>
            ${transaction.note ? `
            <div class="row">
                <span class="label">${t('note')}</span>
                <span class="value">${transaction.note}</span>
            </div>` : ''}

            <div class="signature">
                <div class="sig-line">${t('recordedBy')}: ${transaction.recordedBy}</div>
                <div class="sig-line">${t('schoolSeal')}</div>
            </div>

            <div class="footer">
                Thank you for your payment.
            </div>
            <script>
                window.print();
            </script>
        </body>
        </html>
      `;

      receiptWindow.document.write(htmlContent);
      receiptWindow.document.close();
  };

  const filteredList = students.filter(s => {
    const record = getFeeRecord(s.id);
    const status = getStatus(record);
    const matchesSearch = s.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6 animate-fade-in">
        
        {/* Header */}
        <div>
            <h2 className="text-2xl font-bold text-gray-800">{t('feesTitle')}</h2>
            <p className="text-gray-500 mt-1">{t('feesSubtitle')}</p>
        </div>

        {/* Filters */}
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="relative w-full md:w-auto md:min-w-[300px]">
                <Search className={`absolute ${language === 'ar' ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2 text-gray-400`} size={20} />
                <input 
                    type="text" 
                    placeholder={t('searchPlaceholder')}
                    className={`w-full ${language === 'ar' ? 'pl-4 pr-10' : 'pr-4 pl-10'} py-2.5 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all`}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>
            
            <div className="flex items-center gap-2 w-full md:w-auto">
                <Filter size={18} className="text-gray-400" />
                <select 
                    className="flex-1 md:w-40 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none"
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value as any)}
                >
                    <option value="all">{t('filterStatus')}</option>
                    <option value="paid">{t('statusPaid')}</option>
                    <option value="unpaid">{t('statusUnpaid')}</option>
                </select>
            </div>
        </div>

        {/* Students List */}
        <div className="grid grid-cols-1 gap-4">
            {filteredList.map(student => {
                const record = getFeeRecord(student.id);
                const status = getStatus(record);
                
                // Get last 4 months for status display
                const lastMonths = [];
                for(let i=0; i<4; i++) {
                    const d = new Date();
                    d.setMonth(d.getMonth() - i);
                    lastMonths.push(d.toISOString().slice(0, 7));
                }

                return (
                    <div key={student.id} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                            <div className="flex items-center gap-4">
                                <img src={student.avatar} alt={student.name} className="w-16 h-16 rounded-full object-cover border-4 border-gray-50" />
                                <div>
                                    <h3 className="font-bold text-lg text-gray-800">{student.name}</h3>
                                    <p className="text-xs text-gray-500">{student.classGroup}</p>
                                    <div className="flex items-center gap-2 mt-2">
                                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${getStatusColor(status)}`}>
                                            {t(`status${status.charAt(0).toUpperCase() + status.slice(1)}` as any)}
                                        </span>
                                        <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">
                                            {record.monthlyAmount || 0} {t('currency')}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div className="flex-1 w-full md:w-auto">
                                <p className="text-[10px] font-bold text-gray-400 uppercase mb-2 tracking-wider">{t('paidMonths')}</p>
                                <div className="flex gap-2">
                                    {lastMonths.reverse().map(m => {
                                        const isPaid = record.history.some(p => p.forMonth === m);
                                        const monthName = new Date(m + '-01').toLocaleDateString(language === 'ar' ? 'ar-EG' : 'en-US', { month: 'short' });
                                        return (
                                            <div key={m} className={`flex-1 min-w-0 p-2 rounded-xl border text-center transition-all ${isPaid ? 'bg-emerald-50 border-emerald-100 text-emerald-700' : 'bg-gray-50 border-gray-100 text-gray-400'}`}>
                                                <p className="text-[10px] font-bold uppercase">{monthName}</p>
                                                {isPaid ? <CheckCircle size={14} className="mx-auto mt-1" /> : <Clock size={14} className="mx-auto mt-1" />}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            <div className="flex gap-2 w-full md:w-auto">
                                {currentUser?.role !== 'parent' && (
                                    <>
                                        <button 
                                            onClick={() => handleOpenModal(student, 'payment')}
                                            className="flex-1 md:flex-none py-2 px-4 bg-indigo-600 text-white rounded-xl font-bold text-sm hover:bg-indigo-700 transition-colors shadow-sm"
                                        >
                                            <DollarSign size={16} className="inline mr-1" />
                                            {t('recordPayment')}
                                        </button>
                                        <button 
                                            onClick={() => handleOpenModal(student, 'tuition')}
                                            className="p-2 bg-gray-100 text-gray-600 rounded-xl hover:bg-gray-200 transition-colors"
                                            title={t('setTuition')}
                                        >
                                            <Edit2 size={18} />
                                        </button>
                                    </>
                                )}
                            </div>
                        </div>

                        {/* Payment History */}
                        {record.history.length > 0 && (
                            <div className="mt-6 pt-4 border-t border-gray-50">
                                <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                                    <Receipt size={14} />
                                    {t('paymentHistory')}
                                </h4>
                                <div className="space-y-2">
                                    {record.history.map(pay => (
                                        <div key={pay.id} className="flex justify-between items-center text-sm bg-gray-50 p-3 rounded-lg border border-gray-100 hover:bg-white hover:shadow-sm transition-all group">
                                            <div className="flex items-center gap-3">
                                                <div className="bg-white p-1.5 rounded-md text-gray-400 border border-gray-200">
                                                    {pay.method === 'Bank' ? <Building2 size={14} /> : <Banknote size={14} />}
                                                </div>
                                                <div>
                                                    <span className="font-bold text-gray-700 block text-xs" dir="ltr">{pay.date}</span>
                                                    <span className="text-[10px] text-indigo-500 font-bold">{pay.forMonth}</span>
                                                </div>
                                            </div>
                                            
                                            <div className="flex items-center gap-4">
                                                <span className="text-[10px] font-bold text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded">
                                                    {pay.method === 'Cash' ? t('cash') : t('bank')}
                                                </span>
                                                <span className="font-bold text-emerald-600">+{pay.amount} {t('currency')}</span>
                                                
                                                <button 
                                                    onClick={() => handlePrintReceipt(pay, student)}
                                                    className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                                                >
                                                    <Printer size={16} />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                );
            })}
            
            {filteredList.length === 0 && (
                <div className="p-12 text-center text-gray-400">
                    {t('noResults')}
                </div>
            )}
        </div>

        {/* Modal */}
        {isModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
                <div className="bg-white rounded-2xl shadow-xl w-full max-w-md animate-fade-in border-4 border-white">
                    <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                        <h3 className="text-lg font-bold text-gray-800">
                            {modalType === 'tuition' ? t('setTuition') : t('recordPayment')}
                        </h3>
                        <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-red-500">
                            <X size={20} />
                        </button>
                    </div>
                    
                    <form onSubmit={handleSave} className="p-6 space-y-4">
                        <div className="text-center mb-4">
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Student</p>
                            <h4 className="text-xl font-bold text-indigo-600">{selectedStudent?.name}</h4>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase">{t('amount')} ({t('currency')})</label>
                            <input 
                                type="number" 
                                required
                                className="w-full px-4 py-3 border-2 border-indigo-50 bg-indigo-50/20 rounded-xl focus:outline-none focus:border-indigo-500 text-lg font-bold"
                                value={amount}
                                onChange={e => setAmount(e.target.value)}
                                placeholder="0.00"
                            />
                        </div>

                        {modalType === 'payment' && (
                            <>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase">{t('forMonth')}</label>
                                        <div className="relative">
                                            <input 
                                                type="month" 
                                                required
                                                className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-indigo-500 text-sm font-bold"
                                                value={forMonth}
                                                onChange={e => setForMonth(e.target.value)}
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase">{t('paymentDate')}</label>
                                        <input 
                                            type="date" 
                                            required
                                            className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-indigo-500 text-sm font-bold"
                                            value={date}
                                            onChange={e => setDate(e.target.value)}
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-gray-500 mb-2 uppercase">{t('paymentMethod')}</label>
                                    <div className="flex gap-2 p-1.5 bg-gray-50 rounded-2xl border border-gray-100">
                                        <button
                                            type="button"
                                            onClick={() => setMethod('Cash')}
                                            className={`flex-1 py-3 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 ${method === 'Cash' ? 'bg-white text-indigo-600 shadow-sm border border-indigo-100' : 'text-gray-400 hover:text-gray-600'}`}
                                        >
                                            <Banknote size={18} />
                                            {t('cash')}
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setMethod('Bank')}
                                            className={`flex-1 py-3 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 ${method === 'Bank' ? 'bg-white text-indigo-600 shadow-sm border border-indigo-100' : 'text-gray-400 hover:text-gray-600'}`}
                                        >
                                            <Building2 size={18} />
                                            {t('bank')}
                                        </button>
                                    </div>
                                </div>
                            </>
                        )}

                        <button 
                            type="submit"
                            className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-200 flex items-center justify-center gap-2 mt-4 active:scale-95"
                        >
                            <Save size={20} />
                            {t('save')}
                        </button>
                    </form>
                </div>
            </div>
        )}

    </div>
  );
};

export default FeesManagement;
