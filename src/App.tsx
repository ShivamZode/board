import { useState, useEffect, useRef, useCallback } from 'react'
import { Excalidraw } from '@excalidraw/excalidraw'
import Draggable from 'react-draggable'
import MyCustomToolbar from './components/MyCustomToolbar' 
import TeacherDashboard from './components/TeacherDashboard';
import StudentDashboard from './components/StudentDashboard';

import './App.css' 
import "@excalidraw/excalidraw/index.css" 

import { parseMermaidToExcalidraw } from "@excalidraw/mermaid-to-excalidraw";
import { convertToExcalidrawElements } from "@excalidraw/excalidraw";
import mermaid from "mermaid";

import AuthScreen from './components/AuthScreen';

mermaid.initialize({ startOnLoad: false, theme: "default" });

const toolIcons: Record<string, string> = {
  selection: '🖱️', freedraw: '✏️', eraser: '🧽', laser: '🔴',
  text: '𝐓', arrow: '↗️', line: '╱', rectangle: '▭', ellipse: '◯', diamond: '◇'
};

// 🌟 A stable, unchanging security bypass rule!
const ALLOW_ALL_LINKS = /^https?:\/\/.*/i;

function MermaidModal({ initialCode = "graph TD\nA-->B", onClose, onInsert }: { initialCode?: string; onClose: () => void; onInsert: (elements: any[], files: any) => void }) {
  const [code, setCode] = useState<string>(initialCode)
  const [svg, setSvg] = useState<string>("")
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current as any)
    debounceRef.current = setTimeout(async () => {
      setLoading(true); setError(null)
      try {
        const res: any = await mermaid.render("m-" + Date.now(), code)
        const svgStr = typeof res === "string" ? res : res?.svg ?? String(res)
        setSvg(svgStr)
      } catch (err: any) {
        setSvg("")
        setError(err?.message ? String(err.message) : String(err ?? "Render failed"))
      } finally {
        setLoading(false)
      }
    }, 250)
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current as any) }
  }, [code])

  const handleInsertFromModal = async () => { 
    setLoading(true); setError(null)
    try {
      const { elements: skeletonElements, files } = await parseMermaidToExcalidraw(code, { themeVariables: { fontSize: "14px" } })
      const excalidrawElements = convertToExcalidrawElements(skeletonElements)
      
      onInsert(excalidrawElements, files || {});
      onClose();
    } catch (rawErr) {
      const errMsg = rawErr instanceof Error ? rawErr.message : (typeof rawErr === "string" ? rawErr : JSON.stringify(rawErr))
      setError(`Prepare failed: ${errMsg}`)
      console.error("Mermaid prepare failed:", rawErr)
    } finally { setLoading(false) }
  } 

  return (
    <div style={{ position: 'fixed', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.5)', zIndex: 99999, padding: '10px' }}>
      <div style={{ width: '95%', maxWidth: '1000px', height: '80%', background: 'white', borderRadius: '12px', overflow: 'hidden', display: 'flex', flexDirection: window.innerWidth < 768 ? 'column' : 'row', boxShadow: '0 10px 40px rgba(0,0,0,0.3)' }}>
        
        <div style={{ flex: 1, padding: '20px', display: 'flex', flexDirection: 'column', gap: '10px', borderRight: window.innerWidth < 768 ? 'none' : '1px solid #e2e8f0', borderBottom: window.innerWidth < 768 ? '1px solid #e2e8f0' : 'none' }}>
          <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '18px' }}>Mermaid Code</div>
          <textarea value={code} onChange={(e) => setCode(e.target.value)} style={{ flex: 1, width: '100%', padding: '15px', fontFamily: 'monospace', fontSize: '14px', boxSizing: 'border-box', border: '1px solid #cbd5e1', borderRadius: '8px', resize: 'none', outline: 'none' }} />
          
          <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '5px' }}>
            <button onClick={onClose} style={{ padding: '10px 20px', background: '#f1f5f9', color: '#334155', border: '1px solid #cbd5e1', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>Cancel</button>
            <button onClick={handleInsertFromModal} style={{ padding: '10px 20px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }} disabled={loading}>Insert to Canvas</button>
          </div>
          {error && <div style={{ color: '#ef4444', fontSize: '13px', padding: '10px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '6px' }}>{error}</div>}
        </div>

        <div style={{ flex: 1, padding: '20px', display: 'flex', flexDirection: 'column', background: '#f8fafc' }}>
          <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '18px', marginBottom: '10px' }}>Live Preview</div>
          <div style={{ flex: 1, overflow: 'auto', padding: '20px', background: 'white', borderRadius: '8px', border: '1px solid #e2e8f0', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            {loading && <div style={{ color: '#64748b', fontWeight: 'bold' }}>⏳ Rendering preview…</div>}
            {!loading && svg && <div dangerouslySetInnerHTML={{ __html: svg }} style={{ width: '100%', height: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center' }} />}
            {!loading && !svg && !error && <div style={{ color: '#94a3b8' }}>Preview will appear here.</div>}
          </div>
        </div>

      </div>
    </div>
  )
}

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(() => !!localStorage.getItem('board_auth'));
  
  const [currentUserEmail, setCurrentUserEmail] = useState(() => {
    const auth = localStorage.getItem('board_auth');
    return auth ? JSON.parse(auth).email : '';
  });
  
  const [isStudent, setIsStudent] = useState(() => {
    const auth = localStorage.getItem('board_auth');
    return auth ? JSON.parse(auth).role === 'student' : false;
  });
  
  const [userFullName, setUserFullName] = useState(() => {
    const auth = localStorage.getItem('board_auth');
    return auth ? JSON.parse(auth).fullName : '';
  });
  
  const [studentInfo, setStudentInfo] = useState<any>(() => {
    const auth = localStorage.getItem('board_auth');
    return auth ? JSON.parse(auth).studentInfo : null;
  });

  const [isQRMode, setIsQRMode] = useState(() => sessionStorage.getItem('board_isQRMode') === 'true');
  const [showQRModal, setShowQRModal] = useState(false);

  const [resumeData, setResumeData] = useState<any>(null);

  const [pendingPdf, setPendingPdf] = useState<File | null>(null);
  const [pdfStart, setPdfStart] = useState<number>(1);
  const [pdfEnd, setPdfEnd] = useState<number>(20);

  const [isViewingPast, setIsViewingPast] = useState(false);
  const [pastBoardData, setPastBoardData] = useState<any>(null);

  const [clockTime, setClockTime] = useState("");
  const [classStartTime, setClassStartTime] = useState<number | null>(() => {
    const saved = sessionStorage.getItem('board_classStartTime');
    return saved ? parseInt(saved) : null;
  });
  const [hasNotifiedHour, setHasNotifiedHour] = useState(false);

  const [currentView, setCurrentView] = useState<'auth' | 'dashboard' | 'board'>(() => {
    if (!localStorage.getItem('board_auth')) return 'auth';
    return (sessionStorage.getItem('board_currentView') as 'dashboard' | 'board') || 'dashboard';
  });
  const [roomId, setRoomId] = useState<string | null>(() => {
    return sessionStorage.getItem('board_roomId') || null;
  });
  
  const [showNavMenu, setShowNavMenu] = useState(false);

  const [excalidrawAPI, setExcalidrawAPI] = useState<any>(null)
  const [isFollowing, setIsFollowing] = useState(true)
  const [isUploading, setIsUploading] = useState(false) 
  const [theme, setTheme] = useState<'light' | 'dark'>('light')
  
  const [pendingPlacement, setPendingPlacement] = useState<{ elements: any[]; files?: Record<string, any> } | null>(null)
  const [isAwaitingPlacement, setIsAwaitingPlacement] = useState(false) 

  const [slideNav, setSlideNav] = useState<{id: string, src: string, yPos: number}[]>([])
  const [activeSlideId, setActiveSlideId] = useState<string>('default')
  
  const [drawToolbarPos, setDrawToolbarPos] = useState({ x: 20, y: 150 })
  const [isDraggingDrawToolbar, setIsDraggingDrawToolbar] = useState(false)
  const [isPinned, setIsPinned] = useState(false)
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [isAutoCollapseEnabled, setIsAutoCollapseEnabled] = useState(true) 

  const [liveStudents, setLiveStudents] = useState<any[]>([]);
  const [showLiveRoster, setShowLiveRoster] = useState(false);
  
  const [recentTools, setRecentTools] = useState<string[]>(['freedraw', 'eraser', 'selection'])
  const [isDrawingOnCanvas, setIsDrawingOnCanvas] = useState(false)
  const [isGhostMode, setIsGhostMode] = useState(false)
  
  const [isTopFaded, setIsTopFaded] = useState(false)
  const [isBottomUIFaded, setIsBottomUIFaded] = useState(false) 
  
  const [showImportModal, setShowImportModal] = useState(false)
  const [showAddMenu, setShowAddMenu] = useState(false)
  const [showClearConfirm, setShowClearConfirm] = useState(false)
  const [isSnapEnabled, setIsSnapEnabled] = useState(false)
  const [showMermaidModal, setShowMermaidModal] = useState(false)

  // 🌟 NEW: Global Toast State & Timer
  const [toastMessage, setToastMessage] = useState<{ text: string, type: 'info' | 'warning' | 'error' } | null>(null);
  const globalToastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const collapseTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const topTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const bottomTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const isDrawingRef = useRef(false);
  const latestElementsRef = useRef<readonly any[]>([]);
  const lastCameraSyncRef = useRef<number>(0);
  const lastCamStateRef = useRef<string>("");

  const socketRef = useRef<WebSocket | null>(null)
  const isStudentRef = useRef(isStudent)
  const isFollowingRef = useRef(isFollowing)
  const activeSlideIdRef = useRef(activeSlideId)
  const lastSentElementsRef = useRef<string>('[]')
  const clientIdRef = useRef(Math.random().toString(36).substring(2, 15))
  
  const knownFilesRef = useRef<Set<string>>(new Set())
  const navRef = useRef<HTMLDivElement>(null)
  const drawToolbarRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const drawDragStartPos = useRef({ x: 0, y: 0 });
  const orbitR = window.innerWidth < 768 ? 55 : 70; 

  // 🌟 NEW: Track embeds so we only warn the student ONCE per new iframe!
  const seenEmbedsRef = useRef<Set<string>>(new Set());

  // 🌟 NEW: Custom Toast Function
  const showToast = useCallback((text: string, type: 'info' | 'warning' | 'error' = 'info') => {
    setToastMessage({ text, type });
    if (globalToastTimerRef.current) clearTimeout(globalToastTimerRef.current);
    globalToastTimerRef.current = setTimeout(() => {
      setToastMessage(null);
    }, 5000);
  }, []);

  const handleAuthSuccess = (data: any) => {
    localStorage.setItem('board_auth', JSON.stringify(data));
    setIsAuthenticated(true);
    setCurrentUserEmail(data.email);
    setIsStudent(data.role === 'student'); 
    setUserFullName(data.fullName);
    
    if (data.role === 'student' && data.studentInfo) {
      setStudentInfo(data.studentInfo);
    }
    setCurrentView('dashboard');
  };

  const handleOpenPastClass = async (classId: number) => {
    try {
      const res = await fetch('${import.meta.env.VITE_BACKEND_URL}/api/get-past-board/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ classId })
      });
      const data = await res.json();
      
      if (data.boardData) {
        setPastBoardData(JSON.parse(data.boardData));
        setIsViewingPast(true);
        setCurrentView('board'); 
        setRoomId(null); 
      } else {
        // 🌟 FIX: Uses nice custom toast instead of browser alert
        showToast("No drawing data was saved for this class!", "warning");
      }
    } catch (err) {
      console.error("Failed to load past board", err);
    }
  };

  useEffect(() => {
    sessionStorage.setItem('board_currentView', currentView);
    
    if (roomId) sessionStorage.setItem('board_roomId', roomId);
    else sessionStorage.removeItem('board_roomId');
    
    if (classStartTime) sessionStorage.setItem('board_classStartTime', classStartTime.toString());
    else sessionStorage.removeItem('board_classStartTime');

    sessionStorage.setItem('board_isQRMode', isQRMode.toString());
  }, [currentView, roomId, classStartTime, isQRMode]);

  useEffect(() => {
    if (currentView === 'board' && !isViewingPast && resumeData && excalidrawAPI) {
      setTimeout(() => {
        if (resumeData.files && Object.keys(resumeData.files).length > 0) {
          excalidrawAPI.addFiles(Object.values(resumeData.files));
        }
        excalidrawAPI.updateScene({ 
            elements: resumeData.elements,
            appState: { scrollX: 0, scrollY: 0 } 
        });
        setResumeData(null); 
      }, 150);
    }
  }, [currentView, isViewingPast, resumeData, excalidrawAPI]);

  useEffect(() => {
    if (isStudent || currentView !== 'board' || !roomId || isViewingPast) return;

    const interval = setInterval(() => {
      fetch(`${import.meta.env.VITE_BACKEND_URL}/api/attendance/live/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roomId })
      })
      .then(res => res.json())
      .then(data => {
        if (data.students) setLiveStudents(data.students);
      })
      .catch(err => console.error("Failed to fetch live attendance", err));
    }, 3000);

    return () => clearInterval(interval);
  }, [isStudent, currentView, roomId, isViewingPast]);

  const handleExitClass = async () => {
    if (!isStudent && roomId && excalidrawAPI) {
      try {
        const elements = excalidrawAPI.getSceneElements();
        const files = excalidrawAPI.getFiles();
        const boardData = JSON.stringify({ elements, files });

        await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/end-class/`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ roomId, boardData })
        });
      } catch (error) {
        console.error("Failed to fetch end-class API:", error);
      }
    }

    sessionStorage.removeItem('board_roomId');
    sessionStorage.removeItem('board_classStartTime');
    sessionStorage.removeItem('board_currentView');
    sessionStorage.removeItem('board_isQRMode');
    
    seenEmbedsRef.current.clear(); // Clear embed memory
    setCurrentView('dashboard');
    setRoomId(null);
    setIsViewingPast(false);
    setSlideNav([]);          
    setActiveSlideId('default'); 
    if (socketRef.current) socketRef.current.close();
    if (excalidrawAPI) excalidrawAPI.updateScene({ elements: [] });
  };

  const handleLogout = async () => {
    if (!isStudent && roomId) {
      try {
        await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/end-class/`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ roomId })
        });
      } catch (error) {}
    }

    localStorage.removeItem('board_auth');
    sessionStorage.removeItem('board_roomId');
    sessionStorage.removeItem('board_classStartTime');
    sessionStorage.removeItem('board_currentView');
    sessionStorage.removeItem('board_isQRMode');

    seenEmbedsRef.current.clear(); // Clear embed memory
    setIsAuthenticated(false);
    setCurrentUserEmail('');
    setIsStudent(false);
    setCurrentView('auth'); 
    setRoomId(null);
    setSlideNav([]);
    if (socketRef.current) socketRef.current.close();
    if (excalidrawAPI) excalidrawAPI.updateScene({ elements: [] });
  };

  const handleStartClass = async (classDetails: any) => {
    const newRoomId = `room_${classDetails.branch.replace(/\s+/g, '')}_${Date.now()}`;
    
    try {
      await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/start-class/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roomId: newRoomId,
          teacherName: userFullName, 
          subjectName: classDetails?.subject || "",
          branchId: classDetails?.branchId || null,
          yearId: classDetails?.yearId || null,
          divId: classDetails?.divId || null,
          notifyType: classDetails?.notifyType || "direct", 
        })
      });
      setIsQRMode(classDetails.notifyType === 'qr');
      if (classDetails.notifyType === 'qr') setShowQRModal(true); 
    } catch (error) {
      console.error("Failed to start live class on server:", error);
    }

      if (classDetails.resumeData) {
        setResumeData(classDetails.resumeData);
      } else {
        setResumeData(null);
      }

    setRoomId(newRoomId);
    setCurrentView('board'); 
  };

  const handleJoinClass = (joinRoomId: string) => {
    setRoomId(joinRoomId);
    setCurrentView('board'); 
  };

  useEffect(() => {
    if (currentView !== 'board') {
      setClassStartTime(null); 
      setHasNotifiedHour(false);
      return;
    }
    
    if (!classStartTime && !isStudent) setClassStartTime(Date.now());
    
    const timer = setInterval(() => {
      setClockTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit'}));
      
      if (!isStudent && classStartTime && !hasNotifiedHour) {
        if (Date.now() - classStartTime >= 3600000) {
          // 🌟 FIX: Custom Toast instead of browser alert
          showToast("⏰ Reminder: This live class has been running for 1 Hour!", "info");
          setHasNotifiedHour(true); 
        }
      }
    }, 1000);
    
    return () => clearInterval(timer);
  }, [currentView, classStartTime, isStudent, hasNotifiedHour, showToast]);

  useEffect(() => {
    isStudentRef.current = isStudent; isFollowingRef.current = isFollowing; activeSlideIdRef.current = activeSlideId;
  }, [isStudent, isFollowing, activeSlideId])

  const handleToolSelect = useCallback((tool: string) => {
    setRecentTools(prev => {
      const filtered = prev.filter(t => t !== tool);
      return [tool, ...filtered].slice(0, 3); 
    });
  }, []);

  const wakeTopMenu = useCallback(() => {
    setIsTopFaded(false);
    if (topTimerRef.current) clearTimeout(topTimerRef.current);
    topTimerRef.current = setTimeout(() => setIsTopFaded(true), 3000); 
  }, []);

  const wakeBottomUI = useCallback(() => {
    setIsBottomUIFaded(false);
    if (bottomTimerRef.current) clearTimeout(bottomTimerRef.current);
    bottomTimerRef.current = setTimeout(() => {
      setIsBottomUIFaded(true);
      setShowAddMenu(false);
      setShowNavMenu(false);
    }, 3000);
  }, []);

  useEffect(() => {
    wakeTopMenu();
    wakeBottomUI();
    return () => {
      if (topTimerRef.current) clearTimeout(topTimerRef.current);
      if (bottomTimerRef.current) clearTimeout(bottomTimerRef.current);
    }
  }, [wakeTopMenu, wakeBottomUI]);

  useEffect(() => {
    const stopDrawing = () => {
      setIsDrawingOnCanvas(false);
      isDrawingRef.current = false; // 🌟 Mark pen as lifted
      flushElements(); // 🌟 BAM! Send the entire completed stroke instantly!
    };
    window.addEventListener('pointerup', stopDrawing);

    const detectCollision = (e: PointerEvent) => {
      if (isDrawingOnCanvas && drawToolbarRef.current) {
        const rect = drawToolbarRef.current.getBoundingClientRect();
        if (e.clientX >= rect.left && e.clientX <= rect.right && e.clientY >= rect.top && e.clientY <= rect.bottom) {
          setIsGhostMode(true); 
        }
      }
    };
    window.addEventListener('pointermove', detectCollision);

    return () => {
      window.removeEventListener('pointerup', stopDrawing);
      window.removeEventListener('pointermove', detectCollision);
    }
  }, [isDrawingOnCanvas]);

  useEffect(() => {
    if (!isAwaitingPlacement) return;

    const placeOnPointerDown = (ev: PointerEvent) => {
      try {
        if (!pendingPlacement || !excalidrawAPI) return;
        ev.preventDefault(); ev.stopPropagation();

        let sceneX: number | null = null;
        let sceneY: number | null = null;
        try {
          if (typeof excalidrawAPI.getSceneCoordsFromPointer === 'function') {
            const pt = excalidrawAPI.getSceneCoordsFromPointer(ev); 
            sceneX = pt.x; sceneY = pt.y;
          }
        } catch (helperErr) { console.warn(helperErr); }

        if (sceneX === null || sceneY === null) {
          const appState: any = excalidrawAPI?.getAppState ? excalidrawAPI.getAppState() : { scrollX: 0, scrollY: 0, zoom: { value: 1 } };
          let rawZoom = (appState?.zoom?.value != null) ? Number(appState.zoom.value) : 1;
          if (rawZoom > 3) rawZoom = rawZoom / 100;
          const zoomVal = rawZoom || 1;

          const container = document.querySelector('.excalidraw') as HTMLElement || document.body;
          const rect = container.getBoundingClientRect();
          
          sceneX = (ev.clientX - rect.left) / (zoomVal * (rect.width / container.clientWidth || 1)) - (appState?.scrollX ?? 0); 
          sceneY = (ev.clientY - rect.top) / (zoomVal * (rect.height / container.clientHeight || 1)) - (appState?.scrollY ?? 0); 
        }

        const elems = pendingPlacement.elements || [];
        let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
        elems.forEach((el: any) => {
          const x = el.x || 0; const y = el.y || 0; const w = el.width || 0; const h = el.height || 0;
          minX = Math.min(minX, x); minY = Math.min(minY, y);
          maxX = Math.max(maxX, x + w); maxY = Math.max(maxY, y + h);
        });
        if (minX === Infinity) { minX = 0; minY = 0; maxX = 0; maxY = 0; }

        let dx = (sceneX as number) - ((minX + maxX) / 2);
        let dy = (sceneY as number) - ((minY + maxY) / 2);

        const shifted = elems.map((el: any) => ({ ...el, x: (el.x ?? 0) + dx, y: (el.y ?? 0) + dy }));

        if (pendingPlacement.files && Object.keys(pendingPlacement.files).length && excalidrawAPI?.addFiles) {
          excalidrawAPI.addFiles(Object.values(pendingPlacement.files));
          Object.keys(pendingPlacement.files).forEach(id => knownFilesRef.current.add(id)); 
        }
        
        const existing = excalidrawAPI?.getSceneElements ? excalidrawAPI.getSceneElements() : [];
        excalidrawAPI?.updateScene?.({ elements: [...existing, ...shifted] });

        setTimeout(() => { excalidrawAPI?.history?.clear?.(); }, 100);

        try {
          const selectedElementIds = shifted.reduce((acc: any, el: any) => ({ ...acc, [el.id]: true }), {});
          excalidrawAPI?.updateScene?.({ appState: { selectedElementIds } });
          excalidrawAPI?.setActiveTool?.({ type: 'selection' });
        } catch (_) {}

      } catch (err) {
        console.error("Placement failed:", err);
      } finally {
        setPendingPlacement(null); setIsAwaitingPlacement(false);
      }
    };

    window.addEventListener('pointerdown', placeOnPointerDown, true);
    return () => window.removeEventListener('pointerdown', placeOnPointerDown, true);
  }, [isAwaitingPlacement, pendingPlacement, excalidrawAPI]); 

  const resetCollapseTimer = useCallback(() => {
    if (collapseTimeoutRef.current) clearTimeout(collapseTimeoutRef.current);
    if (!isAutoCollapseEnabled) { setIsCollapsed(false); return; }
    setIsCollapsed(false);
    collapseTimeoutRef.current = setTimeout(() => setIsCollapsed(true), 2000); 
  }, [isAutoCollapseEnabled]);

  const togglePin = () => {
    const nextPinned = !isPinned; setIsPinned(nextPinned);
    if (nextPinned) setDrawToolbarPos({ x: 20, y: window.innerHeight - 550 });
  };

  const toggleAutoCollapse = () => {
    const nextState = !isAutoCollapseEnabled; setIsAutoCollapseEnabled(nextState);
    if (nextState) resetCollapseTimer(); else if (collapseTimeoutRef.current) clearTimeout(collapseTimeoutRef.current);
  };

  const forceCollapse = (e: React.MouseEvent) => {
    e.stopPropagation(); 
    if (collapseTimeoutRef.current) clearTimeout(collapseTimeoutRef.current);
    setIsCollapsed(true);
  };

  const fetchAsBase64 = async (url: string) => {
    try {
      const response = await fetch(url); const blob = await response.blob();
      return new Promise<string>((resolve) => {
        const reader = new FileReader(); reader.onloadend = () => resolve(reader.result as string); reader.readAsDataURL(blob);
      });
    } catch (error) { return ""; }
  }

  useEffect(() => {
    if (isViewingPast && pastBoardData && excalidrawAPI) {
      setTimeout(() => {
        if (pastBoardData.files && Object.keys(pastBoardData.files).length > 0) {
          excalidrawAPI.addFiles(Object.values(pastBoardData.files));
        }
        
        excalidrawAPI.updateScene({ 
            elements: pastBoardData.elements,
            appState: { scrollX: 0, scrollY: 0 } 
        });
        
        setPastBoardData(null); 
      }, 150); 
    }
  }, [isViewingPast, pastBoardData, excalidrawAPI]);

  useEffect(() => {
    if (isStudent && currentView === 'board' && roomId && !isViewingPast) {
      
      const joinTimer = setTimeout(() => {
        fetch(`${import.meta.env.VITE_BACKEND_URL}/api/attendance/mark/`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'join', roomId, email: currentUserEmail, name: userFullName })
        }).catch(err => console.warn("Join failed:", err));
      }, 800); 

      return () => {
        clearTimeout(joinTimer);
        
        fetch(`${import.meta.env.VITE_BACKEND_URL}/api/attendance/mark/`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          keepalive: true,
          body: JSON.stringify({ action: 'leave', roomId, email: currentUserEmail })
        }).catch(() => {});
      };
    }
  }, [isStudent, currentView, roomId, isViewingPast, currentUserEmail, userFullName]);

  useEffect(() => {
    if (!excalidrawAPI || currentView !== 'board' || !roomId) return;
    
    const ws = new WebSocket(`${import.meta.env.VITE_WS_URL}/ws/board/${roomId}/`);
    socketRef.current = ws

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data)
      if (data.type === 'wipe_board') {
        if (!isStudentRef.current) return;
        excalidrawAPI.updateScene({ elements: [] }); setSlideNav([]); return;
      }
      if (data.type === 'page_change' && data.pageId) { setActiveSlideId(data.pageId); return; }
      
      if (data.type === 'initial_state' && data.state) {
        if (data.files && Object.keys(data.files).length > 0) excalidrawAPI.addFiles(Object.values(data.files));
        
        let newEmbedFound = false;
        const trustedState = data.state.map((el: any) => {
          if (el.type === 'embeddable') {
            if (isStudentRef.current && !seenEmbedsRef.current.has(el.id)) {
              seenEmbedsRef.current.add(el.id);
              newEmbedFound = true;
            }
            return { ...el, validated: true };
          }
          return el;
        });

        // 🌟 NEW: Detect new embeds on initial load and show the warning toast!
        if (newEmbedFound) {
          showToast("If a web embed is not showing, please try reloading the page.", "warning");
        }

        excalidrawAPI.updateScene({ elements: trustedState }); 
        if (data.currentPage) setActiveSlideId(data.currentPage); 
        setTimeout(() => { if (excalidrawAPI.history) excalidrawAPI.history.clear(); }, 100);
        return;
      }
      
      if (data.type === 'load_pdf') {
        if (!isStudentRef.current) return; 
        setSlideNav(data.slides || []); return;
      }

      if (data.type === 'camera_sync') {
        if (!isStudentRef.current || !isFollowingRef.current) return;
        
        const tCam = data.camera;
        const myAppState = excalidrawAPI.getAppState();
        const myWidth = myAppState.width || window.innerWidth;
        const myHeight = myAppState.height || window.innerHeight;

        if (!tCam.width || !tCam.height) {
          excalidrawAPI.updateScene({ appState: { scrollX: tCam.scrollX, scrollY: tCam.scrollY, zoom: { value: tCam.zoom } } });
          return;
        }

        const teacherCenterX = (tCam.width / 2) / tCam.zoom - tCam.scrollX;
        const teacherCenterY = (tCam.height / 2) / tCam.zoom - tCam.scrollY;

        const widthRatio = myWidth / tCam.width;
        const heightRatio = myHeight / tCam.height;
        const scaleFactor = Math.min(1, Math.min(widthRatio, heightRatio) * 0.95); 
        
        const newZoom = Math.max(0.1, tCam.zoom * scaleFactor); 

        const newScrollX = (myWidth / 2) / newZoom - teacherCenterX;
        const newScrollY = (myHeight / 2) / newZoom - teacherCenterY;

        excalidrawAPI.updateScene({ 
          appState: { 
            scrollX: newScrollX, 
            scrollY: newScrollY, 
            zoom: { value: newZoom } 
          } 
        }); 
        return;
      }

      if (data.drawing_data && data.clientId !== clientIdRef.current) {
        if (data.files && Object.keys(data.files).length > 0) {
          excalidrawAPI.addFiles(Object.values(data.files));
          Object.keys(data.files).forEach(id => knownFilesRef.current.add(id)); 
        }
        lastSentElementsRef.current = JSON.stringify(data.drawing_data);

        let newEmbedFound = false;
        const trustedElements = data.drawing_data.map((el: any) => {
          if (el.type === 'embeddable') {
            // 🌟 TRACK EMBEDS: Only show warning if it's a completely new iframe block!
            if (isStudentRef.current && !seenEmbedsRef.current.has(el.id)) {
              seenEmbedsRef.current.add(el.id);
              newEmbedFound = true;
            }
            return { ...el, validated: true };
          }
          return el;
        });

        // Trigger toast for live updates
        if (newEmbedFound) {
          showToast("If a web embed is not showing, please try reloading the page.", "warning");
        }

        excalidrawAPI.updateScene({ elements: trustedElements });
      }
    }
    return () => ws.close()
  }, [excalidrawAPI, isAuthenticated, showToast]) 

  //Create the "Flush" Function
  const flushElements = useCallback(() => {
    if (isStudentRef.current || socketRef.current?.readyState !== WebSocket.OPEN || !excalidrawAPI) return;

    const elements = latestElementsRef.current;
    const elementsString = JSON.stringify(elements);
    const currentFiles = excalidrawAPI.getFiles();
    const newFilesToSend: any = {};
    let hasNewFiles = false;

    elements.forEach((el: any) => {
      if (el.type === 'image' && el.fileId && currentFiles[el.fileId] && !knownFilesRef.current.has(el.fileId)) {
        newFilesToSend[el.fileId] = currentFiles[el.fileId];
        knownFilesRef.current.add(el.fileId);
        hasNewFiles = true;
      }
    });

    if (elementsString !== lastSentElementsRef.current || hasNewFiles) {
      lastSentElementsRef.current = elementsString;
      socketRef.current.send(JSON.stringify({ 
        drawing_data: elements, files: hasNewFiles ? newFilesToSend : {}, pageId: activeSlideIdRef.current, clientId: clientIdRef.current 
      }));
    }
  }, [excalidrawAPI]);

  //chnaged the handleExcalidrawChange
  const handleExcalidrawChange = useCallback((elements: readonly any[], appState: any) => {
    if (isStudentRef.current || socketRef.current?.readyState !== WebSocket.OPEN) return;

    // 1. Always save the latest drawing data quietly in the background
    latestElementsRef.current = elements;

    // 2. CHECK CAMERA MOVEMENT: Only sync if they actually panned/zoomed!
    // We use .toFixed(1) to ignore microscopic floating-point pixel jitters
    const newCamState = `${appState.scrollX.toFixed(1)}|${appState.scrollY.toFixed(1)}|${appState.zoom.value}`;

    if (newCamState !== lastCamStateRef.current) {
      const now = Date.now();
      
      // Throttle to 100ms (10fps is super smooth for panning and saves the server)
      if (now - lastCameraSyncRef.current > 100) {
        lastCameraSyncRef.current = now;
        lastCamStateRef.current = newCamState;

        socketRef.current.send(JSON.stringify({ 
          type: 'camera_sync', 
          camera: { 
            scrollX: appState.scrollX, 
            scrollY: appState.scrollY, 
            zoom: appState.zoom.value,
            width: appState.width || window.innerWidth,
            height: appState.height || window.innerHeight
          } 
        }));
      }
    }

    // 3. Only flush drawing data if the pen is up
    if (!isDrawingRef.current) {
      flushElements();
    }
  }, [flushElements]);

  const handleImport = async () => {
    if (!excalidrawAPI || !pendingPdf) return;
    
    setIsUploading(true); 
    const fileToUpload = pendingPdf;
    setPendingPdf(null); 
    
    const formData = new FormData(); 
    formData.append('file', fileToUpload);
    formData.append('start_page', pdfStart.toString());
    formData.append('end_page', pdfEnd.toString());

    try {
      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/upload-pdf/`, { method: 'POST', body: formData })
      const data = await response.json()
      
      if (data.image_urls) {
        const slideUrls: string[] = data.image_urls; const cacheBuster = Date.now() 
        setShowImportModal(false); setIsUploading(false); excalidrawAPI.updateScene({ elements: [] }); setSlideNav([])
        if (socketRef.current?.readyState === WebSocket.OPEN) socketRef.current.send(JSON.stringify({ type: 'wipe_memory' }))

        const newElements: any[] = []; const newFiles: any = {}; const newNavItems: {id: string, src: string, yPos: number}[] = [];
        let currentY = 100; 

        for (let i = 0; i < slideUrls.length; i++) {
          const src = slideUrls[i]; const finalSrc = `${src}?t=${cacheBuster}`; const pageId = `page_${i + 1}`;
          newNavItems.push({ id: pageId, src: finalSrc, yPos: currentY });

          const dataURL = await fetchAsBase64(finalSrc);
          const mimeMatch = dataURL.match(/data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+).*,.*/);
          const fileId = `file-${Date.now()}-${i}`;
          newFiles[fileId] = { id: fileId, dataURL, mimeType: mimeMatch ? mimeMatch[1] : 'image/png', created: Date.now() };
          knownFilesRef.current.add(fileId);

          newElements.push(
            { id: `shadow-${Date.now()}-${i}`, type: "rectangle", x: 108, y: currentY + 8, width: 800, height: 600, angle: 0, strokeColor: "transparent", backgroundColor: "#cbd5e1", fillStyle: "solid", strokeWidth: 0, strokeStyle: "solid", roughness: 0, opacity: 60, groupIds: [], frameId: null, roundness: null, seed: 1, version: 1, versionNonce: 1, isDeleted: false, boundElements: null, updated: Date.now(), link: null, locked: true },
            { id: `img-${Date.now()}-${i}`, type: "image", x: 100, y: currentY, width: 800, height: 600, angle: 0, strokeColor: "transparent", backgroundColor: "transparent", fillStyle: "hachure", strokeWidth: 1, strokeStyle: "solid", roughness: 1, opacity: 100, groupIds: [], frameId: null, roundness: null, seed: 1, version: 1, versionNonce: 1, isDeleted: false, boundElements: null, updated: Date.now(), link: null, locked: true, fileId: fileId, status: "saved", scale: [1, 1] }
          );
          currentY += 700; 
        }

        excalidrawAPI.addFiles(Object.values(newFiles));

        setTimeout(() => {
          excalidrawAPI.updateScene({ elements: newElements, appState: { scrollX: -50, scrollY: -50, zoom: { value: 1 }, viewBackgroundColor: "#f1f5f9" } });
          setActiveSlideId('page_1'); setSlideNav(newNavItems);
          
          setTimeout(() => { if (excalidrawAPI.history) excalidrawAPI.history.clear(); }, 100);

          if (socketRef.current?.readyState === WebSocket.OPEN) {
            socketRef.current.send(JSON.stringify({ type: 'load_pdf', slides: newNavItems, method: 'spatial' }))
            socketRef.current.send(JSON.stringify({ drawing_data: newElements, files: newFiles, pageId: 'page_1', clientId: clientIdRef.current }));
          }
        }, 50);
      }
    } catch (error) { setIsUploading(false); }
  }

  const handleThumbnailClick = (pageId: string) => {
    if (!excalidrawAPI || isStudent) return; 
    const targetSlide = slideNav.find(slide => slide.id === pageId);
    if (!targetSlide) return;
    excalidrawAPI.updateScene({ appState: { scrollX: -50, scrollY: -(targetSlide.yPos) + 50, zoom: { value: 1 } } });
    setActiveSlideId(pageId);
    if (socketRef.current?.readyState === WebSocket.OPEN) socketRef.current.send(JSON.stringify({ type: 'page_change', pageId: pageId }))
  }

  const snapToolbarToPen = (e: React.PointerEvent) => {
    if (isStudent || isDraggingDrawToolbar || isPinned) return;
    const mouseX = e.clientX; const mouseY = e.clientY;
    const tbCenterX = drawToolbarPos.x + 150; const tbCenterY = drawToolbarPos.y + (isCollapsed ? 35 : 200); 

    if (Math.sqrt(Math.pow(tbCenterX - mouseX, 2) + Math.pow(tbCenterY - mouseY, 2)) > 500) {
      let newX = mouseX + 150; let newY = mouseY - 100;
      if (newX + 350 > window.innerWidth) newX = mouseX - 350 - 100;
      setDrawToolbarPos({ 
        x: Math.max(20, Math.min(newX, window.innerWidth - 370)), 
        y: Math.max(20, Math.min(newY, window.innerHeight - 470)) 
      });
    }
  };

  const openMermaidInsert = async () => {
    setShowAddMenu(false);
    try {
      if (excalidrawAPI?.actionManager?.executeAction) {
        excalidrawAPI.actionManager.executeAction("insertMermaid");
        return;
      }
    } catch (err) {
      console.warn("insertMermaid action failed, falling back to modal", err);
    }
    setShowMermaidModal(true); 
  }; 

  const handleCanvasPointerUp = (e: PointerEvent | React.PointerEvent) => {
    setIsDrawingOnCanvas(false)
    if (!pendingPlacement || !isAwaitingPlacement) {
      if (!isStudent && !isDraggingDrawToolbar && !isPinned) {
        const mouseX = (e as React.PointerEvent).clientX; const mouseY = (e as React.PointerEvent).clientY;
        const tbCenterX = drawToolbarPos.x + 150; const tbCenterY = drawToolbarPos.y + (isCollapsed ? 35 : 200); 

        if (Math.sqrt(Math.pow(tbCenterX - mouseX, 2) + Math.pow(tbCenterY - mouseY, 2)) > 500) {
          let newX = mouseX + 150; let newY = mouseY - 100;
          if (newX + 350 > window.innerWidth) newX = mouseX - 350 - 100;
          setDrawToolbarPos({ 
            x: Math.max(20, Math.min(newX, window.innerWidth - 370)), 
            y: Math.max(20, Math.min(newY, window.innerHeight - 470)) 
          });
        }
      }
      return
    }
    e.preventDefault?.(); e.stopPropagation?.();
  } 

  return (
    <div style={{ position: 'fixed', inset: 0, width: '100dvw', height: '100dvh', backgroundColor: '#ffffff', overflow: 'hidden' }}>
      
      {/* 🌟 GLOBAL APP TOAST (Replaces clunky alerts!) */}
      {toastMessage && (
        <div style={{
          position: 'fixed', top: 'clamp(20px, 4vw, 40px)', left: '50%', transform: 'translateX(-50%)',
          zIndex: 9999999,
          background: toastMessage.type === 'warning' ? '#f59e0b' : toastMessage.type === 'error' ? '#ef4444' : '#3b82f6',
          color: 'white', padding: '12px 24px', borderRadius: '30px',
          boxShadow: '0 10px 25px rgba(0,0,0,0.2)', display: 'flex', alignItems: 'center', gap: '10px',
          fontWeight: 'bold', fontSize: 'clamp(14px, 2vw, 16px)', textAlign: 'center', maxWidth: '90vw',
          pointerEvents: 'none', transition: 'all 0.3s ease'
        }}>
          {toastMessage.type === 'warning' ? '⚠️' : toastMessage.type === 'error' ? '❌' : 'ℹ️'} 
          {toastMessage.text}
        </div>
      )}

      {currentView === 'auth' && (
        <AuthScreen onAuthSuccess={handleAuthSuccess} />
      )}

      {currentView === 'dashboard' && (
        isStudent ? (
          <StudentDashboard 
            onJoinClass={handleJoinClass} 
            onLogout={handleLogout} 
            studentInfo={studentInfo} 
            onOpenPastClass={handleOpenPastClass}
            studentEmail={currentUserEmail}
          />
        ) : (
          <TeacherDashboard onStartClass={handleStartClass} onLogout={handleLogout} teacherName={userFullName} onOpenPastClass={handleOpenPastClass} />
        )
      )}

      {currentView === 'board' && (
        <>
          <div style={{ position: 'absolute', inset: 0, zIndex: 0 }} 
            onPointerDown={() => {
              setIsDrawingOnCanvas(true);
              isDrawingRef.current = true; // 🌟 Pen touches screen
            }} 
            onPointerUp={(e) => {
              handleCanvasPointerUp(e);
              isDrawingRef.current = false; // 🌟 Pen leaves screen
              flushElements(); // 🌟 Send stroke!
            }}
          > 
            <Excalidraw 
              theme={theme} 
              excalidrawAPI={(api) => setExcalidrawAPI(api)} 
              viewModeEnabled={isStudent} 
              zenModeEnabled={true} 
              validateEmbeddable={ALLOW_ALL_LINKS} 
              onChange={handleExcalidrawChange} 
            />
          </div>

          <input type="file" accept="application/pdf" ref={fileInputRef} style={{ display: 'none' }} 
            onChange={(e) => { 
              const file = e.target.files?.[0]; 
              if (file) {
                setPendingPdf(file); 
              }
              e.target.value = ''; 
            }} 
          />

          {showMermaidModal && (
            <MermaidModal 
              onClose={() => setShowMermaidModal(false)} 
              onInsert={(elements, files) => {
                setPendingPlacement({ elements, files });
                setIsAwaitingPlacement(true);
              }}
            />
          )}

          {/* 🛑 CLEAR CONFIRM WARNING MODAL */}
          {showClearConfirm && (
            <div style={{
              position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
              backgroundColor: 'white', padding: 'clamp(15px, 3vw, 24px) clamp(20px, 4vw, 32px)', borderRadius: '12px',
              boxShadow: '0 10px 40px rgba(0,0,0,0.3)', display: 'flex', flexDirection: 'column',
              gap: '16px', border: '1px solid #e2e8f0', zIndex: 9999, alignItems: 'center', width: '90%', maxWidth: '400px'
            }}>
              <span style={{ fontSize: 'clamp(16px, 2.5vw, 18px)', fontWeight: 'bold', color: '#ef4444' }}>⚠️ Permanent Action</span>
              <span style={{ fontSize: 'clamp(12px, 2vw, 14px)', color: '#64748b', marginBottom: '8px', textAlign: 'center' }}>
                Are you sure? This will permanently delete your notes and cannot be restored via Undo. Backgrounds will remain.
              </span>
              <div style={{ display: 'flex', gap: '12px', width: '100%', justifyContent: 'center' }}>
                <button 
                  onClick={(e) => {
                    e.stopPropagation(); setShowClearConfirm(false);
                    if (excalidrawAPI) {
                      const allElements = excalidrawAPI.getSceneElements();
                      const onlyBackgrounds = allElements.filter((el: any) => el.id.startsWith('img-') || el.id.startsWith('shadow-'));
                      excalidrawAPI.updateScene({ elements: onlyBackgrounds });
                    }
                  }} 
                  style={{ background: '#ef4444', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '14px', flex: 1 }}>
                  Yes, Clear All
                </button>
                <button 
                  onClick={(e) => { e.stopPropagation(); setShowClearConfirm(false); }} 
                  style={{ background: '#f1f5f9', color: '#334155', border: '1px solid #cbd5e1', padding: '10px 20px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '14px', flex: 1 }}>
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* 📄 PDF CHAPTER SELECTOR MODAL */}
          {pendingPdf && (
            <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 99999, padding: '10px' }}>
              <div style={{ background: 'white', padding: 'clamp(15px, 4vw, 24px)', borderRadius: '12px', width: '90%', maxWidth: '350px', boxShadow: '0 10px 25px rgba(0,0,0,0.2)', fontFamily: 'sans-serif' }}>
                <h3 style={{ margin: '0 0 10px 0', color: '#0f172a', fontSize: 'clamp(16px, 3vw, 20px)' }}>📖 Select Chapter</h3>
                <p style={{ fontSize: 'clamp(12px, 1.8vw, 13px)', color: '#64748b', marginBottom: '20px' }}>
                  To keep the live board running at lightning speed, please import textbooks in chunks of 30 pages maximum.
                </p>
                <div style={{ display: 'flex', gap: '15px', marginBottom: '20px' }}>
                  <div style={{ flex: 1 }}>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', marginBottom: '5px', color: '#334155' }}>Start Page</label>
                    <input type="number" min="1" value={pdfStart} onChange={e => setPdfStart(Number(e.target.value))} style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1', boxSizing: 'border-box' }} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', marginBottom: '5px', color: '#334155' }}>End Page</label>
                    <input type="number" min="1" value={pdfEnd} onChange={e => setPdfEnd(Number(e.target.value))} style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1', boxSizing: 'border-box' }} />
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button onClick={() => setPendingPdf(null)} style={{ flex: 1, background: '#f1f5f9', color: '#334155', border: '1px solid #cbd5e1', padding: '10px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>Cancel</button>
                  <button onClick={() => handleImport()} style={{ flex: 2, background: '#3b82f6', color: 'white', border: 'none', padding: '10px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>Import Pages</button>
                </div>
              </div>
            </div>
          )}

          {/* 📱 TEACHER QR CODE OVERLAY */}
          {showQRModal && !isStudent && roomId && (
            <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 99999, padding: '10px' }} onClick={() => setShowQRModal(false)}>
              <div style={{ background: 'white', padding: 'clamp(20px, 4vw, 40px)', borderRadius: '16px', textAlign: 'center', boxShadow: '0 20px 50px rgba(0,0,0,0.3)', width: '90%', maxWidth: '400px' }} onClick={e => e.stopPropagation()}>
                <h2 style={{ marginTop: 0, color: '#0f172a', fontSize: 'clamp(20px, 3vw, 24px)' }}>Scan to Join</h2>
                <p style={{ color: '#64748b', marginBottom: '20px', fontSize: 'clamp(12px, 1.8vw, 14px)' }}>Students can scan this code from their dashboard.</p>
                <img src={`https://quickchart.io/qr?text=${roomId}&size=300`} alt="Join QR Code" style={{ width: '100%', maxWidth: '300px', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '10px' }} />
                <div style={{ marginTop: '20px' }}>
                  <button onClick={() => setShowQRModal(false)} style={{ background: '#3b82f6', color: 'white', border: 'none', padding: '10px 30px', borderRadius: '8px', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer', width: '100%' }}>Close Overlay</button>
                </div>
              </div>
            </div>
          )}

          {/* 📋 LIVE ROSTER MODAL */}
          {showLiveRoster && !isStudent && (
            <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 99999, padding: '10px' }} onClick={() => setShowLiveRoster(false)}>
              <div style={{ background: 'white', padding: 'clamp(15px, 3vw, 30px)', borderRadius: '12px', width: '90%', maxWidth: '450px', maxHeight: '70vh', overflowY: 'auto', boxShadow: '0 20px 50px rgba(0,0,0,0.3)' }} onClick={e => e.stopPropagation()}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                  <h3 style={{ margin: 0, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '10px', fontSize: 'clamp(16px, 3vw, 20px)' }}>
                    <span style={{ display: 'inline-block', width: '12px', height: '12px', background: '#10b981', borderRadius: '50%', boxShadow: '0 0 8px #10b981' }}></span>
                    Live Roster ({liveStudents.length})
                  </h3>
                  <button onClick={() => setShowLiveRoster(false)} style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer' }}>❌</button>
                </div>
                {liveStudents.length === 0 ? (
                  <div style={{ textAlign: 'center', color: '#64748b', padding: '40px 0' }}>
                    <span style={{ fontSize: '40px', display: 'block', marginBottom: '10px' }}>👀</span>
                    Waiting for students to join...
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {liveStudents.map((stu, idx) => (
                      <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', borderLeft: '4px solid #3b82f6', flexWrap: 'wrap', gap: '10px' }}>
                        <div>
                          <strong style={{ color: '#0f172a', display: 'block', fontSize: 'clamp(13px, 2vw, 15px)' }}>{stu.name}</strong>
                          <span style={{ fontSize: 'clamp(11px, 1.5vw, 12px)', color: '#64748b' }}>{stu.email}</span>
                        </div>
                        <div style={{ fontSize: 'clamp(10px, 1.5vw, 12px)', color: '#10b981', fontWeight: 'bold', background: '#d1fae5', padding: '4px 8px', borderRadius: '4px' }}>
                          In class for {Math.floor(stu.current_session_seconds / 60)}m {stu.current_session_seconds % 60}s
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 📍 DIAGRAM PLACEMENT HELPER */}
          {isAwaitingPlacement && pendingPlacement && (
            <div style={{
              position: 'fixed', bottom: 'max(100px, env(safe-area-inset-bottom))', left: '50%', transform: 'translateX(-50%)',
              zIndex: 20000, background: 'rgba(0,0,0,0.85)', color: 'white', padding: '12px 20px',
              borderRadius: '30px', display: 'flex', gap: 15, alignItems: 'center', fontWeight: 600, fontSize: 'clamp(12px, 2vw, 16px)', width: 'max-content', maxWidth: '90vw',
              boxShadow: '0 10px 25px rgba(0,0,0,0.3)', backdropFilter: 'blur(5px)'
            }}>
              <div>📍 Click where you want to place the diagram</div>
              <button onClick={() => {
                setPendingPlacement(null); setIsAwaitingPlacement(false);
              }} style={{ background: '#ef4444', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '20px', cursor: 'pointer', fontWeight: 'bold' }}>Cancel</button>
            </div>
          )} 

          {/* ⏰ TOP RIGHT LIVE CLOCK */}
          <div style={{ position: 'absolute', top: 20, right: 20, zIndex: 2000, background: theme === 'dark' ? '#232329' : 'white', padding: 'clamp(5px, 1.5vw, 10px) clamp(10px, 2.5vw, 20px)', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.15)', fontWeight: 'bold', fontSize: 'clamp(12px, 2vw, 16px)', border: theme === 'dark' ? '1px solid #444' : '1px solid #e2e8f0', color: theme === 'dark' ? 'white' : '#1e293b', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span className={!isStudent && classStartTime && (Date.now() - classStartTime > 3600000) ? 'text-red-500 animate-pulse' : ''}>
              🕒 {clockTime}
            </span>
          </div>

          {/* 👥 BOTTOM RIGHT ACTIVE BUTTON (TEACHER ONLY) */}
          {!isStudent && !isViewingPast && (
            <div className={isBottomUIFaded ? 'ui-faded' : 'ui-awake'} onPointerMoveCapture={wakeBottomUI} onPointerDownCapture={wakeBottomUI}
              onClick={() => setShowLiveRoster(true)}
              style={{ 
                position: 'fixed', bottom: 'max(30px, env(safe-area-inset-bottom))', right: 'clamp(20px, 4vw, 30px)', 
                zIndex: 2000, background: theme === 'dark' ? 'rgba(35, 35, 41, 0.95)' : 'rgba(255, 255, 255, 0.95)', 
                backdropFilter: 'blur(10px)', padding: 'clamp(8px, 1.5vw, 12px) clamp(16px, 3vw, 24px)', 
                borderRadius: '50px', boxShadow: '0 8px 32px rgba(0,0,0,0.15)', 
                border: '2px solid #3b82f6', color: '#3b82f6', fontWeight: 'bold', fontSize: 'clamp(14px, 2vw, 18px)',
                display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', transition: 'transform 0.1s', transformOrigin: 'bottom right' 
              }}
              onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
              onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
            >
              👥 {liveStudents.length} Active
            </div>
          )}

          {/* 🛑 STATIC BOTTOM-LEFT DOCK (Menu & Add Buttons) */}
          <div className={isBottomUIFaded ? 'ui-faded' : 'ui-awake'} onPointerMoveCapture={wakeBottomUI} onPointerDownCapture={wakeBottomUI} 
            style={{ 
              position: 'fixed', bottom: 'max(30px, env(safe-area-inset-bottom))', left: 'clamp(20px, 4vw, 30px)', 
              zIndex: 2000, display: 'flex', gap: '12px' 
            }}>
            
            {/* ⚙️ SYSTEM MENU POPOVER */}
            <div style={{ position: 'relative' }}>
              {showNavMenu && (
                <div className="popover-menu" style={{ bottom: 'calc(100% + 12px)', left: 0, right: 'auto', transformOrigin: 'bottom left', background: theme === 'dark' ? '#232329' : 'white', border: theme === 'dark' ? '1px solid #444' : '1px solid #e2e8f0' }}>
                  
                  <div className="popover-item" style={{ cursor: 'default', color: theme === 'dark' ? 'white' : '#334155' }}>
                    {isStudent ? (
                      <label style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', width: '100%', margin: 0 }}>
                        <input type="checkbox" checked={isFollowing} onChange={(e) => setIsFollowing(e.target.checked)} style={{ marginRight: '8px', width: '16px', height: '16px', cursor: 'pointer' }}/>
                        Follow Teacher
                      </label>
                    ) : (
                      <span style={{ color: '#3b82f6', fontWeight: 'bold' }}>👨‍🏫 Teacher Mode</span>
                    )}
                  </div>

                  <button className="popover-item" style={{ color: theme === 'dark' ? 'white' : '#334155' }} onClick={() => { setTheme(theme === 'light' ? 'dark' : 'light'); setShowNavMenu(false); }}>
                    {theme === 'light' ? '🌙 Dark Mode' : '☀️ Light Mode'}
                  </button>

                  {!isStudent && excalidrawAPI && (
                    <button className="popover-item" style={{ color: theme === 'dark' ? 'white' : '#334155' }} onClick={() => { excalidrawAPI.actionManager.executeAction("saveFileToDisk"); setShowNavMenu(false); }}>
                      💾 Export Board
                    </button>
                  )}

                  {!isStudent && isQRMode && (
                    <button className="popover-item" style={{ color: theme === 'dark' ? 'white' : '#334155' }} onClick={() => { setShowQRModal(true); setShowNavMenu(false); }}>
                      📱 Show QR
                    </button>
                  )}

                  <hr style={{ width: '100%', border: 'none', borderTop: theme === 'dark' ? '1px solid #444' : '1px solid #e2e8f0', margin: '4px 0' }} />

                  <button className="popover-item" onClick={handleExitClass} style={{ color: '#64748b' }}>
                    🔙 Dashboard
                  </button>
                  
                  <button className="popover-item" onClick={handleLogout} style={{ color: '#ef4444' }}>
                    🚪 Logout
                  </button>
                </div>
              )}
              
              <button className="action-btn" style={{ background: theme === 'dark' ? '#232329' : 'white', color: theme === 'dark' ? 'white' : '#0f172a', border: theme === 'dark' ? '1px solid #444' : '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '6px' }} onClick={() => { setShowNavMenu(!showNavMenu); setShowAddMenu(false); }}>
                ⚙️ Menu
              </button>
            </div>

            {/* ➕ ADD MENU POPOVER */}
            {!isStudent && excalidrawAPI && (
              <div style={{ position: 'relative' }}>
                {showAddMenu && (
                  <div className="popover-menu" style={{ bottom: 'calc(100% + 12px)', left: 0, right: 'auto', transformOrigin: 'bottom left', background: theme === 'dark' ? '#232329' : 'white', border: theme === 'dark' ? '1px solid #444' : '1px solid #e2e8f0' }}>
                    <button className="popover-item" style={{ color: theme === 'dark' ? 'white' : '#334155' }} onClick={(e) => { e.stopPropagation(); excalidrawAPI.setActiveTool({ type: 'image' }); setShowAddMenu(false); }}>🖼️ Add Image</button>
                    <button className="popover-item" style={{ color: theme === 'dark' ? 'white' : '#334155' }} onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); setShowAddMenu(false); }}>📄 Import Document</button>
                    <button className="popover-item" style={{ color: theme === 'dark' ? 'white' : '#334155' }} onClick={(e) => { e.stopPropagation(); excalidrawAPI.setActiveTool({ type: 'embeddable' }); setShowAddMenu(false); }}>🌐 Web Embed</button>
                    <button className="popover-item" style={{ color: theme === 'dark' ? 'white' : '#334155' }} onClick={(e) => { e.stopPropagation(); openMermaidInsert(); setShowAddMenu(false); }}>🧜‍♀️ Mermaid Code</button>
                  </div>
                )}
                <button className="action-btn add-btn" onClick={() => { setShowAddMenu(!showAddMenu); setShowNavMenu(false); }}>
                  ➕ ADD
                </button>
              </div>
            )}
          </div>

          {/* 🛸 THUMBNAIL NAVIGATOR */}
          {slideNav.length > 0 && (
            <Draggable handle=".drag-handle" bounds="parent" nodeRef={navRef}>
              <div ref={navRef} className={isBottomUIFaded ? 'ui-faded' : 'ui-awake'} onPointerMoveCapture={wakeBottomUI} onPointerDownCapture={wakeBottomUI} style={{ position: 'absolute', bottom: '100px', left: '20px', zIndex: 2000, display: 'flex', flexDirection: 'column', gap: '5px', backgroundColor: 'rgba(255, 255, 255, 0.95)', padding: '10px', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.15)', border: '1px solid #e2e8f0', maxWidth: 'calc(100vw - 40px)' }}>
                <div className="drag-handle" style={{ cursor: 'grab', width: '100%', textAlign: 'center', color: '#94a3b8', paddingBottom: '5px', fontSize: '12px' }}>⠿ Drag Navigator ⠿</div>
                <div style={{ display: 'flex', gap: '10px', maxWidth: '100%', overflowX: 'auto', paddingBottom: '5px' }}>
                  {slideNav.map((slide, index) => (
                    <div key={slide.id} onClick={() => handleThumbnailClick(slide.id)} style={{ minWidth: '80px', height: '60px', flexShrink: 0, border: activeSlideId === slide.id ? '3px solid #3b82f6' : '1px solid #cbd5e1', borderRadius: '6px', cursor: isStudent ? 'default' : 'pointer', backgroundImage: `url(${slide.src})`, backgroundSize: 'cover', backgroundPosition: 'center', opacity: activeSlideId === slide.id ? 1 : 0.6 }}>
                      <div style={{ background: 'rgba(0,0,0,0.6)', color: 'white', fontSize: '10px', width: '16px', height: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderTopLeftRadius: '4px' }}>{index + 1}</div>
                    </div>
                  ))}
                </div>
              </div>
            </Draggable>
          )}

          {/* 🎨 DRAWING TOOLBAR */}
          {!isStudent && excalidrawAPI && (
            <Draggable 
              handle=".draw-drag-handle" bounds="parent" nodeRef={drawToolbarRef} position={drawToolbarPos} 
              onStart={(e, data) => { 
                setIsDraggingDrawToolbar(true); 
                drawDragStartPos.current = { x: data.x, y: data.y };
              }} 
              onDrag={(e, data) => setDrawToolbarPos({ x: data.x, y: data.y })} 
              onStop={(e, data) => { 
                setIsDraggingDrawToolbar(false); 
                const dist = Math.abs(data.x - drawDragStartPos.current.x) + Math.abs(data.y - drawDragStartPos.current.y);
                if (isCollapsed && dist < 5) {
                  setIsCollapsed(false); 
                  resetCollapseTimer();
                } else if (!isCollapsed) {
                  resetCollapseTimer();
                }
              }}
            >
              <div ref={drawToolbarRef} className={isGhostMode ? 'collision-faded' : ''} style={{ position: 'absolute', top: 0, left: 0, zIndex: 2000, pointerEvents: (isGhostMode && isDrawingOnCanvas) ? 'none' : 'auto', transition: isDraggingDrawToolbar ? 'none' : 'transform 0.4s cubic-bezier(0.2, 0.8, 0.2, 1)' }} 
              onPointerDownCapture={(e) => { const t = e.target as HTMLElement; if (t.closest('.moon-circle')) return; setIsGhostMode(false); if (!isCollapsed) resetCollapseTimer(); }} 
              onPointerMoveCapture={() => { if (!isDrawingOnCanvas) setIsGhostMode(false); if(!isCollapsed) resetCollapseTimer(); }} onWheelCapture={() => { if(!isCollapsed) resetCollapseTimer(); }} onScrollCapture={() => { if(!isCollapsed) resetCollapseTimer(); }} onTouchMoveCapture={() => { if(!isCollapsed) resetCollapseTimer(); }} onMouseEnter={() => { if (!isDrawingOnCanvas) setIsGhostMode(false); if (!isCollapsed) resetCollapseTimer(); }}>
                {isCollapsed ? (
                  <div style={{ position: 'relative' }}>
                    
                    <div className="collapsed-circle draw-drag-handle" title="Drag to Move, Click to Expand">✏️</div>

                    {recentTools.map((tool, idx) => {
                      const angles = [-Math.PI * 0.75, -Math.PI * 0.5, -Math.PI * 0.25];
                      const x = Math.cos(angles[idx]) * orbitR; 
                      const y = Math.sin(angles[idx]) * orbitR;
                      return (
                        <div key={tool} className="moon-circle" style={{ position: 'absolute', top: '50%', left: '50%', transform: `translate(calc(-50% + ${x}px), calc(-50% + ${y}px))` }}
                          onClick={(e) => { e.stopPropagation(); handleToolSelect(tool); excalidrawAPI?.updateScene({ appState: { activeTool: { type: tool, customType: null, locked: tool !== 'selection' } } }); }} title={tool}>
                          {toolIcons[tool] || '🔧'}
                        </div>
                      )
                    })}

                    <div className="moon-circle" style={{ position: 'absolute', top: '50%', left: '50%', transform: `translate(calc(-50% + ${Math.cos(Math.PI * 0.75) * orbitR}px), calc(-50% + ${Math.sin(Math.PI * 0.75) * orbitR}px))` }} 
                      onClick={(e) => { 
                        e.preventDefault(); e.stopPropagation(); 
                        const undoBtn = document.querySelector('[aria-label="Undo"]') as HTMLButtonElement | null;
                        if (undoBtn) undoBtn.click();
                      }} 
                      title="Undo"
                    >↩️</div>
                    
                    <div className="moon-circle moon-danger" style={{ position: 'absolute', top: '50%', left: '50%', transform: `translate(calc(-50% + ${Math.cos(Math.PI * 0.5) * orbitR}px), calc(-50% + ${Math.sin(Math.PI * 0.5) * orbitR}px))` }} 
                      onClick={(e) => { 
                        e.preventDefault(); e.stopPropagation(); setShowClearConfirm(true); 
                      }} 
                      title="Clear Ink"
                    >🗑️</div>
                    
                    <div className="moon-circle" style={{ position: 'absolute', top: '50%', left: '50%', transform: `translate(calc(-50% + ${Math.cos(Math.PI * 0.25) * orbitR}px), calc(-50% + ${Math.sin(Math.PI * 0.25) * orbitR}px))` }} 
                      onClick={(e) => { 
                        e.preventDefault(); e.stopPropagation(); 
                        const redoBtn = document.querySelector('[aria-label="Redo"]') as HTMLButtonElement | null;
                        if (redoBtn) redoBtn.click();
                      }} 
                      title="Redo"
                    >↪️</div>

                    <div className="moon-circle" style={{ 
                      position: 'absolute', top: '50%', left: '50%', 
                      transform: `translate(calc(-50% + ${Math.cos(Math.PI) * orbitR}px), calc(-50% + ${Math.sin(Math.PI) * orbitR}px))`,
                      background: isSnapEnabled ? '#3b82f6' : '',
                      borderColor: isSnapEnabled ? '#60a5fa' : ''
                    }} 
                      onClick={(e) => { 
                        e.preventDefault(); e.stopPropagation(); 
                        const nextState = !isSnapEnabled;
                        setIsSnapEnabled(nextState);
                        if (excalidrawAPI) excalidrawAPI.updateScene({ appState: { objectsSnapModeEnabled: nextState, gridSize: nextState ? 20 : null } });
                      }} 
                      title="Toggle Snap to Object"
                    >🧲</div>
                  </div>
                ) : (
                  <div>
                    <div className="draw-toolbar-header">
                      <div className="draw-drag-handle">⠿ Tools</div>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <button className={`pin-btn ${isPinned ? 'active' : ''}`} onClick={togglePin} title="Pin to corner">{isPinned ? '📍 Docked' : '📌 Float'}</button>
                        <button className={`pin-btn ${isAutoCollapseEnabled ? 'active' : ''}`} onClick={toggleAutoCollapse} title="Toggle Auto-Collapse">{isAutoCollapseEnabled ? '⏱️ Auto' : '🛑 Stay'}</button>
                        <button className="pin-btn" onClick={forceCollapse} style={{ background: '#ef4444', color: 'white', borderColor: '#dc2626' }} title="Collapse Now">❌</button>
                      </div>
                    </div>
                    <div style={{ borderTopLeftRadius: 0, borderTopRightRadius: 0, overflow: 'hidden' }}>
                      <MyCustomToolbar excalidrawAPI={excalidrawAPI} onToolSelect={handleToolSelect} theme={theme} />
                    </div>
                  </div>
                )}
              </div>
            </Draggable>
          )}
        </>
      )}
    </div>
  )
}
