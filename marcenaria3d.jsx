import { useState, useEffect, useRef, useCallback } from "react";
import * as THREE from "three";

// ─────────────────────────────────────────────
// TEXTURAS
// ─────────────────────────────────────────────
const _texCache = {};
function woodCanvas(type) {
  if (_texCache[type]) return _texCache[type];
  const cv = document.createElement("canvas");
  cv.width = cv.height = 512;
  const cx = cv.getContext("2d");
  const P = {
    freijo:   ["#8B5E3C","#6B3A1F","#A0713D"],
    carvalho: ["#9C7A4A","#7A5C2E","#B8935A"],
    branco:   ["#F0EDE8","#D8D3CC","#FAFAF8"],
    mdf_bp:   ["#C8A87A","#A07850","#D4B88A"],
    nogueira: ["#5C3D1E","#3A2010","#7A5230"],
    pinus:    ["#D4B483","#B89060","#E0C898"],
  }[type] || ["#8B5E3C","#6B3A1F","#A0713D"];
  cx.fillStyle = P[0]; cx.fillRect(0,0,512,512);
  for (let i=0;i<90;i++) {
    const x=(i/90)*512+Math.sin(i*0.4)*10;
    cx.beginPath(); cx.moveTo(x,0);
    for (let y=0;y<512;y+=3) cx.lineTo(x+Math.sin(y*0.018+i)*(8+Math.random()*6),y);
    cx.strokeStyle=i%3===0?P[1]:P[2]; cx.globalAlpha=0.12+Math.random()*0.22;
    cx.lineWidth=0.4+Math.random()*1.6; cx.stroke();
  }
  if (type!=="branco") for (let k=0;k<3;k++) {
    const kx=60+Math.random()*392, ky=60+Math.random()*392, kr=7+Math.random()*14;
    for (let r=kr;r>0;r-=1.2) {
      cx.beginPath(); cx.ellipse(kx,ky,r,r*0.55,Math.PI*0.12,0,Math.PI*2);
      cx.strokeStyle=P[1]; cx.globalAlpha=0.28; cx.lineWidth=0.8; cx.stroke();
    }
  }
  cx.globalAlpha=1;
  _texCache[type] = cv; return cv;
}

function makeTex(key, w, h) {
  const t = new THREE.CanvasTexture(woodCanvas(key));
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(w/0.5, h/0.5);
  return t;
}

// ─────────────────────────────────────────────
// CATÁLOGO EUCATEX 2024
// ─────────────────────────────────────────────
const MAT_GROUPS = [
  { group:"BP Poro Supermatt", items:[
    {id:"ps_freijo",      label:"Louro Freijó",       color:"#8B5E3C", tex:"freijo"},
    {id:"ps_amendoa",     label:"Amêndoa Natural",    color:"#C8A06A", tex:"mdf_bp"},
    {id:"ps_carvalho_t",  label:"Carvalho Tropical",  color:"#9C7A4A", tex:"carvalho"},
    {id:"ps_cumaru",      label:"Cumaru Nativo",      color:"#7A5030", tex:"nogueira"},
    {id:"ps_itaparica",   label:"Itaparica",          color:"#A07850", tex:"mdf_bp"},
    {id:"ps_nevada",      label:"Nevada",             color:"#D0C8BC", tex:"branco"},
    {id:"ps_madero_c",    label:"Madero Cacau",       color:"#5C3820", tex:"nogueira"},
    {id:"ps_madero_z",    label:"Madero Cinza",       color:"#7A7870", tex:"mdf_bp"},
    {id:"ps_nogueira_t",  label:"Nogueira Terracota", color:"#8A5040", tex:"nogueira"},
  ]},
  { group:"Lacca AD (Alto Brilho)", items:[
    {id:"la_branco",      label:"Branco Neve",        color:"#F8F8F6", tex:"branco"},
    {id:"la_preto",       label:"Preto Ônix",         color:"#1A1A1A", tex:"nogueira"},
    {id:"la_cinza_s",     label:"Cinza Supremo",      color:"#909090", tex:"mdf_bp"},
    {id:"la_cinza_i",     label:"Cinza Itália",       color:"#A8A8A0", tex:"mdf_bp"},
    {id:"la_cinza_u",     label:"Cinza Urbano",       color:"#6A6A68", tex:"mdf_bp"},
    {id:"la_grey",        label:"Grey Sky",           color:"#B8BCC0", tex:"branco"},
    {id:"la_fume",        label:"Fumê",               color:"#5A5858", tex:"nogueira"},
    {id:"la_verde",       label:"Verde Mar",          color:"#4A7A60", tex:"mdf_bp"},
    {id:"la_amarelo",     label:"Amarelo Gema",       color:"#D4A820", tex:"mdf_bp"},
    {id:"la_vermelho",    label:"Vermelho Scarlate",  color:"#A02020", tex:"nogueira"},
    {id:"la_cacau",       label:"Cacau Natural",      color:"#7A5040", tex:"nogueira"},
    {id:"la_noce",        label:"Italian Noce",       color:"#8A6848", tex:"freijo"},
  ]},
  { group:"BP Matt Soft (Aveludado)", items:[
    {id:"ms_branco",      label:"Branco Max",         color:"#F2F0EC", tex:"branco"},
    {id:"ms_freijo",      label:"Freijó Brasil",      color:"#8A5C38", tex:"freijo"},
    {id:"ms_noronha",     label:"Noronha",            color:"#C8A870", tex:"mdf_bp"},
    {id:"ms_dunas",       label:"Dunas",              color:"#D4C4A0", tex:"mdf_bp"},
    {id:"ms_areia",       label:"Areia",              color:"#C8B890", tex:"mdf_bp"},
    {id:"ms_quartzo",     label:"Quartzo Bege",       color:"#C0A888", tex:"mdf_bp"},
    {id:"ms_aqua",        label:"Aqua",               color:"#88B8B0", tex:"mdf_bp"},
    {id:"ms_blue",        label:"Blue Sky",           color:"#6890C0", tex:"mdf_bp"},
    {id:"ms_verde",       label:"Verde Mar",          color:"#4A7A60", tex:"mdf_bp"},
    {id:"ms_rosa",        label:"Pétala Rosa",        color:"#D8A0A0", tex:"branco"},
    {id:"ms_cinza_u",     label:"Cinza Urbano",       color:"#6A6A68", tex:"mdf_bp"},
    {id:"ms_cinza_s",     label:"Cinza Supremo",      color:"#909090", tex:"mdf_bp"},
    {id:"ms_cacau",       label:"Cacau Natural",      color:"#7A5040", tex:"nogueira"},
    {id:"ms_bronze",      label:"Castanho Bronze",    color:"#806040", tex:"nogueira"},
    {id:"ms_elmo",        label:"Elmo Macciato",      color:"#B89870", tex:"carvalho"},
    {id:"ms_noce",        label:"Italian Noce",       color:"#8A6848", tex:"freijo"},
    {id:"ms_cristal",     label:"Cristal",            color:"#E8E4E0", tex:"branco"},
  ]},
  { group:"BP Raízes", items:[
    {id:"ra_peroba",      label:"Peroba Rosa",        color:"#C89870", tex:"pinus"},
    {id:"ra_freijo_a",    label:"Freijó Âmbar",       color:"#A07840", tex:"freijo"},
    {id:"ra_oak",         label:"Natural Oak",        color:"#B89060", tex:"carvalho"},
    {id:"ra_noce_o",      label:"Noce Oro",           color:"#906838", tex:"nogueira"},
    {id:"ra_lamina",      label:"Lâmina Dourada",     color:"#C8A040", tex:"mdf_bp"},
    {id:"ra_carbono",     label:"Noce Carbono",       color:"#484038", tex:"nogueira"},
  ]},
  { group:"BP Matt Plus", items:[
    {id:"mp_branco",      label:"Branco Max",         color:"#F2F0EC", tex:"branco"},
    {id:"mp_arenas",      label:"Arenas",             color:"#B8A888", tex:"mdf_bp"},
    {id:"mp_fume",        label:"Fumê Clássico",      color:"#585858", tex:"nogueira"},
    {id:"mp_cinnamon",    label:"Cinnamon",           color:"#A06840", tex:"freijo"},
    {id:"mp_peroba",      label:"Peroba",             color:"#C89870", tex:"pinus"},
    {id:"mp_naturalle",   label:"Lâmina Naturalle",   color:"#C0A878", tex:"mdf_bp"},
  ]},
  { group:"BP Grafis", items:[
    {id:"gr_arenas",      label:"Arenas",             color:"#B8A888", tex:"mdf_bp"},
    {id:"gr_fume",        label:"Fumê Clássico",      color:"#585858", tex:"nogueira"},
  ]},
];

