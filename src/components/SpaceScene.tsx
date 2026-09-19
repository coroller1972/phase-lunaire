import { useEffect, useMemo, useRef } from "react";
import type { MutableRefObject, RefObject } from "react";
import { Canvas, type ThreeEvent, useFrame, useThree } from "@react-three/fiber";
import { Billboard, Html, Line, OrbitControls, useTexture } from "@react-three/drei";
import {
  AdditiveBlending,
  BackSide,
  Color,
  Euler,
  MathUtils,
  Mesh,
  Object3D,
  Quaternion,
  SRGBColorSpace,
  DoubleSide,
  Vector3,
} from "three";
import type { LessonStep, LunarSnapshot, ObservationInput } from "../types";
import { longitudeLatitudeToVector, vectorToLongitudeLatitude } from "../lib/coordinates";
import { getSceneFraming } from "../lib/scene-layout";

interface SpaceSceneProps {
  step: LessonStep;
  observation: ObservationInput;
  snapshot: LunarSnapshot;
  reducedMotion: boolean;
  recenterToken: number;
  onPickCoordinates: (latitude: number, longitude: number) => void;
}

const EARTH_POSITION = new Vector3(-2.75, 0.95, 0);
const SUN_POSITION = new Vector3(10.3, 5.6, -2.5);
const EARTH_RADIUS = 2.75;
const ORBIT_RADIUS_X = 5.05;
// Keep the pedagogical orbit outside the deliberately enlarged Earth model.
const ORBIT_VISUAL_RADIUS_Y = 3.65;
const SUN_DIRECTION = SUN_POSITION.clone().sub(EARTH_POSITION).normalize();
const SUN_GLOW_VERTEX_SHADER = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;
const SUN_GLOW_FRAGMENT_SHADER = `
  uniform vec3 glowColor;
  uniform float glowOpacity;
  varying vec2 vUv;
  void main() {
    float distanceFromCenter = distance(vUv, vec2(0.5));
    float falloff = 1.0 - smoothstep(0.02, 0.5, distanceFromCenter);
    float alpha = pow(falloff, 2.2) * glowOpacity;
    gl_FragColor = vec4(glowColor, alpha);
  }
`;

function CameraRig({
  framing,
  reducedMotion,
  transitionActive,
  recenterToken,
}: Pick<SpaceSceneProps, "reducedMotion" | "recenterToken"> & { framing: ReturnType<typeof getSceneFraming>; transitionActive: MutableRefObject<boolean> }) {
  const invalidate = useThree((state) => state.invalidate);
  const target = useMemo(() => new Vector3(framing.x, framing.y, framing.distance), [framing]);

  useEffect(() => {
    transitionActive.current = true;
    invalidate();
  }, [target, transitionActive, invalidate, recenterToken]);

  useFrame(({ camera }, delta) => {
    if (!transitionActive.current) return;
    if (reducedMotion) {
      camera.position.copy(target);
      transitionActive.current = false;
      return;
    }
    camera.position.lerp(target, 1 - Math.exp(-delta * 2.5));
    if (camera.position.distanceToSquared(target) < 0.0001) {
      camera.position.copy(target);
      transitionActive.current = false;
    } else invalidate();
  });
  return null;
}

function ObserverMarker({ observation, sunAltitudeDeg, earthRef }: { observation: ObservationInput; sunAltitudeDeg: number; earthRef: RefObject<Mesh | null> }) {
  const position = useMemo(
    () => longitudeLatitudeToVector(observation.latitude, observation.longitude, EARTH_RADIUS + 0.07),
    [observation.latitude, observation.longitude],
  );

  return (
    <group position={position}>
      <mesh>
        <sphereGeometry args={[0.075, 20, 20]} />
        <meshBasicMaterial color="#ddff6b" toneMapped={false} />
      </mesh>
      <mesh scale={1.9}>
        <ringGeometry args={[0.075, 0.115, 32]} />
        <meshBasicMaterial color="#ddff6b" transparent opacity={0.72} side={2} />
      </mesh>
      <Html position={[0.18, 0.2, 0]} center={false} distanceFactor={10} occlude={[earthRef as RefObject<Mesh>]} zIndexRange={[20, 0]}>
        <div className="scene-label scene-label--observer">
          <span>{observation.label.split(",")[0]}</span>
          <small>
            Votre position · {sunAltitudeDeg < -6 ? "nuit" : sunAltitudeDeg < 0 ? "crépuscule" : "jour"}
          </small>
        </div>
      </Html>
    </group>
  );
}

