import React, { useState, useRef, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Center, Text, RoundedBox, Environment, ContactShadows, Html } from '@react-three/drei';
import * as THREE from 'three';

// ==========================================
// 1. STYLES
// ==========================================
const styles = `
  .ll-container { width: 100%; height: 100vh; display: flex; background: #fff; font-family: 'Inter', sans-serif; overflow: hidden; }
  
  /* LEFT: 3D VIEW PANEL */
  .visual-panel { 
    flex: 2; position: relative; 
    background: radial-gradient(circle at center, #f8fafc 0%, #e2e8f0 100%); 
    border-right: 1px solid #cbd5e1;
  }
  
  .viz-title {
    position: absolute; top: 30px; left: 30px;
    font-size: 1.5rem; font-weight: 800; color: #1e293b;
    background: rgba(255,255,255,0.6); padding: 8px 16px;
    border-radius: 12px; backdrop-filter: blur(4px);
  }

  /* RIGHT: CONTROL PANEL */
  .control-panel { 
    flex: 0.8; background: #fff; padding: 2rem; display: flex; flex-direction: column; 
    box-shadow: -10px 0 30px rgba(0,0,0,0.05); z-index: 10; 
    overflow-y: auto; /* Scroll if height is too small */
  }

  .header { margin-bottom: 1.5rem; }
  .back-btn { background: none; border: none; color: #64748b; font-weight: 600; cursor: pointer; display: flex; align-items: center; gap: 6px; font-size: 0.9rem; }
  .back-btn:hover { color: #0f172a; }
  h2 { font-size: 1.8rem; font-weight: 800; color: #1e293b; margin: 0.5rem 0 0 0; }

  /* POINTER LEGEND */
  .legend { display: flex; gap: 0.8rem; margin-bottom: 1.5rem; padding: 1rem; background: #f1f5f9; border-radius: 12px; }
  .badge { padding: 4px 10px; border-radius: 6px; font-size: 0.7rem; font-weight: 700; color: white; text-transform: uppercase; letter-spacing: 0.5px; }
  .bg-yellow { background: #f59e0b; }
  .bg-blue { background: #3b82f6; }
  .bg-purple { background: #a855f7; }

  /* CONSOLE LOG */
  .console { 
    background: #1e293b; border-radius: 12px; padding: 1.2rem; color: #4ade80; 
    font-family: 'JetBrains Mono', monospace; font-size: 0.85rem; margin-bottom: 1.5rem; 
    min-height: 60px; display: flex; align-items: center; border: 1px solid #334155;
  }

  /* BUTTONS */
  .btn-row { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 1.5rem; }
  
  .btn { 
    width: 100%; padding: 0.8rem; border-radius: 10px; border: none; 
    background: #4f46e5; color: white; font-weight: 700; cursor: pointer; 
    font-size: 0.95rem; transition: all 0.2s; box-shadow: 0 4px 6px -1px rgba(79, 70, 229, 0.2);
  }
  .btn:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 10px 15px -3px rgba(79, 70, 229, 0.3); }
  .btn:disabled { background: #cbd5e1; color: #94a3b8; cursor: not-allowed; box-shadow: none; transform: none; }
  
  .btn-pause { background: #f59e0b; } .btn-pause:hover:not(:disabled) { background: #d97706; }
  .btn-reset { background: #fff; color: #475569; border: 2px solid #e2e8f0; box-shadow: none; } 
  .btn-reset:hover { background: #f8fafc; border-color: #cbd5e1; }

  /* CODE BOX (Now in Right Panel) */
  .code-box {
    margin-top: auto; /* Pushes to bottom of remaining space */
    background: #0f172a; 
    padding: 1.2rem; border-radius: 12px;
    font-family: 'JetBrains Mono', monospace; font-size: 0.8rem; color: #94a3b8;
    border: 1px solid #334155;
    box-shadow: inset 0 2px 4px rgba(0,0,0,0.3);
  }
  .code-title {
    display: block; font-size: 0.7rem; font-weight: 700; color: #64748b; 
    text-transform: uppercase; margin-bottom: 0.5rem; border-bottom: 1px solid #1e293b; padding-bottom: 4px;
  }
  .code-line { display: block; padding: 2px 6px; border-radius: 4px; margin-bottom: 2px; }
  .code-line.active { 
    background: #10b981; /* Green Highlight */
    color: #fff; font-weight: 700; 
  }
`;

// ==========================================
// 2. 3D COMPONENTS
// ==========================================

