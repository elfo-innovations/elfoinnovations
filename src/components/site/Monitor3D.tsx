import { Suspense, useEffect, useRef, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Preload, useGLTF } from "@react-three/drei";

// Reuses the existing desktop PC 3D model from
// https://github.com/aabansyed/portfolio1 (public/desktop_pc/scene.gltf)
// Files are copied into this project's /public/desktop_pc/ directory.

function Computers({ isMobile }: { isMobile: boolean }) {
  const computer = useGLTF("/desktop_pc/scene.gltf");
  return (
    <mesh>
      <hemisphereLight intensity={0.5} groundColor="black" />
      <spotLight
        position={[-20, 50, 10]}
        angle={0.12}
        penumbra={1}
        intensity={1}
        castShadow
        shadow-mapSize={1024}
      />
      <pointLight intensity={1} />
      <primitive
        object={computer.scene}
        scale={isMobile ? 1.1 : 1.25}
        position={isMobile ? [0, -3.2, -2.2] : [0, -3.4, -1.5]}
        rotation={[-0.01, -0.2, -0.1]}
      />

    </mesh>
  );
}

useGLTF.preload("/desktop_pc/scene.gltf");

export function Monitor3D() {
  const [isMobile, setIsMobile] = useState(false);
  const controlsRef = useRef<any>(null);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 640px)");
    setIsMobile(mq.matches);
    const cb = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mq.addEventListener("change", cb);
    return () => mq.removeEventListener("change", cb);
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.key === "r" || e.key === "R") && controlsRef.current) {
        controlsRef.current.reset();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <div
      className="relative mx-auto w-full max-w-[820px]"
      style={{
        aspectRatio: "4 / 3",
        background: "transparent",
      }}
    >
      <Canvas
        frameloop="always"
        shadows
        dpr={[1, 2]}
        camera={{ position: [20, 3, 5], fov: 25 }}
        gl={{ preserveDrawingBuffer: true, alpha: true, antialias: true }}
        style={{ background: "transparent" }}
      >
        <Suspense fallback={null}>
          <OrbitControls
            ref={controlsRef}
            enableZoom
            enablePan={false}
            enableDamping
            dampingFactor={0.08}
            autoRotate
            autoRotateSpeed={-0.6}
            maxPolarAngle={Math.PI / 2}
            minPolarAngle={0}
          />
          <Computers isMobile={isMobile} />
        </Suspense>
        <Preload all />
      </Canvas>

      <div className="pointer-events-none absolute bottom-3 left-1/2 -translate-x-1/2 text-[10px] uppercase tracking-[0.25em] text-foreground/50">
        Drag to rotate · Scroll to zoom · Press R to reset
      </div>

      <button
        onClick={() => controlsRef.current?.reset()}
        className="absolute right-3 top-3 rounded-full border border-foreground/10 bg-foreground/5 px-3 py-1 text-[10px] uppercase tracking-widest text-foreground/70 backdrop-blur transition hover:bg-foreground/10"
      >
        Reset
      </button>
    </div>

  );
}
