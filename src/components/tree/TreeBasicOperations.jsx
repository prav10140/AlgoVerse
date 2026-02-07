import React, { useState, useRef, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Center, Text, Sphere, Line, Environment, ContactShadows, Html } from '@react-three/drei';
import * as THREE from 'three';

// ==========================================
// 1. STYLES
// ==========================================
const styles = `
  .tree-container { width: 100%; height: 100vh; display: flex; background: #fff; font-family: 'Inter', sans-serif; overflow: hidden; }
  
  .visual-panel { 
    flex: 2; position: relative; 
    background: radial-gradient(circle at center, #f0f9ff 0%, #c4b5fd 100%); 
    border-right: 1px solid #cbd5e1;
  }

  /* 3D Scene Status */
  .scene-status {
    position: absolute; top: 20px; left: 50%; transform: translateX(-50%);
    background: rgba(255, 255, 255, 0.9); padding: 8px 16px; 
    border-radius: 12px; font-weight: 800; color: #4f46e5;
    box-shadow: 0 4px 15px rgba(0,0,0,0.1); font-size: 1rem;
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
  .input-row { display: flex; gap: 10px; margin-bottom: 1rem; }
  .tree-input { 
    flex: 1; padding: 0.8rem; border: 2px solid #e2e8f0; border-radius: 8px; 
    font-size: 1rem; outline: none; transition: 0.2s; text-align: center;
  }
  .tree-input:focus { border-color: #4f46e5; }
  
  .btn-act { padding: 0.8rem 1.2rem; background: #4f46e5; color: white; border: none; border-radius: 8px; font-weight: 700; cursor: pointer; transition: 0.2s; }
  .btn-act:hover:not(:disabled) { background: #4338ca; transform: translateY(-2px); }
  .btn-act:disabled { background: #cbd5e1; cursor: not-allowed; }

  .ops-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 1.5rem; }
  .btn-op { padding: 0.8rem; border: none; border-radius: 8px; font-weight: 600; cursor: pointer; color: white; transition: 0.2s; font-size: 0.85rem; }
  .btn-search { background: #f59e0b; } .btn-search:hover:not(:disabled) { background: #d97706; }
  .btn-reset { background: #64748b; } .btn-reset:hover:not(:disabled) { background: #475569; }

  .console { 
    background: #1e293b; border-radius: 12px; padding: 1rem; color: #4ade80; 
    font-family: 'JetBrains Mono', monospace; font-size: 0.85rem; margin-bottom: 1rem; 
    min-height: 60px; display: flex; align-items: center; border: 1px solid #334155;
  }

  .code-box {
    margin-top: auto; background: #0f172a; padding: 1rem; border-radius: 12px;
    font-family: 'JetBrains Mono', monospace; font-size: 0.75rem; color: #94a3b8;
    border: 1px solid #334155; box-shadow: inset 0 2px 4px rgba(0,0,0,0.3);
  }
  .code-title { display: block; font-size: 0.7rem; font-weight: 700; color: #64748b; text-transform: uppercase; margin-bottom: 0.5rem; border-bottom: 1px solid #1e293b; padding-bottom: 4px; }
  .code-line { display: block; padding: 2px 6px; border-radius: 4px; }
  .code-line.active { background: #10b981; color: #fff; font-weight: 700; }
`;

// ==========================================
// 2. 3D COMPONENTS
// ==========================================

function TreeNode({ val, pos, status }) {
  const mesh = useRef();
  
  // Status Colors
  let color = "#3b82f6"; // Default Blue
  if (status === 'visited') color = "#f59e0b"; // Orange (Searching)
  if (status === 'found') color = "#10b981";   // Green (Found/Inserted)
  
  useFrame((state, delta) => {
    if (!mesh.current) return;
    // Smooth lerp to position
    mesh.current.position.lerp(pos, delta * 5); 
  });

  return (
    <group ref={mesh} position={pos}>
      <Sphere args={[0.7, 32, 32]}> {/* Increased size from 0.6 to 0.7 */}
        <meshStandardMaterial color={color} roughness={0.1} metalness={0.1} />
      </Sphere>
      {/* Text pushed slightly forward z=0.8 to avoid clipping */}
      <Text position={[0, 0, 0.8]} fontSize={0.4} color="white" anchorX="center" anchorY="middle" fontWeight="bold">
        {val}
      </Text>
    </group>
  );
}

