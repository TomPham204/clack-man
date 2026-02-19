'use client';

import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { useGLTF, Environment } from '@react-three/drei';
import { Suspense, Component, type ReactNode, useEffect, useState, useRef } from 'react';
import * as THREE from 'three';
import { OrbitControls as OrbitControlsImpl } from 'three-stdlib';

function ProceduralSwitch() {
	return (
		<group rotation={[0, 0, Math.PI / 2]} scale={1.2}>
			<mesh position={[0, 0, -2]} castShadow receiveShadow>
				<boxGeometry args={[8, 8, 4]} />
				<meshStandardMaterial color="#2a2a2a" roughness={0.6} metalness={0.2} />
			</mesh>
			<mesh position={[0, 0, 0.2]} castShadow receiveShadow>
				<boxGeometry args={[7.2, 7.2, 1.2]} />
				<meshStandardMaterial color="#1a1a1a" roughness={0.5} metalness={0.3} />
			</mesh>
			<mesh position={[0, 0, 2.2]} castShadow>
				<boxGeometry args={[2.8, 2.8, 3]} />
				<meshStandardMaterial color="#3d3d3d" roughness={0.5} metalness={0.1} />
			</mesh>
			<group position={[0, 0, 3.8]}>
				<mesh castShadow>
					<boxGeometry args={[0.8, 2.4, 0.6]} />
					<meshStandardMaterial color="#4a4a4a" roughness={0.5} />
				</mesh>
				<mesh castShadow rotation={[0, 0, Math.PI / 2]}>
					<boxGeometry args={[0.8, 2.4, 0.6]} />
					<meshStandardMaterial color="#4a4a4a" roughness={0.5} />
				</mesh>
			</group>
			<mesh position={[-2.5, 1.8, -3.5]} castShadow>
				<cylinderGeometry args={[0.25, 0.25, 2.5, 8]} />
				<meshStandardMaterial color="#888" roughness={0.3} metalness={0.8} />
			</mesh>
			<mesh position={[2.5, -1.8, -3.5]} castShadow>
				<cylinderGeometry args={[0.25, 0.25, 2.5, 8]} />
				<meshStandardMaterial color="#888" roughness={0.3} metalness={0.8} />
			</mesh>
		</group>
	);
}

function GlbSwitch() {
	const { scene } = useGLTF('/models/switch.glb');
	const clone = scene.clone();
	const box = new THREE.Box3().setFromObject(clone);
	const size = box.getSize(new THREE.Vector3());
	const center = box.getCenter(new THREE.Vector3());
	const maxDim = Math.max(size.x, size.y, size.z) || 1;
	const scale = 12 / maxDim; // fit in ~12 units so camera sees it
	clone.position.sub(center);
	clone.scale.setScalar(scale);
	clone.traverse((node) => {
		if (node instanceof THREE.Mesh) {
			node.frustumCulled = false;
			if (node.material) {
				const mat = Array.isArray(node.material) ? node.material[0] : node.material;
				if (mat && 'envMapIntensity' in mat) (mat as THREE.MeshStandardMaterial).envMapIntensity = 1.2;
			}
		}
	});
	return <primitive object={clone} dispose={null} />;
}

/**
 * Manual OrbitControls attached to the eventSource div.
 * We read events.connected from R3F store (set when Canvas has eventSource) because
 * Canvas renders in a separate React root, so React context from the parent is not available here.
 */
function ManualOrbitControls() {
	const camera = useThree((s) => s.camera);
	const eventTarget = useThree((s) => s.events?.connected ?? null);
	const controlsRef = useRef<OrbitControlsImpl | null>(null);

	useEffect(() => {
		if (!eventTarget || !camera) return;
		const controls = new OrbitControlsImpl(camera, eventTarget);
		controls.enablePan = false;
		controls.enableDamping = true;
		controls.minPolarAngle = Math.PI / 4;
		controls.maxPolarAngle = Math.PI / 2;
		controls.minDistance = 8;
		controls.maxDistance = 24;
		controlsRef.current = controls;
		return () => {
			controls.dispose();
			controlsRef.current = null;
		};
	}, [eventTarget, camera]);

	useFrame(() => {
		controlsRef.current?.update();
	});

	return null;
}

class SwitchErrorBoundary extends Component<{ fallback: ReactNode; children: ReactNode }, { hasError: boolean }> {
	state = { hasError: false };
	static getDerivedStateFromError() {
		return { hasError: true };
	}
	render() {
		if (this.state.hasError) return this.props.fallback;
		return this.props.children;
	}
}

function SceneContent() {
	return (
		<>
			<color attach="background" args={['#e8e8e8']} />
			<Environment preset="studio" />
			<ambientLight intensity={1} />
			<directionalLight position={[6, 6, 8]} intensity={2} castShadow shadow-mapSize={[1024, 1024]} />
			<directionalLight position={[-4, 4, 6]} intensity={0.8} />
			<SwitchErrorBoundary fallback={<ProceduralSwitch />}>
				<Suspense fallback={<ProceduralSwitch />}>
					<group>
						<GlbSwitch />
					</group>
				</Suspense>
			</SwitchErrorBoundary>
			<ManualOrbitControls />
		</>
	);
}

function Scene() {
	return <SceneContent />;
}

export default function SwitchViewer() {
	const [mounted, setMounted] = useState(false);
	const containerRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		setMounted(true);
	}, []);

	useEffect(() => {
		const el = containerRef.current;
		if (!el || !mounted) return;
		const onWheel = (e: WheelEvent) => {
			if (el.contains(e.target as Node)) e.preventDefault();
		};
		el.addEventListener('wheel', onWheel, { passive: false });
		return () => el.removeEventListener('wheel', onWheel);
	}, [mounted]);

	if (!mounted) {
		return (
			<div className="h-full w-full min-h-[240px] flex items-center justify-center bg-neutral-100 text-neutral-500">
				Loading…
			</div>
		);
	}

	return (
		<div
			ref={containerRef}
			className="absolute inset-0 w-full h-full min-h-[240px] cursor-grab active:cursor-grabbing"
			style={{ touchAction: 'none', pointerEvents: 'auto' }}
		>
			<Canvas
				eventSource={containerRef as React.RefObject<HTMLElement>}
				style={{ display: 'block', width: '100%', height: '100%' }}
				camera={{ position: [14, 10, 14], fov: 42, near: 0.1, far: 1000 }}
				shadows
				gl={{
					antialias: true,
					alpha: false,
					powerPreference: 'high-performance',
				}}
				onCreated={({ gl, scene }) => {
					// Prevent R3F from calling forceContextLoss() on unmount (avoids "Context Lost" and broken display).
					(gl as unknown as { forceContextLoss?: (() => void) | null }).forceContextLoss = null;
					// Ensure we never get a black canvas; env/lighting may load later.
					scene.background = new THREE.Color('#e8e8e8');
					gl.toneMapping = THREE.ACESFilmicToneMapping;
					gl.toneMappingExposure = 1.2;
				}}
			>
				<Scene />
			</Canvas>
		</div>
	);
}
