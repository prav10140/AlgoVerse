import React, { useState, useRef, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Center, Text, RoundedBox, Environment, ContactShadows, OrbitControls } from '@react-three/drei';
import * as THREE from 'three';

// ==========================================
// C++ SOLUTION CODE
// ==========================================
const cppCode = `class Solution {
public:
    void setZeroes(vector<vector<int>>& matrix) {
        bool zeroinFirstCol = false;
        for (int row = 0; row < matrix.size(); row++) {
            if (matrix[row][0] == 0) zeroinFirstCol = true;
            for (int col = 1; col < matrix[0].size(); col++) {
                if (matrix[row][col] == 0) {
                    matrix[row][0] = 0;
                    matrix[0][col] = 0;
                }
            }
        }

        for (int row = matrix.size() - 1; row >= 0; row--) {
            for (int col = matrix[0].size() - 1; col >= 1; col--) {
                if (matrix[row][0] == 0 || matrix[0][col] == 0) {
                    matrix[row][col] = 0;
                }
            }
            if (zeroinFirstCol) {
                matrix[row][0] = 0;
            }
        }
    }
};`;

// ==========================================
// 1. GREEN & WHITE THEME STYLES
// ==========================================
const styles = `
  .viz-container { width: 100%; height: 100vh; display: flex; background: #f0fdf4; font-family: 'Inter', sans-serif; overflow: hidden; }
  
  .visual-panel { 
    flex: 2; position: relative; 
    background: radial-gradient(circle at center, #ffffff 0%, #dcfce7 100%); 
    border-right: 1px solid #bbf7d0;
  }

  .scene-status {
    position: absolute; top: 30px; left: 50%; transform: translateX(-50%);
    background: rgba(255, 255, 255, 0.95); padding: 8px 24px; 
    border-radius: 12px; font-weight: 800; color: #15803d;
    box-shadow: 0 4px 15px rgba(21, 128, 61, 0.1); font-size: 1.2rem; z-index: 10;
    border: 2px solid #15803d;
  }

  /* Adjusted for scrolling content */
  .control-panel { 
    flex: 0.7; background: #ffffff; padding: 2rem; display: flex; flex-direction: column; 
    box-shadow: -10px 0 30px rgba(0,0,0,0.05); z-index: 10; border-left: 1px solid #e2e8f0;
    color: #1e293b; overflow: hidden; height: 100vh;
  }

  .header { margin-bottom: 1.5rem; display: flex; align-items: center; justify-content: space-between; flex-shrink: 0; }
  .back-btn { background: none; border: 1px solid #cbd5e1; color: #64748b; padding: 8px 16px; border-radius: 6px; font-weight: 600; cursor: pointer; display: flex; align-items: center; gap: 6px; font-size: 0.9rem; transition: 0.3s; }
  .back-btn:hover { border-color: #15803d; color: #15803d; }
  h2 { font-size: 1.5rem; font-weight: 800; color: #166534; margin: 0; }

  /* BUTTONS */
  .ops-grid { display: flex; flex-direction: column; gap: 10px; margin-bottom: 1.5rem; flex-shrink: 0; }
  .btn-op { 
    padding: 0.8rem; border: none; border-radius: 8px; font-weight: 700; cursor: pointer; color: white; 
    transition: all 0.2s; font-size: 0.85rem; text-transform: uppercase; letter-spacing: 0.5px;
  }
  .btn-run { background: #15803d; } .btn-run:hover:not(:disabled) { background: #166534; transform: translateY(-2px); }
  .btn-rand { background: #475569; } .btn-rand:hover:not(:disabled) { background: #334155; }
  .btn-op:disabled { background: #cbd5e1; cursor: not-allowed; transform: none; }

   /* PAUSE / RESUME BUTTON */
  .btn-pause { 
    background: #facc15; color: black; border: none; border-radius: 8px; 
    font-weight: 800; cursor: pointer; padding: 0.8rem; text-transform: uppercase; 
    box-shadow: 0 4px 10px rgba(250, 204, 21, 0.3); 
    display: flex; justify-content: center; align-items: center; gap: 10px;
  }
  .btn-pause:hover:not(:disabled) { background: #eab308; transform: translateY(-1px); }
  .btn-pause.resuming { background: #22c55e; color: white; box-shadow: 0 4px 10px rgba(34, 197, 94, 0.3); }

  /* LEGEND */
  .legend { display: flex; gap: 8px; margin-bottom: 1rem; flex-wrap: wrap; justify-content: center; background: #f8fafc; padding: 10px; border-radius: 8px; border: 1px solid #e2e8f0; flex-shrink: 0; }
  .badge { padding: 4px 10px; border-radius: 4px; font-size: 0.65rem; font-weight: 700; color: white; text-transform: uppercase; }
  .bg-default { background: #3b82f6; } 
  .bg-scanning { background: #facc15; color: black; }
  .bg-found-zero { background: #ef4444; }
  .bg-marker { background: #9333ea; } 
  .bg-setting { background: #f97316; } 
  .bg-final { background: #15803d; }

  .console { 
    background: #1e293b; border-radius: 8px; padding: 1rem; color: #4ade80; 
    font-family: 'JetBrains Mono', monospace; font-size: 0.8rem; margin-bottom: 1rem; 
    min-height: 80px; display: flex; align-items: center; border: 1px solid #334155;
    white-space: pre-wrap; flex-shrink: 0;
  }

  /* CODE SECTION STYLES */
  .code-section { margin-top: auto; background: #1e293b; border-radius: 8px; border: 1px solid #334155; overflow: hidden; display: flex; flex-direction: column; flex-grow: 1; min-height: 200px; }
  .code-header { background: #0f172a; padding: 8px 12px; font-size: 0.85rem; font-weight: 700; color: #94a3b8; border-bottom: 1px solid #334155; flex-shrink: 0; }
  .code-scroll-container { overflow: auto; flex-grow: 1; padding: 12px; }
  .code-block { margin: 0; font-family: 'JetBrains Mono', monospace; font-size: 0.75rem; color: #e2e8f0; line-height: 1.4; white-space: pre; }
`;

