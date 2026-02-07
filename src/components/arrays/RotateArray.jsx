import React, { useState, useRef, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Center, Text, RoundedBox, Environment, ContactShadows, Html } from '@react-three/drei';
import * as THREE from 'three';

// ==========================================
// 1. EMBEDDED CSS
// ==========================================
const styles = `
  .rot-container { width: 100%; height: 100vh; display: flex; background: #fff; font-family: 'Inter', sans-serif; overflow: hidden; }
  
  /* LEFT: 3D PANEL */
  .viz-panel { flex: 1.8; position: relative; background: radial-gradient(circle at center, #f0fdf4 0%, #ffffff 80%); border-right: 1px solid #e5e7eb; }
  
  .step-badge {
    position: absolute; top: 10%; left: 50%; transform: translateX(-50%);
    background: rgba(255,255,255,0.9); padding: 0.5rem 1.5rem;
    border-radius: 50px; border: 2px solid #15803d;
    font-weight: 800; color: #15803d; font-size: 1.2rem;
    box-shadow: 0 4px 10px rgba(0,0,0,0.1); pointer-events: none;
  }

  /* RIGHT: CONTROLS */
  .ctrl-panel { flex: 0.8; background: #fff; padding: 2rem; display: flex; flex-direction: column; box-shadow: -5px 0 20px rgba(0,0,0,0.03); z-index: 10; overflow-y: auto; }
  
  .header-row { display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem; }
  .back-btn { background: none; border: none; color: #6b7280; font-weight: 600; cursor: pointer; }
  .back-btn:hover { color: #15803d; }
  h2 { font-size: 2rem; font-weight: 800; color: #111827; margin: 0; }

  /* CONSOLE */
  .console { background: #111827; border-radius: 12px; padding: 1.5rem; color: #4ade80; font-family: 'JetBrains Mono', monospace; font-size: 0.85rem; margin-bottom: 1.5rem; min-height: 80px; }
  .cursor { animation: blink 1s infinite; }
  @keyframes blink { 50% { opacity: 0; } }

  .btn { width: 100%; padding: 0.8rem; border-radius: 8px; border: none; background: #15803d; color: white; font-weight: 600; cursor: pointer; transition: 0.2s; }
  .btn:hover:not(:disabled) { background: #166534; transform: translateY(-1px); }
  .btn:disabled { background: #9ca3af; cursor: not-allowed; }
  .btn-reset { background: #6b7280; }

  .pointer-label {
    font-family: 'JetBrains Mono', monospace; font-size: 0.7rem; font-weight: 800;
    padding: 2px 6px; border-radius: 4px; color: white;
  }
`;

// ==========================================
// 2. 3D COMPONENTS
// ==========================================

