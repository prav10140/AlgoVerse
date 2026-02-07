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
    overflow-y: auto; 
  }

  .header { margin-bottom: 1.5rem; }
  .back-btn { background: none; border: none; color: #64748b; font-weight: 600; cursor: pointer; display: flex; align-items: center; gap: 6px; font-size: 0.9rem; }
  .back-btn:hover { color: #0f172a; }
  h2 { font-size: 1.8rem; font-weight: 800; color: #1e293b; margin: 0.5rem 0 0 0; }

  /* POINTER LEGEND */
  .legend { display: flex; gap: 0.8rem; margin-bottom: 1.5rem; padding: 1rem; background: #f1f5f9; border-radius: 12px; }
  .badge { padding: 4px 10px; border-radius: 6px; font-size: 0.7rem; font-weight: 700; color: white; text-transform: uppercase; letter-spacing: 0.5px; }
  .bg-yellow { background: #f59e0b; }
  .bg-purple { background: #a855f7; }
  .bg-red { background: #ef4444; }

  /* CONSOLE */
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
  .btn:disabled { background: #cbd5e1; color: #94a3b8; cursor: not-allowed; transform: none; box-shadow: none; }
  
  .btn-pause { background: #f59e0b; } .btn-pause:hover:not(:disabled) { background: #d97706; }
  .btn-reset { background: #fff; color: #475569; border: 2px solid #e2e8f0; box-shadow: none; } 
  .btn-reset:hover { background: #f8fafc; border-color: #cbd5e1; }

  /* CODE BOX */
  .code-box {
    margin-top: auto; background: #0f172a; padding: 1.2rem; border-radius: 12px;
    font-family: 'JetBrains Mono', monospace; font-size: 0.8rem; color: #94a3b8;
    border: 1px solid #334155; box-shadow: inset 0 2px 4px rgba(0,0,0,0.3);
  }
  .code-title { display: block; font-size: 0.7rem; font-weight: 700; color: #64748b; text-transform: uppercase; margin-bottom: 0.5rem; border-bottom: 1px solid #1e293b; padding-bottom: 4px; }
  .code-line { display: block; padding: 2px 6px; border-radius: 4px; margin-bottom: 2px; }
  .code-line.active { background: #10b981; color: #fff; font-weight: 700; }
`;

// ==========================================
// 2. 3D COMPONENTS
// ==========================================

function ListNode({ val, idx, pos, state }) {
  const mesh = useRef();
  
  let color = "#cbd5e1"; // Inactive
  let scale = 1;
  let label = null;

  const isSlow = state.slow === idx;
  const isFast = state.fast === idx;

  if (isSlow && isFast) { 
    color = "#ef4444"; scale = 1.25; label = "CYCLE!";
  } else if (isSlow) { 
    color = "#f59e0b"; scale = 1.1; label = "slow"; 
  } else if (isFast) { 
    color = "#a855f7"; scale = 1.1; label = "fast"; 
  }

  useFrame((_, delta) => {
    if(!mesh.current) return;
    mesh.current.position.lerp(pos, delta * 6);
    mesh.current.scale.lerp(new THREE.Vector3(scale, scale, scale), delta * 8);
  });

  return (
    <group ref={mesh} position={pos}>
      {/* Slightly smaller node size: 1.0 x 0.9 */}
      <RoundedBox args={[1.0, 0.9, 0.2]} radius={0.15}>
        <meshStandardMaterial color={color} />
      </RoundedBox>
      <RoundedBox args={[1.05, 0.95, 0.18]} radius={0.15}>
        <meshBasicMaterial color="#1e293b" side={THREE.BackSide} />
      </RoundedBox>
      <Text position={[0, 0, 0.12]} fontSize={0.45} color={color === "#cbd5e1" ? "#1e293b" : "white"} fontWeight={800}>{val}</Text>
      
      {label && (
        <Html position={[0, 1.2, 0]} center>
          <div style={{
            background: color, color: 'white', padding: '3px 6px', 
            borderRadius: '6px', fontSize: '0.6rem', fontWeight: 'bold', 
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

function Arrow({ start, end, visible }) {
  const group = useRef();
  
  useFrame(() => {
    if (!group.current || !visible) return;
    const dir = new THREE.Vector3().subVectors(end, start).normalize();
    const dist = start.distanceTo(end);
    const len = Math.max(0, dist - 1.1); // Adjusted gap for smaller nodes

    const mid = start.clone().add(dir.clone().multiplyScalar(dist / 2));
    group.current.position.copy(mid);
    group.current.lookAt(end);
    group.current.scale.z = len;
  });

  if (!visible) return null;

  return (
    <group ref={group}>
      <mesh rotation={[Math.PI/2, 0, 0]}>
        <cylinderGeometry args={[0.03, 0.03, 1, 8]} />
        <meshStandardMaterial color="#94a3b8" />
      </mesh>
      <mesh position={[0, 0, 0.5]} rotation={[Math.PI/2, 0, 0]}>
        <coneGeometry args={[0.08, 0.25, 12]} />
        <meshStandardMaterial color="#94a3b8" />
      </mesh>
    </group>
  );
}

// ==========================================
// 3. MAIN LOGIC
// ==========================================
export default function DetectCycle({ onBack }) {
  // COMPACT LAYOUT COORDINATES
  // 0 -> 1 -> 2 -> 3 -> 4 -> 5 -> 2
  const nodes = [
    { id: 0, val: 10, next: 1, pos: new THREE.Vector3(-3.5, 0, 0) },
    { id: 1, val: 20, next: 2, pos: new THREE.Vector3(-1.5, 0, 0) },
    { id: 2, val: 30, next: 3, pos: new THREE.Vector3(0.5, 0, 0) },   // Loop Entry
    { id: 3, val: 40, next: 4, pos: new THREE.Vector3(2.5, 1.2, 0) }, // Top of Loop
    { id: 4, val: 50, next: 5, pos: new THREE.Vector3(4.5, 0, 0) },   // Far Right
    { id: 5, val: 60, next: 2, pos: new THREE.Vector3(2.5, -1.2, 0) },// Bottom of Loop
  ];

  const [pointers, setPointers] = useState({ slow: null, fast: null });
  const [log, setLog] = useState("Ready. 'Fast' moves 2x 'Slow'.");
  const [activeLine, setActiveLine] = useState(0); 
  
  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const pausedRef = useRef(false); 

  useEffect(() => { pausedRef.current = isPaused; }, [isPaused]);

  const sleep = (ms) => new Promise(r => setTimeout(r, ms));
  const checkPause = async () => { while (pausedRef.current) await sleep(100); };

  const runAlgorithm = async () => {
    if (isRunning) return;
    setIsRunning(true);
    setIsPaused(false);

    let slow = 0;
    let fast = 0;

    setPointers({ slow, fast });
    setLog("Initialize: slow = head, fast = head");
    setActiveLine(1);
    await sleep(1000); await checkPause();

    while (true) { 
      setActiveLine(2);
      if (nodes[fast].next === null || nodes[nodes[fast].next].next === null) {
        setLog("Fast reached NULL. No Cycle.");
        break;
      }
      await sleep(500); await checkPause();

      setActiveLine(3);
      slow = nodes[slow].next;       
      fast = nodes[nodes[fast].next].next; 
      
      setPointers({ slow, fast });
      setLog(`Move: Slow -> ${nodes[slow].val}, Fast -> ${nodes[fast].val}`);
      await sleep(1200); await checkPause();

      setActiveLine(4);
      if (slow === fast) {
        setLog(`Collision at Node ${nodes[slow].val}! Cycle Detected.`);
        setActiveLine(5);
        await sleep(1000);
        break; 
      }
    }

    setIsRunning(false);
  };

  const reset = () => {
    setPointers({ slow: null, fast: null });
    setLog("Reset.");
    setIsRunning(false);
    setIsPaused(false);
    setActiveLine(0);
  };

  return (
    <>
      <style>{styles}</style>
      <div className="ll-container">
        
        {/* LEFT: 3D PANEL */}
        <div className="visual-panel">
          <div className="viz-title">Floyd's Cycle Detection</div>

          {/* Adjusted Camera to fit compact layout */}
          <Canvas camera={{ position: [0.5, 0.5, 8.5], fov: 45 }}>
            <ambientLight intensity={1} />
            <spotLight position={[5, 10, 5]} intensity={1} />
            <Environment preset="city" />
            <Center>
              <group>
                {nodes.map((node, i) => (
                  <ListNode key={node.id} val={node.val} idx={i} pos={node.pos} state={pointers} />
                ))}

                {nodes.map((node, i) => {
                  if (node.next === null) return null;
                  const startPos = node.pos;
                  const endPos = nodes[node.next].pos; 
                  return <Arrow key={`link-${i}`} start={startPos} end={endPos} visible={true} />;
                })}
              </group>
            </Center>
            <ContactShadows position={[0, -2, 0]} opacity={0.4} scale={30} blur={2} />
          </Canvas>
        </div>

        {/* RIGHT: CONTROLS */}
        <div className="control-panel">
          <div className="header">
            <button className="back-btn" onClick={onBack}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
              Back to Menu
            </button>
            <h2>Controls</h2>
          </div>

          <div className="legend">
             <div className="badge bg-yellow">slow</div>
             <div className="badge bg-purple">fast</div>
             <div className="badge bg-red">collision</div>
          </div>

          <div className="console">
              {log}
          </div>

          <div className="btn-row">
            {!isRunning ? (
               <button className="btn" onClick={runAlgorithm}>▶ Start</button>
            ) : (
               <button className="btn btn-pause" onClick={() => setIsPaused(!isPaused)}>
                 {isPaused ? "▶ Resume" : "⏸ Pause"}
               </button>
            )}
            <button className="btn btn-reset" onClick={reset}>Reset</button>
          </div>

          <div className="code-box">
            <span className="code-title">Floyd's Algorithm</span>
            <span className={`code-line ${activeLine === 1 ? 'active' : ''}`}>slow = head; fast = head;</span>
            <span className={`code-line ${activeLine === 2 ? 'active' : ''}`}>while (fast && fast.next) &#123;</span>
            <span className={`code-line ${activeLine === 3 ? 'active' : ''}`}>&nbsp;&nbsp;slow = slow.next; fast = fast.next.next;</span>
            <span className={`code-line ${activeLine === 4 ? 'active' : ''}`}>&nbsp;&nbsp;if (slow == fast) &#123;</span>
            <span className={`code-line ${activeLine === 5 ? 'active' : ''}`}>&nbsp;&nbsp;&nbsp;&nbsp;return true; // Cycle found</span>
            <span className={`code-line ${activeLine === 4 ? 'active' : ''}`}>&nbsp;&nbsp;&#125;</span>
            <span className={`code-line ${activeLine === 2 ? 'active' : ''}`}>&#125;</span>
            <span className={`code-line ${activeLine === 6 ? 'active' : ''}`}>return false;</span>
          </div>

        </div>

      </div>
    </>
  );
}