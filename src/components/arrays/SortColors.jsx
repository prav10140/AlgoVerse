import React, { useState, useRef, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Center, Text, RoundedBox, Environment, ContactShadows, Html } from '@react-three/drei';
import * as THREE from 'three';

// ==========================================
// 1. STYLES
// ==========================================
const styles = `
  .sort-container { width: 100%; height: 100vh; display: flex; background: #fff; font-family: 'Inter', sans-serif; overflow: hidden; }
  
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

// --- POINTERS (L, M, H) ---
function Pointers({ low, mid, high, visible, total }) {
  const lRef = useRef();
  const mRef = useRef();
  const hRef = useRef();

  useFrame((_, delta) => {
    if(!visible) return;
    const gap = 1.6;
    const startX = -((total * gap) / 2) + (gap / 2);

    const tL = startX + (low * gap);
    const tM = startX + (mid * gap);
    const tH = startX + (high * gap);

    if (lRef.current) lRef.current.position.x = THREE.MathUtils.lerp(lRef.current.position.x, tL, delta * 8);
    if (mRef.current) mRef.current.position.x = THREE.MathUtils.lerp(mRef.current.position.x, tM, delta * 8);
    if (hRef.current) hRef.current.position.x = THREE.MathUtils.lerp(hRef.current.position.x, tH, delta * 8);
  });

  if(!visible) return null;

  return (
    <>
      <group ref={lRef} position={[0, 1.8, 0]}>
        <mesh rotation={[Math.PI, 0, 0]}><coneGeometry args={[0.2, 0.5, 16]} /><meshStandardMaterial color="#ef4444" /></mesh>
        <Html position={[0, 0.8, 0]} center><div className="ptr-label" style={{background:'#ef4444'}}>Low ({low})</div></Html>
      </group>
      <group ref={mRef} position={[0, 1.8, 0]}>
        <mesh rotation={[Math.PI, 0, 0]}><coneGeometry args={[0.2, 0.5, 16]} /><meshStandardMaterial color="#3b82f6" /></mesh>
        <Html position={[0, 2, 0]} center><div className="ptr-label" style={{background:'#3b82f6'}}>Mid ({mid})</div></Html>
      </group>
      <group ref={hRef} position={[0, 1.8, 0]}>
        <mesh rotation={[Math.PI, 0, 0]}><coneGeometry args={[0.2, 0.5, 16]} /><meshStandardMaterial color="#10b981" /></mesh>
        <Html position={[0, 0.8, 0]} center><div className="ptr-label" style={{background:'#10b981'}}>High ({high})</div></Html>
      </group>
    </>
  );
}

// --- ARRAY NODE ---
function ArrayNode({ val, idx, total, state }) {
  const mesh = useRef();
  
  const gap = 1.6;
  const startX = -((total * gap) / 2) + (gap / 2);
  const targetX = startX + (idx * gap);

  let baseColor = "#f3f4f6"; // 1
  if (val === 0) baseColor = "#fca5a5"; // 0
  if (val === 2) baseColor = "#93c5fd"; // 2

  const isSwapping = state.status === 'swapping' && (idx === state.swapA || idx === state.swapB);
  if (isSwapping) baseColor = "#fbbf24";

  useFrame((_, delta) => {
    if (!mesh.current) return;
    mesh.current.position.x = THREE.MathUtils.lerp(mesh.current.position.x, targetX, delta * 6);
    const targetY = isSwapping ? 1.5 : 0;
    mesh.current.position.y = THREE.MathUtils.lerp(mesh.current.position.y, targetY, delta * 6);
  });

  return (
    <group ref={mesh} position={[targetX, 0, 0]}>
      <RoundedBox args={[1.2, 1.2, 0.2]} radius={0.15} smoothness={4}>
        <meshStandardMaterial color={baseColor} />
      </RoundedBox>
      <RoundedBox args={[1.25, 1.25, 0.18]} radius={0.15}>
        <meshBasicMaterial color="#1f2937" side={THREE.BackSide} />
      </RoundedBox>
      <Text position={[0, 0, 0.12]} fontSize={0.6} color="#1f2937" fontWeight={800}>{val}</Text>
      <Text position={[0, -0.9, 0]} fontSize={0.25} color="#9ca3af">{idx}</Text>
    </group>
  );
}

// ==========================================
// 3. MAIN LOGIC
// ==========================================
export default function SortColors({ onBack }) {
  const [array, setArray] = useState([2, 0, 2, 1, 1, 0]);
  const [pointers, setPointers] = useState({ low: 0, mid: 0, high: 5 });
  const [state, setState] = useState({ status: 'idle', swapA: -1, swapB: -1 });
  const [log, setLog] = useState("Ready.");
  const [description, setDescription] = useState("Press 'Start Sorting' to begin.");
  
  // PAUSE STATE
  const [isPaused, setIsPaused] = useState(false);
  const pausedRef = useRef(false);

  const sleep = (ms) => new Promise(r => setTimeout(r, ms));

  const checkPause = async () => {
    while (pausedRef.current) {
      await sleep(100);
    }
  };

  const togglePause = () => {
    pausedRef.current = !pausedRef.current;
    setIsPaused(pausedRef.current);
    if (pausedRef.current) setLog("PAUSED. Press Resume.");
    else setLog("Resuming...");
  };

  const runSort = async () => {
    if (state.status !== 'idle' && state.status !== 'finished') return;
    
    // Reset if previously finished
    let arr = (state.status === 'finished') ? [2, 0, 2, 1, 1, 0] : [...array];
    if (state.status === 'finished') setArray(arr);

    let low = 0;
    let mid = 0;
    let high = arr.length - 1;

    setLog("Initializing Pointers.");
    setDescription("Pointers set: Low=0, Mid=0, High=N-1.");
    setPointers({ low, mid, high });
    setState({ status: 'running', swapA: -1, swapB: -1 });
    await sleep(1000);
    await checkPause();

    while (mid <= high) {
      setPointers({ low, mid, high });
      
      // EXPLAIN STEP
      if (arr[mid] === 0) {
        setLog(`nums[mid] == 0.`);
        setDescription(`Current Value (Mid) is 0 (Red).\nAction: Swap with Low, then increment Low & Mid.`);
        await sleep(1000); 
        await checkPause();

        setState({ status: 'swapping', swapA: low, swapB: mid });
        await sleep(800);
        
        [arr[low], arr[mid]] = [arr[mid], arr[low]];
        setArray([...arr]);
        await sleep(800);
        
        low++;
        mid++;
        
      } else if (arr[mid] === 1) {
        setLog(`nums[mid] == 1.`);
        setDescription(`Current Value (Mid) is 1 (White).\nAction: Correctly placed. Increment Mid.`);
        await sleep(1000);
        await checkPause();

        mid++;
        
      } else {
        setLog(`nums[mid] == 2.`);
        setDescription(`Current Value (Mid) is 2 (Blue).\nAction: Swap with High, then decrement High.`);
        await sleep(1000);
        await checkPause();

        setState({ status: 'swapping', swapA: mid, swapB: high });
        await sleep(800);

        [arr[mid], arr[high]] = [arr[high], arr[mid]];
        setArray([...arr]);
        await sleep(800);

        high--;
      }
      
      setState({ status: 'running', swapA: -1, swapB: -1 });
      await sleep(500);
    }

    setLog("Sorted.");
    setDescription("Mid > High. The array is sorted.");
    setPointers({ low, mid, high });
    setState({ status: 'finished', swapA: -1, swapB: -1 });
    pausedRef.current = false;
    setIsPaused(false);
  };

  const reset = () => {
    setArray([2, 0, 2, 1, 1, 0]);
    setPointers({ low: 0, mid: 0, high: 5 });
    setState({ status: 'idle', swapA: -1, swapB: -1 });
    setLog("Reset.");
    setDescription("Ready.");
    pausedRef.current = false;
    setIsPaused(false);
  };

  return (
    <>
      <style>{styles}</style>
      <div className="sort-container">
        
        {/* VIZ PANEL */}
        <div className="viz-panel">
          <Canvas camera={{ position: [0, 1, 10], fov: 45 }}>
            <color attach="background" args={['#ffffff']} />
            <ambientLight intensity={1} />
            <directionalLight position={[5, 10, 5]} intensity={1.5} />
            <Environment preset="city" />
            <Center>
              <group>
                <Pointers {...pointers} visible={state.status !== 'idle'} total={array.length} />
                {array.map((val, i) => (
                  <ArrayNode key={`${i}-${val}`} val={val} idx={i} total={array.length} state={state} />
                ))}
              </group>
            </Center>
            <ContactShadows position={[0, -2, 0]} opacity={0.4} scale={30} blur={2.5} color="#15803d" />
          </Canvas>
        </div>

        {/* CTRL PANEL */}
        <div className="ctrl-panel">
          <div className="header-row">
            <button className="back-btn" onClick={onBack}>← Back to Menu</button>
            <h2>Sort Colors</h2>
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

          <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'1rem', marginBottom:'2rem'}}>
             {state.status === 'running' || state.status === 'swapping' ? (
               <button className="btn btn-pause" onClick={togglePause}>
                 {isPaused ? "▶ Resume" : "⏸ Pause"}
               </button>
             ) : (
               <button className="btn" onClick={runSort} disabled={state.status === 'finished'}>
                  Start Sorting
               </button>
             )}
             
             <button className="btn btn-reset" onClick={reset}>
                Reset
             </button>
          </div>

          {/* CODE DISPLAY (RESTORED) */}
          <div style={{padding:'1rem', background:'#f3f4f6', borderRadius:'8px', fontSize:'0.75rem', color:'#374151', marginBottom:'1rem'}}>
            <strong>Logic (C++):</strong>
            <pre style={{margin:'0.5rem 0', fontFamily:'monospace', lineHeight:'1.4'}}>
{`while(mid <= high) {
  if(nums[mid] == 0) {
    swap(nums[low], nums[mid]);
    low++; mid++;
  } else if(nums[mid] == 1) {
    mid++;
  } else {
    swap(nums[mid], nums[high]);
    high--;
  }
}`}
            </pre>
          </div>

          <div style={{marginTop:'auto'}}>
             <div style={{display:'flex', gap:'15px', fontSize:'0.9rem'}}>
               <div style={{display:'flex', alignItems:'center', gap:'5px'}}><div style={{width:12,height:12,borderRadius:4,background:'#fca5a5'}}></div>0</div>
               <div style={{display:'flex', alignItems:'center', gap:'5px'}}><div style={{width:12,height:12,borderRadius:4,background:'#f3f4f6',border:'1px solid #ccc'}}></div>1</div>
               <div style={{display:'flex', alignItems:'center', gap:'5px'}}><div style={{width:12,height:12,borderRadius:4,background:'#93c5fd'}}></div>2</div>
             </div>
          </div>

        </div>
      </div>
    </>
  );
}