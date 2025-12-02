import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Text, RoundedBox, OrbitControls, PerspectiveCamera, Grid } from '@react-three/drei';
import { EffectComposer, Bloom, ChromaticAberration, Vignette } from '@react-three/postprocessing';
import { BlendFunction } from 'postprocessing';
import * as THREE from 'three';
import { Suspense } from 'react';

// --- 配置项 ---
const THEME = {
  bg: "#000509", 
  keyBase: "#111111", 
  keyActive: "#00FFFF", 
  // 文字颜色微调：稍微暗一点点，避免未激活时也被 Bloom 算作高光
  keyTextBase: "#88CCCC", 
  keyTextActive: "#FFFFFF", 
  accentMagenta: "#FF00FF", 
  accentCyan: "#00FFFF", 
};

// --- 1. 单个按键组件 ---
const Key3D = ({ label, width = 1, x, z, active }) => {
  const meshRef = useRef();
  const targetY = active ? -0.15 : 0;

  useFrame(() => {
    if (meshRef.current) {
      meshRef.current.position.y = THREE.MathUtils.lerp(meshRef.current.position.y, targetY, 0.25);
    }
  });

  return (
    <group position={[x, 0, z]}>
      <RoundedBox ref={meshRef} args={[width, 0.8, 0.8]} radius={0.15} smoothness={8}>
        <meshPhysicalMaterial
          color={active ? THEME.keyActive : THEME.keyBase}
          emissive={active ? THEME.keyActive : "#000000"}
          emissiveIntensity={active ? 2 : 0}
          roughness={0.15}
          metalness={0.9}
          reflectivity={1}
          clearcoat={0.5}
        />
      </RoundedBox>

      {/* 优化文字清晰度：
         1. 去掉 outline (描边有时会降低小字体的清晰度)
         2. fontSize 保持适中
         3. 确保文字位于按键正上方一点点，避免 Z-fighting
      */}
      <Text
        position={[0, active ? -0.04 : 0.41, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
        fontSize={0.3}
        font="/fonts/OPPOSans-Regular.ttf"
        color={active ? THEME.keyTextActive : THEME.keyTextBase}
        anchorX="center"
        anchorY="middle"
      >
        {label}
      </Text>

      {active && (
        <mesh rotation={[-Math.PI/2, 0, 0]} position={[0, -0.3, 0]}>
          <planeGeometry args={[width*1.2, 1.2]} />
          <meshBasicMaterial color={THEME.keyActive} transparent opacity={0.3} toneMapped={false} />
        </mesh>
      )}
    </group>
  );
};

// --- 2. 键盘布局生成器 (已移除霓虹灯带) ---
const KeyboardLayout = ({ activeKeys }) => {
  const rows = [
    [{ k: '`', w: 1 }, { k: '1', w: 1 }, { k: '2', w: 1 }, { k: '3', w: 1 }, { k: '4', w: 1 }, { k: '5', w: 1 }, { k: '6', w: 1 }, { k: '7', w: 1 }, { k: '8', w: 1 }, { k: '9', w: 1 }, { k: '0', w: 1 }, { k: '-', w: 1 }, { k: '=', w: 1 }, { k: 'BACKSPACE', w: 2 }],
    [{ k: 'TAB', w: 1.5 }, { k: 'Q', w: 1 }, { k: 'W', w: 1 }, { k: 'E', w: 1 }, { k: 'R', w: 1 }, { k: 'T', w: 1 }, { k: 'Y', w: 1 }, { k: 'U', w: 1 }, { k: 'I', w: 1 }, { k: 'O', w: 1 }, { k: 'P', w: 1 }, { k: '[', w: 1 }, { k: ']', w: 1 }, { k: '\\', w: 1.5 }],
    [{ k: 'CAPS', w: 1.8 }, { k: 'A', w: 1 }, { k: 'S', w: 1 }, { k: 'D', w: 1 }, { k: 'F', w: 1 }, { k: 'G', w: 1 }, { k: 'H', w: 1 }, { k: 'J', w: 1 }, { k: 'K', w: 1 }, { k: 'L', w: 1 }, { k: ';', w: 1 }, { k: "'", w: 1 }, { k: 'ENTER', w: 2.2 }],
    [{ k: 'SHIFT', w: 2.3 }, { k: 'Z', w: 1 }, { k: 'X', w: 1 }, { k: 'C', w: 1 }, { k: 'V', w: 1 }, { k: 'B', w: 1 }, { k: 'N', w: 1 }, { k: 'M', w: 1 }, { k: ',', w: 1 }, { k: '.', w: 1 }, { k: '/', w: 1 }, { k: 'SHIFT', w: 2.7 }],
    [{ k: 'CTRL', w: 1.5 }, { k: 'WIN', w: 1 }, { k: 'ALT', w: 1.5 }, { k: 'SPACE', w: 6 }, { k: 'ALT', w: 1.5 }, { k: 'FN', w: 1 }, { k: 'CTRL', w: 1.5 }]
  ];

  const keys = useMemo(() => {
    const keyElements = [];
    let zOffset = 0;
    rows.forEach((row, rowIndex) => {
      let xOffset = -7.5;
      row.forEach((item, colIndex) => {
        keyElements.push({
          ...item,
          x: xOffset + item.w / 2,
          z: zOffset,
          id: `${rowIndex}-${colIndex}-${item.k}`
        });
        xOffset += item.w + 0.1;
      });
      zOffset += 1.1;
    });
    return keyElements;
  }, []);

  return (
    <group position={[0, 0, -2]}>
      {keys.map((keyData) => (
        <Key3D key={keyData.id} label={keyData.k} width={keyData.w} x={keyData.x} z={keyData.z} active={activeKeys.has(keyData.k)} />
      ))}
    </group>
  );
};

// --- 3. 鼠标 3D 组件 ---
const Mouse3D = ({ mouseButtons, scrollDir }) => {
  const groupRef = useRef();
  const { camera, raycaster, pointer } = useThree();
  const floorPlane = useMemo(() => new THREE.Plane(new THREE.Vector3(0, 1, 0), -0.2), []);
  const intersectPoint = useMemo(() => new THREE.Vector3(), []);

  useFrame(() => {
    if (groupRef.current) {
      raycaster.setFromCamera(pointer, camera);
      raycaster.ray.intersectPlane(floorPlane, intersectPoint);
      if (groupRef.current.parent) groupRef.current.parent.worldToLocal(intersectPoint);
      groupRef.current.position.lerp(intersectPoint, 0.2);
      groupRef.current.position.y = 0.25;
      groupRef.current.rotation.z = THREE.MathUtils.lerp(groupRef.current.rotation.z, -pointer.x * 0.2, 0.1);
      groupRef.current.rotation.x = THREE.MathUtils.lerp(groupRef.current.rotation.x, pointer.y * 0.2, 0.1);
    }
  });

  const mouseMaterial = new THREE.MeshPhysicalMaterial({
    color: "#222", roughness: 0.2, metalness: 0.9, clearcoat: 1
  });

  return (
    <group ref={groupRef} position={[6, 0, 2]}>
      <RoundedBox args={[1.8, 0.5, 3]} radius={0.3} smoothness={8} material={mouseMaterial} />
      <RoundedBox args={[1.9, 0.05, 3.1]} radius={0.3} position={[0, -0.26, 0]}>
        <meshBasicMaterial color={THEME.accentMagenta} toneMapped={false} />
      </RoundedBox>
      <mesh rotation={[-Math.PI/2, 0, 0]} position={[0, -0.35, 0]}>
        <planeGeometry args={[3, 4]} />
        <meshBasicMaterial color={THEME.accentMagenta} transparent opacity={0.2} toneMapped={false} />
      </mesh>
      <RoundedBox args={[0.7, 0.2, 1.2]} position={[-0.45, 0.35, -0.8]} radius={0.1} smoothness={4}>
        <meshPhysicalMaterial
          color={mouseButtons.left ? THEME.keyActive : "#333"}
          emissive={mouseButtons.left ? THEME.keyActive : "#000"}
          emissiveIntensity={2} roughness={0.2} metalness={0.8}
        />
      </RoundedBox>
      <RoundedBox args={[0.7, 0.2, 1.2]} position={[0.45, 0.35, -0.8]} radius={0.1} smoothness={4}>
        <meshPhysicalMaterial
          color={mouseButtons.right ? THEME.keyActive : "#333"}
          emissive={mouseButtons.right ? THEME.keyActive : "#000"}
          emissiveIntensity={2} roughness={0.2} metalness={0.8}
        />
      </RoundedBox>
      <mesh position={[0, 0.35, -0.8]} rotation={[Math.PI/2, 0, 0]}>
        <cylinderGeometry args={[0.15, 0.15, 0.4, 32]} />
        <meshPhysicalMaterial
          color={scrollDir ? THEME.keyActive : "#888"}
          emissive={scrollDir ? THEME.keyActive : "#000"} emissiveIntensity={2}
          metalness={1} roughness={0.3}
        />
      </mesh>
    </group>
  )
}

// --- 4. 主场景 ---
const Scene = ({ activeKeys, mouseButtons, scrollDir }) => {
  return (
    <>
      <color attach="background" args={[THEME.bg]} />
      <Suspense fallback={null} />

      <ambientLight intensity={0.4} color={"#556677"} />
      <spotLight position={[-20, 20, 10]} angle={0.3} penumbra={1} intensity={200} color={THEME.accentCyan} castShadow />
      <pointLight position={[20, 10, -10]} intensity={150} color={THEME.accentMagenta} distance={50} />
      <rectAreaLight width={20} height={20} intensity={15} color={"#ffffff"} position={[0, 10, 0]} rotation={[-Math.PI/2, 0,0]} />

      <group rotation={[0.25, 0, 0]} position={[0, -0.5, 0]}>
        <KeyboardLayout activeKeys={activeKeys} />
        <Mouse3D mouseButtons={mouseButtons} scrollDir={scrollDir} />
      </group>

      <Grid
        position={[0, -2.5, 0]}
        args={[60, 60]}
        cellSize={1.1}
        cellThickness={1}
        cellColor={THEME.accentCyan}
        sectionSize={5.5}
        sectionThickness={1.5}
        sectionColor={THEME.accentMagenta}
        fadeDistance={35}
        fadeStrength={1.5}
        followCamera
      />
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -2.55, 0]}>
        <planeGeometry args={[100, 100]} />
        <meshStandardMaterial color="#000" roughness={0.1} metalness={0.95} envMapIntensity={0.5} />
      </mesh>

      <PerspectiveCamera makeDefault position={[0, 14, 20]} fov={50} />
      <OrbitControls
        enablePan={false}
        maxPolarAngle={Math.PI / 2.2}
        minPolarAngle={Math.PI / 6}
        maxDistance={35}
        minDistance={10}
        autoRotate={false}
        autoRotateSpeed={0.5}
      />

      {/* 后期处理优化：解决文字模糊的关键点 
          multisampling={4} : 开启多重采样抗锯齿
      */}
      <EffectComposer disableNormalPass multisampling={4}>
        {/* Bloom: 
           luminanceThreshold={0.8} -> 只有非常亮(>0.8)的区域才发光。
           这会确保普通白字不会产生光晕，只有按下的按键(emissiveIntensity高)才会发光。
        */}
        <Bloom
          luminanceThreshold={0.8}
          mipmapBlur
          intensity={1.5}
          radius={0.5}
          levels={8}
        />
        
        {/* ChromaticAberration (色散):
           offset={[0.0002, 0.0002]} -> 将偏移量改到极小。
           之前的 0.002 导致了明显的重影模糊。现在这个数值保留一点点质感，但几乎不影响清晰度。
           如果不想要任何重影，可以把这个组件完全删掉。
        */}
        <ChromaticAberration
          blendFunction={BlendFunction.NORMAL}
          offset={[0.0002, 0.0002]} 
          radialModulation={false}
          modulationOffset={0}
        />
        
        <Vignette eskil={false} offset={0.3} darkness={0.7} />
      </EffectComposer>
    </>
  );
};

