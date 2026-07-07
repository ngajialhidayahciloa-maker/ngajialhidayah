import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Users, CheckSquare, Calendar, Sparkles, BookOpen, 
  User, Check, Heart, Award, FileSpreadsheet, 
  MessageSquare, RefreshCw, Search, CheckCircle, Info,
  PlusCircle, Filter, Download, Plus, Star, Moon, Clock,
  Edit, Trash2, Lock
} from 'lucide-react';
import { Santri, Report, ShalatStatus } from '../types';

interface GuruDashboardProps {
  reports: Report[];
  santriList: Santri[];
  onVerifyReport: (reportId: string, feedback: string, verifiedBy?: string) => void;
  onAddSantri: (name: string, className: string, pin: string, gender: 'L' | 'P') => Santri;
  onUpdateSantri: (id: string, updatedFields: Partial<Santri>) => void;
  onDeleteSantri: (id: string) => void;
  onRefreshData?: () => void;
  currentRole?: 'guru' | 'admin_l' | 'admin_p';
}

type TabType = 'dashboard' | 'add-santri' | 'feed-laporan' | 'rekap-laporan';

const checkTimeValidity = (key: string, enteredTime?: string): { isValid: boolean; range: string; msg: string } => {
  if (!enteredTime || enteredTime === 'Selesai') return { isValid: true, range: '', msg: '' };
  
  const parts = enteredTime.split(':');
  if (parts.length < 2) return { isValid: true, range: '', msg: '' };
  
  const hour = parseInt(parts[0], 10);
  const minute = parseInt(parts[1], 10);
  const totalMinutes = hour * 60 + minute;
  
  let start = 0;
  let end = 0;
  let rangeStr = '';
  let label = '';
  
  switch (key) {
    case 'subuh':
      start = 4 * 60; // 04:00
      end = 6 * 60; // 06:00
      rangeStr = '04:00 - 06:00';
      label = 'Subuh';
      break;
    case 'dzuhur':
      start = 11 * 60 + 45; // 11:45
      end = 15 * 60; // 15:00
      rangeStr = '11:45 - 15:00';
      label = 'Dzuhur';
      break;
    case 'ashar':
      start = 15 * 60; // 15:00
      end = 17 * 60 + 45; // 17:45
      rangeStr = '15:00 - 17:45';
      label = 'Ashar';
      break;
    case 'maghrib':
      start = 17 * 60 + 45; // 17:45
      end = 19 * 60; // 19:00
      rangeStr = '17:45 - 19:00';
      label = 'Maghrib';
      break;
    case 'isya':
      start = 19 * 60; // 19:00
      end = 24 * 60; // 24:00
      rangeStr = '19:00 - 23:59';
      label = 'Isya';
      break;
    default:
      return { isValid: true, range: '', msg: '' };
  }
  
  const isValid = totalMinutes >= start && totalMinutes <= end;
  return {
    isValid,
    range: rangeStr,
    msg: isValid 
      ? `Sesuai waktu (${rangeStr})`
      : `Luar waktu (${rangeStr})`
  };
};

