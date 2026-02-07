import React, { useState, useRef, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Center, Text, RoundedBox, Environment, ContactShadows, Html } from '@react-three/drei';
import * as THREE from 'three';

// ==========================================
// 1. STYLES (Reusing the robust design)
// ==========================================
const styles = `
  .peak-container { width: 100%; height: 100vh; display: flex; background: #fff; font-family: 'Inter', sans-serif; overflow: hidden; }
  
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

  /* POINTER LABELS */
  .ptr-label {
    font-family: 'JetBrains Mono', monospace; font-size: 0.7rem; font-weight: 800;
    padding: 4px 8px; border-radius: 4px; color: white; box-shadow: 0 2px 4px rgba(0,0,0,0.2); white-space: nowrap;
  }
`;

// ==========================================
// 2. 3D COMPONENTS
// ==========================================

// --- POINTERS (Start, Mid, End) ---
function Pointers({ st, mid, end, visible, total }) {
  const sRef = useRef();
  const mRef = useRef();
  const eRef = useRef();

  useFrame((_, delta) => {
    if(!visible) return;
    const gap = 1.6;
    const startX = -((total * gap) / 2) + (gap / 2);

    const tS = startX + (st * gap);
    const tM = startX + (mid * gap);
    const tE = startX + (end * gap);

    if (sRef.current) sRef.current.position.x = THREE.MathUtils.lerp(sRef.current.position.x, tS, delta * 8);
    if (mRef.current) mRef.current.position.x = THREE.MathUtils.lerp(mRef.current.position.x, tM, delta * 8);
    if (eRef.current) eRef.current.position.x = THREE.MathUtils.lerp(eRef.current.position.x, tE, delta * 8);
  });

  if(!visible) return null;

  return (
    <>
      <group ref={sRef} position={[0, 4.5, 0]}>
        <mesh rotation={[Math.PI, 0, 0]}><coneGeometry args={[0.2, 0.5, 16]} /><meshStandardMaterial color="#10b981" /></mesh>
        <Html position={[0, 0.8, 0]} center><div className="ptr-label" style={{background:'#10b981'}}>Start ({st})</div></Html>
      </group>
      <group ref={mRef} position={[0, 3.5, 0]}>
        <mesh rotation={[Math.PI, 0, 0]}><coneGeometry args={[0.2, 0.5, 16]} /><meshStandardMaterial color="#3b82f6" /></mesh>
        <Html position={[0, 2, 0]} center><div className="ptr-label" style={{background:'#3b82f6'}}>Mid ({mid})</div></Html>
      </group>
      <group ref={eRef} position={[0, 4.5, 0]}>
        <mesh rotation={[Math.PI, 0, 0]}><coneGeometry args={[0.2, 0.5, 16]} /><meshStandardMaterial color="#ef4444" /></mesh>
        <Html position={[0, 0.8, 0]} center><div className="ptr-label" style={{background:'#ef4444'}}>End ({end})</div></Html>
      </group>
    </>
  );
}

// --- ARRAY BAR NODE ---
// Visualizes value as Height
function BarNode({ val, idx, total, state }) {
  const mesh = useRef();
  
  const gap = 1.6;
  const startX = -((total * gap) / 2) + (gap / 2);
  const targetX = startX + (idx * gap);
  
  // Height Logic
  const height = val * 0.5; 
  const yPos = height / 2 - 1.5; // Align bottom roughly

  // Color Logic
  // Mid = Blue, Mid+1 = Orange (Comparison), Range = Light Green, Outside = Gray
  let color = "#e5e7eb"; // Gray
  
  // Is inside search range?
  if (idx >= state.pointers.st && idx <= state.pointers.end) {
     color = "#d1fae5"; // Pale Green
  }

  if (state.status === 'comparing') {
    if (idx === state.pointers.mid) color = "#3b82f6"; // Mid (Blue)
    if (idx === state.pointers.mid + 1) color = "#f97316"; // Mid+1 (Orange)
  }
  
  if (state.status === 'finished' && idx === state.pointers.st) {
    color = "#f59e0b"; // Gold (Found)
  }

  useFrame((_, delta) => {
    if (!mesh.current) return;
    mesh.current.position.x = THREE.MathUtils.lerp(mesh.current.position.x, targetX, delta * 6);
  });

  return (
    <group ref={mesh} position={[targetX, yPos, 0]}>
      <RoundedBox args={[1, height, 0.2]} radius={0.1} smoothness={4}>
        <meshStandardMaterial color={color} />
      </RoundedBox>
      <RoundedBox args={[1.05, height + 0.05, 0.18]} radius={0.1}>
         <meshBasicMaterial color="#1f2937" side={THREE.BackSide} />
      </RoundedBox>
      
      {/* Value on Top */}
      <Text position={[0, height/2 + 0.3, 0]} fontSize={0.4} color="#1f2937" fontWeight={800}>{val}</Text>
      {/* Index on Bottom */}
      <Text position={[0, -height/2 - 0.4, 0]} fontSize={0.2} color="#9ca3af">{idx}</Text>
    </group>
  );
}

