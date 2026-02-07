import React, { useState, useRef, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Center, Text, RoundedBox, Environment, ContactShadows, Html } from '@react-three/drei';
import * as THREE from 'three';

// ==========================================
// 1. STYLES
// ==========================================
const styles = `
  .maj-container { width: 100%; height: 100vh; display: flex; background: #fff; font-family: 'Inter', sans-serif; overflow: hidden; }
  
  /* LEFT: 3D PANEL */
  .viz-panel { flex: 1.8; position: relative; background: radial-gradient(circle at center, #f0fdf4 0%, #ffffff 80%); border-right: 1px solid #e5e7eb; }

  /* RIGHT: CONTROLS */
  .ctrl-panel { flex: 0.8; background: #fff; padding: 2rem; display: flex; flex-direction: column; box-shadow: -5px 0 20px rgba(0,0,0,0.03); z-index: 10; overflow-y: auto; }
  
  .header-row { display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem; }
  .back-btn { background: none; border: none; color: #6b7280; font-weight: 600; cursor: pointer; }
  .back-btn:hover { color: #15803d; }
  h2 { font-size: 2rem; font-weight: 800; color: #111827; margin: 0; }

  /* EXPLANATION BOX */
  .explain-box {
    background: #eff6ff; border-left: 4px solid #3b82f6;
    padding: 1rem; margin-bottom: 1rem; borderRadius: 4px;
    box-shadow: 0 2px 4px rgba(0,0,0,0.05); transition: background 0.3s;
  }
  .explain-box.paused { background: #fff7ed; border-left-color: #f97316; }
  .explain-title { margin: 0 0 0.5rem 0; font-size: 1rem; color: #1e40af; font-weight: 700; display: flex; justify-content: space-between; }
  .explain-text { margin: 0; color: #374151; font-size: 0.95rem; line-height: 1.5; white-space: pre-line; }
  .pause-badge { background: #f97316; color: white; padding: 2px 8px; border-radius: 4px; font-size: 0.7rem; text-transform: uppercase; }

  /* CONSOLE */
  .console { background: #111827; border-radius: 12px; padding: 1.5rem; color: #4ade80; font-family: 'JetBrains Mono', monospace; font-size: 0.85rem; margin-bottom: 1.5rem; min-height: 60px; }
  .cursor { animation: blink 1s infinite; }
  @keyframes blink { 50% { opacity: 0; } }

  .btn { width: 100%; padding: 0.8rem; border-radius: 8px; border: none; background: #15803d; color: white; font-weight: 600; cursor: pointer; transition: 0.2s; }
  .btn:hover:not(:disabled) { background: #166534; transform: translateY(-1px); }
  .btn:disabled { background: #9ca3af; cursor: not-allowed; }
  .btn-pause { background: #f59e0b; } .btn-pause:hover:not(:disabled) { background: #d97706; }
  .btn-reset { background: #6b7280; }

  /* LABELS */
  .candidate-label {
    position: absolute; top: 10%; left: 50%; transform: translateX(-50%);
    font-weight: 800; color: #f59e0b; font-size: 1.5rem; 
    text-shadow: 0 2px 10px rgba(245, 158, 11, 0.2); pointer-events: none;
  }
`;

// ==========================================
// 2. 3D COMPONENTS
// ==========================================

// --- CANDIDATE BOX (The King on Top) ---
function CandidateBox({ val, freq, visible }) {
  const group = useRef();
  const cube = useRef();
  
  useFrame((state, delta) => {
    if (!visible || !group.current) return;
    
    // Rotate the CUBE only (so numbers spin)
    if(cube.current) {
        cube.current.rotation.y += delta * 0.5;
    }
    
    // Float the whole group
    group.current.position.y = 2 + Math.sin(state.clock.elapsedTime) * 0.1;
  });

  if (!visible) return null;

  return (
    <group ref={group} position={[0, 2, 0]}>
      
      {/* Spinning Cube Section */}
      <group ref={cube}>
        <RoundedBox args={[1.5, 1.5, 1.5]} radius={0.1} smoothness={4}>
          <meshStandardMaterial color="#f59e0b" />
        </RoundedBox>
        
        {/* TEXT ON ALL 4 SIDES */}
        {/* Front */}
        <Text position={[0, 0, 0.76]} fontSize={0.8} color="#fff" fontWeight={800}>{val}</Text>
        {/* Back */}
        <Text position={[0, 0, -0.76]} rotation={[0, Math.PI, 0]} fontSize={0.8} color="#fff" fontWeight={800}>{val}</Text>
        {/* Right */}
        <Text position={[0.76, 0, 0]} rotation={[0, Math.PI/2, 0]} fontSize={0.8} color="#fff" fontWeight={800}>{val}</Text>
        {/* Left */}
        <Text position={[-0.76, 0, 0]} rotation={[0, -Math.PI/2, 0]} fontSize={0.8} color="#fff" fontWeight={800}>{val}</Text>
      </group>

      {/* Vote Count Tag (Static relative to floating group, doesn't spin) */}
      <Html position={[2, 0, 0]} center>
        <div style={{
          background: 'rgba(255,255,255,0.9)', 
          padding: '8px 12px', 
          borderRadius: '8px', 
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)', 
          textAlign: 'center',
          border: '2px solid #f59e0b',
          minWidth: '60px'
        }}>
           <div style={{fontSize: '0.7rem', color:'#6b7280', fontWeight: '700', textTransform:'uppercase'}}>Votes</div>
           <div style={{fontSize: '1.5rem', color:'#15803d', fontWeight: '800'}}>{freq}</div>
        </div>
      </Html>
    </group>
  );
}