export default function GuruDashboard({ 
  reports, 
  santriList, 
  onVerifyReport,
  onAddSantri,
  onUpdateSantri,
  onDeleteSantri,
  onRefreshData,
  currentRole = 'guru'
}: GuruDashboardProps) {
  const [activeTab, setActiveTab] = useState<TabType>(() => {
    if (currentRole === 'admin_l' || currentRole === 'admin_p') {
      return 'feed-laporan';
    }
    return 'dashboard';
  });

  // Role based filtering
  const displaySantriList = useMemo(() => {
    if (currentRole === 'admin_l') {
      return santriList.filter(s => s.gender === 'L');
    }
    if (currentRole === 'admin_p') {
      return santriList.filter(s => s.gender === 'P');
    }
    return santriList;
  }, [santriList, currentRole]);

  const displayReports = useMemo(() => {
    const santriMap = new Map(santriList.map(s => [s.id, s.gender]));
    if (currentRole === 'admin_l') {
      return reports.filter(r => santriMap.get(r.santriId) === 'L');
    }
    if (currentRole === 'admin_p') {
      return reports.filter(r => santriMap.get(r.santriId) === 'P');
    }
    return reports;
  }, [reports, santriList, currentRole]);

  const [newStudentGender, setNewStudentGender] = useState<'L' | 'P'>('L');
  const [editGender, setEditGender] = useState<'L' | 'P'>('L');

  React.useEffect(() => {
    if (currentRole === 'admin_l') {
      setNewStudentGender('L');
      if (activeTab === 'dashboard') {
        setActiveTab('feed-laporan');
      }
    } else if (currentRole === 'admin_p') {
      setNewStudentGender('P');
      if (activeTab === 'dashboard') {
        setActiveTab('feed-laporan');
      }
    }
  }, [currentRole, activeTab]);
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  
  // Search and Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'verified'>('all');
  
  // New Student Form States
  const [newStudentName, setNewStudentName] = useState('');
  const [newStudentClass, setNewStudentClass] = useState('Iqro 3');
  const [customNewClass, setCustomNewClass] = useState('');
  const [newStudentPin, setNewStudentPin] = useState(() => Math.floor(1000 + Math.random() * 9000).toString());
  const [selectedAvatar, setSelectedAvatar] = useState('👦');
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const [registeredName, setRegisteredName] = useState('');

  // Student list search & edit states
  const [studentSearchQuery, setStudentSearchQuery] = useState('');
  const [editingStudent, setEditingStudent] = useState<Santri | null>(null);
  const [editName, setEditName] = useState('');
  const [editClass, setEditClass] = useState('Iqro 3');
  const [customEditClass, setCustomEditClass] = useState('');
  const [editPin, setEditPin] = useState('');
  const [editAvatar, setEditAvatar] = useState('👦');

  // AI & Feedback States
  const [manualFeedback, setManualFeedback] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [previewPhoto, setPreviewPhoto] = useState<string | null>(null);

  const avatarsList = ['👦', '👧', '👶', '🕌', '📚', '🌟', '📿', '🎓'];
  const classOptions = useMemo(() => {
    const defaultClasses = [
      'Iqro 1', 'Iqro 2', 'Iqro 3', 'Iqro 4', 'Iqro 5', 'Iqro 6',
      'Juz Amma', 'Al-Qur\'an (Lancar)', 'Tahfidz'
    ];
    const extraClasses: string[] = [];
    santriList.forEach(s => {
      if (s.class && !defaultClasses.includes(s.class)) {
        extraClasses.push(s.class);
      }
    });
    return [...defaultClasses, ...Array.from(new Set(extraClasses)), 'Kustom / Kelas Lainnya...'];
  }, [santriList]);

  // Calculations for Statistics / KPI
  const totalReports = displayReports.length;
  const pendingReportsCount = displayReports.filter(r => r.status === 'pending').length;
  const verifiedReportsCount = displayReports.filter(r => r.status === 'verified').length;
  
  // Average shalat completion percentage
  const calculateAveragePrayers = () => {
    if (displayReports.length === 0) return 0;
    let totalCompleted = 0;
    displayReports.forEach(r => {
      let dailyCount = 0;
      const subuh = r.shalat.subuh;
      const dzuhur = r.shalat.dzuhur;
      const ashar = r.shalat.ashar;
      const maghrib = r.shalat.maghrib;
      const isya = r.shalat.isya;
      
      if (typeof subuh === 'boolean' ? subuh : subuh?.performed) dailyCount++;
      if (typeof dzuhur === 'boolean' ? dzuhur : dzuhur?.performed) dailyCount++;
      if (typeof ashar === 'boolean' ? ashar : ashar?.performed) dailyCount++;
      if (typeof maghrib === 'boolean' ? maghrib : maghrib?.performed) dailyCount++;
      if (typeof isya === 'boolean' ? isya : isya?.performed) dailyCount++;
      totalCompleted += dailyCount;
    });
    return Math.round((totalCompleted / (displayReports.length * 5)) * 100);
  };

  const todayDateStr = new Date().toISOString().split('T')[0];
  const todayReportsCount = displayReports.filter(r => r.date === todayDateStr).length;
  const attendancePercentage = displaySantriList.length > 0
    ? Math.round((todayReportsCount / displaySantriList.length) * 100)
    : 0;

  // Handle registering a new student
  const handleRegisterStudentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStudentName.trim()) return;
    
    // Determine the class name to register
    const finalClass = newStudentClass === 'Kustom / Kelas Lainnya...'
      ? (customNewClass.trim() || 'Umum')
      : newStudentClass;
    
    // Register the student with the specified PIN and gender
    const created = onAddSantri(newStudentName.trim(), finalClass, newStudentPin, newStudentGender);
    
    // Override standard avatar choice if the user picked a custom one (we can update state dynamically)
    const localSantri = localStorage.getItem('laporan_santri_profiles');
    if (localSantri) {
      const parsed: Santri[] = JSON.parse(localSantri);
      const updated = parsed.map(s => {
        if (s.id === created.id) {
          return { ...s, avatar: selectedAvatar };
        }
        return s;
      });
      localStorage.setItem('laporan_santri_profiles', JSON.stringify(updated));
      // Force refresh data if onRefreshData exists
      if (onRefreshData) onRefreshData();
    }

    setRegisteredName(newStudentName.trim());
    setNewStudentName('');
    setNewStudentClass('Iqro 3');
    setCustomNewClass('');
    setNewStudentPin(Math.floor(1000 + Math.random() * 9000).toString());
    setSelectedAvatar(newStudentGender === 'P' ? '👧' : '👦');
    setShowSuccessToast(true);
    
    setTimeout(() => {
      setShowSuccessToast(false);
    }, 4000);
  };

  // Handle saving the student's edited data
  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStudent || !editName.trim()) return;

    // Determine class name to update
    const finalClass = editClass === 'Kustom / Kelas Lainnya...'
      ? (customEditClass.trim() || editingStudent.class)
      : editClass;

    onUpdateSantri(editingStudent.id, {
      name: editName.trim(),
      class: finalClass,
      pin: editPin,
      avatar: editAvatar,
      gender: editGender,
    });
    setEditingStudent(null);
    setCustomEditClass('');
  };

  // AI Evaluation API Proxy Call
  const handleAiEvaluation = async (report: Report) => {
    setIsAiLoading(true);
    try {
      const response = await fetch('/api/evaluate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ report }),
      });
      const data = await response.json();
      if (data.success && data.evaluation) {
        setManualFeedback(data.evaluation);
      } else {
        throw new Error(data.message || 'Gagal menyusun evaluasi.');
      }
    } catch (err: any) {
      console.error(err);
      // Fallback elegant offline template
      const prayersCount = Object.values(report.shalat).filter((p: any) => {
        if (typeof p === 'boolean') return p;
        return p && p.performed;
      }).length;
      const reading = report.quran.type === 'quran' 
        ? `Al-Qur'an Surah ${report.quran.surahOrJilid} ayat ${report.quran.ayatOrHalaman}`
        : `Iqro' ${report.quran.surahOrJilid} Halaman ${report.quran.ayatOrHalaman}`;
      
      const parentalApreciation = report.bantuOrangTua.checked 
        ? `dan hebat sekali sudah membantu orang tua dengan "${report.bantuOrangTua.description}".` 
        : '.';

      setManualFeedback(
        `Masya Allah, Barakallahu fiik Ananda ${report.santriName}! Ustadz bangga sekali melihat laporan ibadahmu hari ini. ` +
        `Shalat 5 waktu terjaga dengan baik (${prayersCount}/5 waktu) serta sudah lancar membaca ${reading} ${parentalApreciation} ` +
        `Pertahankan kebaikan ini ya anak sholeh, tingkatkan terus muraja'ahmu!`
      );
    } finally {
      setIsAiLoading(false);
    }
  };

  // Verify and Submit Feedback
  const handleVerifySubmit = (reportId: string) => {
    let verifier = 'Guru Ngaji';
    if (currentRole === 'admin_l') verifier = 'Admin Laki-laki';
    else if (currentRole === 'admin_p') verifier = 'Admin Perempuan';

    onVerifyReport(reportId, manualFeedback, verifier);
    setSelectedReport(null);
    setManualFeedback('');
    if (onRefreshData) onRefreshData();
  };

  // Filtering reports for FEED
  const filteredReports = displayReports.filter(r => {
    const matchesSearch = r.santriName.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          r.quran.surahOrJilid.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || 
                          (statusFilter === 'pending' && r.status === 'pending') ||
                          (statusFilter === 'verified' && r.status === 'verified');
    return matchesSearch && matchesStatus;
  }).sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime());

  // Group reports by date
  const reportsByDate = filteredReports.reduce<Record<string, Report[]>>((groups, report) => {
    const date = report.date;
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(report);
    return groups;
  }, {});

  // Sort dates descending
  const sortedDates = Object.keys(reportsByDate).sort((a, b) => new Date(b).getTime() - new Date(a).getTime());

  const formatGroupDate = (dateStr: string) => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
      
      if (dateStr === today) {
        return 'Hari Ini';
      } else if (dateStr === yesterday) {
        return 'Kemarin';
      }
      
      const options: Intl.DateTimeFormatOptions = { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' };
      return new Date(dateStr).toLocaleDateString('id-ID', options);
    } catch (e) {
      return dateStr;
    }
  };

  // Top Streaks Students
  const topStreaksStudents = [...displaySantriList].sort((a, b) => b.streak - a.streak).slice(0, 3);

  // Simulated PDF download
  const handleSimulateExport = () => {
    alert('Alhamdulillah! Rekap laporan santri berhasil diekspor ke format cetak PDF / Excel (Simulasi).');
  };

  return (
    <div className="w-full max-w-5xl mx-auto space-y-6">
      
      {/* Visual Navigation Tabs Menu */}
      <div className="bg-white p-2.5 rounded-2xl border border-slate-200/60 shadow-xs flex flex-wrap gap-1.5 items-center justify-between">
        <div className="flex flex-wrap gap-1 items-center">
          {currentRole === 'guru' && (
            <button
              type="button"
              onClick={() => setActiveTab('dashboard')}
              className={`py-2 px-3.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeTab === 'dashboard' 
                  ? 'bg-emerald-600 text-white shadow-sm' 
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
              id="tab-guru-dashboard"
            >
              <Sparkles className="w-4 h-4" /> Dasbor Informatif
            </button>
          )}

          <button
            type="button"
            onClick={() => setActiveTab('add-santri')}
            className={`py-2 px-3.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'add-santri' 
                ? 'bg-emerald-600 text-white shadow-sm' 
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
            id="tab-guru-add-santri"
          >
            <PlusCircle className="w-4 h-4" /> Tambah Santri
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('feed-laporan')}
            className={`py-2 px-3.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'feed-laporan' 
                ? 'bg-emerald-600 text-white shadow-sm' 
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
            id="tab-guru-feed-laporan"
          >
            <FileSpreadsheet className="w-4 h-4" /> Feed Laporan
            {pendingReportsCount > 0 && (
              <span className="bg-red-500 text-white text-[9px] font-extrabold px-1.5 py-0.5 rounded-full animate-pulse">
                {pendingReportsCount}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('rekap-laporan')}
            className={`py-2 px-3.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'rekap-laporan' 
                ? 'bg-emerald-600 text-white shadow-sm' 
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
            id="tab-guru-rekap-laporan"
          >
            <Users className="w-4 h-4" /> Rekap Laporan
          </button>
        </div>

        {/* Quick Refresh Icon Button */}
        <button
          type="button"
          onClick={onRefreshData}
          className="p-2 text-slate-400 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-all"
          title="Sinkronisasi Ulang Data"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Main Tab Render Switcher */}
      <AnimatePresence mode="wait">
        
        {/* 1. DASBOR INFORMATIF TAB */}
        {activeTab === 'dashboard' && (
          <motion.div
            key="dashboard-view"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
          >
            {/* Elegant Islamic Greeting Banner */}
            <div className="bg-gradient-to-br from-emerald-600 to-teal-800 text-white p-6 rounded-3xl relative overflow-hidden shadow-sm border border-emerald-700/10">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-6 -mt-6" />
              <div className="absolute bottom-0 left-0 w-24 h-24 bg-teal-500/15 rounded-full -ml-8 -mb-8" />
              
              <div className="relative flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">🕌</span>
                    <h2 className="text-lg font-bold tracking-tight">Assalamualaikum, Ustadz / Ustadzah</h2>
                  </div>
                  <p className="text-emerald-100/90 text-xs leading-relaxed max-w-xl">
                    Semoga Allah senantiasa melimpahkan taufik, kesehatan, dan keikhlasan dalam mendidik para generasi Qur'ani. Berikut ringkasan pencapaian ibadah & mengaji para santri hari ini.
                  </p>
                </div>
                <div className="bg-white/10 backdrop-blur-xs px-4 py-2.5 rounded-2xl border border-white/10 text-right">
                  <p className="text-[10px] text-emerald-200 font-bold uppercase tracking-wider flex items-center gap-1 justify-end">
                    <Clock className="w-3 h-3 text-amber-300" /> Waktu Evaluasi
                  </p>
                  <p className="text-sm font-extrabold mt-0.5">Senin, {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                </div>
              </div>
            </div>

            {/* Metrics Scoreboard Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-3.5">
                <div className="w-11 h-11 bg-amber-50 rounded-xl flex items-center justify-center text-amber-600">
                  <Calendar className="w-5.5 h-5.5" />
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Kehadiran Lapor</p>
                  <h3 className="text-lg font-extrabold text-slate-800 mt-0.5">{attendancePercentage}%</h3>
                  <p className="text-[10px] text-slate-500 mt-0.5">{todayReportsCount}/{santriList.length} Santri Melapor</p>
                </div>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-3.5">
                <div className="w-11 h-11 bg-rose-50 rounded-xl flex items-center justify-center text-rose-600">
                  <CheckSquare className="w-5.5 h-5.5" />
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Butuh Penilaian</p>
                  <h3 className="text-lg font-extrabold text-slate-800 mt-0.5">{pendingReportsCount}</h3>
                  <p className="text-[10px] text-slate-500 mt-0.5">Laporan menunggu ulasan</p>
                </div>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-3.5">
                <div className="w-11 h-11 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600">
                  <CheckCircle className="w-5.5 h-5.5" />
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Telah Dinilai</p>
                  <h3 className="text-lg font-extrabold text-slate-800 mt-0.5">{verifiedReportsCount}</h3>
                  <p className="text-[10px] text-slate-500 mt-0.5">Berhasil divalidasi</p>
                </div>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-3.5">
                <div className="w-11 h-11 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600">
                  <Award className="w-5.5 h-5.5" />
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Rata Shalat 5 Wt</p>
                  <h3 className="text-lg font-extrabold text-slate-800 mt-0.5">{calculateAveragePrayers()}%</h3>
                  <p className="text-[10px] text-slate-500 mt-0.5">Tingkat kedisiplinan shalat</p>
                </div>
              </div>
            </div>

            {/* Dashboard Content split columns */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Left Side: Top Performers (Streak Terpanjang) */}
              <div className="bg-white p-5 rounded-3xl border border-slate-200/60 shadow-xs space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <h3 className="text-sm font-extrabold text-slate-800 flex items-center gap-1.5">
                    <Star className="w-4 h-4 text-amber-500 fill-amber-500" /> Santri Istiqomah (Top Streak)
                  </h3>
                  <span className="text-[10px] bg-amber-50 text-amber-700 font-bold px-2 py-0.5 rounded-full">Kebaikan Harian</span>
                </div>

                <div className="space-y-3">
                  {topStreaksStudents.map((santri, idx) => (
                    <div 
                      key={santri.id}
                      className="p-3 bg-slate-50 rounded-2xl border border-slate-100/50 flex items-center justify-between"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center text-xs font-bold text-amber-800">
                          #{idx + 1}
                        </div>
                        <span className="text-xl">{santri.avatar}</span>
                        <div>
                          <h4 className="font-bold text-slate-800 text-xs leading-none">{santri.name}</h4>
                          <p className="text-[10px] text-slate-400 mt-1">{santri.class}</p>
                        </div>
                      </div>
                      <span className="text-xs bg-amber-50 text-amber-700 font-extrabold px-2 py-1 rounded-lg border border-amber-200/40">
                        🔥 {santri.streak} Hari
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Right Side: Quick Action & Last Activity summary */}
              <div className="lg:col-span-2 bg-white p-5 rounded-3xl border border-slate-200/60 shadow-xs space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <h3 className="text-sm font-extrabold text-slate-800 flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-emerald-600" /> Aktivitas Laporan Terbaru
                  </h3>
                  <button 
                    onClick={() => setActiveTab('feed-laporan')} 
                    className="text-xs text-emerald-600 font-bold hover:underline"
                  >
                    Lihat Semua
                  </button>
                </div>

                <div className="space-y-3">
                  {reports.slice(0, 3).map((report) => {
                    const donePrayers = Object.values(report.shalat).filter(Boolean).length;
                    return (
                      <div 
                        key={report.id}
                        onClick={() => {
                          setSelectedReport(report);
                          setActiveTab('feed-laporan');
                        }}
                        className="p-3.5 bg-slate-50 hover:bg-slate-100/70 rounded-2xl border border-slate-100/50 transition-all cursor-pointer flex items-center justify-between"
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-xl">📖</span>
                          <div>
                            <h4 className="font-bold text-slate-800 text-xs">{report.santriName}</h4>
                            <p className="text-[10px] text-slate-400 mt-0.5">Ngaji: <span className="font-semibold text-slate-600">{report.quran.surahOrJilid} - {report.quran.ayatOrHalaman}</span></p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] bg-emerald-50 text-emerald-700 font-bold px-2 py-0.5 rounded-lg">
                            🕌 {donePrayers}/5 Shalat
                          </span>
                          {report.status === 'verified' ? (
                            <span className="text-[10px] text-emerald-600 bg-emerald-100/40 px-2 py-0.5 rounded-full font-bold">Terverifikasi</span>
                          ) : (
                            <span className="text-[10px] text-amber-600 bg-amber-100/40 px-2 py-0.5 rounded-full font-bold animate-pulse">Menunggu</span>
                          )}
                        </div>
                      </div>
                    );
                  })}

                  {reports.length === 0 && (
                    <div className="py-8 text-center text-slate-400">
                      <p className="text-xs font-semibold">Belum ada laporan yang dikirimkan hari ini.</p>
                    </div>
                  )}
                </div>
              </div>

            </div>
          </motion.div>
        )}

        {/* 2. TAMBAH SANTRI TAB */}
        {activeTab === 'add-santri' && (
          <motion.div
            key="add-santri-view"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start"
          >
            {/* Left Column: Form Pendaftaran (span 5) */}
            <div className="lg:col-span-5 space-y-4">
              {/* Registered Success Alert Toast */}
              {showSuccessToast && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-4 rounded-2xl mb-4 text-xs font-medium flex items-start gap-3 shadow-xs"
                >
                  <span className="text-lg">🎉</span>
                  <div>
                    <p className="font-extrabold text-slate-800">Alhamdulillah, Berhasil!</p>
                    <p className="mt-0.5">Santri atas nama <strong className="font-bold">"{registeredName}"</strong> telah terdaftar di database Al-Hidayah Digital.</p>
                  </div>
                </motion.div>
              )}

              <div className="bg-white rounded-3xl border border-slate-200/60 p-6 shadow-sm space-y-5">
                <div className="border-b border-slate-100 pb-3">
                  <h3 className="text-base font-extrabold text-slate-800 flex items-center gap-2">
                    <User className="w-5 h-5 text-emerald-600" /> Pendaftaran Santri Baru
                  </h3>
                  <p className="text-slate-400 text-[11px] mt-0.5">Gunakan formulir eksklusif Guru ini untuk mendaftarkan santri baru Anda.</p>
                </div>

                <form onSubmit={handleRegisterStudentSubmit} className="space-y-4">
                  
                  {/* Full Name */}
                  <div>
                    <label className="text-[11px] font-bold text-slate-500 uppercase block mb-1.5">Nama Lengkap Santri</label>
                    <input
                      type="text"
                      required
                      placeholder="Contoh: Muhammad Rizky"
                      value={newStudentName}
                      onChange={(e) => setNewStudentName(e.target.value)}
                      className="w-full text-xs p-3 border border-slate-200 bg-slate-5/30 rounded-xl focus:outline-emerald-500"
                      id="add-student-name-input"
                    />
                  </div>

                  {/* Gender selection */}
                  <div>
                    <label className="text-[11px] font-bold text-slate-500 uppercase block mb-1.5 font-sans">Jenis Kelamin</label>
                    {currentRole === 'guru' ? (
                      <div className="grid grid-cols-2 gap-3">
                        <button
                          type="button"
                          onClick={() => {
                            setNewStudentGender('L');
                            setSelectedAvatar('👦');
                          }}
                          className={`py-2.5 rounded-xl border text-xs font-extrabold flex items-center justify-center gap-2 transition-all ${
                            newStudentGender === 'L'
                              ? 'bg-blue-50 border-blue-500 text-blue-700 ring-2 ring-blue-500/10'
                              : 'border-slate-200 hover:bg-slate-50 text-slate-600'
                          }`}
                        >
                          👦 Laki-laki (L)
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setNewStudentGender('P');
                            setSelectedAvatar('👧');
                          }}
                          className={`py-2.5 rounded-xl border text-xs font-extrabold flex items-center justify-center gap-2 transition-all ${
                            newStudentGender === 'P'
                              ? 'bg-fuchsia-50 border-fuchsia-500 text-fuchsia-700 ring-2 ring-fuchsia-500/10'
                              : 'border-slate-200 hover:bg-slate-50 text-slate-600'
                          }`}
                        >
                          👧 Perempuan (P)
                        </button>
                      </div>
                    ) : (
                      <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 flex items-center justify-between">
                        <span className="flex items-center gap-1.5">
                          {newStudentGender === 'L' ? '👦 Laki-laki' : '👧 Perempuan'}
                        </span>
                        <span className="text-[9px] bg-slate-200 text-slate-600 font-extrabold px-2 py-0.5 rounded uppercase">Terkunci Peran</span>
                      </div>
                    )}
                  </div>

                   {/* Class options */}
                  <div>
                    <label className="text-[11px] font-bold text-slate-500 uppercase block mb-1.5">Kelas / Tingkat Mengaji</label>
                    <select
                      value={newStudentClass}
                      onChange={(e) => setNewStudentClass(e.target.value)}
                      className="w-full text-xs p-3 border border-slate-200 bg-white rounded-xl focus:outline-emerald-500 font-semibold"
                      id="add-student-class-select"
                    >
                      {classOptions.map((opt) => (
                        <option key={opt} value={opt}>{opt}</option>
                      ))}
                    </select>

                    {newStudentClass === 'Kustom / Kelas Lainnya...' && (
                      <motion.div
                        initial={{ opacity: 0, y: -5 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mt-2"
                      >
                        <label className="text-[10px] font-bold text-emerald-600 uppercase block mb-1">Nama Kelas Baru (Kustom)</label>
                        <input
                          type="text"
                          required
                          placeholder="Contoh: Kelas Iqro Khusus, Kelas Tahfidz Malam"
                          value={customNewClass}
                          onChange={(e) => setCustomNewClass(e.target.value)}
                          className="w-full text-xs p-3 border border-emerald-300 bg-emerald-50/10 rounded-xl focus:outline-emerald-500 font-semibold"
                        />
                      </motion.div>
                    )}
                  </div>

                  {/* Password / PIN input */}
                  <div>
                    <label className="text-[11px] font-bold text-slate-500 uppercase block mb-1.5 flex justify-between items-center">
                      <span>PIN / Sandi Masuk (4-Digit)</span>
                      <button
                        type="button"
                        onClick={() => setNewStudentPin(Math.floor(1000 + Math.random() * 9000).toString())}
                        className="text-[10px] text-emerald-600 hover:underline font-bold"
                      >
                        Acak PIN
                      </button>
                    </label>
                    <input
                      type="text"
                      required
                      maxLength={6}
                      placeholder="Contoh: 1234"
                      value={newStudentPin}
                      onChange={(e) => setNewStudentPin(e.target.value.replace(/\D/g, ''))}
                      className="w-full text-xs p-3 border border-slate-200 bg-slate-50 rounded-xl focus:outline-emerald-500 font-mono tracking-widest text-center text-sm font-bold"
                      id="add-student-pin-input"
                    />
                    <p className="text-[9px] text-slate-400 mt-1">Sandi ini akan digunakan santri untuk login guna mengisi laporan harian mereka.</p>
                  </div>

                  {/* Avatar Selection */}
                  <div>
                    <label className="text-[11px] font-bold text-slate-500 uppercase block mb-2">Pilih Avatar Profil</label>
                    <div className="grid grid-cols-4 gap-2.5">
                      {avatarsList.map((avatar) => (
                        <button
                          key={avatar}
                          type="button"
                          onClick={() => setSelectedAvatar(avatar)}
                          className={`py-3 rounded-xl border text-xl flex items-center justify-center transition-all ${
                            selectedAvatar === avatar 
                              ? 'bg-emerald-50 border-emerald-500 ring-2 ring-emerald-500/10' 
                              : 'border-slate-150 hover:bg-slate-50'
                          }`}
                        >
                          {avatar}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Card Preview */}
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-2">
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Tampilan Kartu Santri</p>
                    <div className="bg-white p-3.5 rounded-xl border border-slate-200/50 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl bg-slate-50 p-1.5 rounded-lg">{selectedAvatar}</span>
                        <div>
                          <h4 className="font-extrabold text-slate-800 text-xs">{newStudentName || 'Nama Santri'}</h4>
                          <p className="text-[10px] text-slate-500 mt-0.5">Kelas: {newStudentClass}</p>
                        </div>
                      </div>
                      <span className="text-[10px] bg-amber-50 text-amber-700 font-bold px-2 py-0.5 rounded">🔥 1 Hari Streak</span>
                    </div>
                  </div>

                  {/* Submit button */}
                  <button
                    type="submit"
                    className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-colors shadow-xs"
                    id="btn-register-student-submit"
                  >
                    <Plus className="w-4 h-4" /> Daftarkan Santri Baru
                  </button>

                </form>
              </div>
            </div>

            {/* Right Column: Daftar Santri Terdaftar (span 7) */}
            <div className="lg:col-span-7 space-y-4">
              <div className="bg-white rounded-3xl border border-slate-200/60 p-6 shadow-sm space-y-5">
                <div className="border-b border-slate-100 pb-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div>
                    <h3 className="text-base font-extrabold text-slate-800 flex items-center gap-2">
                      <Users className="w-5 h-5 text-emerald-600" /> Daftar Santri Terdaftar
                    </h3>
                    <p className="text-slate-400 text-[11px] mt-0.5">Kelola dan lihat informasi {displaySantriList.length} santri aktif.</p>
                  </div>
                  
                  {/* Search bar */}
                  <div className="relative w-full sm:w-48">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Cari nama santri..."
                      value={studentSearchQuery}
                      onChange={(e) => setStudentSearchQuery(e.target.value)}
                      className="w-full pl-8 pr-3 py-1.5 border border-slate-200 rounded-xl focus:outline-emerald-500 text-xs"
                    />
                  </div>
                </div>

                <div className="space-y-3 max-h-[520px] overflow-y-auto pr-1">
                  {displaySantriList
                    .filter((s) => s.name.toLowerCase().includes(studentSearchQuery.toLowerCase()))
                    .map((santri) => (
                      <div 
                        key={santri.id}
                        className="p-3.5 bg-slate-50 hover:bg-slate-100/60 rounded-2xl border border-slate-100/80 flex items-center justify-between gap-3 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-2xl bg-white p-2 rounded-xl shadow-xs border border-slate-150">{santri.avatar}</span>
                          <div>
                            <h4 className="font-extrabold text-slate-800 text-xs flex items-center gap-1.5">
                              {santri.name}
                              <span className={`text-[9px] font-extrabold px-1.5 py-0.2 rounded border ${
                                santri.gender === 'P'
                                  ? 'bg-fuchsia-50 border-fuchsia-100 text-fuchsia-700'
                                  : 'bg-blue-50 border-blue-100 text-blue-700'
                              }`}>
                                {santri.gender === 'P' ? 'P' : 'L'}
                              </span>
                            </h4>
                            <div className="flex flex-wrap items-center gap-1.5 mt-1 text-[10px] text-slate-500 font-medium">
                              <span className="bg-emerald-50 text-emerald-700 border border-emerald-100 font-bold px-1.5 py-0.2 rounded">{santri.class}</span>
                              <span>•</span>
                              <span className="flex items-center gap-1">
                                <Lock className="w-3 h-3 text-slate-400" /> PIN: <strong className="font-mono text-xs text-slate-700 bg-white border border-slate-200 px-1 py-0.2 rounded font-extrabold">{santri.pin}</strong>
                              </span>
                              <span>•</span>
                              <span className="text-amber-700 font-extrabold">🔥 {santri.streak} Streak</span>
                            </div>
                          </div>
                        </div>

                        {/* Edit and Delete Actions */}
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => {
                              setEditingStudent(santri);
                              setEditName(santri.name);
                              setEditClass(santri.class);
                              setEditPin(santri.pin);
                              setEditAvatar(santri.avatar);
                              setEditGender(santri.gender || 'L');
                            }}
                            className="p-2 bg-white hover:bg-emerald-50 hover:text-emerald-700 text-slate-500 rounded-xl border border-slate-200 transition-colors shadow-2xs"
                            title="Ubah Profil Santri"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => onDeleteSantri(santri.id)}
                            className="p-2 bg-white hover:bg-red-50 hover:text-red-600 text-slate-500 rounded-xl border border-slate-200 transition-colors shadow-2xs"
                            title="Hapus Santri"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}

                  {displaySantriList.filter((s) => s.name.toLowerCase().includes(studentSearchQuery.toLowerCase())).length === 0 && (
                    <div className="py-12 text-center text-slate-400">
                      <p className="text-xs font-semibold">Belum ada santri terdaftar atau tidak sesuai kata pencarian.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* 3. FEED LAPORAN TAB */}
        {activeTab === 'feed-laporan' && (
          <motion.div
            key="feed-view"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-4"
          >
            {/* Filter and Search Box */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200/60 shadow-xs flex flex-col md:flex-row gap-3 items-center justify-between">
              {/* Search input */}
              <div className="relative w-full md:max-w-md">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Cari nama santri atau surah yang diuji..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 border border-slate-200 bg-slate-50/20 rounded-xl focus:outline-emerald-500 text-xs shadow-xs"
                  id="feed-report-search"
                />
              </div>

              {/* Status Filters */}
              <div className="flex items-center gap-1.5 w-full md:w-auto">
                <span className="text-[11px] font-bold text-slate-400 uppercase hidden sm:inline flex-shrink-0">Filter Status:</span>
                <div className="bg-slate-100 p-1 rounded-xl flex w-full sm:w-auto">
                  <button
                    type="button"
                    onClick={() => setStatusFilter('all')}
                    className={`flex-1 sm:flex-initial py-1.5 px-3 rounded-lg text-[11px] font-bold transition-all ${
                      statusFilter === 'all' ? 'bg-white text-emerald-800 shadow-xs' : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    Semua
                  </button>
                  <button
                    type="button"
                    onClick={() => setStatusFilter('pending')}
                    className={`flex-1 sm:flex-initial py-1.5 px-3 rounded-lg text-[11px] font-bold transition-all flex items-center gap-1 ${
                      statusFilter === 'pending' ? 'bg-white text-emerald-800 shadow-xs' : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    Belum Dinilai {pendingReportsCount > 0 && <span className="w-1.5 h-1.5 bg-red-500 rounded-full"></span>}
                  </button>
                  <button
                    type="button"
                    onClick={() => setStatusFilter('verified')}
                    className={`flex-1 sm:flex-initial py-1.5 px-3 rounded-lg text-[11px] font-bold transition-all ${
                      statusFilter === 'verified' ? 'bg-white text-emerald-800 shadow-xs' : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    Selesai
                  </button>
                </div>
              </div>
            </div>

            {/* Split Grid for list feed and inspector */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Left Column: List Feed */}
              <div className="lg:col-span-2 space-y-4">
                {filteredReports.length === 0 ? (
                  <div className="bg-white py-16 px-6 text-center border border-slate-200/60 rounded-3xl">
                    <span className="text-4xl">📭</span>
                    <p className="text-slate-500 text-xs font-semibold mt-3">Tidak ditemukan laporan harian santri.</p>
                  </div>
                ) : (
                  sortedDates.map((dateGroup) => (
                    <div key={dateGroup} className="space-y-2.5 mb-5">
                      <div className="flex items-center gap-2.5 px-1.5 py-1">
                        <span className="h-2 w-2 rounded-full bg-emerald-600 shadow-xs"></span>
                        <h3 className="text-[11px] font-extrabold text-slate-700 uppercase tracking-wider">
                          {formatGroupDate(dateGroup)}
                        </h3>
                        <span className="text-[10px] text-slate-400 font-bold bg-slate-100 px-2 py-0.5 rounded-full">
                          {reportsByDate[dateGroup].length} Laporan
                        </span>
                        <div className="flex-1 h-[1px] bg-slate-200/60"></div>
                      </div>

                      <div className="space-y-3">
                        {reportsByDate[dateGroup].map((report) => {
                          const isSelected = selectedReport?.id === report.id;
                          const completedPrayers = Object.values(report.shalat).filter((p: any) => {
                            if (typeof p === 'boolean') return p;
                            return p && p.performed;
                          }).length;
                          
                          return (
                            <div
                              key={report.id}
                              onClick={() => {
                                setSelectedReport(report);
                                setManualFeedback(report.feedback || '');
                              }}
                              className={`p-4 rounded-2xl border transition-all cursor-pointer text-left bg-white flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 ${
                                isSelected 
                                  ? 'border-emerald-600 ring-2 ring-emerald-500/10 shadow-md' 
                                  : 'border-slate-100 hover:border-slate-200 shadow-sm'
                              }`}
                              id={`feed-card-${report.id}`}
                            >
                              <div className="flex items-center gap-3.5">
                                <span className="text-2xl bg-emerald-50 p-2.5 rounded-xl block">📖</span>
                                <div>
                                  <h4 className="font-bold text-slate-800 text-sm">{report.santriName}</h4>
                                  <p className="text-xs text-slate-500 flex items-center gap-1.5 mt-0.5">
                                    <span>📅 {report.date}</span>
                                    <span>•</span>
                                    <span className="text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded text-[10px]">
                                      {report.quran.type === 'quran' ? 'Al-Qur\'an' : 'Iqro\''}
                                    </span>
                                  </p>
                                  <div className="flex flex-wrap items-center gap-1.5 mt-1.5 text-[11px] text-slate-600 bg-slate-100 px-2 py-0.5 rounded-lg w-fit">
                                    <span>🕌 Shalat: {completedPrayers}/5 waktu</span>
                                    {report.tahajud && <span className="text-[9px] text-indigo-700 font-bold bg-indigo-50 px-1.5 py-0.2 rounded border border-indigo-100/55">Tahajud</span>}
                                    {report.bantuOrangTua.checked && <span className="text-[9px] text-pink-700 font-bold bg-pink-50 px-1.5 py-0.2 rounded border border-pink-100/55">Bantu Ortu</span>}
                                  </div>
                                </div>
                              </div>

                              <div className="flex items-center gap-2 self-end sm:self-auto">
                                {report.status === 'verified' ? (
                                  <span className="inline-flex items-center gap-1 text-[10px] text-emerald-700 bg-emerald-50 border border-emerald-100 font-bold px-2.5 py-1 rounded-full">
                                    <CheckCircle className="w-3.5 h-3.5" /> Terverifikasi
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 text-[10px] text-amber-700 bg-amber-50 border border-amber-100 font-bold px-2.5 py-1 rounded-full animate-pulse">
                                    <Info className="w-3.5 h-3.5" /> Belum Dinilai
                                  </span>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Right Column: Detailed Inspector Panel */}
              <div className="bg-white rounded-3xl border border-slate-200/60 p-5 shadow-sm h-fit">
                <AnimatePresence mode="wait">
                  {selectedReport ? (
                    <motion.div
                      key={selectedReport.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="space-y-5"
                    >
                      <div className="border-b border-slate-100 pb-3 flex items-start justify-between">
                        <div>
                          <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Detail Evaluasi Santri</span>
                          <h3 className="font-extrabold text-slate-800 text-base">{selectedReport.santriName}</h3>
                          <p className="text-xs text-slate-500 mt-0.5">Tanggal Lapor: {selectedReport.date}</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => setSelectedReport(null)}
                          className="text-slate-400 hover:text-slate-600 text-xs font-bold"
                        >
                          Tutup
                        </button>
                      </div>

                      {/* Checklist details */}
                      <div className="space-y-4 text-xs">
                        
                        {/* Shalat */}
                        <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200/50">
                          <h4 className="font-extrabold text-slate-800 text-xs mb-2.5 flex items-center gap-1.5">
                            <span>🕌</span> Laporan Detail Shalat 5 Waktu
                          </h4>
                          <div className="space-y-2.5">
                            {Object.entries(selectedReport.shalat).map(([key, value]) => {
                              // Normalize legacy boolean values to the object structure
                              const detail = typeof value === 'boolean'
                                ? { performed: value, time: value ? 'Selesai' : '', photo: '', excuse: !value ? 'Tanpa keterangan' : '' }
                                : value as any;
                                
                              const label = key.charAt(0).toUpperCase() + key.slice(1);
                              const isDone = !!detail?.performed;
                              
                              const getIcon = () => {
                                switch(key) {
                                  case 'subuh': return '🌅';
                                  case 'dzuhur': return '☀️';
                                  case 'ashar': return '🌤️';
                                  case 'maghrib': return '🌇';
                                  case 'isya': return '🌙';
                                  default: return '🕌';
                                }
                              };

                              const getPrayerDayLabel = (prayerKey: string) => {
                                if (!selectedReport.date) return '';
                                try {
                                  const dateObj = new Date(selectedReport.date);
                                  if (prayerKey === 'maghrib' || prayerKey === 'isya') {
                                    dateObj.setDate(dateObj.getDate() - 1);
                                    const dayName = dateObj.toLocaleDateString('id-ID', { weekday: 'long' });
                                    const dateNum = dateObj.getDate();
                                    const monthName = dateObj.toLocaleDateString('id-ID', { month: 'short' });
                                    return `${dayName}, ${dateNum} ${monthName} (Kemarin)`;
                                  } else {
                                    const dayName = dateObj.toLocaleDateString('id-ID', { weekday: 'long' });
                                    const dateNum = dateObj.getDate();
                                    const monthName = dateObj.toLocaleDateString('id-ID', { month: 'short' });
                                    return `${dayName}, ${dateNum} ${monthName} (Hari Ini)`;
                                  }
                                } catch (e) {
                                  return '';
                                }
                              };

                              return (
                                <div key={key} className="flex flex-col gap-1.5 p-2 bg-white rounded-xl border border-slate-200/40">
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                      <span className="text-base">{getIcon()}</span>
                                      <div>
                                        <span className="font-bold text-slate-700 text-xs block leading-tight">{label}</span>
                                        <span className={`text-[9px] font-bold block leading-tight ${key === 'maghrib' || key === 'isya' ? 'text-amber-600' : 'text-emerald-600'}`}>
                                          {getPrayerDayLabel(key)}
                                        </span>
                                      </div>
                                    </div>
                                    
                                    <div className="flex items-center gap-1.5 text-[10px]">
                                      {isDone ? (
                                        <span className="bg-emerald-50 text-emerald-800 border border-emerald-100 px-2 py-0.5 rounded-lg font-bold">
                                          Shalat {detail.time ? `(${detail.time})` : ''}
                                        </span>
                                      ) : (
                                        <span className="bg-red-50 text-red-700 border border-red-100 px-2 py-0.5 rounded-lg font-bold">
                                          Tidak Shalat
                                        </span>
                                      )}
                                    </div>
                                  </div>

                                  {/* Anti-Cheating Smart Verification Badges */}
                                  {isDone && (
                                    <div className="flex flex-wrap gap-1 px-1 text-[9px] font-bold">
                                      {(() => {
                                        const analysis = checkTimeValidity(key, detail.time);
                                        if (!detail.time) return null;
                                        return (
                                          <span className={`px-1.5 py-0.5 rounded-md ${
                                            analysis.isValid 
                                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-100/50' 
                                              : 'bg-amber-50 text-amber-700 border border-amber-100/50'
                                          }`}>
                                            ⏱️ {analysis.msg}
                                          </span>
                                        );
                                      })()}

                                      {detail.inputTimestamp && (
                                        <span className="bg-slate-50 text-slate-600 border border-slate-100 px-1.5 py-0.5 rounded-md font-mono">
                                          🕒 Diinput Ortu: {detail.inputTimestamp}
                                        </span>
                                      )}

                                      {detail.photo && (
                                        <span className={`px-1.5 py-0.5 rounded-md ${
                                          detail.isLiveCamera 
                                            ? 'bg-blue-50 text-blue-700 border border-blue-100/50' 
                                            : 'bg-purple-50 text-purple-600 border border-purple-100/50'
                                        }`}>
                                          {detail.isLiveCamera ? '📸 Kamera Langsung (Asli)' : '🖼️ Unggah File'}
                                        </span>
                                      )}
                                    </div>
                                  )}

                                  {/* Conditional display of photo or excuse */}
                                  {isDone ? (
                                    detail.photo ? (
                                      <div className="mt-1 flex items-center gap-2.5 bg-slate-50 p-1.5 rounded-lg border border-slate-200/30">
                                        <img 
                                          src={detail.photo} 
                                          alt={`Foto shalat ${key}`} 
                                          className="w-12 h-12 object-cover rounded-md border border-white shadow-xs cursor-pointer hover:opacity-85 transition-opacity"
                                          onClick={() => setPreviewPhoto(detail.photo)}
                                          referrerPolicy="no-referrer"
                                        />
                                        <div>
                                          <p className="text-[9px] font-extrabold text-slate-500 uppercase tracking-wider">Foto Pelaksanaan</p>
                                          <p className="text-[10px] text-slate-600 font-semibold">Klik untuk memperbesar</p>
                                        </div>
                                      </div>
                                    ) : (
                                      <p className="text-[10px] text-slate-400 italic pl-1.5 mt-0.5">• Tanpa melampirkan foto</p>
                                    )
                                  ) : (
                                    <div className="mt-0.5 text-[10px] text-slate-600 pl-1.5 bg-red-50/40 p-1.5 rounded-lg border border-red-100/30">
                                      <span className="font-extrabold text-red-800">Alasan: </span>
                                      <span className="font-medium italic text-slate-700">"{detail.excuse || 'Tidak ada keterangan'}"</span>
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>

                        {/* Additional worships */}
                        <div className="space-y-2.5">
                          <h4 className="font-bold text-slate-700">🌠 Amalan Sunnah & Zikir</h4>
                          <div className="grid grid-cols-3 gap-1.5 text-center text-[10px]">
                            <div className={`p-1.5 rounded-xl border ${selectedReport.tahajud ? 'bg-indigo-50 border-indigo-100 text-indigo-800 font-bold' : 'bg-slate-50 border-slate-100 text-slate-400'}`}>
                              Tahajud {selectedReport.tahajud ? '✅' : '❌'}
                            </div>
                            <div className={`p-1.5 rounded-xl border ${selectedReport.witir ? 'bg-indigo-50 border-indigo-100 text-indigo-800 font-bold' : 'bg-slate-50 border-slate-100 text-slate-400'}`}>
                              Witir {selectedReport.witir ? '✅' : '❌'}
                            </div>
                            <div className={`p-1.5 rounded-xl border ${selectedReport.zikir ? 'bg-indigo-50 border-indigo-100 text-indigo-800 font-bold' : 'bg-slate-50 border-slate-100 text-slate-400'}`}>
                              Zikir {selectedReport.zikir ? '✅' : '❌'}
                            </div>
                          </div>

                          {selectedReport.tahajud && (
                            <div className="p-3 bg-indigo-50/40 border border-indigo-100/50 rounded-xl space-y-2 text-xs">
                              <div className="flex items-center justify-between">
                                <span className="font-bold text-indigo-900 flex items-center gap-1">
                                  <Clock className="w-3.5 h-3.5" /> Jam Tahajud
                                </span>
                                <span className="font-extrabold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100 font-mono">
                                  {selectedReport.tahajudTime || 'Tidak tercatat'}
                                </span>
                              </div>
                              {selectedReport.tahajudPhoto ? (
                                <div className="space-y-1">
                                  <p className="text-[10px] text-indigo-700 font-bold">Foto Bukti Tahajud:</p>
                                  <div className="relative w-fit bg-white rounded-lg p-1 border border-indigo-100 shadow-xs max-w-[150px] overflow-hidden">
                                    <img 
                                      src={selectedReport.tahajudPhoto} 
                                      alt="Bukti Tahajud" 
                                      className="max-h-[100px] w-auto rounded-md object-cover"
                                      referrerPolicy="no-referrer"
                                    />
                                  </div>
                                </div>
                              ) : (
                                <p className="text-[10px] text-slate-400 italic">• Tanpa foto bukti</p>
                              )}
                            </div>
                          )}
                        </div>

                        {/* Quran progress */}
                        <div className="p-3 bg-emerald-50/50 border border-emerald-100 rounded-xl space-y-2">
                          <h4 className="font-bold text-emerald-800 flex items-center gap-1.5">
                            <BookOpen className="w-4 h-4 text-emerald-700" /> Capaian Bacaan Ngaji
                          </h4>
                          <div>
                            <p className="text-slate-800 font-bold text-xs">
                              {selectedReport.quran.type === 'quran' ? 'Al-Qur\'an' : 'Iqro\''}
                            </p>
                            <p className="text-slate-600 font-semibold text-xs mt-0.5">
                              {selectedReport.quran.surahOrJilid} : {selectedReport.quran.ayatOrHalaman}
                            </p>
                          </div>
                          {selectedReport.quran.photo && (
                            <div className="space-y-1 pt-1 border-t border-emerald-200/30">
                              <p className="text-[10px] text-emerald-700 font-bold">Foto Bukti Ngaji:</p>
                              <div className="relative w-fit bg-white rounded-lg p-1 border border-emerald-100 shadow-xs max-w-[150px] overflow-hidden">
                                <img 
                                  src={selectedReport.quran.photo} 
                                  alt="Bukti Membaca" 
                                  className="max-h-[100px] w-auto rounded-md object-cover"
                                  referrerPolicy="no-referrer"
                                />
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Bakti ke ortu */}
                        {selectedReport.bantuOrangTua.checked && (
                          <div className="p-3 bg-pink-50/40 border border-pink-100 rounded-xl space-y-2">
                            <h4 className="font-bold text-pink-800 flex items-center gap-1.5">
                              <Heart className="w-4 h-4 text-pink-600" /> Berbakti Ke Orang Tua
                            </h4>
                            <p className="text-slate-700 italic text-[11px] font-medium leading-relaxed bg-white/65 p-2 rounded-lg border border-pink-100/40">
                              "{selectedReport.bantuOrangTua.description}"
                            </p>
                            {selectedReport.bantuOrangTua.photo && (
                              <div className="space-y-1 pt-1 border-t border-pink-200/30">
                                <p className="text-[10px] text-pink-700 font-bold">Foto Bukti Kebaikan:</p>
                                <div className="relative w-fit bg-white rounded-lg p-1 border border-pink-100 shadow-xs max-w-[150px] overflow-hidden">
                                  <img 
                                    src={selectedReport.bantuOrangTua.photo} 
                                    alt="Bukti Kebaikan" 
                                    className="max-h-[100px] w-auto rounded-md object-cover"
                                    referrerPolicy="no-referrer"
                                  />
                                </div>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Digital Signature display */}
                        <div className="p-3 border border-slate-200 bg-slate-50 rounded-xl">
                          <h4 className="font-bold text-slate-700 mb-1">Tanda Tangan Orang Tua</h4>
                          <p className="text-[9px] text-slate-400 mb-2">Ditandatangani oleh: {selectedReport.parentName}</p>
                          {selectedReport.parentSignature ? (
                            <div className="bg-white border rounded-lg p-2 flex justify-center">
                              <img 
                                src={selectedReport.parentSignature} 
                                alt="Tanda Tangan Orang Tua" 
                                className="max-h-[70px] object-contain"
                                referrerPolicy="no-referrer"
                              />
                            </div>
                          ) : (
                            <p className="text-[10px] text-red-500 font-extrabold">⚠️ Tanda tangan tidak ditemukan</p>
                          )}
                        </div>

                      </div>

                      {/* AI Correction & Feedback Formulation */}
                      <div className="border-t border-slate-100 pt-4 space-y-3">
                        <div className="flex justify-between items-center">
                          <label className="text-[11px] font-bold text-slate-700 flex items-center gap-1">
                            <MessageSquare className="w-4 h-4 text-emerald-600" /> Catatan Ustadz
                          </label>
                          
                          {/* AI Assistant Button */}
                          <button
                            type="button"
                            disabled={isAiLoading}
                            onClick={() => handleAiEvaluation(selectedReport)}
                            className="text-[9px] bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-1 rounded-lg font-bold hover:bg-emerald-100 flex items-center gap-1 transition-all"
                            id="btn-ai-evaluate-feed"
                          >
                            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                            {isAiLoading ? 'Menyusun...' : 'AI Evaluasi Otomatis'}
                          </button>
                        </div>

                        <textarea
                          value={manualFeedback}
                          onChange={(e) => setManualFeedback(e.target.value)}
                          placeholder="Tulis pujian Islami atau bimbingan untuk santri di sini..."
                          className="w-full text-xs p-2.5 border border-slate-200 bg-white rounded-xl focus:outline-emerald-500 min-h-[90px] resize-none leading-relaxed"
                          id="feed-feedback-textarea"
                        />

                        {selectedReport.status === 'pending' ? (
                          <button
                            type="button"
                            onClick={() => handleVerifySubmit(selectedReport.id)}
                            className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-colors shadow-xs"
                            id="btn-verify-feed"
                          >
                            <Check className="w-4 h-4" /> Verifikasi & Kirim Feedback
                          </button>
                        ) : (
                          <div className="bg-emerald-50 border border-emerald-200/50 p-2.5 rounded-xl flex flex-col items-center justify-center text-[11px] text-emerald-800 font-bold gap-1">
                            <span>✓ Laporan ini sudah divalidasi</span>
                            <span className="text-[10px] bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded border border-emerald-200">
                              Diverifikasi oleh: {selectedReport.verifiedBy || 'Guru Ngaji'}
                            </span>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  ) : (
                    <div className="py-16 text-center text-slate-400">
                      <Info className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                      <h4 className="font-bold text-xs">Pilih laporan di feed</h4>
                      <p className="text-[10px] max-w-[180px] mx-auto mt-1">Untuk meninjau shalat harian, bacaan ngaji, tanda tangan orang tua, dan memberikan tanggapan bertenaga AI.</p>
                    </div>
                  )}
                </AnimatePresence>
              </div>

            </div>
          </motion.div>
        )}

        {/* 4. REKAP LAPORAN TAB */}
        {activeTab === 'rekap-laporan' && (
          <motion.div
            key="rekap-view"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-4"
          >
            {/* Top Toolbar */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200/60 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
              <div>
                <h3 className="text-xs font-bold text-slate-700">Tabel Rekapitulasi Progres Belajar Santri</h3>
                <p className="text-[10px] text-slate-400 mt-0.5">Rangkuman data keaktifan, pencapaian shalat, dan bacaan mengaji terakhir.</p>
              </div>
              
              <button
                type="button"
                onClick={handleSimulateExport}
                className="py-2 px-3.5 bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100/70 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-all w-full sm:w-auto justify-center"
              >
                <Download className="w-4 h-4" /> Ekspor Rekap (Cetak / PDF)
              </button>
            </div>

            {/* Table layout */}
            <div className="bg-white rounded-3xl border border-slate-200/60 overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50/80 border-b border-slate-200/70 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      <th className="py-3 px-4 text-center">No</th>
                      <th className="py-3 px-4">Santri / Profil</th>
                      <th className="py-3 px-4">Tingkat Kelas</th>
                      <th className="py-3 px-4 text-center">PIN Masuk</th>
                      <th className="py-3 px-4 text-center">Streak</th>
                      <th className="py-3 px-4 text-center">Total Laporan</th>
                      <th className="py-3 px-4 text-center">Disiplin Shalat</th>
                      <th className="py-3 px-4">Bacaan Terakhir</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                    {displaySantriList.map((santri, index) => {
                      const santriReports = displayReports.filter(r => r.santriId === santri.id);
                      const verifiedCount = santriReports.filter(r => r.status === 'verified').length;
                      
                      // Calculate average prayer score specifically for this student
                      let averagePrayer = 0;
                      if (santriReports.length > 0) {
                        let totalDone = 0;
                        santriReports.forEach(r => {
                          if (r.shalat.subuh) totalDone++;
                          if (r.shalat.dzuhur) totalDone++;
                          if (r.shalat.ashar) totalDone++;
                          if (r.shalat.maghrib) totalDone++;
                          if (r.shalat.isya) totalDone++;
                        });
                        averagePrayer = Math.round((totalDone / (santriReports.length * 5)) * 100);
                      }

                      // Find the last read progress
                      const lastReport = [...santriReports].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];
                      const lastRead = lastReport 
                        ? `${lastReport.quran.type === 'quran' ? 'QS.' : 'Iqro'} ${lastReport.quran.surahOrJilid} (${lastReport.quran.ayatOrHalaman})`
                        : 'Belum Melapor';

                      return (
                        <tr key={santri.id} className="hover:bg-slate-50/45 transition-colors">
                          <td className="py-3.5 px-4 text-center text-slate-400 font-bold">{index + 1}</td>
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-2.5">
                              <span className="text-xl">{santri.avatar}</span>
                              <span className="font-extrabold text-slate-800 text-xs flex items-center gap-1.5">
                                {santri.name}
                                <span className={`text-[9px] font-extrabold px-1.5 py-0.2 rounded border ${
                                  santri.gender === 'P'
                                    ? 'bg-fuchsia-50 border-fuchsia-100 text-fuchsia-700'
                                    : 'bg-blue-50 border-blue-100 text-blue-700'
                                }`}>
                                  {santri.gender === 'P' ? 'P' : 'L'}
                                </span>
                              </span>
                            </div>
                          </td>
                          <td className="py-3.5 px-4 text-slate-600 font-semibold">{santri.class}</td>
                          <td className="py-3.5 px-4 text-center">
                            <span className="font-mono bg-slate-100 text-slate-700 font-bold px-2 py-0.5 rounded text-[11px] inline-flex items-center gap-1 border border-slate-200/50" title="PIN untuk masuk Mode Santri">
                              🔑 {santri.pin || '1234'}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-center">
                            <span className="inline-flex items-center gap-0.5 text-[10px] text-amber-700 bg-amber-50 px-2 py-0.5 rounded font-bold border border-amber-200/30">
                              🔥 {santri.streak}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-center text-slate-500">
                            <strong>{santriReports.length}</strong> kali 
                            <span className="text-[10px] text-slate-400 font-normal"> ({verifiedCount} verif)</span>
                          </td>
                          <td className="py-3.5 px-4 text-center">
                            {santriReports.length > 0 ? (
                              <div className="flex items-center justify-center gap-1.5">
                                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                                  averagePrayer >= 80 ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
                                }`}>
                                  {averagePrayer}%
                                </span>
                              </div>
                            ) : (
                              <span className="text-slate-300">-</span>
                            )}
                          </td>
                          <td className="py-3.5 px-4 text-xs font-semibold text-slate-600">
                            {lastReport ? (
                              <span className="inline-flex items-center gap-1 bg-emerald-50/50 text-emerald-800 px-2 py-0.5 rounded border border-emerald-100/40">
                                📖 {lastRead}
                              </span>
                            ) : (
                              <span className="text-slate-300 italic">{lastRead}</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}

                    {displaySantriList.length === 0 && (
                      <tr>
                        <td colSpan={8} className="py-12 text-center text-slate-400">
                          Belum ada data santri terdaftar.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </motion.div>
        )}

      </AnimatePresence>

      {/* Photo Preview Modal Overlay */}
      <AnimatePresence>
        {previewPhoto && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setPreviewPhoto(null)}
            className="fixed inset-0 bg-black/80 backdrop-blur-xs z-50 flex items-center justify-center p-4 cursor-zoom-out"
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              onClick={(e) => e.stopPropagation()}
              className="relative max-w-lg w-full bg-slate-900 rounded-3xl p-3 border border-white/10 shadow-2xl flex flex-col items-center animate-in fade-in zoom-in-95 duration-200"
            >
              <img 
                src={previewPhoto} 
                alt="Foto Pembuktian Shalat" 
                className="max-h-[70vh] w-auto object-contain rounded-2xl shadow-lg border border-white/5"
                referrerPolicy="no-referrer"
              />
              <div className="w-full text-center mt-3 flex justify-between items-center px-2">
                <span className="text-white/60 text-[10px] font-bold font-mono">Foto Bukti Ibadah</span>
                <button
                  type="button"
                  onClick={() => setPreviewPhoto(null)}
                  className="bg-white/15 hover:bg-white/20 text-white text-xs font-bold px-3 py-1.5 rounded-xl transition-all"
                >
                  Tutup
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Edit Student Modal Overlay */}
      <AnimatePresence>
        {editingStudent && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.95, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 15 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-3xl p-6 border border-slate-200 max-w-md w-full shadow-2xl space-y-5"
            >
              <div className="border-b border-slate-100 pb-3 flex justify-between items-center">
                <h3 className="text-base font-extrabold text-slate-800 flex items-center gap-2">
                  <Edit className="w-5 h-5 text-emerald-600" /> Edit Profil Santri
                </h3>
                <button
                  type="button"
                  onClick={() => setEditingStudent(null)}
                  className="text-slate-400 hover:text-slate-600 text-sm font-bold p-1"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleSaveEdit} className="space-y-4">
                {/* Name */}
                <div>
                  <label className="text-[11px] font-bold text-slate-500 uppercase block mb-1.5">Nama Lengkap Santri</label>
                  <input
                    type="text"
                    required
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full text-xs p-3 border border-slate-200 bg-slate-50 rounded-xl focus:outline-emerald-500 font-semibold"
                  />
                </div>

                {/* Gender selection */}
                <div>
                  <label className="text-[11px] font-bold text-slate-500 uppercase block mb-1.5 font-sans">Jenis Kelamin</label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setEditGender('L')}
                      className={`py-2 rounded-xl border text-xs font-extrabold flex items-center justify-center gap-1.5 transition-all ${
                        editGender === 'L'
                          ? 'bg-blue-50 border-blue-500 text-blue-700 ring-2 ring-blue-500/10'
                          : 'border-slate-200 hover:bg-slate-50 text-slate-600'
                      }`}
                    >
                      👦 Laki-laki (L)
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditGender('P')}
                      className={`py-2 rounded-xl border text-xs font-extrabold flex items-center justify-center gap-1.5 transition-all ${
                        editGender === 'P'
                          ? 'bg-fuchsia-50 border-fuchsia-500 text-fuchsia-700 ring-2 ring-fuchsia-500/10'
                          : 'border-slate-200 hover:bg-slate-50 text-slate-600'
                      }`}
                    >
                      👧 Perempuan (P)
                    </button>
                  </div>
                </div>

                {/* Class */}
                <div>
                  <label className="text-[11px] font-bold text-slate-500 uppercase block mb-1.5">Kelas / Tingkat Mengaji</label>
                  <select
                    value={editClass}
                    onChange={(e) => setEditClass(e.target.value)}
                    className="w-full text-xs p-3 border border-slate-200 bg-white rounded-xl focus:outline-emerald-500 font-semibold"
                  >
                    {classOptions.map((opt) => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>

                  {editClass === 'Kustom / Kelas Lainnya...' && (
                    <motion.div
                      initial={{ opacity: 0, y: -5 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mt-2"
                    >
                      <label className="text-[10px] font-bold text-emerald-600 uppercase block mb-1">Nama Kelas Baru (Kustom)</label>
                      <input
                        type="text"
                        required
                        placeholder="Contoh: Kelas Iqro Khusus"
                        value={customEditClass}
                        onChange={(e) => setCustomEditClass(e.target.value)}
                        className="w-full text-xs p-3 border border-emerald-300 bg-emerald-50/10 rounded-xl focus:outline-emerald-500 font-semibold"
                      />
                    </motion.div>
                  )}
                </div>

                {/* PIN */}
                <div>
                  <label className="text-[11px] font-bold text-slate-500 uppercase block mb-1.5">PIN / Sandi Masuk (4-Digit)</label>
                  <input
                    type="text"
                    required
                    maxLength={6}
                    value={editPin}
                    onChange={(e) => setEditPin(e.target.value.replace(/\D/g, ''))}
                    className="w-full text-xs p-3 border border-slate-200 bg-slate-50 rounded-xl focus:outline-emerald-500 font-mono tracking-widest text-center text-sm font-bold"
                  />
                </div>

                {/* Avatar Selection */}
                <div>
                  <label className="text-[11px] font-bold text-slate-500 uppercase block mb-2">Pilih Avatar Profil</label>
                  <div className="grid grid-cols-4 gap-2">
                    {avatarsList.map((avatar) => (
                      <button
                        key={avatar}
                        type="button"
                        onClick={() => setEditAvatar(avatar)}
                        className={`py-2 rounded-xl border text-xl flex items-center justify-center transition-all ${
                          editAvatar === avatar 
                            ? 'bg-emerald-50 border-emerald-500 ring-2 ring-emerald-500/10' 
                            : 'border-slate-150 hover:bg-slate-50'
                        }`}
                      >
                        {avatar}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setEditingStudent(null)}
                    className="flex-1 py-2.5 border border-slate-200 hover:bg-slate-50 text-slate-600 font-bold rounded-xl text-xs transition-colors"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs transition-colors"
                  >
                    Simpan Perubahan
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
