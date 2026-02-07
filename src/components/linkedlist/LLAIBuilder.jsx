import React, { useState, useRef, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Center, Text, RoundedBox, Environment, ContactShadows, Html } from '@react-three/drei';
import * as THREE from 'three';



// ==========================================
// 1. IMPROVED STYLES
// ==========================================
const styles = `
  .ll-container { width: 100%; height: 100vh; display: flex; background: #fff; font-family: 'Inter', sans-serif; overflow: hidden; }
  
  /* LEFT: 3D PANEL */
  .visual-panel { 
    flex: 1.8; position: relative; 
    background: radial-gradient(circle at center, #f8fafc 0%, #e2e8f0 100%); 
    border-right: 1px solid #cbd5e1;
  }
  
  .viz-badge {
    position: absolute; top: 30px; left: 30px;
    background: rgba(255,255,255,0.8); backdrop-filter: blur(8px);
    padding: 8px 16px; border-radius: 20px;
    font-size: 0.85rem; font-weight: 700; color: #4f46e5;
    box-shadow: 0 4px 15px rgba(0,0,0,0.05);
  }

  /* LOADING OVERLAY */
  .loader-overlay {
    position: absolute; inset: 0; 
    background: rgba(255,255,255,0.6); backdrop-filter: blur(8px);
    display: flex; flex-direction: column; align-items: center; justify-content: center; z-index: 50;
  }
  .spinner { width: 50px; height: 50px; border: 4px solid #e2e8f0; border-top-color: #4f46e5; border-radius: 50%; animation: spin 1s linear infinite; }
  @keyframes spin { to { transform: rotate(360deg); } }

  /* RIGHT: CONTROL PANEL */
  .control-panel { 
    flex: 1; background: #fff; padding: 2rem; display: flex; flex-direction: column; 
    box-shadow: -10px 0 30px rgba(0,0,0,0.05); z-index: 10; 
    overflow-y: auto; 
  }

  .header { margin-bottom: 2rem; display: flex; align-items: center; justify-content: space-between; }
  .back-btn { background: none; border: none; color: #64748b; font-weight: 600; cursor: pointer; display: flex; align-items: center; gap: 6px; font-size: 0.9rem; }
  .back-btn:hover { color: #0f172a; }
  h2 { font-size: 1.5rem; font-weight: 800; color: #1e293b; margin: 0; }

  /* INPUT SECTION */
  .input-area { margin-bottom: 2rem; }
  .ai-label { display: block; font-size: 0.75rem; font-weight: 700; color: #64748b; margin-bottom: 0.5rem; text-transform: uppercase; letter-spacing: 0.5px; }
  .ai-input { 
    width: 100%; padding: 1rem; border: 2px solid #e2e8f0; border-radius: 12px; 
    font-size: 1rem; outline: none; transition: 0.2s; background: #f8fafc; color: #1e293b;
  }
  .ai-input:focus { border-color: #4f46e5; background: #fff; box-shadow: 0 0 0 4px rgba(79, 70, 229, 0.1); }

  .gen-btn { 
    width: 100%; margin-top: 1rem; padding: 1rem; border-radius: 12px; border: none; 
    background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%); 
    color: white; font-weight: 700; cursor: pointer; 
    font-size: 1rem; transition: all 0.2s; box-shadow: 0 4px 10px rgba(79, 70, 229, 0.3);
  }
  .gen-btn:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 10px 20px rgba(79, 70, 229, 0.4); }
  .gen-btn:disabled { opacity: 0.7; cursor: wait; transform: none; }

  /* STEP INFO CARD */
  .step-card {
    background: #f0fdf4; border-left: 4px solid #15803d;
    padding: 1rem; border-radius: 8px; margin-bottom: 1.5rem;
    animation: fadeIn 0.3s ease;
  }
  .step-title { font-size: 0.7rem; font-weight: 800; color: #15803d; text-transform: uppercase; margin-bottom: 0.3rem; }
  .step-msg { font-size: 0.95rem; color: #14532d; line-height: 1.5; font-weight: 500; }

  /* PLAYBACK CONTROLS */
  .play-controls { display: flex; gap: 10px; margin-bottom: 1.5rem; }
  .ctrl-btn { 
    flex: 1; padding: 0.8rem; border-radius: 8px; border: 1px solid #e2e8f0; 
    background: #fff; color: #475569; font-weight: 600; cursor: pointer; transition: 0.2s;
  }
  .ctrl-btn:hover:not(:disabled) { background: #f1f5f9; color: #0f172a; }
  .ctrl-btn.primary { background: #0f172a; color: white; border-color: #0f172a; }
  .ctrl-btn.primary:hover { background: #1e293b; }

  /* CODE BOX */
  .code-box {
    margin-top: auto; background: #0f172a; padding: 1.2rem; border-radius: 12px;
    font-family: 'JetBrains Mono', monospace; font-size: 0.8rem; color: #94a3b8;
    border: 1px solid #334155; box-shadow: inset 0 2px 4px rgba(0,0,0,0.3);
    overflow-x: auto; flex-grow: 1; max-height: 250px;
  }
  .code-title { display: block; font-size: 0.7rem; font-weight: 700; color: #64748b; text-transform: uppercase; margin-bottom: 0.5rem; border-bottom: 1px solid #1e293b; padding-bottom: 4px; }
  .code-line { display: block; padding: 2px 6px; border-radius: 4px; white-space: pre; }
  .code-line.active { background: #10b981; color: #fff; font-weight: 700; }
  
  @keyframes fadeIn { from { opacity: 0; transform: translateY(5px); } to { opacity: 1; transform: translateY(0); } }
`;

