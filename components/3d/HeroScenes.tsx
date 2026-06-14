"use client";

/**
 * @file components/3d/HeroScenes.tsx
 * @description React component for HeroScenes.tsx under the 3d category.
 * 
 * @exports
 * - HeroScene (default): Main React component or function
 * - HeroVariant: Type/Interface definition
 */

import { useMemo, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Center, Float, MeshDistortMaterial, Text3D } from "@react-three/drei";
import type { Group, Mesh } from "three";

export type HeroVariant = "blob" | "icosahedron" | "particles" | "torusknot" | "blogtext";

function MorphBlob() {
  return (
    <Float speed={1.5} rotationIntensity={0.4} floatIntensity={1.2}>
      <mesh scale={1.7}>
        <sphereGeometry args={[1, 96, 96]} />
        <MeshDistortMaterial
          distort={0.6}
          speed={2}
          color="#6366f1"
          roughness={0.1}
          metalness={0.9}
          emissive="#06b6d4"
          emissiveIntensity={0.25}
        />
      </mesh>
    </Float>
  );
}

function WireIcosahedron() {
  const ref = useRef<Mesh>(null);
  useFrame((_, delta) => {
    if (!ref.current) return;
    ref.current.rotation.x += delta * 0.1;
    ref.current.rotation.y += delta * 0.18;
  });
  return (
    <mesh ref={ref} scale={1.6}>
      <icosahedronGeometry args={[1, 1]} />
      <meshStandardMaterial color="#6366f1" wireframe emissive="#06b6d4" emissiveIntensity={0.5} />
    </mesh>
  );
}

function OrbitParticles() {
  const ref = useRef<Group>(null);
  const positions = useMemo(() => {
    const count = 300;
    const arr = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const r = 2 + Math.random() * 0.6;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      arr[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      arr[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta) * 0.4;
      arr[i * 3 + 2] = r * Math.cos(phi);
    }
    return arr;
  }, []);
  useFrame((_, delta) => {
    if (ref.current) ref.current.rotation.y += delta * 0.15;
  });
  return (
    <group ref={ref}>
      <points>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        </bufferGeometry>
        <pointsMaterial size={0.045} color="#06b6d4" transparent opacity={0.85} sizeAttenuation />
      </points>
    </group>
  );
}

function TorusKnot() {
  const ref = useRef<Mesh>(null);
  useFrame((_, delta) => {
    if (!ref.current) return;
    ref.current.rotation.x += delta * 0.15;
    ref.current.rotation.y += delta * 0.2;
  });
  return (
    <mesh ref={ref} scale={1.3}>
      <torusKnotGeometry args={[1, 0.3, 128, 16]} />
      <meshStandardMaterial color="#6366f1" wireframe emissive="#06b6d4" emissiveIntensity={0.4} />
    </mesh>
  );
}

function BlogText() {
  const ref = useRef<Group>(null);
  useFrame(({ clock }) => {
    if (ref.current) ref.current.rotation.y = Math.sin(clock.elapsedTime * 0.3) * 0.25;
  });
  return (
    <group ref={ref}>
      <Center>
        <Text3D
          font="https://threejs.org/examples/fonts/helvetiker_bold.typeface.json"
          size={1.1}
          height={0.3}
          bevelEnabled
          bevelSize={0.03}
          bevelThickness={0.05}
        >
          BLOG
          <meshStandardMaterial color="#06b6d4" metalness={0.8} roughness={0.2} emissive="#6366f1" emissiveIntensity={0.3} />
        </Text3D>
      </Center>
    </group>
  );
}

export default function HeroScene({ variant }: { variant: HeroVariant }) {
  return (
    <Canvas camera={{ position: [0, 0, 5], fov: 50 }} dpr={[1, 1.5]} gl={{ alpha: true }}>
      <ambientLight intensity={0.5} />
      <pointLight position={[4, 4, 4]} intensity={30} color="#6366f1" />
      <pointLight position={[-4, -2, 3]} intensity={25} color="#06b6d4" />
      {variant === "blob" && <MorphBlob />}
      {variant === "icosahedron" && <WireIcosahedron />}
      {variant === "particles" && <OrbitParticles />}
      {variant === "torusknot" && <TorusKnot />}
      {variant === "blogtext" && <BlogText />}
    </Canvas>
  );
}
