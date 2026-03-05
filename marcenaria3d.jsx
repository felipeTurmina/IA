/**
 * ╔══════════════════════════════════════════════════════════════════════════════╗
 * ║                        MODELARE 3D — marcenaria3d.jsx                       ║
 * ╠══════════════════════════════════════════════════════════════════════════════╣
 * ║  Aplicativo de modelagem 3D de móveis sob medida para marcenaria.           ║
 * ║                                                                              ║
 * ║  Stack:                                                                      ║
 * ║    - React 18 (hooks: useState, useEffect, useRef, useCallback)             ║
 * ║    - Three.js r128 (WebGL renderer, geometrias, materiais, sombras)         ║
 * ║                                                                              ║
 * ║  Funcionalidades principais:                                                 ║
 * ║    • Adicionar / duplicar / remover peças de marcenaria em cena 3D          ║
 * ║    • Arrastar peças com snap de 1mm e snap magnético entre bordas            ║
 * ║    • Editar dimensões, rotação e posição vertical de cada peça              ║
 * ║    • Animação de abrir/fechar gavetas e portas (dobradiça e correr)         ║
 * ║    • Catálogo completo Eucatex 2024 (52 acabamentos + 3 vidros)             ║
 * ║    • Plano de corte automático com orçamento estimado                        ║
 * ║    • Exportar relatório de corte em .txt                                     ║
 * ║                                                                              ║
 * ║  Estrutura do arquivo (ordem de declaração):                                 ║
 * ║    1. Texturas procedurais (woodCanvas, makeTex)          linha ~10          ║
 * ║    2. Catálogo de materiais (MAT_GROUPS, buildMat)        linha ~56          ║
 * ║    3. Tipos de peça (PTYPES)                              linha ~148         ║
 * ║    4. Construtores 3D (makeHandle, makeTrack, makePiece)  linha ~161         ║
 * ║    5. Rebuild de geometria (rebuildPiece)                 linha ~299         ║
 * ║    6. Sistema de animação (toggleOpenClose, tickAnimations) linha ~362       ║
 * ║    7. Outline de seleção (addOutline, syncOutline)        linha ~443         ║
 * ║    8. Sistema de snap (snapGrid, edgeSnap)                linha ~492         ║
 * ║    9. Componente principal App                            linha ~578         ║
 * ║   10. Componentes UI auxiliares (S, SL, PBtn, DI, MI…)   linha ~1670        ║
 * ║   11. Aba de plano de corte (CutTab)                      linha ~1745        ║
 * ╚══════════════════════════════════════════════════════════════════════════════╝
 */

import { useState, useEffect, useRef, useCallback } from "react";
import * as THREE from "three";

// ─────────────────────────────────────────────────────────────────────────────
// SISTEMA DE TEXTURAS
// Estratégia de cache em dois níveis para evitar recriação desnecessária:
//   Nível 1: _canvasCache  → canvas 2D (CPU). Gerado uma vez por tipo de madeira.
//   Nível 2: _texCache     → THREE.CanvasTexture (GPU/VRAM). Um por tipo, compartilhado.
// Ao criar um material, clona-se a textura do cache para ajustar o repeat
// independentemente sem duplicar o buffer na GPU.
// ─────────────────────────────────────────────────────────────────────────────

/** @type {Object.<string, HTMLCanvasElement>} Cache de canvas 2D por tipo de madeira */
const _canvasCache = {};

/** @type {Object.<string, THREE.CanvasTexture>} Cache de CanvasTexture na GPU — evita VRAM duplicada */
const _texCache    = {};

/**
 * Gera (ou retorna do cache) um canvas 2D com textura procedural de madeira.
 *
 * O algoritmo desenha:
 *  - Fundo sólido na cor base da madeira
 *  - 90 veios ondulados com variação aleatória de largura e opacidade
 *  - 3 nós elípticos (exceto no tipo "branco")
 *
 * Tipos suportados: "freijo" | "carvalho" | "branco" | "mdf_bp" | "nogueira" | "pinus"
 * Qualquer tipo desconhecido cai no fallback de freijó.
 *
 * @param {string} type - Identificador do tipo de madeira
 * @returns {HTMLCanvasElement} Canvas 512×512px com a textura desenhada
 */
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

/**
 * Cria (ou reutiliza do cache) uma THREE.CanvasTexture e retorna um clone leve.
 *
 * O clone compartilha o buffer de GPU com o original, mas tem seu próprio
 * `repeat` — permitindo que cada material ajuste a escala da textura conforme
 * as dimensões reais da peça sem alocar nova VRAM.
 *
 * Fórmula de repeat: largura/0.5 e altura/0.5 → escala 1:1 a cada 50cm.
 *
 * @param {string} key - Tipo de madeira (mesmo identificador de woodCanvas)
 * @param {number} w   - Largura real da peça em metros
 * @param {number} h   - Altura real da peça em metros
 * @returns {THREE.CanvasTexture} Textura configurada com repeat proporcional
 */
function makeTex(key, w, h) {
  if (!_texCache[key]) {
    const t = new THREE.CanvasTexture(woodCanvas(key));
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    _texCache[key] = t;
  }
  const t = _texCache[key].clone(); // clone leve: compartilha GPU buffer, repeat independente
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(w/0.5, h/0.5);
  t.needsUpdate = true; // FIX #3: clone precisa de needsUpdate=true para upload na GPU
  return t;
}

// ─────────────────────────────────────────────────────────────────────────────
// CATÁLOGO DE MATERIAIS — Eucatex 2024
//
// Estrutura de cada item:
//   id     {string}  - Identificador único usado em userData.matId
//   label  {string}  - Nome comercial exibido na interface
//   color  {string}  - Cor HEX aplicada como tint sobre a textura
//   tex    {string}  - Chave de textura base (veja woodCanvas)
//
// Os grupos espelham as linhas reais do catálogo Eucatex:
//   BP Poro Supermatt · Lacca AD (Alto Brilho) · BP Matt Soft (Aveludado)
//   BP Raízes · BP Matt Plus · BP Grafis
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Grupos do catálogo Eucatex 2024.
 * @type {Array<{group: string, items: Array<{id:string, label:string, color:string, tex:string}>}>}
 */
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

/** Materiais de vidro disponíveis apenas para peças do tipo "vidro". */
const MATS_GLASS = [
  {id:"vidro_c", label:"Vidro Cristal", color:"#a8d8ea"},
  {id:"vidro_f", label:"Vidro Fumê",    color:"#4a6070"},
  {id:"vidro_e", label:"Vidro Espelho", color:"#c8d8e0"},
];

/** Lista plana com todos os itens de MAT_GROUPS — usada para lookups rápidos por id. */
const ALL_MAT_ITEMS = MAT_GROUPS.flatMap(g=>g.items);

/**
 * Instancia um THREE.Material correspondente ao matId informado.
 *
 * Para vidros usa MeshPhysicalMaterial com transparência e metalness variáveis.
 * Para madeiras/laminados usa MeshStandardMaterial com textura procedural (makeTex)
 * e tint de cor conforme o catálogo.
 *
 * ⚠️  Cada chamada cria um novo material — o chamador é responsável por
 *     descartar o material anterior (material.map.dispose() + material.dispose())
 *     antes de substituí-lo para evitar memory leak na GPU.
 *
 * @param {string} matId - ID do material (ex: "ps_freijo", "vidro_c")
 * @param {number} w     - Largura da peça em metros (usado para escala da textura)
 * @param {number} h     - Altura da peça em metros (usado para escala da textura)
 * @returns {THREE.Material} Material pronto para ser atribuído a um Mesh
 */
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

// ─────────────────────────────────────────────────────────────────────────────
// TIPOS DE PEÇA
//
// Define as dimensões padrão (em metros) de cada tipo ao ser adicionado.
// O usuário pode alterar livremente via painel "Editar" após a criação.
//
// Campos:
//   id    {string}  - Identificador interno (usado em userData.typeId)
//   label {string}  - Nome exibido na interface
//   icon  {string}  - Emoji/símbolo para o botão de seleção
//   w     {number}  - Largura padrão em metros
//   h     {number}  - Altura padrão em metros
//   d     {number}  - Profundidade padrão em metros
// ─────────────────────────────────────────────────────────────────────────────

/**
 * @type {Array<{id:string, label:string, icon:string, w:number, h:number, d:number}>}
 */
const PTYPES = [
  {id:"lateral",    label:"Lateral",    icon:"▯",  w:0.018, h:0.80,  d:0.40},
  {id:"tampo",      label:"Tampo/Base", icon:"⬜", w:0.80,  h:0.018, d:0.40},
  {id:"fundo",      label:"Fundo",      icon:"◫",  w:0.76,  h:0.76,  d:0.009},
  {id:"porta",      label:"Porta",      icon:"🚪", w:0.36,  h:0.70,  d:0.018},
  {id:"gaveta",     label:"Gaveta",     icon:"▤",  w:0.36,  h:0.14,  d:0.38},
  {id:"prateleira", label:"Prateleira", icon:"═",  w:0.76,  h:0.018, d:0.38},
  {id:"vidro",      label:"Vidro",      icon:"🔲", w:0.36,  h:0.60,  d:0.006},
];

// ─────────────────────────────────────────────────────────────────────────────
// CONSTRUTORES DE OBJETOS 3D AUXILIARES
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Cria um puxador/maçaneta metálico como THREE.Group.
 *
 * Geometria composta por:
 *  - Barra cilíndrica horizontal (55% da largura da peça, máx 18cm)
 *  - 2 suportes verticais nas extremidades da barra
 *  - 2 rosetas circulares decorativas nos pontos de fixação
 *
 * O grupo é posicionado na face frontal da peça (Z = pD/2 + offset).
 * userData.isHandle = true permite identificá-lo na hierarquia do Group.
 *
 * @param {number} pW - Largura da peça-pai em metros
 * @param {number} pH - Altura da peça-pai em metros (não utilizado diretamente, reservado)
 * @param {number} pD - Profundidade da peça-pai em metros
 * @returns {THREE.Group} Grupo com todos os meshes do puxador
 */
/**
 * Constrói e posiciona o puxador com PONTO FIXO de referência.
 *
 * Para PORTA: o handle é filho do GRUPO (mesmo nível que o body).
 *   - doorSide "left"  → dobradiça à direita → body.position.x = -w/2
 *                         puxador na borda ESQUERDA: groupX = -w + margem
 *   - doorSide "right" → dobradiça à esquerda → body.position.x = +w/2
 *                         puxador na borda DIREITA: groupX = +w - margem
 *   - faceZ em coords do grupo = d/2 (face frontal do body, pois body.z=0)
 *
 * Para GAVETA: o handle é filho do FRONT (painel frontal destacado).
 *   - refX = 0 (centro horizontal do front)
 *   - faceZ local ao front = frontT/2 + offset
 *
 * handleX, handleY = offsets em metros relativos ao ponto fixo (positivo = centro/cima)
 * handleAngle = rotação em graus
 *
 * Retorna o handle criado.
 */