// ==========================================
// 2. 3D COMPONENTS
// ==========================================

function ListNode({ val, idx, pos, state }) {
  const mesh = useRef();
  
  let color = "#cbd5e1"; 
  let scale = 1;
  let label = null;

  // Check pointers from AI state
  if (state.pointers) {
    Object.entries(state.pointers).forEach(([ptrName, ptrIdx]) => {
      if (ptrIdx === idx) {
        if (ptrName === 'curr' || ptrName === 'fast') color = "#3b82f6"; // Blue
        else if (ptrName === 'prev' || ptrName === 'slow') color = "#f59e0b"; // Yellow
        else if (ptrName === 'next' || ptrName === 'temp') color = "#a855f7"; // Purple
        else color = "#10b981"; // Green (Head/Tail/Other)
        
        scale = 1.15;
        label = ptrName;
      }
    });
  }

  useFrame((_, delta) => {
    if(!mesh.current) return;
    mesh.current.position.lerp(pos, delta * 6);
    mesh.current.scale.lerp(new THREE.Vector3(scale, scale, scale), delta * 8);
  });

  return (
    <group ref={mesh} position={pos}>
      <RoundedBox args={[1.2, 1, 0.2]} radius={0.15}>
        <meshStandardMaterial color={color} />
      </RoundedBox>
      <RoundedBox args={[1.25, 1.05, 0.18]} radius={0.15}>
        <meshBasicMaterial color="#1e293b" side={THREE.BackSide} />
      </RoundedBox>
      <Text position={[0, 0, 0.12]} fontSize={0.5} color={color === "#cbd5e1" ? "#1e293b" : "white"} fontWeight={800}>{val}</Text>
      
      {label && (
        <Html position={[0, 1.4, 0]} center>
          <div style={{
            background: color, color: 'white', padding: '4px 8px', 
            borderRadius: '6px', fontSize: '0.65rem', fontWeight: 'bold', 
            textTransform: 'uppercase', boxShadow: '0 4px 10px rgba(0,0,0,0.2)',
            whiteSpace: 'nowrap'
          }}>
            {label}
          </div>
        </Html>
      )}
    </group>
  );
}

