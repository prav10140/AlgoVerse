import React, { useRef, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float, Environment, Center } from '@react-three/drei';
import './TopicsPage.css';

// --- TOPIC DATA ---
const TOPICS = [
  { id: 'array', title: 'Arrays', desc: 'Contiguous memory access.', type: 'row' },
  { id: 'll', title: 'Linked Lists', desc: 'Dynamic node chains.', type: 'chain' },
  { id: 'stack', title: 'Stacks', desc: 'LIFO logic control.', type: 'stack' },
  { id: 'queue', title: 'Queues', desc: 'FIFO processing.', type: 'queue' },
  { id: 'tree', title: 'Trees', desc: 'Recursive hierarchies.', type: 'pyramid' },
  { id: 'graph', title: 'Graphs', desc: 'Network relationships.', type: 'complex' },
  { id: 'sorting', title: 'Sorting', desc: 'Algorithmic ordering.', type: 'bars' },
  { id: 'search', title: 'Searching', desc: 'Binary & Linear search.', type: 'glass' },
];

// --- 3D ICON COMPONENT ---
function Topic3DIcon({ type, hovered }) {
  const group = useRef();
  
  useFrame((state, delta) => {
    if (!group.current) return;
    // Rotate faster on hover
    const speed = hovered ? 2.5 : 0.5;
    group.current.rotation.y += delta * speed;
    // Gentle bobbing
    group.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.5) * 0.1;
  });

  // --- FIX: VISIBILITY LOGIC ---
  // Normal: Dark Green (#15803d)
  // Hover: Bright Green (#4ade80) with slight glow (emissive)
  // We removed the wireframe/transparent logic because it was invisible
  const material = (
    <meshStandardMaterial 
      color={hovered ? "#22c55e" : "#15803d"} 
      emissive={hovered ? "#22c55e" : "#000000"}
      emissiveIntensity={hovered ? 0.4 : 0}
      roughness={0.2} 
      metalness={0.3} 
    />
  );

  const renderShape = () => {
    if (type === 'row') return <group>{[-0.9, 0, 0.9].map((x, i) => <mesh key={i} position={[x,0,0]}><boxGeometry args={[0.75,0.75,0.75]}/>{material}</mesh>)}</group>;
    if (type === 'chain') return <group>{[-0.8, 0, 0.8].map((x, i) => <mesh key={i} position={[x,0,0]}><sphereGeometry args={[0.5, 16, 16]}/>{material}</mesh>)}<mesh rotation={[0,0,Math.PI/2]}><cylinderGeometry args={[0.1,0.1,1.5]}/>{material}</mesh></group>;
    if (type === 'stack') return <group>{[-0.35, 0, 0.35].map((y, i) => <mesh key={i} position={[0,y,0]}><cylinderGeometry args={[0.7,0.7,0.25,32]}/>{material}</mesh>)}</group>;
    if (type === 'pyramid') return <mesh position={[0,-0.4,0]}><coneGeometry args={[1.1,1.9,4]}/>{material}</mesh>;
    if (type === 'bars') return <group><mesh position={[-0.5,-0.4,0]}><boxGeometry args={[0.35,0.9,0.35]}/>{material}</mesh><mesh position={[0,0,0]}><boxGeometry args={[0.35,1.8,0.35]}/>{material}</mesh><mesh position={[0.5,-0.2,0]}><boxGeometry args={[0.35,1.3,0.35]}/>{material}</mesh></group>;
    if (type === 'complex') return <mesh><icosahedronGeometry args={[1.0,0]}/>{material}</mesh>;
    
    // Default
    return <mesh><boxGeometry args={[1.2,1.2,1.2]}/>{material}</mesh>;
  };

  return <group ref={group}><Center>{renderShape()}</Center></group>;
}

// --- CARD COMPONENT ---
function TopicCard({ topic, onClick }) {
  const [hovered, setHover] = useState(false);

  return (
    <div 
      className="topic-card"
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      onClick={onClick}
      style={{ cursor: 'pointer' }}
    >
      <div className="card-visual">
        <Canvas camera={{ position: [0, 0, 4.5], fov: 45 }} gl={{ alpha: true }}>
          <ambientLight intensity={1.5} />
          <spotLight position={[10, 10, 10]} intensity={1} />
          <Environment preset="city" />
          <Float speed={hovered ? 5 : 2} rotationIntensity={0.5} floatIntensity={0.3}>
            <Topic3DIcon type={topic.type} hovered={hovered} />
          </Float>
        </Canvas>
      </div>

      <div className="card-info">
        <h3>{topic.title}</h3>
        <p>{topic.desc}</p>
        <div className={`status-pill ${hovered ? 'active' : ''}`}>
           {hovered ? 'Launch' : '• Ready'}
        </div>
      </div>
    </div>
  );
}

// --- MAIN EXPORT ---
export default function TopicsPage({ onBack, onSelectTopic }) {
  return (
    <div className="topics-page">
      <div className="bg-grid"></div>

      <header className="page-header">
        <div className="header-left">
          <button className="back-btn" onClick={onBack}>← Back</button>
          <h1>Concept <span className="highlight-green">Library</span></h1>
        </div>
        <p className="header-desc">
          Select a data structure to launch the interactive laboratory.
        </p>
      </header>

      <div className="topics-grid">
        {TOPICS.map((t) => (
          <TopicCard 
            key={t.id} 
            topic={t} 
            onClick={() => onSelectTopic(t.id)} 
          />
        ))}
      </div>
    </div>
  );
}