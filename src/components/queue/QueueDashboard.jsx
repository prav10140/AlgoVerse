import React from 'react';
import { Canvas } from '@react-three/fiber';
import { Float, Center, RoundedBox } from '@react-three/drei';

// Reuse styles from Stack Dashboard but adapted for Queue color
const styles = `
  .queue-dash-container { 
    width: 100%; height: 100vh; display: flex; flex-direction: column; 
    background: #fff; font-family: 'Inter', sans-serif; overflow-y: auto; 
  }
  .header-section { padding: 2rem 5%; }
  .back-btn { background: none; border: none; color: #6b7280; font-weight: 600; cursor: pointer; font-size: 1rem; }
  h1 { font-size: 3rem; font-weight: 800; margin-top: 1rem; color: #111827; }
  .highlight { color: #8b5cf6; } /* Purple for Queue */
  .subtitle { color: #6b7280; margin-top: 0.5rem; }
  .dashboard-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 1.5rem; padding: 0 5% 4rem 5%; }
  .question-card {
    background: #fff; border: 1px solid #e5e7eb; border-radius: 16px; padding: 1.5rem;
    cursor: pointer; position: relative; overflow: hidden; transition: all 0.3s ease;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05); min-height: 180px;
    display: flex; flex-direction: column; justify-content: space-between;
  }
  .question-card:hover { transform: translateY(-5px); box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1); border-color: #8b5cf6; }
  .difficulty { display: inline-block; padding: 4px 12px; border-radius: 99px; font-size: 0.75rem; font-weight: 700; text-transform: uppercase; margin-bottom: 1rem; align-self: flex-start; }
  .difficulty.easy { background: #dcfce7; color: #15803d; }
  .difficulty.medium { background: #fef3c7; color: #d97706; }
  h3 { font-size: 1.25rem; font-weight: 700; color: #1f2937; margin: 0 0 0.5rem 0; }
  p { color: #6b7280; font-size: 0.9rem; line-height: 1.5; margin: 0; max-width: 80%; }
`;

function MiniQueueIcon({ color }) {
  return (
    <Canvas camera={{ position: [0, 0, 5] }}>
      <ambientLight intensity={1} />
      <Float speed={3} rotationIntensity={1}>
        <Center>
            {/* Horizontal Queue */}
            <group>
                <RoundedBox args={[0.5, 0.5, 0.5]} radius={0.1} position={[-0.6, 0, 0]}><meshStandardMaterial color={color} /></RoundedBox>
                <RoundedBox args={[0.5, 0.5, 0.5]} radius={0.1} position={[0, 0, 0]}><meshStandardMaterial color={color} /></RoundedBox>
                <RoundedBox args={[0.5, 0.5, 0.5]} radius={0.1} position={[0.6, 0, 0]}><meshStandardMaterial color={color} /></RoundedBox>
            </group>
        </Center>
      </Float>
    </Canvas>
  );
}

export default function QueueDashboard({ onNavigate, onBack }) {
  const questions = [
    { id: 'basic', title: 'Basic Operations', desc: 'Enqueue, Dequeue, Front, and Empty.', difficulty: 'easy', color: '#8b5cf6' },
    { id: 'circular', title: 'Circular Queue', desc: 'Connect rear to front to save space.', difficulty: 'medium', color: '#ec4899' },
  ];

  return (
    <>
      <style>{styles}</style>
      <div className="queue-dash-container">
        <div className="header-section">
          <button className="back-btn" onClick={onBack}>← Back to Library</button>
          <h1>Queue <span className="highlight">Visualizer</span></h1>
          <p className="subtitle">FIFO (First In, First Out) Data Structure.</p>
        </div>

        <div className="dashboard-grid">
          {questions.map((q) => (
            <div key={q.id} className="question-card" onClick={() => onNavigate(q.id)}>
              <span className={`difficulty ${q.difficulty}`}>{q.difficulty}</span>
              <div>
                <h3>{q.title}</h3>
                <p>{q.desc}</p>
              </div>
              <div style={{ position: 'absolute', bottom: -25, right: -25, width: 110, height: 110, opacity: 0.9 }}>
                <MiniQueueIcon color={q.color} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}