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
  keyActive: "#008888", 
  keyTextBase: "#88CCCC", 
  keyTextActive: "#FFFFFF", 
  accentMagenta: "#FF00FF", 
  accentCyan: "#00FFFF", 
  // 新增鼠标材质颜色
  mouseBody: "#1A1A1A",
  mouseGrip: "#0A0A0A",
};

// --- 1. 单个按键组件 (保持上一个版本状态) ---
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
          emissiveIntensity={active ? 1.5 : 0}
          roughness={0.3} // 稍微粗糙一点，像PBT材质
          metalness={0.8}
          reflectivity={0.5}
          clearcoat={0.2}
        />
      </RoundedBox>

      <Text
        position={[0, active ? 0.27 : 0.41, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
        fontSize={0.3}
        font="/fonts/OPPOSans-Regular.ttf"
        color={active ? THEME.keyTextActive : THEME.keyTextBase}
        anchorX="center"
        anchorY="middle"
        material-toneMapped={false} 
      >
        {label}
      </Text>
    </group>
  );
};

// =====================================================================
// --- [重大修改] 2. 全尺寸键盘布局生成器 ---
// =====================================================================
const KeyboardLayout = ({ activeKeys }) => {
  // 使用字符串 'sp-X' 来表示空隙 (Space)，X 是空隙宽度
  const rows = [
    // Row 0
    [
      { k: '`', w: 1 }, { k: '1', w: 1 }, { k: '2', w: 1 }, { k: '3', w: 1 }, { k: '4', w: 1 }, { k: '5', w: 1 }, { k: '6', w: 1 }, { k: '7', w: 1 }, { k: '8', w: 1 }, { k: '9', w: 1 }, { k: '0', w: 1 }, { k: '-', w: 1 }, { k: '=', w: 1 }, { k: 'BACKSPACE', w: 2 },
      'sp-0.5', // 功能键区空隙
      { k: 'INS', w: 1 }, { k: 'HOME', w: 1 }, { k: 'PGUP', w: 1 },
      'sp-0.5', // 数字区空隙
      { k: 'NUM', w: 1 }, { k: '/', w: 1 }, { k: '*', w: 1 }, { k: '-', w: 1 }
    ],
    // Row 1
    [
      { k: 'TAB', w: 1.5 }, { k: 'Q', w: 1 }, { k: 'W', w: 1 }, { k: 'E', w: 1 }, { k: 'R', w: 1 }, { k: 'T', w: 1 }, { k: 'Y', w: 1 }, { k: 'U', w: 1 }, { k: 'I', w: 1 }, { k: 'O', w: 1 }, { k: 'P', w: 1 }, { k: '[', w: 1 }, { k: ']', w: 1 }, { k: '\\', w: 1.5 },
      'sp-0.5',
      { k: 'DEL', w: 1 }, { k: 'END', w: 1 }, { k: 'PGDN', w: 1 },
      'sp-0.5',
      { k: '7', w: 1 }, { k: '8', w: 1 }, { k: '9', w: 1 }, { k: '+', w: 1 } // 注：简化处理，不跨行
    ],
    // Row 2
    [
      { k: 'CAPS', w: 1.8 }, { k: 'A', w: 1 }, { k: 'S', w: 1 }, { k: 'D', w: 1 }, { k: 'F', w: 1 }, { k: 'G', w: 1 }, { k: 'H', w: 1 }, { k: 'J', w: 1 }, { k: 'K', w: 1 }, { k: 'L', w: 1 }, { k: ';', w: 1 }, { k: "'", w: 1 }, { k: 'ENTER', w: 2.2 },
      'sp-4.4', // 跳过功能键区下方
      { k: '4', w: 1 }, { k: '5', w: 1 }, { k: '6', w: 1 }, { k: '+', w: 1 } // 简化的重复+号
    ],
    // Row 3
    [
      { k: 'SHIFT', w: 2.3 }, { k: 'Z', w: 1 }, { k: 'X', w: 1 }, { k: 'C', w: 1 }, { k: 'V', w: 1 }, { k: 'B', w: 1 }, { k: 'N', w: 1 }, { k: 'M', w: 1 }, { k: ',', w: 1 }, { k: '.', w: 1 }, { k: '/', w: 1 }, { k: 'SHIFT', w: 2.7 },
      'sp-1.2',
      { k: '↑', w: 1 },
      'sp-2.2',
      { k: '1', w: 1 }, { k: '2', w: 1 }, { k: '3', w: 1 }, { k: 'ENT', w: 1 } // 简化的数字区回车
    ],
    // Row 4
    [
      { k: 'CTRL', w: 1.5 }, { k: 'WIN', w: 1 }, { k: 'ALT', w: 1.5 }, { k: 'SPACE', w: 6 }, { k: 'ALT', w: 1.5 }, { k: 'FN', w: 1 }, { k: 'MENU', w: 1 }, { k: 'CTRL', w: 1.5 },
      'sp-0.5',
      { k: '←', w: 1 }, { k: '↓', w: 1 }, { k: '→', w: 1 },
      'sp-1.1',
      { k: '0', w: 2.1 }, { k: '.', w: 1 }, { k: 'ENT', w: 1 }
    ]
  ];

  const keys = useMemo(() => {
    const keyElements = [];
    let zOffset = 0;
    // 计算整体宽度偏移，让主键盘大致居中
    const startXOffset = -11.5; 

    rows.forEach((row, rowIndex) => {
      let xOffset = startXOffset;
      row.forEach((item, colIndex) => {
        // 如果是字符串，说明是空隙
        if (typeof item === 'string' && item.startsWith('sp-')) {
          const spaceWidth = parseFloat(item.split('-')[1]);
          xOffset += spaceWidth;
        } 
        // 否则是按键对象
        else {
          keyElements.push({
            ...item,
            x: xOffset + item.w / 2,
            z: zOffset,
            // 使用更唯一的 ID 防止冲突
            id: `r${rowIndex}-c${colIndex}-${item.k.replace(/[^a-zA-Z0-9]/g, '')}`
          });
          // 按键本身宽度 + 键间距(0.1)
          xOffset += item.w + 0.1;
        }
      });
      zOffset += 1.1;
    });
    return keyElements;
  }, []);

  // 辅助函数：处理特殊键名映射 (例如把 Numpad1 映射为 1)
  const isActive = (keyLabel) => {
    // 这里可以添加更复杂的映射逻辑，目前简单处理
    // 比如数字小键盘的 '1' 和主键盘的 '1' 可能会被视为同一个
    return activeKeys.has(keyLabel);
  }

  return (
    // 整体向左平移一点，因为键盘变宽了
    <group position={[-2, 0, -2]}>
      {keys.map((keyData) => (
        <Key3D key={keyData.id} label={keyData.k} width={keyData.w} x={keyData.x} z={keyData.z} active={isActive(keyData.k)} />
      ))}
    </group>
  );
};


