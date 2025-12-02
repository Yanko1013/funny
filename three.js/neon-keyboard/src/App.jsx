import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Text, RoundedBox, OrbitControls, PerspectiveCamera } from '@react-three/drei';
import { EffectComposer, Bloom } from '@react-three/postprocessing';
import * as THREE from 'three';

// --- 配置项 ---
const COLORS = {
  base: "#1a1a1a",
  active: "#FFFF00",
  neon: "#FFFF00",
  textBase: "#555",
  textActive: "#000"
};

// --- 1. 单个按键组件 ---
const Key3D = ({ label, width = 1, x, z, active }) => {
  const meshRef = useRef();
  // 目标高度：按下时为 -0.15，松开为 0
  const targetY = active ? -0.15 : 0;

  useFrame((state, delta) => {
    if (meshRef.current) {
      // 平滑动画
      meshRef.current.position.y = THREE.MathUtils.lerp(meshRef.current.position.y, targetY, 0.25);
    }
  });

  return (
    <group position={[x, 0, z]}>
      <RoundedBox ref={meshRef} args={[width, 0.8, 0.8]} radius={0.15} smoothness={4}>
        <meshStandardMaterial
          color={active ? COLORS.active : COLORS.base}
          emissive={COLORS.neon}
          emissiveIntensity={active ? 1.5 : 0.1}
          roughness={0.4}
          metalness={0.6}
        />
      </RoundedBox>
      <Text
        position={[0, active ? -0.05 : 0.41, 0]} // 文字随按键下沉
        rotation={[-Math.PI / 2, 0, 0]}
        fontSize={0.25}
        color={active ? COLORS.textActive : COLORS.neon}
        anchorX="center"
        anchorY="middle"
      >
        {label}
      </Text>
    </group>
  );
};

// --- 2. 键盘布局生成器 ---
const KeyboardLayout = ({ activeKeys }) => {
  // 定义键盘行数据
  const rows = [
    [
      { k: '`', w: 1 }, { k: '1', w: 1 }, { k: '2', w: 1 }, { k: '3', w: 1 }, { k: '4', w: 1 }, { k: '5', w: 1 }, 
      { k: '6', w: 1 }, { k: '7', w: 1 }, { k: '8', w: 1 }, { k: '9', w: 1 }, { k: '0', w: 1 }, { k: '-', w: 1 }, { k: '=', w: 1 }, { k: 'BACKSPACE', w: 2 }
    ],
    [
      { k: 'TAB', w: 1.5 }, { k: 'Q', w: 1 }, { k: 'W', w: 1 }, { k: 'E', w: 1 }, { k: 'R', w: 1 }, { k: 'T', w: 1 }, 
      { k: 'Y', w: 1 }, { k: 'U', w: 1 }, { k: 'I', w: 1 }, { k: 'O', w: 1 }, { k: 'P', w: 1 }, { k: '[', w: 1 }, { k: ']', w: 1 }, { k: '\\', w: 1.5 }
    ],
    [
      { k: 'CAPS', w: 1.8 }, { k: 'A', w: 1 }, { k: 'S', w: 1 }, { k: 'D', w: 1 }, { k: 'F', w: 1 }, { k: 'G', w: 1 }, 
      { k: 'H', w: 1 }, { k: 'J', w: 1 }, { k: 'K', w: 1 }, { k: 'L', w: 1 }, { k: ';', w: 1 }, { k: "'", w: 1 }, { k: 'ENTER', w: 2.2 }
    ],
    [
      { k: 'SHIFT', w: 2.3 }, { k: 'Z', w: 1 }, { k: 'X', w: 1 }, { k: 'C', w: 1 }, { k: 'V', w: 1 }, { k: 'B', w: 1 }, 
      { k: 'N', w: 1 }, { k: 'M', w: 1 }, { k: ',', w: 1 }, { k: '.', w: 1 }, { k: '/', w: 1 }, { k: 'SHIFT', w: 2.7 }
    ],
    [
      { k: 'CTRL', w: 1.5 }, { k: 'WIN', w: 1 }, { k: 'ALT', w: 1.5 }, { k: 'SPACE', w: 6 }, 
      { k: 'ALT', w: 1.5 }, { k: 'FN', w: 1 }, { k: 'CTRL', w: 1.5 }
    ]
  ];

  // 自动生成坐标
  const keys = useMemo(() => {
    const keyElements = [];
    let zOffset = 0;
    
    rows.forEach((row, rowIndex) => {
      let xOffset = -7.5; // 起始 X 位置
      
      row.forEach((item) => {
        // 修正按键中心位置
        const currentX = xOffset + item.w / 2;
        keyElements.push({
          ...item,
          x: currentX,
          z: zOffset,
          id: `${rowIndex}-${item.k}` // 唯一ID
        });
        xOffset += item.w + 0.1; // 0.1 是按键间距
      });
      zOffset += 1.1; // 行间距
    });
    return keyElements;
  }, []);

  return (
    <group position={[0, 0, -2]}>
       {keys.map((keyData) => (
         <Key3D
           key={keyData.id}
           label={keyData.k}
           width={keyData.w}
           x={keyData.x}
           z={keyData.z}
           active={activeKeys.has(keyData.k)}
         />
       ))}
    </group>
  );
};

