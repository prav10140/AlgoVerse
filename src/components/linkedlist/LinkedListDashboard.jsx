import React, { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float, Center, RoundedBox, Sphere, MeshDistortMaterial, Cylinder } from '@react-three/drei';

// ==========================================
// 1. STYLES (Exact match to ArrayDashboard)
// ==========================================
const styles = `
  .ll-dash-container { 
    width: 100%; height: 100vh; display: flex; flex-direction: column; 
    background: #fff; font-family: 'Inter', sans-serif; overflow-y: auto; 
  }
  
  .header-section { padding: 2rem 5%; }
  .back-btn { background: none; border: none; color: #6b7280; font-weight: 600; cursor: pointer; font-size: 1rem; }
  .back-btn:hover { color: #15803d; }
  
  h1 { font-size: 3rem; font-weight: 800; margin-top: 1rem; color: #111827; }
  .highlight { color: #15803d; }
  .subtitle { color: #6b7280; margin-top: 0.5rem; }

  .dashboard-grid { 
    display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); 
    gap: 1.5rem; padding: 0 5% 4rem 5%; 
  }

  .question-card {
    background: #fff; border: 1px solid #e5e7eb; border-radius: 16px; padding: 1.5rem;
    cursor: pointer; position: relative; overflow: hidden; transition: all 0.3s ease;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05); min-height: 180px;
    display: flex; flex-direction: column; justify-content: space-between;
  }
  .question-card:hover { transform: translateY(-5px); box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1); border-color: #15803d; }

  .difficulty { 
    display: inline-block; padding: 4px 12px; border-radius: 99px; 
    font-size: 0.75rem; font-weight: 700; text-transform: uppercase; margin-bottom: 1rem;
    align-self: flex-start;
  }
  .difficulty.easy { background: #dcfce7; color: #15803d; }
  .difficulty.medium { background: #fef3c7; color: #d97706; }
  .difficulty.hard { background: #fee2e2; color: #dc2626; }

  h3 { font-size: 1.25rem; font-weight: 700; color: #1f2937; margin: 0 0 0.5rem 0; }
  p { color: #6b7280; font-size: 0.9rem; line-height: 1.5; margin: 0; max-width: 80%; }

  /* FLOATING AI BUTTON */
  .ai-float-btn {
    position: fixed; bottom: 40px; right: 40px; width: 70px; height: 70px;
    background: linear-gradient(135deg, #6366f1 0%, #a855f7 100%);
    border-radius: 50%; display: flex; align-items: center; justify-content: center;
    cursor: pointer; box-shadow: 0 10px 25px rgba(124, 58, 237, 0.4);
    transition: transform 0.3s, box-shadow 0.3s; z-index: 1000;
    border: 2px solid rgba(255, 255, 255, 0.2);
  }
  .ai-float-btn:hover { transform: scale(1.1) translateY(-5px); box-shadow: 0 15px 35px rgba(124, 58, 237, 0.6); }
  .ai-icon { font-size: 32px; color: white; filter: drop-shadow(0 2px 4px rgba(0,0,0,0.2)); }
  .ai-pulse-ring {
    position: absolute; top: 0; left: 0; right: 0; bottom: 0; border-radius: 50%;
    border: 2px solid #a855f7; animation: pulse-ring 2s infinite; opacity: 0; z-index: -1;
  }
  @keyframes pulse-ring { 0% { transform: scale(1); opacity: 0.7; } 100% { transform: scale(1.6); opacity: 0; } }
  .ai-label {
    position: absolute; bottom: -30px; left: 50%; transform: translateX(-50%);
    background: #1e293b; color: white; padding: 4px 10px; border-radius: 12px;
    font-size: 0.75rem; font-weight: 700; white-space: nowrap; opacity: 0;
    transition: opacity 0.2s; pointer-events: none;
  }
  .ai-float-btn:hover .ai-label { opacity: 1; }
`;

