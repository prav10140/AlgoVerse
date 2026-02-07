import React, { useState, useRef, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Center, Text, RoundedBox, Environment, ContactShadows, Html } from '@react-three/drei';
import * as THREE from 'three';

// ==========================================
// 1. STYLES
// ==========================================
const styles = `
  .ll-container { width: 100%; height: 100vh; display: flex; background: #fff; font-family: 'Inter', sans-serif; overflow: hidden; }
  
  /* LEFT: 3D PANEL */
  .visual-panel { 
    flex: 1.8; position: relative; 
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
    flex: 1.2; background: #fff; padding: 2rem; display: flex; flex-direction: column; 
    box-shadow: -10px 0 30px rgba(0,0,0,0.05); z-index: 10; 
    overflow-y: auto; 
  }

  .header { margin-bottom: 1rem; }
  .back-btn { background: none; border: none; color: #64748b; font-weight: 600; cursor: pointer; display: flex; align-items: center; gap: 6px; font-size: 0.9rem; }
  .back-btn:hover { color: #0f172a; }
  h2 { font-size: 1.8rem; font-weight: 800; color: #1e293b; margin: 0.5rem 0 0 0; }

  /* POINTER LEGEND */
  .legend { display: flex; gap: 0.8rem; margin-bottom: 1.5rem; padding: 1rem; background: #f1f5f9; border-radius: 12px; }
  .badge { padding: 4px 10px; border-radius: 6px; font-size: 0.7rem; font-weight: 700; color: white; text-transform: uppercase; letter-spacing: 0.5px; }
  .bg-blue { background: #3b82f6; }
  .bg-purple { background: #a855f7; }
  .bg-green { background: #10b981; }

  /* CONSOLE */
  .console { 
    background: #1e293b; border-radius: 12px; padding: 1rem; color: #4ade80; 
    font-family: 'JetBrains Mono', monospace; font-size: 0.85rem; margin-bottom: 1.5rem; 
    min-height: 50px; display: flex; align-items: center; border: 1px solid #334155;
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
    margin-top: auto; background: #0f172a; padding: 1rem; border-radius: 12px;
    font-family: 'JetBrains Mono', monospace; font-size: 0.75rem; color: #94a3b8;
    border: 1px solid #334155; box-shadow: inset 0 2px 4px rgba(0,0,0,0.3);
    overflow-x: auto;
  }
  .code-title { display: block; font-size: 0.7rem; font-weight: 700; color: #64748b; text-transform: uppercase; margin-bottom: 0.5rem; border-bottom: 1px solid #1e293b; padding-bottom: 4px; }
  .code-line { display: block; padding: 2px 6px; border-radius: 4px; white-space: pre; }
  .code-line.active { background: #10b981; color: #fff; font-weight: 700; }
`;

// ==========================================
// 2. 3D COMPONENTS
// ==========================================

