import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float, ContactShadows, Environment, Text, RoundedBox, Html, Center } from '@react-three/drei';
import * as THREE from 'three';

// ==========================================
// 1. INTERNAL CSS (STYLES)
// ==========================================
const styles = `
  .ll-container { width: 100%; height: 100vh; display: flex; background: #fff; font-family: 'Inter', sans-serif; overflow: hidden; }
  
  /* LEFT: 3D VIEW */
  .visual-panel { flex: 1.8; position: relative; background: radial-gradient(circle at center, #f0fdf4 0%, #ffffff 80%); border-right: 1px solid #e5e7eb; }
  .viz-badge { position: absolute; top: 2rem; left: 2rem; font-size: 1.5rem; font-weight: 800; color: #15803d; background: rgba(255,255,255,0.8); padding: 0.5rem 1rem; border-radius: 8px; backdrop-filter: blur(5px); pointer-events: none; }
  
  /* RIGHT: CONTROLS */
  .control-panel { flex: 0.8; background: #fff; padding: 2rem; display: flex; flex-direction: column; box-shadow: -5px 0 20px rgba(0,0,0,0.03); z-index: 10; overflow-y: auto; }
  .header { margin-bottom: 1.5rem; }
  .back-btn { background: none; border: none; color: #6b7280; font-weight: 600; cursor: pointer; margin-bottom: 0.5rem; padding: 0; }
  .back-btn:hover { color: #15803d; }
  h2 { font-size: 2rem; font-weight: 800; color: #111827; margin: 0; }
  
  /* CONSOLE */
  .console { background: #111827; border-radius: 12px; margin-bottom: 2rem; font-family: 'JetBrains Mono', monospace; box-shadow: 0 10px 15px -3px rgba(0,0,0,0.2); }
  .console-bar { background: #1f2937; padding: 0.5rem 1rem; display: flex; gap: 6px; }
  .dot { width: 10px; height: 10px; border-radius: 50%; }
  .red { background: #ef4444; } .yellow { background: #f59e0b; } .green { background: #10b981; }
  .console-content { padding: 1.5rem; color: #4ade80; font-size: 0.9rem; min-height: 80px; }
  .cursor { animation: blink 1s infinite; }
  @keyframes blink { 50% { opacity: 0; } }

  /* OPERATIONS GRID */
  .ops-section { display: flex; flex-direction: column; gap: 1.5rem; }
  
  .ops-group { background: #f9fafb; border: 1px solid #e5e7eb; padding: 1.2rem; border-radius: 12px; }
  .ops-group h3 { margin: 0 0 1rem 0; font-size: 1rem; color: #374151; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 1px solid #e5e7eb; padding-bottom: 0.5rem; }
  
  .btn-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 0.8rem; }
  .btn { width: 100%; padding: 0.7rem; border-radius: 8px; border: none; background: #15803d; color: white; font-weight: 600; cursor: pointer; transition: 0.2s; font-size: 0.9rem; }
  .btn:hover:not(:disabled) { background: #166534; transform: translateY(-1px); }
  .btn:disabled { background: #9ca3af; cursor: not-allowed; opacity: 0.7; }
  
  .btn.red { background: #ef4444; } .btn.red:hover:not(:disabled) { background: #dc2626; }
  .btn.blue { background: #3b82f6; } .btn.blue:hover:not(:disabled) { background: #2563eb; }
  
  .inputs { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1rem; }
  .input-wrapper label { font-size: 0.75rem; color: #6b7280; font-weight: 600; display: block; margin-bottom: 4px; }
  .input-wrapper input { width: 100%; padding: 0.6rem; border: 1px solid #d1d5db; border-radius: 6px; font-family: 'Inter', sans-serif; box-sizing: border-box; }
`;

// ==========================================
// 2. 3D VISUALIZATION COMPONENTS
// ==========================================

// CONSTANTS
const COLORS = {
  idle: "#dcfce7", active: "#4ade80", found: "#fbbf24", outline: "#15803d"
};
const GAP = 2.5;

