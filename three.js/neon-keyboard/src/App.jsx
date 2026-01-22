import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Text, RoundedBox, OrbitControls, PerspectiveCamera, Grid, Sphere, Cylinder } from '@react-three/drei';
import { EffectComposer, Bloom, ChromaticAberration, Vignette } from '@react-three/postprocessing';
import { BlendFunction } from 'postprocessing';
import * as THREE from 'three';
import { Suspense } from 'react';

// --- 配置项 ---
const THEME = {
  bg: "#000509", 
  keyBase: "#111111", 
  keyActive: "#00AAAA", 
  keyTextBase: "#88CCCC", 
  keyTextActive: "#FFFFFF", 
  accentMagenta: "#FF00FF", 
  accentCyan: "#00FFFF", 
  mouseBody: "#1A1A1A",
  mouseGrip: "#0A0A0A",
};

// --- 1. 单个按键组件 (换回 Text 组件，但不设 font) ---
const Key3D = ({ label, width = 1, h = 1, x, z, active }) => {
  const meshRef = useRef();
  const targetY = active ? -0.15 : 0;
  
  // 计算Z轴长度
  const zLength = 0.8 + (h - 1) * 1.1;

  useFrame(() => {
    if (meshRef.current) {
      meshRef.current.position.y = THREE.MathUtils.lerp(meshRef.current.position.y, targetY, 0.25);
    }
  });

  return (
    <group position={[x, 0, z]}>
      <RoundedBox ref={meshRef} args={[width, 0.8, zLength]} radius={0.15} smoothness={8}>
        <meshPhysicalMaterial
          color={active ? THEME.keyActive : THEME.keyBase}
          emissive={active ? THEME.keyActive : "#000000"}
          emissiveIntensity={active ? 3 : 0}
          roughness={0.3} 
          metalness={0.8}
          reflectivity={0.5}
          clearcoat={0.2}
        />
      </RoundedBox>

      {/* [修改] 恢复使用 Text 组件 */}
      <Text
        position={[0, active ? 0.27 : 0.41, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
        fontSize={0.3}
        // [关键] 这里不传 font 属性，使用默认字体
        color={active ? THEME.keyTextActive : THEME.keyTextBase}
        anchorX="center"
        anchorY="middle"
        // 确保文字发光且不被环境光影响
        material-toneMapped={false} 
      >
        {label}
      </Text>
    </group>
  );
};

// =====================================================================
// --- 2. 键盘布局生成器 (包含 F 行) ---
// =====================================================================
const KeyboardLayout = ({ activeKeys }) => {
  const rows = [
    // Row -1: ESC 和 F1-F12 功能行
    [
      { k: 'ESC', c: 'Escape', w: 1 },
      'sp-1', 
      { k: 'F1', c: 'F1', w: 1 }, { k: 'F2', c: 'F2', w: 1 }, { k: 'F3', c: 'F3', w: 1 }, { k: 'F4', c: 'F4', w: 1 },
      'sp-0.5',
      { k: 'F5', c: 'F5', w: 1 }, { k: 'F6', c: 'F6', w: 1 }, { k: 'F7', c: 'F7', w: 1 }, { k: 'F8', c: 'F8', w: 1 },
      'sp-0.5',
      { k: 'F9', c: 'F9', w: 1 }, { k: 'F10', c: 'F10', w: 1 }, { k: 'F11', c: 'F11', w: 1 }, { k: 'F12', c: 'F12', w: 1 },
      'sp-0.5',
      { k: 'PS', c: 'PrintScreen', w: 1 }, { k: 'SL', c: 'ScrollLock', w: 1 }, { k: 'PB', c: 'Pause', w: 1 }
    ],
    // Row 0
    [
      { k: '`', c: 'Backquote', w: 1 }, { k: '1', c: 'Digit1', w: 1 }, { k: '2', c: 'Digit2', w: 1 }, { k: '3', c: 'Digit3', w: 1 }, { k: '4', c: 'Digit4', w: 1 }, { k: '5', c: 'Digit5', w: 1 }, { k: '6', c: 'Digit6', w: 1 }, { k: '7', c: 'Digit7', w: 1 }, { k: '8', c: 'Digit8', w: 1 }, { k: '9', c: 'Digit9', w: 1 }, { k: '0', c: 'Digit0', w: 1 }, { k: '-', c: 'Minus', w: 1 }, { k: '=', c: 'Equal', w: 1 }, { k: 'BACK', c: 'Backspace', w: 2 },
      'sp-0.5',
      { k: 'INS', c: 'Insert', w: 1 }, { k: 'HOME', c: 'Home', w: 1 }, { k: 'PGUP', c: 'PageUp', w: 1 },
      'sp-0.5',
      { k: 'NUM', c: 'NumLock', w: 1 }, { k: '/', c: 'NumpadDivide', w: 1 }, { k: '*', c: 'NumpadMultiply', w: 1 }, { k: '-', c: 'NumpadSubtract', w: 1 }
    ],
    // Row 1
    [
      { k: 'Tab', c: 'Tab', w: 1.5 }, { k: 'Q', c: 'KeyQ', w: 1 }, { k: 'W', c: 'KeyW', w: 1 }, { k: 'E', c: 'KeyE', w: 1 }, { k: 'R', c: 'KeyR', w: 1 }, { k: 'T', c: 'KeyT', w: 1 }, { k: 'Y', c: 'KeyY', w: 1 }, { k: 'U', c: 'KeyU', w: 1 }, { k: 'I', c: 'KeyI', w: 1 }, { k: 'O', c: 'KeyO', w: 1 }, { k: 'P', c: 'KeyP', w: 1 }, { k: '[', c: 'BracketLeft', w: 1 }, { k: ']', c: 'BracketRight', w: 1 }, { k: '\\', c: 'Backslash', w: 1.5 },
      'sp-0.5',
      { k: 'DEL', c: 'Delete', w: 1 }, { k: 'END', c: 'End', w: 1 }, { k: 'PGDN', c: 'PageDown', w: 1 },
      'sp-0.5',
      { k: '7', c: 'Numpad7', w: 1 }, { k: '8', c: 'Numpad8', w: 1 }, { k: '9', c: 'Numpad9', w: 1 }, 
      { k: '+', c: 'NumpadAdd', w: 1, h: 2 } 
    ],
    // Row 2
    [
      { k: 'CapsL', c: 'CapsLock', w: 1.8 }, { k: 'A', c: 'KeyA', w: 1 }, { k: 'S', c: 'KeyS', w: 1 }, { k: 'D', c: 'KeyD', w: 1 }, { k: 'F', c: 'KeyF', w: 1 }, { k: 'G', c: 'KeyG', w: 1 }, { k: 'H', c: 'KeyH', w: 1 }, { k: 'J', c: 'KeyJ', w: 1 }, { k: 'K', c: 'KeyK', w: 1 }, { k: 'L', c: 'KeyL', w: 1 }, { k: ';', c: 'Semicolon', w: 1 }, { k: "'", c: 'Quote', w: 1 }, { k: 'Enter', c: 'Enter', w: 2.2 },
      'sp-4.4', 
      { k: '4', c: 'Numpad4', w: 1 }, { k: '5', c: 'Numpad5', w: 1 }, { k: '6', c: 'Numpad6', w: 1 }
    ],
    // Row 3
    [
      { k: 'Shift', c: 'ShiftLeft', w: 2.3 }, { k: 'Z', c: 'KeyZ', w: 1 }, { k: 'X', c: 'KeyX', w: 1 }, { k: 'C', c: 'KeyC', w: 1 }, { k: 'V', c: 'KeyV', w: 1 }, { k: 'B', c: 'KeyB', w: 1 }, { k: 'N', c: 'KeyN', w: 1 }, { k: 'M', c: 'KeyM', w: 1 }, { k: ',', c: 'Comma', w: 1 }, { k: '.', c: 'Period', w: 1 }, { k: '/', c: 'Slash', w: 1 }, { k: 'Shift', c: 'ShiftRight', w: 2.7 },
      'sp-1.75',
      { k: '⬆️', c: 'ArrowUp', w: 1 },
      'sp-1.70',
      { k: '1', c: 'Numpad1', w: 1 }, { k: '2', c: 'Numpad2', w: 1 }, { k: '3', c: 'Numpad3', w: 1 }, 
      // 跨两行的回车
      { k: 'ENT', c: 'NumpadEnter', w: 1, h: 2 } 
    ],
    // Row 4
    [
      { k: 'Ctrl', c: 'ControlLeft', w: 1.5 }, { k: 'Fn', c: 'FnKey', w: 1 }, { k: 'Win/Cmd', c: 'MetaLeft', w: 1.5 }, { k: 'Alt/Opt', c: 'AltLeft', w: 1.5 }, { k: 'SPACE', c: 'Space', w: 5.5 }, { k: 'Alt/Opt', c: 'AltRight', w: 1.5 }, { k: 'Menu', c: 'ContextMenu', w: 1 }, { k: 'Ctrl', c: 'ControlRight', w: 2 },
      'sp-0.55',
      { k: '⬅️', c: 'ArrowLeft', w: 1 }, { k: '⬇️', c: 'ArrowDown', w: 1 }, { k: '➡️', c: 'ArrowRight', w: 1 },
      'sp-0.6',
      { k: '0', c: 'Numpad0', w: 2.1 }, { k: '.', c: 'NumpadDecimal', w: 1 }
    ]
  ];

  const keys = useMemo(() => {
    const keyElements = [];
    let zOffset = 1;
    const startXOffset = -11.5; 

    rows.forEach((row, rowIndex) => {
      let xOffset = startXOffset;
      row.forEach((item, colIndex) => {
        if (typeof item === 'string' && item.startsWith('sp-')) {
          const spaceWidth = parseFloat(item.split('-')[1]);
          xOffset += spaceWidth;
        } else {
          const height = item.h || 1;
          const zCenterAdjustment = (height - 1) * 1.1 / 2;
          keyElements.push({
            ...item,
            x: xOffset + item.w / 2,
            z: zOffset + zCenterAdjustment, 
            id: `key-${rowIndex}-${colIndex}`,
            code: item.c, 
            h: height 
          });
          xOffset += item.w + 0.1;
        }
      });
      zOffset += 1.1;
    });
    return keyElements;
  }, []);

  return (
    <group position={[-2, 0, -2]}>
      {keys.map((keyData) => (
        <Key3D 
            key={keyData.id} 
            label={keyData.k} 
            width={keyData.w}
            h={keyData.h}
            x={keyData.x} 
            z={keyData.z} 
            active={activeKeys.has(keyData.code)} 
        />
      ))}
    </group>
  );
};


// --- 3. 写实鼠标 (保持不变) ---
const RealisticMouse = ({ mouseButtons, scrollDir }) => {
  const groupRef = useRef();
  const { camera, raycaster, pointer } = useThree();
  const floorPlane = useMemo(() => new THREE.Plane(new THREE.Vector3(0, 1, 0), -0.3), []);
  const intersectPoint = useMemo(() => new THREE.Vector3(), []);

  useFrame(() => {
    if (groupRef.current) {
      raycaster.setFromCamera(pointer, camera);
      raycaster.ray.intersectPlane(floorPlane, intersectPoint);
      if (groupRef.current.parent) groupRef.current.parent.worldToLocal(intersectPoint);
      groupRef.current.position.lerp(intersectPoint, 0.15);
      groupRef.current.position.y = 0.35; 
      const tiltX = pointer.y * 0.15; 
      const tiltZ = -pointer.x * 0.15; 
      groupRef.current.rotation.x = THREE.MathUtils.lerp(groupRef.current.rotation.x, tiltX, 0.1);
      groupRef.current.rotation.z = THREE.MathUtils.lerp(groupRef.current.rotation.z, tiltZ, 0.1);
    }
  });

  const bodyMaterial = new THREE.MeshPhysicalMaterial({ color: THEME.mouseBody, roughness: 0.8, metalness: 0.1, clearcoat: 0 });
  const gripMaterial = new THREE.MeshStandardMaterial({ color: THEME.mouseGrip, roughness: 0.9, metalness: 0.0 });
  const buttonMaterialBase = new THREE.MeshPhysicalMaterial({ color: THEME.mouseBody, roughness: 0.4, metalness: 0.3, clearcoat: 0.3 });

  return (
    <group ref={groupRef} position={[8, 0, 2]} rotation={[0, -Math.PI/16, 0]}> 
      <group position={[0, 0, 0.2]}>
        <Sphere args={[1.1, 32, 32]} position={[0, 0.1, 0.8]} scale={[1, 0.8, 1.5]}>
            <primitive object={bodyMaterial} attach="material" />
        </Sphere>
        <RoundedBox args={[2, 0.8, 2]} radius={0.4} smoothness={8} position={[0, 0, -0.2]} scale={[1, 1, 1.2]}>
             <primitive object={bodyMaterial} attach="material" />
        </RoundedBox>
        <RoundedBox args={[2.1, 0.2, 2.5]} radius={0.1} position={[0, -0.2, 0.5]}>
            <primitive object={gripMaterial} attach="material" />
        </RoundedBox>
      </group>
      <group position={[-0.55, 0.45, -1.2]} rotation={[THREE.MathUtils.degToRad(5), 0, THREE.MathUtils.degToRad(2)]}>
        <RoundedBox args={[0.95, 0.15, 1.6]} radius={0.05} smoothness={4}>
          <meshPhysicalMaterial {...buttonMaterialBase} emissive={mouseButtons.left ? THEME.accentCyan : "#000"} emissiveIntensity={mouseButtons.left ? 0.8 : 0} />
        </RoundedBox>
      </group>
      <group position={[0.55, 0.45, -1.2]} rotation={[THREE.MathUtils.degToRad(5), 0, THREE.MathUtils.degToRad(-2)]}>
        <RoundedBox args={[0.95, 0.15, 1.6]} radius={0.05} smoothness={4}>
           <meshPhysicalMaterial {...buttonMaterialBase} emissive={mouseButtons.right ? THEME.accentCyan : "#000"} emissiveIntensity={mouseButtons.right ? 0.8 : 0} />
        </RoundedBox>
      </group>
      <group position={[0, 0.45, -1.1]} rotation={[Math.PI / 2, 0, 0]}>
        <Cylinder args={[0.18, 0.18, 0.35, 32]}>
          <meshStandardMaterial color={THEME.mouseGrip} roughness={0.9} emissive={scrollDir ? THEME.accentCyan : "#000"} emissiveIntensity={scrollDir ? 2 : 0} />
        </Cylinder>
        <Cylinder args={[0.19, 0.19, 0.1, 32]} position={[0,0,0]}>
             <meshStandardMaterial color="#333" metalness={0.8} roughness={0.2} />
        </Cylinder>
      </group>
      <mesh rotation={[-Math.PI/2, 0, 0]} position={[0, -0.4, 0]}>
        <planeGeometry args={[2.5, 4]} />
        <meshBasicMaterial color={THEME.accentCyan} transparent opacity={0.15} toneMapped={false} />
      </mesh>
    </group>
  )
}

// --- 4. 主场景 (保持不变) ---
const Scene = ({ activeKeys, mouseButtons, scrollDir }) => {
  return (
    <>
      <color attach="background" args={[THEME.bg]} />
      <Suspense fallback={null} />

      <ambientLight intensity={0.3} color={"#556677"} />
      <spotLight position={[-20, 25, 15]} angle={0.3} penumbra={1} intensity={150} color={THEME.accentCyan} castShadow />
      <pointLight position={[25, 10, 5]} intensity={100} color={THEME.accentMagenta} distance={60} />
      <rectAreaLight width={30} height={30} intensity={8} color={"#ffffff"} position={[0, 15, 5]} rotation={[-Math.PI/2, 0,0]} />

      <group rotation={[0.2, 0, 0]} position={[0, -0.8, 0]}>
        <KeyboardLayout activeKeys={activeKeys} />
        <RealisticMouse mouseButtons={mouseButtons} scrollDir={scrollDir} />
      </group>

      <Grid
        position={[0, -2.8, 0]}
        args={[80, 60]} 
        cellSize={1.1}
        cellThickness={1}
        cellColor={THEME.accentCyan}
        sectionSize={5.5}
        sectionThickness={1.5}
        sectionColor={THEME.accentMagenta}
        fadeDistance={45}
        fadeStrength={1.5}
        followCamera
      />
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -2.85, 0]}>
        <planeGeometry args={[150, 150]} />
        <meshStandardMaterial color="#050505" roughness={0.2} metalness={0.9} envMapIntensity={0.3} />
      </mesh>

      <PerspectiveCamera makeDefault position={[0, 16, 24]} fov={50} />
      <OrbitControls
        enablePan={true} 
        maxPolarAngle={Math.PI / 2.1}
        minPolarAngle={Math.PI / 6}
        maxDistance={45} 
        minDistance={10}
        autoRotate={false}
      />

      <EffectComposer disableNormalPass multisampling={4}>
        <Bloom
          luminanceThreshold={0.85}
          mipmapBlur
          intensity={1.2}
          radius={0.4}
          levels={8}
        />
        <ChromaticAberration
          blendFunction={BlendFunction.NORMAL}
          offset={[0.0003, 0.0003]} 
          radialModulation={false}
          modulationOffset={0}
        />
        <Vignette eskil={false} offset={0.2} darkness={0.6} />
      </EffectComposer>
    </>
  );
};

