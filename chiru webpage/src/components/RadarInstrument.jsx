import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';

const ReactorFacility = () => {
  const groupRef = useRef();
  
  const baseColor = useMemo(() => new THREE.Color("#D9E0E0"), []);
  const glowColor = useMemo(() => new THREE.Color("#39FF14"), []);

  useFrame((state) => {
    if (groupRef.current) {
      // The circle hits the edges rhythmically based on MagicRings speed.
      // Speed 1.5 on MagicRings roughly translates to a pulse here:
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
    <group ref={groupRef} scale={[0.7, 0.7, 0.7]} position={[0, -2, 0]}>
      {/* Main Building Base */}
      <mesh position={[0, 1, 0]}>
        <boxGeometry args={[3, 2, 3]} />
        <meshBasicMaterial color="#002729" />
      </mesh>
      <mesh position={[0, 1, 0]}>
        <boxGeometry args={[3, 2, 3]} />
        <meshBasicMaterial color="#D9E0E0" wireframe={true} />
      </mesh>

      {/* Cooling Tower */}
      <mesh position={[-1.2, 3.5, -1.2]}>
        <cylinderGeometry args={[0.7, 1.1, 3, 16]} />
        <meshBasicMaterial color="#001516" />
      </mesh>
      <mesh position={[-1.2, 3.5, -1.2]}>
        <cylinderGeometry args={[0.7, 1.1, 3, 16]} />
        <meshBasicMaterial color="#D9E0E0" wireframe={true} />
      </mesh>

      {/* Reactor Dome */}
      <mesh position={[1, 2.5, 1]}>
        <sphereGeometry args={[1.2, 16, 16, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshBasicMaterial color="#001516" />
      </mesh>
      <mesh position={[1, 2.5, 1]}>
        <sphereGeometry args={[1.2, 16, 16, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshBasicMaterial color="#D9E0E0" wireframe={true} />
      </mesh>

      {/* Control Annex */}
      <mesh position={[2, 0.75, -1.5]}>
        <boxGeometry args={[1.5, 1.5, 2]} />
        <meshBasicMaterial color="#002729" />
      </mesh>
      <mesh position={[2, 0.75, -1.5]}>
        <boxGeometry args={[1.5, 1.5, 2]} />
        <meshBasicMaterial color="#D9E0E0" wireframe={true} />
      </mesh>
      
    </group>
  );
};

const RadarInstrument = () => {
  return (
    <Canvas camera={{ position: [5, 4, 6], fov: 50 }}>
      <ReactorFacility />
    </Canvas>
  );
};

export default RadarInstrument;