function Earth({
  observation,
  snapshot,
  onPickCoordinates,
}: Pick<SpaceSceneProps, "observation" | "snapshot" | "onPickCoordinates">) {
  const earthRef = useRef<Mesh>(null);
  const [dayMap, nightMap] = useTexture([
    "/assets/planets/earth-blue-marble-2k.jpg",
    "/assets/planets/earth-night-lights-2k.jpg",
  ]);

  useEffect(() => {
    dayMap.colorSpace = SRGBColorSpace;
    nightMap.colorSpace = SRGBColorSpace;
  }, [dayMap, nightMap]);

  const orientation = useMemo(() => {
    const base = new Quaternion().setFromEuler(new Euler(0, -0.06, -0.15));
    const subsolarPoint = longitudeLatitudeToVector(snapshot.sunLatitudeDeg, snapshot.sunLongitudeDeg, 1)
      .normalize()
      .applyQuaternion(base);
    const alignment = new Quaternion().setFromUnitVectors(subsolarPoint, SUN_DIRECTION);
    return alignment.multiply(base);
  }, [snapshot.sunLatitudeDeg, snapshot.sunLongitudeDeg]);

  function handleEarthPick(event: ThreeEvent<PointerEvent>) {
    event.stopPropagation();
    if (!earthRef.current || event.delta > 5) return;
    const localPoint = earthRef.current.worldToLocal(event.point.clone());
    const { latitude, longitude } = vectorToLongitudeLatitude(localPoint);
    onPickCoordinates(latitude, longitude);
  }

  return (
    <group position={EARTH_POSITION} quaternion={orientation}>
      <mesh ref={earthRef} onClick={handleEarthPick}>
        <sphereGeometry args={[EARTH_RADIUS, 96, 96]} />
        <meshStandardMaterial
          map={dayMap}
          emissive={new Color("#f4b36b")}
          emissiveMap={nightMap}
          emissiveIntensity={0.62}
          roughness={0.82}
          metalness={0.02}
        />
      </mesh>
      <mesh scale={1.012}>
        <sphereGeometry args={[EARTH_RADIUS, 72, 72]} />
        <meshBasicMaterial
          color="#78b9ff"
          transparent
          opacity={0.055}
          blending={AdditiveBlending}
          depthWrite={false}
          toneMapped={false}
        />
      </mesh>
      <mesh scale={1.028}>
        <sphereGeometry args={[EARTH_RADIUS, 72, 72]} />
        <meshBasicMaterial
          color="#8ccaff"
          transparent
          opacity={0.12}
          blending={AdditiveBlending}
          depthWrite={false}
          side={BackSide}
          toneMapped={false}
        />
      </mesh>
      <ObserverMarker observation={observation} sunAltitudeDeg={snapshot.sunAltitudeDeg} earthRef={earthRef} />
    </group>
  );
}

