import React, { useState, useRef, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Center, Text, RoundedBox, Environment, ContactShadows, OrbitControls, Line } from '@react-three/drei';
import * as THREE from 'three';

// ==========================================
// 1. STYLES (Green & White Theme)
// ==========================================
const styles = `
  .sort-container { width: 100%; height: 100vh; display: flex; background: #f0fdf4; font-family: 'Inter', sans-serif; overflow: hidden; }
  
  .visual-panel { 
    flex: 2; position: relative; 
    background: radial-gradient(circle at center, #ffffff 0%, #dcfce7 100%); 
    border-right: 1px solid #bbf7d0;
  }

  .scene-status {
    position: absolute; top: 20px; left: 50%; transform: translateX(-50%);
    background: rgba(255, 255, 255, 0.95); padding: 8px 20px; 
    border-radius: 12px; font-weight: 800; color: #15803d;
    border: 2px solid #15803d; font-size: 1rem; z-index: 10;
    box-shadow: 0 4px 15px rgba(21, 128, 61, 0.1);
  }

  .control-panel { 
    flex: 0.8; background: #ffffff; padding: 2rem; display: flex; flex-direction: column; 
    box-shadow: -10px 0 30px rgba(0,0,0,0.05); z-index: 10; color: #1e293b;
    border-left: 1px solid #e2e8f0;
  }

  .header { margin-bottom: 2rem; display: flex; align-items: center; justify-content: space-between; }
  .back-btn { background: none; border: 1px solid #cbd5e1; color: #64748b; padding: 6px 12px; border-radius: 6px; cursor: pointer; transition: 0.2s; }
  .back-btn:hover { border-color: #15803d; color: #15803d; }
  
  .btn-start { 
    padding: 1rem; background: #15803d; color: white; border: none; border-radius: 8px; 
    font-weight: 800; cursor: pointer; font-size: 1rem; text-transform: uppercase; margin-bottom: 1rem;
    transition: transform 0.2s, background 0.2s;
  }
  .btn-start:hover:not(:disabled) { transform: scale(1.02); background: #166534; }
  .btn-start:disabled { background: #cbd5e1; cursor: not-allowed; transform: none; }

  .btn-reset { padding: 0.8rem; background: #f1f5f9; color: #475569; border: 1px solid #cbd5e1; border-radius: 8px; font-weight: 600; cursor: pointer; transition: 0.2s; }
  .btn-reset:hover:not(:disabled) { background: #e2e8f0; }

  .console { 
    background: #1e293b; border-radius: 12px; padding: 1rem; color: #4ade80; 
    font-family: 'JetBrains Mono', monospace; font-size: 0.85rem; margin-top: 1.5rem; 
    min-height: 80px; display: flex; align-items: center; border: 1px solid #334155;
  }
`;

// ==========================================
// 2. 3D COMPONENTS
// ==========================================

function SortCube({ val, pos, status }) {
  const mesh = useRef();
  
  let color = "#15803d"; // Default Dark Green
  let textColor = "white";
  
  if (status === 'active') { color = "#facc15"; textColor = "black"; } // Yellow (Processing)
  if (status === 'merging') { color = "#ef4444"; textColor = "white"; } // Red (Merging)
  if (status === 'sorted') { color = "#86efac"; textColor = "#064e3b"; } // Light Green (Sorted)

  useFrame((state, delta) => {
    if (!mesh.current) return;
    mesh.current.position.lerp(new THREE.Vector3(pos[0], pos[1], pos[2]), delta * 3);
  });

  return (
    <group ref={mesh} position={pos}>
      <RoundedBox args={[0.7, 0.7, 0.7]} radius={0.1}>
        <meshStandardMaterial color={color} roughness={0.2} metalness={0.2} />
      </RoundedBox>
      <Text position={[0, 0, 0.45]} fontSize={0.35} color={textColor} fontWeight="bold">
        {val}
      </Text>
    </group>
  );
}

// Draw lines connecting Parent -> Children
function ConnectorLines({ lines }) {
  return (
    <group>
      {lines.map((line, i) => (
         <Line 
            key={i} 
            points={[line.start, line.end]} 
            color="#94a3b8" 
            lineWidth={2} 
            transparent 
            opacity={0.4} 
         />
      ))}
    </group>
  );
}

