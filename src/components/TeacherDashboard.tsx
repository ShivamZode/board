import React, { useState, useEffect, type CSSProperties } from 'react';

// --- Interface ---
interface TeacherDashboardProps {
  onStartClass: (classDetails: any) => void;
  onLogout: () => void;
  teacherName: string; 
  onOpenPastClass: (classId: number) => void; 
}

// --- Strongly Typed Styles (Moved to top to fix "used before declaration" error) ---
const gridStyle: CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(clamp(200px, 40vw, 300px), 1fr))', gap: 'clamp(15px, 3vw, 20px)' };

const activeCardStyle: CSSProperties = { background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)', color: 'white', padding: 'clamp(20px, 5vw, 30px)', borderRadius: '20px', cursor: 'pointer', boxShadow: '0 10px 20px rgba(37, 99, 235, 0.3)', transition: 'transform 0.2s', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' };
const inactiveCardStyle: CSSProperties = { background: '#ffffff', color: '#475569', padding: 'clamp(20px, 5vw, 30px)', borderRadius: '20px', cursor: 'pointer', border: '1px solid #cbd5e1', boxShadow: '0 4px 6px rgba(0,0,0,0.02)', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s' };

const iconStyle: CSSProperties = { fontSize: 'clamp(32px, 6vw, 44px)', display: 'block', marginBottom: '12px' };

const modalOverlayStyle: CSSProperties = { position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '15px' };
const modalStyle: CSSProperties = { background: '#ffffff', padding: 'clamp(20px, 5vw, 30px)', borderRadius: '24px', width: '100%', maxWidth: '420px', boxShadow: '0 25px 50px rgba(0,0,0,0.25)', maxHeight: '90vh', overflowY: 'auto', WebkitOverflowScrolling: 'touch' };
const modalWideStyle: CSSProperties = { ...modalStyle, maxWidth: '700px' };
const modalHeaderStyle: CSSProperties = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px', paddingBottom: '15px', borderBottom: '1px solid #e2e8f0' };
const modalTitleStyle: CSSProperties = { margin: 0, fontSize: 'clamp(18px, 4vw, 22px)', fontWeight: 800, color: '#0f172a' };

const historyCardStyle: CSSProperties = { display: 'flex', flexDirection: 'column', background: '#f8fafc', padding: '15px', borderRadius: '16px', borderLeft: '5px solid #3b82f6', borderTop: '1px solid #e2e8f0', borderRight: '1px solid #e2e8f0', borderBottom: '1px solid #e2e8f0', gap: '10px' };

const inputStyle: CSSProperties = { padding: '12px 15px', borderRadius: '12px', border: '1px solid #cbd5e1', width: '100%', boxSizing: 'border-box', color: '#0f172a', fontSize: '15px', height: '48px', appearance: 'none', backgroundColor: '#f8fafc' };
const timeInputStyle: CSSProperties = { width: '55px', height: '40px', padding: '0 10px', borderRadius: '8px', border: '1px solid #cbd5e1', textAlign: 'center', fontSize: '15px', backgroundColor: '#f8fafc', color: '#0f172a' };

const logoutBtnStyle: CSSProperties = { background: '#fee2e2', color: '#dc2626', padding: '10px 16px', border: '1px solid #fecaca', borderRadius: '12px', cursor: 'pointer', fontWeight: 'bold', fontSize: '14px', transition: 'all 0.2s' };
const closeBtnStyle: CSSProperties = { background: '#f1f5f9', color: '#64748b', border: 'none', width: '36px', height: '36px', borderRadius: '50%', fontSize: '16px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' };

const actionBtnStyle = (bg: string, flex: boolean): CSSProperties => ({ flex: flex ? '1 1 auto' : '0 0 auto', minWidth: 'fit-content', background: bg, color: 'white', border: 'none', padding: '10px 14px', borderRadius: '10px', cursor: 'pointer', fontWeight: 'bold', fontSize: '13px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' });
const submitBtnStyle: CSSProperties = { flex: 2, padding: '14px', background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)', color: 'white', border: 'none', borderRadius: '12px', cursor: 'pointer', fontWeight: 'bold', fontSize: '16px', boxShadow: '0 4px 10px rgba(37, 99, 235, 0.3)' };
const cancelBtnStyle: CSSProperties = { flex: 1, padding: '14px', background: '#f1f5f9', color: '#475569', border: '1px solid #cbd5e1', borderRadius: '12px', cursor: 'pointer', fontWeight: 'bold', fontSize: '16px' };

const toggleBtnStyle = (isActive: boolean): CSSProperties => ({ flex: 1, padding: '15px 10px', borderRadius: '12px', border: isActive ? '2px solid #3b82f6' : '1px solid #cbd5e1', background: isActive ? '#eff6ff' : 'white', color: isActive ? '#1e40af' : '#64748b', cursor: 'pointer', textAlign: 'center', transition: 'all 0.2s' });

const filterTabStyle = (isActive: boolean): CSSProperties => ({ flex: '1 1 min-content', padding: '12px 10px', cursor: 'pointer', fontWeight: 'bold', borderRadius: '10px', border: 'none', background: isActive ? '#334155' : 'white', color: isActive ? 'white' : '#64748b', boxShadow: isActive ? '0 4px 6px rgba(0,0,0,0.1)' : '0 1px 3px rgba(0,0,0,0.05)', borderBottom: isActive ? 'none' : '1px solid #e2e8f0', transition: 'all 0.2s', fontSize: '14px', whiteSpace: 'nowrap' });
const rangeInputStyle: CSSProperties = { width: '60px', height: '40px', padding: '0 5px', borderRadius: '8px', border: '1px solid #cbd5e1', textAlign: 'center', fontSize: '15px' };


// --- Main Component ---
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

  const [isStrict, setIsStrict] = useState(() => localStorage.getItem('board_strict') === 'true');

  // 👇 Track the custom time settings (Default: 1 min to 3 mins)
  const [strictMin, setStrictMin] = useState({ m: 5, s: 0 });
  const [strictMax, setStrictMax] = useState({ m: 10, s: 0 });
  
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

    // 👇 Calculate total seconds and ensure Min isn't accidentally bigger than Max
    const totalMinSecs = (strictMin.m * 60) + strictMin.s;
    const totalMaxSecs = (strictMax.m * 60) + strictMax.s;
    const finalMin = Math.min(totalMinSecs, totalMaxSecs);
    const finalMax = Math.max(totalMinSecs, totalMaxSecs) || 10; // Failsafe: At least 10 seconds
    
    // ✅ ADDED isStrict to the payload!
    onStartClass({ 
      ...formData, 
      branch: branchName, 
      subject: subjectName, 
      notifyType, 
      isStrict,
      strictMin: finalMin, // 👈 Send to App.tsx
      strictMax: finalMax  // 👈 Send to App.tsx
    });
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
    <div style={{ padding: 'clamp(15px, 5vw, 40px)', background: 'linear-gradient(135deg, #f0f9ff 0%, #e0e7ff 100%)', height: '100vh', overflowY: 'auto', boxSizing: 'border-box', fontFamily: 'system-ui, -apple-system, sans-serif', display: 'flex', flexDirection: 'column' }}>
      
      <div style={{ flexGrow: 1 }}></div>

      <div style={{ background: 'rgba(255, 255, 255, 0.95)', backdropFilter: 'blur(10px)', padding: 'clamp(20px, 5vw, 40px)', borderRadius: '24px', boxShadow: '0 20px 40px rgba(0,0,0,0.08)', border: '1px solid rgba(255,255,255,0.5)', width: '100%', maxWidth: '1000px', margin: '0 auto' }}>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'clamp(20px, 4vw, 30px)', flexWrap: 'wrap', gap: '15px', borderBottom: '2px solid #f1f5f9', paddingBottom: '20px' }}>
          <h2 style={{ color: '#0f172a', margin: 0, fontSize: 'clamp(22px, 4vw, 28px)', fontWeight: 800, letterSpacing: '-0.5px' }}>👨‍🏫 Welcome, {teacherName}</h2>
          <button onClick={onLogout} style={logoutBtnStyle}>🚪 Logout</button>
        </div>

        <div style={gridStyle}>
          
          <div style={{ marginBottom: '20px', padding: 'clamp(15px, 3vw, 20px)', background: isStrict ? '#fef2f2' : '#f8fafc', border: isStrict ? '2px solid #fca5a5' : '1px solid #e2e8f0', borderRadius: '16px', transition: 'all 0.3s' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', fontWeight: 'bold', color: isStrict ? '#dc2626' : '#475569', fontSize: 'clamp(14px, 2.5vw, 16px)' }}>
              <input 
                type="checkbox" 
                checked={isStrict} 
                onChange={(e) => {
                  setIsStrict(e.target.checked);
                  localStorage.setItem('board_strict', e.target.checked.toString());
                }} 
                style={{ width: '22px', height: '22px', accentColor: '#dc2626' }}
              />
              🚨 Strict Attention Checker
            </label>
            
            {isStrict && (
              <div style={{ marginTop: '15px', padding: '15px', background: 'white', borderRadius: '12px', border: '1px solid #fecaca', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <p style={{ margin: 0, fontSize: '13px', color: '#475569', fontWeight: 600 }}>Prompt students randomly between:</p>
                
                <div style={{ display: 'flex', gap: '15px', alignItems: 'center', flexWrap: 'wrap' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '13px', color: '#64748b', fontWeight: 600 }}>Min:</span>
                    <input type="number" min="0" value={strictMin.m} onChange={e => setStrictMin({...strictMin, m: Number(e.target.value)})} style={timeInputStyle} />
                    <span style={{fontSize: '13px', color: '#94a3b8'}}>m</span>
                    <input type="number" min="0" max="59" value={strictMin.s} onChange={e => setStrictMin({...strictMin, s: Number(e.target.value)})} style={timeInputStyle} />
                    <span style={{fontSize: '13px', color: '#94a3b8'}}>s</span>
                  </div>
                  
                  <span style={{ color: '#cbd5e1', fontWeight: 'bold', fontSize: '12px' }}>AND</span>
                  
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '13px', color: '#64748b', fontWeight: 600 }}>Max:</span>
                    <input type="number" min="0" value={strictMax.m} onChange={e => setStrictMax({...strictMax, m: Number(e.target.value)})} style={timeInputStyle} />
                    <span style={{fontSize: '13px', color: '#94a3b8'}}>m</span>
                    <input type="number" min="0" max="59" value={strictMax.s} onChange={e => setStrictMax({...strictMax, s: Number(e.target.value)})} style={timeInputStyle} />
                    <span style={{fontSize: '13px', color: '#94a3b8'}}>s</span>
                  </div>
                </div>
              </div>
            )}
          </div>
          
          <div style={activeCardStyle} onClick={() => setShowModal(true)}>
            <span style={iconStyle}>▶️</span><h3 style={{ margin: 0, fontSize: 'clamp(16px, 3vw, 20px)' }}>Start New Class</h3>
          </div>
          <div style={inactiveCardStyle} onClick={loadHistory}>
            <span style={iconStyle}>📚</span><h3 style={{ margin: 0, fontSize: 'clamp(16px, 3vw, 20px)' }}>Previous Lectures</h3>
          </div>
        </div>
      </div>

      {showHistoryModal && (
        <div style={modalOverlayStyle} onClick={() => setShowHistoryModal(false)}>
          <div style={modalWideStyle} onClick={e => e.stopPropagation()}>
            <div style={modalHeaderStyle}>
              <h3 style={modalTitleStyle}>My Previous Lectures</h3>
              <button onClick={() => setShowHistoryModal(false)} style={closeBtnStyle}>✕</button>
            </div>
            
            {history.length === 0 ? <p style={{ textAlign: 'center', color: '#64748b', padding: '40px 0' }}>No previous lectures found.</p> : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                {history.map(cls => (
                  <div key={cls.id} style={historyCardStyle}>
                    <div style={{ flex: '1 1 100%', marginBottom: '10px' }}>
                      <strong style={{ display: 'block', fontSize: '16px', color: '#0f172a', marginBottom: '4px' }}>{cls.subject}</strong>
                      <span style={{ fontSize: '13px', color: '#475569', fontWeight: 600, display: 'block' }}>{cls.branch} • Year {cls.year} • Div {cls.div}</span>
                      <span style={{ fontSize: '12px', color: '#94a3b8', marginTop: '4px', display: 'block' }}>🕒 {cls.time}</span>
                    </div>
                    
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', width: '100%' }}>
                      <button onClick={() => handleViewAttendance(cls.id)} style={actionBtnStyle('#4f46e5', true)}>📊 Attendance</button>
                      <button onClick={() => handleContinueClass(cls)} style={actionBtnStyle('#2563eb', true)}>✏️ Continue</button>
                      <button onClick={() => onOpenPastClass(cls.id)} style={actionBtnStyle('#059669', true)}>👁️ Open</button>
                      <button onClick={() => handleDeleteClass(cls.id)} style={actionBtnStyle('#dc2626', false)}>🗑️</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {showModal && (
        <div style={modalOverlayStyle} onClick={() => setShowModal(false)}>
          <div style={modalStyle} onClick={e => e.stopPropagation()}>
            <div style={modalHeaderStyle}>
              <h3 style={modalTitleStyle}>Start a New Class</h3>
              <button onClick={() => setShowModal(false)} style={closeBtnStyle}>✕</button>
            </div>
            <form onSubmit={handleStart} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              <select required onChange={e => setFormData({...formData, branchId: e.target.value, subjectId: ''})} style={inputStyle}><option value="">1. Select Branch...</option>{branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}</select>
              <select required onChange={e => setFormData({...formData, yearId: e.target.value, subjectId: ''})} style={inputStyle}><option value="">2. Select Academic Year...</option>{years.map(y => <option key={y.id} value={y.id}>{y.name}</option>)}</select>
              <select required onChange={e => setFormData({...formData, divId: e.target.value})} style={inputStyle}><option value="">3. Select Division...</option>{divs.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}</select>
              <select required onChange={e => setFormData({...formData, subjectId: e.target.value})} style={{...inputStyle, background: filteredSubjects.length > 0 ? '#f0fdf4' : '#fff', borderColor: filteredSubjects.length > 0 ? '#86efac' : '#cbd5e1'}} disabled={filteredSubjects.length === 0}><option value="">{filteredSubjects.length > 0 ? "4. Select Subject..." : "🔒 Select Branch & Year first"}</option>{filteredSubjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}</select>

              <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                <div onClick={() => setNotifyType('direct')} style={toggleBtnStyle(notifyType === 'direct')}>
                  <span style={{ fontSize: '24px', display: 'block', marginBottom: '5px' }}>🔔</span>
                  <strong style={{ fontSize: '13px' }}>Notify Directly</strong>
                </div>
                <div onClick={() => setNotifyType('qr')} style={toggleBtnStyle(notifyType === 'qr')}>
                  <span style={{ fontSize: '24px', display: 'block', marginBottom: '5px' }}>📱</span>
                  <strong style={{ fontSize: '13px' }}>QR Code Only</strong>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                <button type="button" onClick={() => setShowModal(false)} style={cancelBtnStyle}>Cancel</button>
                <button type="submit" style={submitBtnStyle}>Start Live Board ▶</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showReportModal && reportData && (
        <div style={modalOverlayStyle} onClick={() => setShowReportModal(false)}>
          <div style={modalWideStyle} onClick={e => e.stopPropagation()}>
            <div style={modalHeaderStyle}>
              <h3 style={modalTitleStyle}>Attendance Report</h3>
              <button onClick={() => setShowReportModal(false)} style={closeBtnStyle}>✕</button>
            </div>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', background: '#e0e7ff', padding: '15px 20px', borderRadius: '12px', marginBottom: '20px', fontWeight: 'bold', color: '#3730a3', fontSize: '14px', flexWrap: 'wrap', gap: '10px' }}>
              <span>⏱️ Duration: {reportData.class_duration}</span>
              <span>👥 Roster: {reportData.total_students}</span>
            </div>

            <div style={{ border: '1px solid #e2e8f0', borderRadius: '16px', padding: '15px', marginBottom: '20px', background: '#f8fafc' }}>
              <div style={{ display: 'flex', gap: '10px', marginBottom: filterCategory !== 'absent' ? '15px' : '0', flexWrap: 'wrap' }}>
                <button onClick={() => setFilterCategory('all')} style={filterTabStyle(filterCategory === 'all')}>👥 All</button>
                <button onClick={() => setFilterCategory('present')} style={filterTabStyle(filterCategory === 'present')}>✅ Present</button>
                <button onClick={() => setFilterCategory('absent')} style={filterTabStyle(filterCategory === 'absent')}>❌ Absent</button>
              </div>

              {filterCategory !== 'absent' && (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', background: 'white', padding: '12px', borderRadius: '10px', fontSize: '14px', border: '1px solid #e2e8f0', flexWrap: 'wrap' }}>
                  <span style={{ fontWeight: 'bold', color: '#475569' }}>Filter Range:</span>
                  <input type="number" min="0" max="100" value={minPresence} onChange={e => setMinPresence(Number(e.target.value))} style={rangeInputStyle} /> %
                  <span style={{ color: '#94a3b8' }}>to</span>
                  <input type="number" min="0" max="100" value={maxPresence} onChange={e => setMaxPresence(Number(e.target.value))} style={rangeInputStyle} /> %
                </div>
              )}
            </div>

            {finalDisplayList.length === 0 ? (
              <p style={{ textAlign: 'center', color: '#64748b', padding: '30px 0' }}>No students match these filters.</p> 
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {finalDisplayList.map((stu: any, idx: number) => (
                  <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '15px', background: 'white', border: '1px solid #e2e8f0', borderRadius: '12px', borderLeft: `6px solid ${stu.percentage >= 75 ? '#10b981' : (stu.percentage >= 50 ? '#f59e0b' : '#ef4444')}`, boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
                    <div>
                      <strong style={{ color: '#0f172a', fontSize: '15px', display: 'block', marginBottom: '2px' }}>{stu.name}</strong>
                      <div style={{ fontSize: '13px', color: '#64748b' }}>{stu.email}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontWeight: 900, fontSize: '16px', color: stu.percentage >= 75 ? '#10b981' : (stu.percentage >= 50 ? '#f59e0b' : '#ef4444') }}>
                        {stu.percentage === 0 ? 'Absent' : `${stu.percentage}%`}
                      </div>
                      {stu.percentage > 0 && <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '2px', fontWeight: 500 }}>{stu.time_present}</div>}
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