const MATS_GLASS = [
  {id:"vidro_c", label:"Vidro Cristal", color:"#a8d8ea"},
  {id:"vidro_f", label:"Vidro Fumê",    color:"#4a6070"},
  {id:"vidro_e", label:"Vidro Espelho", color:"#c8d8e0"},
];

const ALL_MAT_ITEMS = MAT_GROUPS.flatMap(g=>g.items);

function buildMat(matId, w, h) {
  if (matId==="vidro_c") return new THREE.MeshPhysicalMaterial({color:0xa8d8ea,transparent:true,opacity:0.28,roughness:0.05,metalness:0.1,side:THREE.DoubleSide});
  if (matId==="vidro_f") return new THREE.MeshPhysicalMaterial({color:0x4a6070,transparent:true,opacity:0.42,roughness:0.05,metalness:0.15,side:THREE.DoubleSide});
  if (matId==="vidro_e") return new THREE.MeshPhysicalMaterial({color:0xc8d8e0,transparent:true,opacity:0.55,roughness:0.02,metalness:0.9,side:THREE.DoubleSide});
  const item = ALL_MAT_ITEMS.find(m=>m.id===matId);
  const texKey = item?.tex || "mdf_bp";
  const mat = new THREE.MeshStandardMaterial({map:makeTex(texKey,w,h), roughness:0.75, metalness:0, side:THREE.DoubleSide});
  if (item?.color) mat.color = new THREE.Color(item.color);
  return mat;
}

// ─────────────────────────────────────────────
// TIPOS DE PEÇA
// ─────────────────────────────────────────────
const PTYPES = [
  {id:"lateral",    label:"Lateral",    icon:"▯",  w:0.018, h:0.80,  d:0.40},
  {id:"tampo",      label:"Tampo/Base", icon:"⬜", w:0.80,  h:0.018, d:0.40},
  {id:"fundo",      label:"Fundo",      icon:"◫",  w:0.76,  h:0.76,  d:0.009},
  {id:"porta",      label:"Porta",      icon:"🚪", w:0.36,  h:0.70,  d:0.018},
  {id:"gaveta",     label:"Gaveta",     icon:"▤",  w:0.36,  h:0.14,  d:0.38},
  {id:"prateleira", label:"Prateleira", icon:"═",  w:0.76,  h:0.018, d:0.38},
  {id:"vidro",      label:"Vidro",      icon:"🔲", w:0.36,  h:0.60,  d:0.006},
];

// ─────────────────────────────────────────────
// PUXADOR (retorna THREE.Group)
// ─────────────────────────────────────────────
function makeHandle(pW, pH, pD) {
  const g = new THREE.Group();
  g.userData.isHandle = true;
  const barW = Math.min(pW * 0.55, 0.18);
  const metalMat = new THREE.MeshStandardMaterial({color:0xc8c8c8, roughness:0.15, metalness:0.92});
  // barra
  const bar = new THREE.Mesh(new THREE.CylinderGeometry(0.006,0.006,barW,10), metalMat);
  bar.rotation.z = Math.PI/2;
  // suportes
  const legH = 0.025;
  const legGeo = new THREE.CylinderGeometry(0.005,0.005,legH,10);
  const legL = new THREE.Mesh(legGeo, metalMat); legL.rotation.x = Math.PI/2;
  const legR = new THREE.Mesh(legGeo, metalMat); legR.rotation.x = Math.PI/2;
  legL.position.set(-barW/2, 0, -legH/2);
  legR.position.set( barW/2, 0, -legH/2);
  // rosetas
  const rosGeo = new THREE.CylinderGeometry(0.009,0.009,0.005,12);
  const rosL = new THREE.Mesh(rosGeo, metalMat); rosL.rotation.x = Math.PI/2;
  const rosR = new THREE.Mesh(rosGeo, metalMat); rosR.rotation.x = Math.PI/2;
  rosL.position.set(-barW/2, 0, -(legH+0.001));
  rosR.position.set( barW/2, 0, -(legH+0.001));
  [bar,legL,legR,rosL,rosR].forEach(m=>{ m.castShadow=true; g.add(m); });
  g.position.set(0, 0, pD/2 + legH + 0.004);
  return g;
}

// ─────────────────────────────────────────────
// FÁBRICA DE PEÇAS
// ─────────────────────────────────────────────
let GID = 1;
const animSet = new Set(); // peças em animação

function makePiece(typeId, matId, x=0, y=0, z=0) {
  const tp = PTYPES.find(t=>t.id===typeId) || PTYPES[0];
  const mid = (typeId==="vidro" && !matId.startsWith("vidro")) ? "vidro_c" : matId;
  const {w,h,d} = tp;
  const id = GID++;

  const needsHandle = typeId==="gaveta" || typeId==="porta";

  // --- PEÇAS COM PUXADOR: usa Group ---
  if (needsHandle) {
    const grp = new THREE.Group();
    grp.position.set(x, y+h/2, z);

    if (typeId === "gaveta") {
      // Corpo da gaveta (sem a face frontal)
      const bodyD = d - 0.002; // profundidade do corpo
      const frontT = 0.018;    // espessura da frente
      const body = new THREE.Mesh(
        new THREE.BoxGeometry(w, h, bodyD),
        buildMat(mid, w, h)
      );
      body.position.z = -(frontT / 2); // recua levemente
      body.castShadow = true; body.receiveShadow = true;
      body.userData.isBody = true;
      grp.add(body);

      // Frente da gaveta (painel frontal destacado)
      const front = new THREE.Mesh(
        new THREE.BoxGeometry(w, h, frontT),
        buildMat(mid, w, h)   // começa igual ao corpo
      );
      front.position.z = (bodyD / 2) - (frontT / 2) + frontT;
      front.castShadow = true; front.receiveShadow = true;
      front.userData.isFront = true;
      grp.add(front);
    } else {
      // Porta: body simples
      const body = new THREE.Mesh(new THREE.BoxGeometry(w,h,d), buildMat(mid,w,h));
      body.castShadow = true; body.receiveShadow = true;
      body.userData.isBody = true;
      grp.add(body);
    }

    grp.add(makeHandle(w, h, d));

    grp.userData = {
      id, typeId, matId:mid,
      frontMatId: mid,   // material da frente (gaveta)
      w, h, d,
      rx:0, ry:0, rz:0,
      label:`${tp.label} ${id}`,
      isOpen:false, openProgress:0,
      baseX:x, baseZ:z, baseRY:0,
      hasHandle: true,
      doorSide: "left",  // "left" | "right"
    };
    return grp;
  }

  // --- PEÇAS SIMPLES ---
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(w,h,d), buildMat(mid,w,h));
  mesh.position.set(x, y+h/2, z);
  mesh.castShadow = true; mesh.receiveShadow = true;
  mesh.userData = {id, typeId, matId:mid, w, h, d, rx:0, ry:0, rz:0, label:`${tp.label} ${id}`};
  return mesh;
}

function rebuildPiece(obj) {
  const {w,h,d,matId,frontMatId,typeId,rx,ry,rz} = obj.userData;
  if (obj.isGroup) {
    const body = obj.children.find(c=>c.userData.isBody);
    if (body) {
      body.geometry.dispose(); body.material.dispose();
      if (typeId === "gaveta") {
        const bodyD = d - 0.002;
        body.geometry = new THREE.BoxGeometry(w, h, bodyD);
      } else {
        body.geometry = new THREE.BoxGeometry(w, h, d);
      }
      body.material = buildMat(matId, w, h);
    }
    const front = obj.children.find(c=>c.userData.isFront);
    if (front) {
      const frontT = 0.018;
      const bodyD = d - 0.002;
      front.geometry.dispose(); front.material.dispose();
      front.geometry = new THREE.BoxGeometry(w, h, frontT);
      front.position.z = (bodyD / 2) - (frontT / 2) + frontT;
      front.material = buildMat(frontMatId || matId, w, h);
    }
    // rebuild handle
    const oldH = obj.children.find(c=>c.userData.isHandle);
    if (oldH) {
      oldH.traverse(c=>{ if(c.isMesh){c.geometry.dispose(); c.material.dispose();} });
      obj.remove(oldH);
    }
    const newH = makeHandle(w, h, d);
    newH.visible = obj.userData.hasHandle !== false;
    obj.add(newH);
  } else {
    obj.geometry.dispose();
    obj.geometry = new THREE.BoxGeometry(w,h,d);
    if (Array.isArray(obj.material)) obj.material.forEach(m=>m.dispose());
    else obj.material.dispose();
    obj.material = buildMat(matId,w,h);
  }
  obj.rotation.set(
    THREE.MathUtils.degToRad(rx),
    THREE.MathUtils.degToRad(ry),
    THREE.MathUtils.degToRad(rz)
  );
}

