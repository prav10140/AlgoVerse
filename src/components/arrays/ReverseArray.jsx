import React, { useState, useRef, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Center, Text, RoundedBox, Environment, ContactShadows, Html } from '@react-three/drei';
import * as THREE from 'three';

// ==========================================
// 1. EMBEDDED CSS
// ==========================================
const styles = `
  .rev-container { width: 100%; height: 100vh; display: flex; background: #fff; font-family: 'Inter', sans-serif; overflow: hidden; }
  
  /* LEFT: 3D PANEL */
  .viz-panel { flex: 1.8; position: relative; background: radial-gradient(circle at center, #f0fdf4 0%, #ffffff 80%); border-right: 1px solid #e5e7eb; }
  
  .title-label { 
    position: absolute; top: 10%; left: 50%; transform: translateX(-50%);
    font-weight: 800; color: #15803d; font-size: 1.5rem; 
    text-shadow: 0 2px 10px rgba(21, 128, 61, 0.2); pointer-events: none;
  }
  
  .pointer-label {
    font-family: 'JetBrains Mono', monospace; font-size: 0.8rem; font-weight: 800;
    padding: 4px 8px; border-radius: 4px; color: white;
  }
  .p-left { background: #3b82f6; }
  .p-right { background: #f97316; }

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
`;

// ==========================================
// 2. 3D COMPONENTS
// ==========================================

// --- POINTER MARKERS (Arrows) ---
function Pointers({ left, right, size }) {
  // We use useFrame to animate them smoothly to their target index
  const lRef = useRef();
  const rRef = useRef();

  useFrame((_, delta) => {
    // Calculate X position based on index: (index * gap) - offset
    const gap = 1.6;
    const offset = (size * gap) / 2 - (gap / 2);
    
    const targetL = (left * gap) - offset;
    const targetR = (right * gap) - offset;

    if (lRef.current) lRef.current.position.x = THREE.MathUtils.lerp(lRef.current.position.x, targetL, delta * 8);
    if (rRef.current) rRef.current.position.x = THREE.MathUtils.lerp(rRef.current.position.x, targetR, delta * 8);
  });

  return (
    <>
      <group ref={lRef} position={[0, 1.5, 0]}>
        <mesh rotation={[Math.PI, 0, 0]}>
          <coneGeometry args={[0.2, 0.5, 16]} />
          <meshStandardMaterial color="#3b82f6" />
        </mesh>
        <Html position={[0, 0.8, 0]} center>
          <div className="pointer-label p-left">Start ({left})</div>
        </Html>
      </group>

      <group ref={rRef} position={[0, 1.5, 0]}>
        <mesh rotation={[Math.PI, 0, 0]}>
          <coneGeometry args={[0.2, 0.5, 16]} />
          <meshStandardMaterial color="#f97316" />
        </mesh>
        <Html position={[0, 0.8, 0]} center>
          <div className="pointer-label p-right">End ({right})</div>
        </Html>
      </group>
    </>
  );
}

// --- ARRAY NODE ---
function ArrayNode({ val, idx, total, state }) {
  const mesh = useRef();
  
  // Calculate Target X
  const gap = 1.6;
  const startX = -((total * gap) / 2) + (gap / 2);
  const targetX = startX + (idx * gap);

  // Check if this node is currently being swapped
  const isLeft = idx === state.left;
  const isRight = idx === state.right;
  const isSwapping = state.status === 'swapping' && (isLeft || isRight);
  const isDone = state.status === 'finished';

  // Colors
  let color = "#e5e7eb"; // Default
  if (isLeft) color = "#93c5fd"; // Light Blue
  if (isRight) color = "#fdba74"; // Light Orange
  if (isSwapping) color = "#fbbf24"; // Gold during swap
  if (isDone) color = "#dcfce7"; // Green when done

  useFrame((_, delta) => {
    if (!mesh.current) return;

    // Smooth X movement (Swapping Animation)
    mesh.current.position.x = THREE.MathUtils.lerp(mesh.current.position.x, targetX, delta * 6);
    
    // Y Movement (Lift up when swapping)
    let targetY = 0;
    if (isSwapping) targetY = 1.5; // Jump up
    mesh.current.position.y = THREE.MathUtils.lerp(mesh.current.position.y, targetY, delta * 6);
    
    // Rotation (Spin slightly when finished)
    if (isDone) {
      mesh.current.rotation.y += delta;
    } else {
      mesh.current.rotation.y = THREE.MathUtils.lerp(mesh.current.rotation.y, 0, delta * 5);
    }
  });

  return (
    <group ref={mesh} position={[targetX, 0, 0]}>
      <RoundedBox args={[1.2, 1.2, 0.2]} radius={0.15} smoothness={4}>
        <meshStandardMaterial color={color} />
      </RoundedBox>
      <RoundedBox args={[1.25, 1.25, 0.18]} radius={0.15}>
        <meshBasicMaterial color="#1f2937" side={THREE.BackSide} />
      </RoundedBox>
      <Text position={[0, 0, 0.12]} fontSize={0.5} color="#1f2937" fontWeight={800}>{val}</Text>
      <Text position={[0, -0.9, 0]} fontSize={0.25} color="#9ca3af">{idx}</Text>
    </group>
  );
}