function Moon({ phaseAngleDeg, visible }: { phaseAngleDeg: number; visible: boolean }) {
  const moonMap = useTexture("/assets/planets/moon-lroc-2k.jpg");
  useEffect(() => {
    moonMap.colorSpace = SRGBColorSpace;
  }, [moonMap]);
  const moonPosition = useMemo(() => {
    const sunAngle = Math.atan2(SUN_POSITION.y - EARTH_POSITION.y, SUN_POSITION.x - EARTH_POSITION.x);
    const angle = sunAngle - MathUtils.degToRad(phaseAngleDeg);
    return new Vector3(
      EARTH_POSITION.x + Math.cos(angle) * ORBIT_RADIUS_X,
      EARTH_POSITION.y + Math.sin(angle) * ORBIT_VISUAL_RADIUS_Y,
      0.4 * Math.sin(angle),
    );
  }, [phaseAngleDeg]);

  return (
    <group position={moonPosition} visible={visible}>
      <mesh castShadow receiveShadow rotation={[0, 0.3, 0]}>
        <sphereGeometry args={[0.78, 72, 72]} />
        <meshStandardMaterial map={moonMap} roughness={0.96} />
      </mesh>
      <mesh scale={1.025} rotation={[0, 0.3, 0]}>
        <sphereGeometry args={[0.78, 48, 48]} />
        <meshBasicMaterial
          color="#d7e5ff"
          transparent
          opacity={0.055}
          blending={AdditiveBlending}
          depthWrite={false}
          side={BackSide}
          toneMapped={false}
        />
      </mesh>
      <Html position={[0.95, -0.45, 0]} distanceFactor={8} zIndexRange={[19, 0]}>
        <div className="scene-label scene-label--moon">La Lune en orbite</div>
      </Html>
    </group>
  );
}

function Sun({ visible }: { visible: boolean }) {
  const sunMap = useTexture("/assets/planets/sun-photosphere.jpg");
  const glowUniforms = useMemo(
    () => ({ glowColor: { value: new Color("#ffb24d") }, glowOpacity: { value: 0.16 } }),
    [],
  );
  useEffect(() => {
    sunMap.colorSpace = SRGBColorSpace;
  }, [sunMap]);

  return (
    <group position={SUN_POSITION} visible={visible}>
      <Billboard>
        <mesh scale={4.8}>
          <planeGeometry args={[2, 2]} />
          <shaderMaterial
            uniforms={glowUniforms}
            vertexShader={SUN_GLOW_VERTEX_SHADER}
            fragmentShader={SUN_GLOW_FRAGMENT_SHADER}
            transparent
            blending={AdditiveBlending}
            depthWrite={false}
            depthTest={false}
            toneMapped={false}
          />
        </mesh>
      </Billboard>
      <mesh scale={2.35}>
        <sphereGeometry args={[1.5, 48, 48]} />
        <meshBasicMaterial
          color="#ffb44b"
          transparent
          opacity={0.018}
          blending={AdditiveBlending}
          depthWrite={false}
          side={DoubleSide}
          toneMapped={false}
        />
      </mesh>
      <mesh scale={1.95}>
        <sphereGeometry args={[1.5, 48, 48]} />
        <meshBasicMaterial
          color="#ffd27b"
          transparent
          opacity={0.045}
          blending={AdditiveBlending}
          depthWrite={false}
          side={DoubleSide}
          toneMapped={false}
        />
      </mesh>
      <mesh>
        <sphereGeometry args={[1.5, 64, 64]} />
        <meshBasicMaterial map={sunMap} color="#fff4d2" toneMapped={false} />
      </mesh>
      <mesh scale={1.7}>
        <sphereGeometry args={[1.5, 48, 48]} />
        <meshBasicMaterial color="#ffd580" transparent opacity={0.075} blending={AdditiveBlending} depthWrite={false} toneMapped={false} />
      </mesh>
      <Html position={[-2.25, -1.35, 0]} distanceFactor={8} zIndexRange={[18, 0]}>
        <div className="scene-label scene-label--sun">Lumière solaire</div>
      </Html>
    </group>
  );
}

function Orbit({ visible }: { visible: boolean }) {
  const points = useMemo(
    () =>
      Array.from({ length: 129 }, (_, index) => {
        const angle = (index / 128) * Math.PI * 2;
        return [
          EARTH_POSITION.x + Math.cos(angle) * ORBIT_RADIUS_X,
          EARTH_POSITION.y + Math.sin(angle) * ORBIT_VISUAL_RADIUS_Y,
          0.4 * Math.sin(angle),
        ] as [number, number, number];
      }),
    [],
  );
  return visible ? <Line points={points} color="#d8dce6" lineWidth={1.15} transparent opacity={0.58} /> : null;
}