// ==========================================
// 3. MAIN LOGIC (ENHANCED RECURSION)
// ==========================================
export default function MergeSortTree({ onBack }) {
  const initialArray = [8, 3, 5, 4, 7, 6, 1, 2];
  
  // Nodes State
  const [visualNodes, setVisualNodes] = useState(
    initialArray.map((val, i) => ({
      id: i,
      val: val,
      x: (i - 3.5) * 0.9, 
      y: 4, 
      status: 'default'
    }))
  );

  // Lines State (Connecting Arrows)
  const [lines, setLines] = useState([]);

  const [log, setLog] = useState("Ready to Divide & Conquer.");
  const [isBusy, setIsBusy] = useState(false);
  const nodesRef = useRef(visualNodes);
  const linesRef = useRef([]);

  const sleep = (ms) => new Promise(r => setTimeout(r, ms));

  const refreshView = () => {
    setVisualNodes([...nodesRef.current]);
  };
  const refreshLines = () => {
    setLines([...linesRef.current]);
  };

  const runMergeSort = async () => {
    if (isBusy) return;
    setIsBusy(true);
    setLog("Starting Recursive Merge Sort...");
    
    let indices = initialArray.map((_, i) => i);
    
    // Start recursion at depth 0, y=4
    await recursiveSplit(indices, 0, 0, 4); 

    setLog("Sort Complete. Array Fully Merged.");
    setIsBusy(false);
  };

  const recursiveSplit = async (indices, depth, centerX, startY) => {
    // 1. BASE CASE: Single Element
    if (indices.length <= 1) {
        const node = nodesRef.current.find(n => n.id === indices[0]);
        node.status = 'sorted'; // Turn Green
        refreshView();
        
        setLog(`Single Element [${node.val}] reached.`);
        await sleep(600); 
        
        setLog(`[${node.val}] is trivially sorted.`);
        await sleep(600);
        return indices;
    }

    setLog(`Splitting Group of ${indices.length}...`);

    // 2. CALCULATE SPLIT POSITIONS
    const mid = Math.floor(indices.length / 2);
    const leftIndices = indices.slice(0, mid);
    const rightIndices = indices.slice(mid);

    const nextY = startY - 2.0; 
    const offset = Math.max(1.2, 5.0 / (depth + 1.5)); 

    // 3. DRAW LINES (ARROWS) FROM PARENT CENTER TO NEW CHILD CENTERS
    const leftCenterX = centerX - offset;
    const rightCenterX = centerX + offset;

    // Push lines to visual state
    linesRef.current.push({ start: [centerX, startY - 0.5, 0], end: [leftCenterX, nextY + 0.5, 0] });
    linesRef.current.push({ start: [centerX, startY - 0.5, 0], end: [rightCenterX, nextY + 0.5, 0] });
    refreshLines();

    // 4. MOVE NODES DOWN (VISUAL SPLIT)
    // Left Group
    leftIndices.forEach((id, i) => {
       const node = nodesRef.current.find(n => n.id === id);
       node.y = nextY;
       node.x = leftCenterX + (i - (leftIndices.length-1)/2) * 0.8;
       node.status = 'active';
    });
    // Right Group
    rightIndices.forEach((id, i) => {
       const node = nodesRef.current.find(n => n.id === id);
       node.y = nextY;
       node.x = rightCenterX + (i - (rightIndices.length-1)/2) * 0.8;
       node.status = 'default';
    });

    refreshView();
    await sleep(1000); // Pause to see the tree structure forming

    // 5. RECURSION STEP (The "Magic")
    setLog(`Recursing Left...`);
    const sortedLeftIds = await recursiveSplit(leftIndices, depth + 1, leftCenterX, nextY);

    setLog(`Recursing Right...`);
    const sortedRightIds = await recursiveSplit(rightIndices, depth + 1, rightCenterX, nextY);

    // 6. MERGE STEP (Coming back up)
    setLog(`Merging Left & Right sorted groups...`);
    
    // Remove the specific lines that pointed to these children (cleanup)
    // In a complex viz we might leave them, but cleaning keeps it readable
    linesRef.current = linesRef.current.filter(l => 
        !(l.end[0] === leftCenterX && l.end[1] === nextY + 0.5) &&
        !(l.end[0] === rightCenterX && l.end[1] === nextY + 0.5)
    );
    refreshLines();

    let mergedIds = [];
    let l = 0, r = 0;

    // Comparison Animation Loop
    while (l < sortedLeftIds.length && r < sortedRightIds.length) {
        const nodeL = nodesRef.current.find(n => n.id === sortedLeftIds[l]);
        const nodeR = nodesRef.current.find(n => n.id === sortedRightIds[r]);

        nodeL.status = 'merging';
        nodeR.status = 'merging';
        refreshView();
        
        setLog(`Comparing ${nodeL.val} vs ${nodeR.val}`);
        await sleep(800); // Slow down comparison

        if (nodeL.val <= nodeR.val) {
            mergedIds.push(sortedLeftIds[l++]);
            setLog(`${nodeL.val} is smaller. Adding to list.`);
        } else {
            mergedIds.push(sortedRightIds[r++]);
            setLog(`${nodeR.val} is smaller. Adding to list.`);
        }
    }
    while (l < sortedLeftIds.length) mergedIds.push(sortedLeftIds[l++]);
    while (r < sortedRightIds.length) mergedIds.push(sortedRightIds[r++]);

    // 7. MOVE UP (ASSEMBLE SORTED)
    mergedIds.forEach((id, i) => {
        const node = nodesRef.current.find(n => n.id === id);
        node.y = startY; // Go back up to parent level
        node.x = centerX + (i - (mergedIds.length - 1) / 2) * 0.9;
        node.status = 'sorted';
    });

    refreshView();
    await sleep(1000); 

    return mergedIds;
  };

  const handleReset = () => {
    const reset = initialArray.map((val, i) => ({
      id: i,
      val: val,
      x: (i - 3.5) * 0.9,
      y: 4,
      status: 'default'
    }));
    nodesRef.current = reset;
    setVisualNodes(reset);
    
    linesRef.current = [];
    setLines([]);
    
    setLog("Reset.");
    setIsBusy(false);
  };

  return (
    <>
      <style>{styles}</style>
      <div className="sort-container">
        
        {/* LEFT: 3D VIZ */}
        <div className="visual-panel">
          <div className="scene-status">Recursive Merge Tree</div>
          
          
          <Canvas camera={{ position: [0, 1, 15], fov: 45 }}>
            <ambientLight intensity={1.5} />
            <spotLight position={[5, 10, 5]} intensity={1.5} />
            <Environment preset="city" />
            <OrbitControls enableZoom={true} />
            <Center>
              <group>
                {/* NODES */}
                {visualNodes.map((node) => (
                  <SortCube 
                    key={node.id} 
                    val={node.val} 
                    pos={[node.x, node.y, 0]} 
                    status={node.status}
                  />
                ))}
                
                {/* CONNECTOR LINES */}
                <ConnectorLines lines={lines} />
              </group>
            </Center>
            <ContactShadows position={[0, -6, 0]} opacity={0.3} scale={30} blur={2} />
          </Canvas>
        </div>

        {/* RIGHT: CONTROLS */}
        <div className="control-panel">
          <div className="header">
            <h2>Recursion</h2>
            <button className="back-btn" onClick={onBack}>← Back</button>
          </div>

          <button className="btn-start" onClick={runMergeSort} disabled={isBusy}>
            Visualize Flow
          </button>
          
          <button className="btn-reset" onClick={handleReset} disabled={isBusy}>
            Reset
          </button>

          <div className="console">
              {log}
          </div>
          
          <div style={{marginTop: 'auto', color: '#64748b', fontSize: '0.8rem'}}>
            <strong>Visual Guide:</strong><br/>
            1. <strong>Yellow/Lines:</strong> Dividing down the tree.<br/>
            2. <strong>Light Green:</strong> Base case (Single item is sorted).<br/>
            3. <strong>Red:</strong> Comparing values to merge.<br/>
            4. <strong>Moves Up:</strong> Merged & Sorted segment returns to parent level.
          </div>

        </div>

      </div>
    </>
  );
}