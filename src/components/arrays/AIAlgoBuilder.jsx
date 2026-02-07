import React, { useState, useEffect, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Center, Text, RoundedBox, Environment, ContactShadows, Html } from '@react-three/drei';
import * as THREE from 'three';

// ⚠️ REPLACE WITH YOUR API KEY
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

// ==========================================
// 1. STYLES (Added Code Highlighting Support)
// ==========================================
const styles = `
  .builder-container { width: 100%; height: 100vh; display: flex; background: #fff; font-family: 'Inter', sans-serif; overflow: hidden; }
  
  /* LEFT: 3D PANEL */
  .viz-panel { flex: 1.6; position: relative; background: radial-gradient(circle at center, #f8fafc 0%, #e2e8f0 100%); border-right: 1px solid #e5e7eb; }

  /* RIGHT: CONTROL PANEL */
  .ctrl-panel { 
    flex: 1; background: #fff; padding: 2rem; display: flex; flex-direction: column; 
    box-shadow: -5px 0 20px rgba(0,0,0,0.03); z-index: 10; overflow-y: auto; 
  }
  
  .header-row { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; }
  .back-btn { background: none; border: none; color: #6b7280; font-weight: 600; cursor: pointer; }
  .back-btn:hover { color: #15803d; }
  h2 { font-size: 1.5rem; font-weight: 800; color: #111827; margin: 0; text-transform: capitalize; }

  /* INPUT & BUTTONS */
  .input-group { margin-bottom: 1rem; }
  .ai-input { 
    width: 100%; padding: 0.8rem; border: 2px solid #cbd5e1; border-radius: 8px; 
    font-family: 'Inter', sans-serif; font-size: 0.95rem; outline: none; transition: 0.2s; 
  }
  .ai-input:focus { border-color: #4f46e5; }

  .gen-btn {
    width: 100%; padding: 0.8rem; border-radius: 8px; border: none; 
    background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%);
    color: white; font-weight: 700; cursor: pointer; transition: 0.2s;
    box-shadow: 0 4px 10px rgba(79, 70, 229, 0.3); margin-bottom: 1.5rem;
  }
  .gen-btn:hover:not(:disabled) { transform: translateY(-2px); }
  .gen-btn:disabled { opacity: 0.7; cursor: wait; }

  /* CONSOLE LOG */
  .console { 
    background: #1e293b; border-radius: 8px; padding: 1rem; color: #4ade80; 
    font-family: 'JetBrains Mono', monospace; font-size: 0.8rem; margin-bottom: 1.5rem; 
    min-height: 50px; display: flex; align-items: center;
  }

  /* CODE BOX WITH HIGHLIGHTING */
  .code-container {
    background: #0f172a; padding: 1rem; border-radius: 8px; font-family: 'JetBrains Mono', monospace;
    font-size: 0.75rem; color: #d1d5db; overflow-x: auto; flex: 1; border: 1px solid #334155;
    position: relative;
  }
  .code-line { display: block; padding: 2px 8px; border-radius: 4px; }
  .code-line.active { background: #1e40af; color: #fff; font-weight: bold; border-left: 3px solid #60a5fa; }
  
  .play-controls { display: flex; gap: 10px; margin-bottom: 1rem; }
  .ctrl-btn { flex:1; padding: 0.6rem; border:none; border-radius:6px; cursor:pointer; font-weight:600; background:#f1f5f9; color:#475569; }
  .ctrl-btn.primary { background: #10b981; color: white; }

  /* LOADING */
  .loading-overlay {
    position: absolute; top:0; left:0; width:100%; height:100%;
    background: rgba(255,255,255,0.85); backdrop-filter: blur(5px);
    display: flex; flex-direction: column; align-items: center; justify-content: center; z-index: 50;
  }
  .spinner { width: 40px; height: 40px; border: 4px solid #4f46e5; border-top-color: transparent; border-radius: 50%; animation: spin 1s linear infinite; }
  @keyframes spin { to { transform: rotate(360deg); } }
`;

