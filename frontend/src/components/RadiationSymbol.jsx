import React, { useMemo, useRef } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { Center } from '@react-three/drei';
import CanvasErrorBoundary from './CanvasErrorBoundary';

const RadiationGeometry = () => {
  const shapes = useMemo(() => {
    const s = [];
    const innerRadius = 0.5;
    const bladeInner = 0.8;
    const bladeOuter = 2.5;

    const center = new THREE.Shape();
    center.absarc(0, 0, innerRadius, 0, Math.PI * 2, false);
    s.push(center);

    for (let i = 0; i < 3; i++) {
      const angleStart = (i * 120 + 30) * Math.PI / 180;
      const angleEnd = (i * 120 + 90) * Math.PI / 180;
      
      const blade = new THREE.Shape();
      blade.absarc(0, 0, bladeOuter, angleStart, angleEnd, false);
      blade.lineTo(Math.cos(angleEnd) * bladeInner, Math.sin(angleEnd) * bladeInner);
      blade.absarc(0, 0, bladeInner, angleEnd, angleStart, true);
      blade.lineTo(Math.cos(angleStart) * bladeOuter, Math.sin(angleStart) * bladeOuter);
      s.push(blade);
    }
    return s;
  }, []);

  const extrudeSettings = {
    depth: 0.2,
    bevelEnabled: false
  };

  const groupRef = useRef();
  const { mouse } = useThree();
  const targetRotation = useRef({ x: 0, y: 0 });
  
  useFrame((state, delta) => {
    if (groupRef.current) {
      targetRotation.current.x = (mouse.y * Math.PI) / 4;
      targetRotation.current.y = (mouse.x * Math.PI) / 4;

      groupRef.current.rotation.x += (targetRotation.current.x - groupRef.current.rotation.x) * 0.05;
      groupRef.current.rotation.y += (targetRotation.current.y - groupRef.current.rotation.y) * 0.05;
      groupRef.current.rotation.z += delta * 0.1;
    }
  });

  return (
    <group ref={groupRef} scale={[1.5, 1.5, 1.5]}>
      <Center>
        {shapes.map((shape, index) => (
          <group key={index}>
            <mesh>
              <extrudeGeometry args={[shape, extrudeSettings]} />
              <meshBasicMaterial color="#39FF14" wireframe={true} />
            </mesh>
            <points>
              <extrudeGeometry args={[shape, extrudeSettings]} />
              <pointsMaterial color="#39FF14" size={0.03} />
            </points>
          </group>
        ))}
      </Center>
    </group>
  );
};

const FallbackRadiationSymbol = () => (
  <div style={{
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    height: '100%',
    animation: 'spin 20s linear infinite'
  }}>
    <svg viewBox="0 0 100 100" width="80%" height="80%">
      <circle cx="50" cy="50" r="12" fill="#39FF14" />
      <path d="M50,50 L50,15 A35,35 0 0,1 80.3,32.5 Z" fill="#39FF14" opacity="0.85" />
      <path d="M50,50 L80.3,67.5 A35,35 0 0,1 50,85 Z" fill="#39FF14" opacity="0.85" />
      <path d="M50,50 L19.7,67.5 A35,35 0 0,1 19.7,32.5 Z" fill="#39FF14" opacity="0.85" />
    </svg>
  </div>
);

const RadiationSymbol = () => {
  return (
    <CanvasErrorBoundary fallback={<FallbackRadiationSymbol />}>
      <Canvas camera={{ position: [0, 0, 10], fov: 40 }} style={{ cursor: 'crosshair' }}>
        <RadiationGeometry />
      </Canvas>
    </CanvasErrorBoundary>
  );
};

export default RadiationSymbol;
