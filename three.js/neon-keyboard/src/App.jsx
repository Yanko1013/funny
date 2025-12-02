import React, { useState, useEffect, useRef, useMemo } from 'react';

import { Canvas, useFrame, useThree } from '@react-three/fiber';

import { Text, RoundedBox, OrbitControls, PerspectiveCamera, Grid, Environment } from '@react-three/drei';

import { EffectComposer, Bloom, ChromaticAberration, Vignette } from '@react-three/postprocessing';

import { BlendFunction } from 'postprocessing';

import * as THREE from 'three';

import { Suspense } from 'react';

import { Lightformer } from '@react-three/drei';

// --- 新版赛博朋克配置项 ---

const THEME = {

bg: "#000509", // 极深蓝黑色背景

keyBase: "#111111", // 按键基础色：深黑金属

keyActive: "#00FFFF", // 按键激活色：耀眼青色

keyTextBase: "#005555", // 文字基础色：暗青色

keyTextActive: "#FFFFFF", // 文字激活色：白炽色

accentMagenta: "#FF00FF", // 洋红色强调光

accentCyan: "#00FFFF", // 青色强调光

};



// --- 1. 单个按键组件 (材质升级) ---

// --- 1. 单个按键组件 (修复字体加载问题) ---

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


{/* 核心修改：显式指定 font 属性，使用 Roboto 字体在线地址，避免去请求 jsdelivr */}

<Text

position={[0, active ? -0.04 : 0.41, 0]}

rotation={[-Math.PI / 2, 0, 0]}

fontSize={0.25}

// 使用 Google Fonts 的官方 CDN 地址，通常比较稳定

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



// --- 2. 键盘布局生成器 (修正版：解决 Duplicate Key 报错) ---