// ─────────────────────────────────────────────
// ANIMAÇÃO ABRIR / FECHAR
// ─────────────────────────────────────────────
function toggleOpenClose(obj) {
  if (!obj?.userData) return;
  const {typeId} = obj.userData;
  if (typeId!=="gaveta" && typeId!=="porta") return;
  // Salva posição base somente quando está fechada
  if (!obj.userData.isOpen) {
    obj.userData.baseX  = obj.position.x;
    obj.userData.baseZ  = obj.position.z;
    obj.userData.baseRY = obj.rotation.y;
  }
  obj.userData.isOpen = !obj.userData.isOpen;
  animSet.add(obj);
}

function applyDoorTransform(obj, progress) {
  const ud = obj.userData;
  const hw = ud.w / 2;
  // side: esquerda = dobradiça no X negativo, direita = X positivo
  const isRight = ud.doorSide === "right";
  // Porta abre 105° — sinal positivo gira anti-horário (esquerda), negativo horário (direita)
  const sign = isRight ? -1 : 1;
  const angle = progress * THREE.MathUtils.degToRad(105) * sign;

  obj.rotation.y = ud.baseRY + angle;

  if (isRight) {
    // Pivô na borda direita: baseX + hw
    const px = ud.baseX + hw;
    obj.position.x = px - Math.cos(angle) * hw;
    obj.position.z = ud.baseZ + Math.sin(angle) * hw;
  } else {
    // Pivô na borda esquerda: baseX - hw
    const px = ud.baseX - hw;
    obj.position.x = px + Math.cos(angle) * hw;
    obj.position.z = ud.baseZ - Math.sin(angle) * hw;
  }
}

function tickAnimations(dt) {
  for (const obj of animSet) {
    const ud = obj.userData;
    if (!ud) { animSet.delete(obj); continue; }
    const target = ud.isOpen ? 1 : 0;
    ud.openProgress += (target - ud.openProgress) * Math.min(dt * 5, 0.18);

    if (ud.typeId === "gaveta") {
      obj.position.z = ud.baseZ + ud.openProgress * ud.d * 0.85;
    } else if (ud.typeId === "porta") {
      applyDoorTransform(obj, ud.openProgress);
    }

    if (Math.abs(ud.openProgress - target) < 0.003) {
      ud.openProgress = target;
      if (ud.typeId === "gaveta") {
        obj.position.z = ud.baseZ + target * ud.d * 0.85;
      } else if (ud.typeId === "porta") {
        applyDoorTransform(obj, target);
      }
      animSet.delete(obj);
    }
  }
}

// ─────────────────────────────────────────────
// OUTLINE DE SELEÇÃO — usa dimensões do userData para evitar flicker
// ─────────────────────────────────────────────
const OUTLINE_TAG = "__outline__";

function getOutlineBox(obj) {
  // Para grupos (porta/gaveta) usa dimensões do userData — tamanho fixo, sem flicker
  if (obj.isGroup && obj.userData.w) {
    const {w, h, d} = obj.userData;
    return { size: new THREE.Vector3(w + 0.008, h + 0.008, d + 0.008), center: obj.position.clone().setY(obj.position.y) };
  }
  // Para meshes simples usa bounding box
  const box = new THREE.Box3().setFromObject(obj);
  const size = new THREE.Vector3(); box.getSize(size);
  size.addScalar(0.008);
  const center = new THREE.Vector3(); box.getCenter(center);
  return { size, center };
}

function addOutline(obj, scene) {
  clearOutline(scene);
  const { size, center } = getOutlineBox(obj);
  const geo = new THREE.BoxGeometry(size.x, size.y, size.z);
  const edges = new THREE.EdgesGeometry(geo);
  geo.dispose();
  const ol = new THREE.LineSegments(edges, new THREE.LineBasicMaterial({color:0x44aaff, depthTest:false}));
  ol.position.copy(center);
  ol.userData[OUTLINE_TAG] = true;
  ol.renderOrder = 999;
  scene.add(ol);
}

function clearOutline(scene) {
  const ol = scene.children.find(c=>c.userData[OUTLINE_TAG]);
  if (ol) { ol.geometry.dispose(); ol.material.dispose(); scene.remove(ol); }
}

function syncOutline(obj, scene) {
  const ol = scene.children.find(c=>c.userData[OUTLINE_TAG]);
  if (!ol) return;
  const { center } = getOutlineBox(obj);
  // Para grupos: segue a posição do objeto diretamente
  if (obj.isGroup) {
    ol.position.copy(obj.position);
  } else {
    ol.position.copy(center);
  }
}

// ─────────────────────────────────────────────
// SNAP — grade de 5cm para alinhar com GridHelper
// ─────────────────────────────────────────────
const GRID = 0.05; // 5cm — igual ao tamanho de cada quadrado da grade
function snapGrid(v, g=GRID) { return Math.round(v/g)*g; }
function edgeSnap(moving, others, thr=0.035) {
  const mb = new THREE.Box3().setFromObject(moving);
  let best=null, bd=thr;
  for (const o of others) {
    if (o===moving) continue;
    const ob = new THREE.Box3().setFromObject(o);
    const checks = [
      {a:"x", mf:mb.max.x, tf:ob.min.x}, {a:"x", mf:mb.min.x, tf:ob.max.x},
      {a:"y", mf:mb.max.y, tf:ob.min.y}, {a:"y", mf:mb.min.y, tf:ob.max.y},
      {a:"z", mf:mb.max.z, tf:ob.min.z}, {a:"z", mf:mb.min.z, tf:ob.max.z},
    ];
    for (const c of checks) {
      const dist = Math.abs(c.mf - c.tf);
      if (dist < bd) { bd=dist; best={a:c.a, delta:c.tf-c.mf}; }
    }
  }
  if (best) moving.position[best.a] += best.delta;
}

// ─────────────────────────────────────────────
// RESOLVE HIT → top-level piece
// ─────────────────────────────────────────────
function resolveHit(hitObj, pieces) {
  // Walk up to find a piece in our list
  let o = hitObj;
  while (o) {
    if (pieces.includes(o)) return o;
    o = o.parent;
  }
  return null;
}

