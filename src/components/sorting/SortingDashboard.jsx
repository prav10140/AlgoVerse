import React from 'react';
import { Canvas } from '@react-three/fiber';
import { Float, Center, RoundedBox } from '@react-three/drei';

// ==========================================
// 1. STYLES (Green & White Theme)
// ==========================================
const styles = `
  .sort-dash-container { 
    width: 100%; height: 100vh; display: flex; flex-direction: column; 
    background: #f0fdf4; /* Very light green tint background */
    font-family: 'Inter', sans-serif; overflow-y: auto; 
  }
  
  .header-section { padding: 2rem 5%; }
  .back-btn { background: none; border: none; color: #64748b; font-weight: 600; cursor: pointer; font-size: 1rem; transition: 0.2s; }
  .back-btn:hover { color: #15803d; transform: translateX(-5px); }
  
  h1 { font-size: 3rem; font-weight: 800; margin-top: 1rem; color: #166534; }
  .highlight { color: #15803d; } /* Green Highlight */
  .subtitle { color: #64748b; margin-top: 0.5rem; }

  .dashboard-grid { 
    display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); 
    gap: 1.5rem; padding: 0 5% 4rem 5%; 
  }

  .question-card {
    background: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; padding: 1.5rem;
    cursor: pointer; position: relative; overflow: hidden; transition: all 0.3s ease;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05); min-height: 180px;
    display: flex; flex-direction: column; justify-content: space-between;
  }
  .question-card:hover { 
    transform: translateY(-5px); 
    box-shadow: 0 20px 25px -5px rgba(21, 128, 61, 0.15); /* Green Shadow */
    border-color: #15803d; 
  }

  .difficulty { 
    display: inline-block; padding: 4px 12px; border-radius: 99px; 
    font-size: 0.75rem; font-weight: 700; text-transform: uppercase; margin-bottom: 1rem;
    align-self: flex-start;
  }
  .difficulty.easy { background: #dcfce7; color: #15803d; }
  .difficulty.medium { background: #fef9c3; color: #854d0e; }
  .difficulty.hard { background: #fee2e2; color: #991b1b; }

  h3 { font-size: 1.25rem; font-weight: 700; color: #1e293b; margin: 0 0 0.5rem 0; }
  p { color: #64748b; font-size: 0.9rem; line-height: 1.5; margin: 0; max-width: 80%; }

  /* AI BUTTON (Green Gradient) */
  .ai-float-btn {
    position: fixed; bottom: 40px; right: 40px; width: 70px; height: 70px;
    background: linear-gradient(135deg, #16a34a 0%, #0d9488 100%);
    border-radius: 50%; display: flex; align-items: center; justify-content: center;
    cursor: pointer; box-shadow: 0 10px 25px rgba(22, 163, 74, 0.4);
    transition: transform 0.3s, box-shadow 0.3s; z-index: 1000;
    border: 2px solid rgba(255, 255, 255, 0.2);
  }
  .ai-float-btn:hover { transform: scale(1.1) translateY(-5px); box-shadow: 0 15px 35px rgba(22, 163, 74, 0.6); }
  .ai-icon { font-size: 32px; color: white; filter: drop-shadow(0 2px 4px rgba(0,0,0,0.2)); }
`;

// ==========================================
// 2. MINI 3D ICON (Green Theme)
// ==========================================
function MiniSortIcon({ color }) {
  return (
    <Canvas camera={{ position: [0, 2, 5] }}>
      <ambientLight intensity={1} />
      <Float speed={3} rotationIntensity={1}>
        <Center>
          <group>
             <RoundedBox args={[0.4, 0.8, 0.4]} radius={0.05} position={[-0.6, -0.4, 0]}><meshStandardMaterial color={color} /></RoundedBox>
             <RoundedBox args={[0.4, 1.4, 0.4]} radius={0.05} position={[0, -0.1, 0]}><meshStandardMaterial color={color} /></RoundedBox>
             <RoundedBox args={[0.4, 2.0, 0.4]} radius={0.05} position={[0.6, 0.2, 0]}><meshStandardMaterial color={color} /></RoundedBox>
          </group>
        </Center>
      </Float>
    </Canvas>
  );
}

// ==========================================
// 3. MAIN COMPONENT
// ==========================================
export default function SortingDashboard({ onNavigate, onBack }) {
  // Colors updated to match Green/Teal/Yellow aesthetic
  const questions = [
    { id: 'bubble', title: 'Bubble Sort', desc: 'Step-by-step swapping of adjacent elements.', difficulty: 'easy', color: '#15803d' }, // Green
    { id: 'selection', title: 'Selection Sort', desc: 'Finding the minimum and placing it at the start.', difficulty: 'easy', color: '#0ea5e9' }, // Sky Blue
    { id: 'insertion', title: 'Insertion Sort', desc: 'Building the sorted array one item at a time.', difficulty: 'medium', color: '#f59e0b' }, // Yellow
    { id: 'merge', title: 'Merge Sort', desc: 'Divide and conquer strategy.', difficulty: 'medium', color: '#0d9488' }, // Teal
    { id: 'quick', title: 'Quick Sort', desc: 'Partitioning around a pivot.', difficulty: 'hard', color: '#4f46e5' }, // Indigo (Contrast)
  ];

  return (
    <>
      <style>{styles}</style>
      <div className="sort-dash-container">
        
        {/* HEADER */}
        <div className="header-section">
          <button className="back-btn" onClick={onBack}>← Back to Library</button>
          <h1>Sorting <span className="highlight">Visualizer</span></h1>
          <p className="subtitle">Algorithms that organize data.</p>
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
              <div style={{ position: 'absolute', bottom: -25, right: -25, width: 110, height: 110, opacity: 0.9 }}>
                <MiniSortIcon color={q.color} />
              </div>
            </div>
          ))}
        </div>

        <div className="ai-float-btn" onClick={() => onNavigate('ai-builder')}>
          <div className="ai-icon">✨</div>
        </div>

      </div>
    </>
  );
}