function LightRays({ visible }: { visible: boolean }) {
  if (!visible) return null;
  const offsets = [-1.5, -0.72, 0, 0.72, 1.5];
  const beamAngle = Math.atan2(SUN_POSITION.y - EARTH_POSITION.y, SUN_POSITION.x - EARTH_POSITION.x) - Math.PI / 2;
  const beamCenter = SUN_POSITION.clone().add(EARTH_POSITION).multiplyScalar(0.5);
  const beamLength = SUN_POSITION.distanceTo(EARTH_POSITION) * 0.92;
  return (
    <group>
      {[0.9, 1.55].map((width, index) => (
        <mesh
          key={`beam-${width}`}
          position={[beamCenter.x, beamCenter.y, beamCenter.z + index * 0.035]}
          rotation={[0, 0, beamAngle]}
        >
          <planeGeometry args={[width, beamLength]} />
          <meshBasicMaterial
            color="#ffd98f"
            transparent
            opacity={index === 0 ? 0.032 : 0.018}
            blending={AdditiveBlending}
            depthWrite={false}
            side={DoubleSide}
            toneMapped={false}
          />
        </mesh>
      ))}
      {offsets.map((offset) => (
        <Line
          key={offset}
          points={[
            [SUN_POSITION.x - 1.2, SUN_POSITION.y + offset, SUN_POSITION.z],
            [EARTH_POSITION.x + 2.2, EARTH_POSITION.y + offset * 0.3, 0],
          ]}
          color="#ffe6b7"
          lineWidth={offset === 0 ? 0.9 : 0.55}
          transparent
          opacity={offset === 0 ? 0.42 : 0.2}
        />
      ))}
    </group>
  );
}

function SceneContent(props: SpaceSceneProps) {
  const cameraTransitionRef = useRef(true);
  const size = useThree((state) => state.size);
  const framing = useMemo(() => getSceneFraming(props.step, size.width / size.height), [props.step, size.width, size.height]);
  const lightTarget = useMemo(() => { const target = new Object3D(); target.position.copy(EARTH_POSITION); return target; }, []);

  return (
    <>
      <CameraRig framing={framing} recenterToken={props.recenterToken} reducedMotion={props.reducedMotion} transitionActive={cameraTransitionRef} />
      <ambientLight intensity={0.2} />
      <primitive object={lightTarget} />
      <directionalLight position={SUN_POSITION} target={lightTarget} intensity={3.5} color="#fff0c9" />
      <group>
        <Earth observation={props.observation} snapshot={props.snapshot} onPickCoordinates={props.onPickCoordinates} />
        <Orbit visible={props.step >= 2} />
        {props.step >= 2 && <Moon phaseAngleDeg={props.snapshot.phaseAngleDeg} visible />}
        {props.step >= 2 && <Sun visible />}
        <LightRays visible={props.step >= 2} />
      </group>
      <OrbitControls
        enablePan={false}
        minDistance={framing.distance * 0.5}
        maxDistance={framing.distance * 2}
        target={[framing.x, framing.y, 0]}
        enableDamping={!props.reducedMotion}
        dampingFactor={0.06}
        onStart={() => {
          cameraTransitionRef.current = false;
        }}
      />
    </>
  );
}

export default function SpaceScene(props: SpaceSceneProps) {
  return (
    <Canvas
      className="space-canvas"
      camera={{ position: [1.8, 1.65, 30], fov: 42, near: 0.1, far: 200 }}
      frameloop="demand"
      dpr={[1, 1.5]}
      gl={{ antialias: true, alpha: true }}
      onCreated={({ gl }) => {
        gl.setClearColor(new Color("#020711"), 0);
        const canvas = gl.domElement;
        canvas.addEventListener("webglcontextlost", (event) => {
          event.preventDefault();
          canvas.dataset.contextLost = "true";
        });
        canvas.addEventListener("webglcontextrestored", () => {
          delete canvas.dataset.contextLost;
          gl.setClearColor(new Color("#020711"), 0);
        });
      }}
    >
      <SceneContent {...props} />
    </Canvas>
  );
}
