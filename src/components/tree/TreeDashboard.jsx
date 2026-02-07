import React from 'react';
import { Canvas } from '@react-three/fiber';
import { Float, Center, Cone, Cylinder } from '@react-three/drei';

// ==========================================
// 1. STYLES (Standardized)
// ==========================================
const styles = `
  .tree-dash-container { 
    width: 100%; height: 100vh; display: flex; flex-direction: column; 
    background: #fff; font-family: 'Inter', sans-serif; overflow-y: auto; 
  }
  
  .header-section { padding: 2rem 5%; }
  .back-btn { background: none; border: none; color: #6b7280; font-weight: 600; cursor: pointer; font-size: 1rem; }
  .back-btn:hover { color: #15803d; }
  
  h1 { font-size: 3rem; font-weight: 800; margin-top: 1rem; color: #111827; }
  .highlight { color: #10b981; } /* Green for Trees */
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
  .question-card:hover { transform: translateY(-5px); box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1); border-color: #10b981; }

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
`;

// ==========================================
// 2. MINI 3D ICON (Tree Style)
// ==========================================
function MiniTreeIcon({ color }) {
  return (
    <Canvas camera={{ position: [0, 0, 5] }}>
      <ambientLight intensity={1} />
      <Float speed={3} rotationIntensity={1}>
        <Center>
          <group>
            {/* Trunk */}
            <Cylinder args={[0.2, 0.3, 1, 8]} position={[0, -0.8, 0]}>
               <meshStandardMaterial color="#92400e" />
            </Cylinder>
            {/* Leaves (Cone) */}
            <Cone args={[1.2, 2, 8]} position={[0, 0.5, 0]}>
               <meshStandardMaterial color={color} />
            </Cone>
          </group>
        </Center>
      </Float>
    </Canvas>
  );
}

// ==========================================
// 3. MAIN COMPONENT
// ==========================================
export default function TreeDashboard({ onNavigate, onBack }) {
  const questions = [
    { id: 'basic', title: 'Binary Search Tree', desc: 'Insert, Search, and understand BST structure.', difficulty: 'easy', color: '#10b981' },
    { id: 'traversal', title: 'Tree Traversals', desc: 'Inorder, Preorder, Postorder logic.', difficulty: 'medium', color: '#f59e0b' },
    { id: 'avl', title: 'AVL Tree', desc: 'Self-balancing trees and rotations.', difficulty: 'hard', color: '#3b82f6' },
  ];

  return (
    <>
      <style>{styles}</style>
      <div className="tree-dash-container">
        
        {/* HEADER */}
        <div className="header-section">
          <button className="back-btn" onClick={onBack}>← Back to Library</button>
          <h1>Tree <span className="highlight">Visualizer</span></h1>
          <p className="subtitle">Hierarchical data structures made simple.</p>
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
              
              {/* Mini 3D Icon */}
              <div style={{ position: 'absolute', bottom: -25, right: -25, width: 110, height: 110, opacity: 0.9 }}>
                <MiniTreeIcon color={q.color} />
              </div>
            </div>
          ))}
        </div>

      </div>
    </>
  );
}