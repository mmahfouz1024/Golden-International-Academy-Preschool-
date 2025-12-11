
import React, { useState } from 'react';
import { Sparkles, BookOpen, Send, Loader2, MessageSquare, Pencil, Save, Check, FileText, Library, Search, Clock, ArrowRight } from 'lucide-react';
import { generateActivityPlan, draftParentMessage } from '../services/geminiService';
import { ActivityPlan } from '../types';
import { AGE_GROUPS } from '../constants';
import { useLanguage } from '../contexts/LanguageContext';

const AIPlanner: React.FC = () => {
  const { t, language } = useLanguage();
  const [activeTab, setActiveTab] = useState<'activity' | 'message' | 'library'>('activity');
  
  const [ageGroup, setAgeGroup] = useState(AGE_GROUPS[0]);
  const [topic, setTopic] = useState('');
  const [isLoadingPlan, setIsLoadingPlan] = useState(false);
  const [generatedPlan, setGeneratedPlan] = useState<ActivityPlan | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const [librarySearchTerm, setLibrarySearchTerm] = useState('');
  const [savedPlans, setSavedPlans] = useState<ActivityPlan[]>([
    {
      title: 'Primary Colors Activity',
      ageGroup: '3-4 Years (Birds)',
      duration: '30 Minutes',
      materials: ['Watercolors', 'White Paper', 'Brushes'],
      steps: ['Introduction to colors', 'Distribute papers', 'Free painting'],
      learningOutcomes: 'Identify Red, Blue, and Yellow colors',
      notes: 'Very fun activity for kids'
    }
  ]);

  const [studentName, setStudentName] = useState('');
  const [messageType, setMessageType] = useState<'praise' | 'issue' | 'announcement'>('praise');
  const [details, setDetails] = useState('');
  const [isLoadingMessage, setIsLoadingMessage] = useState(false);
  const [generatedMessage, setGeneratedMessage] = useState('');

  const handleGeneratePlan = async () => {
    if (!topic) return;
    setIsLoadingPlan(true);
    setGeneratedPlan(null);
    setIsEditing(false);
    setSavedSuccess(false);
    try {
      const plan = await generateActivityPlan(ageGroup, topic);
      setGeneratedPlan({ 
        ...plan, 
        ageGroup, 
        notes: '' 
      });
    } catch (error) {
      alert("Error generating plan. Please try again.");
    } finally {
      setIsLoadingPlan(false);
    }
  };

  const handleUpdatePlan = (field: keyof ActivityPlan, value: any) => {
    if (!generatedPlan) return;
    setGeneratedPlan({ ...generatedPlan, [field]: value });
  };

  const handleSaveToLibrary = () => {
    if (!generatedPlan) return;
    setSavedPlans([generatedPlan, ...savedPlans]);
    setIsEditing(false);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  const handleDraftMessage = async () => {
    if (!studentName || !details) return;
    setIsLoadingMessage(true);
    setGeneratedMessage('');
    try {
      const msg = await draftParentMessage(studentName, messageType, details);
      setGeneratedMessage(msg || '');
    } catch (error) {
      alert("Error drafting message.");
    } finally {
      setIsLoadingMessage(false);
    }
  };

  const handleLoadPlan = (plan: ActivityPlan) => {
    setGeneratedPlan(plan);
    setAgeGroup(plan.ageGroup);
    setTopic(plan.title);
    setActiveTab('activity');
  };

  const filteredPlans = savedPlans.filter(plan => 
    plan.title.includes(librarySearchTerm) || 
    plan.ageGroup.includes(librarySearchTerm)
  );

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-gray-800 flex items-center justify-center gap-2">
          <Sparkles className="text-amber-400" fill="currentColor" />
          {t('aiPlanner')}
        </h2>
        <p className="text-gray-500 mt-2">{t('plannerSubtitle')}</p>
      </div>

      <div className="flex flex-wrap justify-center gap-2 bg-white p-1 rounded-xl shadow-sm border border-gray-100 w-fit mx-auto mb-8">
        <button
          onClick={() => setActiveTab('activity')}
          className={`px-6 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 flex items-center gap-2 ${
            activeTab === 'activity' ? 'bg-indigo-600 text-white shadow-sm' : 'text-gray-500 hover:text-gray-900'
          }`}
        >
          <BookOpen size={18} />
          {t('planActivity')}
        </button>
        <button
          onClick={() => setActiveTab('library')}
          className={`px-6 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 flex items-center gap-2 ${
            activeTab === 'library' ? 'bg-indigo-600 text-white shadow-sm' : 'text-gray-500 hover:text-gray-900'
          }`}
        >
          <Library size={18} />
          {t('library')}
        </button>
        <button
          onClick={() => setActiveTab('message')}
          className={`px-6 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 flex items-center gap-2 ${
            activeTab === 'message' ? 'bg-indigo-600 text-white shadow-sm' : 'text-gray-500 hover:text-gray-900'
          }`}
        >
          <MessageSquare size={18} />
          {t('draftMessage')}
        </button>
      </div>

      {activeTab === 'activity' ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">{t('ageGroup')}</label>
              <select 
                className="w-full p-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-white"
                value={ageGroup}
                onChange={(e) => setAgeGroup(e.target.value)}
              >
                {AGE_GROUPS.map(g => <option key={g} value={g}>{g}</option>)}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">{t('topic')}</label>
              <input 
                type="text" 
                className="w-full p-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
              />
            </div>

            <button 
              onClick={handleGeneratePlan}
              disabled={isLoadingPlan || !topic}
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-medium shadow-md shadow-indigo-200 disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-2 transition-all"
            >
              {isLoadingPlan ? <Loader2 className="animate-spin" /> : <Sparkles size={20} />}
              {t('generatePlan')}
            </button>
          </div>

          <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 min-h-[300px] relative">
            {isLoadingPlan ? (
              <div className="h-full flex flex-col items-center justify-center text-gray-400 space-y-4">
                <Loader2 className="animate-spin text-indigo-500" size={40} />
                <p>{t('generating')}</p>
              </div>
            ) : generatedPlan ? (
              <div className="space-y-6 animate-fade-in">
                
                <div className="flex items-start justify-between border-b border-gray-100 pb-4">
                  <div className="flex-1">
                    <span className="text-xs font-bold tracking-wider text-indigo-500 uppercase">{t('planTitle')}</span>
                    {isEditing ? (
                      <input 
                        type="text"
                        value={generatedPlan.title}
                        onChange={(e) => handleUpdatePlan('title', e.target.value)}
                        className="block w-full text-2xl font-bold text-gray-900 mt-1 border-b-2 border-indigo-200 focus:border-indigo-500 focus:outline-none bg-transparent"
                      />
                    ) : (
                      <h3 className="text-2xl font-bold text-gray-900 mt-1">{generatedPlan.title}</h3>
                    )}
                  </div>
                  <div className={`flex gap-2 ${language === 'ar' ? 'mr-4' : 'ml-4'}`}>
                    {isEditing ? (
                      <button 
                        onClick={() => setIsEditing(false)}
                        className="p-2 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 transition-colors"
                      >
                        <Check size={20} />
                      </button>
                    ) : (
                      <button 
                        onClick={() => setIsEditing(true)}
                        className="p-2 bg-gray-50 text-gray-500 rounded-lg hover:bg-gray-100 transition-colors"
                      >
                        <Pencil size={20} />
                      </button>
                    )}
                  </div>
                </div>

                <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                  {isEditing ? (
                     <div className="flex items-center gap-2">
                       <span>{t('duration')}:</span>
                       <input 
                         type="text"
                         value={generatedPlan.duration}
                         onChange={(e) => handleUpdatePlan('duration', e.target.value)}
                         className="bg-gray-50 px-2 py-1 rounded border border-gray-200 w-32 focus:border-indigo-500 focus:outline-none"
                       />
                     </div>
                  ) : (
                    <span className="bg-gray-100 px-2 py-1 rounded">⏱ {generatedPlan.duration}</span>
                  )}
                  <span className="bg-gray-100 px-2 py-1 rounded">👶 {generatedPlan.ageGroup}</span>
                </div>

                <div>
                  <h4 className="font-bold text-gray-800 mb-2">🎯 {t('learningOutcomes')}</h4>
                  {isEditing ? (
                    <textarea 
                      value={generatedPlan.learningOutcomes}
                      onChange={(e) => handleUpdatePlan('learningOutcomes', e.target.value)}
                      className="w-full bg-green-50 p-3 rounded-lg border border-green-200 text-sm text-gray-700 focus:ring-2 focus:ring-green-500/20 focus:outline-none resize-none"
                      rows={3}
                    />
                  ) : (
                    <p className="text-gray-600 bg-green-50 p-3 rounded-lg border border-green-100 text-sm">{generatedPlan.learningOutcomes}</p>
                  )}
                </div>

                <div>
                  <h4 className="font-bold text-gray-800 mb-2">🛠 {t('materials')}</h4>
                  {isEditing ? (
                    <textarea 
                      value={generatedPlan.materials.join('\n')}
                      onChange={(e) => handleUpdatePlan('materials', e.target.value.split('\n'))}
                      className="w-full p-3 rounded-lg border border-gray-200 text-sm text-gray-600 focus:border-indigo-500 focus:outline-none"
                      rows={4}
                    />
                  ) : (
                    <ul className={`list-disc list-inside text-gray-600 space-y-1 text-sm`}>
                      {generatedPlan.materials.map((m, i) => <li key={i}>{m}</li>)}
                    </ul>
                  )}
                </div>

                <div>
                  <h4 className="font-bold text-gray-800 mb-2">📝 {t('steps')}</h4>
                  {isEditing ? (
                    <textarea 
                      value={generatedPlan.steps.join('\n')}
                      onChange={(e) => handleUpdatePlan('steps', e.target.value.split('\n'))}
                      className="w-full p-3 rounded-lg border border-gray-200 text-sm text-gray-600 focus:border-indigo-500 focus:outline-none"
                      rows={6}
                    />
                  ) : (
                    <div className="space-y-3">
                      {generatedPlan.steps.map((step, i) => (
                        <div key={i} className="flex gap-3">
                          <span className="flex-shrink-0 w-6 h-6 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center text-xs font-bold mt-0.5">{i + 1}</span>
                          <p className="text-gray-600 text-sm leading-relaxed">{step}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="pt-4 border-t border-gray-100">
                  <h4 className="font-bold text-gray-800 mb-2 flex items-center gap-2">
                    <FileText size={16} />
                    {t('teacherNotes')}
                  </h4>
                  {isEditing ? (
                    <textarea 
                      value={generatedPlan.notes || ''}
                      onChange={(e) => handleUpdatePlan('notes', e.target.value)}
                      className="w-full p-3 rounded-lg border border-gray-200 text-sm text-gray-600 focus:border-indigo-500 focus:outline-none"
                      rows={3}
                    />
                  ) : (
                    <div className="bg-yellow-50 p-3 rounded-lg border border-yellow-100 text-sm text-gray-600 italic">
                      {generatedPlan.notes || '...'}
                    </div>
                  )}
                </div>

                <div className="mt-6 flex justify-end">
                   <button 
                    onClick={handleSaveToLibrary}
                    disabled={savedSuccess}
                    className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-medium shadow-sm transition-all ${
                      savedSuccess 
                        ? 'bg-green-600 text-white cursor-default'
                        : 'bg-indigo-600 text-white hover:bg-indigo-700'
                    }`}
                   >
                     {savedSuccess ? (
                       <>
                        <Check size={18} />
                        {t('savedToLib')}
                       </>
                     ) : (
                       <>
                        <Save size={18} />
                        {t('savePlan')}
                       </>
                     )}
                   </button>
                </div>

              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-gray-400 opacity-60">
                <BookOpen size={48} className="mb-4 text-gray-300" />
                <p>{t('planActivity')}</p>
              </div>
            )}
          </div>
        </div>
      ) : activeTab === 'library' ? (
        <div className="space-y-6">
          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center gap-3">
             <Search className="text-gray-400" size={20} />
             <input 
               type="text" 
               placeholder={t('searchLib')}
               className="flex-1 border-none focus:ring-0 text-gray-700 outline-none"
               value={librarySearchTerm}
               onChange={(e) => setLibrarySearchTerm(e.target.value)}
             />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredPlans.map((plan, index) => (
              <div key={index} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow flex flex-col h-full group">
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-gray-800 mb-2 line-clamp-2">{plan.title}</h3>
                  <div className="flex flex-wrap gap-2 mb-4">
                     <span className="text-xs bg-indigo-50 text-indigo-700 px-2 py-1 rounded-md font-medium">
                        {plan.ageGroup}
                     </span>
                     <span className="text-xs bg-gray-50 text-gray-600 px-2 py-1 rounded-md font-medium flex items-center gap-1">
                        <Clock size={12} /> {plan.duration}
                     </span>
                  </div>
                  <p className="text-sm text-gray-500 line-clamp-3 mb-4">
                    {plan.learningOutcomes}
                  </p>
                </div>
                
                <button 
                  onClick={() => handleLoadPlan(plan)}
                  className="w-full py-2.5 border border-indigo-100 text-indigo-600 rounded-xl hover:bg-indigo-50 font-medium transition-colors flex items-center justify-center gap-2"
                >
                  {t('details')}
                  {language === 'ar' ? <ArrowRight size={16} className="rotate-180" /> : <ArrowRight size={16} />}
                </button>
              </div>
            ))}
            {filteredPlans.length === 0 && (
              <div className="col-span-full py-12 text-center text-gray-400">
                <Library size={40} className="mx-auto mb-3 opacity-30" />
                <p>{t('noPlans')}</p>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
           <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">{t('parentName')}</label>
              <input 
                type="text" 
                className="w-full p-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                value={studentName}
                onChange={(e) => setStudentName(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">{t('messageType')}</label>
              <div className="grid grid-cols-3 gap-2">
                <button 
                  onClick={() => setMessageType('praise')}
                  className={`py-2 rounded-lg text-sm border ${messageType === 'praise' ? 'bg-green-50 border-green-200 text-green-700 font-bold' : 'border-gray-200 text-gray-600'}`}
                >
                  {t('praise')}
                </button>
                <button 
                  onClick={() => setMessageType('issue')}
                  className={`py-2 rounded-lg text-sm border ${messageType === 'issue' ? 'bg-red-50 border-red-200 text-red-700 font-bold' : 'border-gray-200 text-gray-600'}`}
                >
                  {t('issue')}
                </button>
                <button 
                  onClick={() => setMessageType('announcement')}
                  className={`py-2 rounded-lg text-sm border ${messageType === 'announcement' ? 'bg-blue-50 border-blue-200 text-blue-700 font-bold' : 'border-gray-200 text-gray-600'}`}
                >
                  {t('announcement')}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">{t('detailsPoints')}</label>
              <textarea 
                rows={4}
                className="w-full p-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 resize-none"
                value={details}
                onChange={(e) => setDetails(e.target.value)}
              />
            </div>

            <button 
              onClick={handleDraftMessage}
              disabled={isLoadingMessage || !details || !studentName}
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-medium shadow-md shadow-indigo-200 disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-2 transition-all"
            >
              {isLoadingMessage ? <Loader2 className="animate-spin" /> : <Sparkles size={20} />}
              {t('draftMessage')}
            </button>
          </div>

          <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 min-h-[300px]">
             {isLoadingMessage ? (
              <div className="h-full flex flex-col items-center justify-center text-gray-400 space-y-4">
                <Loader2 className="animate-spin text-indigo-500" size={40} />
                <p>{t('drafting')}</p>
              </div>
            ) : generatedMessage ? (
              <div className="h-full flex flex-col">
                <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                  <MessageSquare size={20} className="text-indigo-500" />
                  {t('draftMessage')}
                </h3>
                <div className="flex-1 bg-gray-50 p-6 rounded-xl border border-gray-200 text-gray-700 leading-relaxed whitespace-pre-wrap font-medium">
                  {generatedMessage}
                </div>
                <div className="mt-4 flex gap-3">
                  <button 
                    onClick={() => navigator.clipboard.writeText(generatedMessage)}
                    className="flex-1 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
                  >
                    {t('copyText')}
                  </button>
                  <button className="flex-1 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex justify-center items-center gap-2 text-sm font-medium shadow-sm">
                    <Send size={16} />
                    {t('sendWhatsapp')}
                  </button>
                </div>
              </div>
            ) : (
               <div className="h-full flex flex-col items-center justify-center text-gray-400 opacity-60">
                <MessageSquare size={48} className="mb-4 text-gray-300" />
                <p>{t('draftMessage')}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AIPlanner;