// =====================================================================
// --- [重大修改] 3. 写实鼠标 3D 组件 ---
// =====================================================================
const RealisticMouse = ({ mouseButtons, scrollDir }) => {
  const groupRef = useRef();
  const { camera, raycaster, pointer } = useThree();
  // 提升交互平面的高度，让鼠标悬浮在键盘上方
  const floorPlane = useMemo(() => new THREE.Plane(new THREE.Vector3(0, 1, 0), -0.3), []);
  const intersectPoint = useMemo(() => new THREE.Vector3(), []);

  useFrame(() => {
    if (groupRef.current) {
      raycaster.setFromCamera(pointer, camera);
      raycaster.ray.intersectPlane(floorPlane, intersectPoint);
      if (groupRef.current.parent) groupRef.current.parent.worldToLocal(intersectPoint);
      
      // 滞后跟随
      groupRef.current.position.lerp(intersectPoint, 0.15);
      // 固定悬浮高度
      groupRef.current.position.y = 0.35; 
      
      // 动态倾斜效果
      const tiltX = pointer.y * 0.15; // 前后倾斜
      const tiltZ = -pointer.x * 0.15; // 左右倾斜
      groupRef.current.rotation.x = THREE.MathUtils.lerp(groupRef.current.rotation.x, tiltX, 0.1);
      groupRef.current.rotation.z = THREE.MathUtils.lerp(groupRef.current.rotation.z, tiltZ, 0.1);
    }
  });

  // --- 材质定义 ---
  // 主体材质：磨砂黑，低反光
  const bodyMaterial = new THREE.MeshPhysicalMaterial({
    color: THEME.mouseBody,
    roughness: 0.8,
    metalness: 0.1,
    clearcoat: 0,
  });
  // 侧裙/滚轮材质：深色橡胶感
  const gripMaterial = new THREE.MeshStandardMaterial({
    color: THEME.mouseGrip,
    roughness: 0.9,
    metalness: 0.0,
  });
  // 按键材质：稍微光滑一点
  const buttonMaterialBase = new THREE.MeshPhysicalMaterial({
    color: THEME.mouseBody,
    roughness: 0.4,
    metalness: 0.3,
    clearcoat: 0.3,
  });

  return (
    // 初始位置放在数字区旁边
    <group ref={groupRef} position={[8, 0, 2]} rotation={[0, -Math.PI/16, 0]}> {/*稍微旋转一点角度更自然*/}
      
      {/* === 1. 鼠标主体 (符合人体工学的造型) === */}
      <group position={[0, 0, 0.2]}>
        {/* 后部掌托：一个拉伸变形的球体，营造隆起感 */}
        <Sphere args={[1.1, 32, 32]} position={[0, 0.1, 0.8]} scale={[1, 0.8, 1.5]}>
            <primitive object={bodyMaterial} attach="material" />
        </Sphere>
        
        {/* 前部主体：连接按键和掌托 */}
        <RoundedBox args={[2, 0.8, 2]} radius={0.4} smoothness={8} position={[0, 0, -0.2]} scale={[1, 1, 1.2]}>
             <primitive object={bodyMaterial} attach="material" />
        </RoundedBox>

        {/* 侧裙防滑细节 (可选) */}
        <RoundedBox args={[2.1, 0.2, 2.5]} radius={0.1} position={[0, -0.2, 0.5]}>
            <primitive object={gripMaterial} attach="material" />
        </RoundedBox>
      </group>

      {/* === 2. 独立按键 (贴合主体曲线) === */}
      {/* 左键 */}
      <group position={[-0.55, 0.45, -1.2]} rotation={[THREE.MathUtils.degToRad(5), 0, THREE.MathUtils.degToRad(2)]}>
        <RoundedBox args={[0.95, 0.15, 1.6]} radius={0.05} smoothness={4}>
          <meshPhysicalMaterial
            {...buttonMaterialBase}
            // 点击时发光
            emissive={mouseButtons.left ? THEME.accentCyan : "#000"}
            emissiveIntensity={mouseButtons.left ? 0.8 : 0}
          />
        </RoundedBox>
      </group>

      {/* 右键 */}
      <group position={[0.55, 0.45, -1.2]} rotation={[THREE.MathUtils.degToRad(5), 0, THREE.MathUtils.degToRad(-2)]}>
        <RoundedBox args={[0.95, 0.15, 1.6]} radius={0.05} smoothness={4}>
           <meshPhysicalMaterial
            {...buttonMaterialBase}
            emissive={mouseButtons.right ? THEME.accentCyan : "#000"}
            emissiveIntensity={mouseButtons.right ? 0.8 : 0}
          />
        </RoundedBox>
      </group>

      {/* === 3. 滚轮 (更精细) === */}
      <group position={[0, 0.45, -1.1]} rotation={[Math.PI / 2, 0, 0]}>
        {/* 滚轮主体 */}
        <Cylinder args={[0.18, 0.18, 0.35, 32]}>
          <meshStandardMaterial
            color={THEME.mouseGrip}
            roughness={0.9}
            // 滚动时发光
            emissive={scrollDir ? THEME.accentCyan : "#000"}
            emissiveIntensity={scrollDir ? 2 : 0}
          />
        </Cylinder>
        {/* 滚轮中间的装饰环 */}
        <Cylinder args={[0.19, 0.19, 0.1, 32]} position={[0,0,0]}>
             <meshStandardMaterial color="#333" metalness={0.8} roughness={0.2} />
        </Cylinder>
      </group>

      {/* 底部装饰光 (可选) */}
      <mesh rotation={[-Math.PI/2, 0, 0]} position={[0, -0.4, 0]}>
        <planeGeometry args={[2.5, 4]} />
        <meshBasicMaterial color={THEME.accentCyan} transparent opacity={0.15} toneMapped={false} />
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

      {/* 灯光调整：增加侧面光以强调新鼠标的轮廓 */}
      <ambientLight intensity={0.3} color={"#556677"} />
      <spotLight position={[-20, 25, 15]} angle={0.3} penumbra={1} intensity={150} color={THEME.accentCyan} castShadow />
      <pointLight position={[25, 10, 5]} intensity={100} color={THEME.accentMagenta} distance={60} />
      <rectAreaLight width={30} height={30} intensity={8} color={"#ffffff"} position={[0, 15, 5]} rotation={[-Math.PI/2, 0,0]} />

      <group rotation={[0.2, 0, 0]} position={[0, -0.8, 0]}>
        {/* 使用新的全尺寸键盘 */}
        <KeyboardLayout activeKeys={activeKeys} />
        {/* 使用新的写实鼠标 */}
        <RealisticMouse mouseButtons={mouseButtons} scrollDir={scrollDir} />
      </group>

      {/* 地板和网格相应扩大 */}
      <Grid
        position={[0, -2.8, 0]}
        args={[80, 60]} // 扩大尺寸
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

      {/* 相机调整：拉远距离以容纳更大的场景 */}
      <PerspectiveCamera makeDefault position={[0, 16, 24]} fov={50} />
      <OrbitControls
        enablePan={true} // 允许平移以便查看键盘两侧
        maxPolarAngle={Math.PI / 2.1}
        minPolarAngle={Math.PI / 6}
        maxDistance={45} // 增加最大缩放距离
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

// --- 6. App 入口 (新增了数字小键盘的映射) ---
export default function App() {
  const [activeKeys, setActiveKeys] = useState(new Set());
  const [mouseButtons, setMouseButtons] = useState({ left: false, right: false, mid: false });
  const [scrollDir, setScrollDir] = useState(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [keyHistory, setKeyHistory] = useState([]);

  const mapKey = (code, key) => {
    // [修改] 增加数字键盘和方向键的映射
    const specialized = {
      'Space': 'SPACE', 'ControlLeft': 'CTRL', 'ControlRight': 'CTRL',
      'ShiftLeft': 'SHIFT', 'ShiftRight': 'SHIFT', 'AltLeft': 'ALT', 'AltRight': 'ALT',
      'Enter': 'ENTER', 'Backspace': 'BACKSPACE', 'Tab': 'TAB',
      'CapsLock': 'CAPS', 'MetaLeft': 'WIN', 'MetaRight': 'WIN',
      'Escape': 'ESC',
      // 方向键
      'ArrowUp': '↑', 'ArrowDown': '↓', 'ArrowLeft': '←', 'ArrowRight': '→',
      // 功能键
      'Insert': 'INS', 'Delete': 'DEL', 'Home': 'HOME', 'End': 'END', 'PageUp': 'PGUP', 'PageDown': 'PGDN',
      // 数字小键盘
      'Numpad0': '0', 'Numpad1': '1', 'Numpad2': '2', 'Numpad3': '3', 'Numpad4': '4',
      'Numpad5': '5', 'Numpad6': '6', 'Numpad7': '7', 'Numpad8': '8', 'Numpad9': '9',
      'NumpadAdd': '+', 'NumpadSubtract': '-', 'NumpadMultiply': '*', 'NumpadDivide': '/',
      'NumpadEnter': 'ENT', 'NumpadDecimal': '.', 'NumLock': 'NUM'
    };
    // 对于普通字符，取大写；对于特殊键，取映射值
    return specialized[code] || (key.length === 1 ? key.toUpperCase() : null);
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      // 阻止 Tab 和 Alt 的默认行为，防止焦点切走
      if (e.code === 'Tab' || e.key === 'Alt') e.preventDefault();
      
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
    // 阻止右键菜单
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
      <Canvas shadows dpr={[1, 2]} gl={{ antialias: false }}>
        <Scene activeKeys={activeKeys} mouseButtons={mouseButtons} scrollDir={scrollDir} />
      </Canvas>
    </div>
  );
}