// ==========================================
// 3. MAIN LOGIC
// ==========================================
export default function FindPeak({ onBack }) {
  // Classic peak example: Up, Up, Down, Up, Down
  const [array, setArray] = useState([1, 2, 3, 1, 4, 2, 1]); 
  const [pointers, setPointers] = useState({ st: 0, mid: 0, end: 6 });
  const [state, setState] = useState({ status: 'idle' }); 
  const [log, setLog] = useState("Ready.");
  const [description, setDescription] = useState("Binary Search on Answer.\nWe look for slope direction.");
  
  const [isPaused, setIsPaused] = useState(false);
  const pausedRef = useRef(false);

  const sleep = (ms) => new Promise(r => setTimeout(r, ms));

  const checkPause = async () => {
    while (pausedRef.current) await sleep(100);
  };

  const togglePause = () => {
    pausedRef.current = !pausedRef.current;
    setIsPaused(pausedRef.current);
  };

  const runBinarySearch = async () => {
    if (state.status !== 'idle' && state.status !== 'finished') return;
    
    let st = 0;
    let end = array.length - 1;
    let mid = 0;

    setPointers({ st, mid, end });
    setState({ status: 'running', pointers: { st, mid, end } });
    setLog("Initializing Start=0, End=" + end);
    setDescription("Range is the full array.");
    await sleep(1000);
    await checkPause();

    while (st < end) {
      // 1. Calc Mid
      mid = Math.floor(st + (end - st) / 2);
      setPointers({ st, mid, end });
      setState({ status: 'running', pointers: { st, mid, end } });
      
      setLog(`Mid = ${mid}. Comparing nums[${mid}] vs nums[${mid+1}]`);
      setDescription(`Calculated Mid at index ${mid}.\nNow we check if we are rising or falling.`);
      await sleep(1000);
      await checkPause();

      // 2. Compare Visuals
      setState({ status: 'comparing', pointers: { st, mid, end } });
      
      const valMid = array[mid];
      const valNext = array[mid+1];
      
      if (valMid > valNext) {
        // DESCENDING SLOPE
        setLog(`${valMid} > ${valNext}. Descending.`);
        setDescription(`Since nums[mid] > nums[mid+1], we are on a Falling Slope.\nThe peak must be to the LEFT (or matches mid).`);
        await sleep(1500);
        await checkPause();

        end = mid; // Move End
      } else {
        // ASCENDING SLOPE
        setLog(`${valMid} < ${valNext}. Ascending.`);
        setDescription(`Since nums[mid] < nums[mid+1], we are on a Rising Slope.\nThe peak must be to the RIGHT.`);
        await sleep(1500);
        await checkPause();

        st = mid + 1; // Move Start
      }
      
      // Update Pointers after move
      setPointers({ st, mid, end });
      setState({ status: 'running', pointers: { st, mid, end } });
      await sleep(1000);
    }

    setLog(`Start == End (${st}). Peak Found.`);
    setDescription(`Search space collapsed to one element.\nIndex ${st} is a Peak Element.`);
    setPointers({ st, mid: st, end });
    setState({ status: 'finished', pointers: { st, mid: st, end } });
    
    pausedRef.current = false;
    setIsPaused(false);
  };

  const reset = () => {
    setArray([1, 2, 3, 1, 4, 2, 1]);
    setPointers({ st: 0, mid: 0, end: 6 });
    setState({ status: 'idle' });
    setLog("Reset.");
    setDescription("Ready.");
    pausedRef.current = false;
    setIsPaused(false);
  };

  return (
    <>
      <style>{styles}</style>
      <div className="peak-container">
        
        {/* VIZ PANEL */}
        <div className="viz-panel">
          <Canvas camera={{ position: [0, 3, 12], fov: 45 }}>
            <color attach="background" args={['#ffffff']} />
            <ambientLight intensity={1} />
            <directionalLight position={[5, 10, 5]} intensity={1.5} />
            <Environment preset="city" />
            <Center>
              <group>
                <Pointers {...pointers} visible={state.status !== 'idle'} total={array.length} />
                {array.map((val, i) => (
                  <BarNode key={`${i}-${val}`} val={val} idx={i} total={array.length} state={{...state, pointers}} />
                ))}
              </group>
            </Center>
            <ContactShadows position={[0, -3, 0]} opacity={0.4} scale={30} blur={2.5} color="#15803d" />
          </Canvas>
        </div>

        {/* CTRL PANEL */}
        <div className="ctrl-panel">
          <div className="header-row">
            <button className="back-btn" onClick={onBack}>← Back to Menu</button>
            <h2>Find Peak</h2>
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

          <div style={{marginBottom:'1.5rem'}}>
             <label style={{fontSize:'0.8rem', fontWeight:'600', color:'#4b5563'}}>Custom Array (Peaks & Valleys)</label>
             <input 
               type="text" 
               value={array.join(',')} 
               onChange={e => setArray(e.target.value.split(',').map(n => parseInt(n.trim()) || 0))}
               disabled={state.status !== 'idle'}
               style={{width:'100%', padding:'0.7rem', border:'1px solid #d1d5db', borderRadius:'6px', marginTop:'5px'}}
             />
          </div>

          <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'1rem', marginBottom:'2rem'}}>
             {state.status === 'running' || state.status === 'comparing' ? (
               <button className="btn btn-pause" onClick={togglePause}>
                 {isPaused ? "▶ Resume" : "⏸ Pause"}
               </button>
             ) : (
               <button className="btn" onClick={runBinarySearch} disabled={state.status === 'finished'}>
                  Find Peak
               </button>
             )}
             <button className="btn btn-reset" onClick={reset}>Reset</button>
          </div>

          <div style={{padding:'1rem', background:'#f3f4f6', borderRadius:'8px', fontSize:'0.75rem', color:'#374151'}}>
            <strong>Code (C++):</strong>
            <pre style={{margin:'0.5rem 0', fontFamily:'monospace', lineHeight:'1.4'}}>
{`while(st < end){
  int mid = st + (end - st) / 2;
  if(nums[mid] > nums[mid+1]) {
     end = mid; // Falling -> Peak Left
  } else {
     st = mid + 1; // Rising -> Peak Right
  }
}
return st;`}
            </pre>
          </div>
        </div>
      </div>
    </>
  );
}