// --- 5. UI 面板组件 (保持不变) ---
const UIOverlay = ({ mousePos, keyHistory, activeKeys }) => {
  return (
    <div style={{
      position: 'absolute', right: 40, top: 40, zIndex: 10, width: '280px',
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
        <div style={{ color: THEME.accentMagenta, marginBottom: '5px', fontSize:'10px' }}>// ACTIVE_INPUTS (RAW CODE)</div>
        <div style={{ minHeight: '30px', display: 'flex', gap: '5px', flexWrap: 'wrap' }}>
          {activeKeys.size > 0 ? Array.from(activeKeys).map(k => (
            <span key={k} style={{
              background: THEME.accentCyan, color: '#000', padding: '2px 8px', borderRadius: '2px', fontWeight: 'bold', boxShadow: `0 0 10px ${THEME.accentCyan}`, fontSize: '12px'
            }}>{k.replace('Key', '').replace('Digit', '')}</span>
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

// --- 6. App 入口 (保持不变) ---
export default function App() {
  const [activeKeys, setActiveKeys] = useState(new Set());
  const [mouseButtons, setMouseButtons] = useState({ left: false, right: false, mid: false });
  const [scrollDir, setScrollDir] = useState(null);
  const [mousePos, setMousePos] = useState({ x: window.innerWidth / 2, y: window.innerHeight / 2 });
  const [keyHistory, setKeyHistory] = useState([]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      // 阻止默认行为（防止 Tab 切走，Alt 激活菜单）
      if (e.code === 'Tab' || e.key === 'Alt') e.preventDefault();
      if (e.repeat) return;
      const code = e.code;
      setActiveKeys((prev) => new Set(prev).add(code));
      setKeyHistory(prev => [code, ...prev].slice(0, 8));
    };
    const handleKeyUp = (e) => {
      const code = e.code;
      setActiveKeys((prev) => { const next = new Set(prev); next.delete(code); return next; });
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
    <div style={{ width: '100%', height: '80vh', background: THEME.bg, overflow: 'hidden' }}>
      <UIOverlay mousePos={mousePos} keyHistory={keyHistory} activeKeys={activeKeys} />
      <Canvas shadows dpr={[1, 2]} gl={{ antialias: false }}>
        <Scene activeKeys={activeKeys} mouseButtons={mouseButtons} scrollDir={scrollDir} />
      </Canvas>
    </div>
  );
}