const KeyboardLayout = ({ activeKeys }) => {

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



const keys = useMemo(() => {

const keyElements = [];

let zOffset = 0;

rows.forEach((row, rowIndex) => {

let xOffset = -7.5;

// 这里的 forEach 增加了第二个参数 colIndex

row.forEach((item, colIndex) => {

keyElements.push({

...item,

x: xOffset + item.w / 2,

z: zOffset,

// 修正点：ID 加上 colIndex，变成 "3-0-SHIFT" 这种格式

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



// --- 3. 鼠标 3D 组件 (材质升级 & 射线跟随) ---

const Mouse3D = ({ mouseButtons, scrollDir }) => {

const groupRef = useRef();

const { camera, raycaster, pointer } = useThree();

// 抬高鼠标所在的虚拟平面，让它看起来悬浮在网格上方

const floorPlane = useMemo(() => new THREE.Plane(new THREE.Vector3(0, 1, 0), -0.2), []);

const intersectPoint = useMemo(() => new THREE.Vector3(), []);



useFrame(() => {

if (groupRef.current) {

raycaster.setFromCamera(pointer, camera);

raycaster.ray.intersectPlane(floorPlane, intersectPoint);

if (groupRef.current.parent) groupRef.current.parent.worldToLocal(intersectPoint);


// 稍微滞后的跟随，更有重量感

groupRef.current.position.lerp(intersectPoint, 0.2);

groupRef.current.position.y = 0.25; // 保持悬浮高度


// 动态倾斜

groupRef.current.rotation.z = THREE.MathUtils.lerp(groupRef.current.rotation.z, -pointer.x * 0.2, 0.1);

groupRef.current.rotation.x = THREE.MathUtils.lerp(groupRef.current.rotation.x, pointer.y * 0.2, 0.1);

}

});



const mouseMaterial = new THREE.MeshPhysicalMaterial({

color: "#222", roughness: 0.2, metalness: 0.9, clearcoat: 1

});



return (

<group ref={groupRef} position={[6, 0, 2]}>

{/* 鼠标主体 */}

<RoundedBox args={[1.8, 0.5, 3]} radius={0.3} smoothness={8} material={mouseMaterial} />


{/* 底部发光带 (改为洋红色) */}

<RoundedBox args={[1.9, 0.05, 3.1]} radius={0.3} position={[0, -0.26, 0]}>

<meshBasicMaterial color={THEME.accentMagenta} toneMapped={false} />

</RoundedBox>


{/* 底部光晕 */}

<mesh rotation={[-Math.PI/2, 0, 0]} position={[0, -0.35, 0]}>

<planeGeometry args={[3, 4]} />

<meshBasicMaterial color={THEME.accentMagenta} transparent opacity={0.2} toneMapped={false} />

</mesh>



{/* 左键 */}

<RoundedBox args={[0.7, 0.2, 1.2]} position={[-0.45, 0.35, -0.8]} radius={0.1} smoothness={4}>

<meshPhysicalMaterial

color={mouseButtons.left ? THEME.keyActive : "#333"}

emissive={mouseButtons.left ? THEME.keyActive : "#000"}

emissiveIntensity={2} roughness={0.2} metalness={0.8}

/>

</RoundedBox>


{/* 右键 */}

<RoundedBox args={[0.7, 0.2, 1.2]} position={[0.45, 0.35, -0.8]} radius={0.1} smoothness={4}>

<meshPhysicalMaterial

color={mouseButtons.right ? THEME.keyActive : "#333"}

emissive={mouseButtons.right ? THEME.keyActive : "#000"}

emissiveIntensity={2} roughness={0.2} metalness={0.8}

/>

</RoundedBox>



{/* 滚轮 */}

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



// --- 4. 主场景 (环境、灯光、视角大改) ---

const Scene = ({ activeKeys, mouseButtons, scrollDir }) => {

return (

<>

<color attach="background" args={[THEME.bg]} />


{/* 关键修改：加 Suspense 包裹，防止因网络问题卡死整个场景 */}

<Suspense fallback={null}>

{/* preset="city" */}

{/* <Environment files="/hdr/potsdamer_platz_1k.hdr" blur={0.8} background={false} /> */}

</Suspense>


{/* --- 戏剧性灯光 --- */}

{/* 主光源：冷青色侧光，勾勒轮廓 */}

<spotLight position={[-20, 20, 10]} angle={0.3} penumbra={1} intensity={200} color={THEME.accentCyan} castShadow />

{/* 副光源：洋红色侧逆光，增加色彩对比 */}

<pointLight position={[20, 10, -10]} intensity={150} color={THEME.accentMagenta} distance={50} />

{/* 顶部微弱补光 */}

<rectAreaLight width={20} height={20} intensity={2} color={"#ffffff"} position={[0, 10, 0]} rotation={[-Math.PI/2, 0,0]} />



{/* --- 场景物体 --- */}

<group rotation={[0.25, 0, 0]} position={[0, -0.5, 0]}>

<KeyboardLayout activeKeys={activeKeys} />

<Mouse3D mouseButtons={mouseButtons} scrollDir={scrollDir} />

</group>



{/* --- TRON 风格发光网格地板 --- */}

<Grid

position={[0, -2.5, 0]}

args={[60, 60]} // 尺寸

cellSize={1.1} // 小格子大小 (对齐键位)

cellThickness={1} // 小格子线粗细

cellColor={THEME.accentCyan} // 小格子颜色

sectionSize={5.5} // 大格子大小

sectionThickness={1.5} // 大格子线粗细

sectionColor={THEME.accentMagenta} // 大格子颜色

fadeDistance={35} // 远处渐隐距离

fadeStrength={1.5} // 渐隐强度

followCamera // 网格跟随相机移动，营造无限感

/>

{/* 地板反射面 */}

<mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -2.55, 0]}>

<planeGeometry args={[100, 100]} />

{/* MeshReflectorMaterial 会更好，这里用简单的 Standard 模拟 */}

<meshStandardMaterial color="#000" roughness={0.1} metalness={0.95} envMapIntensity={0.5} />

</mesh>



{/* --- 摄像机设置 (拉远、视角变宽) --- */}

{/* position: Y变高，Z变远 */}

<PerspectiveCamera makeDefault position={[0, 14, 20]} fov={50} />

<OrbitControls

enablePan={false}

maxPolarAngle={Math.PI / 2.2} // 限制不能看太低

minPolarAngle={Math.PI / 6}

maxDistance={35} // 限制最大缩放距离

minDistance={10}

autoRotate={false} // 可以开启尝试效果

autoRotateSpeed={0.5}

/>



{/* --- 后期处理特效升级 --- */}

<EffectComposer disableNormalPass multisampling={4}>

{/* 1. 发光特效 (更细腻) */}

<Bloom

luminanceThreshold={0.6} // 只有很亮的部分才发光

mipmapBlur

intensity={2.0} // 发光强度

radius={0.6} // 发光半径

levels={8}

/>

{/* 2. 色散特效 (科幻故障感) */}

<ChromaticAberration

blendFunction={BlendFunction.NORMAL} // 使用后处理库的混合模式

offset={[0.002, 0.002]} // RGB 偏移量

radialModulation={false}

modulationOffset={0}

/>

{/* 3. 暗角特效 (聚焦中心) */}

<Vignette eskil={false} offset={0.1} darkness={1.1} />

</EffectComposer>

</>

);

};



// --- 5. UI 面板组件 (样式微调匹配主题) ---

const UIOverlay = ({ mousePos, keyHistory, activeKeys }) => {

// ... (保持你的 UI 代码不变，或者根据需要修改颜色匹配 THEME.accentCyan)

return (

<div style={{

position: 'absolute', right: 30, top: 30, zIndex: 10, width: '280px',

padding: '20px', background: 'rgba(0, 10, 20, 0.85)', // 背景微调偏蓝

border: `1px solid ${THEME.accentCyan}`, // 边框改青色

borderRadius: '8px',

color: THEME.accentCyan, // 文字改青色

fontFamily: "'Courier New', monospace",

boxShadow: `0 0 25px ${THEME.accentCyan}40`, // 光晕改青色

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



// --- 6. App 入口 (保持不变) ---

export default function App() {

// ... (保持原有的状态逻辑代码不变)

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

setKeyHistory(prev => [mappedKey, ...prev].slice(0, 8));

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

<Canvas shadows dpr={[1, 2]} gl={{ antialias: false }}>

<Scene activeKeys={activeKeys} mouseButtons={mouseButtons} scrollDir={scrollDir} />

</Canvas>

</div>

);

}