function TreeEdge({ start, end }) {
  // Use Drei Line for better visibility
  return (
    <Line 
      points={[start, end]} 
      color="#64748b" 
      lineWidth={3} 
      transparent 
      opacity={0.5} 
    />
  );
}

// ==========================================
// 3. MAIN LOGIC (BST)
// ==========================================
export default function TreeBasicOperations({ onBack }) {
  // Initialize with a default tree so it's not empty!
  const [nodes, setNodes] = useState([
      { id: 1, val: 10, x: 0, y: 3, parentId: null },
      { id: 2, val: 5, x: -3, y: 1.5, parentId: 1 },
      { id: 3, val: 15, x: 3, y: 1.5, parentId: 1 }
  ]);
  
  const [inputValue, setInputValue] = useState("");
  const [log, setLog] = useState("Binary Search Tree Initialized.");
  const [activeLine, setActiveLine] = useState(0);
  const [isBusy, setIsBusy] = useState(false);
  const [highlightedNode, setHighlightedNode] = useState(null); 
  const [foundNode, setFoundNode] = useState(null); 

  const sleep = (ms) => new Promise(r => setTimeout(r, ms));

  // --- LAYOUT LOGIC ---
  const calculatePosition = (val, currentNodes) => {
    if (currentNodes.length === 0) return { x: 0, y: 3, parentId: null };

    let curr = currentNodes[0]; // Root is always index 0
    let x = 0;
    let y = 3;
    let width = 6; // Initial width spread

    while (true) {
      y -= 1.5; // Move down
      width /= 1.8; // Decrease spread

      if (val < curr.val) {
        x -= width;
        const leftChild = currentNodes.find(n => n.parentId === curr.id && n.val < curr.val);
        if (!leftChild) return { x, y, parentId: curr.id };
        curr = leftChild;
      } else {
        x += width;
        const rightChild = currentNodes.find(n => n.parentId === curr.id && n.val > curr.val);
        if (!rightChild) return { x, y, parentId: curr.id };
        curr = rightChild;
      }
    }
  };

  // --- INSERT ---
  const handleInsert = async () => {
    if (!inputValue.trim()) return;
    const val = parseInt(inputValue);
    
    if (nodes.find(n => n.val === val)) {
        setLog(`Value ${val} already exists!`);
        return;
    }

    setIsBusy(true);
    setLog(`Inserting ${val}...`);
    setActiveLine(1); 

    // 1. Trace Path
    let curr = nodes.length > 0 ? nodes[0] : null;
    
    if (curr) {
        while (true) {
            setHighlightedNode(curr.id);
            setActiveLine(2); 
            await sleep(400);

            if (val < curr.val) {
                const left = nodes.find(n => n.parentId === curr.id && n.val < curr.val);
                if (!left) break;
                curr = left;
            } else {
                const right = nodes.find(n => n.parentId === curr.id && n.val > curr.val);
                if (!right) break;
                curr = right;
            }
        }
    }

    // 2. Add Node
    const pos = calculatePosition(val, nodes);
    const newNode = { 
        id: Date.now(), 
        val: val, 
        x: pos.x, 
        y: pos.y, 
        parentId: pos.parentId 
    };

    setNodes(prev => [...prev, newNode]);
    setHighlightedNode(newNode.id); 
    setFoundNode(newNode.id); 
    setLog(`Inserted ${val}.`);
    setInputValue("");
    setActiveLine(0);

    await sleep(800);
    setHighlightedNode(null);
    setFoundNode(null);
    setIsBusy(false);
  };

  // --- SEARCH ---
  const handleSearch = async () => {
    if (!inputValue.trim()) return;
    const val = parseInt(inputValue);
    setIsBusy(true);
    setLog(`Searching for ${val}...`);
    setFoundNode(null);

    let curr = nodes.length > 0 ? nodes[0] : null;

    if (!curr) {
        setLog("Tree is empty.");
        setIsBusy(false);
        return;
    }

    while (curr) {
        setHighlightedNode(curr.id);
        await sleep(600);

        if (curr.val === val) {
            setFoundNode(curr.id);
            setLog(`Found ${val}!`);
            await sleep(1000);
            setHighlightedNode(null);
            setFoundNode(null);
            setIsBusy(false);
            return;
        }

        if (val < curr.val) {
            setLog(`${val} < ${curr.val} -> Go Left`);
            curr = nodes.find(n => n.parentId === curr.id && n.val < curr.val);
        } else {
            setLog(`${val} > ${curr.val} -> Go Right`);
            curr = nodes.find(n => n.parentId === curr.id && n.val > curr.val);
        }
    }

    setLog(`${val} not found.`);
    setHighlightedNode(null);
    setIsBusy(false);
  };

  const handleReset = () => {
    setNodes([]); // Clear all
    setLog("Tree cleared.");
    setHighlightedNode(null);
    setFoundNode(null);
  };

  return (
    <>
      <style>{styles}</style>
      <div className="tree-container">
        
        {/* LEFT: 3D VIZ */}
        <div className="visual-panel">
          
          <div className="scene-status">BST Visualizer</div>

          <Canvas camera={{ position: [0, 1, 10], fov: 50 }}> {/* Adjusted Camera */}
            <ambientLight intensity={1.5} />
            <spotLight position={[5, 10, 5]} intensity={2} />
            <Environment preset="city" />
            
            <group position={[0, 0, 0]}>
                {/* NODES */}
                {nodes.map((node) => {
                    let status = 'normal';
                    if (node.id === highlightedNode) status = 'visited';
                    if (node.id === foundNode) status = 'found';

                    return (
                        <TreeNode 
                            key={node.id} 
                            val={node.val} 
                            pos={new THREE.Vector3(node.x, node.y, 0)} 
                            status={status}
                        />
                    );
                })}

                {/* EDGES */}
                {nodes.map((node) => {
                    if (!node.parentId) return null;
                    const parent = nodes.find(n => n.id === node.parentId);
                    if (!parent) return null;

                    return (
                        <TreeEdge 
                            key={`edge-${node.id}`} 
                            start={new THREE.Vector3(parent.x, parent.y, 0)} 
                            end={new THREE.Vector3(node.x, node.y, 0)} 
                        />
                    );
                })}
            </group>
            
            <ContactShadows position={[0, -4, 0]} opacity={0.4} scale={30} blur={2} />
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

          <div className="input-row">
             <input 
               className="tree-input" 
               type="number" 
               placeholder="Enter Value" 
               value={inputValue}
               onChange={(e) => setInputValue(e.target.value)}
             />
             <button className="btn-act" onClick={handleInsert} disabled={isBusy}>Insert</button>
          </div>

          <div className="ops-grid">
             <button className="btn-op btn-search" onClick={handleSearch} disabled={isBusy}>Search</button>
             <button className="btn-op btn-reset" onClick={handleReset} disabled={isBusy}>Clear Tree</button>
          </div>

          <div className="console">
             {log}
          </div>

          <div className="code-box">
            <span className="code-title">BST Logic</span>
            <span className={`code-line ${activeLine === 1 ? 'active' : ''}`}>insert(node, val) &#123;</span>
            <span className={`code-line ${activeLine === 2 ? 'active' : ''}`}>&nbsp;&nbsp;if (val &lt; node.val)</span>
            <span className={`code-line ${activeLine === 3 ? 'active' : ''}`}>&nbsp;&nbsp;&nbsp;&nbsp;left = insert(left, val)</span>
            <span className={`code-line ${activeLine === 4 ? 'active' : ''}`}>&nbsp;&nbsp;else</span>
            <span className={`code-line ${activeLine === 5 ? 'active' : ''}`}>&nbsp;&nbsp;&nbsp;&nbsp;right = insert(right, val)</span>
            <span className={`code-line ${activeLine === 6 ? 'active' : ''}`}>&#125;</span>
          </div>

        </div>

      </div>
    </>
  );
}