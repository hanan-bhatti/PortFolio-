"use client";

import { useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { MeshDistortMaterial } from "@react-three/drei";
import type { Group, Mesh } from "three";

interface BlobProps {
  position: [number, number, number];
  color: string;
  scale: number;
  distort: number;
  speed: number;
}

function Blob({ position, color, scale, distort, speed }: BlobProps) {
  const ref = useRef<Mesh>(null);
  useFrame(({ clock }) => {
    if (!ref.current) return;
    ref.current.position.y = position[1] + Math.sin(clock.elapsedTime * 0.4 + position[0]) * 0.35;
  });
  return (
    <mesh ref={ref} position={position} scale={scale}>
      <sphereGeometry args={[1, 64, 64]} />
      <MeshDistortMaterial
        color={color}
        distort={distort}
        speed={speed}
        roughness={0.2}
        metalness={0.6}
        transparent
        opacity={0.5}
      />
    </mesh>
  );
}

function ParallaxGroup({ children }: { children: React.ReactNode }) {
  const ref = useRef<Group>(null);
  useFrame(({ pointer }) => {
    if (!ref.current) return;
    ref.current.rotation.x += (pointer.y * 0.12 - ref.current.rotation.x) * 0.05;
    ref.current.rotation.y += (pointer.x * 0.18 - ref.current.rotation.y) * 0.05;
  });
  return <group ref={ref}>{children}</group>;
}

export default function BlobBackground() {
  return (
    <div className="fixed inset-0 -z-10" aria-hidden>
      <Canvas camera={{ position: [0, 0, 8], fov: 45 }} dpr={[1, 1.5]} gl={{ antialias: true, alpha: true }}>
        <ambientLight intensity={0.4} />
        <pointLight position={[6, 4, 6]} intensity={40} color="#6366f1" />
        <pointLight position={[-6, -3, 4]} intensity={30} color="#06b6d4" />
        <ParallaxGroup>
          <Blob position={[-3.5, 1.5, -2]} color="#6366f1" scale={1.8} distort={0.45} speed={1.2} />
          <Blob position={[3.5, -1.5, -3]} color="#06b6d4" scale={2.2} distort={0.5} speed={1} />
          <Blob position={[0, 2.8, -5]} color="#4338ca" scale={1.4} distort={0.55} speed={1.5} />
        </ParallaxGroup>
      </Canvas>
    </div>
  );
}
