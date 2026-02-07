import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float, ContactShadows, Environment, Text, RoundedBox, Html, Center, MeshTransmissionMaterial } from '@react-three/drei';
import * as THREE from 'three';
import './LandingPage.css';

// ==========================================
// NEW LEFT SIDE: FLOATING CODE BACKGROUND
// ==========================================

// A single floating frosted-glass symbol
function FloatingSymbol({ symbol, position, rotationSpeed, scale }) {
  const mesh = useRef();
  
  useFrame((state, delta) => {
    mesh.current.rotation.x += delta * rotationSpeed.x;
    mesh.current.rotation.y += delta * rotationSpeed.y;
  });

  return (
    <Float speed={2} rotationIntensity={0.5} floatIntensity={0.5} position={position}>
      <mesh ref={mesh} scale={scale}>
        {/* Using a simple box geometry for the glass carrier, text inside */}
        <boxGeometry args={[1.5, 1, 0.2]} />
        {/* Frosted Green Glass Material */}
        <MeshTransmissionMaterial 
          backside
          backsideThickness={2}
          thickness={1}
          roughness={0.4} // Frosted look
          transmission={0.95}
          ior={1.5}
          chromaticAberration={0.2}
          color="#dcfce7" 
        />
        <Text 
          position={[0, 0, 0]} 
          fontSize={0.8} 
          color="#166534" 
          font="https://fonts.gstatic.com/s/jetbrainsmono/v13/tDbY2o-flEEny0FZhsfKu5WU4zr3E_BX0Pn5qRS8.woff"
          anchorX="center" 
          anchorY="middle"
          fontWeight={800}
        >
          {symbol}
        </Text>
      </mesh>
    </Float>
  );
}

// The scene containing multiple floating symbols
function CodeBackgroundScene() {
  // Random positions and speeds for a natural look
  const symbols = [
    { sym: '{ }', pos: [-3, 2, -2], speed: {x:0.1, y:0.2}, scale: 1.2 },
    { sym: '</>', pos: [3, -3, -1], speed: {x:0.2, y:0.1}, scale: 1 },
    { sym: '[ ]', pos: [-2, -2, -3], speed: {x:0.1, y:-0.1}, scale: 1.1 },
    { sym: '->',  pos: [4, 3, -2], speed: {x:-0.1, y:0.2}, scale: 0.9 },
    { sym: 'null', pos: [0, 4, -4], speed: {x:0.05, y:0.05}, scale: 0.8 },
  ];

  return (
    <group>
      <ambientLight intensity={0.5} />
      <pointLight position={[10, 10, 10]} intensity={1} color="#4ade80" />
      {symbols.map((s, i) => (
        <FloatingSymbol key={i} symbol={s.sym} position={s.pos} rotationSpeed={s.speed} scale={s.scale} />
      ))}
      <Environment preset="city" />
    </group>
  );
}


// ==========================================
// RIGHT SIDE: DATA VISUALIZER LOGIC (Unchanged)
// ==========================================
// ... (Keeping the exact same robust logic from the previous best version)
const DATA = [12, 25, 38, 41, 56, 63, 72];

function getLayout(mode, index, total) {
  const pos = new THREE.Vector3();
  if (mode === 'Array') {
    const gap = 1.1; pos.set(-(total * gap) / 2 + index * gap + 0.5, 0, 0);
  } else if (mode === 'LinkedList') {
    const gap = 2.0; pos.set(-(total * gap) / 2 + index * gap + 0.5, 0, 0);
  } else if (mode === 'Tree') {
    if (index === 0) pos.set(0, 2.0, 0);
    else if (index === 1) pos.set(-2.2, 0.2, 0);
    else if (index === 2) pos.set(2.2, 0.2, 0);
    else if (index === 3) pos.set(-3.2, -1.8, 0);
    else if (index === 4) pos.set(-1.2, -1.8, 0);
    else if (index === 5) pos.set(1.2, -1.8, 0);
    else if (index === 6) pos.set(3.2, -1.8, 0);
  } else if (mode === 'Graph') {
    const radius = 3.2;
    const angle = (index / total) * Math.PI * 2 - Math.PI / 2;
    pos.set(Math.cos(angle) * radius, Math.sin(angle) * radius, 0);
  }
  return pos;
}