// ==========================================
// 3. MAIN LOGIC
// ==========================================
export default function ReverseArray({ onBack }) {
  const [array, setArray] = useState([10, 25, 8, 99, 4, 15]);
  const [pointers, setPointers] = useState({ left: 0, right: 5 });
  const [status, setStatus] = useState('idle'); // idle, checking, swapping, finished
  const [log, setLog] = useState("Ready to reverse.");

  const sleep = (ms) => new Promise(r => setTimeout(r, ms));

  const runReverse = async () => {
    if (status !== 'idle') return;
    
    setStatus('running');
    let arr = [...array];
    let start = 0;
    let end = arr.length - 1;

    setLog("Initializing Pointers: Start=0, End=" + end);
    setPointers({ left: start, right: end });
    await sleep(1000);

    while (start < end) {
      // 1. Highlight
      setLog(`Checking: Is Start (${start}) < End (${end})? Yes.`);
      setStatus('checking');
      await sleep(1000);

      // 2. Trigger Swap Visuals
      setLog(`Swapping elements at index ${start} and ${end}...`);
      setStatus('swapping'); 
      await sleep(500); // Wait for lift up

      // 3. Perform Data Swap
      let temp = arr[start];
      arr[start] = arr[end];
      arr[end] = temp;
      setArray([...arr]); // Update state to trigger position lerp
      
      await sleep(1000); // Wait for move animation

      // 4. Move Pointers
      start++;
      end--;
      setPointers({ left: start, right: end });
      setLog("Moving pointers inward.");
      setStatus('running'); // Reset colors
      await sleep(1000);
    }

    setLog("Start >= End. Loop Terminated.");
    setStatus('finished');
  };

  const reset = () => {
    setArray([10, 25, 8, 99, 4, 15]);
    setPointers({ left: 0, right: 5 });
    setStatus('idle');
    setLog("Reset complete.");
  };

  return (
    <>
      <style>{styles}</style>
      <div className="rev-container">
        
        {/* LEFT: 3D WORLD */}
        <div className="viz-panel">
          <div className="title-label">Two Pointer Approach</div>
          
          <Canvas camera={{ position: [0, 1, 10], fov: 45 }}>
            <color attach="background" args={['#ffffff']} />
            <ambientLight intensity={1} />
            <directionalLight position={[5, 10, 5]} intensity={1.5} />
            <Environment preset="city" />

            <Center>
              <group>
                {/* Pointers Layer */}
                <Pointers left={pointers.left} right={pointers.right} size={array.length} />
                
                {/* Array Layer */}
                {array.map((val, i) => (
                  <ArrayNode 
                    key={`${i}-${val}`} // Unique key ensures distinct objects for lerping
                    val={val} 
                    idx={i} 
                    total={array.length} 
                    state={{ left: pointers.left, right: pointers.right, status }} 
                  />
                ))}
              </group>
            </Center>
            
            <ContactShadows position={[0, -1.5, 0]} opacity={0.4} scale={30} blur={2.5} color="#15803d" />
          </Canvas>
        </div>

        {/* RIGHT: CONTROLS */}
        <div className="ctrl-panel">
          <div className="header-row">
            <button className="back-btn" onClick={onBack}>← Back to Menu</button>
            <h2>Reverse Array</h2>
          </div>

          <div className="console">
             {log}<span className="cursor">_</span>
          </div>

          <div style={{display:'flex', gap:'1rem', marginBottom:'2rem'}}>
             <button className="btn" onClick={runReverse} disabled={status !== 'idle'}>
                {status === 'idle' ? 'Start Animation' : 'Running...'}
             </button>
             <button className="btn btn-reset" onClick={reset} disabled={status !== 'finished' && status !== 'idle'}>
                Reset
             </button>
          </div>

          <div style={{padding:'1rem', background:'#f3f4f6', borderRadius:'8px', fontSize:'0.8rem', color:'#374151'}}>
            <strong>C++ Two Pointer Logic:</strong>
            <pre style={{margin:'0.5rem 0', fontFamily:'monospace'}}>
{`void reverse(vector<int>& v) {
  int start = 0;
  int end = v.size() - 1;
  
  while (start < end) {
    swap(v[start], v[end]);
    start++;
    end--;
  }
}`}
            </pre>
          </div>
        </div>

      </div>
    </>
  );
}