// --- 3. 鼠标 3D 组件 (终极版：射线追踪跟随) ---
const Mouse3D = ({ mouseButtons, scrollDir }) => {
  const groupRef = useRef();
  const { camera, raycaster, pointer } = useThree();
  
  // 定义一个虚拟的水平面 (法向量朝上 y=1, 高度为 0)
  // 这就是鼠标滑动的“桌面”
  const floorPlane = useMemo(() => new THREE.Plane(new THREE.Vector3(0, 1, 0), 0), []);
  const intersectPoint = useMemo(() => new THREE.Vector3(), []);

  useFrame(() => {
     if (groupRef.current) {
        // 1. 从摄像机向鼠标位置发射射线
        raycaster.setFromCamera(pointer, camera);

        // 2. 计算射线与“桌面”的交点
        // 结果会直接存入 intersectPoint 中
        raycaster.ray.intersectPlane(floorPlane, intersectPoint);

        // 3. 坐标系修正 (关键步骤！)
        // 因为 Mouse3D 被放在了一个旋转过的父级 Group 里
        // 我们需要把计算出的“世界坐标”转换成 Group 内部的“局部坐标”
        if (groupRef.current.parent) {
            groupRef.current.parent.worldToLocal(intersectPoint);
        }

        // 4. 更新位置
        // 使用 lerp 0.5 让跟随非常紧手，但保留极其细微的惯性，更有质感
        // 如果想要绝对的一比一同步，把 0.5 改成 1.0
        groupRef.current.position.lerp(intersectPoint, 0.5);
        
        // 5. 稍微修正一下 Z 轴高度，防止模型穿模或者悬空
        // 因为转换后 y 可能会变，强制让它贴在局部坐标的平面上
        groupRef.current.position.y = 0.2; 

        // 6. 简单的倾斜动态效果
        groupRef.current.rotation.y = -pointer.x * 0.3;
        groupRef.current.rotation.z = -pointer.x * 0.1;
     }
  });

  return (
    <group ref={groupRef} position={[6, 0, 2]}> 
      {/* 鼠标主体 */}
      <RoundedBox args={[1.8, 0.5, 3]} radius={0.3} smoothness={4}>
         <meshStandardMaterial color="#111" roughness={0.2} metalness={0.8} />
      </RoundedBox>
      
      {/* 底部发光带 (增加科技感) */}
      <RoundedBox args={[1.9, 0.05, 3.1]} radius={0.3} position={[0, -0.25, 0]}>
         <meshStandardMaterial color="#000" emissive={COLORS.neon} emissiveIntensity={0.8} />
      </RoundedBox>

      {/* 左键 */}
      <RoundedBox args={[0.7, 0.2, 1.2]} position={[-0.45, 0.35, -0.8]}>
         <meshStandardMaterial 
            color={mouseButtons.left ? COLORS.active : "#222"} 
            emissive={COLORS.neon} 
            emissiveIntensity={mouseButtons.left ? 2 : 0} 
         />
      </RoundedBox>
      
      {/* 右键 */}
      <RoundedBox args={[0.7, 0.2, 1.2]} position={[0.45, 0.35, -0.8]}>
         <meshStandardMaterial 
            color={mouseButtons.right ? COLORS.active : "#222"} 
            emissive={COLORS.neon} 
            emissiveIntensity={mouseButtons.right ? 2 : 0} 
         />
      </RoundedBox>

      {/* 滚轮 */}
      <mesh position={[0, 0.35, -0.8]} rotation={[Math.PI/2, 0, 0]}>
         <cylinderGeometry args={[0.15, 0.15, 0.4, 16]} />
         <meshStandardMaterial 
            color={scrollDir ? COLORS.active : "#555"} 
            emissive={COLORS.neon} 
            emissiveIntensity={scrollDir ? 2 : 0}
         />
      </mesh>
    </group>
  )
}

// --- 4. 主场景 ---
const Scene = ({ activeKeys, mouseButtons, scrollDir }) => {
  return (
    <>
      <color attach="background" args={['#050505']} />
      
      {/* 灯光设置 */}
      <ambientLight intensity={0.2} />
      <pointLight position={[0, 10, 5]} intensity={1} color="#ffffff" />
      <pointLight position={[-10, 2, -5]} intensity={1} color={COLORS.neon} distance={20} />
      <pointLight position={[10, 2, 5]} intensity={1} color="#00ffff" distance={20} />

      {/* 键盘区域 - 整体旋转增加透视感 */}
      <group rotation={[0.2, 0, 0]} position={[0, -1, 0]}>
        <KeyboardLayout activeKeys={activeKeys} />
        <Mouse3D mouseButtons={mouseButtons} scrollDir={scrollDir} />
      </group>

      {/* 摄像机 */}
      <PerspectiveCamera makeDefault position={[0, 8, 12]} fov={45} />
      <OrbitControls 
          enablePan={false} 
          enableZoom={false} 
          maxPolarAngle={Math.PI / 2} 
          minPolarAngle={0} 
      />

      {/* 辉光特效 */}
      <EffectComposer disableNormalPass>
        <Bloom luminanceThreshold={0.2} mipmapBlur intensity={1.5} radius={0.5} />
      </EffectComposer>
      
      {/* 地面反射 (可选) */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -2, 0]}>
         <planeGeometry args={[50, 50]} />
         <meshStandardMaterial color="#000" roughness={0.1} metalness={0.8} />
      </mesh>
    </>
  );
};