function ListNode({ val, idx, pos, state }) {
  const mesh = useRef();
  
  // Dynamic Styling based on Pointers
  let color = "#cbd5e1"; // Inactive Gray
  let scale = 1;
  let label = null;

  if (state.curr === idx) { color = "#3b82f6"; scale = 1.15; label = "curr"; }
  else if (state.prev === idx) { color = "#f59e0b"; scale = 1.15; label = "prev"; }
  else if (state.next === idx) { color = "#a855f7"; scale = 1.15; label = "next"; }

  useFrame((_, delta) => {
    if(!mesh.current) return;
    mesh.current.position.lerp(pos, delta * 6);
    mesh.current.scale.lerp(new THREE.Vector3(scale, scale, scale), delta * 8);
  });

  return (
    <group ref={mesh} position={pos}>
      <RoundedBox args={[1.2, 1, 0.2]} radius={0.15}>
        <meshStandardMaterial color={color} />
      </RoundedBox>
      <RoundedBox args={[1.25, 1.05, 0.18]} radius={0.15}>
        <meshBasicMaterial color="#1e293b" side={THREE.BackSide} />
      </RoundedBox>
      <Text position={[0, 0, 0.12]} fontSize={0.5} color={color === "#cbd5e1" ? "#1e293b" : "white"} fontWeight={800}>{val}</Text>
      
      {label && (
        <Html position={[0, 1.4, 0]} center>
          <div style={{
            background: color, color: 'white', padding: '4px 8px', 
            borderRadius: '6px', fontSize: '0.7rem', fontWeight: 'bold', 
            textTransform: 'uppercase', boxShadow: '0 4px 10px rgba(0,0,0,0.2)',
            whiteSpace: 'nowrap'
          }}>
            {label}
          </div>
        </Html>
      )}
    </group>
  );
}

function Arrow({ start, end, visible, reversed }) {
  const group = useRef();
  
  useFrame(() => {
    if (!group.current || !visible) return;
    const dir = new THREE.Vector3().subVectors(end, start).normalize();
    const dist = start.distanceTo(end);
    const len = Math.max(0, dist - 1.3); 

    const mid = start.clone().add(dir.clone().multiplyScalar(dist / 2));
    group.current.position.copy(mid);
    group.current.lookAt(end);
    group.current.scale.z = len;
  });

  if (!visible) return null;

  return (
    <group ref={group}>
      <mesh rotation={[Math.PI/2, 0, 0]}>
        <cylinderGeometry args={[0.04, 0.04, 1, 8]} />
        <meshStandardMaterial color={reversed ? "#ef4444" : "#94a3b8"} />
      </mesh>
      <mesh position={[0, 0, 0.5]} rotation={[Math.PI/2, 0, 0]}>
        <coneGeometry args={[0.12, 0.3, 12]} />
        <meshStandardMaterial color={reversed ? "#ef4444" : "#94a3b8"} />
      </mesh>
    </group>
  );
}

