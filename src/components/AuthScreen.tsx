import React, { useState, useEffect } from 'react';

interface AuthScreenProps {
  onAuthSuccess: (data: any) => void;
}

export default function AuthScreen({ onAuthSuccess }: AuthScreenProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [role, setRole] = useState<'student' | 'teacher'>('student');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const [availableColleges, setAvailableColleges] = useState<{id: number, name: string}[]>([]);
  const [availableBranches, setAvailableBranches] = useState<{id: number, name: string}[]>([]);
  const [availableYears, setAvailableYears] = useState<{id: number, name: string}[]>([]);
  const [availableDivs, setAvailableDivs] = useState<{id: number, name: string}[]>([]);

  useEffect(() => {
    const fetchDatabaseInfo = async () => {
      try {
        const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/data/`);
        if (response.ok) {
          const data = await response.json();
          setAvailableColleges(data.colleges || []);
          setAvailableBranches(data.branches || []);
          setAvailableYears(data.years || []); 
          setAvailableDivs(data.divs || []);   
        }
      } catch (error) {
        console.error("Failed to fetch data from server:", error);
      }
    };
    fetchDatabaseInfo();
  }, []);

  const [formData, setFormData] = useState({
    email: '', password: '', fullName: '', rollNo: '', uniqueId: '', 
    collegeId: '', branchId: '', yearId: '', divId: ''
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleRoleSelect = (selectedRole: string) => {
    if (selectedRole === 'college') {
      alert("College registration will be available soon!");
      return;
    }
    setRole(selectedRole as 'student' | 'teacher');
  };

  const handleSubmit = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg('');
    
    const endpoint = isLogin ? '/api/login/' : '/api/register/';
    const payload = isLogin 
      ? { email: formData.email, password: formData.password }
      : { ...formData, role }; 

    try {
      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await response.json();
      if (response.ok) {
        onAuthSuccess(data);
      } else {
        setErrorMsg(data.error || 'Authentication failed. Please check your credentials.');
      }
    } catch (error) {
      setErrorMsg('Network error. Cannot connect to the server.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', height: '100vh', overflowY: 'auto', width: '100vw', justifyContent: 'center', alignItems: 'flex-start', backgroundColor: '#1e1e24', fontFamily: 'sans-serif', padding: 'clamp(10px, 2vw, 20px)', boxSizing: 'border-box' }}>
      <div style={{ margin: 'auto', background: '#232329', padding: 'clamp(20px, 5vw, 40px)', borderRadius: '16px', boxShadow: '0 10px 40px rgba(0,0,0,0.5)', width: '100%', maxWidth: '450px', color: 'white', border: '1px solid #444', boxSizing: 'border-box' }}>
        
        <h2 style={{ textAlign: 'center', marginBottom: 'clamp(15px, 4vw, 25px)', fontSize: 'clamp(22px, 5vw, 28px)', fontWeight: 'bold', marginTop: 0 }}>
          {isLogin ? 'Welcome Back' : 'Create Account'}
        </h2>

        {errorMsg && (
          <div style={{ background: '#ef444420', color: '#ef4444', padding: '10px', borderRadius: '8px', marginBottom: '15px', border: '1px solid #ef444450', fontSize: 'clamp(12px, 2vw, 14px)', textAlign: 'center' }}>
            {errorMsg}
          </div>
        )}

        {!isLogin && (
          <div style={{ display: 'flex', gap: '8px', marginBottom: 'clamp(15px, 3vw, 20px)', flexWrap: 'wrap' }}>
            {['student', 'teacher', 'college'].map((r) => (
              <button 
                key={r} type="button" onClick={() => handleRoleSelect(r)}
                style={{
                  flex: '1 1 auto', padding: 'clamp(8px, 2vw, 10px)', borderRadius: '8px', border: '1px solid #555', cursor: 'pointer', textTransform: 'capitalize', fontWeight: 'bold', transition: 'all 0.2s',
                  backgroundColor: role === r ? '#3b82f6' : '#1e1e1e',
                  color: role === r ? 'white' : '#ccc',
                  borderColor: role === r ? '#60a5fa' : '#555',
                  fontSize: 'clamp(12px, 2vw, 14px)'
                }}
              >
                {r}
              </button>
            ))}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'clamp(10px, 2vw, 15px)' }}>
          
          <input type="email" name="email" placeholder="Email Address" required onChange={handleChange} style={inputStyle} />
          <input type="password" name="password" placeholder="Password" required onChange={handleChange} style={inputStyle} />

          {!isLogin && role === 'student' && (
            <>
              <input type="text" name="fullName" placeholder="Full Name" required onChange={handleChange} style={inputStyle} />
              <div style={{ display: 'flex', gap: '10px' }}>
                <input type="text" name="uniqueId" placeholder="Unique ID" required onChange={handleChange} style={{...inputStyle, flex: 2}} />
                <input type="text" name="rollNo" placeholder="Roll No." required onChange={handleChange} style={{...inputStyle, flex: 1}} />
              </div>
              <select name="collegeId" required onChange={handleChange} style={inputStyle}>
                <option value="">Select College...</option>
                {availableColleges.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
              <select name="branchId" required onChange={handleChange} style={inputStyle}>
                <option value="">Select Branch...</option>
                {availableBranches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
              
              <div style={{ display: 'flex', gap: '10px' }}>
                <select name="yearId" required onChange={handleChange} style={{...inputStyle, flex: 1}}>
                  <option value="">Select Year...</option>
                  {availableYears.map(y => <option key={y.id} value={y.id}>{y.name}</option>)}
                </select>
                <select name="divId" required onChange={handleChange} style={{...inputStyle, flex: 1}}>
                  <option value="">Select Div...</option>
                  {availableDivs.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                </select>
              </div>
            </>
          )}

          {!isLogin && role === 'teacher' && (
            <>
              <input type="text" name="fullName" placeholder="Full Name" required onChange={handleChange} style={inputStyle} />
              <select name="collegeId" required onChange={handleChange} style={inputStyle}>
                <option value="">Select College...</option>
                {availableColleges.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </>
          )}

          <button type="submit" disabled={isLoading} style={{ padding: 'clamp(12px, 2.5vw, 16px)', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '8px', cursor: isLoading ? 'not-allowed' : 'pointer', fontWeight: 'bold', fontSize: 'clamp(14px, 2.5vw, 16px)', marginTop: '5px', transition: 'background 0.2s' }}>
            {isLoading ? 'Processing...' : (isLogin ? 'Login to Board' : 'Register')}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: 'clamp(15px, 4vw, 25px)', fontSize: 'clamp(12px, 2vw, 14px)', color: '#888', marginBottom: 0 }}>
          {isLogin ? "Don't have an account? " : "Already have an account? "}
          <span style={{ color: '#60a5fa', cursor: 'pointer', fontWeight: 'bold' }} onClick={() => { setIsLogin(!isLogin); setErrorMsg(''); }}>
            {isLogin ? 'Sign up' : 'Log in'}
          </span>
        </p>

      </div>
    </div>
  );
}

const inputStyle = { 
  padding: 'clamp(10px, 2.5vw, 14px)', 
  borderRadius: '8px', 
  border: '1px solid #555', 
  backgroundColor: '#1e1e1e', 
  color: 'white', 
  width: '100%', 
  boxSizing: 'border-box' as const, 
  outline: 'none', 
  fontFamily: 'sans-serif',
  fontSize: 'clamp(14px, 2vw, 16px)'
};
