import React, { useState, useRef, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Center, Text, RoundedBox, Environment, Float, Html, ContactShadows } from '@react-three/drei';
import * as THREE from 'three';

// ==========================================
// 1. EMBEDDED CSS (Fixes layout issues)
// ==========================================
const styles = `
  .twosum-container { width: 100%; height: 100vh; display: flex; background: #fff; font-family: 'Inter', sans-serif; overflow: hidden; }
  
  /* LEFT: 3D PANEL */
  .viz-panel { flex: 1.8; position: relative; background: radial-gradient(circle at center, #f0fdf4 0%, #ffffff 80%); border-right: 1px solid #e5e7eb; display: flex; justify-content: center; align-items: center; }
  
  /* LABELS */
  .shelf-label { position: absolute; top: 10%; left: 50%; transform: translateX(-50%); font-weight: 800; color: #a78bfa; font-size: 1.2rem; text-shadow: 0 2px 10px rgba(167, 139, 250, 0.3); pointer-events: none; }
  .array-label { position: absolute; bottom: 20%; left: 50%; transform: translateX(-50%); font-weight: 800; color: #15803d; font-size: 1.2rem; pointer-events: none; }
  
  /* MATH CARD (Floating Calculation) */
  .math-card {
    background: rgba(17, 24, 39, 0.95); border: 1px solid #3b82f6;
    padding: 1rem 1.5rem; border-radius: 12px;
    color: white; font-family: 'JetBrains Mono', monospace;
    font-size: 0.9rem; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.2);
    min-width: 220px; text-align: center;
    backdrop-filter: blur(10px);
  }
  .math-highlight { color: #60a5fa; font-weight: 800; font-size: 1.1rem; }
  .math-found { color: #f472b6; font-weight: 800; }

  /* RIGHT: CONTROL PANEL */
  .ctrl-panel { flex: 0.8; background: #fff; padding: 2rem; display: flex; flex-direction: column; box-shadow: -5px 0 20px rgba(0,0,0,0.03); z-index: 10; overflow-y: auto; }
  
  .header-row { display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem; }
  .back-btn { background: none; border: none; color: #6b7280; font-weight: 600; cursor: pointer; }
  .back-btn:hover { color: #15803d; }
  h2 { font-size: 2rem; font-weight: 800; color: #111827; margin: 0; }

  /* CONSOLE */
  .console { background: #111827; border-radius: 12px; padding: 1.5rem; color: #4ade80; font-family: 'JetBrains Mono', monospace; font-size: 0.85rem; margin-bottom: 1.5rem; box-shadow: inset 0 2px 4px rgba(0,0,0,0.3); min-height: 80px; }
  .cursor { animation: blink 1s infinite; }
  @keyframes blink { 50% { opacity: 0; } }

  /* FORM ELEMENTS */
  .input-group { margin-bottom: 1.5rem; }
  .input-group label { display: block; font-size: 0.8rem; font-weight: 600; color: #4b5563; margin-bottom: 0.5rem; }
  .input-group input { width: 100%; padding: 0.8rem; border: 1px solid #d1d5db; border-radius: 8px; font-family: 'JetBrains Mono', monospace; box-sizing: border-box; }
  
  .btn-row { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
  .btn { width: 100%; padding: 0.8rem; border-radius: 8px; border: none; background: #15803d; color: white; font-weight: 600; cursor: pointer; transition: 0.2s; }
  .btn:hover:not(:disabled) { background: #166534; transform: translateY(-1px); }
  .btn:disabled { background: #9ca3af; cursor: not-allowed; }
  .btn-reset { background: #6b7280; } .btn-reset:hover:not(:disabled) { background: #4b5563; }
`;

// ==========================================
// 2. 3D COMPONENTS
// ==========================================

// --- VISUAL SHELF (The Map) ---
function MapShelf() {
  return (
    <group position={[0, 2.8, -1]}>
      {/* The Platform */}
      <RoundedBox args={[8, 0.2, 2]} radius={0.1}>
        <meshStandardMaterial color="#ddd6fe" transparent opacity={0.3} />
      </RoundedBox>
      <group position={[0, -0.2, 0]}>
         <Text position={[-3.5, 0, 0]} fontSize={0.3} color="#a78bfa" rotation={[-Math.PI/2, 0, 0]}>KEY</Text>
         <Text position={[3.5, 0, 0]} fontSize={0.3} color="#a78bfa" rotation={[-Math.PI/2, 0, 0]}>VALUE</Text>
      </group>
    </group>
  );
}

