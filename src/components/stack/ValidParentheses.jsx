import React, { useState, useRef, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Center, Text, RoundedBox, Environment, ContactShadows, Html, Line } from '@react-three/drei';
import * as THREE from 'three';

// ==========================================
// 1. STYLES
// ==========================================
const styles = `
  .vp-container { width: 100%; height: 100vh; display: flex; background: #fff; font-family: 'Inter', sans-serif; overflow: hidden; }
  
  .visual-panel { 
    flex: 2; position: relative; 
    background: radial-gradient(circle at center, #f8fafc 0%, #cbd5e1 100%); 
    border-right: 1px solid #cbd5e1;
  }
  
  /* Floating Status Label in 3D */
  .scene-status {
    background: rgba(255, 255, 255, 0.9); padding: 6px 12px; 
    border-radius: 8px; font-weight: 700; color: #1e293b;
    box-shadow: 0 4px 10px rgba(0,0,0,0.1); font-size: 0.9rem;
    white-space: nowrap; text-align: center;
  }
  .scene-status.error { color: #ef4444; border: 2px solid #ef4444; }
  .scene-status.success { color: #10b981; border: 2px solid #10b981; }

  .control-panel { 
    flex: 0.8; background: #fff; padding: 1.5rem; display: flex; flex-direction: column; 
    box-shadow: -10px 0 30px rgba(0,0,0,0.05); z-index: 10; 
  }

  .header { margin-bottom: 1.5rem; display: flex; align-items: center; justify-content: space-between; }
  .back-btn { background: none; border: none; color: #64748b; font-weight: 600; cursor: pointer; display: flex; align-items: center; gap: 6px; font-size: 0.9rem; }
  .back-btn:hover { color: #0f172a; }
  h2 { font-size: 1.5rem; font-weight: 800; color: #1e293b; margin: 0; }

  /* CONTROLS */
  .input-row { display: flex; gap: 10px; margin-bottom: 1rem; }
  .vp-input { 
    flex: 1; padding: 0.6rem; border: 2px solid #e2e8f0; border-radius: 8px; 
    font-size: 1rem; letter-spacing: 2px; outline: none; text-align: center; font-family: monospace;
  }
  .vp-input:focus { border-color: #4f46e5; }
  
  .btn-start { padding: 0.6rem 1.2rem; background: #4f46e5; color: white; border: none; border-radius: 8px; font-weight: 700; cursor: pointer; transition: 0.2s; }
  .btn-start:hover:not(:disabled) { background: #4338ca; transform: translateY(-2px); }
  .btn-start:disabled { background: #cbd5e1; cursor: not-allowed; transform: none; }

  .btn-reset { width: 100%; padding: 0.6rem; background: #64748b; color: white; border: none; border-radius: 8px; font-weight: 600; cursor: pointer; margin-bottom: 1rem; }
  
  .legend { display: flex; gap: 0.5rem; margin-bottom: 1rem; flex-wrap: wrap; justify-content: center; }
  .badge { padding: 4px 10px; border-radius: 6px; font-size: 0.65rem; font-weight: 700; color: white; }
  .bg-p { background: #3b82f6; } .bg-b { background: #8b5cf6; } .bg-s { background: #f59e0b; }

  /* COMPACT CODE BOX */
  .code-box {
    margin-top: auto; background: #0f172a; padding: 1rem; border-radius: 12px;
    font-family: 'JetBrains Mono', monospace; font-size: 0.75rem; color: #94a3b8;
    border: 1px solid #334155; box-shadow: inset 0 2px 4px rgba(0,0,0,0.3);
  }
  .code-title { display: block; font-size: 0.7rem; font-weight: 700; color: #64748b; text-transform: uppercase; margin-bottom: 0.5rem; border-bottom: 1px solid #1e293b; padding-bottom: 4px; }
  .code-line { display: block; padding: 1px 6px; border-radius: 4px; }
  .code-line.active { background: #10b981; color: #fff; font-weight: 700; }
`;

// ==========================================
// 2. 3D COMPONENTS (SCALED DOWN)
// ==========================================

const getBracketColor = (char) => {
  if (char === '(' || char === ')') return "#3b82f6"; 
  if (char === '{' || char === '}') return "#8b5cf6"; 
  if (char === '[' || char === ']') return "#f59e0b"; 
  return "#cbd5e1";
};