function getSpecialLabel(mode, index, total) {
  if (mode === 'LinkedList') return index === 0 ? 'HEAD' : index === total - 1 ? 'TAIL' : null;
  if (mode === 'Tree') return index === 0 ? 'ROOT' : index >= 3 ? 'LEAF' : null;
  return null;
}

function getLinks(mode) {
  if (mode === 'Array') return [];
  if (mode === 'LinkedList') return [[0,1], [1,2], [2,3], [3,4], [4,5], [5,6]];
  if (mode === 'Tree') return [[0,1], [0,2], [1,3], [1,4], [2,5], [2,6]];
  if (mode === 'Graph') return [[0,1], [1,2], [2,3], [3,4], [4,5], [5,6], [6,0], [0,4], [2,6]];
  return [];
}

function Arrow({ startIdx, endIdx, nodesRef }) {
  const group = useRef(); const shaft = useRef(); const head = useRef();
  useFrame(() => {
    if (!nodesRef.current[startIdx] || !nodesRef.current[endIdx] || !group.current) return;
    const start = nodesRef.current[startIdx].position;
    const end = nodesRef.current[endIdx].position;
    const direction = new THREE.Vector3().subVectors(end, start).normalize();
    const dist = start.distanceTo(end);
    const gap = 0.6;
    const arrowLen = Math.max(0, dist - (gap * 2));
    group.current.position.copy(start.clone().add(direction.clone().multiplyScalar(gap)));
    group.current.lookAt(end);
    if (shaft.current) { shaft.current.position.z = arrowLen / 2; shaft.current.scale.y = arrowLen; }
    if (head.current) head.current.position.z = arrowLen;
  });
  return (
    <group ref={group}>
      <mesh ref={shaft} rotation={[Math.PI / 2, 0, 0]}><cylinderGeometry args={[0.04, 0.04, 1, 8]} /><meshStandardMaterial color="#15803d" /></mesh>
      <mesh ref={head} rotation={[Math.PI / 2, 0, 0]}><coneGeometry args={[0.12, 0.3, 12]} /><meshStandardMaterial color="#15803d" /></mesh>
    </group>
  );
}

const Node = React.forwardRef(({ value, index, total, mode }, ref) => {
  const mesh = useRef(); React.useImperativeHandle(ref, () => mesh.current);
  const label = getSpecialLabel(mode, index, total);
  useFrame((state, delta) => { mesh.current.position.lerp(getLayout(mode, index, total), delta * 3); });
  return (
    <group ref={mesh}>
      <RoundedBox args={[1, 1, 0.2]} radius={0.15} smoothness={4}><meshStandardMaterial color="#dcfce7" /></RoundedBox>
      <RoundedBox args={[1.03, 1.03, 0.18]} radius={0.15}><meshBasicMaterial color="#166534" side={THREE.BackSide} /></RoundedBox>
      <Text position={[0, 0, 0.12]} fontSize={0.4} color="#166534" fontWeight={800}>{value}</Text>
      {label && (<group position={[0, 0.85, 0]}><Text fontSize={0.25} color="#15803d" fontWeight={800} outlineWidth={0.02} outlineColor="#fff">{label}</Text><mesh position={[0, -0.2, 0]}><boxGeometry args={[0.02, 0.2, 0.02]} /><meshBasicMaterial color="#15803d" /></mesh></group>)}
      {mode === 'Array' && <Text position={[0, -0.8, 0]} fontSize={0.2} color="#9ca3af">{index}</Text>}
    </group>
  );
});