// ==========================================
// 2. 3D GRID CELL COMPONENT (FIXED TEXT)
// ==========================================

function GridCell({ val, r, c, status, totalRows, totalCols }) {
  const mesh = useRef();
  
  const spacing = 1.1;
  const startX = -((totalCols * spacing) / 2) + (spacing / 2);
  const startY = ((totalRows * spacing) / 2) - (spacing / 2);

  const targetX = startX + (c * spacing);
  const targetY = startY - (r * spacing); 
  
  let color = "#3b82f6";      
  let textColor = "white";
  let bump = 0;

  if (status === 'scanning') { color = "#facc15"; textColor = "black"; bump = 0.2; }
  if (status === 'found-zero') { color = "#ef4444"; textColor = "white"; bump = 0.4; }
  if (status === 'marker') { color = "#9333ea"; textColor = "white"; bump = 0.1; } 
  if (status === 'checking-marker') { color = "#06b6d4"; textColor = "black"; bump = 0.3; } 
  if (status === 'setting-zero') { color = "#f97316"; textColor = "white"; bump = 0.3; } 
  if (status === 'final-zero') { color = "#15803d"; textColor = "white"; } 

  useFrame((state, delta) => {
    if (!mesh.current) return;
    mesh.current.position.lerp(new THREE.Vector3(targetX, targetY, bump), delta * 8);
  });

  return (
    <group ref={mesh} position={[targetX, targetY, 0]}>
      <RoundedBox args={[0.9, 0.9, 0.4]} radius={0.05}>
        <meshStandardMaterial color={color} roughness={0.2} metalness={0.3} />
      </RoundedBox>
      {/* FIX: Use meshBasicMaterial and toneMapped={false} for guaranteed visibility */}
      <Text position={[0, 0, 0.26]} fontSize={0.4} fontWeight="bold" anchorX="center" anchorY="middle">
        {val}
        <meshBasicMaterial color={textColor} toneMapped={false} />
      </Text>
    </group>
  );
}

