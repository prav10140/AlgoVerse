import React, { useState, useRef, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Center, Text, Sphere, Line, Environment, ContactShadows, Html } from '@react-three/drei';
import * as THREE from 'three';

// ==========================================
// 1. STYLES
// ==========================================
const styles = `
  .graph-container { width: 100%; height: 100vh; display: flex; background: #fff; font-family: 'Inter', sans-serif; overflow: hidden; }
  
  .visual-panel { 
    flex: 2; position: relative; 
    background: radial-gradient(circle at center, #f0f9ff 0%, #a5f3fc 100%); 
    border-right: 1px solid #cbd5e1;
  }

  .scene-status {
    position: absolute; top: 20px; left: 50%; transform: translateX(-50%);
    background: rgba(255, 255, 255, 0.95); padding: 8px 16px; 
    border-radius: 12px; font-weight: 800; color: #0891b2;
    box-shadow: 0 4px 15px rgba(0,0,0,0.1); font-size: 1rem; z-index: 10;
  }

  .control-panel { 
    flex: 0.8; background: #fff; padding: 1.5rem; display: flex; flex-direction: column; 
    box-shadow: -10px 0 30px rgba(0,0,0,0.05); z-index: 10; 
  }

  .header { margin-bottom: 1.5rem; display: flex; align-items: center; justify-content: space-between; }
  .back-btn { background: none; border: none; color: #64748b; font-weight: 600; cursor: pointer; display: flex; align-items: center; gap: 6px; font-size: 0.9rem; }
  .back-btn:hover { color: #0f172a; }
  h2 { font-size: 1.5rem; font-weight: 800; color: #1e293b; margin: 0; }

  /* INPUTS */
  .input-group { margin-bottom: 1.5rem; border-bottom: 1px solid #e2e8f0; padding-bottom: 1rem; }
  .input-label { display: block; font-size: 0.75rem; font-weight: 700; color: #64748b; margin-bottom: 0.5rem; }
  .input-row { display: flex; gap: 8px; margin-bottom: 0.5rem; }
  
  .graph-input { 
    flex: 1; padding: 0.6rem; border: 2px solid #e2e8f0; border-radius: 8px; 
    font-size: 0.9rem; outline: none; transition: 0.2s; text-align: center;
  }
  .graph-input:focus { border-color: #06b6d4; }
  
  .btn-add { padding: 0.6rem 1rem; background: #06b6d4; color: white; border: none; border-radius: 8px; font-weight: 700; cursor: pointer; font-size: 0.8rem; }
  .btn-add:hover:not(:disabled) { background: #0891b2; }
  .btn-add:disabled { background: #cbd5e1; cursor: not-allowed; }

  /* TRAVERSAL BUTTONS */
  .ops-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 1.5rem; }
  .btn-op { padding: 0.8rem; border: none; border-radius: 8px; font-weight: 700; cursor: pointer; color: white; transition: 0.2s; }
  .btn-bfs { background: #8b5cf6; } .btn-bfs:hover:not(:disabled) { background: #7c3aed; }
  .btn-dfs { background: #f59e0b; } .btn-dfs:hover:not(:disabled) { background: #d97706; }
  .btn-reset { grid-column: span 2; background: #64748b; } 

  .console { 
    background: #1e293b; border-radius: 12px; padding: 1rem; color: #4ade80; 
    font-family: 'JetBrains Mono', monospace; font-size: 0.85rem; margin-bottom: 1rem; 
    min-height: 80px; display: flex; align-items: center; border: 1px solid #334155;
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

function GraphNode({ id, pos, status }) {
  const mesh = useRef();
  
  let color = "#06b6d4"; // Cyan Default
  let scale = 1;

  if (status === 'visiting') { color = "#f59e0b"; scale = 1.3; } // Orange Active
  if (status === 'visited') { color = "#10b981"; scale = 1.1; }  // Green Done

  useFrame((state, delta) => {
    if (!mesh.current) return;
    mesh.current.scale.lerp(new THREE.Vector3(scale, scale, scale), delta * 5);
  });

  return (
    <group ref={mesh} position={pos}>
      <Sphere args={[0.5, 32, 32]}>
        <meshStandardMaterial color={color} roughness={0.2} metalness={0.5} />
      </Sphere>
      {/* Halo Effect */}
      <Sphere args={[0.6, 32, 32]}>
         <meshBasicMaterial color={color} transparent opacity={0.2} side={THREE.BackSide} />
      </Sphere>
      <Text position={[0, 0, 0.7]} fontSize={0.35} color="white" anchorX="center" anchorY="middle" fontWeight="bold">
        {id}
      </Text>
    </group>
  );
}

function GraphEdge({ start, end, isTraversed }) {
  return (
    <Line 
      points={[start, end]} 
      color={isTraversed ? "#10b981" : "#94a3b8"} // Green if traversed
      lineWidth={isTraversed ? 4 : 2} 
      transparent 
      opacity={isTraversed ? 0.8 : 0.3} 
    />
  );
}

// ==========================================
// 3. MAIN LOGIC
// ==========================================
export default function GraphBasicOperations({ onBack }) {
  // Initial Graph: 0 connected to 1, 2. 1 connected to 3.
  const [nodes, setNodes] = useState([
    { id: 0, x: 0, y: 3 },
    { id: 1, x: -3, y: 0 },
    { id: 2, x: 3, y: 0 },
    { id: 3, x: -2, y: -3 },
    { id: 4, x: 2, y: -3 },
  ]);

  const [edges, setEdges] = useState([
    { u: 0, v: 1 }, { u: 0, v: 2 },
    { u: 1, v: 3 }, { u: 2, v: 4 },
    { u: 3, v: 4 } // Cycle at bottom
  ]);

  // Inputs
  const [nodeInput, setNodeInput] = useState("");
  const [edgeU, setEdgeU] = useState("");
  const [edgeV, setEdgeV] = useState("");

  // Animation State
  const [visited, setVisited] = useState([]); // Array of IDs
  const [activeNode, setActiveNode] = useState(null);
  const [traversedEdges, setTraversedEdges] = useState([]); // Array of strings "u-v"
  const [isBusy, setIsBusy] = useState(false);
  const [log, setLog] = useState("Graph Ready. Nodes: 5, Edges: 5");
  const [activeLine, setActiveLine] = useState(0);
  const [algoType, setAlgoType] = useState('bfs');

  const sleep = (ms) => new Promise(r => setTimeout(r, ms));

  // --- ACTIONS ---

  const addNode = () => {
      if (!nodeInput.trim()) return;
      const id = parseInt(nodeInput);
      if (nodes.find(n => n.id === id)) { setLog(`Node ${id} exists!`); return; }

      // Random position in circle
      const angle = Math.random() * Math.PI * 2;
      const radius = 3 + Math.random() * 2;
      const newNode = {
          id: id,
          x: Math.cos(angle) * radius,
          y: Math.sin(angle) * radius
      };
      setNodes([...nodes, newNode]);
      setNodeInput("");
      setLog(`Added Node ${id}`);
  };

  const addEdge = () => {
      if (!edgeU.trim() || !edgeV.trim()) return;
      const u = parseInt(edgeU);
      const v = parseInt(edgeV);
      
      // Check if nodes exist
      if (!nodes.find(n => n.id === u) || !nodes.find(n => n.id === v)) {
          setLog("Nodes must exist!"); return;
      }
      
      setEdges([...edges, { u, v }]);
      setEdgeU(""); setEdgeV("");
      setLog(`Added Edge ${u}-${v}`);
  };

  // --- TRAVERSALS ---

  const handleBFS = async () => {
      if (nodes.length === 0) return;
      setIsBusy(true);
      setVisited([]);
      setTraversedEdges([]);
      setLog("Starting BFS (Queue-based)...");
      setAlgoType('bfs');

      const startNode = nodes[0].id;
      const queue = [startNode];
      const localVisited = new Set([startNode]);
      const visitedList = [];

      while (queue.length > 0) {
          const curr = queue.shift();
          setActiveNode(curr);
          setActiveLine(1); // Dequeue
          setLog(`Visiting ${curr}...`);
          
          await sleep(800);
          visitedList.push(curr);
          setVisited([...visitedList]);

          // Find neighbors
          const neighbors = edges
            .filter(e => e.u === curr || e.v === curr)
            .map(e => e.u === curr ? e.v : e.u);

          setActiveLine(2); // Check neighbors
          
          for (const neighbor of neighbors) {
              if (!localVisited.has(neighbor)) {
                  localVisited.add(neighbor);
                  queue.push(neighbor);
                  // Mark edge
                  setTraversedEdges(prev => [...prev, `${Math.min(curr, neighbor)}-${Math.max(curr, neighbor)}`]);
                  setActiveLine(3); // Enqueue
                  await sleep(400);
              }
          }
      }
      setActiveNode(null);
      setLog("BFS Complete.");
      setIsBusy(false);
  };

  const handleDFS = async () => {
      if (nodes.length === 0) return;
      setIsBusy(true);
      setVisited([]);
      setTraversedEdges([]);
      setLog("Starting DFS (Stack/Recursion)...");
      setAlgoType('dfs');

      const startNode = nodes[0].id;
      const localVisited = new Set();
      const visitedList = [];

      const dfs = async (curr) => {
          localVisited.add(curr);
          setActiveNode(curr);
          setActiveLine(1); // Visit
          setLog(`Visiting ${curr}...`);
          
          await sleep(800);
          visitedList.push(curr);
          setVisited([...visitedList]);

          const neighbors = edges
            .filter(e => e.u === curr || e.v === curr)
            .map(e => e.u === curr ? e.v : e.u);

          setActiveLine(2); // Loop neighbors

          for (const neighbor of neighbors) {
              if (!localVisited.has(neighbor)) {
                  setTraversedEdges(prev => [...prev, `${Math.min(curr, neighbor)}-${Math.max(curr, neighbor)}`]);
                  setActiveLine(3); // Recurse
                  await dfs(neighbor);
                  // Backtrack visual
                  setActiveNode(curr); 
                  await sleep(400);
              }
          }
      };

      await dfs(startNode);
      setActiveNode(null);
      setLog("DFS Complete.");
      setIsBusy(false);
  };

  const handleReset = () => {
      setVisited([]);
      setActiveNode(null);
      setTraversedEdges([]);
      setLog("Graph Reset.");
      setIsBusy(false);
  };

  return (
    <>
      <style>{styles}</style>
      <div className="graph-container">
        
        {/* LEFT: 3D VIZ */}
        <div className="visual-panel">
          <div className="scene-status">Graph Traversal</div>
          
          <Canvas camera={{ position: [0, 0, 10], fov: 50 }}>
            <ambientLight intensity={1} />
            <spotLight position={[5, 10, 5]} intensity={2} />
            <Environment preset="city" />
            <Center>
            <group>
                {/* NODES */}
                {nodes.map((node) => {
                    let status = 'normal';
                    if (node.id === activeNode) status = 'visiting';
                    else if (visited.includes(node.id)) status = 'visited';

                    return (
                        <GraphNode 
                            key={node.id} 
                            id={node.id} 
                            pos={new THREE.Vector3(node.x, node.y, 0)} 
                            status={status}
                        />
                    );
                })}

                {/* EDGES */}
                {edges.map((edge, i) => {
                    const uNode = nodes.find(n => n.id === edge.u);
                    const vNode = nodes.find(n => n.id === edge.v);
                    if (!uNode || !vNode) return null;
                    
                    const edgeKey = `${Math.min(edge.u, edge.v)}-${Math.max(edge.u, edge.v)}`;
                    const isTraversed = traversedEdges.includes(edgeKey);

                    return (
                        <GraphEdge 
                            key={i} 
                            start={new THREE.Vector3(uNode.x, uNode.y, 0)} 
                            end={new THREE.Vector3(vNode.x, vNode.y, 0)}
                            isTraversed={isTraversed}
                        />
                    );
                })}
            </group>
            </Center>
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

          <div className="input-group">
              <span className="input-label">Add Node</span>
              <div className="input-row">
                  <input className="graph-input" placeholder="ID (e.g. 5)" value={nodeInput} onChange={e => setNodeInput(e.target.value)} />
                  <button className="btn-add" onClick={addNode} disabled={isBusy}>+ Node</button>
              </div>
              <span className="input-label">Add Edge</span>
              <div className="input-row">
                  <input className="graph-input" placeholder="Start ID" value={edgeU} onChange={e => setEdgeU(e.target.value)} />
                  <input className="graph-input" placeholder="End ID" value={edgeV} onChange={e => setEdgeV(e.target.value)} />
                  <button className="btn-add" onClick={addEdge} disabled={isBusy}>+ Edge</button>
              </div>
          </div>

          <div className="ops-grid">
             <button className="btn-op btn-bfs" onClick={handleBFS} disabled={isBusy}>Run BFS</button>
             <button className="btn-op btn-dfs" onClick={handleDFS} disabled={isBusy}>Run DFS</button>
             <button className="btn-op btn-reset" onClick={handleReset} disabled={isBusy}>Reset</button>
          </div>

          <div className="console">
             {log}
          </div>

          <div className="code-box">
            <span className="code-title">{algoType.toUpperCase()} Logic</span>
            {algoType === 'bfs' && (
                <>
                <span className={`code-line ${activeLine === 1 ? 'active' : ''}`}>queue.dequeue();</span>
                <span className={`code-line ${activeLine === 2 ? 'active' : ''}`}>for (neighbor : adj[node])</span>
                <span className={`code-line ${activeLine === 3 ? 'active' : ''}`}>&nbsp;&nbsp;if (!visited) queue.add(neighbor);</span>
                </>
            )}
            {algoType === 'dfs' && (
                <>
                <span className={`code-line ${activeLine === 1 ? 'active' : ''}`}>visit(node);</span>
                <span className={`code-line ${activeLine === 2 ? 'active' : ''}`}>for (neighbor : adj[node])</span>
                <span className={`code-line ${activeLine === 3 ? 'active' : ''}`}>&nbsp;&nbsp;if (!visited) dfs(neighbor);</span>
                </>
            )}
          </div>

        </div>

      </div>
    </>
  );
}