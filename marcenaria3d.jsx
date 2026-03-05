import { useState, useEffect, useRef, useCallback } from "react";
import * as THREE from "three";

// ─────────────────────────────────────────────
// TEXTURAS — canvas cacheado + THREE.CanvasTexture cacheado na GPU
// ─────────────────────────────────────────────
const _canvasCache = {}; // cache do canvas 2D
const _texCache    = {}; // cache da CanvasTexture (GPU) — evita VRAM duplicada

function woodCanvas(type) {
  if (_canvasCache[type]) return _canvasCache[type];
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
  _canvasCache[type] = cv; return cv;
}

// Reutiliza a mesma CanvasTexture na GPU — só atualiza repeat por material
function makeTex(key, w, h) {
  if (!_texCache[key]) {
    const t = new THREE.CanvasTexture(woodCanvas(key));
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    _texCache[key] = t;
  }
  const t = _texCache[key].clone(); // clone leve: compartilha GPU buffer, repeat independente
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(w/0.5, h/0.5);
  t.needsUpdate = false;
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
// CANALETAS (trilhos) para porta de correr
// ─────────────────────────────────────────────
function makeTrack(pW, pH, pD) {
  const g = new THREE.Group();
  g.userData.isTrack = true;
  const metalMat = new THREE.MeshStandardMaterial({color:0xb0b8c8, roughness:0.2, metalness:0.85});
  const trackW = pW + 0.012; // um pouco mais largo que a porta
  const trackT = 0.006;      // espessura do trilho
  const trackD = 0.014;      // profundidade do canal

  // Trilho superior
  const topGeo = new THREE.BoxGeometry(trackW, trackT, trackD);
  const top = new THREE.Mesh(topGeo, metalMat);
  top.position.set(0, pH/2 + trackT/2, 0);
  top.castShadow = true;

  // Trilho inferior
  const botGeo = new THREE.BoxGeometry(trackW, trackT, trackD);
  const bot = new THREE.Mesh(botGeo, metalMat);
  bot.position.set(0, -pH/2 - trackT/2, 0);
  bot.castShadow = true;

  // Canal guia superior (rebaixo visível)
  const chanMat = new THREE.MeshStandardMaterial({color:0x606878, roughness:0.4, metalness:0.6});
  const chanH  = trackT * 0.5;
  const chanTop = new THREE.Mesh(new THREE.BoxGeometry(trackW - 0.004, chanH, trackD * 0.4), chanMat);
  chanTop.position.set(0, pH/2 + trackT - chanH/2, 0);

  const chanBot = new THREE.Mesh(new THREE.BoxGeometry(trackW - 0.004, chanH, trackD * 0.4), chanMat);
  chanBot.position.set(0, -pH/2 - trackT + chanH/2, 0);

  [top, bot, chanTop, chanBot].forEach(m => g.add(m));
  return g;
}
// ID único seguro: baseado em timestamp — evita colisão ao recarregar
let GID = Date.now();
const animSet = new Set(); // peças em animação

function makePiece(typeId, matId, x=0, y=0, z=0) {
  const tp = PTYPES.find(t=>t.id===typeId) || PTYPES[0];
  // Fix: usa string vazia como fallback para evitar crash em startsWith
  const mid = (typeId==="vidro" && !(matId||"").startsWith("vidro")) ? "vidro_c" : (matId||"ps_freijo");
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
      // Canaletas — adicionadas sempre, visibilidade controlada por doorType
      const track = makeTrack(w, h, d);
      track.visible = false; // default: porta de abrir, sem trilho
      grp.add(track);
    }

    grp.add(makeHandle(w, h, d));

    grp.userData = {
      id, typeId, matId:mid,
      frontMatId: mid,
      w, h, d,
      rx:0, ry:0, rz:0,
      label:`${tp.label} ${id}`,
      isOpen:false, openProgress:0,
      baseX:x, baseZ:z, baseRY:0,
      hasHandle: true,
      doorSide: "left",   // "left" | "right" — para porta de abrir
      doorType: "hinged", // "hinged" | "sliding"
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
    // rebuild track (porta de correr)
    if (typeId === "porta") {
      const oldT = obj.children.find(c=>c.userData.isTrack);
      if (oldT) {
        oldT.traverse(c=>{ if(c.isMesh){c.geometry.dispose(); c.material.dispose();} });
        obj.remove(oldT);
      }
      const newT = makeTrack(w, h, d);
      newT.visible = obj.userData.doorType === "sliding";
      obj.add(newT);
    }
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
      if (ud.doorType === "sliding") {
        // Porta de correr: desliza em X pela largura da porta
        const dir = ud.doorSide === "right" ? 1 : -1;
        obj.position.x = ud.baseX + ud.openProgress * ud.w * dir;
        obj.rotation.y  = ud.baseRY; // sem rotação
        obj.position.z  = ud.baseZ;
      } else {
        applyDoorTransform(obj, ud.openProgress);
      }
    }

    if (Math.abs(ud.openProgress - target) < 0.003) {
      ud.openProgress = target;
      if (ud.typeId === "gaveta") {
        obj.position.z = ud.baseZ + target * ud.d * 0.85;
      } else if (ud.typeId === "porta") {
        if (ud.doorType === "sliding") {
          const dir = ud.doorSide === "right" ? 1 : -1;
          obj.position.x = ud.baseX + target * ud.w * dir;
          obj.rotation.y = ud.baseRY;
          obj.position.z = ud.baseZ;
        } else {
          applyDoorTransform(obj, target);
        }
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
    return { size: new THREE.Vector3(w + 0.008, h + 0.008, d + 0.008), center: obj.position.clone() };
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
// SNAP — grade de 5cm + snap magnético entre peças (estilo SketchUp)
// ─────────────────────────────────────────────
const GRID = 0.05;
function snapGrid(v, g=GRID) { return Math.round(v/g)*g; }

// Retorna Box3 usando userData.w/h/d (sem percorrer geometrias — muito mais leve)
function fastBox(obj) {
  const {w=0.1, h=0.1, d=0.1} = obj.userData;
  const p = obj.position;
  return new THREE.Box3(
    new THREE.Vector3(p.x - w/2, p.y - h/2, p.z - d/2),
    new THREE.Vector3(p.x + w/2, p.y + h/2, p.z + d/2)
  );
}

// Snap magnético entre bordas de peças — estilo SketchUp
const SNAP_MAG = 0.04; // 4cm de alcance magnético
function edgeSnap(moving, others) {
  const mw = moving.userData.w || 0.1;
  const md = moving.userData.d || 0.1;
  const px = moving.position.x;
  const pz = moving.position.z;
  let bestX = null, bestZ = null, bdX = SNAP_MAG, bdZ = SNAP_MAG;

  for (const o of others) {
    if (o === moving) continue;
    const ow = o.userData.w || 0.1;
    const od = o.userData.d || 0.1;
    const ox = o.position.x;
    const oz = o.position.z;

    // Bordas em X: direita-esquerda e esquerda-direita
    const checksX = [
      (px + mw/2) - (ox - ow/2),  // borda dir moving → borda esq other
      (px - mw/2) - (ox + ow/2),  // borda esq moving → borda dir other
      px - ox,                     // centros alinhados em X
    ];
    for (const delta of checksX) {
      if (Math.abs(delta) < bdX) { bdX = Math.abs(delta); bestX = delta; }
    }

    // Bordas em Z
    const checksZ = [
      (pz + md/2) - (oz - od/2),
      (pz - md/2) - (oz + od/2),
      pz - oz,
    ];
    for (const delta of checksZ) {
      if (Math.abs(delta) < bdZ) { bdZ = Math.abs(delta); bestZ = delta; }
    }
  }

  if (bestX !== null) moving.position.x = snapGrid(moving.position.x - bestX);
  if (bestZ !== null) moving.position.z = snapGrid(moving.position.z - bestZ);
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

  // Preços editáveis globalmente
  const [prices, setPrices] = useState({
    chapaW: 2750,   // largura chapa mm
    chapaH: 1850,   // altura chapa mm
    priceM2: 145,   // R$/m² material
    fitaM: 0.85,    // R$/m fita de borda
    corteChapa: 18, // R$ por chapa (custo de corte/serra)
    moObraM2: 0,    // R$/m² mão de obra (opcional)
  });

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
    // Outline laranja = bloqueada, azul = livre
    const ol = sceneRef.current?.children?.find(c => c.userData[OUTLINE_TAG]);
    if (ol) ol.material.color.set(ud.locked ? 0xff8800 : 0x44aaff);
    setSelId(ud.id);
    setSelData({
      ...ud,
      py: Math.round(obj.position.y * 100),
      hasHandle: ud.hasHandle !== false,
      frontMatId: ud.frontMatId || ud.matId,
      doorSide: ud.doorSide || "left",
      doorType: ud.doorType || "hinged",
      locked: ud.locked || false,
    });
    setActMat(ud.matId);
    if (ud.typeId !== "gaveta") setMatTarget("corpo");
    setStatus(ud.locked ? `🔒 ${ud.label} (bloqueada)` : `✓ ${ud.label}`);
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
          // Peça bloqueada: seleciona mas não ativa drag
          if (target.userData.locked) return;
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
        // Snap magnético entre bordas de peças (leve — usa userData, não Box3)
        edgeSnap(selRef.current, piecesRef.current);
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
    const mid = (actType==="vidro" && !(actMat||"").startsWith("vidro")) ? "vidro_c" : (actMat||"ps_freijo");
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
    // Fix memory leak: descarta textura (map) antes do material
    obj.traverse(c => {
      if (c.isMesh) {
        c.geometry.dispose();
        if (Array.isArray(c.material)) {
          c.material.forEach(m => { if (m.map) m.map.dispose(); m.dispose(); });
        } else {
          if (c.material.map) c.material.map.dispose();
          c.material.dispose();
        }
      }
    });
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

  // ── TOGGLE LOCK (bloqueia movimentação) ───────────────────────
  const toggleLock = useCallback(() => {
    const obj = selRef.current; if (!obj?.userData) return;
    const nowLocked = !obj.userData.locked;
    obj.userData.locked = nowLocked;
    // Outline laranja quando bloqueado, azul quando livre
    const ol = sceneRef.current.children.find(c => c.userData[OUTLINE_TAG]);
    if (ol) ol.material.color.set(nowLocked ? 0xff8800 : 0x44aaff);
    setSelData(d => ({...d, locked: nowLocked}));
    // Atualiza lista de peças para refletir cadeado no nome
    setPieces(prev => prev.map(p =>
      p.id === obj.userData.id ? {...p, locked: nowLocked} : p
    ));
    setStatus(nowLocked ? `🔒 ${obj.userData.label} bloqueada` : `🔓 ${obj.userData.label} desbloqueada`);
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

  // ── TOGGLE TIPO DA PORTA (abrir / correr) ────────────────────
  const toggleDoorType = useCallback((newType) => {
    const obj = selRef.current; if (!obj?.userData) return;
    if (obj.userData.typeId !== "porta") return;
    // Fecha a porta antes de mudar o tipo
    if (obj.userData.isOpen) {
      obj.userData.isOpen = false;
      obj.userData.openProgress = 0;
      obj.position.x = obj.userData.baseX;
      obj.position.z = obj.userData.baseZ;
      obj.rotation.y = obj.userData.baseRY;
      animSet.delete(obj);
    }
    obj.userData.doorType = newType;
    // Mostra/oculta canaletas
    const track = obj.children.find(c => c.userData.isTrack);
    if (track) track.visible = (newType === "sliding");
    setSelData(d => ({...d, doorType: newType, isOpen: false}));
    setStatus(newType === "sliding" ? `🛤 Porta de correr (canaleta)` : `🚪 Porta de abrir (dobradiça)`);
  }, []);
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
        <div style={{display:"flex",borderBottom:"1px solid #1e2040",flexShrink:0,flexWrap:"wrap"}}>
          {[["add","🪚"],["edit","✏️"],["mat","🎨"],["cam","👁"],["cut","📐"]].map(([k,lbl])=>(
            <div key={k} onClick={()=>setTab(k)} style={{flex:1,padding:"7px 0",textAlign:"center",
              fontSize:11,cursor:"pointer",
              background:tab===k?"#1a2240":"transparent",
              borderBottom:tab===k?"2px solid #4a7aaa":"2px solid transparent",
              color:tab===k?"#8ab8e0":"#3a5060",transition:"all 0.12s"}}
              title={["Construir","Editar","Material","Vista","Plano de Corte"][["add","edit","mat","cam","cut"].indexOf(k)]}
            >{lbl}</div>
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
                <div key={p.id} onClick={()=>selFromList(p.id)}
                  style={{display:"flex",alignItems:"center",gap:6,padding:"5px 6px",
                    borderRadius:4,cursor:"pointer",marginBottom:2,
                    background:selId===p.id?"#0e1e30":"#0a0a18",
                    border:`1px solid ${selId===p.id?"#2a4a6a":"#141424"}`}}>
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
                  {editingId!==p.id && <>
                    <span onClick={e=>startRename(p.id,p.label,e)} title="Renomear"
                      style={{flexShrink:0,fontSize:11,color:"#3a5a7a",padding:"1px 4px",
                        borderRadius:3,cursor:"pointer",
                        background:selId===p.id?"#1e3a5a":"transparent"}}>✏</span>
                    <span onClick={e=>{e.stopPropagation();selFromList(p.id);setTimeout(dupSel,30);}} title="Duplicar"
                      style={{flexShrink:0,fontSize:11,color:"#3a6a4a",padding:"1px 4px",
                        borderRadius:3,cursor:"pointer",
                        background:selId===p.id?"#1a3a2a":"transparent"}}>📋</span>
                    <span onClick={e=>{e.stopPropagation();selFromList(p.id);setTimeout(toggleLock,30);}} title={p.locked?"Desbloquear":"Bloquear"}
                      style={{flexShrink:0,fontSize:11,padding:"1px 4px",borderRadius:3,cursor:"pointer",
                        color:p.locked?"#ff8800":"#3a5a6a",
                        background:p.locked?"#2a1800":selId===p.id?"#1a2a3a":"transparent"}}>
                      {p.locked?"🔒":"🔓"}
                    </span>
                  </>}
                </div>
              ))}
            </div>
          </S>
        </>}

        {/* ── EDITAR ── */}
        {tab==="edit" && <>
          {!selId && <NoSel/>}
          {selData && <>
            {/* Nome + Bloqueio */}
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
              {/* Botão de bloqueio */}
              <div onClick={toggleLock} style={{
                display:"flex",alignItems:"center",gap:8,marginTop:6,
                padding:"7px 10px",borderRadius:6,cursor:"pointer",
                background:selData.locked?"#1a0e00":"#0e1018",
                border:`2px solid ${selData.locked?"#cc6600":"#2a3a4a"}`,
                transition:"all 0.15s"}}>
                <span style={{fontSize:16}}>{selData.locked?"🔒":"🔓"}</span>
                <div style={{flex:1}}>
                  <div style={{fontSize:11,fontWeight:600,color:selData.locked?"#ff9900":"#4a7a9a"}}>
                    {selData.locked?"Peça Bloqueada":"Peça Livre"}
                  </div>
                  <div style={{fontSize:9,color:"#4a5a6a"}}>
                    {selData.locked?"não pode ser movida":"clique para bloquear"}
                  </div>
                </div>
                <span style={{fontSize:9,color:selData.locked?"#884400":"#2a4a5a"}}>
                  {selData.locked?"LOCK":"FREE"}
                </span>
              </div>
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

            {/* Animação — gaveta e porta */}
            {isMovable && (
              <S>
                <SL>{selData.typeId==="gaveta"?"🗄 Gaveta":"🚪 Porta"} — Animação</SL>

                {/* Tipo da porta — só porta */}
                {selData.typeId==="porta" && (
                  <div style={{marginBottom:6}}>
                    <SL>Tipo de Abertura</SL>
                    <div style={{display:"flex",gap:4}}>
                      {[["hinged","🚪 Dobradiça"],["sliding","🛤 Correr"]].map(([t,lbl])=>(
                        <div key={t} onClick={()=>toggleDoorType(t)} style={{
                          flex:1,padding:"8px 4px",borderRadius:6,cursor:"pointer",textAlign:"center",
                          background:selData.doorType===t?"#1a2030":"#0e0e18",
                          border:`2px solid ${selData.doorType===t?"#5a9aaa":"#252535"}`,
                          transition:"all 0.15s"}}>
                          <div style={{fontSize:16}}>{t==="hinged"?"🚪":"🛤"}</div>
                          <div style={{fontSize:9,color:selData.doorType===t?"#80c0d0":"#506070",marginTop:2}}>{lbl}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

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
                    <div style={{fontSize:9,color:"#4a6060"}}>clique para {selData.isOpen?"fechar":"abrir"}</div>
                  </div>
                  <span style={{fontSize:10,color:selData.isOpen?"#3a7a3a":"#3a3a7a"}}>
                    {selData.typeId==="gaveta"?"↔ desliza":selData.doorType==="sliding"?"↔ correr":"↻ 105°"}
                  </span>
                </div>

                {/* Maçaneta/Puxador */}
                <div onClick={toggleHandle} style={{
                  display:"flex",alignItems:"center",gap:10,
                  padding:"9px 12px",borderRadius:7,cursor:"pointer",
                  marginBottom:selData.typeId==="porta"?6:0,
                  background:selData.hasHandle?"#1a1a14":"#141414",
                  border:`2px solid ${selData.hasHandle?"#7a6a2a":"#3a3a2a"}`,
                  transition:"all 0.2s"}}>
                  <span style={{fontSize:20}}>🔩</span>
                  <div style={{flex:1}}>
                    <div style={{fontSize:12,fontWeight:600,color:selData.hasHandle?"#c8a040":"#505040"}}>
                      {selData.hasHandle?"Com Puxador":"Sem Puxador"}
                    </div>
                    <div style={{fontSize:9,color:"#4a6060"}}>clique para {selData.hasHandle?"remover":"adicionar"}</div>
                  </div>
                </div>

                {/* Lado da dobradiça — só porta de abrir */}
                {selData.typeId==="porta" && selData.doorType!=="sliding" && (
                  <div style={{marginTop:2}}>
                    <SL>Dobradiça</SL>
                    <div style={{display:"flex",gap:4}}>
                      {[["left","◁ Esquerda"],["right","Direita ▷"]].map(([side,lbl])=>(
                        <div key={side} onClick={()=>{
                          const obj=selRef.current;
                          if(obj && obj.userData.doorSide!==side) toggleDoorSide();
                        }} style={{
                          flex:1,padding:"8px 4px",borderRadius:6,cursor:"pointer",textAlign:"center",
                          background:selData.doorSide===side?"#1a2838":"#101018",
                          border:`2px solid ${selData.doorSide===side?"#4a8aaa":"#2a2a3a"}`,
                          transition:"all 0.15s"}}>
                          <div style={{fontSize:14}}>{side==="left"?"🚪⬅":"➡🚪"}</div>
                          <div style={{fontSize:9,color:selData.doorSide===side?"#80c0e0":"#506070",marginTop:2}}>{lbl}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Direção do deslize — só porta de correr */}
                {selData.typeId==="porta" && selData.doorType==="sliding" && (
                  <div style={{marginTop:2}}>
                    <SL>Desliza para</SL>
                    <div style={{display:"flex",gap:4}}>
                      {[["left","⬅ Esquerda"],["right","Direita ➡"]].map(([side,lbl])=>(
                        <div key={side} onClick={()=>{
                          const obj=selRef.current;
                          if(obj && obj.userData.doorSide!==side) toggleDoorSide();
                        }} style={{
                          flex:1,padding:"8px 4px",borderRadius:6,cursor:"pointer",textAlign:"center",
                          background:selData.doorSide===side?"#1a2838":"#101018",
                          border:`2px solid ${selData.doorSide===side?"#4a8aaa":"#2a2a3a"}`,
                          transition:"all 0.15s"}}>
                          <div style={{fontSize:14}}>{side==="left"?"⬅":"➡"}</div>
                          <div style={{fontSize:9,color:selData.doorSide===side?"#80c0e0":"#506070",marginTop:2}}>{lbl}</div>
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
              <DI label="↑ Distância do chão" value={selData.py??0} onChange={updateY}/>
            </S>
          </>}
        </>}

        {/* ── MATERIAL ── */}
        {tab==="mat" && <>
          {!selId && <NoSel msg="Selecione uma peça"/>}
          {selData && <>
            {/* Seletor Corpo/Frente — só gaveta */}
            {selData.typeId==="gaveta" && (
              <S>
                <SL>Aplicar Material em</SL>
                <div style={{display:"flex",gap:4,marginBottom:4}}>
                  {[["corpo","🗄 Corpo"],["frente","⬜ Frente"]].map(([t,lbl])=>(
                    <div key={t} onClick={()=>setMatTarget(t)} style={{
                      flex:1,padding:"7px 4px",borderRadius:5,cursor:"pointer",textAlign:"center",
                      background:matTarget===t?"#1a2838":"#101018",
                      border:`2px solid ${matTarget===t?"#3a7aaa":"#2a2a3a"}`,
                      fontSize:10,color:matTarget===t?"#80c0e0":"#506070",transition:"all 0.15s"}}>{lbl}</div>
                  ))}
                </div>
                {matTarget==="frente" && (
                  <div style={{fontSize:10,color:"#4a8ab0",background:"#0a1828",
                    padding:"4px 8px",borderRadius:4,border:"1px solid #1a3a5a"}}>
                    Frente: {ALL_MAT_ITEMS.find(m=>m.id===selData.frontMatId)?.label || selData.frontMatId}
                  </div>
                )}
              </S>
            )}
            {/* Busca */}
            <S>
              <SL>Buscar Material</SL>
              <input value={matSearch} onChange={e=>setMatSearch(e.target.value)}
                placeholder="ex: freijó, branco..." autoComplete="off"
                style={{width:"100%",padding:"6px 8px",background:"#0a1020",
                  border:"1px solid #2a3a5a",borderRadius:5,color:"#a0c8e0",
                  fontSize:11,boxSizing:"border-box",outline:"none"}}/>
            </S>
            {/* Catálogo */}
            {MAT_GROUPS.map(g=>{
              const filtered = g.items.filter(m=>
                !matSearch || m.label.toLowerCase().includes(matSearch.toLowerCase())
              );
              if(!filtered.length) return null;
              const activeMid = matTarget==="frente" ? selData.frontMatId : selData.matId;
              return (
                <S key={g.group}>
                  <SL>{g.group}</SL>
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:3}}>
                    {filtered.map(m=>(
                      <MI key={m.id} m={m} active={activeMid===m.id}
                        onSel={()=>matTarget==="frente"?applyFrontMat(m.id):applyMat(m.id)}/>
                    ))}
                  </div>
                </S>
              );
            })}
            {/* Vidros */}
            {selData.typeId==="vidro" && (
              <S>
                <SL>Vidros</SL>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:3}}>
                  {MATS_GLASS.filter(m=>
                    !matSearch||m.label.toLowerCase().includes(matSearch.toLowerCase())
                  ).map(m=>(
                    <MI key={m.id} m={m} active={selData.matId===m.id} glass
                      onSel={()=>applyMat(m.id)}/>
                  ))}
                </div>
              </S>
            )}
          </>}
        </>}

        {/* ── VISTA ── */}
        {tab==="cam" && (
          <S>
            <SL>Ângulo de Vista</SL>
            {[["iso","⬡ Isométrica"],["top","⬆ Topo"],["front","▣ Frontal"],
              ["back","▣ Traseira"],["left","◁ Esquerda"],["right","▷ Direita"]].map(([v,lbl])=>(
              <PBtn key={v} onClick={()=>setView(v)} c="#1a2a3a">{lbl}</PBtn>
            ))}
            <SL style={{marginTop:8}}>Zoom</SL>
            <div style={{display:"flex",gap:4}}>
              <PBtn onClick={()=>{sph.current.radius=Math.max(0.5,sph.current.radius-0.5);updateCam();}} c="#1a2a2a">🔍 +</PBtn>
              <PBtn onClick={()=>{sph.current.radius=Math.min(14,sph.current.radius+0.5);updateCam();}} c="#1a2a2a">🔍 −</PBtn>
            </div>
          </S>
        )}

        {/* ── PLANO DE CORTE + ORÇAMENTO ── */}
        {tab==="cut" && <CutTab prices={prices} setPrices={setPrices} piecesRef={piecesRef} selFromList={selFromList} toggleLock={toggleLock}/>}
      </div>

      {/* ═══ VIEWPORT ═══ */}
      <div style={{flex:1,position:"relative",display:"flex",flexDirection:"column"}}>
        <div ref={mountRef} style={{flex:1}}
          onMouseDown={onMD} onMouseMove={onMM} onMouseUp={onMU} onMouseLeave={onMU}
          onWheel={onWheel} onContextMenu={e=>e.preventDefault()}/>

        {/* Status bar */}
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
          <div style={{position:"absolute",bottom:30,right:10,display:"flex",gap:4,
            pointerEvents:"all",alignItems:"center"}}>
            {/* Duplicar */}
            <div onClick={dupSel} title="Duplicar peça" style={{
              width:32,height:32,borderRadius:6,background:"#0e1a10",border:"1px solid #2a5a30",
              display:"flex",alignItems:"center",justifyContent:"center",
              cursor:"pointer",fontSize:14,userSelect:"none"}}>📋</div>
            {/* Abrir/fechar — só porta/gaveta */}
            {isMovable && (
              <div onClick={toggleOpen} style={{
                height:32,padding:"0 10px",borderRadius:6,display:"flex",alignItems:"center",gap:5,
                background:selData?.isOpen?"#0e2a0e":"#0e0e28",
                border:`1px solid ${selData?.isOpen?"#2a6a2a":"#2a2a6a"}`,
                cursor:"pointer",fontSize:11,color:selData?.isOpen?"#70c070":"#7070c0",userSelect:"none"}}>
                {selData?.isOpen?"🔓 Fechar":"🔒 Abrir"}
              </div>
            )}
            {/* Remover */}
            <div onClick={delSel} title="Remover peça" style={{
              width:32,height:32,borderRadius:6,background:"#1a0a0a",border:"1px solid #5a2a2a",
              display:"flex",alignItems:"center",justifyContent:"center",
              cursor:"pointer",fontSize:14,userSelect:"none"}}>🗑</div>
          </div>
        )}

        {/* Legenda controles */}
        <div style={{position:"absolute",bottom:30,left:10,pointerEvents:"none",
          fontSize:9,color:"#2a4a3a",lineHeight:1.8}}>
          <div>🖱 Arr. esq → mover peça</div>
          <div>🖱 Arr. dir → orbitar câmera</div>
          <div>🖱 Alt+arr → pan</div>
          <div>🖱 Roda → zoom</div>
        </div>
      </div>
    </div>
  );
}

function S({children}) {
  return (
    <div style={{padding:"10px 12px",borderBottom:"1px solid #0e1828"}}>
      {children}
    </div>
  );
}

function SL({children}) {
  return (
    <div style={{fontSize:9,letterSpacing:1.5,color:"#3a5a7a",textTransform:"uppercase",
      marginBottom:5,marginTop:2}}>{children}</div>
  );
}

function PBtn({children, onClick, c="#1e3a5a", disabled}) {
  return (
    <div onClick={disabled?null:onClick} style={{
      padding:"7px 10px",borderRadius:5,cursor:disabled?"not-allowed":"pointer",
      background:disabled?"#0a0a14":c,border:`1px solid ${disabled?"#1a1a2a":"#2a4a6a"}`,
      color:disabled?"#2a3a4a":"#90c0e0",fontSize:10,textAlign:"center",
      marginBottom:4,opacity:disabled?0.5:1,userSelect:"none",transition:"all 0.12s"}}>
      {children}
    </div>
  );
}

function DI({label, value, onChange}) {
  return (
    <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:5}}>
      <div style={{fontSize:9,color:"#4a6a7a",width:90,flexShrink:0}}>{label}</div>
      <input type="number" min={1} max={500} step={1} value={value}
        onChange={e=>onChange(e.target.value)}
        style={{flex:1,padding:"4px 6px",background:"#080c18",border:"1px solid #2a3a5a",
          borderRadius:4,color:"#80c0e0",fontSize:11,outline:"none",textAlign:"right"}}/>
      <div style={{fontSize:9,color:"#3a5a7a"}}>cm</div>
    </div>
  );
}

function MI({m, active, onSel, glass}) {
  return (
    <div onClick={onSel} style={{
      display:"flex",alignItems:"center",gap:5,padding:"4px 6px",borderRadius:4,
      cursor:"pointer",background:active?"#1a2838":"#0a0a18",
      border:`1px solid ${active?"#3a6a9a":"#141424"}`,transition:"all 0.1s"}}>
      <div style={{
        width:18,height:18,borderRadius:3,flexShrink:0,
        background:glass?"linear-gradient(135deg,#88ccff88,#ffffff44)":m.color,
        border:`1px solid ${active?"#4a7aaa":"#2a2a3a"}`,
        boxShadow:glass?"inset 0 0 4px #ffffff44":""}}/>
      <div style={{fontSize:9,color:active?"#a0c8e0":"#5a7a8a",
        overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",lineHeight:1.2}}>
        {m.label}
      </div>
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

// ─────────────────────────────────────────────
// PLANO DE CORTE — componente separado para evitar
// criação de sub-componentes dentro do render principal
// ─────────────────────────────────────────────
function PriceRow({label, field, suffix, prices, setPrices}) {
  return (
    <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:5}}>
      <div style={{fontSize:9,color:"#4a6a7a",flex:1}}>{label}</div>
      <input type="number" step="any" min={0}
        value={prices[field]}
        onChange={e => setPrices(p => ({...p, [field]: parseFloat(e.target.value)||0}))}
        style={{width:72,padding:"3px 6px",background:"#080c18",border:"1px solid #2a3a5a",
          borderRadius:4,color:"#f0c040",fontSize:11,outline:"none",textAlign:"right"}}/>
      <span style={{fontSize:9,color:"#3a5a7a",width:24,flexShrink:0}}>{suffix}</span>
    </div>
  );
}

function CutTab({prices, setPrices, piecesRef, selFromList, toggleLock}) {
  const CW = prices.chapaW, CH = prices.chapaH;

  const panels = piecesRef.current.map(o => ({
    id:    o.userData.id,
    label: o.userData.label || "Peça",
    w: Math.round((o.userData.w || 0) * 1000),
    h: Math.round((o.userData.h || 0) * 1000),
    d: Math.round((o.userData.d || 0) * 1000),
    mat: ALL_MAT_ITEMS.find(m=>m.id===o.userData.matId)?.label || o.userData.matId || "MDF",
    locked: !!o.userData.locked,
  })).filter(p => p.w > 10 && p.h > 10);

  const totalM2    = panels.reduce((a,p) => a + (p.w/1000)*(p.h/1000), 0);
  const totalPerim = panels.reduce((a,p) => a + 2*((p.w+p.h)/1000), 0);
  const chapas     = Math.max(1, Math.ceil(totalM2 / ((CW/1000)*(CH/1000))));
  const matCost    = totalM2 * prices.priceM2;
  const fitaCost   = totalPerim * prices.fitaM;
  const srrCost    = chapas * prices.corteChapa;
  const moCost     = totalM2 * prices.moObraM2;
  const total      = matCost + fitaCost + srrCost + moCost;

  const generateReport = () => {
    const sep1 = "═".repeat(52);
    const sep2 = "─".repeat(52);
    const pad  = (s,n) => String(s).padEnd(n);
    const rpad = (s,n) => String(s).padStart(n);

    const rows = panels.map((p,i) =>
      `  ${rpad(i+1,2)}. ${pad(p.label,22)} ${rpad(p.w,4)}×${rpad(p.h,4)}×${rpad(p.d,2)}mm   ${p.mat}`
    );

    const txt = [
      sep1,
      "       MODELARE MARCENARIA — PLANO DE CORTE",
      sep1,
      `  Data: ${new Date().toLocaleDateString("pt-BR")}   |   Peças: ${panels.length}`,
      `  Chapa padrão: ${CW}×${CH}mm`,
      sep2,
      "  # │ Peça                   │  L ×  A × Esp  │ Material",
      sep2,
      ...rows,
      sep2,
      "  RESUMO DE MATERIAL",
      sep2,
      `  Área total das peças  : ${totalM2.toFixed(4)} m²`,
      `  Área por chapa        : ${((CW/1000)*(CH/1000)).toFixed(4)} m²`,
      `  Chapas necessárias    : ${chapas} chapa(s) de ${CW}×${CH}mm`,
      `  Fita de borda total   : ${totalPerim.toFixed(2)} m`,
      sep2,
      "  ORÇAMENTO ESTIMADO",
      sep2,
      `  Material MDF          : R$ ${matCost.toFixed(2)}`,
      `  Fita de borda         : R$ ${fitaCost.toFixed(2)}`,
      `  Corte / Serra         : R$ ${srrCost.toFixed(2)}`,
      ...(prices.moObraM2 > 0 ? [`  Mão de obra           : R$ ${moCost.toFixed(2)}`] : []),
      sep2,
      `  TOTAL ESTIMADO        : R$ ${total.toFixed(2)}`,
      sep1,
      "  * Estimativa. Não inclui ferragens, parafusos ou acabamentos.",
      "  * Gerado por Modelare 3D Studio",
      sep1,
    ].join("\n");

    const blob = new Blob([txt], {type:"text/plain;charset=utf-8"});
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href = url; a.download = `plano_corte_${new Date().toISOString().slice(0,10)}.txt`;
    a.click(); URL.revokeObjectURL(url);
  };

  const priceFields = [
    {label:"Largura da chapa",     field:"chapaW",     suffix:"mm"},
    {label:"Altura da chapa",      field:"chapaH",     suffix:"mm"},
    null, // divisor
    {label:"Material MDF (m²)",    field:"priceM2",    suffix:"R$"},
    {label:"Fita de borda (m)",    field:"fitaM",      suffix:"R$"},
    {label:"Corte por chapa",      field:"corteChapa", suffix:"R$"},
    {label:"Mão de obra (m²)",     field:"moObraM2",   suffix:"R$"},
  ];

  return (
    <>
      {/* Configurações de preço */}
      <S>
        <SL>⚙ Configurações de Valores</SL>
        <div style={{fontSize:8,color:"#405060",marginBottom:7,fontStyle:"italic",lineHeight:1.5}}>
          Edite qualquer campo — orçamento atualiza em tempo real
        </div>
        {priceFields.map((f,i) =>
          f === null
            ? <div key={i} style={{height:1,background:"#1a2a3a",margin:"4px 0"}}/>
            : <PriceRow key={f.field} {...f} prices={prices} setPrices={setPrices}/>
        )}
      </S>

      {panels.length === 0
        ? <NoSel msg="Adicione peças para gerar o plano de corte"/>
        : <>
            {/* Lista de peças */}
            <S>
              <SL>📐 Lista de Corte — {panels.length} {panels.length===1?"peça":"peças"}</SL>
              <div style={{maxHeight:230,overflowY:"auto"}}>
                {/* Cabeçalho */}
                <div style={{display:"grid",gridTemplateColumns:"18px 1fr 84px 22px",gap:"0 4px",
                  padding:"3px 4px",marginBottom:2,borderBottom:"1px solid #1a2a3a",
                  fontSize:8,color:"#3a5a6a",fontWeight:600}}>
                  <span>#</span><span>Peça / Material</span><span style={{textAlign:"right"}}>L×A×Esp</span><span/>
                </div>
                {panels.map((p,i) => (
                  <div key={p.id} style={{
                    display:"grid",gridTemplateColumns:"18px 1fr 84px 22px",gap:"0 4px",
                    alignItems:"center",padding:"4px 4px",borderRadius:3,marginBottom:1,
                    background:p.locked?"#1a0e00":i%2===0?"#0a0e18":"#080c14",
                    borderLeft:`2px solid ${p.locked?"#cc6600":["#4a8aaa","#6a5a3a","#3a7a5a","#7a4a7a"][i%4]}`}}>
                    <span style={{fontSize:8,color:"#3a5a7a",textAlign:"right"}}>{i+1}</span>
                    <div>
                      <div style={{fontSize:9,color:p.locked?"#ff9900":"#90b0d0",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",fontWeight:500}}>
                        {p.locked?"🔒 ":""}{p.label}
                      </div>
                      <div style={{fontSize:8,color:"#3a6a5a",marginTop:1}}>{p.mat.split(" ").slice(0,3).join(" ")}</div>
                    </div>
                    <div style={{textAlign:"right"}}>
                      <div style={{fontSize:10,color:"#c8a060",fontWeight:700,fontFamily:"monospace",whiteSpace:"nowrap"}}>{p.w}×{p.h}</div>
                      <div style={{fontSize:8,color:"#4a5a6a",fontFamily:"monospace"}}>e:{p.d}</div>
                    </div>
                    {/* Botão de bloqueio */}
                    <div
                      onClick={() => { selFromList(p.id); setTimeout(toggleLock, 40); }}
                      title={p.locked ? "Desbloquear peça" : "Bloquear peça"}
                      style={{
                        display:"flex",alignItems:"center",justifyContent:"center",
                        width:20,height:20,borderRadius:4,cursor:"pointer",fontSize:12,
                        background:p.locked?"#2a1400":"#0e1828",
                        border:`1px solid ${p.locked?"#884400":"#1a3a4a"}`,
                        userSelect:"none",transition:"all 0.15s"}}>
                      {p.locked?"🔒":"🔓"}
                    </div>
                  </div>
                ))}
              </div>
            </S>

            {/* Chapas */}
            <S>
              <SL>🪵 Chapas Necessárias</SL>
              <div style={{background:"#070d18",borderRadius:6,padding:"10px",border:"1px solid #1a2a3a"}}>
                <div style={{display:"flex",justifyContent:"space-between",marginBottom:3}}>
                  <span style={{fontSize:9,color:"#506070"}}>Área das peças:</span>
                  <span style={{fontSize:9,color:"#a0c0e0",fontFamily:"monospace"}}>{totalM2.toFixed(3)} m²</span>
                </div>
                <div style={{display:"flex",justifyContent:"space-between",marginBottom:6}}>
                  <span style={{fontSize:9,color:"#506070"}}>Por chapa ({CW}×{CH}):</span>
                  <span style={{fontSize:9,color:"#a0c0e0",fontFamily:"monospace"}}>{((CW/1000)*(CH/1000)).toFixed(3)} m²</span>
                </div>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",
                  background:"#0e1828",borderRadius:5,padding:"8px 10px",border:"1px solid #2a3a5a"}}>
                  <div>
                    <div style={{fontSize:9,color:"#608090"}}>Chapas {CW}×{CH}mm</div>
                    <div style={{fontSize:8,color:"#405060",marginTop:1}}>+ 10% de sobra recomendado</div>
                  </div>
                  <div style={{fontSize:22,fontWeight:800,color:"#f0c040",fontFamily:"monospace"}}>{chapas}</div>
                </div>
                <div style={{display:"flex",justifyContent:"space-between",marginTop:6}}>
                  <span style={{fontSize:9,color:"#506070"}}>Fita de borda:</span>
                  <span style={{fontSize:9,color:"#a0c0e0",fontFamily:"monospace"}}>{totalPerim.toFixed(2)} m</span>
                </div>
              </div>
            </S>

            {/* Orçamento */}
            <S>
              <SL>💰 Orçamento</SL>
              {[
                ["Material MDF", matCost],
                ["Fita de borda", fitaCost],
                ["Corte / Serra", srrCost],
                ...(prices.moObraM2>0 ? [["Mão de obra", moCost]] : []),
              ].map(([lbl,val]) => (
                <div key={lbl} style={{display:"flex",justifyContent:"space-between",
                  padding:"3px 0",borderBottom:"1px solid #0e1828"}}>
                  <span style={{fontSize:10,color:"#607080"}}>{lbl}</span>
                  <span style={{fontSize:10,color:"#80c080",fontFamily:"monospace"}}>R$ {val.toFixed(2)}</span>
                </div>
              ))}
              <div style={{display:"flex",justifyContent:"space-between",marginTop:8,
                padding:"6px 8px",background:"#0e1828",borderRadius:5,border:"1px solid #2a3a2a"}}>
                <span style={{fontSize:12,color:"#c8a060",fontWeight:700}}>TOTAL</span>
                <span style={{fontSize:14,color:"#f0c040",fontWeight:800,fontFamily:"monospace"}}>R$ {total.toFixed(2)}</span>
              </div>
              <div style={{fontSize:8,color:"#304050",marginTop:5,fontStyle:"italic",textAlign:"center"}}>
                Não inclui ferragens, parafusos e acabamentos
              </div>
            </S>

            {/* Exportar */}
            <div style={{padding:"4px 12px 14px"}}>
              <div onClick={generateReport} style={{
                padding:"11px",borderRadius:7,cursor:"pointer",textAlign:"center",
                background:"linear-gradient(135deg,#112211,#0a1a0a)",
                border:"2px solid #2a8a3a",userSelect:"none",
                transition:"all 0.15s"}}>
                <div style={{fontSize:18,marginBottom:3}}>📄</div>
                <div style={{fontSize:11,fontWeight:700,color:"#60d070",letterSpacing:0.5}}>Exportar Relatório</div>
                <div style={{fontSize:8,color:"#3a5a40",marginTop:2}}>
                  Baixar .txt com lista de corte completa
                </div>
              </div>
            </div>
          </>
      }
    </>
  );
}
