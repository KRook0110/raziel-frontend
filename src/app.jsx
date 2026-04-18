import React, { useState, useEffect } from 'react';
import zxcvbn from 'zxcvbn';
import { generatePassphrase, confirmPassphrase } from './api';



export default function App() {
  const [warning, setWarning] = useState('');
  const [view, setView] = useState('home');
  const [bio, setBio] = useState(''); 
  const [maxLength, setMaxLength] = useState(32); 
  const [apiResult, setApiResult] = useState(null);
  
  const [activeVowels, setActiveVowels] = useState(['a', 'e']);
  const [dynamicAvailableVowels, setDynamicAvailableVowels] = useState([]);
  const [capitalise, setCapitalise] = useState(false);
  const [separator, setSeparator] = useState('-');
  const [displayPassword, setDisplayPassword] = useState('');
  
  const [isConfirmed, setIsConfirmed] = useState(false);
  const [copied, setCopied] = useState(false);

  const [liveEntropy, setLiveEntropy] = useState(0);
  const [liveStrength, setLiveStrength] = useState(0);
  const [crackTime, setCrackTime] = useState('');

  const vowelsList = ['a', 'e', 'i', 'o', 'u'];
  const separators = [
    { label: 'Hyphen ( - )', value: '-' },
    { label: 'Underscore ( _ )', value: '_' },
    { label: 'Full Stop ( . )', value: '.' },
    { label: 'Space (   )', value: ' ' }
  ];

  const handleGenerate = async () => {
    setView('loading');
    setIsConfirmed(false);
    try {
        const data = await generatePassphrase({
        user_bio: bio,
        vowels_to_remove: '', 
        separator: separator,
        capitalize: false,
        max_length: parseInt(maxLength) // Add this new parameter
      });
      setApiResult(data);
      if (data?.participant_id) localStorage.setItem('csh_participant_id', data.participant_id);
      setTimeout(() => setView('result'), 1200); 
    } catch (err) {
      setView('home');
      alert("Server connection failed. Please ensure the backend is running.");
    }
  };

  const handleConfirm = async () => {
    if (!apiResult?.participant_id) return; 

    // MANDATORY VOWPASS CHECK
    const rawObject = apiResult.raw_passphrase.split(/[-_. ]/)[2].toLowerCase();
    const currentObject = displayPassword.split(/[-_. ]/)[2].toLowerCase();
    
    if (rawObject === currentObject) {
      setWarning("⚠ VowPass Requirement: You must select and remove at least one vowel from the object word.");
      setTimeout(() => setWarning(''), 5000); // Clear warning after 5 seconds
      return;
    }

    try {
      await confirmPassphrase(apiResult.participant_id, displayPassword);
      setIsConfirmed(true);
      setWarning(''); // Clear any existing warnings on success
    } catch (err) {
      setWarning("⚠ Failed to save passphrase. Is the backend running?");
    }
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(displayPassword);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  useEffect(() => {
    if (apiResult?.raw_passphrase) {
      let words = apiResult.raw_passphrase.split(/[-_. ]/);
      
      if (!words || words.length < 3) return;

      const objectWord = words[2].toLowerCase();
      setDynamicAvailableVowels(vowelsList.filter(v => objectWord.includes(v)));

      let obj = words[2];
      activeVowels.forEach(v => {
        const regex = new RegExp(v, 'gi');
        obj = obj.replace(regex, '');
      });
      words[2] = obj;

      if (capitalise) words = words.map(w => w.charAt(0).toUpperCase() + w.slice(1));
      
      const newPassword = words.join(separator);
      setDisplayPassword(newPassword);

      const charsetSize = 26 + (capitalise ? 26 : 0) + 1;
      setLiveEntropy((newPassword.length * Math.log2(charsetSize)).toFixed(1));
      
      const strength = zxcvbn(newPassword);
      setLiveStrength(strength.score);
      setCrackTime(strength.crack_times_display.offline_slow_hashing_1e4_per_second);
    }
  }, [apiResult, activeVowels, capitalise, separator]);

  const toggleVowel = (v) => {
      setActiveVowels(prev => {
        if (prev.includes(v)) {
          // Prevent deselecting if it's the last active vowel
          if (prev.length <= 1) return prev; 
          return prev.filter(i => i !== v);
        }
        return [...prev, v];
      });
    };

  const renderHome = () => (  
    <div className="glass-panel hero-card view-enter">
      <div className="pulse-ring"></div>
      <h1 className="hero-title">CSH Engine</h1>
      <p className="hero-subtitle">Cognitive-Semantic Hybrid generation.<br/>High security, designed for human memory.</p>

      <div className="input-wrapper">
        <textarea 
          value={bio} 
          onChange={(e) => setBio(e.target.value)} 
          className="glass-input"
          placeholder="Enter a brief biography to filter out predictable personal words..."
          rows="3"
        />
      </div>

      {/* NEW SLIDER UI */}
      <div className="input-wrapper" style={{ textAlign: 'left' }}>
        <label className="section-label" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
          <span>Max Character Length</span>
          <span style={{ color: 'var(--accent-cyan)' }}>{maxLength} chars</span>
        </label>
          <input 
          type="range" 
          min="15" 
          max="64" 
          value={maxLength} 
          onChange={(e) => setMaxLength(e.target.value)}
          className="glass-slider"
          style={{
            background: `linear-gradient(to right, var(--accent-cyan) ${((maxLength - 15) / (64 - 15)) * 100}%, rgba(0,0,0,0.4) ${((maxLength - 15) / (64 - 15)) * 100}%)`
          }}
        />
        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
          Limits total length to accommodate restrictive website policies (NIST recommends up to 64).
        </p>
      </div>

      <button onClick={handleGenerate} className="btn-glow">Synthesise Passphrase</button>
    </div>
  );

  const renderResult = () => (
    <div className="dashboard-container">

      {/* 1. Main Display */}
      <div className={`password-hero cascade-1 ${isConfirmed ? 'confirmed-glow' : ''}`}>
        <div className="password-text">{displayPassword}</div>
        <button className={`copy-btn ${copied ? 'copied' : ''}`} onClick={handleCopy}>
          {copied ? '✓ COPIED' : 'COPY'}
        </button>
      </div>

      {/* 2. Controls Panel */}
      <div className={`controls-wrapper cascade-2 ${isConfirmed ? 'locked' : ''}`}>        <h3 className="panel-heading">Passphrase Customisation</h3>
        
        <div className="control-group">
          <label className="section-label">1. VowPass (Removes from Object)</label>
          <div className="chip-row vowels">
            {vowelsList.map(v => {
              const isAvailable = dynamicAvailableVowels.includes(v);
              const isActive = activeVowels.includes(v);
              return (
                <button 
                  key={v} 
                  onClick={() => toggleVowel(v)}
                  className={`vowel-chip ${isActive ? 'active' : ''} ${!isAvailable ? 'disabled' : ''}`}
                  disabled={!isAvailable}
                  title={!isAvailable ? "This vowel is not in the generated object word" : "Click to toggle vowel removal"}
                >
                  {v.toUpperCase()}
                </button>
              );
            })}
          </div>
        </div>

        <div className="control-group">
          <label className="section-label">2. Visual Separator</label>
          <div className="chip-row separators" >
            {separators.map(s => (
              <button 
                key={s.value} 
                onClick={() => setSeparator(s.value)}
                className={`sep-chip ${separator === s.value ? 'active' : ''}`}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>

        <div className="control-group">
          <label className="section-label">3. Text Formatting</label>
          <button 
            className={`format-toggle ${capitalise ? 'active' : ''}`}
            onClick={() => setCapitalise(!capitalise)}
          >
            {capitalise ? "✓ Capitalisation Enabled" : "Enable Capitalisation"}
          </button>
        </div>
      </div>

      {/* 3. Analytics Panel */}
      <div className="analytics-wrapper cascade-3">
        <h3 className="panel-heading">Real-Time Evaluation</h3>
        
        <div className="stats-grid">
          <div className="stat-card tooltip-parent">
            <div className="stat-header">
              <span className="stat-name">
                Mathematical Entropy 
                <span className="info-icon" tabIndex="0" data-tooltip="Total possible combinations. Higher is harder to brute-force.">ⓘ</span>
              </span>
            </div>
            <div className="stat-number">{liveEntropy} <span className="stat-unit">bits</span></div>
            <div className="progress-track">
              <div className="progress-fill entropy-fill" style={{width: `${Math.min((liveEntropy / 120) * 100, 100)}%`}}></div>
            </div>
          </div>

          <div className="stat-card tooltip-parent">
            <div className="stat-header">
              <span className="stat-name">
                NIST Strength Score 
                <span className="info-icon" tabIndex="0" data-tooltip="0-4 scale measuring resistance to modern dictionary and pattern attacks.">ⓘ</span>
              </span>
            </div>
            <div className="stat-number">{liveStrength} <span className="stat-unit">/ 4</span></div>
            <div className="progress-track">
              <div className="progress-fill strength-fill" style={{
                width: `${(liveStrength / 4) * 100}%`, 
                backgroundColor: liveStrength >= 3 ? '#10b981' : (liveStrength === 2 ? '#f59e0b' : '#ef4444')
              }}></div>
            </div>
          </div>

          <div className="stat-card tooltip-parent">
            <div className="stat-header">
              <span className="stat-name">
                Semantic Concreteness 
                <span className="info-icon" tabIndex="0" data-tooltip="Measures visualizability (1-5). High scores are easier for humans to remember.">ⓘ</span>
              </span>
            </div>
            <div className="stat-number">{apiResult?.concreteness_score} <span className="stat-unit">/ 5.0</span></div>
            <div className="progress-track">
              <div className="progress-fill concrete-fill" style={{width: `${(apiResult?.concreteness_score / 5) * 100}%`}}></div>
            </div>
          </div>
        </div>

        <div className="crack-time-banner">
          <span className="crack-label">Estimated Offline Crack Time:</span>
          <span className="crack-value">{crackTime}</span>
        </div>

        {/* --- UPGRADED: Reactive Cryptographic Footprint --- */}
        <div className="desktop-visualizer tooltip-parent">
          <div className="visualizer-header">
            <span className="visualizer-title">
              Cryptographic Footprint
              <span className="info-icon" style={{ marginLeft: '8px' }} tabIndex="0" data-tooltip="Structural map. Cyan = Upper, Indigo = Letter, Grey = Separator.">ⓘ</span>
            </span>
            <div className="visualizer-legend">
              <span className="legend-item"><span className="legend-dot upper"></span>Upper</span>
              <span className="legend-item"><span className="legend-dot consonant"></span>Cons</span>
              <span className="legend-item"><span className="legend-dot vowel"></span>Vowel</span>
              <span className="legend-item"><span className="legend-dot sep"></span>Sep</span>
            </div>
          </div>
          
          <div className="matrix-track">
            {displayPassword.split('').map((char, i) => {
              const isSeparator = /[-_. ]/.test(char);
              const isUpper = /[A-Z]/.test(char);
              const isVowel = /[aeiouAEIOU]/.test(char);

              let barClass = 'matrix-bar ';
              let heightPct = 50; 

              if (isSeparator) {
                barClass += 'sep';
                heightPct = 20;
              } else if (isUpper) {
                barClass += 'upper';
                heightPct = 100;
              } else if (isVowel) {
                barClass += 'vowel';
                heightPct = 40;
              } else {
                barClass += 'consonant';
                heightPct = 65;
              }

              return (
                <div key={i} className="matrix-col">
                  <div className="matrix-bar-wrapper">
                    <div 
                      className={barClass}
                      style={{ height: `${heightPct}%`, animationDelay: `${i * 0.05}s` }}
                    ></div>
                  </div>
                  {/* Displays the actual character beneath the bar, converting spaces to a visual symbol */}
                  <div className="matrix-char">{char === ' ' ? '␣' : char}</div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Warning Banner */}
        {apiResult?.breach_count > 0 && (
          <div className="breach-alert">
            ⚠ Found in {apiResult.breach_count} known data breaches. Re-roll advised.
          </div>
        )}
      </div>
      {warning && (
        <div className="breach-alert" style={{ marginBottom: '1.5rem', border: '1px solid #f59e0b', color: '#fcd34d', backgroundColor: 'rgba(245, 158, 11, 0.1)' }}>
          {warning}
        </div>
      )}
      {/* 4. Action Buttons */}
      {isConfirmed ? (
        <div className="success-banner cascade-3">
          <span className="success-icon">✓</span> Locked in for your 7-Day Recall Study
        </div>
      ) : (
        <div className="action-row cascade-3">
        <button 
          onClick={() => { 
            setView('home'); 
            setActiveVowels(['a', 'e']); 
            setSeparator('-'); 
            setCapitalise(false); 
          }} 
          className="btn-secondary"
        >
          Start Over (Re-roll)
        </button>
          <button onClick={handleConfirm} className="btn-confirm">Confirm & Save</button>
        </div>
      )}

    </div>
  );

  return (
    <div className="app-canvas" key={view}>
      {view === 'home' && renderHome()}
      {view === 'loading' && (
        <div className="loading-container view-enter">
          <div className="loader-ring"></div>
          <h2 className="loading-text">Synthesising Narrative</h2>
          <p className="loading-subtext">Aligning EFF Concreteness criteria...</p>
        </div>
      )}
      {view === 'result' && renderResult()}
    </div>
  );
}

// --- CSS STYLES ---
if (typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.textContent = `
    @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;800&family=JetBrains+Mono:wght@700&display=swap');

    :root {
      --bg-dark: #05050a;
      --glass-bg: rgba(20, 22, 35, 0.6);
      --glass-border: rgba(255, 255, 255, 0.08);
      --accent-cyan: #06b6d4;
      --accent-indigo: #6366f1;
      --success: #10b981;
      --text-main: #f8fafc;
      --text-muted: #94a3b8;
    }

    * { box-sizing: border-box; margin: 0; padding: 0; }
    
    body { 
      background-color: var(--bg-dark); 
      background-image: 
        radial-gradient(at 0% 0%, rgba(99, 102, 241, 0.1) 0px, transparent 50%),
        radial-gradient(at 100% 100%, rgba(6, 182, 212, 0.05) 0px, transparent 50%);
      color: var(--text-main); 
      font-family: 'Plus Jakarta Sans', sans-serif; 
      min-height: 100vh;
      background-attachment: fixed;
    }

    /* --- ANIMATIONS --- */
    @keyframes spin { to { transform: rotate(360deg); } }
    
    @keyframes popIn {
      0% { opacity: 0; transform: scale(0.92) translateY(20px); }
      100% { opacity: 1; transform: scale(1) translateY(0); }
    }

    @keyframes slideUpFade {
      0% { opacity: 0; transform: translateY(30px); }
      100% { opacity: 1; transform: translateY(0); }
    }

    @keyframes textPulse {
      0% { text-shadow: 0 0 0px rgba(6, 182, 212, 0); }
      50% { text-shadow: 0 0 15px rgba(6, 182, 212, 0.4); }
      100% { text-shadow: 0 0 0px rgba(6, 182, 212, 0); }
    }

    .view-enter { animation: popIn 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
    .cascade-1 { opacity: 0; animation: popIn 0.7s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
    .cascade-2 { opacity: 0; animation: slideUpFade 0.7s cubic-bezier(0.16, 1, 0.3, 1) 0.15s forwards; }
    .cascade-3 { opacity: 0; animation: slideUpFade 0.7s cubic-bezier(0.16, 1, 0.3, 1) 0.3s forwards; }
    
    /* --- BASE LAYOUT --- */
    .app-canvas { 
      min-height: 100vh; 
      display: flex; 
      align-items: center; 
      justify-content: center; 
      padding: 2rem; 
    }
    
    h1, h2, h3 { font-weight: 800; letter-spacing: -0.02em; }
    
    .glass-panel {
      background: var(--glass-bg);
      backdrop-filter: blur(16px);
      -webkit-backdrop-filter: blur(16px);
      border: 1px solid var(--glass-border);
      border-radius: 24px;
      box-shadow: 0 30px 60px rgba(0,0,0,0.4);
    }

    .hero-card { padding: 3rem; width: 100%; max-width: 550px; text-align: center; }
    .hero-title { 
      font-size: clamp(2.2rem, 8vw, 3.5rem); 
      background: linear-gradient(135deg, #fff, var(--text-muted)); 
      -webkit-background-clip: text; 
      -webkit-text-fill-color: transparent; 
      margin-bottom: 1rem; 
      line-height: 1.3; 
      padding-top: 0.1em; 
      padding-bottom: 0.1em; 
    }    
    .hero-subtitle { color: var(--text-muted); font-size: 1.1rem; line-height: 1.6; margin-bottom: 2.5rem; }
    
    .glass-input { 
      width: 100%; padding: 1.2rem; background: rgba(0,0,0,0.2); border: 1px solid var(--glass-border); 
      border-radius: 16px; color: #fff; font-family: inherit; font-size: 1rem; resize: none; transition: 0.3s; 
    }
    .glass-input:focus { outline: none; border-color: var(--accent-indigo); background: rgba(99, 102, 241, 0.05); }
    .input-wrapper { margin-bottom: 2rem; }

    .btn-glow { 
      width: 100%; padding: 1.2rem; background: linear-gradient(135deg, var(--accent-indigo), #4f46e5); 
      color: white; border: none; border-radius: 16px; font-size: 1.1rem; font-weight: 800; 
      cursor: pointer; transition: 0.3s;
    }
    .btn-glow:hover { transform: translateY(-2px); box-shadow: 0 10px 25px rgba(99, 102, 241, 0.4); }
    
    .dashboard-container { 
      display: flex; 
      flex-direction: column; 
      gap: 1.5rem; 
      width: 100%; 
      max-width: 800px;
      margin: 0 auto; 
    }

    .password-hero {
      background: rgba(0,0,0,0.4);
      border: 1px solid var(--glass-border);
      border-radius: 24px;
      padding: 2.5rem 2rem;
      text-align: center;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 1.5rem; 
      transition: all 0.4s ease;
      width: 100%;
      overflow: hidden; 
    }
    .password-hero.confirmed-glow { 
      border-color: var(--success); 
      box-shadow: 0 0 30px rgba(16, 185, 129, 0.1); 
    }
    
    .password-text { 
      font-family: 'JetBrains Mono', monospace; 
      font-size: clamp(1.2rem, 3.5vw, 2.4rem); 
      color: var(--accent-cyan);
      letter-spacing: 0.05em;
      white-space: nowrap; 
      overflow-x: auto; 
      max-width: 100%;
      padding: 0.5em 1rem; 
      line-height: normal; 
      -ms-overflow-style: none;  
      scrollbar-width: none;  
      animation: textPulse 2s ease-in-out infinite;
    }
    .password-text::-webkit-scrollbar { display: none; }

    .copy-btn { 
      background: rgba(255,255,255,0.05); 
      border: 1px solid var(--glass-border);
      color: var(--text-muted); 
      padding: 0.8rem 1.5rem; 
      border-radius: 8px;
      font-size: 0.85rem; 
      font-weight: 800; 
      cursor: pointer; 
      transition: 0.2s;
    }
    .copy-btn:hover { background: rgba(255,255,255,0.1); color: #fff; }
    .copy-btn.copied { background: rgba(16, 185, 129, 0.2); color: var(--success); border-color: var(--success); }

    .controls-wrapper, .analytics-wrapper { 
      background: var(--glass-bg); 
      padding: 2rem; 
      border-radius: 24px; 
      border: 1px solid var(--glass-border); 
      transition: opacity 0.3s; 
    }
    .controls-wrapper.locked { opacity: 0.5; pointer-events: none; }
    
    .panel-heading { font-size: 1.2rem; color: #fff; border-bottom: 1px solid var(--glass-border); padding-bottom: 1rem; margin-bottom: 1.5rem; }
    
    .section-label { 
      display: block; 
      font-size: 0.75rem; 
      font-weight: 800; 
      color: var(--text-muted); 
      text-transform: uppercase; 
      letter-spacing: 0.05em; 
      margin-bottom: 0.75rem; 
    }    .control-group { margin-bottom: 1.5rem; }
    
    .chip-row.vowels { display: grid; grid-template-columns: repeat(5, 1fr); gap: 0.5rem; }
    .chip-row.separators { display: grid; grid-template-columns: repeat(2, 1fr); gap: 0.5rem; }
    
    .vowel-chip, .sep-chip { 
      padding: 1rem 0.25rem; /* Tighter padding so they all fit cleanly */
      background: rgba(0,0,0,0.3); 
      border: 1px solid var(--glass-border); 
      border-radius: 12px; 
      color: #fff; 
      font-size: 0.95rem; 
      font-weight: 800; 
      cursor: pointer; 
      transition: all 0.2s; 
      display: flex;             
      align-items: center;       
      justify-content: center;   
      text-align: center;        
      line-height: 1.2;          
    }
    
    .sep-chip { 
      min-width: 120px; 
      white-space: nowrap; 
    }

    .vowel-chip:hover:not(.disabled), .sep-chip:hover { background: rgba(255,255,255,0.05); transform: translateY(-2px); }

    .vowel-chip.active { 
      background: linear-gradient(135deg, var(--accent-indigo), #4f46e5);
      border-color: #a5b4fc; 
      color: #ffffff;
      box-shadow: 0 4px 15px rgba(99, 102, 241, 0.4);
    }
    .sep-chip.active { background: var(--accent-cyan); border-color: #67e8f9; color: #000; }
    .vowel-chip.disabled { opacity: 0.15; cursor: not-allowed; text-decoration: line-through; border-color: transparent; }

    .format-toggle { 
      width: 100%; padding: 1rem; background: rgba(0,0,0,0.3); border: 1px solid var(--glass-border); 
      border-radius: 12px; color: #fff; font-size: 1rem; font-weight: 800; 
      cursor: pointer; transition: all 0.2s; 
    }
    .format-toggle.active { background: var(--success); border-color: #34d399; }

    .action-row { display: flex; gap: 1rem; margin-top: 1rem; }
    .btn-secondary { flex: 1; padding: 1.2rem; background: rgba(0,0,0,0.3); border: 1px solid var(--glass-border); border-radius: 16px; color: var(--text-main); font-weight: 800; cursor: pointer; transition: 0.2s; }
    .btn-secondary:hover { background: rgba(255,255,255,0.05); }
    .btn-confirm { flex: 2; padding: 1.2rem; background: var(--success); border: none; border-radius: 16px; color: #fff; font-weight: 800; font-size: 1.1rem; cursor: pointer; transition: 0.2s; }
    .btn-confirm:hover { transform: translateY(-2px); box-shadow: 0 10px 25px rgba(16, 185, 129, 0.3); }
    
    .success-banner { padding: 1.5rem; margin-top: 1rem; background: rgba(16, 185, 129, 0.1); border: 1px solid var(--success); border-radius: 16px; color: var(--success); font-weight: 800; text-align: center; }

    .stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1.5rem; margin-bottom: 1.5rem; }
    
    .stat-card { background: rgba(0,0,0,0.2); padding: 1.5rem; border-radius: 16px; border: 1px solid var(--glass-border); }
    .stat-header { margin-bottom: 0.5rem; }
    .stat-name { font-size: 0.85rem; font-weight: 800; color: var(--text-muted); display: flex; align-items: center; gap: 6px; }
    
    .stat-number { 
      font-size: 1.8rem; 
      font-weight: 800; 
      font-family: 'JetBrains Mono', monospace; 
      margin-bottom: 1.2rem; 
      display: flex;
      align-items: baseline;
      gap: 6px;
    }

    .stat-unit { font-size: 0.9rem; color: var(--text-muted); font-weight: 600; }
    
    .progress-track { width: 100%; height: 6px; background: rgba(0,0,0,0.4); border-radius: 3px; overflow: hidden; }
    .progress-fill { height: 100%; border-radius: 3px; transition: width 0.5s cubic-bezier(0.4, 0, 0.2, 1), background-color 0.5s ease; }
    .entropy-fill { background: linear-gradient(90deg, var(--accent-indigo), var(--accent-cyan)); }
    .concrete-fill { background: #8b5cf6; }
    
    .crack-time-banner { background: rgba(6, 182, 212, 0.1); padding: 1.2rem; border-radius: 12px; border: 1px solid rgba(6, 182, 212, 0.3); display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 10px; }
    .crack-label { font-size: 0.9rem; font-weight: 600; color: var(--text-muted); }
    .crack-value { font-size: 1.2rem; font-weight: 800; color: var(--accent-cyan); font-family: 'JetBrains Mono', monospace; }

    .breach-alert { padding: 1rem; background: rgba(239, 68, 68, 0.1); border: 1px solid #ef4444; border-radius: 12px; color: #fca5a5; font-size: 0.9rem; font-weight: 600; margin-top: 1.5rem; text-align: center; }

    .loading-container { text-align: center; }
    .loader-ring { width: 80px; height: 80px; margin: 0 auto 2rem; border: 4px solid rgba(255,255,255,0.05); border-top-color: var(--accent-cyan); border-radius: 50%; animation: spin 1s cubic-bezier(0.6, 0.2, 0.4, 0.8) infinite; }
    .loading-text { font-size: 1.5rem; margin-bottom: 0.5rem; color: #fff; }
    .loading-subtext { color: var(--text-muted); }

    .glass-slider {
      -webkit-appearance: none;
      width: 100%;
      height: 8px;
      background: rgba(0,0,0,0.4);
      border-radius: 4px;
      outline: none;
      border: 1px solid var(--glass-border);
    }
    .glass-slider::-webkit-slider-thumb {
      -webkit-appearance: none;
      appearance: none;
      width: 20px;
      height: 20px;
      border-radius: 50%;
      background: var(--accent-cyan);
      cursor: pointer;
      box-shadow: 0 0 10px rgba(6, 182, 212, 0.5);
      transition: 0.2s;
    }
    .glass-slider::-webkit-slider-thumb:hover { transform: scale(1.2); }

    /* Tooltips */
    .info-icon { display: inline-flex; align-items: center; justify-content: center; width: 16px; height: 16px; border-radius: 50%; border: 1px solid var(--text-muted); font-size: 10px; cursor: help; color: var(--text-muted); transition: 0.2s; position: relative; outline: none; }
    .info-icon:hover { color: #fff; border-color: #fff; }
    .info-icon::after {
      content: attr(data-tooltip);
      position: absolute; bottom: 130%; left: 50%; transform: translateX(-50%) translateY(10px);
      background: var(--bg-dark); color: #fff; padding: 0.75rem; border-radius: 8px;
      font-size: 0.75rem; width: 220px; text-align: left; line-height: 1.4;
      border: 1px solid var(--glass-border); box-shadow: 0 10px 25px rgba(0,0,0,0.5);
      opacity: 0; visibility: hidden; pointer-events: none; transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
      z-index: 100; font-family: 'Plus Jakarta Sans', sans-serif;
    }
    .info-icon:hover::after, .info-icon:focus::after, .info-icon:active::after {
      opacity: 1; visibility: visible; transform: translateX(-50%) translateY(0);
    }

    .desktop-visualizer {
      display: none;
    }
    
    @keyframes matrixPulse {
      0% { height: 10%; opacity: 0.3; }
      100% { height: 95%; opacity: 0.8; }
    }

    /* --- RESPONSIVE LAYOUTS --- */
    
    /* Desktop Widescreen Layout (Grid) */
    @media (min-width: 1024px) {
      .app-canvas { padding: 1rem; align-items: center; } 
      
      .dashboard-container {
        display: grid;
        grid-template-columns: 380px 1fr;
        grid-template-rows: auto auto auto auto; 
        grid-template-areas:
          "hero     hero"
          "controls analytics"
          "controls warning"
          "controls actions";
        gap: 1.5rem;
        align-items: start;
        max-width: 1150px;
        margin: 0 auto;
      }
      
      .password-hero { 
        grid-area: hero; 
        flex-direction: row; 
        justify-content: center;
        align-items: center;
        padding: 2rem 3rem;
        gap: 2rem;
      }
      
      .password-text { 
        font-size: clamp(1.8rem, 3.5vw, 2.8rem); 
        padding: 0 10px 0 0; 
        flex-shrink: 1;
      }

      .copy-btn { 
        position: relative; 
        margin: 0; 
        flex-shrink: 0; 
      }
      
      .controls-wrapper { grid-area: controls; padding: 1.5rem; }
      .analytics-wrapper { 
        grid-area: analytics; 
        padding: 1.5rem; 
        display: flex; 
        flex-direction: column; 
        height: 100%; 
      }
      
      @keyframes footprintBreathe {
        0% { transform: scaleY(0.95); opacity: 0.8; }
        100% { transform: scaleY(1.05); opacity: 1; }
      }

      .desktop-visualizer {
        display: flex;
        flex-direction: column;
        background: rgba(0,0,0,0.2);
        border: 1px solid var(--glass-border);
        border-radius: 12px;
        margin-top: 1.5rem;
        padding: 1rem 1.5rem;
        flex-grow: 1; 
        min-height: 140px; 
        /* REMOVED overflow: hidden; to allow tooltips to escape! */
      }
      
      .visualizer-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 1rem;
        z-index: 2;
      }

      .visualizer-title {
        font-size: 0.7rem; color: var(--text-muted); text-transform: uppercase; letter-spacing: 1px;
        display: flex; align-items: center;
      }

      .visualizer-legend {
        display: flex; gap: 0.75rem; font-size: 0.65rem; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.5px;
      }
      .legend-item { display: flex; align-items: center; gap: 4px; }
      .legend-dot { width: 8px; height: 8px; border-radius: 50%; }
      .legend-dot.upper { background: var(--accent-cyan); box-shadow: 0 0 5px rgba(6,182,212,0.5); }
      .legend-dot.consonant { background: #818cf8; }
      .legend-dot.vowel { background: #4f46e5; opacity: 0.6; }
      .legend-dot.sep { background: rgba(255,255,255,0.2); }

      .matrix-track {
        flex-grow: 1;
        display: flex; align-items: flex-end; gap: 4px; 
        height: 100%;
      }
      
      .matrix-col {
        flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: flex-end; gap: 6px; height: 100%;
      }

      .matrix-bar-wrapper {
        width: 100%; flex-grow: 1; display: flex; align-items: flex-end; justify-content: center;
      }

      .matrix-bar {
        width: 100%;
        border-radius: 3px 3px 0 0;
        transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1); 
        transform-origin: bottom;
        animation: footprintBreathe 1.5s infinite alternate ease-in-out;
      }
      
      .matrix-char {
        font-family: 'JetBrains Mono', monospace; font-size: 0.85rem; color: #fff; font-weight: 800;
      }

      .matrix-bar.sep { background: rgba(255,255,255,0.15); animation: none; }
      .matrix-bar.upper { background: var(--accent-cyan); box-shadow: 0 0 10px rgba(6,182,212,0.5); }
      .matrix-bar.consonant { background: #818cf8; }
      .matrix-bar.vowel { background: #4f46e5; opacity: 0.6; }
      .breach-alert { grid-area: warning; margin: 0; }
      .action-row { grid-area: actions; margin-top: 0; }
      .success-banner { grid-area: actions; margin-top: 0; }
      .stats-grid { grid-template-columns: repeat(3, 1fr); gap: 1rem; margin-bottom: 1rem; }
      .control-group { margin-bottom: 1.25rem; }
      .panel-heading { margin-bottom: 1rem; padding-bottom: 0.5rem; }
    }

    /* Mobile Adjustments */
    @media (max-width: 600px) {
      .app-canvas { padding: 1rem; }
      .hero-card { padding: 2rem 1.5rem; }
      .password-hero { padding: 2rem 1rem; }
      .password-text { font-size: clamp(1.2rem, 6vw, 2rem); }
      .copy-btn { position: relative; top: 0; right: 0; margin-top: 1rem; width: 100%; }
      .controls-wrapper, .analytics-wrapper { padding: 1.5rem 1rem; }
      .chip-row { flex-direction: column; gap: 0.5rem; }
      .action-row { flex-direction: column; }
      .btn-confirm, .btn-secondary { width: 100%; }
    }
  `;
  document.head.appendChild(style);
}