// ==========================================
// 2. 3D COMPONENTS
// ==========================================

function GenericArrayNode({ val, idx, total, activeColor, label }) {
  const mesh = useRef();
  const gap = 1.6;
  const startX = -((total * gap) / 2) + (gap / 2);
  const targetX = startX + (idx * gap);
  
  const color = activeColor || "#e2e8f0";
  const yPos = activeColor ? 0.6 : 0; 

  useFrame((_, delta) => {
    if(!mesh.current) return;
    mesh.current.position.x = THREE.MathUtils.lerp(mesh.current.position.x, targetX, delta * 8);
    mesh.current.position.y = THREE.MathUtils.lerp(mesh.current.position.y, yPos, delta * 8);
  });

  return (
    <group ref={mesh} position={[targetX, 0, 0]}>
      <RoundedBox args={[1.2, 1.2, 0.2]} radius={0.15}>
        <meshStandardMaterial color={color} />
      </RoundedBox>
      <RoundedBox args={[1.25, 1.25, 0.18]} radius={0.15}>
        <meshBasicMaterial color="#1e293b" side={THREE.BackSide} />
      </RoundedBox>
      
      <Text position={[0, 0, 0.12]} fontSize={0.5} color="#0f172a" fontWeight={800}>
        {val !== undefined && val !== null ? val : "?"}
      </Text>
      <Text position={[0, -0.9, 0]} fontSize={0.25} color="#64748b">{idx}</Text>
      
      {label && (
        <Html position={[0, 1.4, 0]} center>
          <div style={{
            background:'#4f46e5', color:'white', padding:'4px 8px', 
            borderRadius:'6px', fontSize:'0.7rem', fontWeight:'bold', 
            boxShadow:'0 4px 6px rgba(0,0,0,0.2)'
          }}>
            {label}
          </div>
        </Html>
      )}
    </group>
  );
}

