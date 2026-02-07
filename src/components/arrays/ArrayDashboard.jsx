import React from 'react';
import { Canvas } from '@react-three/fiber';
import { Float, Center, RoundedBox } from '@react-three/drei';
import './ArrayStyles.css';

// =========================================
// 1. CSS STYLES FOR THE BUTTON
// =========================================
const aiButtonStyle = `
  .ai-float-btn {
    position: fixed;
    bottom: 40px;
    right: 40px;
    width: 70px;
    height: 70px;
    background: linear-gradient(135deg, #6366f1 0%, #a855f7 100%);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    box-shadow: 0 10px 25px rgba(124, 58, 237, 0.4);
    transition: transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275), box-shadow 0.3s ease;
    z-index: 1000;
    border: 2px solid rgba(255, 255, 255, 0.2);
  }

  .ai-float-btn:hover {
    transform: scale(1.1) translateY(-5px);
    box-shadow: 0 15px 35px rgba(124, 58, 237, 0.6);
  }

  /* The Icon inside */
  .ai-icon {
    font-size: 32px;
    color: white;
    filter: drop-shadow(0 2px 4px rgba(0,0,0,0.2));
  }

  /* The Pulse Ring Animation */
  .ai-pulse-ring {
    position: absolute;
    top: 0; left: 0; right: 0; bottom: 0;
    border-radius: 50%;
    border: 2px solid #a855f7;
    animation: pulse-ring 2s infinite;
    opacity: 0;
    z-index: -1;
  }

  @keyframes pulse-ring {
    0% { transform: scale(1); opacity: 0.7; }
    100% { transform: scale(1.6); opacity: 0; }
  }

  /* Tooltip Label */
  .ai-label {
    position: absolute;
    bottom: -30px;
    left: 50%;
    transform: translateX(-50%);
    background: #1e293b;
    color: white;
    padding: 4px 10px;
    border-radius: 12px;
    font-size: 0.75rem;
    font-weight: 700;
    white-space: nowrap;
    opacity: 0;
    transition: opacity 0.2s, transform 0.2s;
    pointer-events: none;
  }

  .ai-float-btn:hover .ai-label {
    opacity: 1;
    transform: translateX(-50%) translateY(5px);
  }
`;

// =========================================
// 2. MINI 3D ICON (For Question Cards)
// =========================================
function MiniArrayIcon({ color }) {
  return (
    <Canvas camera={{ position: [0, 0, 5] }}>
      <ambientLight intensity={1} />
      <Float speed={3} rotationIntensity={1}>
        <Center>
          <group>
            {[-0.6, 0, 0.6].map((x, i) => (
              <RoundedBox key={i} args={[0.5, 0.5, 0.5]} radius={0.05} position={[x, 0, 0]}>
                <meshStandardMaterial color={color} />
              </RoundedBox>
            ))}
          </group>
        </Center>
      </Float>
    </Canvas>
  );
}

// =========================================
// 3. MAIN COMPONENT
// =========================================
export default function ArrayDashboard({ onNavigate, onBack }) {
  const questions = [
    { id: 'basic', title: 'Basic Operations', desc: 'Insert, Delete, Search, Traverse.', difficulty: 'easy', color: '#15803d' },
    { id: 'twosum', title: 'Two Sum', desc: 'Find two numbers that add up to Target.', difficulty: 'easy', color: '#3b82f6' },
    { id: 'reverse', title: 'Reverse Array', desc: 'Swap elements using Two Pointers.', difficulty: 'medium', color: '#f97316' },
    { id: 'rotate', title: 'Rotate Array', desc: 'Right rotate by K using 3 reversals.', difficulty: 'medium', color: '#8b5cf6' },
    { id: 'findpeak', title: 'Find Peak', desc: 'Binary Search on Heights (O(log N)).', difficulty: 'medium', color: '#10b981' },
    { id: 'sortcolors', title: 'Sort Colors', desc: 'Dutch National Flag (0, 1, 2).', difficulty: 'medium', color: '#ef4444' },
    { id: 'majority', title: 'Majority Element', desc: "Moore's Voting Algorithm (O(N)).", difficulty: 'medium', color: '#f59e0b' },
    { id: 'set-zeroes', title: 'Set Matrix Zeroes', desc: 'O(1) space optimization using markers.', difficulty: 'medium', color: '#f97316' },
  ];

  return (
    <>
      <style>{aiButtonStyle}</style>
      
      <div className="array-container" style={{ flexDirection: 'column', overflowY: 'auto' }}>
        <div style={{ padding: '2rem 5%' }}>
          <button className="back-btn" onClick={onBack}>← Back to Library</button>
          <h1 style={{ fontSize: '3rem', fontWeight: '800', marginTop: '1rem' }}>
            Array <span style={{ color: '#15803d' }}>Problems</span>
          </h1>
          <p style={{ color: '#6b7280' }}>Select a problem to visualize the algorithm.</p>
        </div>

        <div className="dashboard-grid">
          {questions.map((q) => (
            <div key={q.id} className="question-card" onClick={() => onNavigate(q.id)}>
              <span className={`difficulty ${q.difficulty}`}>{q.difficulty}</span>
              <div>
                <h3>{q.title}</h3>
                <p>{q.desc}</p>
              </div>
              {/* Mini 3D Icon at bottom right */}
              <div style={{ position: 'absolute', bottom: -20, right: -20, width: 100, height: 100, opacity: 0.8 }}>
                <MiniArrayIcon color={q.color} />
              </div>
            </div>
          ))}
        </div>

        {/* --- SIMPLE BUT BEST AI BUTTON --- */}
        <div className="ai-float-btn" onClick={() => onNavigate('ai-builder')}>
          {/* Pulse Effect */}
          <div className="ai-pulse-ring"></div>
          
          {/* Icon (Sparkles Emoji or SVG) */}
          <div className="ai-icon">✨</div>
          
          {/* Label on Hover */}
          <div className="ai-label">AI Builder</div>
        </div>
        
      </div>
    </>
  );
}