// --- POINTER MARKERS ---
function Pointers({ left, right, visible, size }) {
  const lRef = useRef();
  const rRef = useRef();
  
  useFrame((_, delta) => {
    if (!visible) return;
    const gap = 1.6;
    const offset = (size * gap) / 2 - (gap / 2);
    const tL = (left * gap) - offset;
    const tR = (right * gap) - offset;

    if (lRef.current) lRef.current.position.x = THREE.MathUtils.lerp(lRef.current.position.x, tL, delta * 10);
    if (rRef.current) rRef.current.position.x = THREE.MathUtils.lerp(rRef.current.position.x, tR, delta * 10);
  });

  if (!visible) return null;

  return (
    <>
      <group ref={lRef} position={[0, 1.5, 0]}>
        <mesh rotation={[Math.PI, 0, 0]}><coneGeometry args={[0.2, 0.5, 16]} /><meshStandardMaterial color="#3b82f6" /></mesh>
        <Html position={[0, 0.8, 0]} center><div className="pointer-label" style={{background:'#3b82f6'}}>L</div></Html>
      </group>
      <group ref={rRef} position={[0, 1.5, 0]}>
        <mesh rotation={[Math.PI, 0, 0]}><coneGeometry args={[0.2, 0.5, 16]} /><meshStandardMaterial color="#f97316" /></mesh>
        <Html position={[0, 0.8, 0]} center><div className="pointer-label" style={{background:'#f97316'}}>R</div></Html>
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

  // Determine if this node is in the current active range being reversed
  const inRange = state.range && idx >= state.range[0] && idx <= state.range[1];
  
  // Is this specific node being swapped right now?
  const isSwapping = state.status === 'swapping' && (idx === state.pointers.left || idx === state.pointers.right);

  // Colors
  let color = "#e5e7eb"; // Default Gray
  if (inRange) color = "#dcfce7"; // Light Green (Active Segment)
  if (state.pointers.left === idx) color = "#93c5fd"; // Left Pointer Blue
  if (state.pointers.right === idx) color = "#fdba74"; // Right Pointer Orange
  if (isSwapping) color = "#fbbf24"; // Gold during swap

  useFrame((_, delta) => {
    if (!mesh.current) return;
    
    // X Movement
    mesh.current.position.x = THREE.MathUtils.lerp(mesh.current.position.x, targetX, delta * 6);
    
    // Y Movement (Jump)
    const targetY = isSwapping ? 1.5 : 0;
    mesh.current.position.y = THREE.MathUtils.lerp(mesh.current.position.y, targetY, delta * 6);
  });

  return (
    <group ref={mesh} position={[targetX, 0, 0]}>
      <RoundedBox args={[1.2, 1.2, 0.2]} radius={0.15} smoothness={4}>
        <meshStandardMaterial color={color} />
      </RoundedBox>
      <Text position={[0, 0, 0.12]} fontSize={0.5} color="#1f2937" fontWeight={800}>{val}</Text>
      <Text position={[0, -0.9, 0]} fontSize={0.25} color="#9ca3af">{idx}</Text>
    </group>
  );
}

// ==========================================
// 3. MAIN LOGIC
// ==========================================
export default function RotateArray({ onBack }) {
  const [array, setArray] = useState([1, 2, 3, 4, 5, 6, 7]);
  const [kInput, setKInput] = useState(3);
  
  // State: { status: 'idle'|'running'|'swapping', step: 0-3, pointers: {left, right}, range: [start, end] }
  const [state, setState] = useState({ 
    status: 'idle', 
    step: 0, 
    pointers: { left: -1, right: -1 }, 
    range: null 
  });
  
  const [log, setLog] = useState("Ready. Enter K and click Rotate.");

  const sleep = (ms) => new Promise(r => setTimeout(r, ms));

  // --- HELPER: REVERSE SEGMENT ---
  const reverseSegment = async (arr, start, end, stepDesc) => {
    setState(prev => ({ ...prev, range: [start, end], status: 'running', pointers: { left: start, right: end } }));
    setLog(`${stepDesc}: Reversing index ${start} to ${end}`);
    await sleep(1000);

    let l = start;
    let r = end;

    while (l < r) {
      // 1. Highlight
      setState(prev => ({ ...prev, pointers: { left: l, right: r }, status: 'checking' }));
      await sleep(600);

      // 2. Swap Visual
      setState(prev => ({ ...prev, status: 'swapping' }));
      await sleep(600);

      // 3. Update Data
      const temp = arr[l];
      arr[l] = arr[r];
      arr[r] = temp;
      setArray([...arr]); // Trigger React Re-render
      await sleep(800);

      l++;
      r--;
    }
    setLog(`Segment [${start}, ${end}] reversed.`);
  };

  // --- MAIN ALGORITHM ---
  const runRotate = async () => {
    if (state.status !== 'idle') return;
    
    const n = array.length;
    const k = kInput % n;
    
    if (k === 0) {
      setLog("K is 0 (or multiple of N). No rotation needed.");
      return;
    }

    setLog(`N=${n}, K=${kInput}. Effective K = ${k}`);
    let workingArray = [...array];

    // STEP 1: Reverse First Part (0 to n-k-1)
    setState(prev => ({ ...prev, step: 1 }));
    await reverseSegment(workingArray, 0, n - k - 1, "Step 1/3");
    await sleep(500);

    // STEP 2: Reverse Second Part (n-k to n-1)
    setState(prev => ({ ...prev, step: 2 }));
    await reverseSegment(workingArray, n - k, n - 1, "Step 2/3");
    await sleep(500);

    // STEP 3: Reverse Whole Array (0 to n-1)
    setState(prev => ({ ...prev, step: 3 }));
    await reverseSegment(workingArray, 0, n - 1, "Step 3/3");
    
    setLog("Rotation Complete!");
    setState({ status: 'idle', step: 0, pointers: { left: -1, right: -1 }, range: null });
  };

  const reset = () => {
    setArray([1, 2, 3, 4, 5, 6, 7]);
    setKInput(3);
    setState({ status: 'idle', step: 0, pointers: { left: -1, right: -1 }, range: null });
    setLog("Reset.");
  };

  // Helper text for badges
  const getStepText = () => {
    if (state.step === 1) return "Step 1: Reverse First Part";
    if (state.step === 2) return "Step 2: Reverse Last K";
    if (state.step === 3) return "Step 3: Reverse All";
    return "Right Rotate Array";
  };

  return (
    <>
      <style>{styles}</style>
      <div className="rot-container">
        
        {/* VISUAL PANEL */}
        <div className="viz-panel">
          <div className="step-badge">{getStepText()}</div>
          
          <Canvas camera={{ position: [0, 1, 12], fov: 40 }}>
            <color attach="background" args={['#ffffff']} />
            <ambientLight intensity={1} />
            <directionalLight position={[5, 10, 5]} intensity={1.5} />
            <Environment preset="city" />

            <Center>
              <group>
                <Pointers left={state.pointers.left} right={state.pointers.right} visible={state.status !== 'idle'} size={array.length} />
                {array.map((val, i) => (
                  <ArrayNode key={`${i}-${val}`} val={val} idx={i} total={array.length} state={state} />
                ))}
              </group>
            </Center>
            
            <ContactShadows position={[0, -2, 0]} opacity={0.4} scale={30} blur={2.5} color="#15803d" />
          </Canvas>
        </div>

        {/* CONTROL PANEL */}
        <div className="ctrl-panel">
          <div className="header-row">
            <button className="back-btn" onClick={onBack}>← Back to Menu</button>
            <h2>Rotate Array</h2>
          </div>

          <div className="console">
             {log}<span className="cursor">_</span>
          </div>

          <div style={{marginBottom:'2rem'}}>
            <label style={{display:'block', fontSize:'0.8rem', fontWeight:'600', color:'#4b5563', marginBottom:'0.5rem'}}>K (Rotation Amount)</label>
            <input 
              type="number" 
              value={kInput} 
              onChange={e => setKInput(parseInt(e.target.value) || 0)}
              disabled={state.status !== 'idle'}
              style={{width:'100%', padding:'0.8rem', borderRadius:'8px', border:'1px solid #d1d5db'}}
            />
          </div>

          <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'1rem', marginBottom:'2rem'}}>
             <button className="btn" onClick={runRotate} disabled={state.status !== 'idle'}>
                Rotate
             </button>
             <button className="btn btn-reset" onClick={reset} disabled={state.status !== 'idle'}>
                Reset
             </button>
          </div>

          <div style={{padding:'1rem', background:'#f3f4f6', borderRadius:'8px', fontSize:'0.75rem', color:'#374151'}}>
            <strong>Reversal Algorithm (C++):</strong>
            <pre style={{margin:'0.5rem 0', fontFamily:'monospace', lineHeight:'1.4'}}>
{`k = k % nums.size();
reverse(nums, 0, n - k - 1);
reverse(nums, n - k, n - 1);
reverse(nums, 0, n - 1);`}
            </pre>
          </div>
        </div>
      </div>
    </>
  );
}