// --- 5. UI 面板组件 ---
const UIOverlay = ({ mousePos, keyHistory, activeKeys }) => {
  return (
    <div style={{
      position: 'absolute', right: 30, top: 30, zIndex: 10, width: '280px',
      padding: '20px', background: 'rgba(0, 10, 20, 0.85)',
      border: `1px solid ${THEME.accentCyan}`,
      borderRadius: '8px',
      color: THEME.accentCyan,
      fontFamily: "'Courier New', monospace",
      boxShadow: `0 0 25px ${THEME.accentCyan}40`,
      backdropFilter: 'blur(8px)'
    }}>
      <h3 style={{ margin: '0 0 15px 0', borderBottom: `1px solid ${THEME.accentCyan}80`, paddingBottom: '10px', letterSpacing: '2px' }}>
        SYSTEM.MONITOR
      </h3>

      <div style={{ marginBottom: '15px', fontSize: '14px' }}>
        <div style={{ color: THEME.accentMagenta, marginBottom: '5px', fontSize:'10px' }}>// MOUSE_COORDINATES</div>
        <div style={{ fontWeight: 'bold' }}>X: {mousePos.x.toFixed(0).padStart(4)} <span style={{color:'#555'}}>|</span> Y: {mousePos.y.toFixed(0).padStart(4)}</div>
      </div>

      <div style={{ marginBottom: '15px' }}>
        <div style={{ color: THEME.accentMagenta, marginBottom: '5px', fontSize:'10px' }}>// ACTIVE_INPUTS</div>
        <div style={{ minHeight: '30px', display: 'flex', gap: '5px', flexWrap: 'wrap' }}>
          {activeKeys.size > 0 ? Array.from(activeKeys).map(k => (
            <span key={k} style={{
              background: THEME.accentCyan, color: '#000', padding: '2px 8px', borderRadius: '2px', fontWeight: 'bold', boxShadow: `0 0 10px ${THEME.accentCyan}`
            }}>{k}</span>
          )) : <span style={{ color: '#005555' }}>STANDBY...</span>}
        </div>
      </div>

      <div>
        <div style={{ color: THEME.accentMagenta, marginBottom: '5px', fontSize:'10px' }}>// EVENT_LOG</div>
        <div style={{ display: 'flex', flexDirection: 'column-reverse', gap: '2px', color: THEME.accentCyan }}>
          {keyHistory.map((k, i) => (
            <div key={i} style={{ fontSize: '12px', opacity: 1 - i * 0.12, paddingLeft: '10px', borderLeft: `2px solid ${THEME.accentMagenta}` }}>
              {`>> ${k}`}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// --- 6. App 入口 ---
export default function App() {
  const [activeKeys, setActiveKeys] = useState(new Set());
  const [mouseButtons, setMouseButtons] = useState({ left: false, right: false, mid: false });
  const [scrollDir, setScrollDir] = useState(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [keyHistory, setKeyHistory] = useState([]);

  const mapKey = (code, key) => {
    const specialized = {
      'Space': 'SPACE', 'ControlLeft': 'CTRL', 'ControlRight': 'CTRL',
      'ShiftLeft': 'SHIFT', 'ShiftRight': 'SHIFT', 'AltLeft': 'ALT', 'AltRight': 'ALT',
      'Enter': 'ENTER', 'Backspace': 'BACKSPACE', 'Tab': 'TAB',
      'CapsLock': 'CAPS', 'MetaLeft': 'WIN', 'MetaRight': 'WIN'
    };
    return specialized[code] || (key.length === 1 ? key.toUpperCase() : null);
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      const mappedKey = mapKey(e.code, e.key);
      if (!mappedKey) return;
      setActiveKeys((prev) => new Set(prev).add(mappedKey));
      setKeyHistory(prev => [mappedKey, ...prev].slice(8));
    };
    const handleKeyUp = (e) => {
      const mappedKey = mapKey(e.code, e.key);
      if (mappedKey) setActiveKeys((prev) => { const next = new Set(prev); next.delete(mappedKey); return next; });
    };
    const handleMouseDown = (e) => {
      if(e.button === 0) setMouseButtons(p => ({...p, left: true}));
      if(e.button === 1) setMouseButtons(p => ({...p, mid: true}));
      if(e.button === 2) setMouseButtons(p => ({...p, right: true}));
    }
    const handleMouseUp = (e) => {
      if(e.button === 0) setMouseButtons(p => ({...p, left: false}));
      if(e.button === 1) setMouseButtons(p => ({...p, mid: false}));
      if(e.button === 2) setMouseButtons(p => ({...p, right: false}));
    }
    const handleWheel = (e) => {
      setScrollDir(e.deltaY > 0 ? 'down' : 'up');
      setTimeout(() => setScrollDir(null), 150);
    }
    const handleMouseMove = (e) => setMousePos({ x: e.clientX, y: e.clientY });

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('wheel', handleWheel);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('contextmenu', e => e.preventDefault());

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('wheel', handleWheel);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('contextmenu', e => e.preventDefault());
    };
  }, []);

  return (
    <div style={{ width: '100vw', height: '100vh', background: THEME.bg, overflow: 'hidden' }}>
      <UIOverlay mousePos={mousePos} keyHistory={keyHistory} activeKeys={activeKeys} />
      {/* dpr 设置高一些，有助于文字清晰度 */}
      <Canvas shadows dpr={[1, 2]} gl={{ antialias: false }}>
        <Scene activeKeys={activeKeys} mouseButtons={mouseButtons} scrollDir={scrollDir} />
      </Canvas>
    </div>
  );
}