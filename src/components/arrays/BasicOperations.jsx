import React, { useState, useEffect, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { ContactShadows, Environment, Text, RoundedBox, Html, Center } from '@react-three/drei';
import * as THREE from 'three';
import './ArrayStyles.css'; // Uses the shared styles

// --- CONSTANTS ---
const DEFAULT_ARRAY = [15, 24, 8, 42, 5, 19];
const BOX_SIZE = 1;
const GAP = 1.2;
const COLORS = {
  idle: "#dcfce7",       // Light Green
  active: "#4ade80",     // Bright Green (Scanning)
  found: "#fbbf24",      // Gold (Found)
  outline: "#15803d",    // Dark Green
  scanner: "#16a34a"     // Scanner Wireframe
};

// --- COMPONENT-SPECIFIC STYLES ---
const localStyles = `
  .viz-label {
    position: absolute; top: 2rem; left: 2rem;
    font-size: 1.5rem; font-weight: 800; color: #15803d;
    background: rgba(255, 255, 255, 0.8); padding: 0.5rem 1rem;
    border-radius: 8px; backdrop-filter: blur(5px); pointer-events: none;
  }
  .scanner-label {
    background: #fbbf24; color: #78350f; padding: 4px 8px;
    border-radius: 4px; font-family: 'JetBrains Mono', monospace;
    font-weight: 700; font-size: 0.8rem; box-shadow: 0 4px 6px rgba(0,0,0,0.1);
  }
  .console-screen {
    background: #111827; border-radius: 12px; overflow: hidden;
    margin-bottom: 2rem; font-family: 'JetBrains Mono', monospace;
    box-shadow: 0 10px 15px -3px rgba(0,0,0,0.2);
  }
  .console-header {
    background: #1f2937; padding: 0.5rem 1rem; display: flex; align-items: center; gap: 6px;
  }
  .dot { width: 10px; height: 10px; border-radius: 50%; }
  .red { background: #ef4444; } .yellow { background: #f59e0b; } .green { background: #10b981; }
  .console-title { color: #9ca3af; font-size: 0.75rem; margin-left: auto; }
  .console-body {
    padding: 1.5rem; color: #4ade80; font-size: 0.9rem; min-height: 80px;
  }
  .prompt { color: #6b7280; margin-right: 8px; }
  .cursor { animation: blink 1s infinite; }
  @keyframes blink { 50% { opacity: 0; } }
  
  .ops-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
  .op-card { background: #f9fafb; border: 1px solid #e5e7eb; padding: 1rem; border-radius: 12px; }
  .op-card.full-width { grid-column: span 2; }
  .op-card h3 { margin: 0 0 0.5rem 0; font-size: 1rem; color: #374151; }
  .op-card p { font-size: 0.8rem; color: #6b7280; margin-bottom: 1rem; }
  
  .input-row { display: flex; gap: 1rem; margin-bottom: 1rem; }
  .input-row label { font-size: 0.8rem; color: #4b5563; display: flex; flex-direction: column; gap: 4px; width: 100%; }
  .input-row input { padding: 0.5rem; border: 1px solid #d1d5db; border-radius: 6px; width: 100%; box-sizing: border-box; }
  .btn-row { display: flex; gap: 1rem; }
`;

// --- 3D COMPONENT: The Array Node ---
function ArrayNode({ value, index, total, state, targetIndex }) {
  const mesh = useRef();
  
  let xOffset = 0;
  if (state.mode === 'inserting' && index >= targetIndex && state.phase === 'shifting') {
    xOffset = GAP; 
  }
  
  const startX = -((total * GAP) / 2) + (GAP/2); 
  const targetPos = new THREE.Vector3(startX + (index * GAP) + xOffset, 0, 0);

  const isNewNode = state.mode === 'inserting' && index === targetIndex && state.phase === 'dropping';
  const isDeleting = state.mode === 'deleting' && index === targetIndex && state.phase === 'popping';

  useFrame((_, delta) => {
    if (isNewNode) {
      mesh.current.position.lerp(targetPos, delta * 5); 
    } else if (isDeleting) {
      mesh.current.position.lerp(new THREE.Vector3(targetPos.x, 2, 0), delta * 5);
      mesh.current.scale.lerp(new THREE.Vector3(0, 0, 0), delta * 5);
    } else {
      mesh.current.position.lerp(targetPos, delta * 8);
      mesh.current.scale.lerp(new THREE.Vector3(1, 1, 1), delta * 10);
    }
  });

  const isActive = state.activeIndex === index;
  const isFound = state.mode === 'found' && index === state.activeIndex;
  const bgColor = isFound ? COLORS.found : (isActive ? COLORS.active : COLORS.idle);

  useEffect(() => {
    if (isNewNode && mesh.current) {
      mesh.current.position.set(targetPos.x, 5, 0);
    }
  }, [isNewNode]);

  return (
    <group ref={mesh}>
      <RoundedBox args={[BOX_SIZE, BOX_SIZE, 0.2]} radius={0.1} smoothness={4}>
        <meshStandardMaterial color={bgColor} />
      </RoundedBox>
      <RoundedBox args={[BOX_SIZE + 0.05, BOX_SIZE + 0.05, 0.18]} radius={0.1}>
        <meshBasicMaterial color={COLORS.outline} side={THREE.BackSide} />
      </RoundedBox>
      <Text position={[0, 0, 0.12]} fontSize={0.4} color={COLORS.outline} fontWeight={800}>{value}</Text>
      <Text position={[0, -0.8, 0]} fontSize={0.2} color="#9ca3af">{index}</Text>
    </group>
  );
}

// --- 3D COMPONENT: The Scanner ---
function Scanner({ state, total }) {
  const mesh = useRef();
  
  useFrame((_, delta) => {
    if (state.activeIndex === null || state.activeIndex >= total) {
      mesh.current.visible = false;
      return;
    }
    mesh.current.visible = true;

    let xOffset = 0;
    if (state.mode === 'inserting' && state.activeIndex >= state.targetIndex && state.phase === 'shifting') {
       xOffset = GAP;
    }

    const startX = -((total * GAP) / 2) + (GAP/2);
    const targetX = startX + (state.activeIndex * GAP) + xOffset;
    
    mesh.current.position.lerp(new THREE.Vector3(targetX, 0, 0), delta * 10);
    mesh.current.scale.setScalar(1.1 + Math.sin(Date.now() / 200) * 0.05);
  });

  return (
    <group ref={mesh}>
      <mesh>
        <boxGeometry args={[BOX_SIZE + 0.2, BOX_SIZE + 0.2, 0.4]} />
        <meshBasicMaterial color={COLORS.found} wireframe />
      </mesh>
      <Html position={[0, 0.8, 0]} center>
        <div className="scanner-label">i = {state.activeIndex}</div>
      </Html>
    </group>
  );
}

// --- MAIN COMPONENT ---
export default function BasicOperations({ onBack }) {
  const [array, setArray] = useState(DEFAULT_ARRAY);
  const [state, setState] = useState({ mode: 'idle', activeIndex: null, phase: null, targetIndex: null });
  const [log, setLog] = useState("Ready to visualize.");
  
  const [insertVal, setInsertVal] = useState(99);
  const [insertIdx, setInsertIdx] = useState(2);
  const [searchVal, setSearchVal] = useState(42);

  // Operations
  const runTraversal = async () => {
    if (state.mode !== 'idle') return;
    setLog("Starting Traversal...");
    for (let i = 0; i < array.length; i++) {
      setState({ mode: 'traversing', activeIndex: i });
      setLog(`Visiting Index ${i}: Value ${array[i]}`);
      await new Promise(r => setTimeout(r, 800));
    }
    setState({ mode: 'idle', activeIndex: null });
    setLog("Traversal Complete.");
  };

  const runLinearSearch = async () => {
    if (state.mode !== 'idle') return;
    setLog(`Searching for value: ${searchVal}`);
    for (let i = 0; i < array.length; i++) {
      setState({ mode: 'searching', activeIndex: i });
      await new Promise(r => setTimeout(r, 800));
      if (array[i] === parseInt(searchVal)) {
        setLog(`Found ${searchVal} at Index ${i}!`);
        setState({ mode: 'found', activeIndex: i });
        await new Promise(r => setTimeout(r, 2000));
        setState({ mode: 'idle', activeIndex: null });
        return;
      }
    }
    setLog(`${searchVal} not found.`);
    setState({ mode: 'idle', activeIndex: null });
  };

  const runInsertion = async () => {
    if (state.mode !== 'idle') return;
    const idx = parseInt(insertIdx);
    if (idx < 0 || idx > array.length) { setLog("Invalid Index"); return; }
    
    setLog(`Inserting ${insertVal} at Index ${idx}...`);
    setLog("Shifting elements to the right...");
    setState({ mode: 'inserting', phase: 'shifting', targetIndex: idx, activeIndex: null });
    await new Promise(r => setTimeout(r, 1000));

    setLog("Inserting new element...");
    const newArr = [...array];
    newArr.splice(idx, 0, parseInt(insertVal));
    setArray(newArr);
    setState({ mode: 'inserting', phase: 'dropping', targetIndex: idx, activeIndex: idx });
    await new Promise(r => setTimeout(r, 1000));

    setState({ mode: 'idle', activeIndex: null });
    setLog("Insertion Complete.");
  };

  const runDeletion = async () => {
    if (state.mode !== 'idle') return;
    const idx = parseInt(insertIdx);
    if (idx < 0 || idx >= array.length) { setLog("Invalid Index"); return; }

    setLog(`Deleting element at Index ${idx}...`);
    setState({ mode: 'deleting', phase: 'popping', targetIndex: idx, activeIndex: idx });
    await new Promise(r => setTimeout(r, 1000));

    const newArr = array.filter((_, i) => i !== idx);
    setArray(newArr);
    setState({ mode: 'idle', activeIndex: null });
    setLog("Deletion Complete. Shifting gap closed.");
  };

  return (
    <>
      <style>{localStyles}</style>
      {/* Reusing 'array-container', 'viz-panel', 'ctrl-panel' from ArrayStyles.css */}
      <div className="array-container">
        
        {/* LEFT: 3D VISUALIZER */}
        <div className="viz-panel">
          <Canvas camera={{ position: [0, 2, 8], fov: 45 }}>
            <color attach="background" args={['#ffffff']} />
            <ambientLight intensity={1} />
            <directionalLight position={[5, 10, 5]} intensity={1.5} />
            <Environment preset="city" />

            <Center>
              <group>
                 {array.map((val, i) => (
                   <ArrayNode 
                     key={`${i}-${val}`} 
                     value={val} index={i} total={array.length} state={state} targetIndex={state.targetIndex}
                   />
                 ))}
                 <Scanner state={state} total={array.length} />
              </group>
            </Center>
            <ContactShadows position={[0, -1, 0]} opacity={0.4} scale={20} blur={2} color="#15803d" />
          </Canvas>
          <div className="viz-label">Array Operations</div>
        </div>

        {/* RIGHT: CONTROLS */}
        <div className="ctrl-panel">
          <div className="header-row">
            <button onClick={onBack} className="back-btn">← Back to Menu</button>
            <h2>Basic Ops</h2>
          </div>

          <div className="console-screen">
            <div className="console-header">
              <span className="dot red"></span><span className="dot yellow"></span><span className="dot green"></span>
              <span className="console-title">status.log</span>
            </div>
            <div className="console-body">
              <span className="prompt">&gt;</span> {log}<span className="cursor">_</span>
            </div>
          </div>

          <div className="ops-grid">
            <div className="op-card">
              <h3>Traversal</h3>
              <p>Visit every element O(N)</p>
              <button className="btn" onClick={runTraversal} disabled={state.mode !== 'idle'}>Run Loop</button>
            </div>

            <div className="op-card">
              <h3>Linear Search</h3>
              <p>Find value O(N)</p>
              <div style={{display:'flex', gap:'5px'}}>
                 <input type="number" value={searchVal} onChange={(e) => setSearchVal(e.target.value)} style={{width:'100%', padding:'0.5rem', borderRadius:'6px', border:'1px solid #ddd'}}/>
                 <button className="btn" style={{background:'#3b82f6', width:'auto'}} onClick={runLinearSearch} disabled={state.mode !== 'idle'}>Find</button>
              </div>
            </div>

            <div className="op-card full-width">
              <h3>Modification</h3>
              <div className="input-row">
                <label>Value: <input type="number" value={insertVal} onChange={(e)=>setInsertVal(e.target.value)} /></label>
                <label>Index: <input type="number" value={insertIdx} onChange={(e)=>setInsertIdx(e.target.value)} /></label>
              </div>
              <div className="btn-row">
                <button className="btn" onClick={runInsertion} disabled={state.mode !== 'idle'}>Insert</button>
                <button className="btn" style={{background:'#ef4444'}} onClick={runDeletion} disabled={state.mode !== 'idle'}>Delete</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}