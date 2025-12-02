import React, { useState, useEffect, useRef, useMemo, Suspense } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Text, RoundedBox, OrbitControls, PerspectiveCamera, Grid, Environment } from '@react-three/drei';
import { EffectComposer, Bloom, ChromaticAberration, Vignette } from '@react-three/postprocessing';
import { BlendFunction } from 'postprocessing';
import * as THREE from 'three';

// --- 0. 黑暗电竞风格配置 ---
const GAMING_THEME = {
  bg: "#020202",           // 几乎纯黑的背景
  keyCapBody: "#050505",   // 键帽本体：极黑磨砂
  roughness: 0.4,          // 增加粗糙度，减少非必要的反光
  metalness: 0.5,          // 降低金属感，让它更像高档塑料
};

// --- 1. 单个按键组件 (亮度调优) ---
const Key3D = ({ label, width = 1, x, z, active }) => {
  const meshRef = useRef();
  const materialRef = useRef();
  const textRef = useRef();
  const targetY = active ? -0.15 : 0;
  const tempColor = useMemo(() => new THREE.Color(), []);

  useFrame((state) => {
    if (!meshRef.current || !materialRef.current) return;

    // 1. 物理动画
    meshRef.current.position.y = THREE.MathUtils.lerp(meshRef.current.position.y, targetY, 0.3);

    // 2. RGB 颜色计算
    const time = state.clock.getElapsedTime();
    const hue = ((x * 0.1) + (z * 0.2) + (time * 0.3)) % 1; // 稍微减慢流速 0.5 -> 0.3

    // 3. 亮度逻辑控制
    if (active) {
        // 按下瞬间：依然保持高亮白光，形成强反馈
        materialRef.current.emissive.setHex(0xFFFFFF);
        materialRef.current.emissiveIntensity = 2.0; // 稍微降低一点 (之前是 5)
    } else {
        // 常态：幽暗的 RGB 流光
        tempColor.setHSL(hue, 1, 0.5);
        materialRef.current.emissive.copy(tempColor);
        // 【关键】平时亮度降到 0.5 (之前是 1.2)，看起来更像内部 LED
        materialRef.current.emissiveIntensity = 0.5; 
        
        if(textRef.current) textRef.current.color = "white";
    }
  });

  return (
    <group position={[x, 0, z]}>
      <RoundedBox ref={meshRef} args={[width, 0.8, 0.8]} radius={0.12} smoothness={4}>
        <meshStandardMaterial
          ref={materialRef}
          color={GAMING_THEME.keyCapBody}
          roughness={GAMING_THEME.roughness}
          metalness={GAMING_THEME.metalness}
          emissive="#000000" 
        />
      </RoundedBox>
      <Text
        ref={textRef}
        position={[0, active ? -0.04 : 0.41, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
        fontSize={0.25}
        font="/fonts/OPPOSans-Regular.ttf"
        anchorX="center"
        anchorY="middle"
      >
        {label}
      </Text>
      {/* 底部光晕减弱，只在根部隐约可见 */}
      <mesh rotation={[-Math.PI/2, 0, 0]} position={[0, -0.38, 0]}>
          <planeGeometry args={[width * 0.85, 0.85]} />
          <meshBasicMaterial color="#ffffff" transparent opacity={0.05} blending={THREE.AdditiveBlending} />
      </mesh>
    </group>
  );
};

// --- 2. 键盘布局 (保持不变) ---
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
        keyElements.push({ ...item, x: xOffset + item.w / 2, z: zOffset, id: `${rowIndex}-${colIndex}-${item.k}` });
        xOffset += item.w + 0.1;
      });
      zOffset += 1.1;
    });
    return keyElements;
  }, []);
  return <group position={[0, 0, -2]}>{keys.map((keyData) => (<Key3D key={keyData.id} label={keyData.k} width={keyData.w} x={keyData.x} z={keyData.z} active={activeKeys.has(keyData.k)} />))}</group>;
};