// --- A. THE NODE ---
const ListNode = React.forwardRef(({ id, value, index, total, state, pos }, ref) => {
  const mesh = useRef();
  React.useImperativeHandle(ref, () => mesh.current);

  useFrame((_, delta) => {
    if (!mesh.current) return;
    
    // Animation Logic
    if (state.mode === 'inserting' && state.targetId === id && state.phase === 'dropping') {
       mesh.current.position.lerp(pos, delta * 4);
    } 
    else if (state.mode === 'deleting' && state.targetId === id && state.phase === 'popping') {
       mesh.current.position.lerp(new THREE.Vector3(pos.x, 3, 0), delta * 4);
       mesh.current.scale.lerp(new THREE.Vector3(0,0,0), delta * 4);
    } 
    else {
       mesh.current.position.lerp(pos, delta * 6);
       mesh.current.scale.lerp(new THREE.Vector3(1,1,1), delta * 8);
    }
  });

  const isActive = state.activeId === id;
  const color = isActive ? COLORS.active : COLORS.idle;

  // Initial Spawn High
  useEffect(() => {
    if (state.mode === 'inserting' && state.targetId === id && mesh.current) {
      mesh.current.position.set(pos.x, 5, 0);
    }
  }, []);

  return (
    <group ref={mesh}>
      <RoundedBox args={[1.2, 1, 0.2]} radius={0.1} smoothness={4}><meshStandardMaterial color={color} /></RoundedBox>
      <RoundedBox args={[1.25, 1.05, 0.18]} radius={0.1}><meshBasicMaterial color={COLORS.outline} side={THREE.BackSide} /></RoundedBox>
      <Text position={[0, 0, 0.12]} fontSize={0.45} color={COLORS.outline} fontWeight={800}>{value}</Text>
      
      <group position={[0, 0.8, 0]}>
        {index === 0 && <Text fontSize={0.25} color={COLORS.outline} fontWeight={700}>HEAD</Text>}
        {index === total - 1 && <Text fontSize={0.25} color={COLORS.outline} fontWeight={700}>TAIL</Text>}
      </group>
      
      <Text position={[0, -0.8, 0]} fontSize={0.18} color="#9ca3af">{index}</Text>
    </group>
  );
});

// --- B. THE POINTER ---
function Pointer({ startRef, endRef, visible }) {
  const group = useRef();
  const shaft = useRef();
  const head = useRef();

  useFrame(() => {
    if (!group.current) return;
    if (!startRef.current || !endRef.current || !visible) {
      group.current.visible = false;
      return;
    }
    group.current.visible = true;

    const start = startRef.current.position;
    const end = endRef.current.position;
    const dir = new THREE.Vector3().subVectors(end, start).normalize();
    const dist = start.distanceTo(end);
    const gap = 0.8;
    const len = Math.max(0, dist - (gap * 2));

    const startPos = start.clone().add(dir.clone().multiplyScalar(gap));
    group.current.position.copy(startPos);
    group.current.lookAt(end);

    if(shaft.current) { shaft.current.position.z = len / 2; shaft.current.scale.y = len; }
    if(head.current) head.current.position.z = len;
  });

  return (
    <group ref={group}>
      <mesh ref={shaft} rotation={[Math.PI/2,0,0]}><cylinderGeometry args={[0.04,0.04,1,8]}/><meshStandardMaterial color="#15803d"/></mesh>
      <mesh ref={head} rotation={[Math.PI/2,0,0]}><coneGeometry args={[0.12,0.3,12]}/><meshStandardMaterial color="#15803d"/></mesh>
    </group>
  );
}

// --- C. NULL BLOCK ---
function NullBlock({ targetPos }) {
  const mesh = useRef();
  useFrame((_, delta) => { mesh.current.position.lerp(targetPos, delta * 5); });
  return (
    <group ref={mesh}>
      <Text fontSize={0.3} color="#dc2626" fontWeight={800}>NULL</Text>
      <mesh position={[-0.8, 0, 0]} rotation={[0,0,-Math.PI/2]}><cylinderGeometry args={[0.02,0.02,0.6,8]}/><meshBasicMaterial color="#15803d"/></mesh>
    </group>
  );
}

