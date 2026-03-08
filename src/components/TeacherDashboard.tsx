import React, { useState, useEffect } from 'react';

interface TeacherDashboardProps {
  onStartClass: (classDetails: any) => void;
  onLogout: () => void;
  teacherName: string; 
  onOpenPastClass: (classId: number) => void; 
}

export default function TeacherDashboard({ onStartClass, onLogout, teacherName, onOpenPastClass }: TeacherDashboardProps) {
  const [showModal, setShowModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [history, setHistory] = useState<any[]>([]);
  const [formData, setFormData] = useState({ branchId: '', yearId: '', divId: '', subjectId: '' });
  const [notifyType, setNotifyType] = useState<'direct' | 'qr'>('direct');
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportData, setReportData] = useState<any>(null);
  
  const [filterCategory, setFilterCategory] = useState<'all' | 'present' | 'absent'>('all');
  const [minPresence, setMinPresence] = useState<number>(0);
  const [maxPresence, setMaxPresence] = useState<number>(100);

  const [branches, setBranches] = useState<any[]>([]);
  const [years, setYears] = useState<any[]>([]);
  const [divs, setDivs] = useState<any[]>([]);
  const [allSubjects, setAllSubjects] = useState<any[]>([]);
  const [filteredSubjects, setFilteredSubjects] = useState<any[]>([]);

  useEffect(() => {
    fetch(`${import.meta.env.VITE_BACKEND_URL}/api/data/`)
      .then(res => res.json())
      .then(data => {
        setBranches(data.branches || []);
        setYears(data.years || []);
        setDivs(data.divs || []);
        setAllSubjects(data.subjects || []);
      })
      .catch(err => console.error("Error fetching data:", err));
  }, []);

  useEffect(() => {
    if (formData?.branchId && formData?.yearId) {
      setFilteredSubjects(allSubjects.filter(sub => sub.branch_id.toString() === formData?.branchId && sub.academic_year_id.toString() === formData.yearId));
    } else {
      setFilteredSubjects([]); 
    }
  }, [formData?.branchId, formData?.yearId, allSubjects]);

  const handleStart = (e: React.SyntheticEvent) => {
    e.preventDefault();
    const branchName = branches.find(b => b.id.toString() === formData?.branchId)?.name || 'Unknown';
    const subjectName = allSubjects.find(s => s.id.toString() === formData.subjectId)?.name || 'Unknown';
    onStartClass({ ...formData, branch: branchName, subject: subjectName, notifyType });
    setShowModal(false);
  };

  const loadHistory = () => {
    fetch(`${import.meta.env.VITE_BACKEND_URL}/api/previous-classes/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role: 'teacher', teacherName })
    })
    .then(res => res.json())
    .then(data => setHistory(data.classes || []));
    setShowHistoryModal(true);
  };

  const handleDeleteClass = (classId: number) => {
    fetch(`${import.meta.env.VITE_BACKEND_URL}/api/delete-class/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ classId })
    }).then(() => {
      setHistory(history.filter(c => c.id !== classId)); 
    });
  };

  const handleContinueClass = async (cls: any) => {
    try {
      const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/get-past-board/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ classId: cls.id })
      });
      const data = await res.json();
      
      if (data.boardData) {
        onStartClass({
          branchId: cls?.branchId, yearId: cls?.yearId, divId: cls?.divId, subject: cls?.subject, branch: cls?.branch, 
          resumeData: JSON.parse(data.boardData) 
        });
        setShowHistoryModal(false);
      } else {
        alert("No drawing data was saved for this class!");
      }
    } catch (err) { console.error("Failed to resume class", err); }
  };

  const handleViewAttendance = async (classId: number) => {
    try {
      const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/attendance/report/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ classId })
      });
      const data = await res.json();
      setFilterCategory('all'); setMinPresence(0); setMaxPresence(100);
      setReportData(data); setShowReportModal(true);
    } catch (err) { console.error("Failed to load report", err); }
  };

  let finalDisplayList = reportData?.students || [];
  if (filterCategory === 'present') finalDisplayList = finalDisplayList.filter((s: any) => s.percentage > 0);
  else if (filterCategory === 'absent') finalDisplayList = finalDisplayList.filter((s: any) => s.percentage === 0);
  if (filterCategory !== 'absent') finalDisplayList = finalDisplayList.filter((s: any) => s.percentage >= minPresence && s.percentage <= maxPresence);

  return (
    // 🌟 MAIN WRAPPER: Flex Column pushing everything to the bottom!
    <div style={{ padding: 'clamp(20px, 5vw, 40px)', backgroundColor: '#f1f5f9', height: '100vh', overflowY: 'auto', boxSizing: 'border-box', fontFamily: 'sans-serif', display: 'flex', flexDirection: 'column' }}>
      
      {/* Magic Spacer that consumes all empty top space */}
      <div style={{ flexGrow: 1 }}></div>

      {/* 🎛️ BOTTOM CONTROL CONSOLE */}
      <div style={{ background: 'white', padding: 'clamp(20px, 4vw, 40px)', borderRadius: '24px', boxShadow: '0 20px 50px rgba(0,0,0,0.1)', border: '1px solid #e2e8f0', width: '100%', maxWidth: '1200px', margin: '0 auto' }}>
        
        {/* Header now acts as the title of the Console */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'clamp(20px, 4vw, 30px)', flexWrap: 'wrap', gap: '10px', borderBottom: '2px solid #f8fafc', paddingBottom: '20px' }}>
          <h2 style={{ color: '#0f172a', margin: 0, fontSize: 'clamp(20px, 4vw, 28px)' }}>👨‍🏫 Welcome, {teacherName}</h2>
          <button onClick={onLogout} style={logoutBtnStyle}>🚪 Logout</button>
        </div>

        {/* The Action Cards */}
        <div className="dashboard-grid" style={gridStyle}>
          <div style={activeCardStyle} onClick={() => setShowModal(true)}>
            <span style={iconStyle}>▶️</span><h3 style={{ margin: 0 }}>Start New Class</h3>
          </div>
          <div style={inactiveCardStyle} onClick={loadHistory}>
            <span style={iconStyle}>📚</span><h3 style={{ margin: 0 }}>Previous Lectures</h3>
          </div>
        </div>
      </div>

      {/* HISTORY MODAL */}
      {showHistoryModal && (
        <div style={modalOverlayStyle} onClick={() => setShowHistoryModal(false)}>
          <div className="responsive-modal" style={modalWideStyle} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ margin: 0, fontSize: 'clamp(18px, 3vw, 24px)' }}>My Previous Lectures</h3>
              <button onClick={() => setShowHistoryModal(false)} style={closeBtnStyle}>❌</button>
            </div>
            
            {history.length === 0 ? <p style={{ textAlign: 'center', color: '#64748b' }}>No previous lectures found.</p> : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {history.map(cls => (
                  <div key={cls.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f1f5f9', padding: 'clamp(10px, 2vw, 15px)', borderRadius: '8px', borderLeft: '4px solid #3b82f6', flexWrap: 'wrap', gap: '10px' }}>
                    <div style={{ flex: '1 1 100%' }}>
                      <strong style={{ display: 'block', fontSize: 'clamp(14px, 2vw, 16px)', color: '#0f172a' }}>{cls.subject}</strong>
                      <span style={{ fontSize: 'clamp(11px, 1.5vw, 13px)', color: '#475569', fontWeight: 'bold', display: 'block', margin: '4px 0' }}>{cls.branch} • {cls.year} • Div {cls.div}</span>
                      <span style={{ fontSize: 'clamp(11px, 1.5vw, 13px)', color: '#64748b' }}>🕒 {cls.time}</span>
                    </div>
                    
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                      <button onClick={() => handleViewAttendance(cls.id)} style={actionBtnStyle('#6366f1')}>Attendance 📊</button>
                      <button onClick={() => handleContinueClass(cls)} style={actionBtnStyle('#3b82f6')}>Continue ✏️</button>
                      <button onClick={() => onOpenPastClass(cls.id)} style={actionBtnStyle('#10b981')}>Open 👁️</button>
                      <button onClick={() => handleDeleteClass(cls.id)} style={actionBtnStyle('#ef4444')}>Delete</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* START CLASS MODAL */}
      {showModal && (
        <div style={modalOverlayStyle}>
          <div className="responsive-modal" style={modalStyle}>
            <h3 style={{ marginTop: 0, fontSize: 'clamp(18px, 3vw, 24px)' }}>Start a New Class</h3>
            <form onSubmit={handleStart} style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginTop: '20px' }}>
              <select required onChange={e => setFormData({...formData, branchId: e.target.value, subjectId: ''})} style={inputStyle}><option value="">1. Select Branch...</option>{branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}</select>
              <select required onChange={e => setFormData({...formData, yearId: e.target.value, subjectId: ''})} style={inputStyle}><option value="">2. Select Academic Year...</option>{years.map(y => <option key={y.id} value={y.id}>{y.name}</option>)}</select>
              <select required onChange={e => setFormData({...formData, divId: e.target.value})} style={inputStyle}><option value="">3. Select Division...</option>{divs.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}</select>
              <select required onChange={e => setFormData({...formData, subjectId: e.target.value})} style={{...inputStyle, background: filteredSubjects.length > 0 ? '#f0fdf4' : '#fff'}} disabled={filteredSubjects.length === 0}><option value="">{filteredSubjects.length > 0 ? "4. Select Subject..." : "🔒 Select Branch & Year first"}</option>{filteredSubjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}</select>

              <div style={{ display: 'flex', gap: '10px', marginTop: '5px' }}>
                <div onClick={() => setNotifyType('direct')} style={{ flex: 1, padding: '10px', borderRadius: '8px', border: notifyType === 'direct' ? '2px solid #3b82f6' : '1px solid #cbd5e1', background: notifyType === 'direct' ? '#eff6ff' : 'white', cursor: 'pointer', textAlign: 'center' }}>
                  <span style={{ fontSize: 'clamp(20px, 3vw, 24px)', display: 'block' }}>🔔</span>
                  <strong style={{ fontSize: 'clamp(11px, 1.5vw, 13px)', color: '#0f172a' }}>Notify Directly</strong>
                </div>
                <div onClick={() => setNotifyType('qr')} style={{ flex: 1, padding: '10px', borderRadius: '8px', border: notifyType === 'qr' ? '2px solid #3b82f6' : '1px solid #cbd5e1', background: notifyType === 'qr' ? '#eff6ff' : 'white', cursor: 'pointer', textAlign: 'center' }}>
                  <span style={{ fontSize: 'clamp(20px, 3vw, 24px)', display: 'block' }}>📱</span>
                  <strong style={{ fontSize: 'clamp(11px, 1.5vw, 13px)', color: '#0f172a' }}>QR Code Only</strong>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                <button type="button" onClick={() => setShowModal(false)} style={{ flex: 1, padding: '10px', background: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: '6px', cursor: 'pointer', fontSize: 'clamp(14px, 2vw, 16px)' }}>Cancel</button>
                <button type="submit" style={{ flex: 1, padding: '10px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: 'clamp(14px, 2vw, 16px)' }}>Start Live Board</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ADVANCED ATTENDANCE REPORT MODAL */}
      {showReportModal && reportData && (
        <div style={modalOverlayStyle} onClick={() => setShowReportModal(false)}>
          <div className="responsive-modal" style={modalWideStyle} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ margin: 0, fontSize: 'clamp(18px, 3vw, 24px)' }}>Class Attendance Report</h3>
              <button onClick={() => setShowReportModal(false)} style={closeBtnStyle}>❌</button>
            </div>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', background: '#e0e7ff', padding: 'clamp(10px, 2vw, 15px)', borderRadius: '8px', marginBottom: '20px', fontWeight: 'bold', color: '#3730a3', fontSize: 'clamp(12px, 2vw, 15px)' }}>
              <span>Duration: {reportData.class_duration}</span>
              <span>Roster: {reportData.total_students}</span>
            </div>

            <div style={{ border: '1px solid #e2e8f0', borderRadius: '8px', padding: 'clamp(10px, 2vw, 15px)', marginBottom: '20px' }}>
              <div style={{ display: 'flex', gap: '10px', marginBottom: filterCategory !== 'absent' ? '15px' : '0', flexWrap: 'wrap' }}>
                <button onClick={() => setFilterCategory('all')} style={filterTabStyle(filterCategory === 'all')}>👥 All</button>
                <button onClick={() => setFilterCategory('present')} style={filterTabStyle(filterCategory === 'present')}>✅ Present</button>
                <button onClick={() => setFilterCategory('absent')} style={filterTabStyle(filterCategory === 'absent')}>❌ Absent</button>
              </div>

              {filterCategory !== 'absent' && (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', background: '#f8fafc', padding: '10px', borderRadius: '6px', fontSize: 'clamp(12px, 1.8vw, 14px)' }}>
                  <span style={{ fontWeight: 'bold', color: '#475569' }}>Range:</span>
                  <input type="number" min="0" max="100" value={minPresence} onChange={e => setMinPresence(Number(e.target.value))} style={rangeInputStyle} /> %
                  <span style={{ color: '#94a3b8' }}>to</span>
                  <input type="number" min="0" max="100" value={maxPresence} onChange={e => setMaxPresence(Number(e.target.value))} style={rangeInputStyle} /> %
                </div>
              )}
            </div>

            {finalDisplayList.length === 0 ? (
              <p style={{ textAlign: 'center', color: '#64748b', margin: '30px 0' }}>No students match these filters.</p> 
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {finalDisplayList.map((stu: any, idx: number) => (
                  <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 15px', background: stu.percentage === 0 ? '#fef2f2' : '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '6px', borderLeft: `4px solid ${stu.percentage >= 75 ? '#10b981' : (stu.percentage >= 50 ? '#f59e0b' : '#ef4444')}` }}>
                    <div>
                      <strong style={{ color: '#0f172a', fontSize: 'clamp(13px, 2vw, 15px)' }}>{stu.name}</strong>
                      <div style={{ fontSize: 'clamp(11px, 1.5vw, 12px)', color: '#64748b' }}>{stu.email}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontWeight: 'bold', fontSize: 'clamp(12px, 2vw, 14px)', color: stu.percentage >= 75 ? '#10b981' : (stu.percentage >= 50 ? '#f59e0b' : '#ef4444') }}>
                        {stu.percentage === 0 ? 'Absent' : `${stu.percentage}%`}
                      </div>
                      {stu.percentage > 0 && <div style={{ fontSize: 'clamp(10px, 1.5vw, 12px)', color: '#64748b' }}>{stu.time_present}</div>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// --- Styles ---
const gridStyle = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(clamp(140px, 30vw, 220px), 1fr))', gap: 'clamp(15px, 3vw, 20px)' };

// 🌟 UPDATED: Cards act like smooth console buttons now
const activeCardStyle = { background: '#3b82f6', color: 'white', padding: 'clamp(20px, 4vw, 30px)', borderRadius: '16px', cursor: 'pointer', boxShadow: '0 4px 15px rgba(59, 130, 246, 0.4)', transition: 'transform 0.2s', textAlign: 'center' as const, display: 'flex', flexDirection: 'column' as const, alignItems: 'center', justifyContent: 'center' };
const inactiveCardStyle = { background: '#f8fafc', color: '#64748b', padding: 'clamp(20px, 4vw, 30px)', borderRadius: '16px', cursor: 'pointer', border: '1px solid #e2e8f0', textAlign: 'center' as const, display: 'flex', flexDirection: 'column' as const, alignItems: 'center', justifyContent: 'center', transition: 'transform 0.2s, background 0.2s' };

const iconStyle = { fontSize: 'clamp(30px, 5vw, 40px)', display: 'block', marginBottom: '10px' };
const modalOverlayStyle = { position: 'fixed' as const, inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '10px' };
const modalStyle = { background: 'white', padding: 'clamp(15px, 4vw, 30px)', borderRadius: '12px', width: '100%', maxWidth: '400px', boxShadow: '0 10px 25px rgba(0,0,0,0.2)' };
const modalWideStyle = { ...modalStyle, maxWidth: '650px', maxHeight: '85vh', overflowY: 'auto' as const };
const inputStyle = { padding: 'clamp(8px, 2vw, 12px)', borderRadius: '6px', border: '1px solid #cbd5e1', width: '100%', boxSizing: 'border-box' as const, color: '#0f172a', fontSize: 'clamp(14px, 2vw, 16px)' };
const logoutBtnStyle = { background: '#ef4444', color: 'white', padding: 'clamp(6px, 1.5vw, 8px) clamp(10px, 2vw, 16px)', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: 'clamp(12px, 1.8vw, 14px)' };
const closeBtnStyle = { background: 'none', border: 'none', fontSize: 'clamp(18px, 3vw, 24px)', cursor: 'pointer' };
const actionBtnStyle = (bg: string) => ({ background: bg, color: 'white', border: 'none', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', fontSize: 'clamp(11px, 1.5vw, 13px)' });

// Filter Styles
const filterTabStyle = (isActive: boolean) => ({ flex: 1, padding: 'clamp(6px, 1.5vw, 8px)', cursor: 'pointer', fontWeight: 'bold' as const, borderRadius: '6px', border: 'none', background: isActive ? '#334155' : '#e2e8f0', color: isActive ? 'white' : '#64748b', transition: '0.2s', fontSize: 'clamp(12px, 1.8vw, 14px)' });
const rangeInputStyle = { width: 'clamp(50px, 8vw, 60px)', padding: '6px', borderRadius: '4px', border: '1px solid #cbd5e1', textAlign: 'center' as const };
