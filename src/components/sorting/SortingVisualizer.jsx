import React, { useState, useRef, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Center, Text, RoundedBox, Environment, ContactShadows, OrbitControls } from '@react-three/drei';
import * as THREE from 'three';

// ==========================================
// 1. GREEN & WHITE THEME STYLES
// ==========================================
const styles = `
  .sort-container { width: 100%; height: 100vh; display: flex; background: #f0fdf4; font-family: 'Inter', sans-serif; overflow: hidden; }
  
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

  .control-panel { 
    flex: 0.7; background: #ffffff; padding: 2rem; display: flex; flex-direction: column; 
    box-shadow: -10px 0 30px rgba(0,0,0,0.05); z-index: 10; border-left: 1px solid #e2e8f0;
    color: #1e293b;
  }

  .header { margin-bottom: 2rem; display: flex; align-items: center; justify-content: space-between; }
  .back-btn { background: none; border: 1px solid #cbd5e1; color: #64748b; padding: 8px 16px; border-radius: 6px; font-weight: 600; cursor: pointer; display: flex; align-items: center; gap: 6px; font-size: 0.9rem; transition: 0.3s; }
  .back-btn:hover { border-color: #15803d; color: #15803d; }
  h2 { font-size: 1.5rem; font-weight: 800; color: #166534; margin: 0; }

  /* BUTTON GRID */
  .ops-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 2rem; }
  .btn-op { 
    padding: 1rem; border: none; border-radius: 8px; font-weight: 700; cursor: pointer; color: white; 
    transition: all 0.2s; font-size: 0.85rem; text-transform: uppercase; letter-spacing: 0.5px;
  }
  
  .btn-bub { background: #15803d; } .btn-bub:hover:not(:disabled) { background: #166534; transform: translateY(-2px); }
  .btn-sel { background: #0ea5e9; } .btn-sel:hover:not(:disabled) { background: #0284c7; transform: translateY(-2px); }
  .btn-ins { background: #f59e0b; } .btn-ins:hover:not(:disabled) { background: #d97706; transform: translateY(-2px); }
  
  /* PAUSE / RESUME BUTTON */
  .btn-pause { 
    grid-column: span 2; 
    background: #facc15; color: black; border: none; border-radius: 8px; 
    font-weight: 800; cursor: pointer; padding: 1rem; text-transform: uppercase; 
    box-shadow: 0 4px 10px rgba(250, 204, 21, 0.3); 
    display: flex; justify-content: center; align-items: center; gap: 10px;
  }
  .btn-pause:hover:not(:disabled) { background: #eab308; transform: translateY(-1px); }
  .btn-pause.resuming { background: #22c55e; color: white; box-shadow: 0 4px 10px rgba(34, 197, 94, 0.3); }

  .btn-rand { grid-column: span 2; background: #475569; color: white; margin-top: 5px; }
  .btn-rand:hover:not(:disabled) { background: #334155; }
  
  .btn-op:disabled { background: #cbd5e1; cursor: not-allowed; transform: none; }

  /* LEGEND */
  .legend { display: flex; gap: 8px; margin-bottom: 1.5rem; flex-wrap: wrap; justify-content: center; background: #f8fafc; padding: 10px; border-radius: 8px; border: 1px solid #e2e8f0; }
  .badge { padding: 4px 10px; border-radius: 4px; font-size: 0.65rem; font-weight: 700; color: white; text-transform: uppercase; }
  .bg-select { background: #9333ea; } 
  .bg-compare { background: #facc15; color: black; } 
  .bg-swap { background: #ef4444; } 
  .bg-sorted { background: #15803d; } 
  .bg-default { background: #3b82f6; } 

  .console { 
    background: #1e293b; border-radius: 8px; padding: 1rem; color: #4ade80; 
    font-family: 'JetBrains Mono', monospace; font-size: 0.8rem; margin-bottom: 1rem; 
    min-height: 80px; display: flex; align-items: center; border: 1px solid #334155;
  }
`;

// ==========================================
// 2. 3D CUBES
// ==========================================

function SortCube({ val, idx, status, total }) {
  const mesh = useRef();
  
  const spacing = 1.1; 
  const startX = -((total * spacing) / 2) + 0.5;
  const targetX = startX + (idx * spacing);
  
  let color = "#3b82f6";      
  let textColor = "white";

  if (status === 'compare') { color = "#facc15"; textColor = "black"; }
  if (status === 'swap') { color = "#ef4444"; textColor = "white"; }
  if (status === 'sorted') { color = "#15803d"; textColor = "white"; }
  if (status === 'selected') { color = "#9333ea"; textColor = "white"; }

  useFrame((state, delta) => {
    if (!mesh.current) return;
    mesh.current.position.x = THREE.MathUtils.lerp(mesh.current.position.x, targetX, delta * 6);
    
    const targetY = (status === 'compare' || status === 'swap' || status === 'selected') ? 1 : 0;
    mesh.current.position.y = THREE.MathUtils.lerp(mesh.current.position.y, targetY, delta * 6);
  });

  return (
    <group ref={mesh} position={[targetX, 0, 0]}>
      <RoundedBox args={[0.8, 0.8, 0.8]} radius={0.1}>
        <meshStandardMaterial color={color} roughness={0.2} metalness={0.2} />
      </RoundedBox>
      <Text position={[0, 0, 0.5]} fontSize={0.4} color={textColor} fontWeight="bold">
        {val}
      </Text>
    </group>
  );
}

