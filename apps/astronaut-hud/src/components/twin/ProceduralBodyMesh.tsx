import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import type { AnatomicalSystem, SeverityLevel } from '@aura/medical-engine';

interface ProceduralBodyMeshProps {
  selectedSystem: AnatomicalSystem | 'all' | null;
  activeAlertSeverity?: SeverityLevel;
  activeAlertSystem?: AnatomicalSystem;
  onSelectSystem?: (system: AnatomicalSystem) => void;
}

export const SEVERITY_COLORS = {
  green: '#10b981',
  yellow: '#f59e0b',
  red: '#ef4444',
  wireframe: '#06b6d4',
  highlight: '#38bdf8',
};

export const ProceduralBodyMesh: React.FC<ProceduralBodyMeshProps> = ({
  selectedSystem,
  activeAlertSeverity = 'green',
  activeAlertSystem,
  onSelectSystem,
}) => {
  const nervousGroupRef = useRef<THREE.Group>(null);
  const cardioGroupRef = useRef<THREE.Group>(null);
  const metabolicGroupRef = useRef<THREE.Group>(null);
  const musculoGroupRef = useRef<THREE.Group>(null);
  const heartCoreRef = useRef<THREE.Mesh>(null);

  // Animate pulse effects on affected organs and heart beat
  useFrame(({ clock }) => {
    const elapsed = clock.getElapsedTime();

    // Natural heart pulsing
    if (heartCoreRef.current) {
      const heartPulse = 1 + Math.sin(elapsed * 4.5) * 0.09;
      heartCoreRef.current.scale.set(heartPulse, heartPulse, heartPulse);
    }

    // Pulse affected alert organ
    const pulseFrequency = activeAlertSeverity === 'red' ? 8.0 : 3.5;
    const pulseAmplitude = activeAlertSeverity === 'red' ? 0.12 : 0.06;
    const dynamicScale = 1 + Math.sin(elapsed * pulseFrequency) * pulseAmplitude;

    if (activeAlertSystem === 'nervous' && nervousGroupRef.current) {
      nervousGroupRef.current.scale.set(dynamicScale, dynamicScale, dynamicScale);
    }
    if (activeAlertSystem === 'cardiovascular' && cardioGroupRef.current) {
      cardioGroupRef.current.scale.set(dynamicScale, dynamicScale, dynamicScale);
    }
    if (activeAlertSystem === 'metabolic' && metabolicGroupRef.current) {
      metabolicGroupRef.current.scale.set(dynamicScale, dynamicScale, dynamicScale);
    }
    if (activeAlertSystem === 'musculoskeletal' && musculoGroupRef.current) {
      musculoGroupRef.current.scale.set(dynamicScale, dynamicScale, dynamicScale);
    }
  });

  const getSystemMaterial = (system: AnatomicalSystem) => {
    const isAffected = activeAlertSystem === system;
    const isSelected = selectedSystem === system;

    let color = SEVERITY_COLORS.wireframe;
    if (isAffected) {
      color = SEVERITY_COLORS[activeAlertSeverity] || SEVERITY_COLORS.red;
    } else if (isSelected) {
      color = SEVERITY_COLORS.highlight;
    }

    return new THREE.MeshStandardMaterial({
      color: new THREE.Color(color),
      emissive: new THREE.Color(color),
      emissiveIntensity: isAffected ? 0.9 : isSelected ? 0.6 : 0.25,
      wireframe: !isAffected && !isSelected,
      transparent: true,
      opacity: isAffected ? 0.92 : isSelected ? 0.8 : 0.55,
      roughness: 0.3,
      metalness: 0.4,
    });
  };

  return (
    <group position={[0, 0, 0]}>
      {/* 1. NERVOUS / CEREBRAL */}
      <group
        ref={nervousGroupRef}
        position={[0, 1.35, 0]}
        onClick={(e) => {
          e.stopPropagation();
          onSelectSystem?.('nervous');
        }}
      >
        <mesh material={getSystemMaterial('nervous')}>
          <sphereGeometry args={[0.24, 24, 24]} />
        </mesh>
        {/* Brain Stem & Spine */}
        <mesh position={[0, -0.25, 0]} material={getSystemMaterial('nervous')}>
          <cylinderGeometry args={[0.04, 0.05, 0.3, 12]} />
        </mesh>
        {activeAlertSystem === 'nervous' && (
          <Html distanceFactor={6} position={[0.45, 0.1, 0]}>
            <div className="bg-coral-soft border-2 border-coral text-ink font-display text-xs font-bold px-2 py-1 rounded-pill shadow-md whitespace-nowrap animate-pulse">
              NERVOUS ALERT
            </div>
          </Html>
        )}
      </group>

      {/* 2. CARDIOVASCULAR / THORAX */}
      <group
        ref={cardioGroupRef}
        position={[0, 0.72, 0]}
        onClick={(e) => {
          e.stopPropagation();
          onSelectSystem?.('cardiovascular');
        }}
      >
        {/* Thoracic rib cage contour */}
        <mesh material={getSystemMaterial('cardiovascular')}>
          <cylinderGeometry args={[0.32, 0.28, 0.65, 20]} />
        </mesh>
        {/* Pulsating heart core */}
        <mesh
          ref={heartCoreRef}
          position={[0.06, 0.05, 0.12]}
          material={
            new THREE.MeshStandardMaterial({
              color: activeAlertSystem === 'cardiovascular' ? SEVERITY_COLORS.red : '#f43f5e',
              emissive: activeAlertSystem === 'cardiovascular' ? SEVERITY_COLORS.red : '#e11d48',
              emissiveIntensity: 0.9,
              wireframe: false,
              roughness: 0.2,
            })
          }
        >
          <octahedronGeometry args={[0.13, 2]} />
        </mesh>
        {activeAlertSystem === 'cardiovascular' && (
          <Html distanceFactor={6} position={[0.45, 0.1, 0]}>
            <div className="bg-coral-soft border-2 border-coral text-ink font-display text-xs font-bold px-2 py-1 rounded-pill shadow-md whitespace-nowrap animate-pulse">
              CARDIOVASCULAR ALERT
            </div>
          </Html>
        )}
      </group>

      {/* 3. METABOLIC / ENDOCRINE */}
      <group
        ref={metabolicGroupRef}
        position={[0, 0.1, 0]}
        onClick={(e) => {
          e.stopPropagation();
          onSelectSystem?.('metabolic');
        }}
      >
        {/* Abdominal cylinder (liver/pancreas/kidneys) */}
        <mesh material={getSystemMaterial('metabolic')}>
          <cylinderGeometry args={[0.27, 0.25, 0.5, 20]} />
        </mesh>
        {activeAlertSystem === 'metabolic' && (
          <Html distanceFactor={6} position={[0.45, 0.1, 0]}>
            <div className="bg-sun-bright/30 border-2 border-sun text-ink font-display text-xs font-bold px-2 py-1 rounded-pill shadow-md whitespace-nowrap animate-pulse">
              METABOLIC ALERT
            </div>
          </Html>
        )}
      </group>

      {/* 4. MUSCULOSKELETAL / LOAD */}
      <group
        ref={musculoGroupRef}
        position={[0, -0.55, 0]}
        onClick={(e) => {
          e.stopPropagation();
          onSelectSystem?.('musculoskeletal');
        }}
      >
        {/* Pelvic base */}
        <mesh position={[0, 0.35, 0]} material={getSystemMaterial('musculoskeletal')}>
          <cylinderGeometry args={[0.25, 0.22, 0.2, 16]} />
        </mesh>
        {/* Left Arm */}
        <mesh position={[-0.48, 1.15, 0]} rotation={[0, 0, 0.15]} material={getSystemMaterial('musculoskeletal')}>
          <capsuleGeometry args={[0.08, 0.75, 8, 16]} />
        </mesh>
        {/* Right Arm */}
        <mesh position={[0.48, 1.15, 0]} rotation={[0, 0, -0.15]} material={getSystemMaterial('musculoskeletal')}>
          <capsuleGeometry args={[0.08, 0.75, 8, 16]} />
        </mesh>
        {/* Left Leg */}
        <mesh position={[-0.17, -0.35, 0]} material={getSystemMaterial('musculoskeletal')}>
          <capsuleGeometry args={[0.1, 0.95, 8, 16]} />
        </mesh>
        {/* Right Leg */}
        <mesh position={[0.17, -0.35, 0]} material={getSystemMaterial('musculoskeletal')}>
          <capsuleGeometry args={[0.1, 0.95, 8, 16]} />
        </mesh>
        {activeAlertSystem === 'musculoskeletal' && (
          <Html distanceFactor={6} position={[0.45, 0.1, 0]}>
            <div className="bg-coral-soft border-2 border-coral text-ink font-display text-xs font-bold px-2 py-1 rounded-pill shadow-md whitespace-nowrap animate-pulse">
              MUSCULOSKELETAL ALERT
            </div>
          </Html>
        )}
      </group>
    </group>
  );
};