// --- 3. 鼠标 3D 组件 (同步亮度) ---
// --- 3. 鼠标 3D 组件 (修复报错版) ---
const Mouse3D = ({ mouseButtons, scrollDir }) => {
  const groupRef = useRef();
  const lightStripRef = useRef();
  const { camera, raycaster, pointer } = useThree();
  const floorPlane = useMemo(() => new THREE.Plane(new THREE.Vector3(0, 1, 0), -0.2), []);
  const intersectPoint = useMemo(() => new THREE.Vector3(), []);
  const tempColor = useMemo(() => new THREE.Color(), []);

  useFrame((state) => {
     if (groupRef.current) {
        raycaster.setFromCamera(pointer, camera);
        raycaster.ray.intersectPlane(floorPlane, intersectPoint);
        if (groupRef.current.parent) groupRef.current.parent.worldToLocal(intersectPoint);
        groupRef.current.position.lerp(intersectPoint, 0.15);
        groupRef.current.position.y = 0.25; 
        groupRef.current.rotation.z = THREE.MathUtils.lerp(groupRef.current.rotation.z, -pointer.x * 0.3, 0.1);
        
        const time = state.clock.getElapsedTime();
        const hue = (time * 0.2) % 1;
        tempColor.setHSL(hue, 1, 0.5);
        
        // ✅ 修复点在这里：加上 .material
        if (lightStripRef.current) {
            // 之前的写法：lightStripRef.current.emissive.copy... (报错，因为 ref 是 Mesh)
            // 现在的写法：lightStripRef.current.material.emissive.copy... (正确)
            lightStripRef.current.material.emissive.copy(tempColor);
        }
     }
  });

  // 为了性能，最好用 useMemo 缓存材质，防止每帧重建
  const bodyMat = useMemo(() => new THREE.MeshStandardMaterial({ color: "#080808", roughness: 0.4, metalness: 0.5 }), []);
  const lightMat = useMemo(() => new THREE.MeshStandardMaterial({ color: "#000", emissiveIntensity: 0.8 }), []);

  return (
    <group ref={groupRef} position={[6, 0, 2]}> 
      <RoundedBox args={[1.8, 0.5, 3]} radius={0.3} smoothness={8} material={bodyMat} />
      {/* ref 绑在 Mesh 上 */}
      <RoundedBox ref={lightStripRef} args={[1.9, 0.05, 3.1]} radius={0.3} position={[0, -0.26, 0]} material={lightMat} />
      <RoundedBox args={[0.7, 0.2, 1.2]} position={[-0.45, 0.35, -0.8]} radius={0.1} smoothness={4}><meshStandardMaterial color={mouseButtons.left ? "#fff" : "#111"} emissive={mouseButtons.left ? "#fff" : "#000"} emissiveIntensity={mouseButtons.left ? 1.5 : 0} roughness={0.4} metalness={0.5} /></RoundedBox>
      <RoundedBox args={[0.7, 0.2, 1.2]} position={[0.45, 0.35, -0.8]} radius={0.1} smoothness={4}><meshStandardMaterial color={mouseButtons.right ? "#fff" : "#111"} emissive={mouseButtons.right ? "#fff" : "#000"} emissiveIntensity={mouseButtons.right ? 1.5 : 0} roughness={0.4} metalness={0.5} /></RoundedBox>
      <mesh position={[0, 0.35, -0.8]} rotation={[Math.PI/2, 0, 0]}><cylinderGeometry args={[0.15, 0.15, 0.4, 32]} /><meshStandardMaterial color={scrollDir ? "#fff" : "#222"} emissive={scrollDir ? "#fff" : "#000"} emissiveIntensity={1.5} /></mesh>
    </group>
  )
}