// ==========================================
// 3. MAIN PAGE LOGIC
// ==========================================
export default function BasicOperations({ onBack }) {
  const [nodes, setNodes] = useState([{ id: 1, value: 10 }, { id: 2, value: 25 }, { id: 3, value: 40 }]);
  const [state, setState] = useState({ mode: 'idle', activeId: null, targetId: null, phase: null });
  const [log, setLog] = useState("Ready. Linked List initialized.");
  
  const [insertVal, setInsertVal] = useState(99);
  const [insertIdx, setInsertIdx] = useState(1);
  
  const nodeRefs = useRef({});

  // --- HELPER: SLEEP ---
  const sleep = (ms) => new Promise(r => setTimeout(r, ms));

  // --- OPERATION: PUSH FRONT ---
  const pushFront = async () => {
    if (state.mode !== 'idle') return;
    setLog(`Push Front: Adding ${insertVal} to HEAD.`);
    
    // 1. Create Data
    const newNode = { id: Date.now(), value: parseInt(insertVal) };
    const newNodes = [newNode, ...nodes];
    
    // 2. Update State
    setNodes(newNodes);
    setState({ mode: 'inserting', phase: 'dropping', targetId: newNode.id, activeId: newNode.id });
    
    await sleep(1000);
    setState({ mode: 'idle', activeId: null });
    setLog("Head updated. Time Complexity: O(1)");
  };

  // --- OPERATION: PUSH BACK ---
  const pushBack = async () => {
    if (state.mode !== 'idle') return;
    setLog(`Push Back: Adding ${insertVal} to TAIL.`);

    // 1. Traverse to end
    for (let i = 0; i < nodes.length; i++) {
      setState({ mode: 'traversing', activeId: nodes[i].id });
      setLog(`Traversing... Node ${i} -> Next`);
      await sleep(600);
    }
    
    // 2. Insert
    setLog("Reached NULL. Inserting new node.");
    const newNode = { id: Date.now(), value: parseInt(insertVal) };
    const newNodes = [...nodes, newNode];
    setNodes(newNodes);
    
    setState({ mode: 'inserting', phase: 'dropping', targetId: newNode.id, activeId: newNode.id });
    await sleep(1000);
    
    setState({ mode: 'idle', activeId: null });
    setLog("Tail updated. Time Complexity: O(N)");
  };

  // --- OPERATION: INSERT AT INDEX ---
  const insertAtIndex = async () => {
    if (state.mode !== 'idle') return;
    const idx = parseInt(insertIdx);
    if (idx < 0 || idx > nodes.length) { setLog("Index out of bounds!"); return; }
    
    // Special cases
    if (idx === 0) return pushFront();
    if (idx === nodes.length) return pushBack();

    setLog(`Inserting ${insertVal} at Index ${idx}...`);
    
    // 1. Traverse
    for (let i = 0; i < idx; i++) {
       setState({ mode: 'traversing', activeId: nodes[i].id });
       setLog(`Traversing... at Index ${i}`);
       await sleep(600);
    }

    // 2. Insert
    const newNode = { id: Date.now(), value: parseInt(insertVal) };
    const newNodes = [...nodes];
    newNodes.splice(idx, 0, newNode);
    setNodes(newNodes);
    
    setState({ mode: 'inserting', phase: 'dropping', targetId: newNode.id, activeId: newNode.id });
    await sleep(1000);
    
    setState({ mode: 'idle', activeId: null });
    setLog(`Inserted at Index ${idx}. Time Complexity: O(N)`);
  };

  // --- OPERATION: POP FRONT ---
  const popFront = async () => {
    if (state.mode !== 'idle') return;
    if (nodes.length === 0) { setLog("List is empty!"); return; }

    setLog("Pop Front: Removing Head...");
    const target = nodes[0];
    
    setState({ mode: 'deleting', phase: 'popping', targetId: target.id, activeId: target.id });
    await sleep(1000);

    setNodes(nodes.slice(1));
    setState({ mode: 'idle', activeId: null });
    setLog("Head removed. Time Complexity: O(1)");
  };

  // --- OPERATION: POP BACK ---
  const popBack = async () => {
    if (state.mode !== 'idle') return;
    if (nodes.length === 0) { setLog("List is empty!"); return; }

    setLog("Pop Back: Removing Tail...");
    
    // 1. Traverse to end
    for (let i = 0; i < nodes.length; i++) {
       setState({ mode: 'traversing', activeId: nodes[i].id });
       setLog(`Traversing... at Index ${i}`);
       await sleep(600);
    }

    const target = nodes[nodes.length - 1];
    setState({ mode: 'deleting', phase: 'popping', targetId: target.id, activeId: target.id });
    setLog("Unlinking Tail Node...");
    await sleep(1000);

    setNodes(nodes.slice(0, -1));
    setState({ mode: 'idle', activeId: null });
    setLog("Tail removed. Time Complexity: O(N)");
  };

  // --- OPERATION: DELETE AT INDEX ---
  const deleteAtIndex = async () => {
    if (state.mode !== 'idle') return;
    const idx = parseInt(insertIdx);
    if (idx < 0 || idx >= nodes.length) { setLog("Index out of bounds!"); return; }
    
    if (idx === 0) return popFront();
    if (idx === nodes.length - 1) return popBack();

    setLog(`Deleting at Index ${idx}...`);
    
    // 1. Traverse
    for (let i = 0; i <= idx; i++) {
       setState({ mode: 'traversing', activeId: nodes[i].id });
       setLog(`Traversing... at Index ${i}`);
       await sleep(600);
    }

    const target = nodes[idx];
    setState({ mode: 'deleting', phase: 'popping', targetId: target.id, activeId: target.id });
    await sleep(1000);

    setNodes(nodes.filter((_, i) => i !== idx));
    setState({ mode: 'idle', activeId: null });
    setLog("Node Deleted.");
  };

  // Layout Helper
  const getLayoutPos = (index, total) => {
    const startX = -((total * GAP) / 2) + (GAP/2);
    return new THREE.Vector3(startX + (index * GAP), 0, 0);
  };

  return (
    <>
      <style>{styles}</style>
      <div className="ll-container">
        
        {/* LEFT: 3D WORLD */}
        <div className="visual-panel">
          <Canvas camera={{ position: [0, 0, 11], fov: 45 }}>
            <color attach="background" args={['#ffffff']} />
            <ambientLight intensity={1} />
            <spotLight position={[10, 10, 10]} intensity={1} />
            <Environment preset="city" />
            <Center>
              <group>
                {nodes.map((node, i) => (
                  <ListNode 
                    key={node.id}
                    ref={(el) => (nodeRefs.current[node.id] = el)}
                    {...node} index={i} total={nodes.length} state={state}
                    pos={getLayoutPos(i, nodes.length)}
                  />
                ))}
                {nodes.map((node, i) => {
                  if (i === nodes.length - 1) return null;
                  return <Pointer key={`link-${node.id}`} startRef={{ current: nodeRefs.current[node.id] }} endRef={{ current: nodeRefs.current[nodes[i+1]?.id] }} visible={true} />;
                })}
                <NullBlock targetPos={getLayoutPos(nodes.length, nodes.length).add(new THREE.Vector3(1,0,0))} />
              </group>
            </Center>
            <ContactShadows position={[0, -1.5, 0]} opacity={0.4} scale={30} blur={2} color="#15803d" />
          </Canvas>
          <div className="viz-badge">Linked List</div>
        </div>

        {/* RIGHT: CONTROL PANEL */}
        <div className="control-panel">
          <div className="header">
            <button onClick={onBack} className="back-btn">← Library</button>
            <h2>Operations</h2>
          </div>

          <div className="console">
            <div className="console-bar"><div className="dot red"></div><div className="dot yellow"></div><div className="dot green"></div></div>
            <div className="console-content"><span>&gt; {log}</span><span className="cursor">_</span></div>
          </div>

          <div className="ops-section">
            
            {/* Head/Tail Operations */}
            <div className="ops-group">
              <h3>Head & Tail</h3>
              <div className="btn-grid">
                <button className="btn" onClick={pushFront} disabled={state.mode !== 'idle'}>Push Front</button>
                <button className="btn" onClick={pushBack} disabled={state.mode !== 'idle'}>Push Back</button>
                <button className="btn red" onClick={popFront} disabled={state.mode !== 'idle'}>Pop Front</button>
                <button className="btn red" onClick={popBack} disabled={state.mode !== 'idle'}>Pop Back</button>
              </div>
            </div>

            {/* Index Operations */}
            <div className="ops-group">
              <h3>Specific Index</h3>
              <div className="inputs">
                <div className="input-wrapper"><label>Value</label><input type="number" value={insertVal} onChange={e=>setInsertVal(e.target.value)}/></div>
                <div className="input-wrapper"><label>Index</label><input type="number" value={insertIdx} onChange={e=>setInsertIdx(e.target.value)}/></div>
              </div>
              <div className="btn-grid">
                <button className="btn blue" onClick={insertAtIndex} disabled={state.mode !== 'idle'}>Insert at Index</button>
                <button className="btn red" onClick={deleteAtIndex} disabled={state.mode !== 'idle'}>Delete at Index</button>
              </div>
            </div>

          </div>
        </div>

      </div>
    </>
  );
}