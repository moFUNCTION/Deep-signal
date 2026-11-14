import React, { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import type { AnatomicalSystem, SeverityLevel } from '@aura/medical-engine';
import { ProceduralBodyMesh } from './ProceduralBodyMesh';

interface BodyTwinCanvasProps {
  selectedSystem: AnatomicalSystem | 'all' | null;
  activeAlertSeverity?: SeverityLevel;
  activeAlertSystem?: AnatomicalSystem;
  onSelectSystem: (system: AnatomicalSystem | 'all' | null) => void;
}

export const SYSTEM_CAMERA_TARGETS: Record<
  string,
  { pos: [number, number, number]; lookAt: [number, number, number] }
> = {
  nominal: { pos: [0, 0.3, 3.4], lookAt: [0, 0.3, 0] },
  nervous: { pos: [0, 1.45, 1.8], lookAt: [0, 1.3, 0] },
  cardiovascular: { pos: [0, 0.75, 1.9], lookAt: [0, 0.3, 0] },
  metabolic: { pos: [0, 0.15, 1.9], lookAt: [0, 0.3, 0] },
  musculoskeletal: { pos: [0, -0.6, 2.5], lookAt: [0, 0.3, 0] },
};

function CameraFocusRig({ targetSystem }: { targetSystem: AnatomicalSystem | 'all' | null }) {
  const desiredPos = useRef(new THREE.Vector3(0, 0.3, 3.4));
  const desiredLookAt = useRef(new THREE.Vector3(0, 0.3, 0));

  useFrame((state) => {
    const key =
      targetSystem && targetSystem !== 'all' && targetSystem !== 'nominal'
        ? targetSystem
        : 'nominal';
    const config = SYSTEM_CAMERA_TARGETS[key] || SYSTEM_CAMERA_TARGETS.nominal;

    desiredPos.current.set(...config.pos);
    desiredLookAt.current.set(...config.lookAt);

    // Smooth Vector3 interpolation
    state.camera.position.lerp(desiredPos.current, 0.05);
    state.camera.lookAt(desiredLookAt.current);
  });

  return null;
}

export const BodyTwinCanvas: React.FC<BodyTwinCanvasProps> = ({
  selectedSystem,
  activeAlertSeverity = 'green',
  activeAlertSystem,
  onSelectSystem,
}) => {
  const effectiveSystem = selectedSystem || (activeAlertSystem !== 'nominal' ? activeAlertSystem : null);

  const systems: { id: AnatomicalSystem; label: string; icon: string }[] = [
    { id: 'nervous', label: 'Nervous', icon: '🧠' },
    { id: 'cardiovascular', label: 'Cardio', icon: '❤️' },
    { id: 'metabolic', label: 'Metabolic', icon: '⚡' },
    { id: 'musculoskeletal', label: 'Musculo', icon: '🦴' },
  ];

  return (
    <div className="relative w-full h-full min-h-[460px] rounded-card overflow-hidden bg-slate-950 border border-outline/30 flex flex-col">
      {/* HUD Header Overlay */}
      <div className="absolute top-4 left-4 z-10 flex flex-col gap-1 pointer-events-none">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping" />
          <span className="text-cyan-400 font-display font-bold text-xs tracking-wider uppercase">
            AURA 3D Telemetry Twin // Holographic Mesh
          </span>
        </div>
        <p className="text-slate-400 text-xs">
          Focus:{' '}
          <span className="text-white font-mono uppercase font-semibold">
            {effectiveSystem ? effectiveSystem : 'Full Anatomical View'}
          </span>
        </p>
      </div>

      {/* 3D Canvas */}
      <div className="w-full flex-1">
        <Canvas camera={{ position: [0, 0.3, 3.4], fov: 45 }}>
          <ambientLight intensity={0.6} />
          <pointLight position={[3, 4, 4]} intensity={1.5} />
          <pointLight position={[-3, -2, -2]} intensity={0.5} color="#06b6d4" />
          <gridHelper args={[6, 20, '#0891b2', '#0f172a']} position={[0, -1.5, 0]} />

          <ProceduralBodyMesh
            selectedSystem={selectedSystem}
            activeAlertSeverity={activeAlertSeverity}
            activeAlertSystem={activeAlertSystem}
            onSelectSystem={onSelectSystem}
          />

          <CameraFocusRig targetSystem={effectiveSystem} />
          <OrbitControls enablePan={false} minDistance={1.5} maxDistance={4.5} />
        </Canvas>
      </div>

      {/* Accessible On-Screen Touch / Button Controls (56px minimum height target) */}
      <div className="relative z-10 p-3 bg-slate-900/85 backdrop-blur-md border-t border-slate-800 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 flex-wrap">
          {systems.map((sys) => {
            const isAlert = activeAlertSystem === sys.id;
            const isSelected = selectedSystem === sys.id;

            return (
              <button
                key={sys.id}
                onClick={() => onSelectSystem(isSelected ? null : sys.id)}
                className={`min-h-[56px] px-3.5 py-2 rounded-btn font-body font-semibold text-sm transition-all duration-200 flex items-center gap-2 ${
                  isAlert
                    ? 'bg-coral-soft text-ink border-2 border-coral shadow-glowSky animate-pulse'
                    : isSelected
                    ? 'bg-sky text-white border-2 border-sky-bright shadow-card'
                    : 'bg-slate-800/90 text-slate-200 hover:bg-slate-700 border border-slate-700'
                }`}
              >
                <span className="text-base">{sys.icon}</span>
                <span>{sys.label}</span>
                {isAlert && <span className="w-2 h-2 rounded-full bg-coral animate-ping" />}
              </button>
            );
          })}
        </div>

        <button
          onClick={() => onSelectSystem(null)}
          className="min-h-[56px] px-4 py-2 rounded-btn bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white border border-slate-700 font-body text-xs font-semibold transition-all duration-200"
          title="Reset camera orientation"
        >
          Reset Camera
        </button>
      </div>
    </div>
  );
};