// ==========================================
// 3. MAIN ALGORITHM VISUALIZER
// ==========================================
export default function SetMatrixZeroesViz({ onBack }) {
  const initialGridData = [
    [1, 1, 1, 1, 1, 0],
    [1, 0, 1, 1, 1, 1],
    [1, 1, 1, 1, 1, 1],
    [0, 1, 1, 1, 0, 1],
    [1, 1, 1, 1, 1, 1],
  ];

  const createVisualGrid = (data) => {
    return data.map((row, r) => row.map((val, c) => ({
      id: `${r}-${c}`,
      val: val,      
      displayVal: val, 
      status: 'default'
    })));
  };

  const gridRef = useRef(createVisualGrid(initialGridData));
  const [displayGrid, setDisplayGrid] = useState(gridRef.current);

  const [isBusy, setIsBusy] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [log, setLog] = useState("Ready. O(1) Space approach.");
  
  const pausedRef = useRef(false);
  const resumeRef = useRef(null);

  const rows = gridRef.current.length;
  const cols = gridRef.current[0].length;

  const sleep = async (ms) => {
    await new Promise(r => setTimeout(r, ms));
    if (pausedRef.current) {
      setLog(prev => prev + "\n[PAUSED]");
      await new Promise(resolve => { resumeRef.current = resolve; });
      setLog(prev => prev + "\n[RESUMING...]");
    }
  };

  const togglePause = () => {
    if (pausedRef.current) {
        pausedRef.current = false;
        setIsPaused(false);
        if (resumeRef.current) resumeRef.current();
    } else {
        pausedRef.current = true;
        setIsPaused(true);
    }
  };

  const updateView = () => {
      setDisplayGrid(gridRef.current.map(row => [...row.map(cell => ({...cell}))]));
  };

  const resetStatuses = (exceptCoords = []) => {
    gridRef.current.forEach((row, r) => {
        row.forEach((cell, c) => {
            const isException = exceptCoords.some(([er, ec]) => er === r && ec === c);
            if (!isException && cell.status !== 'marker' && cell.status !== 'final-zero') {
                cell.status = 'default';
            }
        });
    });
  };

  // --- ALGORITHM IMPLEMENTATION ---
  const runSetZeroes = async () => {
    if (isBusy) return;
    setIsBusy(true);
    pausedRef.current = false;
    setIsPaused(false);
    setLog("Starting O(1) Space Algorithm.\nUsing first row/col as markers.");

    gridRef.current.forEach(row => row.forEach(cell => cell.status = 'default'));
    updateView();
    await sleep(500);

    let zeroInFirstCol = false;

    // PHASE 1: MARKING
    setLog("PHASE 1: Scanning to mark headers...");
    for (let r = 0; r < rows; r++) {
        gridRef.current[r][0].status = 'scanning';
        updateView();
        await sleep(400);

        if (gridRef.current[r][0].val === 0) {
            zeroInFirstCol = true;
            gridRef.current[r][0].status = 'found-zero';
            setLog(`Found '0' in first column at [${r},0]. Will zero column later.`);
            updateView();
            await sleep(600);
        }

        for (let c = 1; c < cols; c++) {
            resetStatuses([[r, c], [r,0], [0,c]]); 
            
            gridRef.current[r][c].status = 'scanning';
            updateView();
            await sleep(300);

            if (gridRef.current[r][c].val === 0) {
                gridRef.current[r][c].status = 'found-zero';
                setLog(`Found '0' at [${r},${c}]. Marking header [${r},0] and [0,${c}].`);
                updateView();
                await sleep(600);

                gridRef.current[r][0].status = 'marker';
                gridRef.current[r][0].val = 0; 
                gridRef.current[r][0].displayVal = 0; 

                gridRef.current[0][c].status = 'marker';
                gridRef.current[0][c].val = 0;
                gridRef.current[0][c].displayVal = 0;
                updateView();
                await sleep(600);
            }
        }
    }

    // PHASE 2: SETTING ZEROS
    setLog("\nPHASE 2: Iterating backwards to set zeroes based on markers...");
    await sleep(1000);

    for (let r = rows - 1; r >= 0; r--) {
        for (let c = cols - 1; c >= 1; c--) {
            resetStatuses([[r, c]]); 

            gridRef.current[r][c].status = 'scanning';
            updateView();
            await sleep(300);

            const headerRowState = gridRef.current[r][0].status;
            const headerColState = gridRef.current[0][c].status;

            gridRef.current[r][0].status = 'checking-marker';
            gridRef.current[0][c].status = 'checking-marker';
            setLog(`Checking [${r},${c}]: headers [${r},0]=${gridRef.current[r][0].val}, [0,${c}]=${gridRef.current[0][c].val}`);
            updateView();
            await sleep(600);

            if (gridRef.current[r][0].val === 0 || gridRef.current[0][c].val === 0) {
                gridRef.current[r][c].status = 'setting-zero';
                setLog(`Header is 0. Setting [${r},${c}] to 0.`);
                updateView();
                await sleep(400);
                
                gridRef.current[r][c].val = 0;
                gridRef.current[r][c].displayVal = 0;
                gridRef.current[r][c].status = 'final-zero';
                updateView();
                await sleep(400);
            } else {
                gridRef.current[r][0].status = headerRowState === 'marker' ? 'marker' : 'default';
                gridRef.current[0][c].status = headerColState === 'marker' ? 'marker' : 'default';
            }
        }

        if (zeroInFirstCol) {
             gridRef.current[r][0].status = 'setting-zero';
             setLog(`zeroInFirstCol is true. Setting [${r},0] to 0.`);
             updateView();
             await sleep(400);
             gridRef.current[r][0].val = 0;
             gridRef.current[r][0].displayVal = 0;
             gridRef.current[r][0].status = 'final-zero';
        } else if (gridRef.current[r][0].val === 0) {
             gridRef.current[r][0].status = 'final-zero';
        }
         updateView();
         await sleep(300);
    }

    gridRef.current.forEach(row => row.forEach(cell => {
        if(cell.val === 0) cell.status = 'final-zero'; else cell.status = 'default';
    }));
    updateView();

    setLog("Algorithm Complete. Grid updated in-place.");
    setIsBusy(false);
  };

  const generateNewGrid = () => {
    if (isBusy) return;
    const newGridData = Array.from({ length: rows }, () => 
      Array.from({ length: cols }, () => Math.random() > 0.8 ? 0 : Math.floor(Math.random() * 9) + 1)
    );
    gridRef.current = createVisualGrid(newGridData);
    updateView();
    setLog("New Random Grid Generated.");
  };

  return (
    <>
      <style>{styles}</style>
      <div className="viz-container">
        
        {/* LEFT: 3D VIZ */}
        <div className="visual-panel">
          <div className="scene-status">Set Matrix Zeroes (O(1) Space)</div>
          
          <Canvas camera={{ position: [0, 0, 14], fov: 50 }} shadows>
            <ambientLight intensity={1.5} />
            <spotLight position={[5, 10, 10]} intensity={1.5} castShadow />
            <Environment preset="city" />
            
            <Center>
            <group rotation={[0.2, 0, 0]}> 
                {displayGrid.map((row, rIdx) => (
                    row.map((cell, cIdx) => (
                        <GridCell 
                            key={cell.id} 
                            val={cell.displayVal}
                            r={rIdx}
                            c={cIdx}
                            status={cell.status}
                            totalRows={rows}
                            totalCols={cols}
                        />
                    ))
                ))}
            </group>
            </Center>
            
            <ContactShadows position={[0, -4, 0]} opacity={0.5} scale={20} blur={2} />
            <OrbitControls enableZoom={true} maxPolarAngle={Math.PI / 1.5} minPolarAngle={Math.PI / 4}/>
          </Canvas>
        </div>

        {/* RIGHT: CONTROLS */}
        <div className="control-panel">
          <div className="header">
            <h2>Controls</h2>
            <button className="back-btn" onClick={onBack}>← Back</button>
          </div>

          <div className="ops-grid">
             <button className="btn-op btn-run" onClick={runSetZeroes} disabled={isBusy}>Run Algorithm</button>
             
             <button 
                className={`btn-pause ${isPaused ? 'resuming' : ''}`} 
                onClick={togglePause} 
                disabled={!isBusy}
             >
                {isPaused ? "▶ RESUME" : "⏸ PAUSE"}
             </button>

             <button className="btn-op btn-rand" onClick={generateNewGrid} disabled={isBusy}>Randomize Grid</button>
          </div>

          <div className="legend">
             <div className="badge bg-scanning">Scanning</div>
             <div className="badge bg-found-zero">Found '0'</div>
             <div className="badge bg-marker">Marker Set</div>
             <div className="badge bg-setting">Setting '0'</div>
             <div className="badge bg-final">Final '0'</div>
          </div>

          <div className="console">
              {log}
          </div>

          {/* ADDED CODE SECTION */}
          <div className="code-section">
            <div className="code-header">C++ Solution (O(1) Space)</div>
            <div className="code-scroll-container">
                <pre className="code-block">
                  <code>{cppCode}</code>
                </pre>
            </div>
          </div>

        </div>

      </div>
    </>
  );
}