// --- 5. UI 面板组件 ---
const UIOverlay = ({ mousePos, keyHistory, activeKeys }) => {
    return (
        <div style={{
            position: 'absolute', 
            right: 30, 
            top: 30, 
            zIndex: 10, 
            width: '280px',
            padding: '20px', 
            background: 'rgba(10, 10, 10, 0.85)',
            border: '1px solid rgba(255, 255, 0, 0.3)',
            borderRadius: '12px',
            color: '#FFFF00', 
            fontFamily: "'Courier New', monospace",
            boxShadow: '0 0 20px rgba(255, 255, 0, 0.1)',
            backdropFilter: 'blur(5px)'
        }}>
            <h3 style={{ margin: '0 0 15px 0', borderBottom: '1px solid #333', paddingBottom: '10px' }}>
                INPUT MONITOR
            </h3>
            
            {/* 鼠标数据 */}
            <div style={{ marginBottom: '15px', fontSize: '14px' }}>
                <div style={{ color: '#888', marginBottom: '5px' }}>MOUSE POSITION</div>
                <div>X: {mousePos.x.toFixed(0).padStart(4)} | Y: {mousePos.y.toFixed(0).padStart(4)}</div>
            </div>

            {/* 当前按键 */}
            <div style={{ marginBottom: '15px' }}>
                 <div style={{ color: '#888', marginBottom: '5px' }}>ACTIVE KEYS</div>
                 <div style={{ minHeight: '30px', display: 'flex', gap: '5px', flexWrap: 'wrap' }}>
                    {activeKeys.size > 0 ? Array.from(activeKeys).map(k => (
                        <span key={k} style={{ 
                            background: '#FFFF00', color: 'black', padding: '2px 6px', borderRadius: '4px', fontWeight: 'bold' 
                        }}>{k}</span>
                    )) : <span style={{ color: '#444' }}>Waiting...</span>}
                 </div>
            </div>

            {/* 历史记录 */}
            <div>
                <div style={{ color: '#888', marginBottom: '5px' }}>HISTORY</div>
                <div style={{ display: 'flex', flexDirection: 'column-reverse', gap: '4px', color: 'rgba(255,255,0,0.7)' }}>
                    {keyHistory.map((k, i) => (
                        <div key={i} style={{ fontSize: '12px', opacity: 1 - i * 0.15 }}>
                           {`> ${k}`}
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

  // 辅助函数：按键映射 (解决特殊键名问题)
  const mapKey = (code, key) => {
      const specialized = {
          'Space': 'SPACE',
          'ControlLeft': 'CTRL', 'ControlRight': 'CTRL',
          'ShiftLeft': 'SHIFT', 'ShiftRight': 'SHIFT',
          'AltLeft': 'ALT', 'AltRight': 'ALT',
          'Enter': 'ENTER',
          'Backspace': 'BACKSPACE',
          'Tab': 'TAB',
          'CapsLock': 'CAPS',
          'MetaLeft': 'WIN',
          'MetaRight': 'WIN'
      };
      // 如果在特殊表中，返回特殊名；否则返回大写的字符
      return specialized[code] || (key.length === 1 ? key.toUpperCase() : null);
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      const mappedKey = mapKey(e.code, e.key);
      if (!mappedKey) return;

      setActiveKeys((prev) => {
          const newSet = new Set(prev);
          newSet.add(mappedKey);
          return newSet;
      });

      // 更新历史记录 (去重连续按压)
      setKeyHistory(prev => {
          const newHistory = [mappedKey, ...prev];
          return newHistory.slice(0, 8); // 只保留最近8个
      });
    };

    const handleKeyUp = (e) => {
      const mappedKey = mapKey(e.code, e.key);
      if (mappedKey) {
        setActiveKeys((prev) => {
          const next = new Set(prev);
          next.delete(mappedKey);
          return next;
        });
      }
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

    const handleMouseMove = (e) => {
        setMousePos({ x: e.clientX, y: e.clientY });
    }

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('wheel', handleWheel);
    window.addEventListener('mousemove', handleMouseMove);
    // 屏蔽右键菜单，提升体验
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
    <div style={{ width: '100vw', height: '100vh', background: 'black', overflow: 'hidden' }}>
      
      {/* 独立的 UI 层 */}
      <UIOverlay mousePos={mousePos} keyHistory={keyHistory} activeKeys={activeKeys} />

      {/* 3D 场景层 */}
      <Canvas shadows dpr={[1, 2]}>
        <Scene activeKeys={activeKeys} mouseButtons={mouseButtons} scrollDir={scrollDir} />
      </Canvas>
    </div>
  );
}