// ─────────────────────────────────────────────
// APP
// ─────────────────────────────────────────────
export default function App() {
  const mountRef   = useRef(null);
  const sceneRef   = useRef(null);
  const cameraRef  = useRef(null);
  const rendRef    = useRef(null);
  const piecesRef  = useRef([]);
  const selRef     = useRef(null);

  const sph    = useRef({theta:0.8, phi:0.65, radius:3.5, cx:0, cy:0.4, cz:0});
  const orbit  = useRef({on:false, lx:0, ly:0});
  const panS   = useRef({on:false, lx:0, ly:0});
  const dragS  = useRef({on:false, ox:0, oz:0});
  const dplane = useRef(new THREE.Plane(new THREE.Vector3(0,1,0), 0));
  const rc     = useRef(new THREE.Raycaster());

  const [pieces,    setPieces]    = useState([]);
  const [selId,     setSelId]     = useState(null);
  const [selData,   setSelData]   = useState(null);
  const [actMat,    setActMat]    = useState("ps_freijo");
  const [actType,   setActType]   = useState("lateral");
  const [tab,       setTab]       = useState("add");
  const [status,    setStatus]    = useState("Bem-vindo! Adicione peças para montar seu móvel.");
  const [matSearch, setMatSearch] = useState("");
  const [matTarget, setMatTarget] = useState("corpo"); // "corpo" | "frente"
  const [editingId,   setEditingId]   = useState(null);
  const [editingName, setEditingName] = useState("");
  const renameRef = useRef(null);

  // ── INIT THREE.JS ──────────────────────────────────────────────
  useEffect(() => {
    const mount = mountRef.current;
    const W = mount.clientWidth, H = mount.clientHeight;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0d0d16);
    scene.fog = new THREE.FogExp2(0x0d0d16, 0.055);
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(42, W/H, 0.005, 60);
    camera.position.set(2.2, 1.8, 2.8);
    camera.lookAt(0, 0.4, 0);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({antialias:true});
    renderer.setSize(W, H);
    renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.1;
    mount.appendChild(renderer.domElement);
    rendRef.current = renderer;

    // Lights
    scene.add(new THREE.AmbientLight(0xfff8f0, 0.55));
    const sun = new THREE.DirectionalLight(0xfff5e0, 1.3);
    sun.position.set(4,7,4); sun.castShadow = true;
    sun.shadow.mapSize.set(2048,2048);
    sun.shadow.camera.left = sun.shadow.camera.bottom = -4;
    sun.shadow.camera.right = sun.shadow.camera.top = 4;
    scene.add(sun);
    const fill2 = new THREE.DirectionalLight(0xc0d8ff,0.5); fill2.position.set(-3,3,-3); scene.add(fill2);

    // Floor
    const floor = new THREE.Mesh(
      new THREE.PlaneGeometry(8,8),
      new THREE.MeshStandardMaterial({color:0x141420, roughness:0.95})
    );
    floor.rotation.x = -Math.PI/2; floor.receiveShadow = true;
    floor.userData.isFloor = true;
    scene.add(floor);
    // Grade: 8m / 160 divisões = 5cm por quadrado
    scene.add(new THREE.GridHelper(8, 160, 0x2a2a50, 0x1a1a38));

    // Animate loop
    let fid, last = performance.now();
    const loop = () => {
      fid = requestAnimationFrame(loop);
      const now = performance.now();
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      tickAnimations(dt);
      // Outline acompanha o objeto selecionado em tempo real (sem flicker)
      const sel = selRef.current;
      if (sel) {
        const ol = scene.children.find(c=>c.userData[OUTLINE_TAG]);
        if (ol) ol.position.copy(sel.position);
      }
      renderer.render(scene, camera);
    };
    loop();

    const onResize = () => {
      const w = mount.clientWidth, h = mount.clientHeight;
      camera.aspect = w/h; camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener("resize", onResize);
    return () => {
      cancelAnimationFrame(fid);
      window.removeEventListener("resize", onResize);
      if (mount.contains(renderer.domElement)) mount.removeChild(renderer.domElement);
      renderer.dispose();
    };
  }, []);

  // ── CAMERA ────────────────────────────────────────────────────
  const updateCam = useCallback(() => {
    const {theta, phi, radius, cx, cy, cz} = sph.current;
    const cam = cameraRef.current;
    cam.position.set(
      cx + radius * Math.sin(phi) * Math.sin(theta),
      cy + radius * Math.cos(phi),
      cz + radius * Math.sin(phi) * Math.cos(theta)
    );
    cam.lookAt(cx, cy, cz);
  }, []);

  // ── SELECT ────────────────────────────────────────────────────
  const selectObj = useCallback((obj) => {
    selRef.current = obj;
    if (!obj) {
      clearOutline(sceneRef.current);
      setSelId(null); setSelData(null);
      setStatus("Clique em uma peça para selecionar");
      return;
    }
    addOutline(obj, sceneRef.current);
    const ud = obj.userData;
    setSelId(ud.id);
    setSelData({
      ...ud,
      py: Math.round(obj.position.y * 100),
      hasHandle: ud.hasHandle !== false,
      frontMatId: ud.frontMatId || ud.matId,
      doorSide: ud.doorSide || "left",
    });
    setActMat(ud.matId);
    if (ud.typeId !== "gaveta") setMatTarget("corpo");
    setStatus(`✓ ${ud.label}`);
  }, []);

  // ── NDC ───────────────────────────────────────────────────────
  const getNDC = useCallback((e) => {
    const r = mountRef.current.getBoundingClientRect();
    return new THREE.Vector2(
      ((e.clientX - r.left) / r.width)  * 2 - 1,
      -((e.clientY - r.top)  / r.height) * 2 + 1
    );
  }, []);

  // ── MOUSE DOWN ────────────────────────────────────────────────
  const onMD = useCallback((e) => {
    if (e.button === 2) { orbit.current = {on:true, lx:e.clientX, ly:e.clientY}; return; }
    if (e.button === 1 || (e.button === 0 && e.altKey)) {
      panS.current = {on:true, lx:e.clientX, ly:e.clientY}; e.preventDefault(); return;
    }
    if (e.button === 0) {
      rc.current.setFromCamera(getNDC(e), cameraRef.current);
      const hits = rc.current.intersectObjects(piecesRef.current, true);
      if (hits.length) {
        const target = resolveHit(hits[0].object, piecesRef.current);
        if (target) {
          selectObj(target);
          // Plano de drag na altura Y do objeto
          dplane.current.setFromNormalAndCoplanarPoint(
            new THREE.Vector3(0,1,0),
            new THREE.Vector3(0, target.position.y, 0)
          );
          // Salva offset: diferença entre posição do objeto e ponto clicado no plano
          const pt = new THREE.Vector3();
          if (rc.current.ray.intersectPlane(dplane.current, pt)) {
            dragS.current.on = true;
            dragS.current.ox = target.position.x - pt.x;
            dragS.current.oz = target.position.z - pt.z;
          }
        }
      } else {
        selectObj(null);
      }
    }
  }, [getNDC, selectObj]);

  // ── MOUSE MOVE ────────────────────────────────────────────────
  const onMM = useCallback((e) => {
    if (orbit.current.on) {
      const dx = e.clientX - orbit.current.lx, dy = e.clientY - orbit.current.ly;
      sph.current.theta -= dx * 0.007;
      sph.current.phi = Math.max(0.06, Math.min(1.54, sph.current.phi + dy * 0.007));
      orbit.current.lx = e.clientX; orbit.current.ly = e.clientY;
      updateCam(); return;
    }
    if (panS.current.on) {
      const dx = e.clientX - panS.current.lx, dy = e.clientY - panS.current.ly;
      const cam = cameraRef.current;
      const right = new THREE.Vector3().crossVectors(cam.getWorldDirection(new THREE.Vector3()), cam.up).normalize();
      sph.current.cx -= right.x * dx * 0.003;
      sph.current.cz -= right.z * dx * 0.003;
      sph.current.cy += dy * 0.003;
      panS.current.lx = e.clientX; panS.current.ly = e.clientY;
      updateCam(); return;
    }
    if (dragS.current.on && selRef.current) {
      rc.current.setFromCamera(getNDC(e), cameraRef.current);
      const pt = new THREE.Vector3();
      if (rc.current.ray.intersectPlane(dplane.current, pt)) {
        selRef.current.position.x = snapGrid(pt.x + (dragS.current.ox || 0));
        selRef.current.position.z = snapGrid(pt.z + (dragS.current.oz || 0));
        syncOutline(selRef.current, sceneRef.current);
      }
    }
  }, [getNDC, updateCam]);

  const onMU = useCallback(() => {
    if (dragS.current.on && selRef.current) {
      const obj = selRef.current;
      // Snap final garante alinhamento exato com a grade
      obj.position.x = snapGrid(obj.position.x);
      obj.position.z = snapGrid(obj.position.z);
      // CRÍTICO: atualiza base para animação de abrir/fechar usar posição correta
      if (obj.userData) {
        obj.userData.baseX = obj.position.x;
        obj.userData.baseZ = obj.position.z;
        obj.userData.baseRY = obj.rotation.y;
        // Se estava aberta, força fechamento e reseta progresso
        if (obj.userData.isOpen) {
          obj.userData.isOpen = false;
          obj.userData.openProgress = 0;
          animSet.delete(obj);
        }
      }
      syncOutline(obj, sceneRef.current);
    }
    dragS.current = {on:false, ox:0, oz:0};
    orbit.current = {on:false};
    panS.current  = {on:false};
  }, []);

  const onWheel = useCallback((e) => {
    e.preventDefault();
    sph.current.radius = Math.max(0.5, Math.min(14, sph.current.radius + e.deltaY * 0.004));
    updateCam();
  }, [updateCam]);

  // ── ADD PIECE ─────────────────────────────────────────────────
  const addPiece = useCallback(() => {
    const x = snapGrid((Math.random()-0.5)*0.8);
    const z = snapGrid((Math.random()-0.5)*0.8);
    const mid = (actType==="vidro" && !actMat.startsWith("vidro")) ? "vidro_c" : actMat;
    const obj = makePiece(actType, mid, x, 0, z);
    obj.userData.baseX = obj.position.x;
    obj.userData.baseZ = obj.position.z;
    obj.userData.baseRY = 0;
    sceneRef.current.add(obj);
    piecesRef.current.push(obj);
    setPieces(prev => [...prev, {id:obj.userData.id, label:obj.userData.label, typeId:obj.userData.typeId}]);
    selectObj(obj);
    setStatus(`➕ ${obj.userData.label} adicionado`);
  }, [actMat, actType, selectObj]);

  // ── DELETE ────────────────────────────────────────────────────
  const delSel = useCallback(() => {
    const obj = selRef.current; if (!obj) return;
    clearOutline(sceneRef.current);
    animSet.delete(obj);
    sceneRef.current.remove(obj);
    obj.traverse(c => { if (c.isMesh) { c.geometry.dispose(); c.material.dispose(); } });
    piecesRef.current = piecesRef.current.filter(p => p !== obj);
    setPieces(prev => prev.filter(p => p.id !== obj.userData.id));
    selectObj(null);
    setStatus("🗑 Peça removida");
  }, [selectObj]);

  // ── DUPLICATE ─────────────────────────────────────────────────
  const dupSel = useCallback(() => {
    const src = selRef.current; if (!src) return;
    const ud = src.userData;
    // Cria nova peça com mesmos parâmetros, deslocada um pouco
    const ox = snapGrid(src.position.x + GRID * 2);
    const oy = src.position.y;
    const oz = snapGrid(src.position.z + GRID * 2);
    const copy = makePiece(ud.typeId, ud.matId, ox, 0, oz);

    // Copia dimensões personalizadas
    copy.userData.w = ud.w;
    copy.userData.h = ud.h;
    copy.userData.d = ud.d;
    copy.userData.rx = ud.rx || 0;
    copy.userData.ry = ud.ry || 0;
    copy.userData.rz = ud.rz || 0;
    copy.userData.hasHandle = ud.hasHandle !== false;
    copy.userData.frontMatId = ud.frontMatId || ud.matId;
    copy.userData.label = ud.label + " (cópia)";

    // Aplica posição Y
    copy.position.y = oy;
    copy.userData.baseX = ox;
    copy.userData.baseZ = oz;
    copy.userData.baseRY = 0;

    // Reconstrói geometria com dimensões copiadas
    rebuildPiece(copy);

    // Aplica material da frente se for gaveta
    if (ud.typeId === "gaveta" && ud.frontMatId) {
      const front = copy.children?.find(c => c.userData.isFront);
      if (front) { front.material.dispose(); front.material = buildMat(ud.frontMatId, ud.w, ud.h); }
    }

    // Visibilidade do puxador
    if (copy.isGroup) {
      const handle = copy.children.find(c => c.userData.isHandle);
      if (handle) handle.visible = ud.hasHandle !== false;
    }

    sceneRef.current.add(copy);
    piecesRef.current.push(copy);
    setPieces(prev => [...prev, {id:copy.userData.id, label:copy.userData.label, typeId:copy.userData.typeId}]);
    selectObj(copy);
    setStatus(`📋 ${copy.userData.label}`);
  }, [selectObj]);

  // ── UPDATE DIM ────────────────────────────────────────────────
  const updateDim = useCallback((axis, valCm) => {
    const obj = selRef.current; if (!obj) return;
    const v = Math.max(0.1, parseFloat(valCm) || 1) / 100;
    obj.userData[axis] = v;
    rebuildPiece(obj);
    syncOutline(obj, sceneRef.current);
    setSelData(d => ({...d, [axis]:v}));
    setStatus(`📐 ${axis.toUpperCase()}: ${Math.round(v*100)}cm`);
  }, []);

  // ── UPDATE ROT ────────────────────────────────────────────────
  const updateRot = useCallback((axis, val) => {
    const obj = selRef.current; if (!obj) return;
    let deg = parseFloat(val) || 0;
    deg = ((deg % 360) + 540) % 360 - 180;
    obj.userData[axis] = deg;
    obj.rotation[axis.slice(1)] = THREE.MathUtils.degToRad(deg);
    syncOutline(obj, sceneRef.current);
    setSelData(d => ({...d, [axis]: Math.round(deg)}));
    setStatus(`🔄 ${axis.toUpperCase()}: ${Math.round(deg)}°`);
  }, []);

  // ── UPDATE Y ──────────────────────────────────────────────────
  const updateY = useCallback((valCm) => {
    const obj = selRef.current; if (!obj) return;
    const y = (parseFloat(valCm) || 0) / 100;
    obj.position.y = y;
    syncOutline(obj, sceneRef.current);
    setSelData(d => ({...d, py: Math.round(y*100)}));
  }, []);

  // ── APPLY MATERIAL ────────────────────────────────────────────
  const applyMat = useCallback((mid) => {
    setActMat(mid);
    const obj = selRef.current; if (!obj) return;
    obj.userData.matId = mid;
    if (obj.isGroup) {
      const body = obj.children.find(c=>c.userData.isBody);
      if (body) { body.material.dispose(); body.material = buildMat(mid, obj.userData.w, obj.userData.h); }
    } else {
      obj.material.dispose(); obj.material = buildMat(mid, obj.userData.w, obj.userData.h);
    }
    setSelData(d => ({...d, matId:mid}));
    const label = ALL_MAT_ITEMS.find(m=>m.id===mid)?.label || MATS_GLASS.find(m=>m.id===mid)?.label || mid;
    setStatus(`🎨 ${label}`);
  }, []);

  // ── APPLY FRONT MATERIAL (gaveta) ────────────────────────────
  const applyFrontMat = useCallback((mid) => {
    const obj = selRef.current; if (!obj?.isGroup) return;
    obj.userData.frontMatId = mid;
    const front = obj.children.find(c=>c.userData.isFront);
    if (front) { front.material.dispose(); front.material = buildMat(mid, obj.userData.w, obj.userData.h); }
    setSelData(d => ({...d, frontMatId: mid}));
    const label = ALL_MAT_ITEMS.find(m=>m.id===mid)?.label || mid;
    setStatus(`🎨 Frente: ${label}`);
  }, []);
  const toggleOpen = useCallback(() => {
    const obj = selRef.current; if (!obj) return;
    toggleOpenClose(obj);
    setSelData(d => ({...d, isOpen: obj.userData.isOpen}));
    setStatus(obj.userData.isOpen ? `🔓 Abrindo ${obj.userData.label}...` : `🔒 Fechando ${obj.userData.label}...`);
  }, []);

  // ── TOGGLE MAÇANETA ───────────────────────────────────────────
  const toggleHandle = useCallback(() => {
    const obj = selRef.current; if (!obj?.isGroup) return;
    const handle = obj.children.find(c => c.userData.isHandle);
    if (!handle) return;
    const nowVisible = handle.visible;
    handle.visible = !nowVisible;
    obj.userData.hasHandle = !nowVisible;
    setSelData(d => ({...d, hasHandle: !nowVisible}));
    setStatus(!nowVisible ? `🔩 Maçaneta adicionada` : `🚫 Maçaneta removida`);
  }, []);

  // ── TOGGLE LADO DA PORTA ──────────────────────────────────────
  const toggleDoorSide = useCallback(() => {
    const obj = selRef.current; if (!obj?.userData) return;
    if (obj.userData.typeId !== "porta") return;
    // Se estiver aberta, fecha primeiro
    if (obj.userData.isOpen) {
      obj.userData.isOpen = false;
      obj.userData.openProgress = 0;
      obj.position.x = obj.userData.baseX;
      obj.position.z = obj.userData.baseZ;
      obj.rotation.y = obj.userData.baseRY;
      animSet.delete(obj);
    }
    const newSide = obj.userData.doorSide === "right" ? "left" : "right";
    obj.userData.doorSide = newSide;
    setSelData(d => ({...d, doorSide: newSide, isOpen: false}));
    setStatus(`🚪 Dobradiça: ${newSide === "left" ? "Esquerda" : "Direita"}`);
  }, []);

  // ── SET VIEW ──────────────────────────────────────────────────
  const setView = useCallback((v) => {
    const s = sph.current; s.cx=0; s.cy=0.4; s.cz=0;
    if (v==="iso")   { s.phi=0.65; s.theta=0.8;        s.radius=3.5; }
    if (v==="top")   { s.phi=0.06; s.theta=0;          s.radius=3.5; }
    if (v==="front") { s.phi=1.52; s.theta=0;          s.radius=3.5; }
    if (v==="back")  { s.phi=1.52; s.theta=Math.PI;    s.radius=3.5; }
    if (v==="left")  { s.phi=1.52; s.theta=-Math.PI/2; s.radius=3.5; }
    if (v==="right") { s.phi=1.52; s.theta= Math.PI/2; s.radius=3.5; }
    updateCam();
  }, [updateCam]);

  // ── SELECT FROM LIST ──────────────────────────────────────────
  const selFromList = useCallback((id) => {
    const obj = piecesRef.current.find(p=>p.userData.id===id);
    if (obj) selectObj(obj);
  }, [selectObj]);

  // ── RENAME ────────────────────────────────────────────────────
  const startRename = useCallback((id, label, e) => {
    e.stopPropagation();
    setEditingId(id); setEditingName(label);
    setTimeout(()=>renameRef.current?.focus(), 30);
  }, []);

  const confirmRename = useCallback(() => {
    const name = editingName.trim(); if (!name) { setEditingId(null); return; }
    const obj = piecesRef.current.find(p=>p.userData.id===editingId);
    if (obj) obj.userData.label = name;
    setPieces(prev => prev.map(p => p.id===editingId ? {...p, label:name} : p));
    if (selRef.current?.userData.id===editingId) setSelData(d=>({...d, label:name}));
    setEditingId(null);
    setStatus(`✏ Renomeado: ${name}`);
  }, [editingId, editingName]);

  // ── HELPERS ───────────────────────────────────────────────────
  const cm  = v => v !== undefined ? Math.round(v * 100) : 0;
  const R   = v => Math.round(v);
  const tIcon = id => PTYPES.find(t=>t.id===id)?.icon || "▭";
  const isMovable = selData?.typeId==="gaveta" || selData?.typeId==="porta";

  // ══════════════════════════════════════════════════════════════
  // RENDER
  // ══════════════════════════════════════════════════════════════
  return (
    <div style={{display:"flex",width:"100vw",height:"100vh",background:"#0c0c14",
      fontFamily:"'Segoe UI',sans-serif",color:"#ddd8cc",overflow:"hidden"}}>

      {/* ═══ SIDEBAR ═══ */}
      <div style={{width:250,background:"#0e0e1c",borderRight:"1px solid #1e2040",
        display:"flex",flexDirection:"column",overflowY:"auto",flexShrink:0,zIndex:10}}>

        {/* Logo */}
        <div style={{padding:"14px 16px 10px",borderBottom:"1px solid #1e2040",
          background:"linear-gradient(135deg,#141428,#1a1a34)"}}>
          <div style={{fontSize:18,fontWeight:800,color:"#c8a060",lineHeight:1.2}}>Móveis sob medida</div>
          <div style={{fontSize:13,letterSpacing:3,color:"#f0c040",textTransform:"uppercase",marginTop:3}}>Modelare</div>
        </div>

        {/* Tabs */}
        <div style={{display:"flex",borderBottom:"1px solid #1e2040",flexShrink:0}}>
          {[["add","Construir"],["edit","Editar"],["mat","Material"],["cam","Vista"]].map(([k,l])=>(
            <div key={k} onClick={()=>setTab(k)} style={{flex:1,padding:"7px 0",textAlign:"center",
              fontSize:9,cursor:"pointer",letterSpacing:0.5,
              background:tab===k?"#1a2240":"transparent",
              borderBottom:tab===k?"2px solid #4a7aaa":"2px solid transparent",
              color:tab===k?"#8ab8e0":"#3a5060",transition:"all 0.12s"}}>{l}</div>
          ))}
        </div>

        {/* ── CONSTRUIR ── */}
        {tab==="add" && <>
          <S>
            <SL>Tipo de Peça</SL>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:4,marginBottom:8}}>
              {PTYPES.map(t=>(
                <div key={t.id} onClick={()=>setActType(t.id)} style={{
                  padding:"6px 4px",borderRadius:5,cursor:"pointer",textAlign:"center",
                  background:actType===t.id?"#182838":"#101020",
                  border:`1px solid ${actType===t.id?"#3a6a9a":"#1e2030"}`,transition:"all 0.12s"}}>
                  <div style={{fontSize:15}}>{t.icon}</div>
                  <div style={{fontSize:9,color:actType===t.id?"#7ab0e0":"#5a6a7a",marginTop:2,lineHeight:1.1}}>{t.label}</div>
                </div>
              ))}
            </div>
            <PBtn onClick={addPiece} c="#2a5a3a">➕ Adicionar {PTYPES.find(t=>t.id===actType)?.label}</PBtn>
            <PBtn onClick={dupSel} c="#2a4a6a" disabled={!selId}>📋 Duplicar Selecionada</PBtn>
            <PBtn onClick={delSel} c="#5a2a2a" disabled={!selId}>✕ Remover Selecionada</PBtn>
          </S>

          <S>
            <SL>Peças ({pieces.length})</SL>
            <div style={{maxHeight:170,overflowY:"auto"}}>
              {pieces.length===0 && <div style={{fontSize:10,color:"#3a4a5a",padding:"8px 0",textAlign:"center"}}>Nenhuma peça</div>}
              {pieces.map(p=>(
                <div key={p.id} onClick={()=>{ if(editingId!==p.id) selFromList(p.id); }}
                  style={{display:"flex",alignItems:"center",gap:5,padding:"3px 5px 3px 7px",marginBottom:2,
                    borderRadius:4,cursor:"pointer",
                    background:selId===p.id?"#1a3050":"#101018",
                    border:`1px solid ${selId===p.id?"#3a6090":"#1a1a28"}`,fontSize:11}}>
                  <span style={{fontSize:12,flexShrink:0}}>{tIcon(p.typeId)}</span>
                  {editingId===p.id
                    ? <input ref={renameRef} value={editingName}
                        onChange={e=>setEditingName(e.target.value)}
                        onBlur={confirmRename}
                        onKeyDown={e=>{if(e.key==="Enter")confirmRename();if(e.key==="Escape")setEditingId(null);}}
                        onClick={e=>e.stopPropagation()}
                        style={{flex:1,background:"#0a1828",border:"1px solid #3a6090",borderRadius:3,
                          color:"#a0d0ff",fontSize:11,padding:"2px 5px",outline:"none",minWidth:0}}/>
                    : <span style={{flex:1,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",
                        color:selId===p.id?"#80b8f0":"#607080"}}>{p.label}</span>
                  }
                  {editingId!==p.id &&
                    <span onClick={e=>startRename(p.id,p.label,e)} title="Renomear"
                      style={{flexShrink:0,fontSize:11,color:"#3a5a7a",padding:"1px 4px",
                        borderRadius:3,cursor:"pointer",
                        background:selId===p.id?"#1e3a5a":"transparent"}}>✏</span>
                  }
                  {editingId!==p.id &&
                    <span onClick={e=>{e.stopPropagation(); selFromList(p.id); setTimeout(dupSel,30);}} title="Duplicar"
                      style={{flexShrink:0,fontSize:11,color:"#3a6a4a",padding:"1px 4px",
                        borderRadius:3,cursor:"pointer",
                        background:selId===p.id?"#1a3a2a":"transparent"}}>📋</span>
                  }
                </div>
              ))}
            </div>
          </S>
        </>}

        {/* ── EDITAR ── */}
        {tab==="edit" && <>
          {!selId && <NoSel/>}
          {selData && <>
            {/* Nome */}
            <S>
              <SL>Nome da Peça</SL>
              {editingId===selData.id
                ? <div style={{display:"flex",gap:4}}>
                    <input ref={renameRef} value={editingName}
                      onChange={e=>setEditingName(e.target.value)}
                      onBlur={confirmRename}
                      onKeyDown={e=>{if(e.key==="Enter")confirmRename();if(e.key==="Escape")setEditingId(null);}}
                      style={{flex:1,background:"#0a1828",border:"1px solid #3a6090",borderRadius:4,
                        color:"#a0d0ff",fontSize:12,padding:"5px 7px",outline:"none"}}/>
                    <div onClick={confirmRename} style={{padding:"5px 8px",background:"#1a4a2a",
                      border:"1px solid #2a7a3a",borderRadius:4,cursor:"pointer",fontSize:11,color:"#70c080"}}>✓</div>
                  </div>
                : <div style={{display:"flex",alignItems:"center",gap:6,padding:"5px 8px",
                    background:"#0e1828",border:"1px solid #2a3a4a",borderRadius:4}}>
                    <span style={{flex:1,fontSize:12,color:"#80a8d0",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>
                      {selData.label}
                    </span>
                    <span onClick={e=>startRename(selData.id,selData.label,e)}
                      style={{fontSize:12,color:"#4a7aaa",cursor:"pointer",padding:"0 2px"}}>✏</span>
                  </div>
              }
            </S>

            {/* Dimensões */}
            <S>
              <SL>Dimensões (cm)</SL>
              {[["w","↔ Largura"],["h","↕ Altura"],["d","↗ Profundidade"]].map(([ax,lb])=>(
                <DI key={ax} label={lb} value={cm(selData[ax])} onChange={v=>updateDim(ax,v)}/>
              ))}
              <div style={{fontSize:10,color:"#3a6a3a",background:"#0a140a",borderRadius:4,
                padding:"4px 8px",border:"1px solid #1a3a1a",marginTop:2}}>
                📦 {cm(selData.w)} × {cm(selData.h)} × {cm(selData.d)} cm
              </div>
            </S>

            {/* Abrir/Fechar + Maçaneta */}
            {isMovable && (
              <S>
                <SL>{selData.typeId==="gaveta"?"🗄 Gaveta":"🚪 Porta"} — Animação</SL>

                {/* Abrir/Fechar */}
                <div onClick={toggleOpen} style={{
                  display:"flex",alignItems:"center",gap:10,
                  padding:"9px 12px",borderRadius:7,cursor:"pointer",marginBottom:6,
                  background:selData.isOpen?"#142814":"#141428",
                  border:`2px solid ${selData.isOpen?"#3a8a3a":"#3a3a8a"}`,
                  transition:"all 0.2s"}}>
                  <span style={{fontSize:20}}>{selData.isOpen?"🔓":"🔒"}</span>
                  <div style={{flex:1}}>
                    <div style={{fontSize:12,fontWeight:600,color:selData.isOpen?"#70d070":"#7090d0"}}>
                      {selData.isOpen?"Aberta/Aberto":"Fechada/Fechado"}
                    </div>
                    <div style={{fontSize:9,color:"#4a6060"}}>
                      clique para {selData.isOpen?"fechar":"abrir"}
                    </div>
                  </div>
                  <span style={{fontSize:10,color:selData.isOpen?"#3a7a3a":"#3a3a7a"}}>
                    {selData.typeId==="gaveta"?"↔ desliza":"↻ 110°"}
                  </span>
                </div>

                {/* Maçaneta/Puxador */}
                <div onClick={toggleHandle} style={{
                  display:"flex",alignItems:"center",gap:10,
                  padding:"9px 12px",borderRadius:7,cursor:"pointer",
                  marginBottom: selData.typeId==="porta" ? 6 : 0,
                  background:selData.hasHandle?"#1a1a14":"#141414",
                  border:`2px solid ${selData.hasHandle?"#7a6a2a":"#3a3a2a"}`,
                  transition:"all 0.2s"}}>
                  <span style={{fontSize:20}}>🔩</span>
                  <div style={{flex:1}}>
                    <div style={{fontSize:12,fontWeight:600,color:selData.hasHandle?"#c8a040":"#505040"}}>
                      {selData.hasHandle?"Com Puxador":"Sem Puxador"}
                    </div>
                    <div style={{fontSize:9,color:"#4a6060"}}>
                      clique para {selData.hasHandle?"remover":"adicionar"}
                    </div>
                  </div>
                  <span style={{fontSize:10,color:selData.hasHandle?"#6a5020":"#303020"}}>
                    {selData.hasHandle?"visible":"hidden"}
                  </span>
                </div>

                {/* Lado da dobradiça — só porta */}
                {selData.typeId==="porta" && (
                  <div style={{marginTop:2}}>
                    <SL>Dobradiça</SL>
                    <div style={{display:"flex",gap:4}}>
                      {[["left","◁ Esquerda"],["right","Direita ▷"]].map(([side,label])=>(
                        <div key={side} onClick={()=>{
                          const obj = selRef.current;
                          if (obj && obj.userData.doorSide !== side) toggleDoorSide();
                        }} style={{
                          flex:1,padding:"8px 4px",borderRadius:6,cursor:"pointer",textAlign:"center",
                          background:selData.doorSide===side?"#1a2838":"#101018",
                          border:`2px solid ${selData.doorSide===side?"#4a8aaa":"#2a2a3a"}`,
                          transition:"all 0.15s"}}>
                          <div style={{fontSize:14}}>{side==="left"?"🚪⬅":"➡🚪"}</div>
                          <div style={{fontSize:9,color:selData.doorSide===side?"#80c0e0":"#506070",marginTop:2}}>
                            {label}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </S>
            )}

            {/* Rotação */}
            <S>
              <SL>Rotação 360°</SL>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:5,marginBottom:8}}>
                {[["rx","X 🔴"],["ry","Y 🟢"],["rz","Z 🔵"]].map(([ax,lb])=>(
                  <div key={ax}>
                    <div style={{fontSize:9,color:"#5a6a7a",marginBottom:3,textAlign:"center"}}>{lb}</div>
                    <input type="number" min={-180} max={180} step={5}
                      value={selData[ax]||0} onChange={e=>updateRot(ax,e.target.value)}
                      style={{width:"100%",padding:"5px 2px",borderRadius:4,textAlign:"center",
                        background:"#090916",border:"1px solid #2a3a5a",color:"#90c0ff",
                        fontSize:12,boxSizing:"border-box",outline:"none"}}/>
                  </div>
                ))}
              </div>
              <SL>Rápido</SL>
              <div style={{display:"flex",flexWrap:"wrap",gap:3}}>
                {[["Flat","rx",-90],["Pé","rx",0],["Deit.","rx",90],
                  ["⟳90°Y","ry",90],["⟳180°Y","ry",180],["⟲90°Z","rz",90]].map(([l,ax,v])=>(
                  <QB key={l} onClick={()=>updateRot(ax,v)}>{l}</QB>
                ))}
              </div>
            </S>

            {/* Posição Y */}
            <S>
              <SL>Altura do Chão (cm)</SL>
              <DI label="↑ Distância do chão" value={selData.py ?? 0} onChange={updateY}/>
            </S>
          </>}
        </>}

        {/* ── MATERIAL ── */}
        {tab==="mat" && <>
          {!selId && <NoSel msg="Selecione uma peça"/>}

          {/* Seletor corpo/frente — só gaveta */}
          {selData?.typeId==="gaveta" && (
            <S>
              <SL>Aplicar em</SL>
              <div style={{display:"flex",gap:4}}>
                {[["corpo","🗄 Corpo"],["frente","⬜ Frente"]].map(([k,l])=>(
                  <div key={k} onClick={()=>setMatTarget(k)} style={{
                    flex:1,padding:"7px 4px",borderRadius:5,cursor:"pointer",textAlign:"center",
                    background:matTarget===k?"#1a2838":"#101018",
                    border:`1px solid ${matTarget===k?"#3a7aaa":"#1e2030"}`,
                    fontSize:11,color:matTarget===k?"#80b8e0":"#4a6070",transition:"all 0.12s"}}>
                    {l}
                  </div>
                ))}
              </div>
              {matTarget==="frente" && (
                <div style={{marginTop:6,padding:"5px 8px",background:"#0e1420",
                  border:"1px solid #2a3a4a",borderRadius:5,fontSize:10,color:"#6090a0"}}>
                  Cor atual da frente: <span style={{color:"#a0c8e0",fontWeight:600}}>
                    {ALL_MAT_ITEMS.find(m=>m.id===selData.frontMatId)?.label || selData.frontMatId}
                  </span>
                </div>
              )}
            </S>
          )}

          <S>
            <SL>Buscar</SL>
            <input placeholder="ex: Freijó, Branco, Cinza..."
              value={matSearch} onChange={e=>setMatSearch(e.target.value)}
              style={{width:"100%",padding:"5px 8px",borderRadius:4,background:"#090916",
                border:"1px solid #2a3a5a",color:"#90b8e0",fontSize:11,
                boxSizing:"border-box",outline:"none"}}/>
          </S>
          <div style={{overflowY:"auto",flex:1}}>
            {MAT_GROUPS.map(g=>{
              const items = g.items.filter(m=>
                !matSearch || m.label.toLowerCase().includes(matSearch.toLowerCase())
              );
              if (!items.length) return null;
              const onSel = (selData?.typeId==="gaveta" && matTarget==="frente") ? applyFrontMat : applyMat;
              const activeMid = (selData?.typeId==="gaveta" && matTarget==="frente") ? selData?.frontMatId : actMat;
              return <S key={g.group}>
                <SL>{g.group}</SL>
                {items.map(m=><MI key={m.id} m={m} active={activeMid} onSel={onSel}/>)}
              </S>;
            })}
            <S>
              <SL>Vidros</SL>
              {(() => {
                const onSel = (selData?.typeId==="gaveta" && matTarget==="frente") ? applyFrontMat : applyMat;
                const activeMid = (selData?.typeId==="gaveta" && matTarget==="frente") ? selData?.frontMatId : actMat;
                return MATS_GLASS.map(m=><MI key={m.id} m={m} active={activeMid} onSel={onSel} glass/>);
              })()}
            </S>
          </div>
        </>}

        {/* ── VISTA ── */}
        {tab==="cam" && <>
          <S>
            <SL>Câmera</SL>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:4}}>
              {[["iso","⬡ Iso"],["top","⬆ Cima"],["front","◼ Frente"],
                ["back","◻ Atrás"],["left","◁ Esq"],["right","▷ Dir"]].map(([v,l])=>(
                <div key={v} onClick={()=>setView(v)} style={{padding:"7px 4px",textAlign:"center",
                  borderRadius:5,cursor:"pointer",background:"#101020",border:"1px solid #1e2a3a",
                  fontSize:11,color:"#6080a0",transition:"all 0.12s"}}>{l}</div>
              ))}
            </div>
          </S>
          <S>
            <SL>Controles</SL>
            <div style={{fontSize:10,color:"#445566",lineHeight:2.0}}>
              <div>🖱 Esq → Selecionar / Mover</div>
              <div>🖱 Dir → Orbitar câmera</div>
              <div>🖱 Alt+Esq / Meio → Pan</div>
              <div>🖱 Scroll → Zoom</div>
              <div>🧲 Snap de faces automático</div>
            </div>
          </S>
        </>}
      </div>

      {/* ═══ VIEWPORT ═══ */}
      <div style={{flex:1,display:"flex",flexDirection:"column",position:"relative",overflow:"hidden"}}>

        {/* top bar */}
        <div style={{height:30,background:"#0c0c18",borderBottom:"1px solid #181828",flexShrink:0,
          display:"flex",alignItems:"center",padding:"0 14px",gap:8,fontSize:10,color:"#2a4050"}}>
          <span style={{color:"#2a4a6a",fontSize:12}}>◈</span>
          <span style={{color:"#3a5a6a"}}>VIEWPORT 3D</span>
          <span style={{color:"#182028"}}>│</span>
          <span>Dir: orbitar · Alt: pan · Scroll: zoom · Esq: selecionar/mover</span>
          {selId && <span style={{marginLeft:"auto",color:"#3a7a5a",fontSize:11}}>✓ {selData?.label}</span>}
        </div>

        {/* canvas */}
        <div ref={mountRef} style={{flex:1}}
          onMouseDown={onMD} onMouseMove={onMM} onMouseUp={onMU} onMouseLeave={onMU}
          onWheel={onWheel} onContextMenu={e=>e.preventDefault()}/>

        {/* status */}
        <div style={{height:22,background:"#080810",borderTop:"1px solid #121222",flexShrink:0,
          display:"flex",alignItems:"center",padding:"0 14px",fontSize:10}}>
          <span style={{color:"#3a6a40",marginRight:8}}>●</span>
          <span style={{color:"#4a6a50"}}>{status}</span>
          <span style={{marginLeft:"auto",color:"#2a3a3a"}}>Peças: {pieces.length}</span>
        </div>

        {/* HUD rotação */}
        {selData && (
          <div style={{position:"absolute",top:38,right:10,pointerEvents:"none",
            background:"#0808168a",border:"1px solid #1e2a3a",borderRadius:8,
            padding:"7px 11px",fontSize:10,lineHeight:1.9}}>
            <div style={{color:"#3a5a7a",fontSize:8,letterSpacing:1,marginBottom:2}}>ROT.</div>
            <div style={{color:"#dd5555"}}>X {selData.rx||0}°</div>
            <div style={{color:"#55dd55"}}>Y {selData.ry||0}°</div>
            <div style={{color:"#5555dd"}}>Z {selData.rz||0}°</div>
          </div>
        )}

        {/* Botões flutuantes */}
        {selId && (
          <div style={{position:"absolute",bottom:30,right:10,display:"flex",gap:4,pointerEvents:"all",alignItems:"center"}}>
            {/* Duplicar */}
            <div onClick={dupSel} title="Duplicar peça" style={{
              width:32,height:32,borderRadius:6,background:"#0e1a10",border:"1px solid #2a5a30",
              display:"flex",alignItems:"center",justifyContent:"center",
              cursor:"pointer",fontSize:14,userSelect:"none"}}>📋</div>
            {isMovable && <>
              <div onClick={toggleOpen} style={{
                height:32,padding:"0 10px",borderRadius:6,display:"flex",alignItems:"center",gap:5,
                background:selData?.isOpen?"#0e2a0e":"#0e0e28",
                border:`1px solid ${selData?.isOpen?"#2a7a2a":"#2a2a7a"}`,
                cursor:"pointer",fontSize:11,
                color:selData?.isOpen?"#60d060":"#6060d0",userSelect:"none"}}>
                <span>{selData?.isOpen?"🔓":"🔒"}</span>
                <span>{selData?.isOpen?"Fechar":"Abrir"}</span>
              </div>
              <div onClick={toggleHandle} title={selData?.hasHandle?"Remover puxador":"Adicionar puxador"} style={{
                width:32,height:32,borderRadius:6,display:"flex",alignItems:"center",justifyContent:"center",
                background:selData?.hasHandle?"#1a1a0e":"#0e0e0e",
                border:`1px solid ${selData?.hasHandle?"#6a5a1a":"#2a2a1a"}`,
                cursor:"pointer",fontSize:15,userSelect:"none",
                opacity:selData?.hasHandle?1:0.45}}>
                🔩
              </div>
            </>}
            {[["↺Y","ry",-90],["↻Y","ry",90],["↑X","rx",-90],["↓X","rx",90]].map(([l,ax,v])=>(
              <div key={l} onClick={()=>updateRot(ax,(selData?.[ax]||0)+v)} style={{
                width:32,height:32,borderRadius:6,background:"#0e1828",border:"1px solid #2a4060",
                display:"flex",alignItems:"center",justifyContent:"center",
                cursor:"pointer",fontSize:13,color:"#6090c0",userSelect:"none"}}>{l}</div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// UI COMPONENTS
// ─────────────────────────────────────────────
function S({children})  { return <div style={{padding:"10px 12px 6px",borderBottom:"1px solid #141428"}}>{children}</div>; }
function SL({children}) { return <div style={{fontSize:9,letterSpacing:2,color:"#3a5060",textTransform:"uppercase",marginBottom:5,marginTop:2}}>{children}</div>; }

function PBtn({children, onClick, c="#1e3a5a", disabled}) {
  return (
    <div onClick={disabled?undefined:onClick} style={{
      padding:"7px 10px",marginBottom:4,borderRadius:5,
      cursor:disabled?"not-allowed":"pointer",
      background:disabled?"#0e0e18":`${c}55`,
      border:`1px solid ${disabled?"#1a1a2a":`${c}99`}`,
      fontSize:11,color:disabled?"#3a3a4a":"#aacccc",
      textAlign:"center",opacity:disabled?0.5:1,transition:"all 0.12s"
    }}>{children}</div>
  );
}

function DI({label, value, onChange}) {
  return (
    <div style={{marginBottom:6}}>
      <div style={{fontSize:9,color:"#4a6070",marginBottom:2}}>{label}</div>
      <input type="number" min="0" max="600" step="1" value={value}
        onChange={e=>onChange(e.target.value)}
        style={{width:"100%",padding:"5px 7px",borderRadius:4,background:"#090916",
          border:"1px solid #2a3a5a",color:"#90b8e0",fontSize:12,
          boxSizing:"border-box",outline:"none"}}/>
    </div>
  );
}

function MI({m, active, onSel, glass}) {
  const on = active===m.id;
  return (
    <div onClick={()=>onSel(m.id)} style={{
      display:"flex",alignItems:"center",gap:8,padding:"5px 8px",marginBottom:3,
      borderRadius:5,cursor:"pointer",
      background:on?"#141e2a":"#0e0e18",
      border:`1px solid ${on?"#3a6080":"#1a1a28"}`,transition:"all 0.12s"}}>
      <div style={{width:18,height:18,borderRadius:3,background:m.color,
        border:"1px solid #ffffff18",flexShrink:0,opacity:glass?0.7:1}}/>
      <span style={{fontSize:11,color:on?"#80b0d8":"#607080",flex:1}}>{m.label}</span>
      {glass && <span style={{fontSize:8,color:"#3a7a9a"}}>vidro</span>}
    </div>
  );
}

function QB({children, onClick}) {
  return (
    <div onClick={onClick} style={{padding:"3px 7px",borderRadius:3,cursor:"pointer",
      fontSize:9,background:"#101828",border:"1px solid #1e3048",color:"#6090b0",whiteSpace:"nowrap"}}>
      {children}
    </div>
  );
}

function NoSel({msg="Selecione uma peça na cena"}) {
  return (
    <div style={{margin:"12px",padding:"10px",background:"#0e1420",border:"1px solid #2a3a4a",
      borderRadius:6,fontSize:11,color:"#4a6070",textAlign:"center"}}>← {msg}</div>
  );
}