// The Glass Tube (Smaller)
function StackContainer() {
  return (
    <group position={[0, -2.5, 0]}>
      {/* Base */}
      <RoundedBox args={[2.2, 0.1, 2.2]} radius={0.05} position={[0, 0, 0]}>
        <meshStandardMaterial color="#334155" roughness={0.5} />
      </RoundedBox>
      {/* Glass */}
      <mesh position={[0, 2.5, 0]}>
        <cylinderGeometry args={[1.1, 1.1, 5, 32, 1, true]} />
        <meshPhysicalMaterial 
          color="#a5b4fc" transmission={0.6} opacity={0.3} transparent 
          roughness={0.1} metalness={0.1} side={THREE.DoubleSide} depthWrite={false}
        />
      </mesh>
    </group>
  );
}

// Stack Node (Smaller)
function StackNode({ val, idx, isPopped, isNew }) {
  const mesh = useRef();
  // Nodes are smaller (1.4 size) and stacked tighter (0.6 gap)
  const targetY = -2.2 + (idx * 0.65); 
  
  useFrame((state, delta) => {
    if (!mesh.current) return;
    if (isNew) {
      mesh.current.position.y = THREE.MathUtils.lerp(mesh.current.position.y, targetY, delta * 6);
    } else if (isPopped) {
      mesh.current.position.y += delta * 4; 
      mesh.current.scale.subScalar(delta * 2); 
    } else {
      mesh.current.position.y = THREE.MathUtils.lerp(mesh.current.position.y, targetY, delta * 10);
    }
  });

  useEffect(() => {
    if (isNew && mesh.current) mesh.current.position.y = 4; // Spawn height
  }, []);

  if (isPopped && mesh.current && mesh.current.scale.x < 0) return null;

  return (
    <group ref={mesh} position={[0, isNew ? 4 : targetY, 0]}>
      <RoundedBox args={[1.4, 0.5, 1.4]} radius={0.1}>
        <meshStandardMaterial color={getBracketColor(val)} />
      </RoundedBox>
      <RoundedBox args={[1.45, 0.55, 1.3]} radius={0.1}>
        <meshBasicMaterial color="#1e293b" side={THREE.BackSide} />
      </RoundedBox>
      <Text position={[0, 0, 0.8]} fontSize={0.35} color="white" anchorX="center" anchorY="middle" fontWeight="bold" renderOrder={10} depthTest={false}>
        {val}
      </Text>
    </group>
  );
}

// Input Ribbon (Moved Closer & Smaller)
function StringNode({ val, idx, currentIdx, status }) {
    const isCurrent = idx === currentIdx;
    const isPast = idx < currentIdx;
    
    // Position: Centered based on string length, closer to stack
    const xPos = (idx - 3) * 1.0; // Tighter spacing (1.0)
    const yPos = 3.0; // Lower down (was 4.5)

    let color = "#e2e8f0";
    if (isCurrent) color = "#fbbf24"; 
    else if (isPast) color = "#94a3b8"; 
    
    if (status === 'valid') color = "#10b981";
    if (status === 'invalid' && isCurrent) color = "#ef4444";

    return (
        <group position={[xPos, yPos, 0]}>
            <RoundedBox args={[0.8, 0.8, 0.3]} radius={0.1}>
                <meshStandardMaterial color={color} />
            </RoundedBox>
            <Text position={[0, 0, 0.2]} fontSize={0.4} color={isPast ? "#475569" : "#1e293b"} fontWeight="bold">
                {val}
            </Text>
            {isCurrent && (
                 <Html position={[0, 0.8, 0]} center>
                    <div style={{color:'#f59e0b', fontSize:'1.2rem', animation:'bounce 1s infinite', fontWeight:'bold'}}>↓</div>
                 </Html>
            )}
        </group>
    );
}

