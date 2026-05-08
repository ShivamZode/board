import React, { useState, useEffect } from 'react';
import { Scanner } from '@yudiel/react-qr-scanner';

interface StudentDashboardProps {
  onJoinClass: (roomId: string) => void;
  onLogout: () => void;
  studentInfo: any;
  onOpenPastClass: (classId: number) => void;
  studentEmail: string; 
}

export default function StudentDashboard({ onJoinClass, onLogout, studentInfo, onOpenPastClass, studentEmail }: StudentDashboardProps) {
  const [liveClass, setLiveClass] = useState<any>(null);
  const [showScanner, setShowScanner] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [history, setHistory] = useState<any[]>([]);
  const [showStatsModal, setShowStatsModal] = useState(false);
  const [attendanceStats, setAttendanceStats] = useState<any>(null);

  useEffect(() => {
    if (!studentInfo) return;

    const interval = setInterval(() => {
      fetch(`${import.meta.env.VITE_BACKEND_URL}/api/check-class/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(studentInfo)
      })
      .then(res => {
         if (!res.ok) throw new Error("Server response not ok");
         return res.json();
      })
      .then(data => {
        if (data.has_class) {
          setLiveClass(data);
        } else {
          setLiveClass(null);
        }
      })
      .catch(err => {
         console.error("Polling error:", err);
         setLiveClass(null);
      });
    }, 3000);

    return () => clearInterval(interval);
  }, [studentInfo]);

  const loadHistory = () => {
    fetch(`${import.meta.env.VITE_BACKEND_URL}/api/previous-classes/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role: 'student', branchId: studentInfo?.branchId, yearId: studentInfo?.yearId, divId: studentInfo?.divId })
    })
    .then(res => res.json())
    .then(data => {
      setHistory(data.classes || []);
      setShowHistoryModal(true);
    })
    .catch(err => console.error("Error fetching history:", err));
  };

  const loadAttendanceStats = () => {
    fetch(`${import.meta.env.VITE_BACKEND_URL}/api/student/attendance-stats/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: studentEmail, branchId: studentInfo?.branchId, yearId: studentInfo?.yearId, divId: studentInfo?.divId })
    })
    .then(res => res.json())
    .then(data => {
      setAttendanceStats(data);
      setShowStatsModal(true);
    })
    .catch(err => console.error("Error fetching stats:", err));
  };

  return (
    <div style={{ padding: 'clamp(20px, 5vw, 40px)', backgroundColor: '#f8fafc', height: '100vh', overflowY: 'auto', boxSizing: 'border-box', fontFamily: 'sans-serif', position: 'relative' }}>
      
      {/* HEADER */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'clamp(20px, 4vw, 40px)' }}>
        <h2 style={{ color: '#0f172a', margin: 0, fontSize: 'clamp(20px, 4vw, 28px)' }}>🎓 Student Dashboard</h2>
        <button onClick={onLogout} style={logoutBtnStyle}>🚪 Logout</button>
      </div>

      {/* ACTIVE CLASS NOTIFICATION */}
      {liveClass ? (
        <div style={{ background: '#10b981', color: 'white', padding: 'clamp(15px, 3vw, 20px)', borderRadius: '12px', marginBottom: 'clamp(20px, 4vw, 30px)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 4px 15px rgba(16, 185, 129, 0.3)', flexWrap: 'wrap', gap: '15px' }}>
          <div>
            <h3 style={{ margin: 0, fontSize: 'clamp(18px, 3vw, 22px)' }}>🚨 Live Class Started!</h3>
            <p style={{ margin: '5px 0 0 0', fontWeight: 'bold', fontSize: 'clamp(12px, 2vw, 16px)' }}>
              {liveClass.teacherName} is teaching {liveClass.subjectName}
            </p>
          </div>
          <button onClick={() => onJoinClass(liveClass.roomId)} style={{ background: 'white', color: '#10b981', padding: 'clamp(8px, 2vw, 12px) clamp(16px, 3vw, 24px)', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', fontSize: 'clamp(14px, 2vw, 18px)', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', whiteSpace: 'nowrap' }}>
            Join Now ▶
          </button>
        </div>
      ) : (
        <div style={{ background: '#e2e8f0', color: '#475569', padding: 'clamp(15px, 3vw, 20px)', borderRadius: '12px', marginBottom: 'clamp(20px, 4vw, 30px)', textAlign: 'center', fontWeight: 'bold', fontSize: 'clamp(12px, 2vw, 16px)' }}>
          No active classes right now. Waiting for teacher... ⏳
        </div>
      )}

      {/* DASHBOARD GRID */}
      <div className="dashboard-grid" style={gridStyle}>
        <div style={{...cardStyle, border: '2px dashed #3b82f6', background: '#eff6ff'}} onClick={() => setShowScanner(true)}>
          <span style={{ fontSize: 'clamp(24px, 4vw, 36px)', display: 'block', marginBottom: '10px' }}>📷</span>
          Scan QR to Join
        </div>
        <div style={cardStyle} onClick={() => alert('Coming soon!')}>🤝 Collaborate</div>
        <div style={cardStyle} onClick={loadHistory}>⏪ Previous Classes</div>
        <div style={cardStyle} onClick={loadAttendanceStats}>📊 My Attendance</div>
        <div style={cardStyle} onClick={() => alert('Coming soon!')}>📅 Calendar</div>
      </div>

      {/* FLOATING ACTION BUTTON */}
      <button 
        onClick={() => alert('Create New Project option coming soon!')}
        title="Create New Project"
        style={{ position: 'fixed', bottom: 'clamp(15px, 4vw, 30px)', right: 'clamp(15px, 4vw, 30px)', width: 'clamp(50px, 8vw, 70px)', height: 'clamp(50px, 8vw, 70px)', borderRadius: '50%', background: '#3b82f6', color: 'white', border: 'none', fontSize: 'clamp(28px, 5vw, 40px)', boxShadow: '0 4px 15px rgba(59, 130, 246, 0.5)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', paddingBottom: '6px' }}>
        +
      </button>

      {/* HISTORY MODAL */}
      {showHistoryModal && (
        <div style={modalOverlayStyle} onClick={() => setShowHistoryModal(false)}>
          <div className="responsive-modal" style={modalWideStyle} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ margin: 0, fontSize: 'clamp(18px, 3vw, 24px)' }}>Previous Lectures</h3>
              <button onClick={() => setShowHistoryModal(false)} style={closeBtnStyle}>❌</button>
            </div>
            
            {history.length === 0 ? <p style={{ textAlign: 'center', color: '#64748b' }}>No previous lectures found.</p> : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {history.map(cls => (
                  <div key={cls.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f1f5f9', padding: 'clamp(10px, 2vw, 15px)', borderRadius: '8px', borderLeft: '4px solid #10b981', flexWrap: 'wrap', gap: '10px' }}>
                    <div>
                      <strong style={{ display: 'block', fontSize: 'clamp(14px, 2vw, 16px)', color: '#0f172a' }}>{cls.subject}</strong>
                      <span style={{ fontSize: 'clamp(11px, 1.5vw, 13px)', color: '#475569', fontWeight: 'bold', display: 'block', margin: '4px 0' }}>Prof. {cls.teacher}</span>
                      <span style={{ fontSize: 'clamp(11px, 1.5vw, 13px)', color: '#64748b' }}>🕒 {cls.time}</span>
                    </div>
                    <button onClick={() => onOpenPastClass(cls.id)} style={{ background: '#10b981', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: 'clamp(12px, 1.8vw, 14px)' }}>Open Notes 👁️</button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* QR SCANNER MODAL */}
      {showScanner && (
        <div style={modalOverlayStyle} onClick={() => setShowScanner(false)}>
          <div className="responsive-modal" style={{...modalStyle, textAlign: 'center'}} onClick={e => e.stopPropagation()}>
            <h3 style={{ marginTop: 0, fontSize: 'clamp(18px, 3vw, 24px)' }}>Scan Teacher's QR</h3>
            <p style={{ fontSize: 'clamp(12px, 1.8vw, 14px)', color: '#64748b', marginBottom: '20px' }}>Point your camera at the board to join the live session.</p>
            <div style={{ width: '100%', borderRadius: '12px', overflow: 'hidden', border: '2px solid #e2e8f0' }}>
              <Scanner 
                onScan={(result) => {
                  if (result && result.length > 0) {
                    const scannedRoomId = result[0].rawValue;
                    if (scannedRoomId.startsWith('room_')) {
                      setShowScanner(false);
                      onJoinClass(scannedRoomId);
                    } else {
                      alert("Invalid QR Code!");
                    }
                  }
                }}
              />
            </div>
            <button onClick={() => setShowScanner(false)} style={{ marginTop: '20px', background: '#ef4444', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', width: '100%' }}>Cancel</button>
          </div>
        </div>
      )}

      {/* STATS MODAL */}
      {showStatsModal && attendanceStats && (
        <div style={modalOverlayStyle} onClick={() => setShowStatsModal(false)}>
          <div className="responsive-modal" style={modalWideStyle} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ margin: 0, fontSize: 'clamp(18px, 3vw, 24px)' }}>My Attendance</h3>
              <button onClick={() => setShowStatsModal(false)} style={closeBtnStyle}>❌</button>
            </div>

            <div style={{ display: 'flex', gap: '15px', marginBottom: '25px', flexWrap: 'wrap' }}>
              <div style={{ flex: '1 1 120px', background: attendanceStats.total_attendance >= 75 ? '#d1fae5' : '#fee2e2', padding: 'clamp(10px, 3vw, 20px)', borderRadius: '12px', textAlign: 'center', border: `1px solid ${attendanceStats.total_attendance >= 75 ? '#34d399' : '#f87171'}` }}>
                <div style={{ fontSize: 'clamp(10px, 1.5vw, 13px)', color: '#475569', fontWeight: 'bold', textTransform: 'uppercase' }}>Classes Attended</div>
                <div style={{ fontSize: 'clamp(24px, 5vw, 36px)', fontWeight: 'bold', color: attendanceStats.total_attendance >= 75 ? '#059669' : '#dc2626', margin: '5px 0' }}>{attendanceStats.total_attendance}%</div>
                <div style={{ fontSize: 'clamp(10px, 1.5vw, 12px)', color: '#64748b' }}>({attendanceStats.classes_attended} out of {attendanceStats.total_classes})</div>
              </div>

              <div style={{ flex: '1 1 120px', background: '#eff6ff', padding: 'clamp(10px, 3vw, 20px)', borderRadius: '12px', textAlign: 'center', border: '1px solid #93c5fd' }}>
                <div style={{ fontSize: 'clamp(10px, 1.5vw, 13px)', color: '#475569', fontWeight: 'bold', textTransform: 'uppercase' }}>Attention Span</div>
                <div style={{ fontSize: 'clamp(24px, 5vw, 36px)', fontWeight: 'bold', color: '#2563eb', margin: '5px 0' }}>{attendanceStats.attention_percentage}%</div>
                <div style={{ fontSize: 'clamp(10px, 1.5vw, 12px)', color: '#64748b' }}>Overall presence</div>
              </div>
            </div>

            <h4 style={{ margin: '0 0 10px 0', color: '#334155', borderBottom: '2px solid #e2e8f0', paddingBottom: '8px' }}>Session Breakdown</h4>
            
            {attendanceStats.sessions.length === 0 ? (
              <p style={{ textAlign: 'center', color: '#64748b' }}>No classes have been held yet.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {attendanceStats.sessions.map((sess: any, idx: number) => (
                  <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 15px', background: sess.status === 'Present' ? '#f8fafc' : '#fef2f2', border: '1px solid #e2e8f0', borderRadius: '8px', borderLeft: `4px solid ${sess.status === 'Present' ? '#10b981' : '#ef4444'}`, flexWrap: 'wrap' }}>
                    <div>
                      <strong style={{ display: 'block', color: '#0f172a', fontSize: 'clamp(13px, 2vw, 15px)' }}>{sess.subject}</strong>
                      <span style={{ fontSize: 'clamp(11px, 1.5vw, 12px)', color: '#64748b' }}>Prof. {sess.teacher} • {sess.date}</span>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <strong style={{ fontSize: 'clamp(12px, 2vw, 14px)', color: sess.status === 'Present' ? '#10b981' : '#ef4444' }}>{sess.status}</strong>
                      {sess.status === 'Present' && (
                        <div style={{ fontSize: 'clamp(10px, 1.5vw, 12px)', color: '#64748b', fontWeight: 'bold', marginTop: '2px' }}>{sess.percentage}% Time</div>
                      )}
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
const cardStyle = { background: 'white', color: '#334155', padding: 'clamp(15px, 4vw, 30px)', borderRadius: '12px', cursor: 'pointer', border: '1px solid #cbd5e1', textAlign: 'center' as const, fontWeight: 'bold', fontSize: 'clamp(14px, 2.5vw, 18px)', boxShadow: '0 2px 10px rgba(0,0,0,0.05)', transition: 'transform 0.2s, boxShadow 0.2s' };
const modalOverlayStyle = { position: 'fixed' as const, inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '10px' };
const modalStyle = { background: 'white', padding: 'clamp(15px, 4vw, 30px)', borderRadius: '12px', width: '100%', maxWidth: '400px', boxShadow: '0 10px 25px rgba(0,0,0,0.2)' };
const modalWideStyle = { ...modalStyle, maxWidth: '650px', maxHeight: '85vh', overflowY: 'auto' as const };
const logoutBtnStyle = { background: '#ef4444', color: 'white', padding: 'clamp(6px, 1.5vw, 8px) clamp(10px, 2vw, 16px)', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: 'clamp(12px, 1.8vw, 14px)' };
const closeBtnStyle = { background: 'none', border: 'none', fontSize: 'clamp(18px, 3vw, 24px)', cursor: 'pointer' };