// --- ARRAY NODE (The Voters below) ---
function ArrayNode({ val, idx, state, total }) {
  const mesh = useRef();
  const gap = 1.6;
  const startX = -((total * gap) / 2) + (gap / 2);
  const targetX = startX + (idx * gap);
  
  const isCurrent = state.currentIdx === idx;
  const isCandidate = state.candidate === val;
  
  // Color Logic
  let color = "#e5e7eb"; 
  let yPos = 0;
  
  if (isCurrent) {
    color = "#3b82f6"; // Blue scan
    yPos = 0.5;
    
    // Status colors during interaction
    if (state.action === 'match') color = "#4ade80"; // Green
    if (state.action === 'clash') color = "#ef4444"; // Red
    if (state.action === 'new') color = "#f59e0b";   // Gold
  } else if (state.status === 'finished' && isCandidate) {
    color = "#f59e0b"; 
  }

  useFrame((_, delta) => {
    if (!mesh.current) return;
    mesh.current.position.x = THREE.MathUtils.lerp(mesh.current.position.x, targetX, delta * 6);
    mesh.current.position.y = THREE.MathUtils.lerp(mesh.current.position.y, yPos, delta * 6);
  });

  return (
    <group ref={mesh} position={[targetX, 0, 0]}>
      <RoundedBox args={[1, 1, 0.2]} radius={0.1} smoothness={4}>
        <meshStandardMaterial color={color} />
      </RoundedBox>
      <RoundedBox args={[1.05, 1.05, 0.18]} radius={0.1}>
        <meshBasicMaterial color="#1f2937" side={THREE.BackSide} />
      </RoundedBox>
      
      <Text position={[0, 0, 0.12]} fontSize={0.5} color="#1f2937" fontWeight={800}>{val}</Text>
      <Text position={[0, -0.8, 0]} fontSize={0.25} color="#9ca3af">{idx}</Text>
      
      {isCurrent && (
        <Html position={[0, 1.2, 0]} center>
          <div style={{
            color: '#3b82f6', 
            fontWeight: 'bold', 
            fontSize: '1.5rem', 
            animation: 'bounce 1s infinite'
          }}>↓</div>
        </Html>
      )}
    </group>
  );
}

