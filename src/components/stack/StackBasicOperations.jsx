import React, { useState, useRef, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Center, Text, RoundedBox, Environment, ContactShadows, Html } from '@react-three/drei';
import * as THREE from 'three';

// ==========================================
// 1. STYLES
// ==========================================
const styles = `
  .stack-container { width: 100%; height: 100vh; display: flex; background: #fff; font-family: 'Inter', sans-serif; overflow: hidden; }
  
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

  .control-panel { 
    flex: 0.8; background: #fff; padding: 2rem; display: flex; flex-direction: column; 
    box-shadow: -10px 0 30px rgba(0,0,0,0.05); z-index: 10; 
    overflow-y: auto; 
  }

  .header { margin-bottom: 2rem; display: flex; align-items: center; justify-content: space-between; }
  .back-btn { background: none; border: none; color: #64748b; font-weight: 600; cursor: pointer; display: flex; align-items: center; gap: 6px; font-size: 0.9rem; }
  .back-btn:hover { color: #0f172a; }
  h2 { font-size: 1.5rem; font-weight: 800; color: #1e293b; margin: 0; }

  .input-row { display: flex; gap: 10px; margin-bottom: 1.5rem; }
  .stack-input { 
    flex: 1; padding: 0.8rem; border: 2px solid #e2e8f0; border-radius: 8px; 
    font-size: 1rem; outline: none; transition: 0.2s; text-align: center;
  }
  .stack-input:focus { border-color: #4f46e5; }
  
  .btn-push { padding: 0.8rem 1.5rem; background: #4f46e5; color: white; border: none; border-radius: 8px; font-weight: 700; cursor: pointer; transition: 0.2s; }
  .btn-push:hover:not(:disabled) { background: #4338ca; transform: translateY(-2px); }
  .btn-push:disabled { background: #cbd5e1; cursor: not-allowed; }

  .ops-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 1.5rem; }
  .btn-op { padding: 0.8rem; border: none; border-radius: 8px; font-weight: 600; cursor: pointer; color: white; transition: 0.2s; }
  .btn-pop { background: #ef4444; } .btn-pop:hover:not(:disabled) { background: #dc2626; }
  .btn-peek { background: #f59e0b; } .btn-peek:hover:not(:disabled) { background: #d97706; }
  .btn-reset { background: #64748b; } .btn-reset:hover:not(:disabled) { background: #475569; }
  .btn-op:disabled { opacity: 0.6; cursor: not-allowed; }

  .console { 
    background: #1e293b; border-radius: 12px; padding: 1.2rem; color: #4ade80; 
    font-family: 'JetBrains Mono', monospace; font-size: 0.85rem; margin-bottom: 1.5rem; 
    min-height: 60px; display: flex; align-items: center; border: 1px solid #334155;
  }

  .legend { display: flex; gap: 0.8rem; margin-bottom: 1.5rem; justify-content: center; }
  .badge { padding: 4px 10px; border-radius: 6px; font-size: 0.7rem; font-weight: 700; color: white; text-transform: uppercase; letter-spacing: 0.5px; }
  .bg-top { background: #f59e0b; }

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

function StackContainer() {
  return (
    <group position={[0, -2.5, 0]}>
      {/* Base */}
      <RoundedBox args={[3, 0.2, 3]} radius={0.05} position={[0, 0, 0]}>
        <meshStandardMaterial color="#334155" roughness={0.5} />
      </RoundedBox>
      {/* Glass Tube */}
      <mesh position={[0, 3.5, 0]}>
        <cylinderGeometry args={[1.6, 1.6, 7, 32, 1, true]} />
        <meshPhysicalMaterial 
          color="#a5b4fc" 
          transmission={0.6} // Glass like
          opacity={0.3} 
          transparent 
          roughness={0.1} 
          metalness={0.1} 
          side={THREE.DoubleSide}
          depthWrite={false} // Helps with transparency sorting
        />
      </mesh>
    </group>
  );
}

function StackNode({ val, idx, isPopped, isTop, isNew }) {
  const mesh = useRef();
  const targetY = -2 + (idx * 0.9);
  
  useFrame((state, delta) => {
    if (!mesh.current) return;
    if (isNew) {
      mesh.current.position.y = THREE.MathUtils.lerp(mesh.current.position.y, targetY, delta * 5);
    } else if (isPopped) {
      mesh.current.position.y += delta * 5; 
    } else {
      mesh.current.position.y = THREE.MathUtils.lerp(mesh.current.position.y, targetY, delta * 10);
    }
  });

  useEffect(() => {
    if (isNew && mesh.current) mesh.current.position.y = 8;
  }, []);

  const color = isTop ? "#f59e0b" : "#3b82f6";

  return (
    <group ref={mesh} position={[0, isNew ? 8 : targetY, 0]}>
      {/* The Block */}
      <RoundedBox args={[2, 0.8, 2]} radius={0.1}>
        <meshStandardMaterial color={color} />
      </RoundedBox>
      <RoundedBox args={[2.05, 0.85, 1.8]} radius={0.1}>
        <meshBasicMaterial color="#1e293b" side={THREE.BackSide} />
      </RoundedBox>
      
      {/* THE NUMBER - FIXED VISIBILITY */}
      <Text 
        position={[0, 0, 1.1]} // Pushed slightly in front of the box (z=1)
        fontSize={0.6}          // Increased font size
        color="white" 
        anchorX="center" 
        anchorY="middle"
        fontWeight="bold"
        renderOrder={10}        // CRITICAL: Forces text to draw ON TOP of the glass
        depthTest={false}       // CRITICAL: Ignores depth check so glass doesn't hide it
      >
        {val}
      </Text>
      
      {/* Label for Top */}
      {isTop && !isPopped && (
        <Html position={[1.5, 0, 0]} center>
          <div style={{
            background: '#f59e0b', color: 'white', padding: '4px 8px', 
            borderRadius: '6px', fontSize: '0.7rem', fontWeight: 'bold', 
            boxShadow: '0 4px 6px rgba(0,0,0,0.2)'
          }}>
            TOP
          </div>
        </Html>
      )}
    </group>
  );
}

// ==========================================
// 3. MAIN LOGIC
// ==========================================
export default function StackBasicOperations({ onBack }) {
  const [stack, setStack] = useState([{ id: 1, val: 10 }, { id: 2, val: 20 }, { id: 3, val: 30 }]);
  const [inputValue, setInputValue] = useState("");
  const [poppedNode, setPoppedNode] = useState(null);
  const [newId, setNewId] = useState(null);
  const [log, setLog] = useState("Stack Initialized.");
  const [activeLine, setActiveLine] = useState(0);
  const [isBusy, setIsBusy] = useState(false);

  const sleep = (ms) => new Promise(r => setTimeout(r, ms));

  const handlePush = async () => {
    if (!inputValue.trim()) return;
    if (stack.length >= 7) { setLog("Stack Overflow! (Visual Limit Reached)"); return; }
    setIsBusy(true);

    const val = parseInt(inputValue);
    const newNode = { id: Date.now(), val: val };
    
    setNewId(newNode.id);
    setActiveLine(1); 
    setLog(`Pushing ${val}...`);
    setStack((prev) => [...prev, newNode]);
    setInputValue("");
    
    await sleep(800);
    setNewId(null);
    setLog(`Pushed ${val}.`);
    setIsBusy(false);
  };

  const handlePop = async () => {
    if (stack.length === 0) { setLog("Stack Underflow!"); setActiveLine(3); return; }
    setIsBusy(true);

    setActiveLine(2); 
    const topNode = stack[stack.length - 1];
    setLog(`Popping ${topNode.val}...`);
    setPoppedNode(topNode);
    await sleep(800);
    setStack((prev) => prev.slice(0, -1));
    setPoppedNode(null);
    setLog(`Popped ${topNode.val}.`);
    setIsBusy(false);
  };

  const handlePeek = async () => {
    if (stack.length === 0) { setLog("Stack is Empty."); return; }
    setActiveLine(3); 
    const topVal = stack[stack.length - 1].val;
    setLog(`Top element is ${topVal}`);
  };

  const handleReset = () => {
    setStack([{ id: 1, val: 10 }, { id: 2, val: 20 }, { id: 3, val: 30 }]);
    setLog("Reset.");
    setActiveLine(0);
  };

  return (
    <>
      <style>{styles}</style>
      <div className="stack-container">
        
        {/* LEFT: 3D VIZ */}
        <div className="visual-panel">
          <div className="viz-title">Stack Operations</div>

          <Canvas camera={{ position: [6, 4, 8], fov: 45 }}>
            <ambientLight intensity={1} />
            <spotLight position={[5, 15, 5]} intensity={1.5} />
            <Environment preset="city" />
            <Center>
              <group>
                <StackContainer />
                
                {/* Render Stack Nodes */}
                {stack.map((node, i) => (
                  <StackNode 
                    key={node.id} 
                    val={node.val} 
                    idx={i} 
                    isTop={i === stack.length - 1}
                    isNew={node.id === newId}
                    isPopped={false}
                  />
                ))}

                {/* Render Ghost Node (Popped) */}
                {poppedNode && (
                  <StackNode 
                    key="ghost"
                    val={poppedNode.val}
                    idx={stack.length - 1} 
                    isTop={true}
                    isNew={false}
                    isPopped={true}
                  />
                )}
              </group>
            </Center>
            <ContactShadows position={[0, -2.5, 0]} opacity={0.4} scale={20} blur={2} />
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
             <div className="badge bg-top">Top Element</div>
          </div>

          <div className="console">
             {log}
          </div>

          <div className="input-row">
             <input 
               className="stack-input" 
               type="number" 
               placeholder="Enter Value" 
               value={inputValue}
               onChange={(e) => setInputValue(e.target.value)}
               onKeyDown={(e) => e.key === 'Enter' && handlePush()}
             />
             <button className="btn-push" onClick={handlePush} disabled={isBusy}>Push</button>
          </div>

          <div className="ops-grid">
             <button className="btn-op btn-pop" onClick={handlePop} disabled={isBusy}>Pop</button>
             <button className="btn-op btn-peek" onClick={handlePeek} disabled={isBusy}>Peek</button>
             <button className="btn-op btn-reset" onClick={handleReset} disabled={isBusy}>Reset</button>
          </div>

          <div className="code-box">
            <span className="code-title">Stack Logic (LIFO)</span>
            <span className={`code-line ${activeLine === 1 ? 'active' : ''}`}>stack.push(val);</span>
            <span className={`code-line ${activeLine === 2 ? 'active' : ''}`}>stack.pop();</span>
            <span className={`code-line ${activeLine === 3 ? 'active' : ''}`}>stack.top();</span>
            <span className={`code-line ${activeLine === 4 ? 'active' : ''}`}>stack.empty();</span>
          </div>

        </div>

      </div>
    </>
  );
}