// --- 4. 主场景 (压暗环境) ---
const Scene = ({ activeKeys, mouseButtons, scrollDir }) => {
  return (
    <>
      <color attach="background" args={[GAMING_THEME.bg]} />
      
      {/* 1. 环境光：大幅降低，只保留微弱轮廓 */}
      <ambientLight intensity={0.2} color="#222233" />
      
      {/* 2. 屏幕反光：降低强度，减少键盘表面的“白雾感” */}
      <rectAreaLight width={15} height={10} intensity={1.0} color="#6699ff" position={[0, 5, -5]} rotation={[-Math.PI/4, 0, 0]} />

      <group rotation={[0.25, 0, 0]} position={[0, -0.5, 0]}>
        <KeyboardLayout activeKeys={activeKeys} />
        <Mouse3D mouseButtons={mouseButtons} scrollDir={scrollDir} />
      </group>

      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -2.5, 0]}>
         <planeGeometry args={[100, 100]} />
         <meshStandardMaterial 
            color="#000000" 
            roughness={0.1} 
            metalness={0.5} 
         />
      </mesh>

      <PerspectiveCamera makeDefault position={[0, 14, 20]} fov={50} />
      <OrbitControls enablePan={false} maxPolarAngle={Math.PI / 2.2} minPolarAngle={Math.PI / 6} maxDistance={35} minDistance={10} />

      {/* 3. 后期处理：提高阈值，只有真正的光源才发光 */}
      <EffectComposer disableNormalPass multisampling={4}>
        <Bloom 
            luminanceThreshold={0.5} // 【关键】阈值提高，黑色部分不再泛光
            mipmapBlur 
            intensity={1.0} // 辉光强度减弱
            radius={0.6} 
        />
        <Vignette eskil={false} offset={0.1} darkness={1.1} />
      </EffectComposer>
    </>
  );
};

