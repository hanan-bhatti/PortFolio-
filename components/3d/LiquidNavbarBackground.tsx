"use client";

import { useEffect, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";

interface TabRect {
  left: number;
  width: number;
}

interface LiquidNavbarBackgroundProps {
  activeTabRect: TabRect | null;
  isHovered: boolean;
  navbarWidth: number;
  navbarHeight: number;
}

const vertexShader = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const fragmentShader = `
  uniform vec2 uSize;
  uniform vec2 uPillCenter;
  uniform vec2 uPillSize;
  uniform float uTime;
  uniform vec2 uVelocity;
  uniform float uHover;
  varying vec2 vUv;

  // Analytical 2D Signed Distance Field for a rounded box
  float sdRoundedBox(vec2 p, vec2 b, float r) {
    vec2 q = abs(p) - b + vec2(r);
    return min(max(q.x, q.y), 0.0) + length(max(q, 0.0)) - r;
  }

  // Analytical background color representing the portfolio canvas
  vec3 getBgColor(vec2 uv) {
    // Base dark color: #181914 (dusty-olive-100)
    vec3 baseColor = vec3(0.094, 0.098, 0.078);
    
    // Glowing accent 1: #ffcb69 (golden-pollen-500)
    vec2 glow1Pos = vec2(0.25 + sin(uTime * 0.25) * 0.05, 0.5 + cos(uTime * 0.3) * 0.05);
    float glow1 = 1.0 - smoothstep(0.0, 0.7, length(uv - glow1Pos));
    vec3 col1 = vec3(1.0, 0.796, 0.412) * glow1 * 0.32;
    
    // Glowing accent 2: #d9ae94 (desert-sand-500)
    vec2 glow2Pos = vec2(0.75 + cos(uTime * 0.3) * 0.06, 0.5 + sin(uTime * 0.25) * 0.05);
    float glow2 = 1.0 - smoothstep(0.0, 0.7, length(uv - glow2Pos));
    vec3 col2 = vec3(0.851, 0.682, 0.58) * glow2 * 0.32;
    
    return baseColor + col1 + col2;
  }

  // Calculate 3D height map for the navbar and moving pill
  float getHeight(vec2 p) {
    // 1. Main Navbar base shape (static rounded box)
    vec2 navHalf = uSize * 0.5;
    // Inset by 1px to avoid edge clipping issues
    float dNavbar = sdRoundedBox(p - navHalf, navHalf - 1.0, 16.0);
    
    // Base glass sheet bevel (curves down over a 6px border)
    float hNavbar = clamp(-dNavbar / 6.0, 0.0, 1.0);
    hNavbar = smoothstep(0.0, 1.0, hNavbar);
    
    // 2. Active Tab Pill shape (raised fluid lens)
    vec2 pillHalf = uPillSize * 0.5;
    float pillRadius = pillHalf.y - 1.0;
    
    // Deform coordinates around active pill for liquid ripples
    vec2 diff = p - uPillCenter;
    float speed = length(uVelocity);
    
    // Stronger trailing liquid ripple wave simulation based on velocity
    float waveX = sin(diff.x * 0.10 - uTime * 14.0) * min(5.0, speed * 0.15) * 0.6;
    float waveY = cos(diff.y * 0.10 - uTime * 12.0) * min(5.0, speed * 0.15) * 0.6;
    
    // Add continuous subtle fluid breathing waves
    float breathe = sin(diff.x * 0.05 + uTime * 4.0) * cos(diff.y * 0.05 + uTime * 3.0) * 0.8;
    
    vec2 deformedDiff = diff + vec2(waveX, waveY + breathe);
    
    float dPill = sdRoundedBox(deformedDiff, pillHalf - 1.0, pillRadius);
    
    // The active pill is a raised lens (curves down over a 10px span)
    float hPill = clamp(-dPill / 10.0, 0.0, 1.0);
    hPill = smoothstep(0.0, 1.0, hPill) * step(1.0, uPillSize.x);
    
    // Base thickness is 0.10, active pill adds 0.45.
    // Fades to 0 at the navbar outer edge.
    return hNavbar * (0.10 + hPill * 0.45);
  }

  void main() {
    // Local pixel coordinates (0 to uSize)
    vec2 localPos = vUv * uSize;

    // Outer boundary mask
    vec2 navHalf = uSize * 0.5;
    float dNavbar = sdRoundedBox(localPos - navHalf, navHalf - 1.0, 16.0);
    float borderAlpha = smoothstep(1.0, -1.0, dNavbar); // Antialiased border (2px width)

    if (borderAlpha <= 0.001) {
      discard;
    }

    // Numerical gradient normal reconstruction
    float eps = 1.0; // 1 pixel step
    float h = getHeight(localPos);
    float hx = getHeight(localPos + vec2(eps, 0.0));
    float hy = getHeight(localPos + vec2(0.0, eps));
    
    // Slope scale determines lens refractive strength and bevel sharpness (increased for liquid dome)
    float slopeScale = 0.22; 
    
    float nx = (hx - h) / eps;
    float ny = (hy - h) / eps;
    
    // Compute 3D normal vector pointing towards camera (+z)
    vec3 N = normalize(vec3(-nx * slopeScale, -ny * slopeScale, 1.0));
    vec3 V = vec3(0.0, 0.0, 1.0); // View direction (orthographic camera)

    // Calculate active pill height local factor
    vec2 pillHalf = uPillSize * 0.5;
    float dPill = sdRoundedBox(localPos - uPillCenter, pillHalf - 1.0, pillHalf.y - 1.0);
    float hPill = smoothstep(0.0, 1.0, clamp(-dPill / 10.0, 0.0, 1.0)) * step(1.0, uPillSize.x);

    // Magnification (zoom) effect inside the liquid lens
    vec2 pillUV = uPillCenter / uSize;
    // Zoom factor: less than 1.0 magnifies, greater than 1.0 shrinks.
    // We zoom in on the background underneath the pill
    float zoomFactor = 1.0 - hPill * 0.28; 
    vec2 baseUV = localPos / uSize;
    vec2 toCenter = baseUV - pillUV;

    // Physical Refraction with Chromatic Aberration (RGB color splitting)
    // Refraction offsets UVs proportional to normal slope
    float refractionStrength = 0.08;
    
    vec2 uvR = pillUV + toCenter * zoomFactor + N.xy * refractionStrength * 1.00;
    vec2 uvG = pillUV + toCenter * zoomFactor + N.xy * refractionStrength * 1.15;
    vec2 uvB = pillUV + toCenter * zoomFactor + N.xy * refractionStrength * 1.30;

    vec3 refractedColor;
    refractedColor.r = getBgColor(uvR).r;
    refractedColor.g = getBgColor(uvG).g;
    refractedColor.b = getBgColor(uvB).b;

    // Fresnel Reflection (Schlick's approximation)
    float cosTheta = max(dot(N, V), 0.0);
    float fresnel = pow(1.0 - cosTheta, 3.5);
    
    // Rim highlights highlighting physical contours (stronger edge reflection)
    vec3 rimHighlight = vec3(1.0) * fresnel * 0.65;

    // Specular Reflection (Apple style sharp glossy look + broad wet gloss)
    // Primary key light (Top-Left)
    vec3 lightPos1 = normalize(vec3(-0.35, 0.55, 0.75));
    vec3 H1 = normalize(lightPos1 + V);
    float spec1Sharp = pow(max(dot(N, H1), 0.0), 160.0) * 1.6;
    float spec1Broad = pow(max(dot(N, H1), 0.0), 24.0) * 0.35;
    float spec1 = spec1Sharp + spec1Broad;

    // Secondary fill light (Bottom-Right)
    vec3 lightPos2 = normalize(vec3(0.55, -0.25, 0.5));
    vec3 H2 = normalize(lightPos2 + V);
    float spec2 = pow(max(dot(N, H2), 0.0), 32.0) * 0.25;

    // Active Pill Glow Backdrop (like the Moon glow in the user's reference)
    float pulse = 0.94 + 0.06 * sin(uTime * 3.5);
    // Warm/desert-sand glow for active tab
    vec3 activeGlow = vec3(1.0, 0.88, 0.78) * hPill * 0.22 * pulse;
    // Add extra color flare on hover
    activeGlow += vec3(0.851, 0.682, 0.58) * hPill * uHover * 0.12;

    // Custom Glass Edge Highlight
    // Highlights the exact edge contour where the glass bevel starts
    float edgeHighlight = smoothstep(-1.0, 0.0, dNavbar) * smoothstep(1.0, 0.0, dNavbar);
    vec3 edgeShine = vec3(1.0) * edgeHighlight * 0.35 * max(0.0, N.x * -0.5 + N.y * 0.5 + 0.5);

    // Glass body composition with thickness-dependent tinting
    vec3 glassTint = vec3(0.92, 0.96, 1.0); // Clean turquoise/ice glass tint
    float thickness = h; 
    vec3 finalColor = mix(refractedColor, glassTint, 0.04 + thickness * 0.12);

    // Add specular highlights, edge highlights, active glows, and rim light
    finalColor += vec3(spec1) + vec3(spec2) + rimHighlight + activeGlow + edgeShine;

    // Opacity based on Fresnel reflection + specular highlights
    float alpha = clamp(0.12 + fresnel * 0.48 + spec1 * 0.6 + spec2 * 0.1, 0.0, 1.0);

    // Render output
    gl_FragColor = vec4(finalColor, alpha * borderAlpha);
  }
`;

function LiquidPill({
  activeTabRect,
  isHovered,
  navbarWidth,
  navbarHeight,
}: LiquidNavbarBackgroundProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const materialRef = useRef<THREE.ShaderMaterial>(null);

  // Animated physics state
  const physicsState = useRef({
    currentX: 0,
    currentWidth: 0,
    velocityX: 0,
    velocityWidth: 0,
  });

  const isInitialized = useRef(false);

  // Custom shader uniforms
  const uniforms = useMemo(
    () => ({
      uSize: { value: new THREE.Vector2(navbarWidth, navbarHeight) },
      uPillCenter: { value: new THREE.Vector2(0, 0) },
      uPillSize: { value: new THREE.Vector2(0, 0) },
      uTime: { value: 0 },
      uVelocity: { value: new THREE.Vector2(0, 0) },
      uHover: { value: 0 },
    }),
    [navbarWidth, navbarHeight]
  );

  // Initialize position to prevent sliding in from zero on load
  useEffect(() => {
    if (activeTabRect && !isInitialized.current) {
      physicsState.current.currentX = activeTabRect.left + activeTabRect.width / 2;
      physicsState.current.currentWidth = activeTabRect.width;
      isInitialized.current = true;
    }
  }, [activeTabRect]);

  // Update uniforms when size props change
  useEffect(() => {
    if (materialRef.current) {
      const uniforms = materialRef.current.uniforms as Record<string, { value: any }>;
      if (uniforms.uSize) {
        uniforms.uSize.value.set(navbarWidth, navbarHeight);
      }
    }
  }, [navbarWidth, navbarHeight]);

  useFrame((state, delta) => {
    // Clamp delta to prevent huge physics jumps (e.g. if the tab is backgrounded)
    const dt = Math.min(delta, 0.1);

    const targetX = activeTabRect ? activeTabRect.left + activeTabRect.width / 2 : 0;
    const targetWidth = activeTabRect ? activeTabRect.width : 0;

    // Hover animation interpolation
    const hoverTarget = isHovered ? 1.0 : 0.0;
    if (materialRef.current) {
      const uniforms = materialRef.current.uniforms as Record<string, { value: any }>;
      if (uniforms.uHover) {
        uniforms.uHover.value +=
          (hoverTarget - uniforms.uHover.value) * 10.0 * dt;
      }
    }

    // If not initialized yet, skip spring calculations
    if (!isInitialized.current && activeTabRect) {
      physicsState.current.currentX = targetX;
      physicsState.current.currentWidth = targetWidth;
      isInitialized.current = true;
    }

    // Spring physics configuration (tweak for more/less squishiness)
    const springTension = 200; // Pull force tension
    const springDamping = 16;  // Friction damping

    // Update X position with spring physics
    const dx = targetX - physicsState.current.currentX;
    const forceX = dx * springTension - physicsState.current.velocityX * springDamping;
    physicsState.current.velocityX += forceX * dt;
    physicsState.current.currentX += physicsState.current.velocityX * dt;

    // Update width with spring physics
    const dw = targetWidth - physicsState.current.currentWidth;
    const forceWidth = dw * springTension - physicsState.current.velocityWidth * springDamping;
    physicsState.current.velocityWidth += forceWidth * dt;
    physicsState.current.currentWidth += physicsState.current.velocityWidth * dt;

    if (materialRef.current) {
      const uniforms = materialRef.current.uniforms as Record<string, { value: any }>;

      // Update time uniform
      if (uniforms.uTime) {
        uniforms.uTime.value = state.clock.getElapsedTime();
      }

      // Position the pill center (Three.js UV space has y = 0 at bottom)
      if (uniforms.uPillCenter) {
        uniforms.uPillCenter.value.set(
          physicsState.current.currentX,
          navbarHeight / 2 // center vertically
        );
      }

      // Volume conservation math: as it stretches horizontally, it shrinks vertically
      const speedX = physicsState.current.velocityX;
      const stretchStrength = 0.14; // Controls how long the capsule stretches
      const shrinkStrength = 0.07;  // Controls how thin the capsule gets

      const stretch = Math.abs(speedX) * stretchStrength;
      const pillWidth = physicsState.current.currentWidth + stretch;
      
      // Vertical height is navbarHeight minus padding, minus the squash factor
      const verticalPadding = 14; 
      const baseHeight = navbarHeight - verticalPadding;
      const pillHeight = baseHeight - Math.min(baseHeight * 0.4, Math.abs(speedX) * shrinkStrength);

      if (uniforms.uPillSize) {
        uniforms.uPillSize.value.set(pillWidth, Math.max(12.0, pillHeight));
      }

      // Pass velocity vector to shader for trailing waves
      if (uniforms.uVelocity) {
        uniforms.uVelocity.value.set(physicsState.current.velocityX, 0.0);
      }
    }
  });

  return (
    <mesh ref={meshRef} position={[navbarWidth / 2, -navbarHeight / 2, 0]}>
      <planeGeometry args={[navbarWidth, navbarHeight]} />
      <shaderMaterial
        ref={materialRef}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={uniforms}
        transparent
        depthWrite={false}
        depthTest={false}
      />
    </mesh>
  );
}

import { useMemo } from "react";

export default function LiquidNavbarBackground({
  activeTabRect,
  isHovered,
  navbarWidth,
  navbarHeight,
}: LiquidNavbarBackgroundProps) {
  // If navbar hasn't been measured, do not render canvas
  if (navbarWidth <= 0 || navbarHeight <= 0) return null;

  return (
    <div className="absolute inset-0 -z-10 pointer-events-none overflow-hidden rounded-2xl">
      <Canvas
        orthographic
        camera={{
          left: 0,
          right: navbarWidth,
          top: 0,
          bottom: -navbarHeight,
          near: 0.1,
          far: 100,
          position: [0, 0, 10],
        }}
        gl={{ alpha: true, antialias: true }}
        dpr={[1, 1.5]}
        style={{ width: "100%", height: "100%" }}
      >
        <LiquidPill
          activeTabRect={activeTabRect}
          isHovered={isHovered}
          navbarWidth={navbarWidth}
          navbarHeight={navbarHeight}
        />
      </Canvas>
    </div>
  );
}
