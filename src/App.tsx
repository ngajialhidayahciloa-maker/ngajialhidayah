import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  BookOpen, Users, Star, ClipboardCheck, Sparkles, 
  UserCheck, ShieldCheck, Moon, Heart, Award, RefreshCw, Lock
} from 'lucide-react';
import { Santri, Report, Attendance } from './types';
import SantriForm from './components/SantriForm';
import GuruDashboard from './components/GuruDashboard';
import { 
  getSantriFromFirestore, 
  getReportsFromFirestore, 
  getAttendanceFromFirestore, 
  saveSantriToFirestore, 
  deleteSantriFromFirestore, 
  saveReportToFirestore, 
  saveAttendanceListToFirestore, 
  seedInitialData,
  getPinsFromFirestore,
  savePinsToFirestore
} from './firebase';

// Mock Initial Santri Profiles
const INITIAL_SANTRI: Santri[] = [
  { id: 's1', name: 'Aisyah Zahra', class: 'Al-Qur\'an (Lancar)', streak: 8, avatar: '👧', pin: '1234', gender: 'P' },
  { id: 's2', name: 'Fatih Al-Fatih', class: 'Tahfidz', streak: 5, avatar: '👦', pin: '4321', gender: 'L' },
  { id: 's3', name: 'Rizky Ramadhan', class: 'Iqro 4', streak: 2, avatar: '👶', pin: '5678', gender: 'L' },
];

// Mock Initial Reports to populate the Dashboard immediately
const INITIAL_REPORTS: Report[] = [
  {
    id: 'r1',
    date: new Date().toISOString().split('T')[0],
    santriId: 's1',
    santriName: 'Aisyah Zahra',
    shalat: {
      subuh: { performed: true, time: '04:45' },
      dzuhur: { performed: true, time: '12:05' },
      ashar: { performed: true, time: '15:20' },
      maghrib: { performed: true, time: '18:10' },
      isya: { performed: true, time: '19:25' }
    },
    tahajud: true,
    witir: true,
    zikir: true,
    quran: { type: 'quran', surahOrJilid: 'Al-Mulk', ayatOrHalaman: '1-15' },
    bantuOrangTua: { checked: true, description: 'Menyuapi adik makan dan melipat pakaian.' },
    parentName: 'Ibu Fatimah',
    parentSignature: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAKAAAABaCAYAAAA', // Simplified mock base64 signature
    status: 'verified',
    feedback: 'Masya Allah, Ananda Aisyah! Sangat luar biasa laporan ibadahmu hari ini. Shalat 5 waktu tertib, ditambah tahajud & wirid, dan sangat berbakti membantu Ibu melipat pakaian. Pertahankan prestasimu ya sayang!',
    parentFeedback: 'Alhamdulillah, terima kasih ulasan dan bimbingannya Ustadz. Aisyah jadi tambah semangat mengaji dan rajin shalat.',
    parentFeedbackSubmittedAt: new Date(Date.now() - 3600000 * 3.5).toISOString(),
    submittedAt: new Date(Date.now() - 3600000 * 4).toISOString(), // 4 hours ago
  },
  {
    id: 'r2',
    date: new Date().toISOString().split('T')[0],
    santriId: 's3',
    santriName: 'Rizky Ramadhan',
    shalat: {
      subuh: { performed: true, time: '04:50' },
      dzuhur: { performed: true, time: '12:15' },
      ashar: { performed: false, excuse: 'Tertidur lelap karena kelelahan setelah pulang sekolah' },
      maghrib: { performed: true, time: '18:05' },
      isya: { performed: true, time: '19:30' }
    },
    tahajud: false,
    witir: false,
    zikir: true,
    quran: { type: 'iqro', surahOrJilid: 'Jilid 4', ayatOrHalaman: 'Halaman 18' },
    bantuOrangTua: { checked: true, description: 'Merapikan mainan sendiri setelah bermain.' },
    parentName: 'Bapak Ahmad',
    parentSignature: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAKAAAABaCAYAAAA',
    status: 'pending',
    feedback: '',
    submittedAt: new Date(Date.now() - 3600000 * 2).toISOString(), // 2 hours ago
  },
  {
    id: 'r3',
    date: new Date().toISOString().split('T')[0],
    santriId: 's2',
    santriName: 'Fatih Al-Fatih',
    shalat: {
      subuh: { performed: true, time: '04:40' },
      dzuhur: { performed: true, time: '12:00' },
      ashar: { performed: true, time: '15:15' },
      maghrib: { performed: true, time: '18:00' },
      isya: { performed: true, time: '19:15' }
    },
    tahajud: true,
    witir: true,
    zikir: false,
    quran: { type: 'quran', surahOrJilid: 'An-Naba', ayatOrHalaman: '20-40' },
    bantuOrangTua: { checked: false, description: '' },
    parentName: 'Ibu Aminah',
    parentSignature: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAKAAAABaCAYAAAA',
    status: 'pending',
    feedback: '',
    submittedAt: new Date(Date.now() - 3600000 * 0.5).toISOString(), // 30 mins ago
  }
];

