import React, { useRef, useEffect } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { useGLTF, PerspectiveCamera, useDepthBuffer } from '@react-three/drei';
import { EffectComposer, DepthOfField, Bloom } from '@react-three/postprocessing';
import { motion } from 'framer-motion-3d';
import * as THREE from 'three';

function Note({ position, rotation, color, scale = 1, hovered }) {
  const mesh = useRef();
  const depthBuffer = useDepthBuffer({ frames: 1 });

  useFrame((state) => {
    mesh.current.rotation.x = THREE.MathUtils.lerp(
      mesh.current.rotation.x,
      hovered ? rotation.x + 0.2 : rotation.x,
      0.1
    );
    mesh.current.position.y = THREE.MathUtils.lerp(
      mesh.current.position.y,
      hovered ? position.y + 0.2 : position.y,
      0.1
    );
  });

  return (
    <motion.mesh
      ref={mesh}
      position={[position.x, position.y, position.z]}
      rotation={[rotation.x, rotation.y, rotation.z]}
      scale={scale}
      whileHover={{ scale: 1.1 }}
      transition={{ type: "spring", stiffness: 100 }}
    >
      <boxGeometry args={[1, 1, 0.05]} />
      <meshPhysicalMaterial
        color={color}
        roughness={0.4}
        metalness={0.1}
        transmission={0.1}
        thickness={0.1}
        depthBuffer={depthBuffer}
      />
    </motion.mesh>
  );
}

function PushPin({ position, color }) {
  return (
    <motion.mesh
      position={position}
      whileHover={{ scale: 1.2 }}
      transition={{ type: "spring", stiffness: 200 }}
    >
      <sphereGeometry args={[0.1, 16, 16]} />
      <meshStandardMaterial color={color} metalness={0.8} roughness={0.2} />
    </motion.mesh>
  );
}

function Scene() {
  const { camera } = useThree();
  const groupRef = useRef();

  const notes = [
    { pos: [-1, 1, 0], rot: [0.1, -0.2, 0.1], color: "#FFB6C1", scale: 0.8 },
    { pos: [1, -0.5, 0.5], rot: [-0.1, 0.3, -0.1], color: "#87CEEB", scale: 1 },
    { pos: [0, 0.8, -0.3], rot: [0.2, 0, -0.2], color: "#98FB98", scale: 0.9 },
    { pos: [-0.8, -0.3, 0.2], rot: [-0.1, -0.1, 0.1], color: "#DDA0DD", scale: 0.7 }
  ];

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    groupRef.current.rotation.y = Math.sin(t * 0.1) * 0.2;
    camera.position.x = Math.sin(t * 0.1) * 2;
    camera.position.z = Math.cos(t * 0.1) * 2 + 4;
    camera.lookAt(0, 0, 0);
  });

  return (
    <group ref={groupRef}>
      {notes.map((note, i) => (
        <React.Fragment key={i}>
          <Note
            position={new THREE.Vector3(...note.pos)}
            rotation={new THREE.Euler(...note.rot)}
            color={note.color}
            scale={note.scale}
            hovered={false}
          />
          <PushPin
            position={[note.pos[0] + 0.3, note.pos[1] + 0.3, note.pos[2] + 0.1]}
            color="#FFD700"
          />
        </React.Fragment>
      ))}
      <ambientLight intensity={0.5} />
      <pointLight position={[10, 10, 10]} intensity={1} />
      <spotLight
        position={[0, 5, 5]}
        angle={0.3}
        penumbra={1}
        intensity={1}
        castShadow
      />
    </group>
  );
}

export function HeroAnimation() {
  return (
    <div className="w-full h-full">
      <Canvas>
        <PerspectiveCamera makeDefault position={[0, 0, 5]} />
        <Scene />
        <EffectComposer>
          <DepthOfField
            focusDistance={0}
            focalLength={0.02}
            bokehScale={2}
            height={480}
          />
          <Bloom
            intensity={0.5}
            luminanceThreshold={0.1}
            luminanceSmoothing={0.9}
            height={300}
          />
        </EffectComposer>
      </Canvas>
    </div>
  );
}