function Arrow({ start, end, visible }) {
  const group = useRef();
  
  useFrame(() => {
    if (!group.current || !visible) return;
    const dir = new THREE.Vector3().subVectors(end, start).normalize();
    const dist = start.distanceTo(end);
    const len = Math.max(0, dist - 1.3); 

    const mid = start.clone().add(dir.clone().multiplyScalar(dist / 2));
    group.current.position.copy(mid);
    group.current.lookAt(end);
    group.current.scale.z = len;
  });

  if (!visible) return null;

  return (
    <group ref={group}>
      <mesh rotation={[Math.PI/2, 0, 0]}>
        <cylinderGeometry args={[0.04, 0.04, 1, 8]} />
        <meshStandardMaterial color="#94a3b8" />
      </mesh>
      <mesh position={[0, 0, 0.5]} rotation={[Math.PI/2, 0, 0]}>
        <coneGeometry args={[0.12, 0.3, 12]} />
        <meshStandardMaterial color="#94a3b8" />
      </mesh>
    </group>
  );
}

// ==========================================
// 3. MAIN LOGIC
// ==========================================
export default function LLAIBuilder({ onBack }) {
  const [prompt, setPrompt] = useState("Delete the middle node of [1, 2, 3, 4, 5]");
  
  const [frames, setFrames] = useState([]);
  const [code, setCode] = useState("");
  const [currentStep, setCurrentStep] = useState(0);
  
  const [isLoading, setIsLoading] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [message, setMessage] = useState("Ready to generate.");

  // AUTO-PLAY
  useEffect(() => {
    let interval;
    if (isPlaying && frames.length > 0) {
      interval = setInterval(() => {
        setCurrentStep((prev) => {
          if (prev < frames.length - 1) return prev + 1;
          else {
            setIsPlaying(false);
            return prev;
          }
        });
      }, 1500);
    }
    return () => clearInterval(interval);
  }, [isPlaying, frames]);

  // UPDATE MESSAGE
  useEffect(() => {
    if (frames.length > 0 && frames[currentStep]) {
      setMessage(frames[currentStep].message || `Executing Step ${currentStep + 1}`);
    }
  }, [currentStep, frames]);

// --- GEMINI API ---
const generateVisualization = async () => {
  if (!prompt.trim()) return;
  setIsLoading(true);
  setFrames([]);
  setCode("");
  setCurrentStep(0);
  setMessage("AI is thinking...");

  try {
    const systemPrompt = `
      You are a Linked List Algorithm Visualization Engine.
      1. Write a clean C++ function for the user's request.
      2. Simulate it step-by-step on a small list (max 5-6 nodes).

      Return a VALID JSON OBJECT with this EXACT structure:
      {
        "code": "C++ code string\\nwith newlines",
        "frames": [
          {
            "nodes": [ { "id": 0, "val": 10, "next": 1 }, { "id": 1, "val": 20, "next": null } ], 
            "pointers": { "head": 0, "curr": 1 },
            "message": "Traversing to next node...",
            "line": 5
          }
        ]
      }

      Rules:
      - "nodes": Array of objects. "next" is the ID of the next node (or null).
      - "pointers": Key-value pairs. Key is pointer name, Value is node ID it points to.
      - "line": The 1-based line number of code executing.
      - RETURN ONLY RAW JSON.
    `;

    // ✅ CALL YOUR BACKEND INSTEAD OF GEMINI
    const response = await fetch("/api/gemini", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: systemPrompt + "\nUser Input: " + prompt
              }
            ]
          }
        ]
      })
    });

    if (!response.ok) throw new Error("Backend API Error");

    const data = await response.json();

    if (!data.candidates || data.candidates.length === 0)
      throw new Error("No response.");

    let rawText = data.candidates[0].content.parts[0].text;

    rawText = rawText.replace(/```json/g, "").replace(/```/g, "").trim();

    const parsedData = JSON.parse(rawText);

    if (parsedData.frames && parsedData.frames.length > 0) {
      setFrames(parsedData.frames);
      setCode(parsedData.code || "// No code generated");
      setMessage("Visualization Ready!");
    } else {
      setMessage("AI returned invalid structure. Try again.");
    }

  } catch (error) {
    console.error(error);
    setMessage(`Error: ${error.message}`);
  } finally {
    setIsLoading(false);
  }
};


  const activeFrame = frames.length > 0 ? frames[currentStep] : null;
  const activeLine = activeFrame ? activeFrame.line : -1;
  const codeLines = code.split('\n');

  // Helper to map node ID to a linear position for visualization
  const getNodePos = (idx) => new THREE.Vector3((idx - 2) * 2.5, 0, 0);

  return (
    <>
      <style>{styles}</style>
      <div className="ll-container">
        
        {/* LEFT: 3D VIZ */}
        <div className="visual-panel">
          <div className="viz-badge">AI Linked List Builder</div>

          {isLoading && (
             <div className="loader-overlay">
                <div className="spinner"></div>
                <p style={{marginTop:'1rem', color:'#4f46e5', fontWeight:'800'}}>Generating Solution...</p>
             </div>
          )}

          {!isLoading && frames.length === 0 && (
             <div className="loader-overlay" style={{background:'transparent'}}>
                <p style={{color:'#64748b', fontSize:'1.2rem'}}>Enter a problem on the right to start.</p>
             </div>
          )}

          <Canvas camera={{ position: [0, 1, 9], fov: 50 }}>
            <ambientLight intensity={1} />
            <spotLight position={[5, 10, 5]} intensity={1} />
            <Environment preset="city" />
            <Center>
              <group>
                {activeFrame && activeFrame.nodes && activeFrame.nodes.map((node, i) => (
                  <ListNode 
                    key={node.id} 
                    val={node.val} 
                    idx={node.id} 
                    pos={getNodePos(i)} 
                    state={activeFrame} 
                  />
                ))}
                
                {/* Arrows */}
                {activeFrame && activeFrame.nodes && activeFrame.nodes.map((node, i) => {
                   if (node.next === null) return null;
                   const nextNodeIndex = activeFrame.nodes.findIndex(n => n.id === node.next);
                   if (nextNodeIndex === -1) return null;

                   const startPos = getNodePos(i);
                   const endPos = getNodePos(nextNodeIndex);
                   return <Arrow key={`arrow-${i}`} start={startPos} end={endPos} visible={true} />;
                })}
              </group>
            </Center>
            <ContactShadows position={[0, -2, 0]} opacity={0.4} scale={30} blur={2} />
          </Canvas>
        </div>

        {/* RIGHT: CONTROLS */}
        <div className="control-panel">
          <div className="header">
            <h2>AI Builder</h2>
            <button className="back-btn" onClick={onBack}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
              Back
            </button>
          </div>

          <div className="input-area">
            <span className="ai-label">What do you want to solve?</span>
            <input 
              className="ai-input" 
              placeholder="e.g., 'Reverse a linked list', 'Find middle'"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
            />
            <button className="gen-btn" onClick={generateVisualization} disabled={isLoading}>
               {isLoading ? "Generating..." : "✨ Generate Visualization"}
            </button>
          </div>

          {/* STEP INFO CARD */}
          <div className="step-card">
            <div className="step-title">Current Step</div>
            <div className="step-msg">{message}</div>
          </div>

          {frames.length > 0 && (
            <div className="play-controls">
              <button className="ctrl-btn" onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}>Prev</button>
              <button className="ctrl-btn primary" onClick={() => setIsPlaying(!isPlaying)}>
                {isPlaying ? "Pause" : "▶ Play Animation"}
              </button>
              <button className="ctrl-btn" onClick={() => setCurrentStep(Math.min(frames.length - 1, currentStep + 1))}>Next</button>
            </div>
          )}

          <div className="code-box">
            <span className="code-title">Generated C++ Logic</span>
            {codeLines.map((line, i) => (
              <span key={i} className={`code-line ${i + 1 === activeLine ? 'active' : ''}`}>
                {line}
              </span>
            ))}
            {codeLines.length === 0 && <span style={{color:'#475569', fontStyle:'italic'}}>Code will appear here...</span>}
          </div>

        </div>

      </div>
    </>
  );

}