// Connector Line (Laser Beam)
function ActionLine({ currentIdx, stackHeight, action }) {
    if (currentIdx === -1) return null;
    
    const xPos = (currentIdx - 3) * 1.0;
    const yStart = 2.5; // Bottom of string node
    
    // Calculate top of stack position
    const yEnd = -2.2 + (stackHeight * 0.65) + 0.5;

    const color = action === 'push' ? '#10b981' : (action === 'check' ? '#f59e0b' : '#ef4444');

    return (
        <Line 
            points={[[xPos, yStart, 0], [0, yEnd, 0]]} 
            color={color} 
            lineWidth={3} 
            transparent 
            opacity={0.6}
            dashed={true}
        />
    );
}

// ==========================================
// 3. MAIN LOGIC
// ==========================================
export default function ValidParentheses({ onBack }) {
  const [inputStr, setInputStr] = useState("{[]()}");
  const [stack, setStack] = useState([]); 
  const [currentIdx, setCurrentIdx] = useState(-1);
  const [poppedNode, setPoppedNode] = useState(null);
  const [newId, setNewId] = useState(null);
  
  // Logic State
  const [sceneStatus, setSceneStatus] = useState("Ready"); // Text inside 3D scene
  const [statusType, setStatusType] = useState(""); // error, success
  const [activeLine, setActiveLine] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [actionType, setActionType] = useState(null); // 'push', 'check'

  const sleep = (ms) => new Promise(r => setTimeout(r, ms));

  const runAlgorithm = async () => {
    if (!inputStr) return;
    setStack([]);
    setCurrentIdx(-1);
    setSceneStatus("Starting...");
    setStatusType("");
    setIsRunning(true);
    setPoppedNode(null);
    setNewId(null);
    setActionType(null);
    
    const s = inputStr.split('');
    const internalStack = []; 
    const map = { ')': '(', '}': '{', ']': '[' };

    await sleep(800);

    for (let i = 0; i < s.length; i++) {
        setCurrentIdx(i);
        const char = s[i];
        const isOpen = ['(', '{', '['].includes(char);

        setActiveLine(1); 
        await sleep(400);

        if (isOpen) {
            // --- PUSH ---
            setActiveLine(2); 
            setSceneStatus(`Open '${char}' found -> Push`);
            setActionType('push'); // Trigger Green Line
            await sleep(600);

            setActiveLine(3); 
            const newNode = { id: Date.now(), val: char };
            setNewId(newNode.id);
            setStack(prev => [...prev, newNode]);
            internalStack.push(char); 
            
            await sleep(800);
            setNewId(null);

        } else {
            // --- CHECK ---
            setActiveLine(5); 
            setSceneStatus(`Close '${char}' found -> Checking Match...`);
            setActionType('check'); // Trigger Orange Line
            await sleep(600);

            setActiveLine(6); 
            const topVal = internalStack.length > 0 ? internalStack[internalStack.length - 1] : null;

            if (internalStack.length === 0 || topVal !== map[char]) {
                setSceneStatus(`Mismatch! '${char}' needs '${map[char]}'`);
                setStatusType("error");
                setActiveLine(7); 
                setIsRunning(false);
                return; 
            }

            // --- POP ---
            setActiveLine(9); 
            setSceneStatus(`Matched! '${topVal}' & '${char}'. Pop.`);
            setActionType('check'); 
            
            internalStack.pop();
            const visualTop = stack[stack.length - 1];
            setPoppedNode(visualTop);
            
            await sleep(800);
            
            setStack(prev => prev.slice(0, -1));
            setPoppedNode(null);
        }
        setActionType(null); // Clear line
    }

    // FINAL CHECK
    setCurrentIdx(-1);
    setActiveLine(12); 
    if (internalStack.length === 0) {
        setSceneStatus("Empty Stack -> VALID String!");
        setStatusType("success");
    } else {
        setSceneStatus("Stack Leftover -> INVALID.");
        setStatusType("error");
    }
    setIsRunning(false);
  };

  const handleReset = () => {
      setStack([]);
      setCurrentIdx(-1);
      setSceneStatus("Ready");
      setStatusType("");
      setActiveLine(0);
      setIsRunning(false);
      setActionType(null);
  };

  return (
    <>
      <style>{styles}</style>
      <div className="vp-container">
        
        {/* LEFT: 3D VIZ */}
        <div className="visual-panel">
          
          {/* 3D Scene Status Label */}
          <div style={{position: 'absolute', top: '20px', left: '50%', transform: 'translateX(-50%)', zIndex: 10}}>
             <div className={`scene-status ${statusType}`}>{sceneStatus}</div>
          </div>

          <Canvas camera={{ position: [0, 1, 14], fov: 35 }}> {/* Pulled camera back (Z=14) */}
            <ambientLight intensity={1} />
            <spotLight position={[5, 10, 5]} intensity={1.5} />
            <Environment preset="city" />
            <Center>
              <group>
                <StackContainer />
                
                {/* Input String Ribbon */}
                <group>
                    {inputStr.split('').map((char, i) => (
                        <StringNode 
                            key={i} 
                            val={char} 
                            idx={i} 
                            currentIdx={currentIdx}
                            status={statusType === 'success' ? 'valid' : (statusType === 'error' ? 'invalid' : '')}
                        />
                    ))}
                </group>

                {/* The Connector Laser Beam */}
                <ActionLine currentIdx={currentIdx} stackHeight={stack.length} action={actionType} />

                {/* Stack Nodes */}
                {stack.map((node, i) => (
                  <StackNode 
                    key={node.id} 
                    val={node.val} 
                    idx={i} 
                    isNew={node.id === newId}
                    isPopped={false}
                  />
                ))}

                {/* Ghost Node for Pop Animation */}
                {poppedNode && (
                  <StackNode 
                    key="ghost"
                    val={poppedNode.val}
                    idx={stack.length - 1} 
                    isNew={false}
                    isPopped={true}
                  />
                )}

              </group>
            </Center>
            <ContactShadows position={[0, -3.0, 0]} opacity={0.4} scale={20} blur={2} />
          </Canvas>
        </div>

        {/* RIGHT: CONTROLS */}
        <div className="control-panel">
          <div className="header">
            <h2>Controls</h2>
            <button className="back-btn" onClick={onBack}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
              Back
            </button>
          </div>

          <div className="legend">
             <div className="badge bg-p">( )</div>
             <div className="badge bg-b">{`{ }`}</div>
             <div className="badge bg-s">[ ]</div>
          </div>

          <div className="input-row">
             <input 
               className="vp-input" 
               placeholder="{[]()}"
               value={inputStr}
               maxLength={8} // Limit length for better fit
               onChange={(e) => {
                   const val = e.target.value;
                   if (/^[(){}[\]]*$/.test(val)) setInputStr(val);
               }}
             />
             <button className="btn-start" onClick={runAlgorithm} disabled={isRunning}>Scan</button>
          </div>
          
          <button className="btn-reset" onClick={handleReset} disabled={isRunning}>Reset</button>

          <div className="code-box">
            <span className="code-title">Algorithm O(N)</span>
            <span className={`code-line ${activeLine === 1 ? 'active' : ''}`}>for (char c : s) &#123;</span>
            <span className={`code-line ${activeLine === 2 ? 'active' : ''}`}>&nbsp;&nbsp;if (isOpen(c)) &#123;</span>
            <span className={`code-line ${activeLine === 3 ? 'active' : ''}`}>&nbsp;&nbsp;&nbsp;&nbsp;stack.push(c);</span>
            <span className={`code-line ${activeLine === 4 ? 'active' : ''}`}>&nbsp;&nbsp;&#125; else &#123;</span>
            <span className={`code-line ${activeLine === 5 ? 'active' : ''}`}>&nbsp;&nbsp;&nbsp;&nbsp;if (top != pair[c])</span>
            <span className={`code-line ${activeLine === 6 ? 'active' : ''}`}>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;return false;</span>
            <span className={`code-line ${activeLine === 7 ? 'active' : ''}`}>&nbsp;&nbsp;&nbsp;&nbsp;else</span>
            <span className={`code-line ${activeLine === 8 ? 'active' : ''}`}>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;stack.pop();</span>
            <span className={`code-line ${activeLine === 9 ? 'active' : ''}`}>&nbsp;&nbsp;&#125;</span>
            <span className={`code-line ${activeLine === 10 ? 'active' : ''}`}>&#125;</span>
            <span className={`code-line ${activeLine === 11 ? 'active' : ''}`}>return stack.isEmpty();</span>
          </div>

        </div>

      </div>
    </>
  );
}