// --- 5. UI 面板 ---
const UIOverlay = ({ mousePos, keyHistory, activeKeys }) => {
    return (
        <div style={{
            position: 'absolute', right: 30, top: 30, zIndex: 10, width: '280px',
            padding: '20px', 
            background: 'linear-gradient(135deg, rgba(10,10,10,0.9) 0%, rgba(5,5,8,0.9) 100%)', // 背景更黑
            borderLeft: '4px solid #00ff88', 
            borderRadius: '4px',
            color: '#ccc', // 文字变暗一点，不刺眼
            fontFamily: "'Segoe UI', sans-serif",
            boxShadow: '0 10px 30px rgba(0,0,0,0.8)',
            backdropFilter: 'blur(5px)'
        }}>
            <h3 style={{ margin: '0 0 15px 0', borderBottom: '1px solid #333', paddingBottom: '10px', fontSize: '18px', display:'flex', justifyContent:'space-between', color:'#fff' }}>
                <span>GAMING OSD</span>
                <span style={{color:'#00ff88', fontSize:'12px', alignSelf:'center'}}>● LIVE</span>
            </h3>
            <div style={{ marginBottom: '20px' }}>
                <div style={{ color: '#666', fontSize:'12px', marginBottom: '4px' }}>MOUSE SENSOR</div>
                <div style={{ fontFamily:'monospace', fontSize:'16px', color:'#00ff88' }}>
                    X: {mousePos.x.toFixed(0)} <span style={{color:'#444'}}>|</span> Y: {mousePos.y.toFixed(0)}
                </div>
            </div>
            <div style={{ marginBottom: '20px' }}>
                 <div style={{ color: '#666', fontSize:'12px', marginBottom: '4px' }}>INPUT BUFFER</div>
                 <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap' }}>
                    {activeKeys.size > 0 ? Array.from(activeKeys).map(k => (
                        <span key={k} style={{ 
                            background: '#333', color: '#fff', border:'1px solid #555', padding: '2px 8px', borderRadius: '2px', fontWeight: 'bold', boxShadow: '0 0 5px rgba(255,255,255,0.2)'
                        }}>{k}</span>
                    )) : <span style={{ color: '#444', fontStyle:'italic' }}>Waiting...</span>}
                 </div>
            </div>
            <div>
                <div style={{ color: '#666', fontSize:'12px', marginBottom: '4px' }}>LOGS</div>
                <div style={{ display: 'flex', flexDirection: 'column-reverse', gap: '4px', maxHeight:'100px', overflow:'hidden' }}>
                    {keyHistory.map((k, i) => (
                        <div key={i} style={{ fontSize: '13px', opacity: 1 - i * 0.15, display:'flex', alignItems:'center' }}>
                           <span style={{width:'6px', height:'6px', background: i===0?'#00ff88':'#444', borderRadius:'50%', marginRight:'8px'}}></span>
                           {k}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}

// --- 6. App ---
export default function App() {
  const [activeKeys, setActiveKeys] = useState(new Set());
  const [mouseButtons, setMouseButtons] = useState({ left: false, right: false, mid: false });
  const [scrollDir, setScrollDir] = useState(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [keyHistory, setKeyHistory] = useState([]);

  const mapKey = (code, key) => {
      const specialized = { 'Space': 'SPACE', 'ControlLeft': 'CTRL', 'ControlRight': 'CTRL', 'ShiftLeft': 'SHIFT', 'ShiftRight': 'SHIFT', 'AltLeft': 'ALT', 'AltRight': 'ALT', 'Enter': 'ENTER', 'Backspace': 'BACKSPACE', 'Tab': 'TAB', 'CapsLock': 'CAPS', 'MetaLeft': 'WIN', 'MetaRight': 'WIN' };
      return specialized[code] || (key.length === 1 ? key.toUpperCase() : null);
  };

  useEffect(() => {
    const handleKeyDown = (e) => { const mappedKey = mapKey(e.code, e.key); if (!mappedKey) return; setActiveKeys((prev) => new Set(prev).add(mappedKey)); setKeyHistory(prev => [mappedKey, ...prev].slice(0, 8)); };
    const handleKeyUp = (e) => { const mappedKey = mapKey(e.code, e.key); if (mappedKey) setActiveKeys((prev) => { const next = new Set(prev); next.delete(mappedKey); return next; }); };
    const handleMouseDown = (e) => { if(e.button === 0) setMouseButtons(p => ({...p, left: true})); if(e.button === 1) setMouseButtons(p => ({...p, mid: true})); if(e.button === 2) setMouseButtons(p => ({...p, right: true})); }
    const handleMouseUp = (e) => { if(e.button === 0) setMouseButtons(p => ({...p, left: false})); if(e.button === 1) setMouseButtons(p => ({...p, mid: false})); if(e.button === 2) setMouseButtons(p => ({...p, right: false})); }
    const handleWheel = (e) => { setScrollDir(e.deltaY > 0 ? 'down' : 'up'); setTimeout(() => setScrollDir(null), 150); }
    const handleMouseMove = (e) => setMousePos({ x: e.clientX, y: e.clientY });

    window.addEventListener('keydown', handleKeyDown); window.addEventListener('keyup', handleKeyUp); window.addEventListener('mousedown', handleMouseDown); window.addEventListener('mouseup', handleMouseUp); window.addEventListener('wheel', handleWheel); window.addEventListener('mousemove', handleMouseMove); window.addEventListener('contextmenu', e => e.preventDefault());
    return () => { window.removeEventListener('keydown', handleKeyDown); window.removeEventListener('keyup', handleKeyUp); window.removeEventListener('mousedown', handleMouseDown); window.removeEventListener('mouseup', handleMouseUp); window.removeEventListener('wheel', handleWheel); window.removeEventListener('mousemove', handleMouseMove); window.removeEventListener('contextmenu', e => e.preventDefault()); };
  }, []);

  return (
    <div style={{ width: '100vw', height: '100vh', background: GAMING_THEME.bg, overflow: 'hidden' }}>
      <UIOverlay mousePos={mousePos} keyHistory={keyHistory} activeKeys={activeKeys} />
      <Canvas shadows dpr={[1, 2]} gl={{ antialias: false }}>
        <Scene activeKeys={activeKeys} mouseButtons={mouseButtons} scrollDir={scrollDir} />
      </Canvas>
    </div>
  );
}