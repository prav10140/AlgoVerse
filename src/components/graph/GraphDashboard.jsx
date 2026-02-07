import React from 'react';
import { Canvas } from '@react-three/fiber';
import { Float, Center, Sphere, Line } from '@react-three/drei';
import * as THREE from 'three';

// ==========================================
// 1. STYLES (Standardized)
// ==========================================
const styles = `
  .graph-dash-container { 
    width: 100%; height: 100vh; display: flex; flex-direction: column; 
    background: #fff; font-family: 'Inter', sans-serif; overflow-y: auto; 
  }
  
  .header-section { padding: 2rem 5%; }
  .back-btn { background: none; border: none; color: #6b7280; font-weight: 600; cursor: pointer; font-size: 1rem; }
  .back-btn:hover { color: #15803d; }
  
  h1 { font-size: 3rem; font-weight: 800; margin-top: 1rem; color: #111827; }
  .highlight { color: #06b6d4; } /* Cyan for Graphs */
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
  .question-card:hover { transform: translateY(-5px); box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1); border-color: #06b6d4; }

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
    background: linear-gradient(135deg, #06b6d4 0%, #3b82f6 100%);
    border-radius: 50%; display: flex; align-items: center; justify-content: center;
    cursor: pointer; box-shadow: 0 10px 25px rgba(6, 182, 212, 0.4);
    transition: transform 0.3s, box-shadow 0.3s; z-index: 1000;
    border: 2px solid rgba(255, 255, 255, 0.2);
  }
  .ai-float-btn:hover { transform: scale(1.1) translateY(-5px); box-shadow: 0 15px 35px rgba(6, 182, 212, 0.6); }
  .ai-icon { font-size: 32px; color: white; filter: drop-shadow(0 2px 4px rgba(0,0,0,0.2)); }
`;

// ==========================================
// 2. MINI 3D ICON (Graph Network Style)
// ==========================================
function MiniGraphIcon({ color }) {
  // Simple Triangle Graph
  const p1 = [-0.6, -0.5, 0];
  const p2 = [0.6, -0.5, 0];
  const p3 = [0, 0.6, 0];

  return (
    <Canvas camera={{ position: [0, 0, 5] }}>
      <ambientLight intensity={1} />
      <Float speed={2} rotationIntensity={1.5}>
        <Center>
          <group>
            {/* Nodes */}
            <Sphere args={[0.25, 16, 16]} position={p1}><meshStandardMaterial color={color} /></Sphere>
            <Sphere args={[0.25, 16, 16]} position={p2}><meshStandardMaterial color={color} /></Sphere>
            <Sphere args={[0.25, 16, 16]} position={p3}><meshStandardMaterial color={color} /></Sphere>

            {/* Edges */}
            <Line points={[p1, p2]} color="#94a3b8" lineWidth={3} transparent opacity={0.5} />
            <Line points={[p2, p3]} color="#94a3b8" lineWidth={3} transparent opacity={0.5} />
            <Line points={[p3, p1]} color="#94a3b8" lineWidth={3} transparent opacity={0.5} />
          </group>
        </Center>
      </Float>
    </Canvas>
  );
}

// ==========================================
// 3. MAIN COMPONENT
// ==========================================
export default function GraphDashboard({ onNavigate, onBack }) {
  const questions = [
    { id: 'basic', title: 'Graph Basics', desc: 'Adjacency Matrix, BFS, and DFS.', difficulty: 'easy', color: '#06b6d4' },
    { id: 'dijkstra', title: 'Dijkstra Algorithm', desc: 'Shortest path in weighted graphs.', difficulty: 'medium', color: '#8b5cf6' },
    { id: 'topo', title: 'Topological Sort', desc: 'Linear ordering of vertices (DAG).', difficulty: 'medium', color: '#f59e0b' },
    { id: 'mst', title: 'Minimum Spanning Tree', desc: 'Prim\'s and Kruskal\'s algorithms.', difficulty: 'hard', color: '#ef4444' },
  ];

  return (
    <>
      <style>{styles}</style>
      <div className="graph-dash-container">
        
        {/* HEADER */}
        <div className="header-section">
          <button className="back-btn" onClick={onBack}>← Back to Library</button>
          <h1>Graph <span className="highlight">Visualizer</span></h1>
          <p className="subtitle">Nodes, Edges, and Network Algorithms.</p>
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
                <MiniGraphIcon color={q.color} />
              </div>
            </div>
          ))}
        </div>

        {/* FLOATING AI BUTTON */}
        <div className="ai-float-btn" onClick={() => onNavigate('ai-builder')}>
          <div className="ai-icon">✨</div>
        </div>

      </div>
    </>
  );
}