export default function App() {
  const [role, setRole] = useState<'santri' | 'admin_l' | 'admin_p' | 'guru'>('santri');
  const [santriList, setSantriList] = useState<Santri[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [attendance, setAttendance] = useState<Attendance[]>([]);
  const [activeSantriId, setActiveSantriId] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);

  // Dynamic PINs for managers
  const [pins, setPins] = useState<{ admin_l: string; admin_p: string; guru: string }>({
    admin_l: '1111',
    admin_p: '2222',
    guru: '9999'
  });

  // Production Security & Session states
  const [unlockedRoles, setUnlockedRoles] = useState<string[]>(() => {
    const saved = sessionStorage.getItem('unlocked_roles');
    return saved ? JSON.parse(saved) : ['santri'];
  });
  const [pendingRole, setPendingRole] = useState<'admin_l' | 'admin_p' | 'guru' | null>(null);
  const [enteredPin, setEnteredPin] = useState<string>('');
  const [pinError, setPinError] = useState<string>('');

  const handleRoleChangeAttempt = (targetRole: 'santri' | 'admin_l' | 'admin_p' | 'guru') => {
    if (targetRole === 'santri' || unlockedRoles.includes(targetRole)) {
      setRole(targetRole);
    } else {
      setPendingRole(targetRole);
      setEnteredPin('');
      setPinError('');
    }
  };

  const handleLockSession = () => {
    setRole('santri');
    setUnlockedRoles(['santri']);
    sessionStorage.removeItem('unlocked_roles');
  };

  const handleVerifyPin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pendingRole) return;
    const expectedPin = pins[pendingRole];

    if (enteredPin.trim() === expectedPin) {
      const updatedUnlocked = [...unlockedRoles, pendingRole!];
      setUnlockedRoles(updatedUnlocked);
      sessionStorage.setItem('unlocked_roles', JSON.stringify(updatedUnlocked));
      setRole(pendingRole!);
      setPendingRole(null);
      setEnteredPin('');
      setPinError('');
    } else {
      setPinError('PIN salah! Hubungi kepala madrasah jika lupa PIN.');
    }
  };

  // Sync data with Firestore
  const syncWithFirestore = async () => {
    try {
      setLoading(true);
      const firestoreSantri = await getSantriFromFirestore();
      const firestoreReports = await getReportsFromFirestore();
      const firestoreAttendance = await getAttendanceFromFirestore();

      const firestorePins = await getPinsFromFirestore();
      if (firestorePins) {
        setPins(firestorePins);
        localStorage.setItem('laporan_santri_pins', JSON.stringify(firestorePins));
      } else {
        await savePinsToFirestore(pins);
        localStorage.setItem('laporan_santri_pins', JSON.stringify(pins));
      }

      if (firestoreSantri.length > 0 || firestorePins) {
        // Sort reports by submittedAt descending to ensure newest are first
        const sortedReports = [...firestoreReports].sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime());
        setSantriList(firestoreSantri);
        setReports(sortedReports);
        setAttendance(firestoreAttendance);
        localStorage.setItem('laporan_santri_profiles', JSON.stringify(firestoreSantri));
        localStorage.setItem('laporan_santri_reports', JSON.stringify(sortedReports));
        localStorage.setItem('laporan_santri_attendance', JSON.stringify(firestoreAttendance));
      } else {
        // Seeding database with initial default data if Firestore is empty
        console.log("Firestore is completely empty. Seeding defaults...");
        const todayStr = new Date().toISOString().split('T')[0];
        const initialAttendance: Attendance[] = [
          { id: 'att_s1', date: todayStr, santriId: 's1', status: 'hadir' },
          { id: 'att_s2', date: todayStr, santriId: 's2', status: 'hadir' },
          { id: 'att_s3', date: todayStr, santriId: 's3', status: 'sakit' }
        ];

        await seedInitialData(INITIAL_SANTRI, INITIAL_REPORTS, initialAttendance);
        
        setSantriList(INITIAL_SANTRI);
        setReports(INITIAL_REPORTS);
        setAttendance(initialAttendance);
        localStorage.setItem('laporan_santri_profiles', JSON.stringify(INITIAL_SANTRI));
        localStorage.setItem('laporan_santri_reports', JSON.stringify(INITIAL_REPORTS));
        localStorage.setItem('laporan_santri_attendance', JSON.stringify(initialAttendance));
      }
    } catch (error) {
      console.warn("Firestore error, falling back to LocalStorage:", error);
      // Fallback
      const localSantri = localStorage.getItem('laporan_santri_profiles');
      const localReports = localStorage.getItem('laporan_santri_reports');
      const localAttendance = localStorage.getItem('laporan_santri_attendance');
      const localPins = localStorage.getItem('laporan_santri_pins');

      if (localPins) {
        setPins(JSON.parse(localPins));
      }

      if (localSantri) {
        setSantriList(JSON.parse(localSantri));
      } else {
        setSantriList(INITIAL_SANTRI);
      }

      if (localReports) {
        setReports(JSON.parse(localReports));
      } else {
        setReports(INITIAL_REPORTS);
      }

      if (localAttendance) {
        setAttendance(JSON.parse(localAttendance));
      } else {
        const todayStr = new Date().toISOString().split('T')[0];
        const initialAttendance: Attendance[] = [
          { id: 'att_s1', date: todayStr, santriId: 's1', status: 'hadir' },
          { id: 'att_s2', date: todayStr, santriId: 's2', status: 'hadir' },
          { id: 'att_s3', date: todayStr, santriId: 's3', status: 'sakit' }
        ];
        setAttendance(initialAttendance);
      }
    } finally {
      setLoading(false);
    }
  };

  // Hydrate states on mount
  useEffect(() => {
    syncWithFirestore();
  }, []);

  // Set last selected student as default active
  useEffect(() => {
    if (santriList.length > 0 && !activeSantriId) {
      const savedActiveId = localStorage.getItem('last_selected_santri_id');
      if (savedActiveId && santriList.some(s => s.id === savedActiveId)) {
        setActiveSantriId(savedActiveId);
      } else {
        setActiveSantriId(santriList[0].id);
      }
    }
  }, [santriList, activeSantriId]);

  // Persist selected student to localStorage for parents
  useEffect(() => {
    if (activeSantriId) {
      localStorage.setItem('last_selected_santri_id', activeSantriId);
    }
  }, [activeSantriId]);

  // Save updates helper
  const saveSantri = (updatedList: Santri[], itemToUpdate?: Santri) => {
    setSantriList(updatedList);
    localStorage.setItem('laporan_santri_profiles', JSON.stringify(updatedList));
    if (itemToUpdate) {
      saveSantriToFirestore(itemToUpdate);
    }
  };

  const saveReports = (updatedList: Report[], itemToUpdate?: Report) => {
    setReports(updatedList);
    localStorage.setItem('laporan_santri_reports', JSON.stringify(updatedList));
    if (itemToUpdate) {
      saveReportToFirestore(itemToUpdate);
    }
  };

  const saveAttendance = (updatedList: Attendance[]) => {
    setAttendance(updatedList);
    localStorage.setItem('laporan_santri_attendance', JSON.stringify(updatedList));
    saveAttendanceListToFirestore(updatedList);
  };

  // Add new Student Profile
  const handleAddSantri = (name: string, className: string, pin: string, gender: 'L' | 'P' = 'L', phone?: string): Santri => {
    const emojis = gender === 'P' ? ['👧', '🧕'] : ['👦', '👳'];
    const randomEmoji = emojis[Math.floor(Math.random() * emojis.length)];
    const newSantri: Santri = {
      id: 's_' + Date.now(),
      name,
      class: className,
      streak: 1,
      avatar: randomEmoji,
      pin: pin || '1234',
      gender,
      phone: phone || ''
    };

    const newList = [...santriList, newSantri];
    saveSantri(newList, newSantri);
    return newSantri;
  };

  // Update existing Student Profile
  const handleUpdateSantri = (id: string, updatedFields: Partial<Santri>) => {
    const student = santriList.find(s => s.id === id);
    if (!student) return;
    const updatedStudent = { ...student, ...updatedFields };
    const newList = santriList.map(s => s.id === id ? updatedStudent : s);
    saveSantri(newList, updatedStudent);
  };

  // Delete Student Profile
  const handleDeleteSantri = (id: string) => {
    const newList = santriList.filter(s => s.id !== id);
    setSantriList(newList);
    localStorage.setItem('laporan_santri_profiles', JSON.stringify(newList));
    deleteSantriFromFirestore(id);
    
    // Filter out reports for this student to keep database clean
    const newReports = reports.filter(r => r.santriId !== id);
    setReports(newReports);
    localStorage.setItem('laporan_santri_reports', JSON.stringify(newReports));

    // Clean draft storage
    localStorage.removeItem(`santri_draft_${id}`);

    // If activeSantriId was this student, reset to first in the list
    if (activeSantriId === id) {
      if (newList.length > 0) {
        setActiveSantriId(newList[0].id);
      } else {
        setActiveSantriId('');
      }
    }
  };

  // Submit Student Daily Report
  const handleSubmitReport = (newReportData: Omit<Report, 'id' | 'submittedAt'>) => {
    const reportId = 'r_' + Date.now();
    const newReport: Report = {
      ...newReportData,
      id: reportId,
      submittedAt: new Date().toISOString()
    };

    // Save report
    const updatedReports = [newReport, ...reports];
    saveReports(updatedReports, newReport);

    // Update streak for the student
    const student = santriList.find(s => s.id === newReport.santriId);
    if (student) {
      const updatedStudent = { ...student, streak: student.streak + 1 };
      const updatedSantri = santriList.map(s => s.id === newReport.santriId ? updatedStudent : s);
      saveSantri(updatedSantri, updatedStudent);
    }
  };

  // Verify and approve student report (Teacher action)
  const handleVerifyReport = (reportId: string, feedback: string, verifiedBy?: string) => {
    const report = reports.find(r => r.id === reportId);
    if (!report) return;
    const updatedReport = { ...report, status: 'verified' as const, feedback, verifiedBy };
    const updatedReports = reports.map(r => r.id === reportId ? updatedReport : r);
    saveReports(updatedReports, updatedReport);
  };

  // Submit feedback/note from parents regarding the report (Parent action)
  const handleAddParentFeedback = (reportId: string, parentFeedback: string) => {
    const report = reports.find(r => r.id === reportId);
    if (!report) return;
    const updatedReport = {
      ...report,
      parentFeedback,
      parentFeedbackSubmittedAt: new Date().toISOString()
    };
    const updatedReports = reports.map(r => r.id === reportId ? updatedReport : r);
    saveReports(updatedReports, updatedReport);
  };

  const handleUpdatePins = (newPins: { admin_l: string; admin_p: string; guru: string }) => {
    setPins(newPins);
    localStorage.setItem('laporan_santri_pins', JSON.stringify(newPins));
    savePinsToFirestore(newPins);
  };

  // Force resets database to defaults (secured for production)
  const handleResetToDefaults = async () => {
    if (role !== 'guru') {
      alert('Hanya Guru Ngaji (Super Admin) yang berwenang menyetel ulang database.');
      return;
    }

    const pinConfirm = prompt('Masukkan PIN Super Admin (Guru Ngaji) untuk konfirmasi reset database:');
    if (pinConfirm !== pins.guru) {
      alert('PIN Super Admin salah! Reset dibatalkan.');
      return;
    }

    if (confirm('Apakah Anda yakin ingin menyetel ulang semua data ke data bawaan? Tindakan ini akan menghapus semua data saat ini di Cloud Firestore.')) {
      setLoading(true);
      try {
        const todayStr = new Date().toISOString().split('T')[0];
        const initialAttendance: Attendance[] = [
          { id: 'att_s1', date: todayStr, santriId: 's1', status: 'hadir' },
          { id: 'att_s2', date: todayStr, santriId: 's2', status: 'hadir' },
          { id: 'att_s3', date: todayStr, santriId: 's3', status: 'sakit' }
        ];
        await seedInitialData(INITIAL_SANTRI, INITIAL_REPORTS, initialAttendance);
        
        const defaultPins = { admin_l: '1111', admin_p: '2222', guru: '9999' };
        await savePinsToFirestore(defaultPins);
        setPins(defaultPins);
        localStorage.setItem('laporan_santri_pins', JSON.stringify(defaultPins));

        setSantriList(INITIAL_SANTRI);
        setReports(INITIAL_REPORTS);
        setAttendance(initialAttendance);
        localStorage.setItem('laporan_santri_profiles', JSON.stringify(INITIAL_SANTRI));
        localStorage.setItem('laporan_santri_reports', JSON.stringify(INITIAL_REPORTS));
        localStorage.setItem('laporan_santri_attendance', JSON.stringify(initialAttendance));
        setActiveSantriId(INITIAL_SANTRI[0].id);
      } catch (error) {
        console.error("Error resetting defaults:", error);
      } finally {
        setLoading(false);
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-emerald-50/30 flex flex-col items-center justify-center font-sans">
        <div className="text-center space-y-4 p-8 bg-white rounded-3xl border border-emerald-100/50 shadow-md max-w-sm">
          <div className="w-12 h-12 bg-emerald-600 rounded-2xl flex items-center justify-center text-white mx-auto animate-bounce">
            <BookOpen className="w-6 h-6" />
          </div>
          <div className="space-y-1.5 animate-pulse">
            <h2 className="text-sm font-extrabold text-slate-800">Menghubungkan ke Database...</h2>
            <p className="text-[10px] text-slate-400 font-medium">Sinkronisasi data real-time Al-Hidayah Digital</p>
          </div>
          <div className="flex items-center justify-center gap-2 text-emerald-600 font-bold text-xs">
            <RefreshCw className="w-4 h-4 animate-spin" />
            <span>Memuat data Cloud Firestore</span>
          </div>
        </div>
      </div>
    );
  }

  return (

    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col font-sans">
      
      {/* Dynamic Navigation Role Header Selector */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50 shadow-xs">
        <div className="max-w-5xl mx-auto px-4 py-3 flex flex-col sm:flex-row items-center justify-between gap-3">
          {/* Logo Brand */}
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 bg-emerald-600 rounded-xl flex items-center justify-center text-white shadow-sm">
              <BookOpen className="w-5.5 h-5.5" />
            </div>
            <div>
              <h1 className="text-sm font-extrabold text-slate-800 tracking-tight flex items-center gap-1.5">
                Al-Hidayah Digital 
                <span className="text-[10px] bg-emerald-50 text-emerald-700 font-bold px-2 py-0.5 rounded border border-emerald-100/50">
                  Guru & Santri
                </span>
              </h1>
              <p className="text-[10px] text-slate-500 font-medium">Sistem Monitoring Ibadah & Ngaji Harian Otomatis</p>
            </div>
          </div>

          {/* Role Changer Toggle */}
          <div className="flex items-center gap-3">
            <div className="bg-slate-100 p-1.5 rounded-2xl flex flex-wrap items-center gap-1 justify-center">
              <button
                type="button"
                onClick={() => handleRoleChangeAttempt('santri')}
                className={`py-1.5 px-3 rounded-xl text-[11px] font-extrabold transition-all flex items-center gap-1 ${
                  role === 'santri' 
                    ? 'bg-emerald-600 text-white shadow-xs' 
                    : 'text-slate-500 hover:text-slate-800 hover:bg-white/50'
                }`}
                id="toggle-role-santri"
              >
                <ClipboardCheck className="w-3.5 h-3.5" /> Orang Tua
              </button>
              
              <button
                type="button"
                onClick={() => handleRoleChangeAttempt('admin_l')}
                className={`py-1.5 px-3 rounded-xl text-[11px] font-extrabold transition-all flex items-center gap-1 ${
                  role === 'admin_l' 
                    ? 'bg-blue-600 text-white shadow-xs' 
                    : 'text-slate-500 hover:text-slate-800 hover:bg-white/50'
                }`}
                id="toggle-role-admin-l"
              >
                <UserCheck className="w-3.5 h-3.5" /> Admin (L)
              </button>

              <button
                type="button"
                onClick={() => handleRoleChangeAttempt('admin_p')}
                className={`py-1.5 px-3 rounded-xl text-[11px] font-extrabold transition-all flex items-center gap-1 ${
                  role === 'admin_p' 
                    ? 'bg-fuchsia-600 text-white shadow-xs' 
                    : 'text-slate-500 hover:text-slate-800 hover:bg-white/50'
                }`}
                id="toggle-role-admin-p"
              >
                <Star className="w-3.5 h-3.5" /> Admin (P)
              </button>

              <button
                type="button"
                onClick={() => handleRoleChangeAttempt('guru')}
                className={`py-1.5 px-3 rounded-xl text-[11px] font-extrabold transition-all flex items-center gap-1 ${
                  role === 'guru' 
                    ? 'bg-amber-600 text-white shadow-xs' 
                    : 'text-slate-500 hover:text-slate-800 hover:bg-white/50'
                }`}
                id="toggle-role-guru"
              >
                <ShieldCheck className="w-3.5 h-3.5" /> Guru Ngaji
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Informative Top Alert based on active role */}
      <div className="bg-emerald-50 border-b border-emerald-100/50 py-2.5 px-4 text-center text-[11px] font-medium text-emerald-800 flex items-center justify-center gap-1.5 flex-wrap">
        <span>💡</span>
        {role === 'santri' && (
          <span>
            <strong>Mode Orang Tua / Wali Santri:</strong> Silakan pilih profil putra/putri Anda, catat ibadah harian & bacaan mengaji, tanda tangani, lalu klik kirim!
          </span>
        )}
        {role === 'admin_l' && (
          <span>
            <strong>Mode Admin Laki-laki:</strong> Anda berwenang memverifikasi laporan & memberikan catatan motivasi khusus untuk <strong>Santri Laki-laki</strong>.
          </span>
        )}
        {role === 'admin_p' && (
          <span>
            <strong>Mode Admin Perempuan:</strong> Anda berwenang memverifikasi laporan & memberikan catatan motivasi khusus untuk <strong>Santri Perempuan</strong>.
          </span>
        )}
        {role === 'guru' && (
          <span>
            <strong>Mode Guru Ngaji (Pusat Komando):</strong> Akses penuh pendaftaran santri baru (L/P), sunting data, evaluasi, serta rekapitulasi progres seluruh santri.
          </span>
        )}
      </div>

      {/* Main Content View Frame */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 py-8">
        <AnimatePresence mode="wait">
          {role === 'santri' ? (
            <motion.div
              key="view-santri"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.25 }}
            >
              <SantriForm 
                santriList={santriList}
                reports={reports}
                attendance={attendance}
                onSubmitReport={handleSubmitReport}
                onAddParentFeedback={handleAddParentFeedback}
                activeSantriId={activeSantriId}
                setActiveSantriId={setActiveSantriId}
              />
            </motion.div>
          ) : (
            <motion.div
              key="view-guru-or-admin"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.25 }}
            >
              <GuruDashboard 
                reports={reports}
                santriList={santriList}
                attendance={attendance}
                onSaveAttendance={saveAttendance}
                onVerifyReport={handleVerifyReport}
                onAddSantri={handleAddSantri}
                onUpdateSantri={handleUpdateSantri}
                onDeleteSantri={handleDeleteSantri}
                currentRole={role}
                onRefreshData={syncWithFirestore}
                pins={pins}
                onUpdatePins={handleUpdatePins}
                onLogout={handleLockSession}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* SECURITY PIN VERIFICATION MODAL */}
      {pendingRole && (
        <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs z-[9999] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full shadow-xl border border-slate-100 overflow-hidden transform transition-all">
            {/* Header */}
            <div className="p-6 text-center space-y-3 bg-gradient-to-b from-slate-50 to-white border-b border-slate-100">
              <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto shadow-xs">
                <Lock className="w-5 h-5 animate-pulse" />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-extrabold text-slate-800">Verifikasi Akses Pengelola</h3>
                <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">
                  {pendingRole === 'admin_l' && 'Akses: Admin Laki-laki (L)'}
                  {pendingRole === 'admin_p' && 'Akses: Admin Perempuan (P)'}
                  {pendingRole === 'guru' && 'Akses: Guru Ngaji (Super Admin)'}
                </p>
              </div>
            </div>

            {/* Form Body */}
            <form onSubmit={handleVerifyPin} className="p-5 space-y-4">
              <p className="text-[11px] text-slate-500 leading-relaxed text-center">
                Untuk keamanan data, silakan masukkan PIN pengaman Anda untuk mengaktifkan sesi ini.
              </p>

              <div>
                <input
                  id="gatekeeper-pin-input"
                  type="password"
                  maxLength={4}
                  value={enteredPin}
                  onChange={(e) => {
                    setEnteredPin(e.target.value);
                    if (pinError) setPinError('');
                  }}
                  placeholder="••••"
                  autoFocus
                  className="w-full text-center text-lg font-extrabold tracking-[0.4em] p-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 bg-slate-50/50"
                />
                {pinError && (
                  <p className="text-[10px] text-red-500 font-bold text-center mt-2">
                    ⚠️ {pinError}
                  </p>
                )}
              </div>

              {/* Demo Helper Tip (Extremely helpful for review & testing) */}
              <div className="bg-emerald-50/50 border border-emerald-100/30 p-3 rounded-2xl text-[10px] text-emerald-800 space-y-1">
                <p className="font-extrabold">💡 Petunjuk PIN Pengaman Saat Ini:</p>
                <p className="font-medium">
                  • Admin L: <strong className="font-extrabold font-mono">{pins.admin_l}</strong>
                </p>
                <p className="font-medium">
                  • Admin P: <strong className="font-extrabold font-mono">{pins.admin_p}</strong>
                </p>
                <p className="font-medium">
                  • Guru Ngaji: <strong className="font-extrabold font-mono">{pins.guru}</strong>
                </p>
              </div>

              {/* Actions */}
              <div className="grid grid-cols-2 gap-2.5 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setPendingRole(null);
                    setEnteredPin('');
                    setPinError('');
                  }}
                  className="p-2.5 text-xs font-bold text-slate-500 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="p-2.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition-all shadow-xs"
                >
                  Verifikasi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Informative Footer */}
      <footer className="bg-white border-t border-slate-200 mt-auto py-6 text-center text-slate-400 text-xs">
        <div className="max-w-5xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>© 2026 Al-Hidayah Digital. By Cepi Sopyan Dev.</p>
          {role === 'guru' && (
            <button
              type="button"
              onClick={handleResetToDefaults}
              className="text-[10px] text-red-500 hover:text-red-700 font-bold hover:underline"
              id="btn-reset-data"
            >
              Reset Semua Data Utama (Guru Ngaji Only)
            </button>
          )}
        </div>
      </footer>
    </div>
  );
}