// ==========================================
// 3. MAIN LOGIC (PAUSE/RESUME ENABLED)
// ==========================================
export default function SortingVisualizer({ onBack }) {
  const arrayRef = useRef([12, 5, 8, 3, 15, 7, 10, 6]);
  const [displayArray, setDisplayArray] = useState([...arrayRef.current]);
  
  const [activeIdx, setActiveIdx] = useState(null); 
  const [compareIdxs, setCompareIdxs] = useState([]);
  const [swapIdxs, setSwapIdxs] = useState([]);
  const [sortedIdxs, setSortedIdxs] = useState([]);

  const [isBusy, setIsBusy] = useState(false);
  const [isPaused, setIsPaused] = useState(false); // For UI Button
  const [log, setLog] = useState("Ready. Select Algorithm.");
  const [algoName, setAlgoName] = useState("Sorting Visualizer");
  
  // PAUSE CONTROLS
  const pausedRef = useRef(false);   // The actual logic switch
  const resumeRef = useRef(null);    // The function to call to unpause

  // === SMART SLEEP (HANDLES PAUSING) ===
  const sleep = async (ms) => {
    // 1. Wait the normal duration
    await new Promise(r => setTimeout(r, ms));

    // 2. Check if paused. If so, wait for resumeRef to be called.
    if (pausedRef.current) {
      setLog("Paused. Click RESUME to continue.");
      await new Promise(resolve => {
        resumeRef.current = resolve;
      });
      setLog("Resuming...");
    }
  };

  const togglePause = () => {
    if (pausedRef.current) {
        // RESUME
        pausedRef.current = false;
        setIsPaused(false);
        if (resumeRef.current) resumeRef.current(); // Release the await
    } else {
        // PAUSE
        pausedRef.current = true;
        setIsPaused(true);
        setLog("Pausing...");
    }
  };

  // --- HELPERS ---
  const updateDisplay = () => setDisplayArray([...arrayRef.current]);
  
  const resetVisuals = () => {
    setActiveIdx(null); setCompareIdxs([]); setSwapIdxs([]); 
  };

  const randomizeArray = () => {
    // Cannot randomize while running
    if (isBusy) return;
    arrayRef.current = Array.from({ length: 8 }, () => Math.floor(Math.random() * 20) + 1);
    updateDisplay();
    setSortedIdxs([]);
    resetVisuals();
    setLog("New Data Generated.");
  };

  // ============================
  // 1. BUBBLE SORT
  // ============================
  const runBubbleSort = async () => {
    if (isBusy) return;
    setIsBusy(true);
    pausedRef.current = false;
    setIsPaused(false);
    
    setAlgoName("Bubble Sort");
    setSortedIdxs([]);
    setLog("Starting Bubble Sort...");

    const n = arrayRef.current.length;
    for (let i = 0; i < n; i++) {
        for (let j = 0; j < n - i - 1; j++) {
            setCompareIdxs([j, j + 1]);
            setLog(`Comparing ${arrayRef.current[j]} vs ${arrayRef.current[j+1]}`);
            await sleep(800); // Smart Sleep checks for pause

            if (arrayRef.current[j] > arrayRef.current[j + 1]) {
                setSwapIdxs([j, j + 1]);
                setLog(`Swapping...`);
                let temp = arrayRef.current[j];
                arrayRef.current[j] = arrayRef.current[j + 1];
                arrayRef.current[j + 1] = temp;
                updateDisplay();
                await sleep(1000); 
            }
        }
        setSortedIdxs(prev => [...prev, n - i - 1]);
    }
    setSortedIdxs(arrayRef.current.map((_, i) => i));
    resetVisuals();
    setLog("Bubble Sort Complete.");
    setIsBusy(false);
  };

  // ============================
  // 2. SELECTION SORT
  // ============================
  const runSelectionSort = async () => {
    if (isBusy) return;
    setIsBusy(true);
    pausedRef.current = false;
    setIsPaused(false);

    setAlgoName("Selection Sort");
    setSortedIdxs([]);
    setLog("Starting Selection Sort...");

    const n = arrayRef.current.length;
    for (let i = 0; i < n; i++) {
        let minIdx = i;
        setActiveIdx(minIdx); 
        setLog(`Current Min: ${arrayRef.current[minIdx]}`);
        await sleep(600);
        
        for (let j = i + 1; j < n; j++) {
            setCompareIdxs([j]); 
            await sleep(600);

            if (arrayRef.current[j] < arrayRef.current[minIdx]) {
                minIdx = j;
                setActiveIdx(minIdx); 
                setLog(`New Min Found: ${arrayRef.current[minIdx]}`);
                await sleep(800); 
            }
        }

        if (minIdx !== i) {
            setSwapIdxs([i, minIdx]);
            setLog(`Swapping new minimum to index ${i}`);
            let temp = arrayRef.current[i];
            arrayRef.current[i] = arrayRef.current[minIdx];
            arrayRef.current[minIdx] = temp;
            updateDisplay();
            await sleep(1000); 
        }
        setSortedIdxs(prev => [...prev, i]);
    }
    setSortedIdxs(arrayRef.current.map((_, i) => i));
    resetVisuals();
    setLog("Selection Sort Complete.");
    setIsBusy(false);
  };

  // ============================
  // 3. INSERTION SORT
  // ============================
  const runInsertionSort = async () => {
    if (isBusy) return;
    setIsBusy(true);
    pausedRef.current = false;
    setIsPaused(false);

    setAlgoName("Insertion Sort");
    setSortedIdxs([0]); 
    setLog("Starting Insertion Sort...");

    for (let i = 1; i < arrayRef.current.length; i++) {
        let key = arrayRef.current[i];
        let j = i - 1;
        setActiveIdx(i); 
        setLog(`Inserting: ${key}`);
        await sleep(1000); 

        while (j >= 0 && arrayRef.current[j] > key) {
            setCompareIdxs([j]);
            setLog(`${arrayRef.current[j]} > ${key}. Shifting.`);
            await sleep(800); 
            
            arrayRef.current[j + 1] = arrayRef.current[j];
            updateDisplay();
            j = j - 1;
        }
        arrayRef.current[j + 1] = key;
        updateDisplay();
        setSortedIdxs(Array.from({length: i + 1}, (_, k) => k)); 
        await sleep(1000); 
    }
    setSortedIdxs(arrayRef.current.map((_, i) => i));
    resetVisuals();
    setLog("Insertion Sort Complete.");
    setIsBusy(false);
  };

  return (
    <>
      <style>{styles}</style>
      <div className="sort-container">
        
        {/* LEFT: 3D VIZ */}
        <div className="visual-panel">
          <div className="scene-status">{algoName}</div>
          
          <Canvas camera={{ position: [0, 2, 12], fov: 40 }} shadows>
            <ambientLight intensity={1.5} />
            <spotLight position={[5, 10, 5]} intensity={1.5} castShadow />
            <Environment preset="city" />
            
            <Center>
            <group position={[0, 0, 0]}>
                {displayArray.map((val, i) => {
                    let status = 'normal';
                    if (sortedIdxs.includes(i)) status = 'sorted';
                    else if (i === activeIdx) status = 'selected';
                    else if (swapIdxs.includes(i)) status = 'swap';
                    else if (compareIdxs.includes(i)) status = 'compare';

                    return (
                        <SortCube 
                            key={i} 
                            val={val} 
                            idx={i} 
                            status={status}
                            total={displayArray.length}
                        />
                    );
                })}
            </group>
            </Center>
            
            <ContactShadows position={[0, -2, 0]} opacity={0.4} scale={30} blur={2} />
            <OrbitControls enableZoom={true} enablePan={false} maxPolarAngle={Math.PI / 2} minPolarAngle={Math.PI / 4}/>
          </Canvas>
        </div>

        {/* RIGHT: CONTROLS */}
        <div className="control-panel">
          <div className="header">
            <h2>Controls</h2>
            <button className="back-btn" onClick={onBack}>
              ← Back
            </button>
          </div>

          <div className="ops-grid">
             <button className="btn-op btn-bub" onClick={runBubbleSort} disabled={isBusy}>Bubble</button>
             <button className="btn-op btn-sel" onClick={runSelectionSort} disabled={isBusy}>Selection</button>
             <button className="btn-op btn-ins" onClick={runInsertionSort} disabled={isBusy}>Insertion</button>
             
             {/* PAUSE / RESUME TOGGLE */}
             <button 
                className={`btn-pause ${isPaused ? 'resuming' : ''}`} 
                onClick={togglePause} 
                disabled={!isBusy}
             >
                {isPaused ? "▶ RESUME" : "⏸ PAUSE"}
             </button>

             <button className="btn-op btn-rand" onClick={randomizeArray} disabled={isBusy}>Randomize Data</button>
          </div>

          <div className="legend">
             <div className="badge bg-select">Selected</div>
             <div className="badge bg-compare">Compare</div>
             <div className="badge bg-swap">Swap</div>
             <div className="badge bg-sorted">Sorted</div>
             <div className="badge bg-default">Idle</div>
          </div>

          <div className="console">
            {log}
          </div>

        </div>

      </div>
    </>
  );
}