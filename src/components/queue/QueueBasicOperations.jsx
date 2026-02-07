import React, { useState, useRef, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Center, Text, RoundedBox, Environment, ContactShadows, Html } from '@react-three/drei';
import * as THREE from 'three';

// ==========================================
// 1. STYLES
// ==========================================
const styles = `
  .queue-container { width: 100%; height: 100vh; display: flex; background: #fff; font-family: 'Inter', sans-serif; overflow: hidden; }
  
  .visual-panel { 
    flex: 2; position: relative; 
    background: radial-gradient(circle at center, #f8fafc 0%, #cbd5e1 100%); 
    border-right: 1px solid #cbd5e1;
  }

  /* 3D Scene Status */
  .scene-status {
    position: absolute; top: 20px; left: 50%; transform: translateX(-50%);
    background: rgba(255, 255, 255, 0.9); padding: 8px 16px; 
    border-radius: 12px; font-weight: 800; color: #4f46e5;
    box-shadow: 0 4px 15px rgba(0,0,0,0.1); font-size: 0.9rem;
    z-index: 10;
  }

  .control-panel { 
    flex: 0.8; background: #fff; padding: 1.5rem; display: flex; flex-direction: column; 
    box-shadow: -10px 0 30px rgba(0,0,0,0.05); z-index: 10; 
  }

  .header { margin-bottom: 1.5rem; display: flex; align-items: center; justify-content: space-between; }
  .back-btn { background: none; border: none; color: #64748b; font-weight: 600; cursor: pointer; display: flex; align-items: center; gap: 6px; font-size: 0.9rem; }
  .back-btn:hover { color: #0f172a; }
  h2 { font-size: 1.5rem; font-weight: 800; color: #1e293b; margin: 0; }

  /* CONTROLS */
  .input-row { display: flex; gap: 10px; margin-bottom: 1.5rem; }
  .queue-input { 
    flex: 1; padding: 0.8rem; border: 2px solid #e2e8f0; border-radius: 8px; 
    font-size: 1rem; outline: none; transition: 0.2s; text-align: center;
  }
  .queue-input:focus { border-color: #4f46e5; }
  
  .btn-enq { padding: 0.8rem 1.5rem; background: #4f46e5; color: white; border: none; border-radius: 8px; font-weight: 700; cursor: pointer; transition: 0.2s; }
  .btn-enq:hover:not(:disabled) { background: #4338ca; transform: translateY(-2px); }
  .btn-enq:disabled { background: #cbd5e1; cursor: not-allowed; }

  .ops-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 1.5rem; }
  .btn-op { padding: 0.8rem; border: none; border-radius: 8px; font-weight: 600; cursor: pointer; color: white; transition: 0.2s; }
  .btn-deq { background: #ef4444; } .btn-deq:hover:not(:disabled) { background: #dc2626; }
  .btn-front { background: #f59e0b; } .btn-front:hover:not(:disabled) { background: #d97706; }
  .btn-reset { background: #64748b; } .btn-reset:hover:not(:disabled) { background: #475569; }
  .btn-op:disabled { opacity: 0.6; cursor: not-allowed; }

  .console { 
    background: #1e293b; border-radius: 12px; padding: 1.2rem; color: #4ade80; 
    font-family: 'JetBrains Mono', monospace; font-size: 0.85rem; margin-bottom: 1.5rem; 
    min-height: 60px; display: flex; align-items: center; border: 1px solid #334155;
  }

  .legend { display: flex; gap: 0.8rem; margin-bottom: 1.5rem; justify-content: center; }
  .badge { padding: 4px 10px; border-radius: 6px; font-size: 0.7rem; font-weight: 700; color: white; text-transform: uppercase; }
  .bg-front { background: #10b981; } .bg-rear { background: #f59e0b; }

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
// 2. 3D COMPONENTS (SCALED DOWN)
// ==========================================

// The Horizontal Glass Pipe (Smaller)
function QueueTunnel() {
  return (
    <group position={[0, 0, 0]}>
      {/* The Glass Cylinder */}
      <mesh rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.9, 0.9, 10, 32, 1, true]} />
        <meshPhysicalMaterial 
          color="#a5b4fc" 
          transmission={0.6} 
          opacity={0.2} 
          transparent 
          roughness={0.1} 
          metalness={0.1} 
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </mesh>
      
      {/* Floor reflection */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1.0, 0]}>
         <planeGeometry args={[12, 3]} />
         <meshStandardMaterial color="#cbd5e1" opacity={0.5} transparent />
      </mesh>
    </group>
  );
}

function QueueNode({ val, idx, isNew, isDequeued, isFront, isRear }) {
  const mesh = useRef();
  
  // Adjusted Spacing:
  // Center is 0. 
  // Nodes size 1.0, Spacing 1.2
  // Start from left (-3.5)
  const targetX = -3.5 + (idx * 1.2);

  useFrame((state, delta) => {
    if (!mesh.current) return;

    if (isNew) {
      // Slide in from RIGHT
      mesh.current.position.x = THREE.MathUtils.lerp(mesh.current.position.x, targetX, delta * 4);
    } else if (isDequeued) {
      // Slide out to LEFT and shrink
      mesh.current.position.x -= delta * 6;
      mesh.current.scale.subScalar(delta * 2);
    } else {
      // Idle slide
      mesh.current.position.x = THREE.MathUtils.lerp(mesh.current.position.x, targetX, delta * 6);
    }
  });

  useEffect(() => {
    if (isNew && mesh.current) mesh.current.position.x = 6; // Spawn closer
  }, []);

  if (isDequeued && mesh.current && mesh.current.scale.x < 0) return null;

  let color = "#3b82f6"; // Default Blue
  if (isFront) color = "#10b981"; // Front Green
  if (isRear) color = "#f59e0b";  // Rear Orange
  if (isFront && isRear) color = "#8b5cf6"; // Single element

  return (
    <group ref={mesh} position={[isNew ? 6 : targetX, 0, 0]}>
      {/* Node Body (Smaller: 1.0) */}
      <RoundedBox args={[1.0, 1.0, 1.0]} radius={0.15}>
        <meshStandardMaterial color={color} />
      </RoundedBox>
      <RoundedBox args={[1.05, 1.05, 0.9]} radius={0.15}>
        <meshBasicMaterial color="#1e293b" side={THREE.BackSide} />
      </RoundedBox>

      {/* Number */}
      <Text position={[0, 0, 0.6]} fontSize={0.45} color="white" anchorX="center" anchorY="middle" fontWeight="bold" renderOrder={10} depthTest={false}>
        {val}
      </Text>

      {/* Floating Labels (Smaller) */}
      {isFront && !isDequeued && (
        <Html position={[0, 0.9, 0]} center>
          <div style={{background: '#10b981', color: 'white', padding: '2px 5px', borderRadius: '4px', fontSize: '0.55rem', fontWeight: 'bold'}}>FRONT</div>
        </Html>
      )}
      {isRear && !isDequeued && (
        <Html position={[0, -0.9, 0]} center>
          <div style={{background: '#f59e0b', color: 'white', padding: '2px 5px', borderRadius: '4px', fontSize: '0.55rem', fontWeight: 'bold'}}>REAR</div>
        </Html>
      )}
    </group>
  );
}

// ==========================================
// 3. MAIN LOGIC
// ==========================================
export default function QueueBasicOperations({ onBack }) {
  const [queue, setQueue] = useState([{ id: 1, val: 10 }, { id: 2, val: 20 }, { id: 3, val: 30 }]);
  const [inputValue, setInputValue] = useState("");
  const [dequeuedNode, setDequeuedNode] = useState(null);
  const [newId, setNewId] = useState(null);
  
  const [status, setStatus] = useState("Queue Ready");
  const [log, setLog] = useState("Initialized [10, 20, 30]");
  const [activeLine, setActiveLine] = useState(0);
  const [isBusy, setIsBusy] = useState(false);

  const sleep = (ms) => new Promise(r => setTimeout(r, ms));

  // --- ENQUEUE ---
  const handleEnqueue = async () => {
    if (!inputValue.trim()) return;
    if (queue.length >= 7) { setStatus("Queue Full (Visual Limit)"); return; }
    setIsBusy(true);

    const val = parseInt(inputValue);
    const newNode = { id: Date.now(), val: val };
    
    setActiveLine(1); // q.push
    setStatus(`Enqueueing ${val}...`);
    setNewId(newNode.id);
    
    setQueue(prev => [...prev, newNode]);
    setInputValue("");

    await sleep(800);
    setNewId(null);
    setStatus("Ready");
    setLog(`Enqueued ${val}. Size: ${queue.length + 1}`);
    setIsBusy(false);
  };

  // --- DEQUEUE ---
  const handleDequeue = async () => {
    if (queue.length === 0) { setStatus("Queue Underflow!"); setActiveLine(4); return; }
    setIsBusy(true);

    setActiveLine(2); // q.pop
    const frontNode = queue[0];
    setStatus(`Dequeueing ${frontNode.val}...`);
    
    // Trigger exit animation
    setDequeuedNode(frontNode);
    
    await sleep(800); // Wait for slide out

    // Actual removal
    setQueue(prev => prev.slice(1));
    setDequeuedNode(null);
    
    setStatus("Ready");
    setLog(`Dequeued ${frontNode.val}.`);
    setIsBusy(false);
  };

  const handleFront = () => {
    if (queue.length === 0) { setStatus("Queue Empty"); return; }
    setActiveLine(3); // q.front
    setLog(`Front element is ${queue[0].val}`);
    setStatus(`Front: ${queue[0].val}`);
  };

  const handleReset = () => {
    setQueue([{ id: 1, val: 10 }, { id: 2, val: 20 }, { id: 3, val: 30 }]);
    setLog("Reset.");
    setStatus("Queue Reset");
    setActiveLine(0);
  };

  return (
    <>
      <style>{styles}</style>
      <div className="queue-container">
        
        {/* LEFT: 3D VIZ */}
        <div className="visual-panel">
          <div className="scene-status">{status}</div>
          
          <Canvas camera={{ position: [0, 1.5, 12], fov: 40 }}> {/* Pulled back camera for wide view */}
            <ambientLight intensity={1} />
            <spotLight position={[5, 10, 5]} intensity={1.5} />
            <Environment preset="city" />
            <Center>
              <group>
                <QueueTunnel />
                
                {/* Active Queue Nodes */}
                {queue.map((node, i) => (
                  <QueueNode 
                    key={node.id} 
                    val={node.val} 
                    idx={i} 
                    isNew={node.id === newId}
                    isDequeued={false}
                    isFront={i === 0}
                    isRear={i === queue.length - 1}
                  />
                ))}

                {/* Ghost Node for Exit Animation */}
                {dequeuedNode && (
                  <QueueNode 
                    key="ghost"
                    val={dequeuedNode.val}
                    idx={-1} // Move past index 0
                    isNew={false}
                    isDequeued={true}
                    isFront={true}
                    isRear={false}
                  />
                )}
              </group>
            </Center>
            <ContactShadows position={[0, -2, 0]} opacity={0.4} scale={20} blur={2} />
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
             <div className="badge bg-front">Front (Exit)</div>
             <div className="badge bg-rear">Rear (Entry)</div>
          </div>

          <div className="input-row">
             <input 
               className="queue-input" 
               type="number" 
               placeholder="Enter Value" 
               value={inputValue}
               onChange={(e) => setInputValue(e.target.value)}
               onKeyDown={(e) => e.key === 'Enter' && handleEnqueue()}
             />
             <button className="btn-enq" onClick={handleEnqueue} disabled={isBusy}>Enqueue</button>
          </div>

          <div className="ops-grid">
             <button className="btn-op btn-deq" onClick={handleDequeue} disabled={isBusy}>Dequeue</button>
             <button className="btn-op btn-front" onClick={handleFront} disabled={isBusy}>Front</button>
             <button className="btn-op btn-reset" onClick={handleReset} disabled={isBusy}>Reset</button>
          </div>

          <div className="console">
              {log}
          </div>

          <div className="code-box">
            <span className="code-title">Queue Logic (FIFO)</span>
            <span className={`code-line ${activeLine === 1 ? 'active' : ''}`}>queue.push(val);   // Add to Rear</span>
            <span className={`code-line ${activeLine === 2 ? 'active' : ''}`}>queue.pop();       // Remove Front</span>
            <span className={`code-line ${activeLine === 3 ? 'active' : ''}`}>queue.front();     // Peek Front</span>
            <span className={`code-line ${activeLine === 4 ? 'active' : ''}`}>queue.empty();     // Check Empty</span>
          </div>

        </div>

      </div>
    </>
  );
}