function NullIndicator({ nodesRef, total, mode }) {
  const group = useRef();
  useFrame(() => {
    if (mode !== 'LinkedList' || !nodesRef.current[total - 1]) { if(group.current) group.current.visible = false; return; }
    group.current.visible = true;
    const last = nodesRef.current[total - 1].position;
    group.current.position.set(last.x + 1.8, last.y, last.z);
  });
  return (
    <group ref={group}>
      <Text fontSize={0.3} color="#dc2626" fontWeight={800}>NULL</Text>
      <group position={[-0.9, 0, 0]} rotation={[0, 0, -Math.PI/2]}><mesh><cylinderGeometry args={[0.03, 0.03, 0.8, 8]} /><meshStandardMaterial color="#15803d" /></mesh><mesh position={[0.4, 0, 0]}><coneGeometry args={[0.1, 0.25, 12]} /><meshStandardMaterial color="#15803d" /></mesh></group>
    </group>
  );
}

function VisualizerScene() {
  const [mode, setMode] = useState('Array');
  const modes = ['Array', 'LinkedList', 'Tree', 'Graph'];
  const nodesRef = useRef([]);
  useEffect(() => { const t = setInterval(() => setMode(p => modes[(modes.indexOf(p)+1)%modes.length]), 4500); return () => clearInterval(t); }, []);
  return (
    <group>
      <Html position={[0, -5, 0]} center transform style={{ pointerEvents: 'none' }}><div className="label-badge">{mode === 'LinkedList' ? 'LINKED LIST' : mode.toUpperCase()}</div></Html>
      {getLinks(mode).map(([s, e], i) => <Arrow key={`${mode}-${s}-${e}`} startIdx={s} endIdx={e} nodesRef={nodesRef} />)}
      <Center>
        <Float speed={2} rotationIntensity={0.05} floatIntensity={0.1}>
          {DATA.map((v, i) => <Node key={i} value={v} index={i} total={DATA.length} mode={mode} ref={el => nodesRef.current[i]=el} />)}
          <NullIndicator nodesRef={nodesRef} total={DATA.length} mode={mode} />
        </Float>
      </Center>
    </group>
  );
}

// --- EXPORT COMPONENT ---
export default function LandingPage({ onStart }) {
  return (
    <div className="landing-container">
      {/* LEFT SIDE - Now with Background 3D */}
      <div className="content-side">
        
        {/* The new background canvas that covers the blank space */}
        <div className="left-bg-canvas">
          <Canvas camera={{ position: [0, 0, 10], fov: 50 }}>
            <CodeBackgroundScene />
          </Canvas>
        </div>

        {/* The text content sits on top */}
        <div className="text-wrapper-relative">
          <div className="pill">Interactive V2.1</div>
          <h1 className="title">
            Logic, <br/>
            <span className="accent">Visualized.</span>
          </h1>
          <p className="description">
            Don't just write code. <strong>See</strong> the architecture. <br/>
            Witness the transformation from contiguous memory to recursive trees in a living 3D environment.
          </p>
          
          <div className="legend">
            <div className="legend-item"><span className="dot dot-green"></span> Node</div>
            <div className="legend-item"><span className="dot dot-line"></span> Pointer</div>
            <div className="legend-item"><span className="dot dot-red"></span> Null</div>
          </div>

          <button onClick={onStart} className="btn">
            Start Visualizing
          </button>
        </div>
      </div>

      {/* RIGHT SIDE - Visualizer */}
      <div className="visual-side">
        <Canvas camera={{ position: [0, 0, 18], fov: 40 }}>
          <color attach="background" args={['#ffffff']} />
          <ambientLight intensity={1} />
          <directionalLight position={[5, 10, 5]} intensity={1.5} />
          <Environment preset="city" />
          <VisualizerScene />
          <ContactShadows position={[0, -5, 0]} opacity={0.35} scale={30} blur={2.5} color="#15803d" />
        </Canvas>
      </div>
    </div>
  );
}