// ==========================================
// 3. MAIN LOGIC
// ==========================================
export default function ReverseList({ onBack }) {
  const [nodes, setNodes] = useState([
    { id: 0, val: 10, next: 1 },
    { id: 1, val: 20, next: 2 },
    { id: 2, val: 30, next: 3 },
    { id: 3, val: 40, next: 4 },
    { id: 4, val: 50, next: null },
  ]);

  const [pointers, setPointers] = useState({ prev: null, curr: null, next: null });
  const [log, setLog] = useState("Ready to reverse.");
  const [activeLine, setActiveLine] = useState(0); 
  
  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const pausedRef = useRef(false); 

  useEffect(() => { pausedRef.current = isPaused; }, [isPaused]);

  const sleep = (ms) => new Promise(r => setTimeout(r, ms));

  const checkPause = async () => {
    while (pausedRef.current) await sleep(100);
  };

  const runReverse = async () => {
    if (isRunning) return;
    setIsRunning(true);
    setIsPaused(false);

    let prevId = null; 
    let currId = 0; 
    let nextId = null;

    setPointers({ prev: -1, curr: 0, next: -1 }); 
    setLog("Initialize: prev = NULL, curr = HEAD");
    setActiveLine(1); 
    await sleep(800); await checkPause();

    while (currId !== null) {
      const currNode = nodes[currId];
      
      // Step 1: Save Next
      setActiveLine(2);
      nextId = currNode.next;
      setPointers({ prev: prevId === null ? -1 : prevId, curr: currId, next: nextId === null ? -1 : nextId });
      setLog(`Save Next: next = curr.next (${nextId !== null ? nodes[nextId].val : "NULL"})`);
      await sleep(1500); await checkPause();

      // Step 2: Reverse Link
      setActiveLine(3);
      const updatedNodes = [...nodes];
      updatedNodes[currId].next = prevId; 
      setNodes(updatedNodes); 
      setLog(`Reverse Link: ${nodes[currId].val} -> ${prevId !== null ? nodes[prevId].val : "NULL"}`);
      await sleep(1500); await checkPause();

      // Step 3: Move Prev
      setActiveLine(4);
      prevId = currId;
      setPointers({ prev: prevId, curr: currId, next: nextId === null ? -1 : nextId });
      setLog(`Move Prev: prev = curr (${nodes[prevId].val})`);
      await sleep(1500); await checkPause();

      // Step 4: Move Curr
      setActiveLine(5);
      currId = nextId;
      setPointers({ prev: prevId, curr: currId === null ? -1 : currId, next: nextId === null ? -1 : nextId });
      setLog(`Move Curr: curr = next (${currId !== null ? nodes[currId].val : "NULL"})`);
      await sleep(1500); await checkPause();
      
      setActiveLine(1); // loop
    }

    setActiveLine(6); 
    setLog("Finished. Return prev as new Head.");
    setIsRunning(false);
  };

  const reset = () => {
    setNodes([
      { id: 0, val: 10, next: 1 },
      { id: 1, val: 20, next: 2 },
      { id: 2, val: 30, next: 3 },
      { id: 3, val: 40, next: 4 },
      { id: 4, val: 50, next: null },
    ]);
    setPointers({ prev: null, curr: null, next: null });
    setLog("Reset.");
    setIsRunning(false);
    setIsPaused(false);
    setActiveLine(0);
  };

  const getPos = (idx) => new THREE.Vector3((idx - 2) * 2.5, 0, 0);

  return (
    <>
      <style>{styles}</style>
      <div className="ll-container">
        
        {/* LEFT: 3D VISUALIZATION */}
        <div className="visual-panel">
          <div className="viz-title">Iterative Reverse</div>

          <Canvas camera={{ position: [0, 1, 9], fov: 50 }}>
            <ambientLight intensity={1} />
            <spotLight position={[5, 10, 5]} intensity={1} />
            <Environment preset="city" />
            <Center>
              <group>
                {nodes.map((node, i) => (
                  <ListNode key={node.id} val={node.val} idx={i} pos={getPos(i)} state={pointers} />
                ))}
                {nodes.map((node, i) => {
                  if (node.next === null) return null; 
                  const startPos = getPos(i);
                  const endPos = getPos(node.next);
                  const isReversed = node.next < i; 
                  return <Arrow key={`link-${i}`} start={startPos} end={endPos} visible={true} reversed={isReversed} />;
                })}
              </group>
            </Center>
            <ContactShadows position={[0, -2, 0]} opacity={0.4} scale={30} blur={2} />
          </Canvas>
        </div>

        {/* RIGHT: CONTROLS & CODE */}
        <div className="control-panel">
          <div className="header">
            <button className="back-btn" onClick={onBack}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
              Back to Menu
            </button>
            <h2>Controls</h2>
          </div>

          <div className="legend">
             <div className="badge bg-yellow">prev</div>
             <div className="badge bg-blue">curr</div>
             <div className="badge bg-purple">next</div>
          </div>

          <div className="console">
             {log}
          </div>

          <div className="btn-row">
            {!isRunning ? (
               <button className="btn" onClick={runReverse}>▶ Start</button>
            ) : (
               <button className="btn btn-pause" onClick={() => setIsPaused(!isPaused)}>
                 {isPaused ? "▶ Resume" : "⏸ Pause"}
               </button>
            )}
            <button className="btn btn-reset" onClick={reset}>Reset</button>
          </div>

          {/* CODE BOX (Now at the bottom right) */}
          <div className="code-box">
            <span className="code-title">C++ Algorithm</span>
            <span className={`code-line ${activeLine === 1 ? 'active' : ''}`}>while (curr != NULL) &#123;</span>
            <span className={`code-line ${activeLine === 2 ? 'active' : ''}`}>&nbsp;&nbsp;next = curr-&gt;next;</span>
            <span className={`code-line ${activeLine === 3 ? 'active' : ''}`}>&nbsp;&nbsp;curr-&gt;next = prev;</span>
            <span className={`code-line ${activeLine === 4 ? 'active' : ''}`}>&nbsp;&nbsp;prev = curr;</span>
            <span className={`code-line ${activeLine === 5 ? 'active' : ''}`}>&nbsp;&nbsp;curr = next;</span>
            <span className={`code-line ${activeLine === 1 ? 'active' : ''}`}>&#125;</span>
            <span className={`code-line ${activeLine === 6 ? 'active' : ''}`}>return prev;</span>
          </div>

        </div>

      </div>
    </>
  );
}