function ListNode({ val, idx, pos, state, isSecondHalf }) {
  const mesh = useRef();
  
  let color = "#cbd5e1"; // Inactive
  let scale = 1;
  let label = null;

  // Highlight logic based on fi (p1) and Se (p2)
  if (state.match === true && (state.fi === idx || state.Se === idx)) {
     color = "#10b981"; scale = 1.15; // Match Green
  } else if (state.match === false && (state.fi === idx || state.Se === idx)) {
     color = "#ef4444"; scale = 1.2; label = "MISMATCH"; // Fail Red
  } else if (state.fi === idx) {
     color = "#3b82f6"; scale = 1.1; label = "fi";
  } else if (state.Se === idx) {
     color = "#a855f7"; scale = 1.1; label = "Se";
  }

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
        <meshBasicMaterial color={isSecondHalf ? "#334155" : "#1e293b"} side={THREE.BackSide} />
      </RoundedBox>
      <Text position={[0, 0, 0.12]} fontSize={0.5} color={color === "#cbd5e1" ? "#1e293b" : "white"} fontWeight={800}>{val}</Text>
      
      {/* Label above */}
      {label && (
        <Html position={[0, 1.2, 0]} center>
          <div style={{
            background: color, color: 'white', padding: '3px 8px', 
            borderRadius: '6px', fontSize: '0.65rem', fontWeight: 'bold', 
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
        <meshStandardMaterial color="#94a3b8" />
      </mesh>
      <mesh position={[0, 0, 0.5]} rotation={[Math.PI/2, 0, 0]}>
        <coneGeometry args={[0.12, 0.3, 12]} />
        <meshStandardMaterial color="#94a3b8" />
      </mesh>
    </group>
  );
}

// ==========================================
// 3. MAIN LOGIC
// ==========================================
export default function PalindromeList({ onBack }) {
  // Scenario: 1 -> 2 -> 3 -> 3 -> 2 -> 1 (Even length for perfect split)
  const nodes = [
    // Top Row (fi starts here)
    { id: 0, val: 1, next: 1, pos: new THREE.Vector3(-3, 1.2, 0), isSecond: false },
    { id: 1, val: 2, next: 2, pos: new THREE.Vector3(0, 1.2, 0), isSecond: false },
    { id: 2, val: 3, next: null, pos: new THREE.Vector3(3, 1.2, 0), isSecond: false },
    
    // Bottom Row (Se starts here - result of reverseList)
    { id: 3, val: 1, next: 4, pos: new THREE.Vector3(-3, -1.2, 0), isSecond: true },
    { id: 4, val: 2, next: 5, pos: new THREE.Vector3(0, -1.2, 0), isSecond: true },
    { id: 5, val: 3, next: null, pos: new THREE.Vector3(3, -1.2, 0), isSecond: true },
  ];

  const [pointers, setPointers] = useState({ fi: null, Se: null, match: null });
  const [log, setLog] = useState("Ready. Simulated: Mid found, 2nd half reversed.");
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

    // Simulated State after finding mid and reversing
    let fi = 0; // Head of first half
    let Se = 3; // Head of reversed second half

    setLog("Setup Complete: 'slow' found mid, 'reverseList' called.");
    setActiveLine(1); // bool isPalindrome...
    await sleep(800); await checkPause();

    setLog("Starting Comparison Loop (while Se)...");
    setPointers({ fi, Se, match: null });
    setActiveLine(12); // ListNode* fi = head
    await sleep(800); await checkPause();

    // Loop: while(Se)
    while (Se !== null && Se < nodes.length) { 
        setActiveLine(14); // while(Se)
        await sleep(500); await checkPause();
        
        // Compare
        const val1 = nodes[fi].val;
        const val2 = nodes[Se].val;
        
        setActiveLine(15); // if(Se->val != fi->val)
        if (val1 !== val2) {
            setLog(`Mismatch! ${val1} != ${val2}`);
            setPointers({ fi, Se, match: false });
            setActiveLine(16); // return false
            await sleep(1000);
            setLog("Result: FALSE (Not Palindrome)");
            setIsRunning(false);
            return;
        }

        setLog(`Match! ${val1} == ${val2}`);
        setPointers({ fi, Se, match: true }); 
        await sleep(1000); await checkPause();

        // Move Pointers
        setActiveLine(18); // fi = fi->next
        fi = nodes[fi].next;
        setActiveLine(19); // Se = Se->next
        Se = nodes[Se].next;
        
        if (Se === null) break;

        setPointers({ fi, Se, match: null });
        setLog("Moving pointers...");
        await sleep(800); await checkPause();
    }

    setActiveLine(21); // return true
    setLog("Result: TRUE (Is Palindrome)");
    setPointers({ fi: null, Se: null, match: null });
    setIsRunning(false);
  };

  const reset = () => {
    setPointers({ fi: null, Se: null, match: null });
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
          <div className="viz-title">Palindrome Check</div>
          
          <Canvas camera={{ position: [0, 0, 8.5], fov: 45 }}>
            <ambientLight intensity={1} />
            <spotLight position={[5, 10, 5]} intensity={1} />
            <Environment preset="city" />
            <Center>
              <group>
                {/* Nodes */}
                {nodes.map((node, i) => (
                  <ListNode key={node.id} val={node.val} idx={i} pos={node.pos} state={pointers} isSecondHalf={node.isSecond} />
                ))}

                {/* Arrows */}
                {nodes.map((node, i) => {
                  if (node.next === null) return null;
                  const startPos = node.pos;
                  const endPos = nodes[node.next].pos; 
                  return <Arrow key={`link-${i}`} start={startPos} end={endPos} visible={true} />;
                })}
                
                {/* Visual Divider */}
                <mesh position={[0, 0, -1]}>
                    <planeGeometry args={[10, 0.05]} />
                    <meshBasicMaterial color="#e2e8f0" />
                </mesh>

              </group>
            </Center>
            <ContactShadows position={[0, -3, 0]} opacity={0.4} scale={30} blur={2} />
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
             <div className="badge bg-blue">fi</div>
             <div className="badge bg-purple">Se</div>
             <div className="badge bg-green">match</div>
          </div>

          <div className="console">
              {log}
          </div>

          <div className="btn-row">
            {!isRunning ? (
               <button className="btn" onClick={runAlgorithm}>▶ Start Check</button>
            ) : (
               <button className="btn btn-pause" onClick={() => setIsPaused(!isPaused)}>
                 {isPaused ? "▶ Resume" : "⏸ Pause"}
               </button>
            )}
            <button className="btn btn-reset" onClick={reset}>Reset</button>
          </div>

          <div className="code-box">
            <span className="code-title">Your Solution Class</span>
            <span className={`code-line ${activeLine === 1 ? 'active' : ''}`}>bool isPalindrome(ListNode* head) &#123;</span>
            <span className={`code-line ${activeLine === 2 ? 'active' : ''}`}>    ListNode* slow=head;</span>
            <span className={`code-line ${activeLine === 3 ? 'active' : ''}`}>    ListNode* fast=head;</span>
            <span className={`code-line ${activeLine === 4 ? 'active' : ''}`}>    while(fast && fast-&gt;next) &#123;</span>
            <span className={`code-line ${activeLine === 5 ? 'active' : ''}`}>        slow=slow-&gt;next;</span>
            <span className={`code-line ${activeLine === 6 ? 'active' : ''}`}>        fast=fast-&gt;next-&gt;next;</span>
            <span className={`code-line ${activeLine === 7 ? 'active' : ''}`}>    &#125;</span>
            <span className={`code-line ${activeLine === 8 ? 'active' : ''}`}></span>
            <span className={`code-line ${activeLine === 9 ? 'active' : ''}`}>    // Reverse 2nd half</span>
            <span className={`code-line ${activeLine === 10 ? 'active' : ''}`}>    ListNode* Se=reverseList(slow);</span>
            <span className={`code-line ${activeLine === 11 ? 'active' : ''}`}></span>
            <span className={`code-line ${activeLine === 12 ? 'active' : ''}`}>    ListNode* fi=head;</span>
            <span className={`code-line ${activeLine === 13 ? 'active' : ''}`}></span>
            <span className={`code-line ${activeLine === 14 ? 'active' : ''}`}>    while(Se) &#123;</span>
            <span className={`code-line ${activeLine === 15 ? 'active' : ''}`}>        if(Se-&gt;val != fi-&gt;val) &#123;</span>
            <span className={`code-line ${activeLine === 16 ? 'active' : ''}`}>            return false;</span>
            <span className={`code-line ${activeLine === 17 ? 'active' : ''}`}>        &#125;</span>
            <span className={`code-line ${activeLine === 18 ? 'active' : ''}`}>        fi=fi-&gt;next;</span>
            <span className={`code-line ${activeLine === 19 ? 'active' : ''}`}>        Se=Se-&gt;next;</span>
            <span className={`code-line ${activeLine === 20 ? 'active' : ''}`}>    &#125;</span>
            <span className={`code-line ${activeLine === 21 ? 'active' : ''}`}>    return true;</span>
            <span className={`code-line ${activeLine === 22 ? 'active' : ''}`}>&#125;</span>
          </div>

        </div>

      </div>
    </>
  );
}