// --- ARRAY ITEM (Bottom Row) ---
function ArrayNode({ val, idx, state }) {
  const mesh = useRef();
  
  let color = "#e5e7eb"; // Idle Gray
  let yPos = -2; // Default bottom position

  if (state.currentIdx === idx) {
    color = "#3b82f6"; // Active Blue
    yPos = -1.5; // Lift slightly
  } else if (state.foundIndices.includes(idx)) {
    color = "#f59e0b"; // Success Gold
    yPos = -1; // Celebrate jump
  }

  useFrame((_, delta) => {
    if(!mesh.current) return;
    mesh.current.position.y = THREE.MathUtils.lerp(mesh.current.position.y, yPos, delta * 5);
    
    // Spin if found
    if (state.foundIndices.includes(idx)) {
      mesh.current.rotation.y += delta * 3;
    } else {
      mesh.current.rotation.y = THREE.MathUtils.lerp(mesh.current.rotation.y, 0, delta * 5);
    }
  });

  return (
    <group ref={mesh} position={[idx * 1.5 - 3, -2, 0]}>
      <RoundedBox args={[1, 1, 0.2]} radius={0.1} smoothness={4}>
        <meshStandardMaterial color={color} />
      </RoundedBox>
      <Text position={[0,0,0.12]} fontSize={0.4} color="#1f2937" fontWeight={800}>{val}</Text>
      <Text position={[0,-0.8,0]} fontSize={0.2} color="#9ca3af">{idx}</Text>
    </group>
  );
}

// --- MAP ITEM (Top Row) ---
function MapItem({ val, idx, total }) {
  // val is the Number (Key), idx is the Index (Value)
  // We want to animate this appearing
  const group = useRef();
  
  useFrame((_, delta) => {
    // Float gently
    if(group.current) group.current.position.y = 3 + Math.sin(Date.now()/1000 + idx)*0.1;
  });

  return (
    // Distribute them on the shelf
    <group ref={group} position={[(idx * 1.5) - (total * 0.5), 3, 0]}>
      {/* Box Representation */}
      <RoundedBox args={[1.2, 0.8, 0.8]} radius={0.1}>
        <meshStandardMaterial color="#8b5cf6" />
      </RoundedBox>
      
      {/* Text Info */}
      <Text position={[0, 0, 0.42]} fontSize={0.3} color="white" fontWeight={800}>
        {val}:{idx}
      </Text>
      <Html position={[0, -0.6, 0]} center>
        <div style={{color:'#a78bfa', fontSize:'0.6rem', fontFamily:'monospace', fontWeight:'bold'}}>
          mp[{val}]
        </div>
      </Html>
    </group>
  );
}

// --- CALCULATION BUBBLE ---
function MathBubble({ state, target }) {
  if (state.status !== 'running') return null;

  const currentVal = state.currentVal;
  const diff = target - currentVal;
  const found = state.mapData[diff] !== undefined;

  return (
    <Html position={[0, 0.5, 0]} center>
      <div className="math-card">
        <div style={{marginBottom:'8px', opacity:0.7}}>Current: v[{state.currentIdx}] = {currentVal}</div>
        <div style={{fontSize:'0.8rem', color:'#9ca3af'}}>Calculated Diff:</div>
        <div className="math-highlight">{target} - {currentVal} = {diff}</div>
        
        <div style={{marginTop:'12px', borderTop:'1px solid #374151', paddingTop:'8px'}}>
          <span style={{fontSize:'0.8rem'}}>Check Map: </span>
          {found ? (
            <span className="math-found">FOUND {diff}!</span>
          ) : (
            <span style={{color:'#ef4444'}}>Not Found</span>
          )}
        </div>
      </div>
    </Html>
  );
}

