import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';

const IndustrialPlant = () => {
  const groupRef = useRef();
  
  const baseColor = useMemo(() => new THREE.Color("#D9E0E0"), []);
  const glowColor = useMemo(() => new THREE.Color("#39FF14"), []);

  useFrame((state) => {
    if (groupRef.current) {
      const pulse = Math.pow(Math.sin(state.clock.elapsedTime * 1.0), 8);
      
      // Add a rapid electrical flicker when the pulse is strong
      const isFlickering = pulse > 0.3 && Math.random() > 0.4;
      const finalPulse = isFlickering ? Math.random() * 0.5 : pulse;
      
      const currentColor = baseColor.clone().lerp(glowColor, finalPulse);
      
      groupRef.current.traverse((child) => {
        if (child.isMesh && child.material && child.material.wireframe) {
           child.material.color.copy(currentColor);
           child.material.transparent = true;
           child.material.opacity = isFlickering ? 0.4 : 1.0;
        }
      });
    }
  });

  return (
    <group ref={groupRef} scale={[0.7, 0.7, 0.7]} position={[0, -3, 0]}>
      {/* Main Silo */}
      <mesh position={[0, 2.5, 0]}>
        <cylinderGeometry args={[1.5, 1.5, 5, 16]} />
        <meshBasicMaterial color="#002729" />
      </mesh>
      <mesh position={[0, 2.5, 0]}>
        <cylinderGeometry args={[1.5, 1.5, 5, 16]} />
        <meshBasicMaterial color="#D9E0E0" wireframe={true} />
      </mesh>

      {/* Tall Chimney / Flare Stack */}
      <mesh position={[0, 6, 0]}>
        <cylinderGeometry args={[0.3, 0.5, 5, 12]} />
        <meshBasicMaterial color="#001516" />
      </mesh>
      <mesh position={[0, 6, 0]}>
        <cylinderGeometry args={[0.3, 0.5, 5, 12]} />
        <meshBasicMaterial color="#D9E0E0" wireframe={true} />
      </mesh>

      {/* Scaffolding Walkways */}
      {[1, 2, 3, 4].map(y => (
        <group key={y}>
          <mesh position={[0, y, 0]} rotation={[Math.PI/2, 0, 0]}>
            <torusGeometry args={[1.7, 0.02, 4, 24]} />
            <meshBasicMaterial color="#D9E0E0" wireframe={true} />
          </mesh>
          <mesh position={[0, y, 0]} rotation={[Math.PI/2, 0, 0]}>
             <ringGeometry args={[1.5, 1.7, 16]} />
             <meshBasicMaterial color="#002729" />
          </mesh>
        </group>
      ))}

      {/* Processing Facility Block */}
      <mesh position={[-2, 1.5, 1]}>
        <boxGeometry args={[2.5, 3, 2]} />
        <meshBasicMaterial color="#001516" />
      </mesh>
      <mesh position={[-2, 1.5, 1]}>
        <boxGeometry args={[2.5, 3, 2]} />
        <meshBasicMaterial color="#D9E0E0" wireframe={true} />
      </mesh>

    </group>
  );
};

const TransmissionTower = () => {
  return (
    <Canvas camera={{ position: [-5, 4, 6], fov: 50 }}>
      <IndustrialPlant />
    </Canvas>
  );
};

export default TransmissionTower;
