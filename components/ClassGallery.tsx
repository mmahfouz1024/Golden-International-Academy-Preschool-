
import React, { useState, useEffect, useRef } from 'react';
import { Image as ImageIcon, Plus, Trash2, X, Upload, Calendar, Camera, Download } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { getUsers, getClasses, getStudents, getGalleryPosts, saveGalleryPosts } from '../services/storageService';
import { User, ClassGroup, GalleryPost } from '../types';

const ClassGallery: React.FC = () => {
  const { t } = useLanguage();
  const [user, setUser] = useState<User | null>(null);
  const [classes, setClasses] = useState<ClassGroup[]>([]);
  const [posts, setPosts] = useState<GalleryPost[]>([]);
  const [selectedClass, setSelectedClass] = useState<string>('');
  
  // New Post State
  const [isAdding, setIsAdding] = useState(false);
  const [newPostDesc, setNewPostDesc] = useState('');
  const [newPostImages, setNewPostImages] = useState<string[]>([]);
  const [isCompressing, setIsCompressing] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // 1. Get Current User
    const storedUid = localStorage.getItem('golden_session_uid');
    const allUsers = getUsers();
    const currentUser = allUsers.find(u => u.id === storedUid);
    setUser(currentUser || null);

    // 2. Get Available Classes
    const allClasses = getClasses();
    setClasses(allClasses);

    // 3. Determine Default Class Selection based on Role
    if (currentUser) {
        if (currentUser.role === 'parent') {
            // Find linked student's class
            const allStudents = getStudents();
            let parentClassGroups: string[] = [];
            
            if (currentUser.linkedStudentIds && currentUser.linkedStudentIds.length > 0) {
                const children = allStudents.filter(s => currentUser.linkedStudentIds!.includes(s.id));
                parentClassGroups = children.map(c => c.classGroup);
            } else if (currentUser.linkedStudentId) {
                const child = allStudents.find(s => s.id === currentUser.linkedStudentId);
                if (child) parentClassGroups = [child.classGroup];
            }

            // Remove duplicates
            parentClassGroups = [...new Set(parentClassGroups)];
            
            if (parentClassGroups.length > 0) {
                setSelectedClass(parentClassGroups[0]);
            }
        } else if (currentUser.role === 'teacher') {
            // Find assigned classes
            const assigned = allClasses.filter(c => c.teacherId === currentUser.id);
            if (assigned.length > 0) {
                setSelectedClass(assigned[0].name);
            } else if (allClasses.length > 0) {
                setSelectedClass(allClasses[0].name);
            }
        } else {
            // Admin/Manager - Select first available
            if (allClasses.length > 0) setSelectedClass(allClasses[0].name);
        }
    }

    // 4. Load Posts
    setPosts(getGalleryPosts());
  }, []);

  const handleSavePost = () => {
    if (!newPostDesc || newPostImages.length === 0 || !user || !selectedClass) return;

    const newPost: GalleryPost = {
        id: Date.now().toString(),
        classId: selectedClass, // Stores Class Name
        teacherId: user.id,
        teacherName: user.name,
        date: new Date().toISOString(),
        description: newPostDesc,
        images: newPostImages
    };

    const updatedPosts = [newPost, ...posts];
    setPosts(updatedPosts);
    saveGalleryPosts(updatedPosts);
    
    // Reset Form
    setIsAdding(false);
    setNewPostDesc('');
    setNewPostImages([]);
  };

  const handleDeletePost = (id: string) => {
      if (confirm(t('deletePostConfirm'))) {
          const updated = posts.filter(p => p.id !== id);
          setPosts(updated);
          saveGalleryPosts(updated);
      }
  };

  const handleDownloadImage = (base64Data: string, filename: string) => {
    try {
        const link = document.createElement('a');
        link.href = base64Data;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    } catch (e) {
        console.error("Download failed", e);
        // Fallback open in new tab
        const win = window.open();
        win?.document.write('<iframe src="' + base64Data  + '" frameborder="0" style="border:0; top:0px; left:0px; bottom:0px; right:0px; width:100%; height:100%;" allowfullscreen></iframe>');
    }
  };

  // Image Compression (Reused logic)
  const compressImage = (base64Str: string, maxWidth = 800, quality = 0.7): Promise<string> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.src = base64Str;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.onerror = () => resolve(base64Str); 
    });
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      setIsCompressing(true);
      const fileArray = Array.from(files) as File[];
      const processedImages: string[] = [];
      
      for (const file of fileArray) {
        try {
          const base64 = await new Promise<string>((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result as string);
            reader.readAsDataURL(file);
          });
          const compressed = await compressImage(base64);
          processedImages.push(compressed);
        } catch (err) {
          console.error(err);
        }
      }

      setNewPostImages(prev => [...prev, ...processedImages]);
      setIsCompressing(false);
    }
    if (e.target) e.target.value = '';
  };

  // Filter Posts Logic
  const filteredPosts = posts.filter(p => {
      // 1. Must match selected class tab
      if (p.classId !== selectedClass) return false;
      return true;
  });

  const getAvailableClasses = () => {
      if (!user) return [];
      if (user.role === 'admin' || user.role === 'manager') return classes;
      if (user.role === 'teacher') return classes.filter(c => c.teacherId === user.id);
      
      // For parents, find classes of linked children
      if (user.role === 'parent') {
          const allStudents = getStudents();
          let parentClassGroups: string[] = [];
          if (user.linkedStudentIds) {
             const children = allStudents.filter(s => user.linkedStudentIds!.includes(s.id));
             parentClassGroups = children.map(c => c.classGroup);
          } else if (user.linkedStudentId) {
             const child = allStudents.find(s => s.id === user.linkedStudentId);
             if (child) parentClassGroups = [child.classGroup];
          }
          // Return unique class objects that match the group names
          return classes.filter(c => parentClassGroups.includes(c.name));
      }
      return [];
  };

  const visibleClasses = getAvailableClasses();
  const canPost = user?.role !== 'parent';

  return (
    <div className="space-y-6 animate-fade-in pb-20">
        
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
                <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                    <ImageIcon className="text-purple-600" />
                    {t('galleryTitle')}
                </h2>
                <p className="text-gray-500">{t('gallerySubtitle')}</p>
            </div>
            
            {canPost && (
                <button 
                    onClick={() => setIsAdding(!isAdding)}
                    className="flex items-center gap-2 bg-purple-600 text-white px-6 py-2.5 rounded-xl hover:bg-purple-700 transition-colors shadow-lg font-bold"
                >
                    {isAdding ? <X size={20} /> : <Plus size={20} />}
                    {t('uploadPhotos')}
                </button>
            )}
        </div>

        {/* Class Selector Tabs */}
        {visibleClasses.length > 0 && (
            <div className="flex gap-2 overflow-x-auto pb-2 custom-scrollbar">
                {visibleClasses.map(cls => (
                    <button
                        key={cls.id}
                        onClick={() => setSelectedClass(cls.name)}
                        className={`px-5 py-2 rounded-full text-sm font-bold whitespace-nowrap transition-all ${
                            selectedClass === cls.name 
                                ? 'bg-purple-600 text-white shadow-md' 
                                : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-100'
                        }`}
                    >
                        {cls.name}
                    </button>
                ))}
            </div>
        )}

        {/* Upload Area */}
        {isAdding && canPost && (
            <div className="bg-white p-6 rounded-2xl shadow-xl border-2 border-purple-100 animate-fade-in">
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-bold text-gray-500 mb-1">{t('selectClass')}</label>
                        <select 
                            className="w-full p-3 bg-gray-50 rounded-xl border border-gray-200 font-bold text-gray-700"
                            value={selectedClass}
                            onChange={(e) => setSelectedClass(e.target.value)}
                        >
                            {visibleClasses.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                        </select>
                    </div>
                    
                    <textarea 
                        className="w-full p-4 bg-gray-50 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-500/20 resize-none"
                        placeholder={t('postDescription')}
                        rows={3}
                        value={newPostDesc}
                        onChange={e => setNewPostDesc(e.target.value)}
                    />

                    <div>
                        <input 
                            type="file" 
                            ref={fileInputRef}
                            className="hidden"
                            accept="image/*"
                            multiple
                            onChange={handleImageUpload}
                        />
                        <div className="flex gap-4 overflow-x-auto py-2">
                            <button 
                                onClick={() => fileInputRef.current?.click()}
                                disabled={isCompressing}
                                className="w-24 h-24 flex flex-col items-center justify-center bg-purple-50 border-2 border-dashed border-purple-200 rounded-xl text-purple-600 hover:bg-purple-100 transition-colors shrink-0"
                            >
                                <Camera size={24} />
                                <span className="text-[10px] font-bold mt-1">{isCompressing ? '...' : t('add')}</span>
                            </button>
                            
                            {newPostImages.map((img, idx) => (
                                <div key={idx} className="relative w-24 h-24 shrink-0 group">
                                    <img src={img} alt="upload" className="w-full h-full object-cover rounded-xl border border-gray-100" />
                                    <button 
                                        onClick={() => setNewPostImages(prev => prev.filter((_, i) => i !== idx))}
                                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow-md opacity-0 group-hover:opacity-100 transition-opacity"
                                    >
                                        <X size={12} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="flex justify-end pt-2">
                        <button 
                            onClick={handleSavePost}
                            disabled={!newPostDesc || newPostImages.length === 0}
                            className="bg-purple-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-purple-700 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                        >
                            <Upload size={18} />
                            {t('post')}
                        </button>
                    </div>
                </div>
            </div>
        )}

        {/* Gallery Feed */}
        <div className="space-y-8">
            {filteredPosts.map(post => (
                <div key={post.id} className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 relative group">
                    {/* Header */}
                    <div className="flex justify-between items-start mb-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center font-bold">
                                {post.teacherName.charAt(0)}
                            </div>
                            <div>
                                <h3 className="font-bold text-gray-800">{post.teacherName}</h3>
                                <p className="text-xs text-gray-500 flex items-center gap-1">
                                    <Calendar size={10} />
                                    <span dir="ltr">{new Date(post.date).toLocaleDateString()}</span>
                                    <span className="w-1 h-1 bg-gray-300 rounded-full mx-1"></span>
                                    <span className="bg-gray-100 px-2 rounded text-[10px] font-bold text-gray-600">{post.classId}</span>
                                </p>
                            </div>
                        </div>
                        {canPost && (
                            <button 
                                onClick={() => handleDeletePost(post.id)}
                                className="text-gray-300 hover:text-red-500 p-2 opacity-0 group-hover:opacity-100 transition-all"
                            >
                                <Trash2 size={18} />
                            </button>
                        )}
                    </div>

                    <p className="text-gray-700 mb-4 leading-relaxed whitespace-pre-wrap">{post.description}</p>

                    {/* Image Grid */}
                    <div className={`grid gap-2 ${
                        post.images.length === 1 ? 'grid-cols-1' : 
                        post.images.length === 2 ? 'grid-cols-2' : 
                        'grid-cols-2 md:grid-cols-3'
                    }`}>
                        {post.images.map((img, idx) => (
                            <div 
                                key={idx} 
                                className="relative aspect-square rounded-2xl overflow-hidden cursor-pointer group/img"
                                onClick={() => setPreviewImage(img)}
                            >
                                <img src={img} alt="gallery" className="w-full h-full object-cover group-hover/img:scale-105 transition-transform" />
                                
                                {/* Overlay with Download Button on Hover */}
                                <div className="absolute inset-0 bg-black/20 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-end justify-end p-2">
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleDownloadImage(img, `class_photo_${post.classId}_${idx}.jpg`);
                                        }}
                                        className="bg-white/90 hover:bg-white text-gray-700 p-2 rounded-full shadow-md transition-transform hover:scale-110"
                                        title={t('save')}
                                    >
                                        <Download size={16} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            ))}

            {filteredPosts.length === 0 && (
                <div className="text-center py-20 text-gray-400 bg-white rounded-3xl border border-dashed border-gray-200">
                    <ImageIcon size={48} className="mx-auto mb-4 opacity-20" />
                    <p>{t('noGalleryPosts')}</p>
                </div>
            )}
        </div>

        {/* Lightbox */}
        {previewImage && (
            <div 
                className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4 cursor-pointer"
                onClick={() => setPreviewImage(null)}
            >
                <div className="absolute top-4 right-4 flex gap-4">
                    <button 
                        onClick={(e) => {
                            e.stopPropagation();
                            handleDownloadImage(previewImage, `downloaded_photo_${Date.now()}.jpg`);
                        }}
                        className="text-white/70 hover:text-white transition-colors bg-white/10 p-2 rounded-full hover:bg-white/20"
                        title={t('save')}
                    >
                        <Download size={24} />
                    </button>
                    <button className="text-white/70 hover:text-white transition-colors">
                        <X size={32} />
                    </button>
                </div>
                
                <img 
                    src={previewImage} 
                    className="max-w-full max-h-[90vh] rounded-lg shadow-2xl object-contain" 
                    onClick={e => e.stopPropagation()} 
                />
            </div>
        )}

    </div>
  );
};

export default ClassGallery;