// ==========================================
// 3. MAIN LOGIC
// ==========================================
export default function AIAlgoBuilder({ onBack }) {
  const [prompt, setPrompt] = useState("Sum of elements in [2, 5, 1]");
  const [title, setTitle] = useState("AI Algo Builder");
  
  const [frames, setFrames] = useState([]); 
  const [generatedCode, setGeneratedCode] = useState(""); // Stores the C++ Code
  const [currentStep, setCurrentStep] = useState(0);
  
  const [isLoading, setIsLoading] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [log, setLog] = useState("Describe a problem to generate code & visuals.");

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

  // UPDATE LOG
  useEffect(() => {
    if (frames.length > 0 && frames[currentStep]) {
      setLog(frames[currentStep].message || `Step ${currentStep + 1}`);
    }
  }, [currentStep, frames]);

// --- GEMINI API CALL ---
const generateVisualization = async () => {
  if (!prompt.trim()) return;

  setIsLoading(true);
  setFrames([]);
  setGeneratedCode("");
  setCurrentStep(0);
  setIsPlaying(false);
  setLog("Generating Algorithm & Steps...");

  setTitle(prompt.length > 20 ? prompt.substring(0, 20) + "..." : prompt);

  try {
    const systemPrompt = `
      You are an Algorithm Engine. 
      1. Write a clean C++ function for the user's request.
      2. Simulate it step-by-step on a small array.

      Return a VALID JSON OBJECT with this EXACT structure:
      {
        "code": "Actual C++ code string here (use \\n for newlines)",
        "frames": [
          {
            "array": [number, number], 
            "highlights": { "index": "color_hex" }, 
            "labels": { "index": "label_text" },
            "message": "Short description",
            "line": 5
          }
        ]
      }

      Rules:
      - "highlights": Use "#ef4444" (Compare), "#22c55e" (Found), "#f59e0b" (Swap).
      - "line": MUST match the line number in your generated "code".
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
      throw new Error("No response from AI");

    let rawText = data.candidates[0].content.parts[0].text;

    rawText = rawText
      .replace(/```json/g, "")
      .replace(/```/g, "")
      .trim();

    const parsedData = JSON.parse(rawText);

    if (parsedData.frames && parsedData.frames.length > 0) {
      setFrames(parsedData.frames);
      setGeneratedCode(parsedData.code || "// No code generated");
      setLog("Visualization Ready!");
    } else {
      setLog("AI returned invalid data.");
    }

  } catch (error) {
    console.error(error);
    setLog(`Error: ${error.message}`);
  } finally {
    setIsLoading(false);
  }
};


  const activeFrame = frames.length > 0 ? frames[currentStep] : null;
  const activeLine = activeFrame ? activeFrame.line : -1;

  // Split code into lines for rendering
  const codeLines = generatedCode.split('\n');

  return (
    <>
      <style>{styles}</style>
      <div className="builder-container">
        
        {/* LEFT: 3D VIZ PANEL */}
        <div className="viz-panel">
          {isLoading && (
             <div className="loading-overlay">
                <div className="spinner"></div>
                <p style={{marginTop:'1rem', color:'#4f46e5', fontWeight:'800'}}>Building Logic & Scene...</p>
             </div>
          )}

          {!isLoading && frames.length === 0 && (
            <div className="loading-overlay" style={{background:'transparent'}}>
               <p style={{color:'#64748b', fontSize:'1.2rem'}}>Enter a problem to begin.</p>
            </div>
          )}

          <Canvas camera={{ position: [0, 2, 10], fov: 45 }}>
            <ambientLight intensity={1} />
            <directionalLight position={[5, 10, 5]} intensity={1.5} />
            <Environment preset="city" />
            <Center>
              <group>
                {activeFrame && activeFrame.array && activeFrame.array.map((val, i) => (
                  <GenericArrayNode 
                    key={i} 
                    val={val} 
                    idx={i} 
                    total={activeFrame.array.length}
                    activeColor={activeFrame.highlights ? activeFrame.highlights[i] : null}
                    label={activeFrame.labels ? activeFrame.labels[i] : null}
                  />
                ))}
              </group>
            </Center>
            <ContactShadows position={[0, -2, 0]} opacity={0.5} scale={30} blur={2} />
          </Canvas>
        </div>

        {/* RIGHT: CONTROL PANEL */}
        <div className="ctrl-panel">
          <div className="header-row">
            <button className="back-btn" onClick={onBack}>← Back</button>
            <h2>{title}</h2>
          </div>

          <div className="input-group">
            <input 
              className="ai-input" 
              placeholder="e.g. Find minimum in [5, 2, 9, 1]"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
            />
          </div>

          <button className="gen-btn" onClick={generateVisualization} disabled={isLoading}>
             {isLoading ? "Thinking..." : "✨ Generate Code & Visuals"}
          </button>

          {/* PLAYBACK CONTROLS */}
          {frames.length > 0 && (
            <div className="play-controls">
              <button className="ctrl-btn" onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}>Prev</button>
              <button className="ctrl-btn primary" onClick={() => setIsPlaying(!isPlaying)}>
                {isPlaying ? "Pause" : "Play Animation"}
              </button>
              <button className="ctrl-btn" onClick={() => setCurrentStep(Math.min(frames.length - 1, currentStep + 1))}>Next</button>
            </div>
          )}

          <div className="console">
            {log}
          </div>

          {/* CODE DISPLAY AREA */}
          <div className="code-container">
            {codeLines.length > 0 ? (
              codeLines.map((line, i) => (
                <span 
                  key={i} 
                  className={`code-line ${i + 1 === activeLine ? 'active' : ''}`}
                >
                  <span style={{color:'#64748b', marginRight:'10px', userSelect:'none'}}>{i + 1}</span>
                  {line}
                </span>
              ))
            ) : (
              <div style={{padding:'1rem', textAlign:'center', color:'#4b5563'}}>
                Code will appear here...
              </div>
            )}
          </div>
          
        </div>

      </div>
    </>
  );

}