// ==========================================
// 3. MAIN LOGIC
// ==========================================
export default function TwoSum({ onBack }) {
  const [nums, setNums] = useState([2, 11, 7, 15]);
  const [target, setTarget] = useState(9);
  
  // Logic State
  const [state, setState] = useState({
    status: 'idle', 
    currentIdx: null,
    currentVal: null,
    mapData: {}, // { key: index }
    foundIndices: [],
  });
  const [log, setLog] = useState("Algorithm Ready. O(N) Approach.");

  const sleep = (ms) => new Promise(r => setTimeout(r, ms));

  // --- THE ALGORITHM ---
  const runTwoSum = async () => {
    if (state.status === 'running') return;
    
    // Reset
    setState({ status: 'running', currentIdx: null, currentVal: null, mapData: {}, foundIndices: [] });
    setLog("Initializing unordered_map<int, int> mp;");
    await sleep(1000);

    const mp = {}; // internal logic helper
    
    for (let i = 0; i < nums.length; i++) {
      const val = nums[i];
      const diff = target - val;

      // 1. Visit Node
      setState(prev => ({ ...prev, currentIdx: i, currentVal: val }));
      setLog(`Visiting index ${i}. Value is ${val}. Need ${diff}.`);
      await sleep(1500); // Wait for user to read math

      // 2. Check Map
      if (mp[diff] !== undefined) {
        setLog(`Found ${diff} in map! Index: ${mp[diff]}.`);
        setLog(`Returning indices {${mp[diff]}, ${i}}`);
        
        // Success State
        setState(prev => ({
          ...prev,
          status: 'found',
          currentIdx: null,
          foundIndices: [mp[diff], i] // Trigger Gold Spin
        }));
        return;
      }

      // 3. Add to Map
      setLog(`${diff} not found. Adding ${val} to map.`);
      mp[val] = i;
      setState(prev => ({
        ...prev,
        mapData: { ...prev.mapData, [val]: i } // Triggers new block on shelf
      }));
      await sleep(1200);
    }

    setLog("No solution found.");
    setState(prev => ({ ...prev, status: 'idle', currentIdx: null }));
  };

  const reset = () => {
    setState({ status: 'idle', currentIdx: null, currentVal: null, mapData: {}, foundIndices: [] });
    setLog("Ready.");
  };

  return (
    <>
      <style>{styles}</style>
      <div className="twosum-container">
        
        {/* LEFT: 3D WORLD */}
        <div className="viz-panel">
          
          <div className="shelf-label">Unordered Map Memory</div>
          <div className="array-label">Input Array (vector&lt;int&gt;)</div>

          <Canvas camera={{ position: [0, 1, 12], fov: 40 }} style={{width:'100%', height:'100%'}}>
            <color attach="background" args={['#ffffff']} />
            <ambientLight intensity={1} />
            <directionalLight position={[5, 10, 5]} intensity={1.5} />
            <Environment preset="city" />

            <Center>
              <group>
                {/* TOP: MAP SHELF */}
                <MapShelf />
                {Object.entries(state.mapData).map(([val, idx], i) => (
                  <MapItem key={val} val={val} idx={idx} total={Object.keys(state.mapData).length} />
                ))}

                {/* BOTTOM: ARRAY */}
                {nums.map((val, i) => (
                   <ArrayNode key={i} val={val} idx={i} state={state} />
                ))}

                {/* MIDDLE: MATH */}
                <MathBubble state={state} target={target} />
              </group>
            </Center>
            
            <ContactShadows position={[0, -3, 0]} opacity={0.4} scale={30} blur={2.5} color="#15803d" />
          </Canvas>
        </div>

        {/* RIGHT: CONTROL PANEL */}
        <div className="ctrl-panel">
          <div className="header-row">
            <button className="back-btn" onClick={onBack}>← Back to Problems</button>
            <h2>Two Sum</h2>
          </div>

          <div className="console">
            <div style={{marginBottom:'0.5rem', borderBottom:'1px solid #374151', paddingBottom:'0.5rem', opacity:0.7}}>
               <span className="dot red"></span> <span className="dot yellow"></span> <span className="dot green"></span> status.log
            </div>
            {log}<span className="cursor">_</span>
          </div>

          <div className="input-group">
             <label>Input Array (comma separated)</label>
             <input 
               type="text" 
               value={nums.join(', ')} 
               onChange={e => setNums(e.target.value.split(',').map(n => parseInt(n.trim()) || 0))}
               disabled={state.status === 'running'}
             />
          </div>

          <div className="input-group">
             <label>Target Value</label>
             <input 
               type="number" 
               value={target} 
               onChange={e => setTarget(parseInt(e.target.value))}
               disabled={state.status === 'running'}
             />
          </div>

          <div className="btn-row">
             <button className="btn" onClick={runTwoSum} disabled={state.status === 'running'}>
               {state.status === 'running' ? 'Running...' : 'Run Algorithm'}
             </button>
             <button className="btn btn-reset" onClick={reset} disabled={state.status === 'running'}>
               Reset
             </button>
          </div>

          <div style={{marginTop:'2rem', padding:'1rem', background:'#f3f4f6', borderRadius:'8px', fontSize:'0.75rem', color:'#374151'}}>
             <strong>C++ Algorithm:</strong>
             <pre style={{margin:'0.5rem 0', fontFamily:'monospace'}}>
{`unordered_map<int,int> mp;
for (int i=0; i<v.size(); i++) {
   int diff = tar - v[i];
   if (mp.find(diff) != mp.end()) {
       return {mp[diff], i};
   }
   mp[v[i]] = i;
}`}
             </pre>
          </div>

        </div>
      </div>
    </>
  );
}