// ==========================================
// 2. MINI 3D ICON (Linked List Style)
// ==========================================
function MiniLinkedListIcon({ color }) {
  return (
    <Canvas camera={{ position: [0, 0, 5] }}>
      <ambientLight intensity={1} />
      <Float speed={3} rotationIntensity={1}>
        <Center>
          <group>
            {/* Node 1 */}
            <RoundedBox args={[0.6, 0.6, 0.2]} radius={0.1} position={[-1.2, 0, 0]}>
              <meshStandardMaterial color={color} />
            </RoundedBox>
            {/* Pointer 1 */}
            <group position={[-0.6, 0, 0]} rotation={[0, 0, -1.57]}>
               <Cylinder args={[0.05, 0.05, 0.6]}><meshStandardMaterial color="#9ca3af" /></Cylinder>
            </group>
            
            {/* Node 2 */}
            <RoundedBox args={[0.6, 0.6, 0.2]} radius={0.1} position={[0, 0, 0]}>
              <meshStandardMaterial color={color} />
            </RoundedBox>
            {/* Pointer 2 */}
            <group position={[0.6, 0, 0]} rotation={[0, 0, -1.57]}>
               <Cylinder args={[0.05, 0.05, 0.6]}><meshStandardMaterial color="#9ca3af" /></Cylinder>
            </group>

            {/* Node 3 */}
            <RoundedBox args={[0.6, 0.6, 0.2]} radius={0.1} position={[1.2, 0, 0]}>
              <meshStandardMaterial color={color} />
            </RoundedBox>
          </group>
        </Center>
      </Float>
    </Canvas>
  );
}

// ==========================================
// 3. MAIN COMPONENT
// ==========================================
export default function LinkedListDashboard({ onNavigate, onBack }) {
  const questions = [
    { id: 'basic', title: 'Basic Operations', desc: 'Insertion, Deletion at Head, Tail, or Index.', difficulty: 'easy', color: '#15803d' },
    { id: 'reverse', title: 'Reverse List', desc: 'Reverse a linked list iteratively or recursively.', difficulty: 'medium', color: '#3b82f6' },
    { id: 'cycle', title: 'Detect Cycle', desc: "Floyd's Tortoise and Hare Algorithm.", difficulty: 'medium', color: '#f59e0b' },
    { id: 'merge', title: 'Merge Two Lists', desc: 'Merge two sorted linked lists into one.', difficulty: 'medium', color: '#8b5cf6' },
    { id: 'remove-nth', title: 'Remove Nth Node', desc: 'Remove the Nth node from the end of the list.', difficulty: 'medium', color: '#ef4444' },
    { id: 'palindrome', title: 'Palindrome List', desc: 'Check if a linked list is a palindrome.', difficulty: 'hard', color: '#ec4899' },
  ];

  return (
    <>
      <style>{styles}</style>
      <div className="ll-dash-container">
        
        {/* HEADER */}
        <div className="header-section">
          <button className="back-btn" onClick={onBack}>← Back to Library</button>
          <h1>Linked List <span className="highlight">Problems</span></h1>
          <p className="subtitle">Select a problem to visualize the algorithm.</p>
        </div>

        {/* GRID */}
        <div className="dashboard-grid">
          {questions.map((q) => (
            <div key={q.id} className="question-card" onClick={() => onNavigate(q.id)}>
              <span className={`difficulty ${q.difficulty}`}>{q.difficulty}</span>
              <div>
                <h3>{q.title}</h3>
                <p>{q.desc}</p>
              </div>
              
              {/* Mini 3D Icon (Bottom Right) */}
              <div style={{ position: 'absolute', bottom: -25, right: -25, width: 110, height: 110, opacity: 0.9 }}>
                <MiniLinkedListIcon color={q.color} />
              </div>
            </div>
          ))}
        </div>

        {/* FLOATING AI BUTTON */}
        <div className="ai-float-btn" onClick={() => onNavigate('ai-builder')}>
          <div className="ai-pulse-ring"></div>
          <div className="ai-icon">✨</div>
          <div className="ai-label">AI Builder</div>
        </div>

      </div>
    </>
  );
}