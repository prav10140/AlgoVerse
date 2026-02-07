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
    background: radial-gradient(circle at center, #f0f9ff 0%, #a5b4fc 100%); 
    border-right: 1px solid #cbd5e1;
  }

  .scene-status {
    position: absolute; top: 20px; left: 50%; transform: translateX(-50%);
    background: rgba(255, 255, 255, 0.95); padding: 8px 16px; 
    border-radius: 12px; font-weight: 800; color: #4f46e5;
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

  .ops-grid { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 8px; margin-bottom: 1.5rem; }
  .btn-op { padding: 0.8rem; border: none; border-radius: 8px; font-weight: 700; cursor: pointer; color: white; transition: 0.2s; font-size: 0.8rem; }
  .btn-in { background: #3b82f6; } .btn-in:hover:not(:disabled) { background: #2563eb; }
  .btn-pre { background: #8b5cf6; } .btn-pre:hover:not(:disabled) { background: #7c3aed; }
  .btn-post { background: #f59e0b; } .btn-post:hover:not(:disabled) { background: #d97706; }
  .btn-reset { grid-column: span 3; background: #64748b; margin-top: 5px; } 

  .btn-op:disabled { opacity: 0.6; cursor: not-allowed; }

  .console { 
    background: #1e293b; border-radius: 12px; padding: 1rem; color: #4ade80; 
    font-family: 'JetBrains Mono', monospace; font-size: 0.85rem; margin-bottom: 1rem; 
    min-height: 60px; display: flex; align-items: center; border: 1px solid #334155;
  }

  /* OUTPUT SEQUENCE BOX */
  .sequence-box {
    background: #f1f5f9; padding: 1rem; border-radius: 8px; margin-bottom: 1.5rem;
    border-left: 4px solid #4f46e5; min-height: 40px; display: flex; align-items: center;
    font-family: monospace; color: #1e293b; font-weight: 600; flex-wrap: wrap; gap: 5px;
  }
  .seq-badge { background: #e2e8f0; padding: 2px 6px; border-radius: 4px; }

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
// 2. 3D COMPONENTS (BIGGER NODES)
// ==========================================

function TreeNode({ val, pos, status }) {
  const mesh = useRef();
  
  let color = "#3b82f6"; // Default
  let scale = 1;

  if (status === 'visiting') { color = "#f59e0b"; scale = 1.2; } // Orange visiting
  if (status === 'processed') { color = "#10b981"; } // Green done

  useFrame((state, delta) => {
    if (!mesh.current) return;
    mesh.current.scale.lerp(new THREE.Vector3(scale, scale, scale), delta * 5);
  });

  return (
    <group ref={mesh} position={pos}>
      {/* Increased Sphere Size to 0.9 */}
      <Sphere args={[0.9, 32, 32]}> 
        <meshStandardMaterial color={color} roughness={0.1} metalness={0.1} />
      </Sphere>
      <Text position={[0, 0, 1]} fontSize={0.5} color="white" anchorX="center" anchorY="middle" fontWeight="bold">
        {val}
      </Text>
    </group>
  );
}

function TreeEdge({ start, end }) {
  return (
    <Line 
      points={[start, end]} 
      color="#475569" 
      lineWidth={4} 
      transparent 
      opacity={0.4} 
    />
  );
}

// ==========================================
// 3. MAIN LOGIC
// ==========================================
export default function TreeTraversals({ onBack }) {
  // Hardcoded Perfect Tree for Traversal Demo
  //        10
  //      /    \
  //     5      15
  //    / \    /  \
  //   3   7  12  18
  const initialNodes = [
      { id: 1, val: 10, x: 0, y: 4, parentId: null, left: 2, right: 3 },
      { id: 2, val: 5, x: -4, y: 1.5, parentId: 1, left: 4, right: 5 },
      { id: 3, val: 15, x: 4, y: 1.5, parentId: 1, left: 6, right: 7 },
      { id: 4, val: 3, x: -6, y: -1, parentId: 2, left: null, right: null },
      { id: 5, val: 7, x: -2, y: -1, parentId: 2, left: null, right: null },
      { id: 6, val: 12, x: 2, y: -1, parentId: 3, left: null, right: null },
      { id: 7, val: 18, x: 6, y: -1, parentId: 3, left: null, right: null },
  ];

  const [activeNode, setActiveNode] = useState(null);
  const [processedNodes, setProcessedNodes] = useState([]); // IDs
  const [sequence, setSequence] = useState([]); // Values
  const [isBusy, setIsBusy] = useState(false);
  const [log, setLog] = useState("Select a Traversal Strategy.");
  const [activeLine, setActiveLine] = useState(0);
  const [codeType, setCodeType] = useState('inorder');

  const sleep = (ms) => new Promise(r => setTimeout(r, ms));

  // --- TRAVERSAL ALGORITHMS ---

  const animateVisit = async (nodeId) => {
      setActiveNode(nodeId);
      await sleep(600);
      setProcessedNodes(prev => [...prev, nodeId]);
      const nodeVal = initialNodes.find(n => n.id === nodeId).val;
      setSequence(prev => [...prev, nodeVal]);
      await sleep(300);
  };

  // INORDER: Left -> Root -> Right
  const handleInorder = async () => {
    setIsBusy(true);
    setProcessedNodes([]);
    setSequence([]);
    setLog("Starting Inorder Traversal (Left -> Root -> Right)");
    setCodeType('inorder');

    const traverse = async (nodeId) => {
        if (!nodeId) return;
        const node = initialNodes.find(n => n.id === nodeId);
        
        setActiveLine(1); // recurse left
        await traverse(node.left);

        setActiveLine(2); // process root
        await animateVisit(node.id);

        setActiveLine(3); // recurse right
        await traverse(node.right);
    };

    await traverse(1); // Start at root
    setLog("Inorder Traversal Complete.");
    setActiveNode(null);
    setIsBusy(false);
  };

  // PREORDER: Root -> Left -> Right
  const handlePreorder = async () => {
    setIsBusy(true);
    setProcessedNodes([]);
    setSequence([]);
    setLog("Starting Preorder Traversal (Root -> Left -> Right)");
    setCodeType('preorder');

    const traverse = async (nodeId) => {
        if (!nodeId) return;
        const node = initialNodes.find(n => n.id === nodeId);
        
        setActiveLine(1); // process root
        await animateVisit(node.id);

        setActiveLine(2); // recurse left
        await traverse(node.left);

        setActiveLine(3); // recurse right
        await traverse(node.right);
    };

    await traverse(1);
    setLog("Preorder Traversal Complete.");
    setActiveNode(null);
    setIsBusy(false);
  };

  // POSTORDER: Left -> Right -> Root
  const handlePostorder = async () => {
    setIsBusy(true);
    setProcessedNodes([]);
    setSequence([]);
    setLog("Starting Postorder Traversal (Left -> Right -> Root)");
    setCodeType('postorder');

    const traverse = async (nodeId) => {
        if (!nodeId) return;
        const node = initialNodes.find(n => n.id === nodeId);
        
        setActiveLine(1); // recurse left
        await traverse(node.left);

        setActiveLine(2); // recurse right
        await traverse(node.right);

        setActiveLine(3); // process root
        await animateVisit(node.id);
    };

    await traverse(1);
    setLog("Postorder Traversal Complete.");
    setActiveNode(null);
    setIsBusy(false);
  };

  const handleReset = () => {
      setProcessedNodes([]);
      setSequence([]);
      setActiveNode(null);
      setLog("Tree Reset.");
      setIsBusy(false);
      setActiveLine(0);
  };

  return (
    <>
      <style>{styles}</style>
      <div className="tree-container">
        
        {/* LEFT: 3D VIZ */}
        <div className="visual-panel">
          <div className="scene-status">Tree Traversal</div>
          
          <Canvas camera={{ position: [0, 2, 14], fov: 45 }}> {/* Positioned to fit wide tree */}
            <ambientLight intensity={1.5} />
            <spotLight position={[5, 10, 5]} intensity={2} />
            <Environment preset="city" />
            
            <Center>
            <group position={[0, 0.5, 0]}>
                {/* NODES */}
                {initialNodes.map((node) => {
                    let status = 'normal';
                    if (node.id === activeNode) status = 'visiting';
                    if (processedNodes.includes(node.id)) status = 'processed';

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
                {initialNodes.map((node) => {
                    if (!node.parentId) return null;
                    const parent = initialNodes.find(n => n.id === node.parentId);
                    return (
                        <TreeEdge 
                            key={`edge-${node.id}`} 
                            start={new THREE.Vector3(parent.x, parent.y, 0)} 
                            end={new THREE.Vector3(node.x, node.y, 0)} 
                        />
                    );
                })}
            </group>
            </Center>
            
            <ContactShadows position={[0, -4, 0]} opacity={0.4} scale={40} blur={2} />
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

          <div className="ops-grid">
             <button className="btn-op btn-in" onClick={handleInorder} disabled={isBusy}>Inorder</button>
             <button className="btn-op btn-pre" onClick={handlePreorder} disabled={isBusy}>Preorder</button>
             <button className="btn-op btn-post" onClick={handlePostorder} disabled={isBusy}>Postorder</button>
             <button className="btn-op btn-reset" onClick={handleReset} disabled={isBusy}>Reset</button>
          </div>

          <div className="console">
              {log}
          </div>

          <div className="sequence-box">
             Output: 
             {sequence.map((val, i) => (
                 <span key={i} className="seq-badge">{val}</span>
             ))}
          </div>

          <div className="code-box">
            <span className="code-title">Recursive Logic ({codeType.toUpperCase()})</span>
            {codeType === 'inorder' && (
                <>
                <span className={`code-line ${activeLine === 1 ? 'active' : ''}`}>inorder(root.left);</span>
                <span className={`code-line ${activeLine === 2 ? 'active' : ''}`}>print(root.val);</span>
                <span className={`code-line ${activeLine === 3 ? 'active' : ''}`}>inorder(root.right);</span>
                </>
            )}
            {codeType === 'preorder' && (
                <>
                <span className={`code-line ${activeLine === 1 ? 'active' : ''}`}>print(root.val);</span>
                <span className={`code-line ${activeLine === 2 ? 'active' : ''}`}>preorder(root.left);</span>
                <span className={`code-line ${activeLine === 3 ? 'active' : ''}`}>preorder(root.right);</span>
                </>
            )}
            {codeType === 'postorder' && (
                <>
                <span className={`code-line ${activeLine === 1 ? 'active' : ''}`}>postorder(root.left);</span>
                <span className={`code-line ${activeLine === 2 ? 'active' : ''}`}>postorder(root.right);</span>
                <span className={`code-line ${activeLine === 3 ? 'active' : ''}`}>print(root.val);</span>
                </>
            )}
          </div>

        </div>

      </div>
    </>
  );
}