function attachHandle(parent, pW, pH, slabD, typeId, doorSide, handleX, handleY, handleAngle) {
  // Remove handle anterior se existir
  const old = parent.children?.find(c => c.userData.isHandle);
  if (old) { old.traverse(c=>{ if(c.isMesh){c.geometry.dispose();c.material.dispose();} }); parent.remove(old); }

  const g = new THREE.Group();
  g.userData.isHandle = true;

  // Geometria do puxador
  const barW = Math.min(pW * 0.55, 0.18);
  const mat  = new THREE.MeshStandardMaterial({color:0xc8c8c8, roughness:0.15, metalness:0.92});
  const bar  = new THREE.Mesh(new THREE.CylinderGeometry(0.006,0.006,barW,10), mat);
  bar.rotation.z = Math.PI/2;
  const legH = 0.025;
  const legGeo = new THREE.CylinderGeometry(0.005,0.005,legH,10);
  const legL = new THREE.Mesh(legGeo, mat); legL.rotation.x = Math.PI/2;
  const legR = new THREE.Mesh(legGeo, mat); legR.rotation.x = Math.PI/2;
  legL.position.set(-barW/2, 0, -legH/2);
  legR.position.set( barW/2, 0, -legH/2);
  const rosGeo = new THREE.CylinderGeometry(0.009,0.009,0.005,12);
  const rosL = new THREE.Mesh(rosGeo, mat); rosL.rotation.x = Math.PI/2;
  const rosR = new THREE.Mesh(rosGeo, mat); rosR.rotation.x = Math.PI/2;
  rosL.position.set(-barW/2, 0, -(legH+0.001));
  rosR.position.set( barW/2, 0, -(legH+0.001));
  [bar,legL,legR,rosL,rosR].forEach(m=>{ m.castShadow=true; g.add(m); });

  const oX  = (handleX !== undefined && handleX !== null) ? handleX : 0;
  const oY  = (handleY !== undefined && handleY !== null) ? handleY : 0;
  const ang = handleAngle ? THREE.MathUtils.degToRad(handleAngle) : 0;

  let refX, refY, refZ;

  if (typeId === "porta") {
    // parent = grupo da porta (origem = dobradiça)
    // body.position.x = doorSide=="left" ? -w/2 : +w/2  (centro do body no grupo)
    // PONTO FIXO PADRÃO: centro X do body + 30% da altura acima do centro
    refX = doorSide === "right" ? pW/2 : -pW/2;  // centro do body em coords do grupo
    refY = pH * 0.30;                              // 30% acima do centro (padrão ergonômico)
    refZ = slabD/2 + legH + 0.004;                // face frontal (body.z=0, face=+d/2)
  } else {
    // GAVETA: parent = front, refX/Y em coords locais do front
    refX = 0;   // centro horizontal
    refY = 0;   // centro vertical
    refZ = slabD/2 + legH + 0.004;
  }

  // refX/refY = ponto fixo padrão; oX/oY = offset adicional do usuário
  g.position.set(refX + oX, refY + oY, refZ);
  g.rotation.z = ang;
  parent.add(g);
  return g;
}


/**
 * Cria as canaletas (trilhos) de uma porta de correr como THREE.Group.
 *
 * Composto por:
 *  - Trilho superior e inferior (barras metálicas ligeiramente mais largas que a porta)
 *  - Canal guia rebaixado em cada trilho (visualmente indica o encaixe)
 *
 * Visibilidade controlada externamente: por padrão hidden (porta de abrir).
 * Exibido somente quando userData.doorType === "sliding".
 * userData.isTrack = true permite localizá-lo na hierarquia do Group.
 *
 * @param {number} pW - Largura da porta em metros
 * @param {number} pH - Altura da porta em metros
 * @param {number} pD - Profundidade da porta em metros (não utilizado, reservado)
 * @returns {THREE.Group} Grupo com os 4 meshes dos trilhos
 */
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
/**
 * Contador global de IDs de peças.
 * Inicializado com Date.now() para evitar colisão de IDs ao recarregar a página
 * (se fosse um simples 0,1,2... os IDs repetiriam entre sessões).
 * @type {number}
 */
let GID = Date.now();

/**
 * Conjunto de peças que possuem animação em andamento (abertura/fechamento).
 * Percorrido a cada frame em tickAnimations(). Usar Set evita duplicatas.
 * @type {Set<THREE.Object3D>}
 */
const animSet = new Set();

