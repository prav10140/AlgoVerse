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
  
  // Quick Sort Specific Colors
  if (status === 'pivot') { color = "#9333ea"; textColor = "white"; } // Purple (Pivot)
  if (status === 'left-group') { color = "#3b82f6"; textColor = "white"; } // Blue (Less than pivot)
  if (status === 'right-group') { color = "#f97316"; textColor = "white"; } // Orange (Greater than pivot)
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
// 3. MAIN LOGIC (QUICK SORT TREE)
// ==========================================
export default function QuickSortTree({ onBack }) {
  const initialArray = [8, 3, 5, 4, 7, 6, 1, 2];
  
  const [visualNodes, setVisualNodes] = useState(
    initialArray.map((val, i) => ({
      id: i,
      val: val,
      x: (i - 3.5) * 0.9, 
      y: 4, 
      status: 'default'
    }))
  );

  const [lines, setLines] = useState([]);
  const [log, setLog] = useState("Ready for Quick Sort Partitioning.");
  const [isBusy, setIsBusy] = useState(false);
  
  const nodesRef = useRef(visualNodes);
  const linesRef = useRef([]);

  const sleep = (ms) => new Promise(r => setTimeout(r, ms));

  const refreshView = () => { setVisualNodes([...nodesRef.current]); };
  const refreshLines = () => { setLines([...linesRef.current]); };

  const runQuickSort = async () => {
    if (isBusy) return;
    setIsBusy(true);
    setLog("Starting Recursive Quick Sort...");
    
    // We pass indices to track objects
    let indices = initialArray.map((_, i) => i);
    
    // Recursive call starting at top
    await recursivePartition(indices, 0, 0, 4); 

    setLog("Sort Complete.");
    setIsBusy(false);
  };

  const recursivePartition = async (indices, depth, centerX, startY) => {
    // BASE CASE
    if (indices.length <= 1) {
        if (indices.length === 1) {
            const node = nodesRef.current.find(n => n.id === indices[0]);
            node.status = 'sorted';
            setLog(`[${node.val}] is a single item (sorted).`);
            refreshView();
            await sleep(500);
        }
        return indices; // Return array of IDs
    }

    // 1. SELECT PIVOT (We'll choose the last element for simplicity)
    const pivotId = indices[indices.length - 1];
    const pivotNode = nodesRef.current.find(n => n.id === pivotId);
    pivotNode.status = 'pivot';
    refreshView();
    
    setLog(`Selected Pivot: ${pivotNode.val}`);
    await sleep(800);

    // 2. PARTITION LOGIC (Separate into Left/Right arrays based on Value)
    const leftGroup = [];
    const rightGroup = [];
    
    // Exclude pivot from this loop
    for (let i = 0; i < indices.length - 1; i++) {
        const node = nodesRef.current.find(n => n.id === indices[i]);
        if (node.val < pivotNode.val) {
            leftGroup.push(indices[i]);
            node.status = 'left-group';
        } else {
            rightGroup.push(indices[i]);
            node.status = 'right-group';
        }
    }
    refreshView();
    setLog(`Partitioned: ${leftGroup.length} smaller, ${rightGroup.length} larger.`);
    await sleep(1000);

    // 3. ANIMATE MOVE DOWN (VISUAL SPLIT)
    const nextY = startY - 2.0; 
    const offset = Math.max(1.2, 5.0 / (depth + 1.5)); 

    const leftCenterX = centerX - offset;
    const rightCenterX = centerX + offset;

    // Draw lines only if groups exist
    if (leftGroup.length > 0) {
        linesRef.current.push({ start: [centerX, startY - 0.5, 0], end: [leftCenterX, nextY + 0.5, 0] });
    }
    if (rightGroup.length > 0) {
        linesRef.current.push({ start: [centerX, startY - 0.5, 0], end: [rightCenterX, nextY + 0.5, 0] });
    }
    refreshLines();

    // Move Left Group Down
    leftGroup.forEach((id, i) => {
       const node = nodesRef.current.find(n => n.id === id);
       node.y = nextY;
       node.x = leftCenterX + (i - (leftGroup.length-1)/2) * 0.8;
       node.status = 'default';
    });

    // Move Right Group Down
    rightGroup.forEach((id, i) => {
       const node = nodesRef.current.find(n => n.id === id);
       node.y = nextY;
       node.x = rightCenterX + (i - (rightGroup.length-1)/2) * 0.8;
       node.status = 'default';
    });
    
    // Pivot stays roughly in the middle, maybe drops slightly to bridge the gap
    pivotNode.y = startY; 
    pivotNode.x = centerX; 
    
    refreshView();
    await sleep(1000);

    // 4. RECURSION
    let sortedLeft = [];
    if (leftGroup.length > 0) {
        setLog(`Recursing Left (Items < ${pivotNode.val})...`);
        sortedLeft = await recursivePartition(leftGroup, depth + 1, leftCenterX, nextY);
    }

    let sortedRight = [];
    if (rightGroup.length > 0) {
        setLog(`Recursing Right (Items >= ${pivotNode.val})...`);
        sortedRight = await recursivePartition(rightGroup, depth + 1, rightCenterX, nextY);
    }

    // 5. ASSEMBLE (Back Up)
    // Clean up lines for clarity as we move up
    linesRef.current = linesRef.current.filter(l => 
        !(l.end[0] === leftCenterX && l.end[1] === nextY + 0.5) &&
        !(l.end[0] === rightCenterX && l.end[1] === nextY + 0.5)
    );
    refreshLines();

    setLog(`Assembling: Left + [${pivotNode.val}] + Right`);
    
    // Combine IDs: [...Left, Pivot, ...Right]
    const mergedIds = [...sortedLeft, pivotId, ...sortedRight];
    
    mergedIds.forEach((id, i) => {
        const node = nodesRef.current.find(n => n.id === id);
        node.y = startY; // Move back to parent level
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
          <div className="scene-status">Recursive Quick Sort</div>
          
          
          <Canvas camera={{ position: [0, 1, 16], fov: 45 }}>
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
            <h2>Quick Sort</h2>
            <button className="back-btn" onClick={onBack}>← Back</button>
          </div>

          <button className="btn-start" onClick={runQuickSort} disabled={isBusy}>
            Visualize Partitioning
          </button>
          
          <button className="btn-reset" onClick={handleReset} disabled={isBusy}>
            Reset
          </button>

          <div className="console">
             {log}
          </div>
          
          <div style={{marginTop: 'auto', color: '#64748b', fontSize: '0.8rem'}}>
            <strong>Visual Key:</strong><br/>
            1. <strong>Purple:</strong> The Pivot.<br/>
            2. <strong>Blue:</strong> Values smaller than Pivot.<br/>
            3. <strong>Orange:</strong> Values larger than Pivot.<br/>
            4. <strong>Green:</strong> Sorted segment assembling back up.
          </div>

        </div>

      </div>
    </>
  );
}