// ==========================================
// 3. MAIN LOGIC
// ==========================================
export default function MajorityElement({ onBack }) {
  const [array, setArray] = useState([2, 2, 1, 1, 1, 2, 2]);
  const [state, setState] = useState({
    status: 'idle', 
    currentIdx: -1,
    candidate: null,
    freq: 0,
    action: null 
  });
  
  const [log, setLog] = useState("Ready.");
  const [description, setDescription] = useState("Press 'Find Majority' to start Moore's Voting Algorithm.");
  
  const [isPaused, setIsPaused] = useState(false);
  const pausedRef = useRef(false);

  const sleep = (ms) => new Promise(r => setTimeout(r, ms));

  const checkPause = async () => {
    while (pausedRef.current) await sleep(100);
  };

  const togglePause = () => {
    pausedRef.current = !pausedRef.current;
    setIsPaused(pausedRef.current);
    if (pausedRef.current) setLog("PAUSED. Press Resume.");
    else setLog("Resuming...");
  };

  const runMajority = async () => {
    if (state.status !== 'idle' && state.status !== 'finished') return;
    
    let freq = 0;
    let ans = null;

    setLog("Starting...");
    setDescription("Initializing: Count = 0, Candidate = None.");
    setState({ status: 'running', currentIdx: -1, candidate: null, freq: 0, action: null });
    await sleep(1000);
    await checkPause();

    for (let i = 0; i < array.length; i++) {
      setState(prev => ({ ...prev, currentIdx: i, action: 'scan' }));
      await sleep(500);
      await checkPause();

      // LOGIC: New Candidate
      if (freq === 0) {
        ans = array[i];
        freq = 1; // Start count at 1
        setLog(`Count is 0. New Candidate: ${ans}`);
        setDescription(`The count dropped to zero.\nWe pick the current number (${ans}) as the new King/Candidate.`);
        setState(prev => ({ ...prev, currentIdx: i, candidate: ans, freq: 1, action: 'new' }));
        await sleep(1500);
        await checkPause();
      }
      // LOGIC: Match
      else if (ans === array[i]) {
        freq++;
        setLog(`Match! (${array[i]} == ${ans}). Count++`);
        setDescription(`Current number matches the Candidate.\nSupport increases! Count becomes ${freq}.`);
        setState(prev => ({ ...prev, currentIdx: i, freq: freq, action: 'match' }));
        await sleep(1200);
        await checkPause();
      } 
      // LOGIC: Clash
      else {
        freq--;
        setLog(`Mismatch! (${array[i]} != ${ans}). Count--`);
        setDescription(`Current number opposes the Candidate.\nThey cancel each other out. Count drops to ${freq}.`);
        setState(prev => ({ ...prev, currentIdx: i, freq: freq, action: 'clash' }));
        await sleep(1200);
        await checkPause();
      }
    }

    setLog(`Finished. Candidate: ${ans}`);
    setDescription(`Iteration complete. The potential majority element is ${ans}.\n(Note: In a complete solution, we would verify this count).`);
    setState(prev => ({ ...prev, status: 'finished', currentIdx: -1, action: null }));
    pausedRef.current = false;
    setIsPaused(false);
  };

  const reset = () => {
    setArray([2, 2, 1, 1, 1, 2, 2]);
    setState({ status: 'idle', currentIdx: -1, candidate: null, freq: 0, action: null });
    setLog("Reset.");
    setDescription("Ready.");
    pausedRef.current = false;
    setIsPaused(false);
  };

  return (
    <>
      <style>{styles}</style>
      <div className="maj-container">
        
        {/* VIZ PANEL */}
        <div className="viz-panel">
          <div className="candidate-label">Current Candidate</div>
          
          <Canvas camera={{ position: [0, 0.5, 14], fov: 45 }}>
            <color attach="background" args={['#ffffff']} />
            <ambientLight intensity={1} />
            <directionalLight position={[5, 10, 5]} intensity={1.5} />
            <Environment preset="city" />
            <Center>
              <group>
                {/* CANDIDATE BOX (Moved to y=2) */}
                <CandidateBox val={state.candidate} freq={state.freq} visible={state.candidate !== null} />
                
                {/* ARRAY ROW (Moved to y=-2.5) */}
                <group position={[0, -2.5, 0]}>
                  {array.map((val, i) => (
                    <ArrayNode key={i} val={val} idx={i} state={state} total={array.length} />
                  ))}
                </group>
              </group>
            </Center>
            <ContactShadows position={[0, -4, 0]} opacity={0.4} scale={30} blur={2.5} color="#15803d" />
          </Canvas>
        </div>

        {/* CTRL PANEL */}
        <div className="ctrl-panel">
          <div className="header-row">
            <button className="back-btn" onClick={onBack}>← Back to Menu</button>
            <h2>Majority Element</h2>
          </div>

          <div className={`explain-box ${isPaused ? 'paused' : ''}`}>
             <h3 className="explain-title">
               Current Step
               {isPaused && <span className="pause-badge">PAUSED</span>}
             </h3>
             <p className="explain-text">{description}</p>
          </div>

          <div className="console">
            {log}<span className="cursor">_</span>
          </div>

          <div style={{marginBottom: '1.5rem'}}>
            <label style={{fontSize:'0.8rem', fontWeight:'600', color:'#4b5563'}}>Input Array (Comma separated)</label>
            <input 
               type="text" 
               value={array.join(', ')} 
               onChange={e => setArray(e.target.value.split(',').map(n => parseInt(n.trim()) || 0))}
               disabled={state.status !== 'idle'}
               style={{width:'100%', padding:'0.7rem', border:'1px solid #d1d5db', borderRadius:'6px', marginTop:'5px'}}
            />
          </div>

          <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'1rem', marginBottom:'2rem'}}>
             {state.status === 'running' ? (
               <button className="btn btn-pause" onClick={togglePause}>
                 {isPaused ? "▶ Resume" : "⏸ Pause"}
               </button>
             ) : (
               <button className="btn" onClick={runMajority} disabled={state.status === 'finished'}>
                  Find Majority
               </button>
             )}
             <button className="btn btn-reset" onClick={reset}>Reset</button>
          </div>

          <div style={{padding:'1rem', background:'#f3f4f6', borderRadius:'8px', fontSize:'0.75rem', color:'#374151'}}>
            <strong>Moore's Voting Algorithm (C++):</strong>
            <pre style={{margin:'0.5rem 0', fontFamily:'monospace', lineHeight:'1.4'}}>
{`int freq=0, ans=0;
for(int i=0; i<n; i++){
   if(freq==0) ans = nums[i];
   if (ans==nums[i]) freq++;
   else freq--;    
}
return ans;`}
            </pre>
          </div>
        </div>
      </div>
    </>
  );
}