/**
 * Instancia uma peça de marcenaria na cena 3D.
 *
 * Peças simples (lateral, tampo, fundo, prateleira, vidro) → THREE.Mesh
 * Peças com puxador (porta, gaveta)                        → THREE.Group
 *
 * Estrutura do Group para gaveta:
 *   ├── body  (Mesh, userData.isBody)    — caixa principal recuada
 *   ├── front (Mesh, userData.isFront)   — painel frontal destacado
 *   └── handle (Group, userData.isHandle) — puxador metálico
 *
 * Estrutura do Group para porta:
 *   ├── body   (Mesh, userData.isBody)    — painel da porta
 *   ├── track  (Group, userData.isTrack)  — canaletas (hidden por padrão)
 *   └── handle (Group, userData.isHandle) — puxador metálico
 *
 * userData completo de qualquer peça:
 *   id, typeId, matId, frontMatId (gaveta), w, h, d,
 *   rx, ry, rz (rotação em graus),
 *   label, locked, hasHandle,
 *   isOpen, openProgress, baseX, baseZ, baseRY (animação),
 *   doorSide ("left"|"right"), doorType ("hinged"|"sliding")
 *
 * @param {string} typeId - ID do tipo de peça (ver PTYPES)
 * @param {string} matId  - ID do material inicial
 * @param {number} [x=0]  - Posição X inicial em metros
 * @param {number} [y=0]  - Posição Y da base (borda inferior) em metros
 * @param {number} [z=0]  - Posição Z inicial em metros
 * @returns {THREE.Mesh|THREE.Group} Objeto 3D pronto para adicionar à cena
 */
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
      // PORTA — origin do Group na borda da dobradica para rotacao correta
      // doorSide "left" (puxador esq) -> dobradica direita -> body offset X = -w/2
      const body = new THREE.Mesh(new THREE.BoxGeometry(w,h,d), buildMat(mid,w,h));
      body.position.set(-w/2, 0, 0); // borda direita do body fica em X=0 (a dobradica)
      body.castShadow = true; body.receiveShadow = true;
      body.userData.isBody = true;
      grp.add(body);
      const track = makeTrack(w, h, d);
      track.position.set(-w/2, 0, 0);
      track.visible = false;
      grp.add(track);
    }

    // Puxador: para PORTA o parent é o grupo (coords do grupo = body.pos + local)
    //           para GAVETA o parent é o front (coords locais do front)
    {
      const _slabD0 = typeId === "gaveta" ? 0.018 : d;
      if (typeId === "gaveta") {
        const _hFront = grp.children.find(c => c.userData.isFront);
        if (_hFront) attachHandle(_hFront, w, h, _slabD0, typeId, "left", 0, 0, 0);
      } else {
        // Porta: handle filho do grupo, refX calculado em coords do grupo
        attachHandle(grp, w, h, _slabD0, typeId, "left", 0, 0, 0);
      }
    }

    // Grupo posicionado na borda direita da porta (dobradica padrao "left")
    grp.position.set(x + w/2, y+h/2, z);

    grp.userData = {
      id, typeId, matId:mid,
      frontMatId: mid,
      w, h, d,
      rx:0, ry:0, rz:0,
      label:`${tp.label} ${id}`,
      isOpen:false, openProgress:0,
      baseX:x + (typeId==="porta" ? w/2 : 0), baseZ:z, baseRY:0,
      hasHandle: true,
      handleY: 0,  // offset relativo ao ponto fixo (0 = ponto fixo padrão)
      handleX: 0,
      handleAngle: 0,
      slabD: typeId === "gaveta" ? 0.018 : d,  // espessura da face onde o puxador está fixado
      doorSide: "left",
      doorType: "hinged",
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

/**
 * Reconstrói a geometria e os materiais de uma peça existente na cena,
 * aplicando as dimensões e matId atuais em userData.
 *
 * Chamado sempre que o usuário altera largura, altura, profundidade ou material.
 * Garante o descarte correto (dispose) de geometrias e materiais anteriores —
 * incluindo o map (textura clonada) — para evitar memory leak na GPU.
 *
 * Para Groups reconstrói também o puxador e as canaletas.
 * Ao final, reaplica a rotação armazenada em userData (rx/ry/rz em graus).
 *
 * @param {THREE.Mesh|THREE.Group} obj - A peça a ser reconstruída
 */
function rebuildPiece(obj) {
  const {w,h,d,matId,frontMatId,typeId,rx,ry,rz} = obj.userData;
  if (obj.isGroup) {
    const body = obj.children.find(c=>c.userData.isBody);
    if (body) {
      body.geometry.dispose();
      // BUG 3 FIX: descartar textura clonada antes de substituir material
      if (body.material.map) body.material.map.dispose();
      body.material.dispose();
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
      front.geometry.dispose();
      // BUG 3 FIX: descartar textura clonada antes de substituir material
      if (front.material.map) front.material.map.dispose();
      front.material.dispose();
      front.geometry = new THREE.BoxGeometry(w, h, frontT);
      front.position.z = (bodyD / 2) - (frontT / 2) + frontT;
      front.material = buildMat(frontMatId || matId, w, h);
    }
    // Reposicionar body e track (porta) ou reconstruir track
    if (typeId === "porta") {
      const oldT = obj.children.find(c=>c.userData.isTrack);
      if (oldT) {
        oldT.traverse(c=>{ if(c.isMesh){c.geometry.dispose(); c.material.dispose();} });
        obj.remove(oldT);
      }
      const newT = makeTrack(w, h, d);
      newT.visible = obj.userData.doorType === "sliding";
      // body e track seguem o doorSide
      const _side = obj.userData.doorSide || "left";
      const _cX   = _side === "right" ? w/2 : -w/2;
      obj.children.forEach(ch => {
        if (ch.userData.isBody || ch.userData.isTrack) ch.position.x = _cX;
      });
      newT.position.x = _cX;
      obj.add(newT);
    }
    // Recolocar puxador — porta: filho do grupo; gaveta: filho do front
    {
      const _rb_slabD = obj.userData.slabD || d;
      const _rb_side  = obj.userData.doorSide || "left";
      const _rb_hX = obj.userData.handleX  !== undefined ? obj.userData.handleX  : 0;
      const _rb_hY = obj.userData.handleY  !== undefined ? obj.userData.handleY  : 0;
      const _rb_hA = obj.userData.handleAngle || 0;
      let h_;
      if (typeId === "gaveta") {
        const _rb_front = obj.children.find(c=>c.userData.isFront);
        if (_rb_front) h_ = attachHandle(_rb_front, w, h, _rb_slabD, typeId, _rb_side, _rb_hX, _rb_hY, _rb_hA);
      } else {
        // Remove handle antigo do grupo antes de recriar
        const _rb_oldH = obj.children.find(c=>c.userData.isHandle);
        if (_rb_oldH) { _rb_oldH.traverse(c=>{if(c.isMesh){c.geometry.dispose();c.material.dispose();}}); obj.remove(_rb_oldH); }
        h_ = attachHandle(obj, w, h, _rb_slabD, typeId, _rb_side, _rb_hX, _rb_hY, _rb_hA);
      }
      if (h_) h_.visible = obj.userData.hasHandle !== false;
    }
  } else {
    obj.geometry.dispose();
    obj.geometry = new THREE.BoxGeometry(w,h,d);
    if (Array.isArray(obj.material)) obj.material.forEach(m=>{ if(m.map) m.map.dispose(); m.dispose(); });
    else { if (obj.material.map) obj.material.map.dispose(); obj.material.dispose(); }
    obj.material = buildMat(matId,w,h);
  }
  obj.rotation.set(
    THREE.MathUtils.degToRad(rx),
    THREE.MathUtils.degToRad(ry),
    THREE.MathUtils.degToRad(rz)
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SISTEMA DE ANIMAÇÃO — abertura e fechamento de gavetas e portas
//
// Funcionamento:
//   1. toggleOpenClose() inverte isOpen e adiciona o objeto ao animSet
//   2. tickAnimations() é chamado a cada frame; avança openProgress (0→1 ou 1→0)
//      usando interpolação exponencial suave (ease-out)
//   3. Ao atingir o alvo (< 0.003 de diferença), remove do animSet e fixa posição
//
// Tipos de movimento:
//   gaveta   → translação em Z (desliza para frente 85% da profundidade)
//   porta hinged → rotação de 105° com pivô na borda (esq ou dir) via applyDoorTransform
//   porta sliding → translação em X pela largura da porta
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Alterna o estado aberto/fechado de uma gaveta ou porta.
 *
 * Grava baseX/baseZ/baseRY SOMENTE quando a peça está totalmente fechada
 * (openProgress == 0) — esse é o único momento em que a posição é confiável.
 * Nas demais situações (meio da animação ou já aberta), a base gravada
 * anteriormente é preservada para garantir o retorno correto.
 *
 * @param {THREE.Group} obj - A peça (deve ser gaveta ou porta)
 */
function toggleOpenClose(obj) {
  if (!obj?.userData) return;
  const {typeId} = obj.userData;
  if (typeId !== "gaveta" && typeId !== "porta") return;

  const ud = obj.userData;

  // Grava a base apenas quando a peça está completamente fechada e parada.
  // Isso garante que baseX/baseZ/baseRY sempre reflitam a posição real de repouso.
  if (ud.openProgress === 0 && !ud.isOpen) {
    ud.baseX  = obj.position.x;
    ud.baseZ  = obj.position.z;
    ud.baseRY = obj.rotation.y;
  }

  ud.isOpen = !ud.isOpen;
  animSet.add(obj);
}

/**
 * Aplica a transformação de posição e rotação de uma porta de dobradiça
 * para um dado progresso de abertura.
 *
 * A porta gira 95° em torno da sua borda (pivô).
 * O pivô é calculado com base em doorSide (lado do PUXADOR):
 *   "left"  puxador → dobradiça na borda DIREITA  → pivô em baseX + w/2
 *   "right" puxador → dobradiça na borda ESQUERDA → pivô em baseX - w/2
 *
 * Translação X e Z são recalculadas a cada frame para manter o pivô fixo
 * durante a rotação (evita o efeito de "escorregar").
 *
 * @param {THREE.Group} obj      - O objeto porta
 * @param {number}      progress - Valor entre 0 (fechada) e 1 (aberta)
 */
function applyDoorTransform(obj, progress) {
  const ud = obj.userData;
  // Origin do Group = borda da dobradica (pivot correto).
  // Porta abre PARA FRENTE (Z positivo = em direcao ao usuario).
  // "left"  puxador esq -> dobradica na borda DIREITA do body
  //   body esta em X = -w/2 do pivot -> girar anti-horario em Y (angulo positivo)
  //   pois o corpo vai para Z+ ao girar positivo em Y quando esta a esquerda do pivot
  // "right" puxador dir -> dobradica na borda ESQUERDA do body
  //   body esta em X = +w/2 do pivot -> girar horario em Y (angulo negativo)
  const sign = ud.doorSide === "left" ? 1 : -1;
  const angle = sign * progress * THREE.MathUtils.degToRad(95);
  obj.rotation.y = ud.baseRY + angle;
  obj.position.x = ud.baseX;
  obj.position.z = ud.baseZ;
}
/**
 * Avança todas as animações ativas em um frame.
 * Deve ser chamado dentro do loop de renderização com o delta de tempo real.
 *
 * Usa interpolação exponencial: progress += (target - progress) * fator
 * O fator é limitado a 0.18 para evitar saltos em frames longos (tab inativa).
 *
 * Remove automaticamente do animSet quando a animação converge (Δ < 0.003).
 *
 * @param {number} dt - Delta de tempo desde o último frame em segundos
 */
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

// ─────────────────────────────────────────────────────────────────────────────
// OUTLINE DE SELEÇÃO
//
// Contorno azul (ou laranja se bloqueada) exibido ao redor da peça selecionada.
// Implementado como THREE.LineSegments com EdgesGeometry.
//
// Estratégia anti-flicker para grupos (porta/gaveta):
//   Usa as dimensões de userData (w/h/d) em vez de calcular bounding box
//   a cada frame — evita oscilação causada pelo movimento dos filhos (puxador).
//
// renderOrder = 999 e depthTest = false garantem que o contorno fique
// sempre visível mesmo atrás de outras peças.
// ─────────────────────────────────────────────────────────────────────────────

/** Chave usada em userData para identificar o objeto de outline na cena. */
const OUTLINE_TAG = "__outline__";

/**
 * Calcula o tamanho e centro do bounding box para fins de outline.
 * Adiciona 8mm de margem em todas as dimensões para o contorno não colar na peça.
 *
 * @param {THREE.Object3D} obj
 * @returns {{size: THREE.Vector3, center: THREE.Vector3}}
 */
function getOutlineBox(obj) {
  if (obj.isGroup && obj.userData.w) {
    const {w, h, d} = obj.userData;
    if (obj.userData.typeId === "porta") {
      // Porta: o body fica em posicao local X = -w/2 (ou +w/2 para doorSide right).
      // Precisamos do centro WORLD do body, ignorando puxador (que projeta em Z extra).
      // Usar getWorldPosition no body filho e o tamanho real w x h x d.
      const body = obj.children.find(c => c.userData.isBody);
      if (body) {
        const worldCenter = new THREE.Vector3();
        body.getWorldPosition(worldCenter);
        const size = new THREE.Vector3(w + 0.008, h + 0.008, d + 0.008);
        return { size, center: worldCenter };
      }
    }
    // Gaveta e outros grupos: dimensoes do userData, centro = posicao do grupo
    const size = new THREE.Vector3(w + 0.008, h + 0.008, d + 0.008);
    const center = obj.position.clone();
    return { size, center };
  }
  // Meshes simples: bounding box real
  const box = new THREE.Box3().setFromObject(obj);
  const size = new THREE.Vector3(); box.getSize(size); size.addScalar(0.008);
  const center = new THREE.Vector3(); box.getCenter(center);
  return { size, center };
}

/**
 * Cria e adiciona o outline de seleção na cena para o objeto informado.
 * Remove qualquer outline anterior antes de criar o novo.
 *
 * @param {THREE.Object3D} obj   - Peça selecionada
 * @param {THREE.Scene}    scene - Cena Three.js
 */
function addOutline(obj, scene, outlineRef) {
  clearOutline(scene, outlineRef);
  const { size, center } = getOutlineBox(obj);
  const geo = new THREE.BoxGeometry(size.x, size.y, size.z);
  const edges = new THREE.EdgesGeometry(geo);
  geo.dispose();
  const ol = new THREE.LineSegments(edges, new THREE.LineBasicMaterial({color:0x44aaff, depthTest:false}));
  ol.position.copy(center);
  if (obj.userData && obj.userData.typeId === "porta") {
    ol.rotation.copy(obj.rotation);
  } else {
    ol.rotation.set(0,0,0);
  }
  ol.userData[OUTLINE_TAG] = true;
  ol.renderOrder = 999;
  scene.add(ol);
  if (outlineRef) outlineRef.current = ol;
}

/**
 * Remove o outline atual da cena e descarta geometria/material.
 * @param {THREE.Scene} scene
 */
function clearOutline(scene, outlineRef) {
  const ol = outlineRef?.current || scene.children.find(c=>c.userData[OUTLINE_TAG]);
  if (ol) { ol.geometry.dispose(); ol.material.dispose(); scene.remove(ol); }
  if (outlineRef) outlineRef.current = null;
}

/**
 * Atualiza apenas a posição do outline existente para seguir o objeto.
 * Usado durante drag e movimentação vertical (não recria a geometria).
 * Para redimensionamento use addOutline() que recria com o tamanho correto.
 *
 * @param {THREE.Object3D} obj   - Peça sendo movida
 * @param {THREE.Scene}    scene - Cena Three.js
 */
function syncOutline(obj, scene, outlineRef) {
  const ol = outlineRef?.current || scene.children.find(c=>c.userData[OUTLINE_TAG]);
  if (!ol) return;
  const { center } = getOutlineBox(obj);
  ol.position.copy(center);
}

// ─────────────────────────────────────────────────────────────────────────────
// SISTEMA DE SNAP E POSICIONAMENTO
//
// Dois mecanismos independentes:
//
//  1. snapGrid — arredonda para múltiplos de GRID (1mm).
//     Aplicado somente ao SOLTAR o mouse (onMU), não durante o drag,
//     para garantir movimento suave e precisão final simultâneos.
//
//  2. edgeSnap — snap magnético entre bordas de peças adjacentes.
//     Detecta em X, Y e Z: borda→borda (encaixe flush) e centro→centro (alinhamento).
//     Alcance magnético: SNAP_MAG = 6cm. Aplicado durante o drag.
// ─────────────────────────────────────────────────────────────────────────────

/** Resolução da grade de posicionamento em metros (0.001 = 1mm). */
const GRID = 0.001;

/**
 * Arredonda um valor para o múltiplo mais próximo da grade.
 * @param {number} v - Valor em metros
 * @param {number} [g=GRID] - Tamanho da célula da grade
 * @returns {number} Valor arredondado
 */
function snapGrid(v, g=GRID) { return Math.round(v/g)*g; }

/**
 * Calcula o bounding box AABB de uma peça usando userData.w/h/d.
 * Muito mais performático que THREE.Box3.setFromObject() pois não
 * percorre a hierarquia de geometrias — usa as dimensões declaradas.
 *
 * @param {THREE.Object3D} obj
 * @returns {THREE.Box3}
 */
function fastBox(obj) {
  const {w=0.1, h=0.1, d=0.1} = obj.userData;
  const p = obj.position;
  return new THREE.Box3(
    new THREE.Vector3(p.x - w/2, p.y - h/2, p.z - d/2),
    new THREE.Vector3(p.x + w/2, p.y + h/2, p.z + d/2)
  );
}

/** Distância máxima de atração do snap magnético em metros (0.06 = 6cm). */
const SNAP_MAG = 0.06;

/**
 * Aplica snap magnético entre a peça em movimento e todas as outras na cena.
 *
 * Para cada eixo (X, Y, Z) calcula 3 deltas por peça estática:
 *   - borda direita de moving → borda esquerda de other  (encaixe)
 *   - borda esquerda de moving → borda direita de other  (encaixe)
 *   - centro de moving → centro de other                 (alinhamento)
 *
 * O menor delta dentro do raio SNAP_MAG vence e é aplicado, arrastando
 * a peça para a posição exata de encaixe ou alinhamento.
 *
 * Snap em Y usa precisão de 1mm (round 1000) em vez de snapGrid
 * para não interferir com o plano de drag (que é fixo em Y).
 *
 * @param {THREE.Object3D}   moving - Peça sendo arrastada
 * @param {THREE.Object3D[]} others - Todas as peças da cena (inclui a própria)
 */
function edgeSnap(moving, others) {
  const {w:mw=0.1, h:mh=0.1, d:md=0.1} = moving.userData;
  const px = moving.position.x;
  const py = moving.position.y;
  const pz = moving.position.z;

  let bestX = null, bestY = null, bestZ = null;
  let bdX = SNAP_MAG, bdY = SNAP_MAG, bdZ = SNAP_MAG;

  for (const o of others) {
    if (o === moving) continue;
    if (o.userData.isFloor || !o.userData.id) continue; // ignora piso e objetos internos
    const {w:ow=0.1, h:oh=0.1, d:od=0.1} = o.userData;
    const ox = o.position.x;
    const oy = o.position.y;
    const oz = o.position.z;

    // ── X: borda direita-esquerda, esquerda-direita, centros ──
    for (const delta of [
      (px + mw/2) - (ox - ow/2),   // dir → esq
      (px - mw/2) - (ox + ow/2),   // esq → dir
      px - ox,                       // centros
    ]) {
      if (Math.abs(delta) < bdX) { bdX = Math.abs(delta); bestX = delta; }
    }

    // ── Y: topo-base, base-topo, centros ──
    // "topo de moving encosta na base de other" e vice-versa
    for (const delta of [
      (py + mh/2) - (oy - oh/2),   // topo moving → base other
      (py - mh/2) - (oy + oh/2),   // base moving → topo other
      py - oy,                       // centros Y
    ]) {
      if (Math.abs(delta) < bdY) { bdY = Math.abs(delta); bestY = delta; }
    }

    // ── Z: frente-trás, trás-frente, centros ──
    for (const delta of [
      (pz + md/2) - (oz - od/2),
      (pz - md/2) - (oz + od/2),
      pz - oz,
    ]) {
      if (Math.abs(delta) < bdZ) { bdZ = Math.abs(delta); bestZ = delta; }
    }
  }

  if (bestX !== null) moving.position.x = snapGrid(moving.position.x - bestX);
  // FIX #7: snap Y removido do drag — causa oscilacao com o plano horizontal fixo
  if (bestZ !== null) moving.position.z = snapGrid(moving.position.z - bestZ);
}

// ─────────────────────────────────────────────────────────────────────────────
// RAYCASTING HELPER
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Dado um objeto interceptado pelo raycaster (que pode ser um filho interno
 * de um Group — ex: o body ou o puxador de uma gaveta), sobe na hierarquia
 * pai a pai até encontrar o objeto raiz que está registrado em `pieces`.
 *
 * Necessário porque THREE.Raycaster.intersectObjects com `recursive=true`
 * retorna o mesh mais interno, mas a lógica de seleção precisa da peça raiz.
 *
 * @param {THREE.Object3D}   hitObj - Objeto retornado pelo raycaster
 * @param {THREE.Object3D[]} pieces - Array de peças raiz registradas na cena
 * @returns {THREE.Object3D|null} A peça raiz, ou null se não encontrada
 */
function resolveHit(hitObj, pieces) {
  // Walk up to find a piece in our list
  let o = hitObj;
  while (o) {
    if (pieces.includes(o)) return o;
    o = o.parent;
  }
  return null;
}

// ─────────────────────────────────────────────────────────────────────────────
// COMPONENTE PRINCIPAL — App
//
// Responsável por:
//   • Inicializar e gerenciar o ciclo de vida do Three.js (useEffect)
//   • Gerenciar estado React (peças, seleção, aba ativa, preços)
//   • Processar eventos de mouse (drag, órbita, pan, zoom, clique)
//   • Expor callbacks para todas as ações de edição (add, delete, dup, etc.)
//   • Renderizar a sidebar com abas e o viewport 3D
//
// Separação de estado:
//   useRef  → estado Three.js (cena, câmera, renderer, peças 3D, drag)
//             Mutações não causam re-render — correto para objetos 3D
//   useState → estado React (lista de peças para UI, seleção, aba, preços)
//             Causam re-render quando alterados
// ─────────────────────────────────────────────────────────────────────────────

export default function App() {
  // ── Refs Three.js ────────────────────────────────────────────────────────
  /** Elemento DOM onde o canvas do renderer é montado */
  const mountRef   = useRef(null);
  /** THREE.Scene principal */
  const sceneRef   = useRef(null);
  /** THREE.PerspectiveCamera */
  const cameraRef  = useRef(null);
  /** THREE.WebGLRenderer */
  const rendRef    = useRef(null);
  /** Array de todas as peças 3D na cena (THREE.Mesh ou THREE.Group) */
  const piecesRef  = useRef([]);
  /** Referência à peça atualmente selecionada (ou null) */
  const selRef     = useRef(null);
  /** Referência direta ao outline (evita scene.children.find a cada frame) */
  const outlineRef = useRef(null);
  /** Vector3 pré-alocado para drag — evita GC pressure durante mousemove */
  const _dragPt    = useRef(new THREE.Vector3());

  // ── Refs de câmera (coordenadas esféricas) ───────────────────────────────
  /**
   * Estado da câmera em coordenadas esféricas.
   * theta = azimute, phi = elevação, radius = distância, cx/cy/cz = alvo
   */
  const sph    = useRef({theta:0.8, phi:0.65, radius:3.5, cx:0, cy:0.4, cz:0});
  /** Estado do arrasto de órbita (botão direito) */
  const orbit  = useRef({on:false, lx:0, ly:0});
  /** Estado do arrasto de pan (Alt + botão esquerdo) */
  const panS   = useRef({on:false, lx:0, ly:0});
  /** Estado do arrasto de peça (botão esquerdo sobre peça) */
  const dragS  = useRef({on:false, ox:0, oz:0});
  /**
   * Plano horizontal usado para calcular a posição do mouse em 3D durante drag.
   * Normal = (0,1,0), posicionado na altura Y da peça sendo arrastada.
   */
  const dplane = useRef(new THREE.Plane(new THREE.Vector3(0,1,0), 0));
  /** THREE.Raycaster reutilizado a cada evento de mouse (evita alocações) */
  const rc     = useRef(new THREE.Raycaster());

  // ── Estado React ─────────────────────────────────────────────────────────
  /** Lista espelho das peças para a UI (id, label, typeId, locked) */
  const [pieces,    setPieces]    = useState([]);
  /** ID da peça selecionada (userData.id), ou null */
  const [selId,     setSelId]     = useState(null);
  /** Cópia dos userData da peça selecionada para os controles da sidebar */
  const [selData,   setSelData]   = useState(null);
  /** Material ativo para novos adicionar e para aplicar na seleção */
  const [actMat,    setActMat]    = useState("ps_freijo");
  /** Tipo de peça ativo para o botão "Adicionar" */
  const [actType,   setActType]   = useState("lateral");
  /** Aba ativa da sidebar: "add" | "edit" | "mat" | "cam" | "cut" */
  const [tab,       setTab]       = useState("add");
  /** Mensagem exibida na barra de status inferior do viewport */
  const [status,    setStatus]    = useState("Bem-vindo! Adicione peças para montar seu móvel.");
  /** Texto de busca no catálogo de materiais */
  const [matSearch, setMatSearch] = useState("");
  /** Alvo de aplicação de material na gaveta: "corpo" | "frente" */
  const [matTarget, setMatTarget] = useState("corpo");
  /** ID da peça com campo de renomear ativo, ou null */
  const [editingId,   setEditingId]   = useState(null);
  /** Texto digitado no campo de renomear */
  const [editingName, setEditingName] = useState("");
  /** Ref para o input de renomear (para focar automaticamente) */
  const renameRef = useRef(null);

  /**
   * Configurações de preço para o orçamento do plano de corte.
   * Todos os valores são editáveis pelo usuário na aba "cut".
   * chapaW/chapaH: dimensões da chapa padrão em mm
   * priceM2: custo do MDF por m²
   * fitaM: custo da fita de borda por metro
   * corteChapa: custo de corte por chapa
   * moObraM2: mão de obra por m² (0 = não incluir)
   */
  const [prices, setPrices] = useState({
    chapaW: 2750, chapaH: 1850,
    priceM2: 145, fitaM: 0.85, corteChapa: 18, moObraM2: 0,
  });

  /** Quando true, peças não se atravessam durante o drag (colisão AABB) */
  const [colisionOn, setColisionOn] = useState(false);

  // ── INICIALIZAÇÃO DO THREE.JS ─────────────────────────────────────────────
  /**
   * Inicializa toda a infraestrutura Three.js uma única vez na montagem do componente.
   * Configura: Scene, Camera, WebGLRenderer, iluminação, piso, grade e loop de animação.
   *
   * Configurações de renderização:
   *   - Antialiasing ativo
   *   - PixelRatio limitado a 2× (evita sobrecarga em telas de alta densidade)
   *   - Sombras PCFSoft (suaves, boa performance)
   *   - ToneMapping ACESFilmic (contraste cinematográfico)
   *
   * Iluminação:
   *   - AmbientLight quente (0xfff8f0) para fill geral
   *   - DirectionalLight principal (sol) com sombras 2048×2048
   *   - DirectionalLight de preenchimento lateral frio (0xc0d8ff)
   *
   * Loop de animação:
   *   - Calcula dt real (limitado a 50ms para evitar saltos em tabs inativas)
   *   - Chama tickAnimations(dt) para gavetas/portas
   *   - Sincroniza posição do outline com a peça selecionada
   *
   * Cleanup: cancela o requestAnimationFrame, remove o listener de resize
   * e chama renderer.dispose() ao desmontar o componente.
   */
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
    // Grade: 8m / 8000 divisões = 1mm por quadrado
    scene.add(new THREE.GridHelper(8, 400, 0x2a2a50, 0x1a1a38)); // FIX #4: era 8000, travava

    // Animate loop — render-on-demand: só renderiza quando algo mudou
    let fid, last = performance.now();
    let needsRender = true;
    rendRef._needsRender = () => { needsRender = true; };
    const loop = () => {
      fid = requestAnimationFrame(loop);
      const now = performance.now();
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      const hadAnim = animSet.size > 0;
      tickAnimations(dt);
      const selNow = selRef.current;
      if (hadAnim && selNow) {
        const ol = outlineRef.current;
        if (ol) {
          const {center} = getOutlineBox(selNow);
          ol.position.copy(center);
          if (selNow.userData && selNow.userData.typeId === "porta") {
            ol.rotation.copy(selNow.rotation);
          } else {
            ol.rotation.set(0,0,0);
          }
        }
      }
      if (needsRender || hadAnim || animSet.size > 0) {
        renderer.render(scene, camera);
        needsRender = false;
      }
    };
    loop();

    // FIX #2: listener nativo com passive:false para permitir preventDefault no zoom
    const _wh = (e) => {
      e.preventDefault();
      sph.current.radius = Math.max(0.5, Math.min(14, sph.current.radius + e.deltaY * 0.004));
      const {theta,phi,radius,cx,cy,cz} = sph.current;
      camera.position.set(cx+radius*Math.sin(phi)*Math.sin(theta), cy+radius*Math.cos(phi), cz+radius*Math.sin(phi)*Math.cos(theta));
      camera.lookAt(cx,cy,cz);
      rendRef._needsRender();
    };
    renderer.domElement.addEventListener("wheel", _wh, {passive:false});
    const onResize = () => {
      const w = mount.clientWidth, h = mount.clientHeight;
      camera.aspect = w/h; camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener("resize", onResize);
    return () => {
      cancelAnimationFrame(fid);
      renderer.domElement.removeEventListener("wheel", _wh);
      window.removeEventListener("resize", onResize);
      animSet.clear(); // FIX #1: evita refs stale apos hot-reload
      if (mount.contains(renderer.domElement)) mount.removeChild(renderer.domElement);
      renderer.dispose();
    };
  }, []);

  // ── CÂMERA ────────────────────────────────────────────────────────────────
  /**
   * Recalcula e aplica a posição da câmera a partir das coordenadas esféricas em sph.
   * Chamado após qualquer mudança de órbita, pan ou zoom.
   * Fórmula: posição cartesiana = centro + esfera(theta, phi, radius)
   */
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

  // ── SELEÇÃO ───────────────────────────────────────────────────────────────
  /**
   * Seleciona uma peça: atualiza selRef, cria o outline e sincroniza o estado React.
   * Passar null desseleciona tudo.
   *
   * Cor do outline: laranja (0xff8800) se bloqueada, azul (0x44aaff) se livre.
   * selData é uma cópia dos userData com py calculado em cm (base do chão).
   *
   * @param {THREE.Object3D|null} obj - Peça a selecionar, ou null para desselecionar
   */
  const selectObj = useCallback((obj) => {
    selRef.current = obj;
    if (!obj) {
      clearOutline(sceneRef.current, outlineRef);
      setSelId(null); setSelData(null);
      setStatus("Clique em uma peça para selecionar");
      return;
    }
    addOutline(obj, sceneRef.current, outlineRef);
    const ud = obj.userData;
    // Outline laranja = bloqueada, azul = livre
    const ol = outlineRef.current;
    if (ol) ol.material.color.set(ud.locked ? 0xff8800 : 0x44aaff);
    setSelId(ud.id);
    setSelData({
      ...ud,
      py: Math.round((obj.position.y - (ud.h||0)/2) * 100), // base do chão em cm
      hasHandle: ud.hasHandle !== false,
      handleY: ud.handleY !== undefined ? ud.handleY : (ud.typeId === "porta" ? (ud.h||0.7)*0.30 : 0),
      handleX: ud.handleX !== undefined ? ud.handleX : 0,
      handleAngle: ud.handleAngle || 0,
      frontMatId: ud.frontMatId || ud.matId,
      doorSide: ud.doorSide || "left",
      doorType: ud.doorType || "hinged",
      locked: ud.locked || false,
    });
    setActMat(ud.matId);
    if (ud.typeId !== "gaveta") setMatTarget("corpo");
    setTab(t => (t==="add"||t==="edit"||t==="mat") ? "edit" : t); // FIX #9: auto-tab
    setStatus(ud.locked ? `🔒 ${ud.label} (bloqueada)` : `✓ ${ud.label}`);
    rendRef._needsRender();
  }, []);

  // ── COORDENADAS NDC ───────────────────────────────────────────────────────
  /**
   * Converte um evento de mouse para coordenadas NDC (Normalized Device Coordinates).
   * NDC: x e y entre -1 e +1, origem no centro do canvas.
   * Necessário para alimentar o THREE.Raycaster.
   *
   * @param {MouseEvent} e
   * @returns {THREE.Vector2}
   */
  const getNDC = useCallback((e) => {
    const r = mountRef.current.getBoundingClientRect();
    return new THREE.Vector2(
      ((e.clientX - r.left) / r.width)  * 2 - 1,
      -((e.clientY - r.top)  / r.height) * 2 + 1
    );
  }, []);

  // ── EVENTOS DE MOUSE ──────────────────────────────────────────────────────
  /**
   * mousedown: distribui o evento para órbita, pan ou drag de peça.
   *
   * Botão direito  → inicia órbita de câmera
   * Botão do meio ou Alt+esquerdo → inicia pan de câmera
   * Botão esquerdo → raycasting; se bater em peça: seleciona e inicia drag
   *                  (salva offset entre posição da peça e ponto do plano de drag)
   *                  Peças bloqueadas são selecionadas mas não arrastadas.
   */
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

  /**
   * mousemove: processa órbita, pan ou drag de peça conforme o estado ativo.
   *
   * Órbita: ajusta theta (horizontal) e phi (vertical, clampado 0.06–1.54)
   * Pan: desloca o alvo da câmera no plano da vista (direita × cima)
   * Drag: projeta o mouse no plano horizontal (dplane), aplica offset salvo no
   *       mousedown, aplica edgeSnap e, se colisão ativa, reverte se colidir.
   *       O movimento é livre (sem snapGrid) para suavidade máxima.
   */
  const onMM = useCallback((e) => {
    if (orbit.current.on) {
      const dx = e.clientX - orbit.current.lx, dy = e.clientY - orbit.current.ly;
      sph.current.theta -= dx * 0.007;
      sph.current.phi = Math.max(0.06, Math.min(1.54, sph.current.phi + dy * 0.007));
      orbit.current.lx = e.clientX; orbit.current.ly = e.clientY;
      updateCam(); rendRef._needsRender(); return;
    }
    if (panS.current.on) {
      const dx = e.clientX - panS.current.lx, dy = e.clientY - panS.current.ly;
      const cam = cameraRef.current;
      const right = new THREE.Vector3().crossVectors(cam.getWorldDirection(new THREE.Vector3()), cam.up).normalize();
      sph.current.cx -= right.x * dx * 0.003;
      sph.current.cz -= right.z * dx * 0.003;
      sph.current.cy += dy * 0.003;
      panS.current.lx = e.clientX; panS.current.ly = e.clientY;
      updateCam(); rendRef._needsRender(); return;
    }
    if (dragS.current.on && selRef.current) {
      rc.current.setFromCamera(getNDC(e), cameraRef.current);
      const pt = _dragPt.current;
      if (rc.current.ray.intersectPlane(dplane.current, pt)) {
        const obj = selRef.current;
        const prevX = obj.position.x;
        const prevZ = obj.position.z;

        obj.position.x = pt.x + (dragS.current.ox || 0);
        obj.position.z = pt.z + (dragS.current.oz || 0);

        edgeSnap(obj, piecesRef.current);

        if (colisionOn) {
          const box = fastBox(obj);
          const collides = piecesRef.current.some(o => {
            if (o === obj) return false;
            return box.intersectsBox(fastBox(o));
          });
          if (collides) {
            obj.position.x = prevX;
            obj.position.z = prevZ;
          }
        }

        syncOutline(obj, sceneRef.current, outlineRef);
        rendRef._needsRender();
      }
    }
  }, [getNDC, updateCam, colisionOn]);

  /**
   * mouseup / mouseleave: finaliza qualquer arrasto ativo.
   *
   * Ao soltar uma peça:
   *   - Aplica snapGrid(1mm) na posição final (X e Z)
   *   - Atualiza baseX/baseZ/baseRY SOMENTE se a peça estiver fechada e parada
   *     (isOpen=false e openProgress=0) — preserva a posição de retorno de
   *     portas/gavetas que estejam abertas ou animando no momento do soltar
   *   - Atualiza py no selData (pode ter mudado via snap vertical)
   */
  const onMU = useCallback(() => {
    if (dragS.current.on && selRef.current) {
      const obj = selRef.current;
      // Snap final garante alinhamento exato com a grade
      obj.position.x = snapGrid(obj.position.x);
      obj.position.z = snapGrid(obj.position.z);
      if (obj.userData) {
        const isAnimating = obj.userData.isOpen || (obj.userData.openProgress > 0);
        // Só atualiza a base se a peça estiver totalmente fechada e parada.
        // Se estiver aberta/animando, a base já foi gravada ao abrir — não sobrescrever.
        if (!isAnimating) {
          obj.userData.baseX  = obj.position.x;
          obj.userData.baseZ  = obj.position.z;
          obj.userData.baseRY = obj.rotation.y;
        }
      }
      syncOutline(obj, sceneRef.current, outlineRef);
    }
    dragS.current = {on:false, ox:0, oz:0};
    orbit.current = {on:false};
    panS.current  = {on:false};
    // Atualiza py no selData caso snap vertical tenha mudado Y
    if (selRef.current) {
      const obj = selRef.current;
      const baseCm = Math.round((obj.position.y - (obj.userData.h||0)/2) * 100);
      setSelData(d => d ? {...d, py: baseCm} : d);
    }
  }, []);

  /**
   * wheel: controla o zoom ajustando o raio da câmera esférica.
   * Raio limitado entre 0.5m (muito perto) e 14m (visão geral).
   */
  // FIX #2: zoom tratado via listener nativo (passive:false) adicionado no useEffect
  const onWheel = useCallback(() => {}, []);

  // ── AÇÕES DE PEÇA ─────────────────────────────────────────────────────────
  /**
   * Adiciona uma nova peça do tipo e material ativos (actType, actMat).
   * Posição inicial aleatória dentro de ±40cm do centro, alinhada à grade de 1mm.
   * Garante que peças de vidro só recebem materiais de vidro.
   * Seleciona automaticamente a peça recém-criada.
   */
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
    rendRef._needsRender();
    setStatus(`➕ ${obj.userData.label} adicionado`);
  }, [actMat, actType, selectObj]);

  /**
   * Remove a peça selecionada da cena e libera toda a memória associada.
   *
   * Percorre a hierarquia com traverse() para descartar geometry, material.map
   * e material de cada Mesh filho — evita memory leak na GPU após remoção.
   * Remove também do piecesRef (Three.js) e do pieces state (React).
   */
  const delSel = useCallback(() => {
    const obj = selRef.current; if (!obj) return;
    clearOutline(sceneRef.current, outlineRef);
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
    rendRef._needsRender();
    setStatus("🗑 Peça removida");
  }, [selectObj]);

  /**
   * Duplica a peça selecionada, copiando todas as dimensões, materiais,
   * rotação, puxador e demais propriedades do userData.
   *
   * A cópia é deslocada +2mm em X e Z para ficar visível imediatamente.
   * A posição Y é preservada calculando a base (borda inferior) da original
   * via `position.y - h/2`, evitando que Groups fiquem semienterrados.
   * A geometria é reconstruída via rebuildPiece() com as dimensões copiadas.
   */
  const dupSel = useCallback(() => {
    const src = selRef.current; if (!src) return;
    const ud = src.userData;
    // Cria nova peça com mesmos parâmetros, deslocada um pouco
    const ox = snapGrid(src.position.x + GRID * 2);
    // BUG 1 FIX: usar base (borda inferior) da peça original, não o centro
    // position.y é o centro; base = position.y - h/2
    const baseY = src.position.y - (ud.h || 0) / 2;
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
    copy.userData.handleX = ud.handleX || 0;
    copy.userData.handleAngle = ud.handleAngle || 0;
    copy.userData.frontMatId = ud.frontMatId || ud.matId;
    copy.userData.label = ud.label + " (cópia)";
    // Copia propriedades de porta
    if (ud.typeId === "porta") {
      copy.userData.doorSide = ud.doorSide || "left";
      copy.userData.doorType = ud.doorType || "hinged";
    }

    // Aplica posição Y: centro = base + h/2 (igual ao que makePiece faz internamente)
    copy.position.y = baseY + (ud.h || 0) / 2;
    // FIX #5: baseX sempre copiado (inclusive portas) para evitar salto ao animar
    copy.userData.baseX = copy.position.x;
    copy.userData.baseZ = oz;
    copy.userData.baseRY = 0;

    // Reconstrói geometria com dimensões copiadas
    rebuildPiece(copy);

    // Aplica material da frente se for gaveta
    if (ud.typeId === "gaveta" && ud.frontMatId) {
      const front = copy.children?.find(c => c.userData.isFront);
      if (front) { front.material.dispose(); front.material = buildMat(ud.frontMatId, ud.w, ud.h); }
    }

    // Visibilidade do pivot do puxador
    if (copy.isGroup) {
      // handle é filho do body — usar traverse
      // porta: handle filho do grupo; gaveta: filho do front
      let _dh = copy.children.find(c => c.userData.isHandle);
      if (!_dh) { const _df = copy.children.find(c => c.userData.isFront); if (_df) _dh = _df.children.find(c => c.userData.isHandle); }
      if (_dh) _dh.visible = ud.hasHandle !== false;
    }

    sceneRef.current.add(copy);
    piecesRef.current.push(copy);
    setPieces(prev => [...prev, {id:copy.userData.id, label:copy.userData.label, typeId:copy.userData.typeId}]);
    selectObj(copy);
    rendRef._needsRender();
    setStatus(`📋 ${copy.userData.label}`);
  }, [selectObj]);

  /**
   * Atualiza uma dimensão (w, h ou d) da peça selecionada.
   *
   * Converte o valor de cm para metros, aplica o mínimo de 1mm (0.001m),
   * atualiza userData e chama rebuildPiece() para recriar a geometria.
   * Usa addOutline() (não syncOutline) para recriar o contorno com o novo tamanho.
   *
   * @param {"w"|"h"|"d"} axis  - Eixo da dimensão a alterar
   * @param {string|number} valCm - Valor em centímetros
   */
  const updateDim = useCallback((axis, valCm) => {
    const obj = selRef.current; if (!obj) return;
    const _p = parseFloat(valCm); const v = Math.max(0.001, (isNaN(_p) ? 1 : _p) / 100); // FIX #6
    obj.userData[axis] = v;
    rebuildPiece(obj);
    // BUG 8 FIX: recriar outline completo (tamanho + posição) ao redimensionar
    // syncOutline só atualizava posição, deixando o contorno com tamanho desatualizado
    addOutline(obj, sceneRef.current, outlineRef);
    const ol = outlineRef.current;
    if (ol) ol.material.color.set(obj.userData.locked ? 0xff8800 : 0x44aaff);
    const _newPy = Math.round((obj.position.y-(obj.userData.h||v)/2)*100);
    setSelData(d => ({...d, [axis]:v, py: axis==="h" ? _newPy : (d?.py??0)}));
    rendRef._needsRender();
    setStatus(`📐 ${axis.toUpperCase()}: ${Math.round(v*100)}cm`);
  }, []);

  /**
   * Atualiza a rotação de um eixo da peça selecionada.
   *
   * Normaliza o ângulo para o intervalo [-180°, +180°] usando a fórmula:
   *   `((deg % 360) + 540) % 360 - 180`
   * Salva em userData (graus) e aplica em object.rotation (radianos).
   * O eixo Three.js é extraído de "rx"→"x", "ry"→"y", "rz"→"z" via slice(1).
   *
   * @param {"rx"|"ry"|"rz"} axis - Eixo de rotação prefixado
   * @param {string|number}  val  - Ângulo em graus
   */
  const updateRot = useCallback((axis, val) => {
    const obj = selRef.current; if (!obj) return;
    let deg = parseFloat(val) || 0;
    deg = ((deg % 360) + 540) % 360 - 180;
    obj.userData[axis] = deg;
    obj.rotation[axis.slice(1)] = THREE.MathUtils.degToRad(deg);
    syncOutline(obj, sceneRef.current, outlineRef);
    setSelData(d => ({...d, [axis]: Math.round(deg)}));
    rendRef._needsRender();
    setStatus(`🔄 ${axis.toUpperCase()}: ${Math.round(deg)}°`);
  }, []);

  /**
   * Define a posição vertical (altura) da peça selecionada.
   *
   * `py` (positionY) representa a distância da BASE da peça até o chão (em cm).
   * Como Three.js posiciona pelo centro: `position.y = base_cm/100 + h/2`
   * Atualiza baseY no userData para que a animação de abertura use a posição correta.
   *
   * @param {string|number} valCm - Distância do chão em centímetros
   */
  const updateY = useCallback((valCm) => {
    const obj = selRef.current; if (!obj) return;
    const baseCm = parseFloat(valCm) || 0;
    const h = obj.userData.h || 0.1;
    // position.y é o CENTRO — base = position.y - h/2
    // logo: position.y = base + h/2
    obj.position.y = baseCm / 100 + h / 2;
    if (obj.userData) {
      obj.userData.baseY = obj.position.y;
    }
    syncOutline(obj, sceneRef.current, outlineRef);
    setSelData(d => ({...d, py: Math.round(baseCm)}));
  }, []);

  /**
   * Aplica um material ao corpo da peça selecionada.
   *
   * Descarta map (textura clonada) e material anterior antes de criar o novo —
   * evitando memory leak na GPU. Para Groups, aplica apenas no filho isBody.
   * Atualiza actMat (para novos adds) e selData.matId (para a UI).
   *
   * @param {string} mid - ID do material (catálogo ou vidro)
   */
  const applyMat = useCallback((mid) => {
    setActMat(mid);
    const obj = selRef.current; if (!obj) return;
    obj.userData.matId = mid;
    if (obj.isGroup) {
      const body = obj.children.find(c=>c.userData.isBody);
      if (body) {
        // BUG 3 FIX: descartar textura clonada antes de trocar material (evita memory leak)
        if (body.material.map) body.material.map.dispose();
        body.material.dispose();
        body.material = buildMat(mid, obj.userData.w, obj.userData.h);
      }
    } else {
      // BUG 3 FIX: descartar textura clonada antes de trocar material (evita memory leak)
      if (obj.material.map) obj.material.map.dispose();
      obj.material.dispose();
      obj.material = buildMat(mid, obj.userData.w, obj.userData.h);
    }
    setSelData(d => ({...d, matId:mid}));
    const label = ALL_MAT_ITEMS.find(m=>m.id===mid)?.label || MATS_GLASS.find(m=>m.id===mid)?.label || mid;
    rendRef._needsRender();
    setStatus(`🎨 ${label}`);
  }, []);

  /**
   * Aplica um material exclusivamente ao painel frontal de uma gaveta.
   * Só funciona para Groups (gaveta) com filho isFront.
   * Salva em userData.frontMatId e atualiza selData.
   *
   * @param {string} mid - ID do material
   */
  const applyFrontMat = useCallback((mid) => {
    const obj = selRef.current; if (!obj?.isGroup) return;
    obj.userData.frontMatId = mid;
    const front = obj.children.find(c=>c.userData.isFront);
    if (front) {
      // BUG 3 FIX: descartar textura clonada antes de trocar material (evita memory leak)
      if (front.material.map) front.material.map.dispose();
      front.material.dispose();
      front.material = buildMat(mid, obj.userData.w, obj.userData.h);
    }
    setSelData(d => ({...d, frontMatId: mid}));
    const label = ALL_MAT_ITEMS.find(m=>m.id===mid)?.label || mid;
    rendRef._needsRender();
    setStatus(`🎨 Frente: ${label}`);
  }, []);
  /**
   * Alterna abertura/fechamento da peça selecionada (gaveta ou porta).
   * Delega para toggleOpenClose() e sincroniza o estado React (selData.isOpen).
   */
  const toggleOpen = useCallback(() => {
    const obj = selRef.current; if (!obj) return;
    toggleOpenClose(obj);
    setSelData(d => ({...d, isOpen: obj.userData.isOpen}));
    rendRef._needsRender();
    setStatus(obj.userData.isOpen ? `🔓 Abrindo ${obj.userData.label}...` : `🔒 Fechando ${obj.userData.label}...`);
  }, []);

  /**
   * Mostra ou oculta o puxador da peça selecionada (porta ou gaveta).
   * Alterna handle.visible e atualiza userData.hasHandle e selData.
   */
  const toggleHandle = useCallback(() => {
    const obj = selRef.current; if (!obj?.isGroup) return;
    // puxador é filho do body (ou front para gaveta)
    // porta: handle é filho direto do grupo; gaveta: filho do front
    let _h = obj.children.find(c => c.userData.isHandle);
    if (!_h) {
      const _fr = obj.children.find(c => c.userData.isFront);
      if (_fr) _h = _fr.children.find(c => c.userData.isHandle);
    }
    if (!_h) return;
    const nowVisible = _h.visible;
    _h.visible = !nowVisible;
    obj.userData.hasHandle = !nowVisible;
    setSelData(d => ({...d, hasHandle: !nowVisible}));
    rendRef._needsRender();
    setStatus(!nowVisible ? `🔩 Maçaneta adicionada` : `🚫 Maçaneta removida`);
  }, []);

  /**
   * Bloqueia ou desbloqueia a movimentação da peça selecionada.
   *
   * Peças bloqueadas (userData.locked = true):
   *   - Não podem ser arrastadas no viewport
   *   - São obstáculos para colisão de outras peças
   *   - Recebem outline laranja em vez de azul
   *   - Exibem ícone 🔒 na lista da aba "Construir"
   */
  const toggleLock = useCallback(() => {
    const obj = selRef.current; if (!obj?.userData) return;
    const nowLocked = !obj.userData.locked;
    obj.userData.locked = nowLocked;
    // Outline laranja quando bloqueado, azul quando livre
    const ol = outlineRef.current;
    if (ol) ol.material.color.set(nowLocked ? 0xff8800 : 0x44aaff);
    setSelData(d => ({...d, locked: nowLocked}));
    // Atualiza lista de peças para refletir cadeado no nome
    setPieces(prev => prev.map(p =>
      p.id === obj.userData.id ? {...p, locked: nowLocked} : p
    ));
    rendRef._needsRender();
    setStatus(nowLocked ? `🔒 ${obj.userData.label} bloqueada` : `🔓 ${obj.userData.label} desbloqueada`);
  }, []);

  // ── ALTURA DO PUXADOR ────────────────────────────────────────
  /**
   * Atualiza a posição vertical (Y local) do puxador da peça selecionada.
   * @param {number} yCm - Deslocamento em cm a partir do centro da peça (pode ser negativo)
   */
  const updateHandleY = useCallback((yCm) => {
    const obj = selRef.current; if (!obj?.userData) return;
    let _h = null; obj.traverse(ch => { if (ch.userData.isHandle) _h = ch; });
    if (!_h) return;
    const parsed = parseFloat(yCm);
    const yM = isNaN(parsed) ? 0 : parsed / 100;
    const maxY = obj.userData.h / 2 - 0.02;
    const clamp = Math.max(-maxY, Math.min(maxY, yM));
    // refY (ponto fixo) já está em position.y na criação; aqui só ajustamos o offset
    // Recria o handle com o novo offset para manter o ponto fixo correto
    // porta: parent = grupo; gaveta: parent = front
    const _uhParent = obj.userData.typeId === "gaveta"
      ? (obj.children.find(ch=>ch.userData.isFront) || obj.children.find(ch=>ch.userData.isBody))
      : obj; // grupo inteiro para porta
    if (_uhParent) {
      const nh = attachHandle(_uhParent, obj.userData.w, obj.userData.h, obj.userData.slabD||obj.userData.d,
        obj.userData.typeId, obj.userData.doorSide||"left",
        obj.userData.handleX||0, clamp, obj.userData.handleAngle||0);
      if (nh) nh.visible = obj.userData.hasHandle !== false;
    }
    obj.userData.handleY = clamp;
    setSelData(d => ({...d, handleY: clamp}));
    rendRef._needsRender();
    setStatus(`🔩 Puxador ↕: ${Math.round(clamp*100)}cm`);
  }, []);

  // ── POSIÇÃO HORIZONTAL DO PUXADOR (offset relativo ao centro do body) ──
  const updateHandleX = useCallback((xCm) => {
    const obj = selRef.current; if (!obj?.userData) return;
    const parsed = parseFloat(xCm);
    const xM = isNaN(parsed) ? 0 : parsed / 100;
    const maxX = obj.userData.w / 2 - 0.02;
    const clamp = Math.max(-maxX, Math.min(maxX, xM));
    const _uhParent = obj.userData.typeId === "gaveta"
      ? (obj.children.find(ch=>ch.userData.isFront) || obj.children.find(ch=>ch.userData.isBody))
      : obj;
    if (_uhParent) {
      const nh = attachHandle(_uhParent, obj.userData.w, obj.userData.h, obj.userData.slabD||obj.userData.d,
        obj.userData.typeId, obj.userData.doorSide||"left",
        clamp, obj.userData.handleY||0, obj.userData.handleAngle||0);
      if (nh) nh.visible = obj.userData.hasHandle !== false;
    }
    obj.userData.handleX = clamp;
    setSelData(d => ({...d, handleX: clamp}));
    rendRef._needsRender();
    setStatus(`🔩 Puxador ↔: ${Math.round(clamp*100)}cm`);
  }, []);

  // ── ROTAÇÃO DO PUXADOR ────────────────────────────────────────
  const updateHandleAngle = useCallback((deg) => {
    const obj = selRef.current; if (!obj?.userData) return;
    const parsed = parseFloat(deg);
    const angle = isNaN(parsed) ? 0 : ((parsed % 360) + 360) % 360;
    const _uhParent = obj.userData.typeId === "gaveta"
      ? (obj.children.find(ch=>ch.userData.isFront) || obj.children.find(ch=>ch.userData.isBody))
      : obj;
    if (_uhParent) {
      const nh = attachHandle(_uhParent, obj.userData.w, obj.userData.h, obj.userData.slabD||obj.userData.d,
        obj.userData.typeId, obj.userData.doorSide||"left",
        obj.userData.handleX||0, obj.userData.handleY||0, angle);
      if (nh) nh.visible = obj.userData.hasHandle !== false;
    }
    obj.userData.handleAngle = angle;
    setSelData(d => ({...d, handleAngle: angle}));
    rendRef._needsRender();
    setStatus(`🔩 Puxador ↻: ${Math.round(angle)}°`);
  }, []);

  // ── TOGGLE LADO DA PORTA ──────────────────────────────────────
  // BUG 6 FIX: aceita lado explícito ("left"|"right") em vez de sempre alternar.
  // Quando chamado sem argumento, mantém comportamento de toggle (compatibilidade).
  const toggleDoorSide = useCallback((forceSide) => {
    const obj = selRef.current; if (!obj?.userData) return;
    if (obj.userData.typeId !== "porta") return;
    obj.userData.isOpen = false;
    obj.userData.openProgress = 0;
    obj.position.x = obj.userData.baseX;
    obj.position.z = obj.userData.baseZ;
    obj.rotation.y = obj.userData.baseRY;
    animSet.delete(obj);
    const newSide = forceSide || (obj.userData.doorSide === "right" ? "left" : "right");
    obj.userData.doorSide = newSide;
    // Recalcular pivot do grupo para o novo lado da dobradica
    const _w = obj.userData.w;
    const _prevSide = newSide === "left" ? "right" : "left";
    const _centerX = _prevSide === "left" ? obj.userData.baseX - _w/2 : obj.userData.baseX + _w/2;
    const _newBaseX = newSide === "left" ? _centerX + _w/2 : _centerX - _w/2;
    obj.userData.baseX = _newBaseX;
    obj.position.x = _newBaseX;
    const _cX = newSide === "right" ? _w/2 : -_w/2;
    obj.children.forEach(c => {
      if (c.userData.isBody || c.userData.isTrack) c.position.x = _cX; // pivot posiciona-se via bodyOffsetX
    });
    // Recolocar puxador no body com o novo doorSide (ponto fixo muda de lado)
    {
      // Remove handle antigo do grupo, recriar com novo doorSide
      const _tdsOldH = obj.children.find(c => c.userData.isHandle);
      if (_tdsOldH) { _tdsOldH.traverse(c=>{if(c.isMesh){c.geometry.dispose();c.material.dispose();}}); obj.remove(_tdsOldH); }
      const nh = attachHandle(obj, obj.userData.w, obj.userData.h, obj.userData.slabD||obj.userData.d,
        "porta", newSide,
        obj.userData.handleX||0, obj.userData.handleY||0, obj.userData.handleAngle||0);
      if (nh) nh.visible = obj.userData.hasHandle !== false;
    }
    setSelData(d => ({...d, doorSide: newSide, isOpen: false}));
    rendRef._needsRender();
    setStatus(`🚪 Dobraça: ${newSide === "left" ? "Direita" : "Esquerda"}`);
  }, []);

  /**
   * Altera o tipo de abertura da porta selecionada entre "hinged" e "sliding".
   *
   * Fecha a porta antes de mudar (evita posição travada em estado intermediário).
   * Controla a visibilidade das canaletas: visíveis apenas no modo "sliding".
   *
   * @param {"hinged"|"sliding"} newType - Novo tipo de abertura
   */
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
    // Reconstrói o puxador preservando posição Y, X e ângulo salvos no userData
    // Recolocar puxador no body — attachHandle remove o antigo automaticamente
    {
      const _tdtOldH = obj.children.find(c => c.userData.isHandle);
      if (_tdtOldH) { _tdtOldH.traverse(c=>{if(c.isMesh){c.geometry.dispose();c.material.dispose();}}); obj.remove(_tdtOldH); }
      const nh = attachHandle(obj, obj.userData.w, obj.userData.h, obj.userData.slabD||obj.userData.d,
        "porta", obj.userData.doorSide||"left",
        obj.userData.handleX||0, obj.userData.handleY||0, obj.userData.handleAngle||0);
      if (nh) nh.visible = obj.userData.hasHandle !== false;
    }
    setSelData(d => ({...d, doorType: newType, isOpen: false}));
    rendRef._needsRender();
    setStatus(newType === "sliding" ? `🛤 Porta de correr (canaleta)` : `🚪 Porta de abrir (dobradiça)`);
  }, []);
  /**
   * Define um ângulo de câmera predefinido.
   * Suporta: "iso" | "top" | "front" | "back" | "left" | "right"
   * Todos com raio fixo de 3.5m centrado em (0, 0.4, 0).
   *
   * @param {string} v - Nome da vista predefinida
   */
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

  /**
   * Seleciona uma peça a partir do seu ID (usado pela lista da aba "Construir"
   * e pela tabela do plano de corte).
   *
   * @param {number} id - userData.id da peça
   */
  const selFromList = useCallback((id) => {
    const obj = piecesRef.current.find(p=>p.userData.id===id);
    if (obj) selectObj(obj);
  }, [selectObj]);

  // ── RENOMEAR PEÇA ─────────────────────────────────────────────────────────
  /**
   * Ativa o modo de edição inline do nome de uma peça.
   * Para a propagação do clique (evita selecionar a peça ao clicar no botão ✏).
   * Foca o input após 30ms (aguarda o React renderizar o campo).
   *
   * @param {number} id    - userData.id da peça
   * @param {string} label - Nome atual (pré-preenche o input)
   * @param {Event}  e     - Evento de clique (para stopPropagation)
   */
  const startRename = useCallback((id, label, e) => {
    e.stopPropagation();
    setEditingId(id); setEditingName(label);
    setTimeout(()=>renameRef.current?.focus(), 30);
  }, []);

  /**
   * Confirma a renomeação: atualiza userData.label, pieces state e selData.
   * Cancela silenciosamente se o nome estiver vazio após trim().
   */
  const confirmRename = useCallback(() => {
    const name = editingName.trim(); if (!name) { setEditingId(null); return; }
    const obj = piecesRef.current.find(p=>p.userData.id===editingId);
    if (obj) obj.userData.label = name;
    setPieces(prev => prev.map(p => p.id===editingId ? {...p, label:name} : p));
    if (selRef.current?.userData.id===editingId) setSelData(d=>({...d, label:name}));
    setEditingId(null);
    setStatus(`✏ Renomeado: ${name}`);
  }, [editingId, editingName]);

  // ── HELPERS DE FORMATAÇÃO ─────────────────────────────────────────────────
  /** Converte metros para cm arredondado (ex: 0.36 → 36) */
  const cm  = v => v !== undefined ? Math.round(v * 100) : 0;
  /** Arredonda para inteiro */
  const R   = v => Math.round(v);
  /** Retorna o ícone do tipo de peça pelo typeId */
  const tIcon = id => PTYPES.find(t=>t.id===id)?.icon || "▭";
  /** True se a peça selecionada tem animação (gaveta ou porta) */
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
                    <span onClick={e=>{e.stopPropagation();const _o=piecesRef.current.find(o=>o.userData.id===p.id);if(_o){selRef.current=_o;dupSel();}}} title="Duplicar" /* FIX #8 */
                      style={{flexShrink:0,fontSize:11,color:"#3a6a4a",padding:"1px 4px",
                        borderRadius:3,cursor:"pointer",
                        background:selId===p.id?"#1a3a2a":"transparent"}}>📋</span>
                    <span onClick={e=>{e.stopPropagation();const _o=piecesRef.current.find(o=>o.userData.id===p.id);if(_o){selRef.current=_o;toggleLock();}}} title={p.locked?"Desbloquear":"Bloquear"} /* FIX #8 */
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

                {/* Maçaneta/Puxador — toggle on/off */}
                <div onClick={toggleHandle} style={{
                  display:"flex",alignItems:"center",gap:10,
                  padding:"9px 12px",borderRadius:7,cursor:"pointer",
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

                {/* Controles de posição e rotação do puxador */}
                {selData.hasHandle && (() => {
                  const hY   = selData.handleY   !== undefined ? selData.handleY   : 0;
                  const hX   = selData.handleX   !== undefined ? selData.handleX   : 0;
                  const hAng = selData.handleAngle !== undefined ? selData.handleAngle : 0;
                  const maxY = Math.round((selData.h / 2 - 0.02) * 100);
                  const maxX = Math.round((selData.w / 2 - 0.02) * 100);
                  const sliderStyle = {width:"100%",accentColor:"#c8a040",cursor:"pointer",height:4,marginTop:2};
                  const numStyle    = {width:52,padding:"2px 5px",background:"#080c18",border:"1px solid #2a3a5a",
                                        borderRadius:4,color:"#c8a040",fontSize:11,outline:"none",textAlign:"right"};
                  const labelStyle  = {fontSize:9,letterSpacing:1,color:"#3a5a7a",textTransform:"uppercase",flex:1};
                  const valStyle    = {fontSize:10,color:"#c8a040",fontFamily:"monospace",minWidth:44,textAlign:"right"};
                  return (
                    <div style={{marginTop:6,padding:"8px 10px",background:"#0e0e18",
                      border:"1px solid #2a2a3a",borderRadius:6,display:"flex",flexDirection:"column",gap:8}}>

                      {/* ── Vertical (Y) ── */}
                      <div>
                        <div style={{display:"flex",alignItems:"center",gap:4,marginBottom:2}}>
                          <span style={labelStyle}>↕ Altura</span>
                          <span style={valStyle}>{(hY*100).toFixed(1)} cm</span>
                          <input type="number" step={0.5} min={-maxY} max={maxY}
                            value={+(hY*100).toFixed(1)}
                            onChange={e => updateHandleY(e.target.value)}
                            style={numStyle}/>
                        </div>
                        <input type="range" min={-maxY} max={maxY} step={1}
                          value={Math.round(hY*100)}
                          onChange={e => updateHandleY(e.target.value)}
                          style={sliderStyle}/>
                        <div style={{display:"flex",justifyContent:"space-between",fontSize:8,color:"#2a4a5a"}}>
                          <span>↓ Base</span><span>● Centro</span><span>Topo ↑</span>
                        </div>
                      </div>

                      {/* ── Horizontal (X) ── */}
                      <div>
                        <div style={{display:"flex",alignItems:"center",gap:4,marginBottom:2}}>
                          <span style={labelStyle}>↔ Lateral</span>
                          <span style={valStyle}>{(hX*100).toFixed(1)} cm</span>
                          <input type="number" step={0.5} min={-maxX} max={maxX}
                            value={+(hX*100).toFixed(1)}
                            onChange={e => updateHandleX(e.target.value)}
                            style={numStyle}/>
                        </div>
                        <input type="range" min={-maxX} max={maxX} step={1}
                          value={Math.round(hX*100)}
                          onChange={e => updateHandleX(e.target.value)}
                          style={sliderStyle}/>
                        <div style={{display:"flex",justifyContent:"space-between",fontSize:8,color:"#2a4a5a"}}>
                          <span>◁ Esq</span><span>● Centro</span><span>Dir ▷</span>
                        </div>
                      </div>

                      {/* ── Rotação (Z) ── */}
                      <div>
                        <div style={{display:"flex",alignItems:"center",gap:4,marginBottom:2}}>
                          <span style={labelStyle}>↻ Rotação</span>
                          <span style={valStyle}>{Math.round(hAng)}°</span>
                          <input type="number" step={1} min={0} max={359}
                            value={Math.round(hAng)}
                            onChange={e => updateHandleAngle(e.target.value)}
                            style={numStyle}/>
                        </div>
                        <input type="range" min={0} max={359} step={1}
                          value={Math.round(hAng)}
                          onChange={e => updateHandleAngle(e.target.value)}
                          style={sliderStyle}/>
                        <div style={{display:"flex",justifyContent:"space-between",fontSize:8,color:"#2a4a5a"}}>
                          <span>0°</span><span>— 180°</span><span>359°</span>
                        </div>
                        {/* Atalhos rápidos */}
                        <div style={{display:"flex",gap:3,marginTop:5}}>
                          {[[0,"—"],[45,"↗"],[90,"|"],[135,"↘"]].map(([a,lbl])=>(
                            <div key={a} onClick={()=>updateHandleAngle(a)}
                              style={{flex:1,textAlign:"center",padding:"3px 0",borderRadius:3,
                                cursor:"pointer",fontSize:11,fontWeight:700,
                                background:Math.round(hAng)===a?"#2a1e08":"#0e0e18",
                                border:`1px solid ${Math.round(hAng)===a?"#c8a040":"#2a2a3a"}`,
                                color:Math.round(hAng)===a?"#c8a040":"#4a5a6a"}}>
                              {lbl}
                            </div>
                          ))}
                        </div>
                      </div>

                    </div>
                  );
                })()}

                {/* Lado da dobradiça — só porta de abrir */}
                {selData.typeId==="porta" && selData.doorType!=="sliding" && (
                  <div style={{marginTop:2}}>
                    <SL>Dobradiça (lado da articulação)</SL>
                    <div style={{display:"flex",gap:4}}>
                      {[["right","◁ Esquerda"],["left","Direita ▷"]].map(([side,lbl])=>(
                        <div key={side} onClick={()=>{
                          // BUG 6 FIX: setar lado diretamente (não alternar) — evita comportamento inesperado
                          toggleDoorSide(side);
                        }} style={{
                          flex:1,padding:"8px 4px",borderRadius:6,cursor:"pointer",textAlign:"center",
                          background:selData.doorSide===side?"#1a2838":"#101018",
                          border:`2px solid ${selData.doorSide===side?"#4a8aaa":"#2a2a3a"}`,
                          transition:"all 0.15s"}}>
                          <div style={{fontSize:14}}>{side==="right"?"⬅🚪":"🚪➡"}</div>
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
                          // BUG 6 FIX: setar lado diretamente (não alternar) — evita comportamento inesperado
                          toggleDoorSide(side);
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

            {/* Posição Y — altura com encaixe automático */}
            <S>
              <SL>Posição Vertical (altura)</SL>

              {/* Campo de altura com botões ±1cm */}
              <div style={{display:"flex",alignItems:"center",gap:4,marginBottom:6}}>
                <div style={{fontSize:9,color:"#4a6a7a",width:90,flexShrink:0}}>↑ Do chão (cm)</div>
                <div onClick={()=>updateY((selData.py??0)-1)}
                  style={{width:24,height:28,background:"#0a1020",border:"1px solid #1a3a5a",
                    borderRadius:"4px 0 0 4px",cursor:"pointer",display:"flex",
                    alignItems:"center",justifyContent:"center",fontSize:14,color:"#4a7aaa",
                    flexShrink:0,userSelect:"none"}}>−</div>
                <input type="number" step={1} value={selData.py??0}
                  onChange={e=>updateY(e.target.value)}
                  style={{flex:1,padding:"4px 5px",background:"#080c18",border:"1px solid #2a3a5a",
                    borderTop:"1px solid #2a3a5a",borderBottom:"1px solid #2a3a5a",
                    borderLeft:"none",borderRight:"none",
                    color:"#80c0e0",fontSize:11,outline:"none",textAlign:"center",minWidth:0}}/>
                <div onClick={()=>updateY((selData.py??0)+1)}
                  style={{width:24,height:28,background:"#0a1020",border:"1px solid #1a3a5a",
                    borderRadius:"0 4px 4px 0",cursor:"pointer",display:"flex",
                    alignItems:"center",justifyContent:"center",fontSize:14,color:"#4a7aaa",
                    flexShrink:0,userSelect:"none"}}>+</div>
                <div style={{fontSize:9,color:"#3a5a7a",flexShrink:0}}>cm</div>
              </div>

              {/* Botão: Pousar no chão */}
              <div onClick={()=>updateY(0)} style={{
                display:"flex",alignItems:"center",gap:8,padding:"7px 10px",
                borderRadius:5,cursor:"pointer",marginBottom:4,
                background:"#080e18",border:"1px solid #1a3a5a",transition:"all 0.12s"}}>
                <span style={{fontSize:14}}>⬇</span>
                <div>
                  <div style={{fontSize:10,fontWeight:600,color:"#4a8aaa"}}>Pousar no chão</div>
                  <div style={{fontSize:8,color:"#3a5060"}}>define altura = 0</div>
                </div>
              </div>

              {/* Botão: Encaixar no topo de outra peça */}
              <div onClick={()=>{
                const obj = selRef.current; if (!obj) return;
                const {w:mw=0.1, h:mh=0.1, d:md=0.1} = obj.userData;
                // Encontra a peça mais próxima em X/Z cujo topo encaixa a base do moving
                let bestTopY = null, bestDist = Infinity;
                for (const o of piecesRef.current) {
                  if (o === obj) continue;
                  const {w:ow=0.1, h:oh=0.1, d:od=0.1} = o.userData;
                  // Verifica sobreposição em X e Z
                  const dx = Math.abs(obj.position.x - o.position.x) - (mw/2 + ow/2);
                  const dz = Math.abs(obj.position.z - o.position.z) - (md/2 + od/2);
                  if (dx < 0.08 && dz < 0.08) { // há sobreposição ou proximidade horizontal
                    const topY = o.position.y + oh/2; // topo da peça abaixo em metros
                    const dist = Math.abs((obj.position.y - mh/2) - topY);
                    if (dist < bestDist) { bestDist = dist; bestTopY = topY; }
                  }
                }
                if (bestTopY !== null) {
                  // base do moving = topY → posição em cm para updateY
                  updateY(Math.round(bestTopY * 100));
                  rendRef._needsRender();
                  setStatus("🔝 Encaixado no topo da peça abaixo");
                } else {
                  setStatus("⚠ Nenhuma peça abaixo — alinhe em X/Z primeiro");
                }
              }} style={{
                display:"flex",alignItems:"center",gap:8,padding:"7px 10px",
                borderRadius:5,cursor:"pointer",
                background:"#0a1420",border:"1px solid #2a4a6a",transition:"all 0.12s"}}>
                <span style={{fontSize:14}}>🔝</span>
                <div>
                  <div style={{fontSize:10,fontWeight:600,color:"#5a9aaa"}}>Encaixar no topo</div>
                  <div style={{fontSize:8,color:"#3a5060"}}>sobe até encostar na peça abaixo</div>
                </div>
              </div>
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
            <SL style={{marginTop:8}}>Ferramentas</SL>
            {/* Colisão toggle */}
            <div onClick={()=>setColisionOn(v=>!v)} style={{
              display:"flex",alignItems:"center",gap:8,padding:"8px 10px",
              borderRadius:6,cursor:"pointer",marginBottom:4,
              background:colisionOn?"#0e1e10":"#0e0e18",
              border:`2px solid ${colisionOn?"#2a8a3a":"#2a2a3a"}`,
              transition:"all 0.15s"}}>
              <span style={{fontSize:16}}>{colisionOn?"🧱":"🫥"}</span>
              <div style={{flex:1}}>
                <div style={{fontSize:11,fontWeight:600,color:colisionOn?"#70c080":"#4a6a7a"}}>
                  {colisionOn?"Colisão Ativa":"Colisão Desativada"}
                </div>
                <div style={{fontSize:9,color:"#3a5a4a"}}>
                  {colisionOn?"peças não se atravessam":"livre atravessar"}
                </div>
              </div>
            </div>
          </S>
        )}

        {/* ── PLANO DE CORTE + ORÇAMENTO ── */}
        {/* BUG 2 FIX: passa pieces como prop para forçar re-render quando peças mudam */}
        {tab==="cut" && <CutTab pieces={pieces} prices={prices} setPrices={setPrices} piecesRef={piecesRef} selFromList={selFromList} toggleLock={toggleLock}/>}
      </div>

      {/* ═══ VIEWPORT ═══ */}
      <div style={{flex:1,position:"relative",display:"flex",flexDirection:"column"}}>
        <div ref={mountRef} style={{flex:1}}
          onMouseDown={onMD} onMouseMove={onMM} onMouseUp={onMU} onMouseLeave={onMU}
          onWheel={onWheel} onContextMenu={e=>e.preventDefault()}/>

        {/* Status bar */}
        <div style={{height:22,background:"#080810",borderTop:"1px solid #121222",flexShrink:0,
          display:"flex",alignItems:"center",padding:"0 14px",fontSize:10,gap:8}}>
          <span style={{color:"#3a6a40"}}>●</span>
          <span style={{color:"#4a6a50",flex:1}}>{status}</span>
          <span style={{color:colisionOn?"#3a7a3a":"#2a3a4a",fontSize:9}} title="Colisão">
            {colisionOn?"🧱":"🫥"}
          </span>
          <span style={{color:"#2a3a3a",fontSize:9}}>Peças: {pieces.length}</span>
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

// ─────────────────────────────────────────────────────────────────────────────
// COMPONENTES UI AUXILIARES
// Componentes simples e sem estado usados para manter o JSX do App organizado.
// Todos são definidos fora do App para evitar recriação a cada render.
// ─────────────────────────────────────────────────────────────────────────────

/**
 * S — Section wrapper
 * Container com padding e borda inferior para separar seções da sidebar.
 */
function S({children}) {
  return (
    <div style={{padding:"10px 12px",borderBottom:"1px solid #0e1828"}}>
      {children}
    </div>
  );
}

/**
 * SL — Section Label
 * Rótulo em uppercase com letter-spacing para títulos de seção.
 */
function SL({children}) {
  return (
    <div style={{fontSize:9,letterSpacing:1.5,color:"#3a5a7a",textTransform:"uppercase",
      marginBottom:5,marginTop:2}}>{children}</div>
  );
}

/**
 * PBtn — Panel Button
 * Botão de ação da sidebar com cor de fundo customizável e estado disabled.
 *
 * @param {React.ReactNode} children - Conteúdo do botão (texto + emoji)
 * @param {Function}  onClick  - Callback de clique
 * @param {string}    [c]      - Cor de fundo CSS (padrão: azul escuro)
 * @param {boolean}   [disabled] - Quando true, desabilita clique e aplica opacidade
 */
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

/**
 * DI — Dimension Input
 * Campo numérico para editar dimensões (L, A, P) em centímetros.
 * Exibe label à esquerda e sufixo "cm" à direita.
 *
 * @param {string}   label    - Texto descritivo da dimensão
 * @param {number}   value    - Valor atual em cm
 * @param {Function} onChange - Callback chamado com o novo valor (string)
 */
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

/**
 * MI — Material Item
 * Card clicável do catálogo de materiais com swatch de cor e nome.
 * Para vidros, exibe gradiente translúcido no swatch.
 *
 * @param {{id:string, label:string, color:string}} m - Dados do material
 * @param {boolean}  active - Se este material está selecionado atualmente
 * @param {Function} onSel  - Callback ao clicar
 * @param {boolean}  [glass] - Se true, renderiza swatch especial de vidro
 */
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

/**
 * QB — Quick Button
 * Botão compacto para atalhos de rotação rápida (Flat, Pé, ⟳90°Y, etc.).
 */
function QB({children, onClick}) {
  return (
    <div onClick={onClick} style={{padding:"3px 7px",borderRadius:3,cursor:"pointer",
      fontSize:9,background:"#101828",border:"1px solid #1e3048",color:"#6090b0",whiteSpace:"nowrap"}}>
      {children}
    </div>
  );
}

/**
 * NoSel — No Selection placeholder
 * Mensagem exibida nas abas "Editar" e "Material" quando nenhuma peça está selecionada.
 *
 * @param {string} [msg] - Mensagem customizada (padrão: instrução genérica)
 */
function NoSel({msg="Selecione uma peça na cena"}) {
  return (
    <div style={{margin:"12px",padding:"10px",background:"#0e1420",border:"1px solid #2a3a4a",
      borderRadius:6,fontSize:11,color:"#4a6070",textAlign:"center"}}>← {msg}</div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ABA DE PLANO DE CORTE E ORÇAMENTO
//
// Separado em componente próprio para isolar o cálculo pesado do render
// principal do App. Recebe `pieces` (state React) como prop para garantir
// re-render sempre que peças são adicionadas, removidas ou renomeadas.
//
// Cálculos realizados:
//   totalM2    → soma das áreas (L × A) de todas as peças em m²
//   totalPerim → perímetro total de fita de borda (2×(L+A) + 4×esp por peça)
//   chapas     → número de chapas necessárias (ceil(totalM2 / área_chapa))
//   Custos:    material, fita, corte e mão de obra (opcional)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * PriceRow — linha de campo editável de preço no painel de configurações.
 *
 * @param {string}   label     - Descrição do campo
 * @param {string}   field     - Chave em prices (ex: "priceM2")
 * @param {string}   suffix    - Unidade exibida à direita (ex: "R$", "mm")
 * @param {Object}   prices    - Objeto de preços atual
 * @param {Function} setPrices - Setter do estado de preços
 */
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

/**
 * CutTab — Aba de Plano de Corte e Orçamento
 *
 * Lê piecesRef.current (dados 3D em tempo real) e calcula tudo localmente.
 * O prop `pieces` (_piecesState) é usado apenas para acionar re-renders React
 * quando a lista de peças muda — não é lido diretamente no cálculo.
 *
 * Filtra peças com dimensões > 10mm para excluir handles e tracks internos.
 * Dimensões exibidas em mm (inteiros) para praticidade de marcenaria.
 *
 * Exporta relatório em .txt via Blob URL — sem dependências externas.
 *
 * @param {Array}    pieces      - Estado React de peças (só para trigger de re-render)
 * @param {Object}   prices      - Configurações de preço atuais
 * @param {Function} setPrices   - Setter de preços
 * @param {Object}   piecesRef   - Ref com array de objetos 3D da cena
 * @param {Function} selFromList - Callback para selecionar peça por ID
 * @param {Function} toggleLock  - Callback para bloquear/desbloquear peça
 */
// BUG 2 FIX: pieces (state) recebido como prop — garante re-render ao adicionar/remover peças
function CutTab({pieces: _piecesState, prices, setPrices, piecesRef, selFromList, toggleLock}) {
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
  // BUG 7 FIX: incluir bordas da espessura (d) no perímetro real de cada peça
  // Cada peça tem 4 bordas principais (2×L + 2×A) mais 4 bordas de espessura (4×d)
  const totalPerim = panels.reduce((a,p) => a + 2*((p.w+p.h)/1000) + 4*(p.d/1000), 0);
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
    document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url); // FIX #12
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
                      onClick={() => { const _o=piecesRef.current.find(o=>o.userData.id===p.id); if(_o){selRef.current=_o; selFromList(p.id); toggleLock();} }}
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
