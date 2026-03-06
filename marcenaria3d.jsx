<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1.0"/>
<title>Modelare 3D — Móveis sob medida</title>
<style>
  *{margin:0;padding:0;box-sizing:border-box;}
  body{background:#0c0c14;overflow:hidden;font-family:'Segoe UI',sans-serif;}
  #root{width:100vw;height:100vh;}
  #loading{position:fixed;inset:0;background:#0c0c14;display:flex;flex-direction:column;
    align-items:center;justify-content:center;gap:16px;z-index:9999;color:#c8a060;}
  #loading-bar{width:280px;height:4px;background:#1a1a2a;border-radius:2px;overflow:hidden;}
  #loading-fill{height:100%;background:linear-gradient(90deg,#4a8aff,#c8a060);
    border-radius:2px;transition:width 0.3s;width:0%;}
  #loading-text{font-size:12px;color:#4a7aaa;letter-spacing:1px;}

  /* ── AUTH SYSTEM ── */
  #auth-overlay{position:fixed;inset:0;background:linear-gradient(135deg,#060810 0%,#0a0e1a 50%,#060c14 100%);display:flex;align-items:center;justify-content:center;z-index:9999;font-family:'Segoe UI',sans-serif;}
  #auth-overlay.hidden{display:none;}
  .auth-box{width:380px;background:linear-gradient(160deg,#0c1220,#080d18);border:1px solid #1a2a40;border-radius:16px;padding:40px 36px;box-shadow:0 24px 60px rgba(0,0,0,.8);}
  .auth-logo{text-align:center;margin-bottom:28px;}
  .auth-logo .icon{font-size:42px;display:block;margin-bottom:8px;}
  .auth-logo h1{font-size:22px;font-weight:800;letter-spacing:3px;color:#c8d8e8;margin:0;}
  .auth-logo p{font-size:11px;color:#3a5a7a;letter-spacing:2px;margin:4px 0 0;}
  .auth-field{margin-bottom:16px;}
  .auth-field label{display:block;font-size:10px;color:#3a6a8a;letter-spacing:1.5px;text-transform:uppercase;margin-bottom:6px;font-weight:600;}
  .auth-field input{width:100%;box-sizing:border-box;padding:11px 14px;background:#050a14;border:1.5px solid #1a2a40;border-radius:8px;color:#a0c8e0;font-size:14px;outline:none;transition:border-color .2s;}
  .auth-field input:focus{border-color:#2a5a8a;}
  .auth-btn{width:100%;padding:13px;background:linear-gradient(135deg,#1a4060,#0e2840);border:1.5px solid #2a5a8a;border-radius:8px;color:#80c0e0;font-size:14px;font-weight:700;letter-spacing:1px;cursor:pointer;margin-top:8px;transition:all .2s;}
  .auth-btn:hover{background:linear-gradient(135deg,#224870,#162e50);}
  .auth-error{color:#e05050;font-size:11px;text-align:center;margin-top:10px;min-height:16px;}
  .auth-expires{text-align:center;font-size:10px;color:#2a4a6a;margin-top:20px;padding-top:16px;border-top:1px solid #0e1a28;line-height:1.7;}
  .auth-expires span{color:#3a7aaa;font-weight:600;}
  #admin-overlay{position:fixed;inset:0;background:rgba(0,0,0,.92);display:none;align-items:center;justify-content:center;z-index:9998;font-family:'Segoe UI',sans-serif;}
  #admin-overlay.show{display:flex;}
  .admin-box{width:500px;max-height:90vh;overflow-y:auto;background:#0a0e1c;border:1px solid #1a3050;border-radius:14px;padding:32px;box-shadow:0 20px 60px rgba(0,0,0,.9);}
  .admin-box h2{font-size:13px;font-weight:700;color:#6aaae0;letter-spacing:2px;text-transform:uppercase;margin:0 0 20px;padding-bottom:12px;border-bottom:1px solid #0e1830;}
  .admin-row{display:flex;align-items:center;gap:12px;margin-bottom:12px;}
  .admin-row label{font-size:11px;color:#3a6a8a;width:140px;flex-shrink:0;}
  .admin-row input{flex:1;padding:8px 12px;background:#050a14;border:1.5px solid #1a2a40;border-radius:6px;color:#80c0e0;font-size:13px;outline:none;}
  .admin-row input:focus{border-color:#2a5080;}
  .admin-save{padding:10px 22px;background:linear-gradient(135deg,#1a4060,#0e2840);border:1.5px solid #2a5a8a;border-radius:7px;color:#80c0e0;font-size:13px;font-weight:700;cursor:pointer;margin-right:8px;}
  .admin-close{padding:10px 18px;background:#100a0a;border:1.5px solid #4a2020;border-radius:7px;color:#a05050;font-size:13px;cursor:pointer;}
  .admin-status{font-size:11px;color:#3aaa6a;text-align:center;margin-top:10px;min-height:14px;}
  .admin-section{margin-top:22px;border-top:1px solid #0e1830;padding-top:18px;}
  .admin-section h3{font-size:11px;color:#4a7aaa;letter-spacing:1.5px;text-transform:uppercase;margin:0 0 12px;}
  .user-row{display:flex;align-items:center;gap:8px;padding:7px 10px;border-radius:6px;margin-bottom:4px;background:#070b14;}
  .user-row span{font-size:11px;color:#4a7080;flex:1;}
  .user-row .badge{font-size:9px;padding:2px 7px;border-radius:10px;background:#0e1830;color:#3a6a8a;}
  .user-row .badge.ok{background:#0a1e14;color:#3a8a5a;}
  .user-row .badge.exp{background:#1e0a0a;color:#8a3a3a;}
  .user-del{font-size:10px;color:#804040;cursor:pointer;padding:2px 7px;background:#14080a;border:1px solid #3a1a1a;border-radius:3px;}
</style>
</head>
<body>

<div id="auth-overlay">
  <div class="auth-box">
    <div class="auth-logo">
      <span class="icon">🪚</span>
      <h1>MODELARE 3D</h1>
      <p>ACESSO LICENCIADO</p>
    </div>
    <div class="auth-field">
      <label>Usuário</label>
      <input type="text" id="auth-user" placeholder="Digite seu usuário" autocomplete="off"/>
    </div>
    <div class="auth-field">
      <label>Senha</label>
      <input type="password" id="auth-pass" placeholder="Digite sua senha" onkeydown="if(event.key==='Enter')authLogin()"/>
    </div>
    <button class="auth-btn" onclick="authLogin()">ENTRAR</button>
    <div class="auth-error" id="auth-error"></div>
    <div class="auth-expires" id="auth-info"></div>
  </div>
</div>

<div id="admin-overlay">
  <div class="admin-box">
    <h2>⚙ Painel Administrativo</h2>
    <div class="admin-row"><label>Usuário admin</label><input type="text" id="adm-user" placeholder="login"/></div>
    <div class="admin-row"><label>Senha admin</label><input type="password" id="adm-pass" placeholder="senha"/></div>
    <div class="admin-row"><label>Expira em</label><input type="text" id="adm-expires" placeholder="dd/mm/aaaa" maxlength="10" oninput="fmtDateInput(this)"/></div>
    <div style="display:flex;gap:8px;margin-top:4px">
      <button class="admin-save" onclick="adminAddUser()">➕ Adicionar Usuário</button>
      <button class="admin-close" onclick="document.getElementById('admin-overlay').classList.remove('show')">✕ Fechar</button>
    </div>
    <button class="admin-save" onclick="adminDownloadHTML()" style="width:100%;margin-top:6px;background:linear-gradient(135deg,#0a2a1a,#082018);border-color:#2a6a3a;color:#60c880">⬇ Baixar HTML com Usuários Embutidos</button>
    <div class="admin-status" id="adm-status"></div>

    <div class="admin-section">
      <h3>Usuários Cadastrados</h3>
      <div id="adm-user-list"></div>
    </div>

    <div class="admin-section">
      <div class="admin-row"><label>Nova senha admin</label><input type="password" id="adm-newpass" placeholder="deixe vazio para manter"/></div>
      <button class="admin-save" onclick="adminChangePass()" style="width:100%;margin-top:4px">Alterar Senha Admin</button>
    </div>
  </div>
</div>


<div id="loading">
  <div style="font-size:48px">🪚</div>
  <div style="font-size:22px;font-weight:800;letter-spacing:2px">MODELARE 3D</div>
  <div style="font-size:11px;color:#4a6a7a;letter-spacing:3px;text-transform:uppercase">Móveis sob medida</div>
  <div id="loading-bar"><div id="loading-fill"></div></div>
  <div id="loading-text">Carregando Three.js...</div>
</div>

<div id="root"></div>

<!-- Three.js r128 -->
<script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>

<script>
// Progress feedback
const fill = document.getElementById('loading-fill');
const ltxt = document.getElementById('loading-text');
function setProgress(p, msg) {
  fill.style.width = p + '%';
  ltxt.textContent = msg;
}
setProgress(30, 'Carregando React...');
</script>

<!-- React 18 -->
<script crossorigin src="https://unpkg.com/react@18/umd/react.production.min.js"></script>
<script crossorigin src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js"></script>

<script>setProgress(60, 'Carregando compilador JSX...');</script>

<!-- Babel Standalone for JSX -->
<script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>

<script>setProgress(85, 'Inicializando aplicativo...');</script>

<script>
// ═══════════════════════════════════════════════════════
// MODELARE 3D — Sistema de Licença e Autenticação
// Usuários embutidos (gerado pelo botão "Baixar HTML Atualizado")
const __M3D_EMBEDDED__ = (function(){
  try {
    // Extrai o JSON entre os marcadores sem usar flag /s (compatibilidade máxima)
    var marker = '/*__M3D_USERS__';
    var endMarker = '__M3D_USERS__*/';
    var scripts = document.getElementsByTagName('script');
    for(var i=0;i<scripts.length;i++){
      var src = scripts[i].textContent||scripts[i].innerText||'';
      var start = src.indexOf(marker);
      if(start !== -1){
        var end = src.indexOf(endMarker, start);
        if(end !== -1){
          var json = src.slice(start + marker.length, end).trim();
          if(json && json !== '{}') return JSON.parse(json);
        }
      }
    }
  } catch(e) {}
  return {};
})();
// Chave de criptografia simples para obfuscar localStorage
// ═══════════════════════════════════════════════════════
(function(){
  const STORE_KEY = 'm3d_lic_v1';
  const ADMIN_KEY = 'm3d_adm_v1';

  // ── Helpers ───────────────────────────────────────────
  function encode(str){ return btoa(unescape(encodeURIComponent(str))); }
  function decode(str){ try{ return decodeURIComponent(escape(atob(str))); }catch(e){return null;} }

  function loadDB(){
    // Mescla usuários embutidos no HTML com localStorage
    // localStorage tem prioridade (dados mais recentes do admin local)
    let base = {users:{}};
    if(__M3D_EMBEDDED__ && __M3D_EMBEDDED__.users){
      base = {users: Object.assign({}, __M3D_EMBEDDED__.users)};
    }
    try{
      const d=decode(localStorage.getItem(STORE_KEY));
      if(d){ const local=JSON.parse(d); Object.assign(base.users, local.users||{}); }
    }catch(e){}
    return base;
  }
  function saveDB(db){ localStorage.setItem(STORE_KEY,encode(JSON.stringify(db))); }

  function loadAdmin(){
    try{ const d=decode(localStorage.getItem(ADMIN_KEY)); return d?JSON.parse(d):{pass:encode('admin123')}; }
    catch(e){ return {pass:encode('admin123')}; }
  }
  function saveAdmin(adm){ localStorage.setItem(ADMIN_KEY,encode(JSON.stringify(adm))); }

  function daysLeft(expiresTimestamp){
    const now = Date.now();
    const diff = expiresTimestamp - now;
    return Math.ceil(diff / 86400000);
  }
  function formatDate(ts){
    const d=new Date(ts);
    return d.toLocaleDateString('pt-BR');
  }

  // ── Init — garante que admin sempre existe ────────────
  const db = loadDB();
  if(!db.users) db.users = {};
  // Se admin no localStorage não tem isAdmin (versão antiga), remove para recriar
  try {
    const _ls = decode(localStorage.getItem(STORE_KEY));
    if(_ls){ const _d=JSON.parse(_ls); if(_d.users&&_d.users['admin']&&!_d.users['admin'].isAdmin){ delete _d.users['admin']; localStorage.setItem(STORE_KEY,encode(JSON.stringify(_d))); } }
  } catch(e){}
  // Admin sempre garantido com senha padrão "admin"
  if(!db.users['admin'] || !db.users['admin'].isAdmin){
    db.users['admin'] = {
      passHash: encode('admin'),
      expires: Date.now() + 3650*86400000,
      createdAt: Date.now(),
      isAdmin: true
    };
    saveDB(db);
  }

  // ── Login ─────────────────────────────────────────────
  window.authLogin = function(){
    const user = (document.getElementById('auth-user').value||'').trim().toLowerCase();
    const pass  = document.getElementById('auth-pass').value||'';
    const errEl = document.getElementById('auth-error');
    errEl.textContent = '';

    if(!user || !pass){ errEl.textContent = 'Preencha usuário e senha.'; return; }

    const db = loadDB();
    const rec = db.users[user];

    if(!rec){ errEl.textContent = 'Usuário não encontrado.'; shake(); return; }
    if(rec.passHash !== encode(pass)){ errEl.textContent = 'Senha incorreta.'; shake(); return; }

    const left = daysLeft(rec.expires);
    if(left <= 0){ errEl.textContent = 'Licença expirada. Contate o administrador.'; return; }

    // Autenticado!
    window._m3dUser = user;
    window._m3dIsAdmin = !!rec.isAdmin;
    document.getElementById('auth-overlay').classList.add('hidden');

    // Avisos de expiração em 60, 30 e 7 dias
    if(left <= 60){
      setTimeout(()=>window._m3dShowExpiry && window._m3dShowExpiry(left), 2000);
    }
  };

  function shake(){
    const box = document.querySelector('.auth-box');
    box.style.animation='none';
    box.style.transform='translateX(-8px)';
    setTimeout(()=>{ box.style.transition='transform .3s'; box.style.transform='translateX(0)'; },80);
  }

  // ── Admin panel ───────────────────────────────────────
  window.openAdmin = function(){
    renderUserList();
    document.getElementById('admin-overlay').classList.add('show');
  };

  // Formata input de data automaticamente dd/mm/aaaa
  window.fmtDateInput = function(el){
    let v = el.value.replace(/\D/g,'');
    if(v.length>2) v = v.slice(0,2)+'/'+v.slice(2);
    if(v.length>5) v = v.slice(0,5)+'/'+v.slice(5,9);
    el.value = v;
  };

  function parseInputDate(str){
    // aceita dd/mm/aaaa
    const p = str.trim().split('/');
    if(p.length!==3) return null;
    const [d,m,y] = p.map(Number);
    if(!d||!m||!y||y<2020) return null;
    const dt = new Date(y,m-1,d,23,59,59,999);
    if(isNaN(dt.getTime())) return null;
    return dt.getTime();
  }

  window.adminAddUser = function(){
    const user    = (document.getElementById('adm-user').value||'').trim().toLowerCase();
    const pass    = document.getElementById('adm-pass').value||'';
    const dateStr = document.getElementById('adm-expires').value||'';
    const st      = document.getElementById('adm-status');

    if(!user || !pass){ st.style.color='#e05050'; st.textContent='Preencha usuário e senha.'; return; }
    const expiresTs = parseInputDate(dateStr);
    if(!expiresTs){ st.style.color='#e05050'; st.textContent='Data inválida. Use dd/mm/aaaa.'; return; }
    if(expiresTs < Date.now()){ st.style.color='#e05050'; st.textContent='A data já está no passado.'; return; }

    const db = loadDB();
    const exists = db.users[user];
    db.users[user] = {
      passHash: encode(pass),
      expires: expiresTs,
      createdAt: Date.now(),
      isAdmin: false
    };
    saveDB(db);

    const left = daysLeft(expiresTs);
    st.style.color='#3aaa6a';
    st.textContent = exists
      ? `✅ Usuário "${user}" atualizado — expira em ${formatDate(expiresTs)} (${left}d)`
      : `✅ Usuário "${user}" criado — válido até ${formatDate(expiresTs)} (${left}d)`;

    document.getElementById('adm-user').value='';
    document.getElementById('adm-pass').value='';
    document.getElementById('adm-expires').value='';
    renderUserList();
  };

  window.adminDeleteUser = function(user){
    if(user==='admin'){alert('Não é possível remover o usuário admin.');return;}
    if(!confirm('Remover usuário "'+user+'"?')) return;
    const db=loadDB();
    delete db.users[user];
    saveDB(db);
    renderUserList();
  };

  window.adminDownloadHTML = function(){
    const db = loadDB();
    const usersJSON = JSON.stringify({users: db.users});
    // Lê o source original embutido na tag <script id="m3d-src"> e substitui o placeholder
    // Fallback: usa outerHTML do documento atual (funciona em file:// e http://)
    let html = '<!DOCTYPE html>\n' + document.documentElement.outerHTML;
    // Substitui o bloco de usuários embutidos usando indexOf (sem regex com flag /s)
    var mStart = '/*__M3D_USERS__';
    var mEnd = '__M3D_USERS__*/';
    var si = html.indexOf(mStart);
    var ei = si !== -1 ? html.indexOf(mEnd, si) : -1;
    var updated;
    if(si !== -1 && ei !== -1){
      updated = html.slice(0, si) + mStart + usersJSON + mEnd + html.slice(ei + mEnd.length);
    } else {
      updated = html; // fallback sem substituição
    }
    const blob = new Blob([updated], {type:'text/html;charset=utf-8'});
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'Modelare3D.html';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(a.href);
    const st = document.getElementById('adm-status');
    st.style.color='#3aaa6a';
    st.textContent = '✅ HTML gerado com ' + Object.keys(db.users).length + ' usuário(s) embutido(s)!';
  };

  window.adminChangePass = function(){
    const np = document.getElementById('adm-newpass').value||'';
    if(!np){ document.getElementById('adm-status').textContent='Digite a nova senha.'; return; }
    // Change current admin user's password
    const db=loadDB();
    if(db.users[window._m3dUser]){
      db.users[window._m3dUser].passHash = encode(np);
      saveDB(db);
    }
    document.getElementById('adm-status').style.color='#3aaa6a';
    document.getElementById('adm-status').textContent='✅ Senha alterada!';
    document.getElementById('adm-newpass').value='';
  };

  function renderUserList(){
    const db=loadDB();
    const el=document.getElementById('adm-user-list');
    if(!el) return;
    const users=Object.entries(db.users);
    if(users.length===0){ el.innerHTML='<div style="font-size:11px;color:#2a4a5a">Nenhum usuário.</div>'; return; }
    el.innerHTML = users.map(([u,r])=>{
      const left=daysLeft(r.expires);
      const badge=left>0
        ?`<span class="badge ok">✅ ${left}d restantes (até ${formatDate(r.expires)})</span>`
        :`<span class="badge exp">❌ Expirado em ${formatDate(r.expires)}</span>`;
      const delBtn = u!=='admin'
        ?`<span class="user-del" onclick="adminDeleteUser('${u}')">🗑</span>`
        :'<span style="font-size:9px;color:#2a4a5a">admin</span>';
      return `<div class="user-row"><span>👤 ${u}</span>${badge}${delBtn}</div>`;
    }).join('');
  }

  // Show info below login form
  function showLoginInfo(){
    const el=document.getElementById('auth-info');
    if(el) el.innerHTML='Acesso licenciado por usuário<br>Contate o administrador para obter credenciais';
  }
  showLoginInfo();

  // Expose expiry warning hook — níveis 60, 30 e 7 dias
  window._m3dShowExpiry = function(days){
    if(window._m3dExpiryShown) return;
    window._m3dExpiryShown = true;
    let borderColor, titleColor, icon, urgency;
    if(days <= 7){
      borderColor='#cc3020'; titleColor='#ff6050'; icon='🚨'; urgency='URGENTE';
    } else if(days <= 30){
      borderColor='#cc7010'; titleColor='#ffaa40'; icon='⚠️'; urgency='ATENÇÃO';
    } else {
      borderColor='#6a8a30'; titleColor='#a0c860'; icon='ℹ️'; urgency='AVISO';
    }
    const banner = document.createElement('div');
    banner.style.cssText=`position:fixed;bottom:60px;right:20px;background:#0e0e18;border:1.5px solid ${borderColor};border-radius:8px;padding:12px 18px;font-size:11px;color:#c8d0d8;z-index:9000;max-width:300px;line-height:1.7;box-shadow:0 8px 24px rgba(0,0,0,.8)`;
    banner.innerHTML=`${icon} <b style="color:${titleColor}">${urgency}: Licença expira em ${days} dia${days>1?'s':''}!</b><br>Entre em contato com o administrador para renovar o acesso antes do vencimento.<div style="text-align:right;margin-top:6px"><span onclick="this.parentNode.parentNode.remove()" style="cursor:pointer;color:#5a6a7a;font-size:10px">✕ fechar</span></div>`;
    document.body.appendChild(banner);
  };

})();
</script>

<script type="text/babel" data-presets="react">
// ─── Injeta React no escopo global para o JSX funcionar sem imports ───────────
const { useState, useEffect, useRef, useCallback, createContext, useContext } = React;

// ─── THREE já está global via CDN ─────────────────────────────────────────────

const SfCtx = createContext(1);

// ═══════════════════════════════════════════════════════════════════
// SISTEMA DE TEXTURAS
// ═══════════════════════════════════════════════════════════════════
const _canvasCache = {};
const _texCache    = {};

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

function makeTex(key, w, h) {
  if (!_texCache[key]) {
    const t = new THREE.CanvasTexture(woodCanvas(key));
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    _texCache[key] = t;
  }
  const t = _texCache[key].clone();
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(w/0.5, h/0.5);
  t.needsUpdate = true;
  return t;
}

// ═══════════════════════════════════════════════════════════════════
// CATÁLOGO DE MATERIAIS
// ═══════════════════════════════════════════════════════════════════
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

// ═══════════════════════════════════════════════════════════════════
// TIPOS DE PEÇA
// ═══════════════════════════════════════════════════════════════════
const PTYPES = [
  {id:"lateral",    label:"Lateral",    icon:"▯",  w:0.018, h:0.80,  d:0.40},
  {id:"tampo",      label:"Tampo/Base", icon:"⬜", w:0.80,  h:0.018, d:0.40},
  {id:"fundo",      label:"Fundo",      icon:"◫",  w:0.76,  h:0.76,  d:0.009},
  {id:"porta",      label:"Porta",      icon:"🚪", w:0.36,  h:0.70,  d:0.018},
  {id:"gaveta",     label:"Gaveta",     icon:"▤",  w:0.36,  h:0.14,  d:0.38},
  {id:"prateleira", label:"Prateleira", icon:"═",  w:0.76,  h:0.018, d:0.38},
  {id:"vidro",      label:"Vidro",      icon:"🔲", w:0.36,  h:0.60,  d:0.006},
];

// ═══════════════════════════════════════════════════════════════════
// CONSTRUTORES 3D
// ═══════════════════════════════════════════════════════════════════
function attachHandle(parent, pW, pH, slabD, typeId, doorSide, handleX, handleY, handleAngle) {
  const old = parent.children?.find(c => c.userData.isHandle);
  if (old) { old.traverse(c=>{ if(c.isMesh){c.geometry.dispose();c.material.dispose();} }); parent.remove(old); }
  const g = new THREE.Group();
  g.userData.isHandle = true;

  if (typeId === "porta") {
    // Marca "F" na face frontal da porta (indica frente)
    const fMat = new THREE.MeshStandardMaterial({color:0xffcc44, roughness:0.4, metalness:0.1, side:THREE.DoubleSide});
    const t = 0.003;
    const s = Math.min(pW * 0.18, 0.048);
    const zF = slabD/2 + 0.002;
    // Haste vertical
    const vBar = new THREE.Mesh(new THREE.BoxGeometry(t, s*1.6, t), fMat);
    vBar.position.set(-s*0.25, 0, zF);
    g.add(vBar);
    // Barra superior
    const hTop = new THREE.Mesh(new THREE.BoxGeometry(s*0.75, t, t), fMat);
    hTop.position.set(-s*0.25 + s*0.375 - s*0.01, s*0.7, zF);
    g.add(hTop);
    // Barra do meio
    const hMid = new THREE.Mesh(new THREE.BoxGeometry(s*0.55, t, t), fMat);
    hMid.position.set(-s*0.25 + s*0.275 - s*0.01, s*0.1, zF);
    g.add(hMid);
    parent.add(g);
    return g;
  }

  // Gaveta: puxador metálico original
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
  [bar,legL,legR,rosL,rosR].forEach(m=>{ g.add(m); });
  const oX  = (handleX !== undefined && handleX !== null) ? handleX : 0;
  const oY  = (handleY !== undefined && handleY !== null) ? handleY : 0;
  const ang = handleAngle ? THREE.MathUtils.degToRad(handleAngle) : 0;
  g.position.set(oX, oY, slabD/2 + legH + 0.004);
  g.rotation.z = ang;
  parent.add(g);
  return g;
}

function makeTrack(pW, pH) {
  const g = new THREE.Group();
  g.userData.isTrack = true;
  const metalMat = new THREE.MeshStandardMaterial({color:0xb0b8c8, roughness:0.2, metalness:0.85});
  const trackW = pW + 0.012;
  const trackT = 0.006;
  const trackD = 0.014;
  const top = new THREE.Mesh(new THREE.BoxGeometry(trackW, trackT, trackD), metalMat);
  top.position.set(0, pH/2 + trackT/2, 0);
  const bot = new THREE.Mesh(new THREE.BoxGeometry(trackW, trackT, trackD), metalMat);
  bot.position.set(0, -pH/2 - trackT/2, 0);
  [top, bot].forEach(m => g.add(m));
  return g;
}

let GID = Date.now();
const animSet = new Set();

function makePiece(typeId, matId, x=0, y=0, z=0) {
  const tp = PTYPES.find(t=>t.id===typeId) || PTYPES[0];
  const mid = (typeId==="vidro" && !(matId||"").startsWith("vidro")) ? "vidro_c" : (matId||"ps_freijo");
  const {w,h,d} = tp;
  const id = GID++;
  const needsHandle = typeId==="gaveta" || typeId==="porta";
  if (needsHandle) {
    const grp = new THREE.Group();
    if (typeId === "gaveta") {
      const bodyD = d - 0.002;
      const frontT = 0.018;
      const body = new THREE.Mesh(new THREE.BoxGeometry(w, h, bodyD), buildMat(mid, w, h));
      body.position.z = -(frontT / 2);
      body.userData.isBody = true;
      grp.add(body);
      const front = new THREE.Mesh(new THREE.BoxGeometry(w, h, frontT), buildMat(mid, w, h));
      front.position.z = (bodyD / 2) - (frontT / 2) + frontT;
      front.userData.isFront = true;
      grp.add(front);
    } else {
      // PORTA: grp centrado no centro visual da porta.
      // pivot é o ponto de rotação (borda da dobradiça).
      // body e track ficam em x=0 dentro do pivot.
      // pivot.position.x = -w/2 (dobradiça esquerda) ou +w/2 (dobradiça direita)
      // Quando o pivot rota, o body orbita em torno da borda correta.
      // Para manter o body centrado visualmente:
      //   pivot.position.x = -w/2 → body.position.x deve ser 0 dentro do pivot
      //   mas o pivot está em -w/2 no espaço do grp, então body world = -w/2 + 0 = -w/2 ← ERRADO
      // Solução correta: pivot em 0, body em 0, e a "âncora" de rotação é feita
      // transladando o pivot para a borda ANTES de rodar, depois voltando.
      // Implementação: usar um wrapper de translação + pivot de rotação aninhados.
      //
      // ESTRUTURA:
      //   grp (centro visual)
      //     anchorL (position.x = -w/2, não roda)  ← borda esquerda no espaço do grp
      //       pivotL (roda em torno de anchorL)
      //         body (position.x = +w/2 dentro do pivotL → body world = -w/2 + w/2 = 0 = centro)
      //
      // Mas para troca de lado, só precisamos de UM pivot ativo por vez.
      // Mais simples: body em position.x = 0 dentro do pivot, pivot.position.x = 0.
      // A rotação de dobradiça é feita movendo o pivot para a borda antes de rodar.
      // Isso é feito em applyDoorTransform.

      // pivot fica na BORDA de dobradiça (fixo, só roda).
      // body deslocado dentro do pivot = body visualmente centrado no grp.
      // side=left: pivot.x=-w/2, body.x=+w/2  → body_world = 0 (centro)
      // side=right: pivot.x=+w/2, body.x=-w/2 → body_world = 0 (centro)
      const pivot = new THREE.Group();
      pivot.userData.isPivot = true;
      const body = new THREE.Mesh(new THREE.BoxGeometry(w,h,d), buildMat(mid,w,h));
      body.position.set(w/2, 0, 0);  // default side=left: body a +w/2 do pivot
      body.userData.isBody = true;
      pivot.add(body);
      const track = makeTrack(w, h, d);
      track.position.set(w/2, 0, 0);
      track.visible = false;
      pivot.add(track);
      pivot.position.set(-w/2, 0, 0);  // default side=left: pivot na borda esquerda
      grp.add(pivot);
    }
    {
      const _slabD0 = typeId === "gaveta" ? 0.018 : d;
      if (typeId === "gaveta") {
        const _hFront = grp.children.find(c => c.userData.isFront);
        if (_hFront) attachHandle(_hFront, w, h, _slabD0, typeId, "left", 0, 0, 0);
      } else {
        // porta: handle no body que está dentro do pivot
        const _pivot = grp.children.find(c => c.userData.isPivot);
        const _hBody = _pivot?.children.find(c => c.userData.isBody);
        if (_hBody) attachHandle(_hBody, w, h, _slabD0, typeId, "left", 0, 0, 0);
      }
    }
    // grp posicionado no CENTRO VISUAL da porta (não na borda)
    grp.position.set(x, y+h/2, z);
    grp.userData = {
      id, typeId, matId:mid, frontMatId: mid,
      w, h, d, rx:0, ry:0, rz:0,
      label:`${tp.label} ${id}`,
      isOpen:false, openProgress:0,
      baseX: x, baseZ:z, baseRY:0,
      hasHandle: true, handleY: 0, handleX: 0, handleAngle: 0,
      slabD: typeId === "gaveta" ? 0.018 : d,
      doorSide: "left", doorType: "hinged",
    };
    return grp;
  }
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(w,h,d), buildMat(mid,w,h));
  mesh.position.set(x, y+h/2, z);
  mesh.userData = {id, typeId, matId:mid, w, h, d, rx:0, ry:0, rz:0, label:`${tp.label} ${id}`};
  return mesh;
}

function rebuildPiece(obj) {
  const {w,h,d,matId,frontMatId,typeId,rx,ry,rz} = obj.userData;
  if (obj.isGroup) {
    // Para porta: body está dentro do pivot
    const pivot = obj.children.find(c=>c.userData.isPivot);
    const body = pivot ? pivot.children.find(c=>c.userData.isBody) : obj.children.find(c=>c.userData.isBody);
    if (body) {
      body.geometry.dispose();
      if (body.material.map) body.material.map.dispose();
      body.material.dispose();
      body.geometry = typeId==="gaveta" ? new THREE.BoxGeometry(w,h,d-0.002) : new THREE.BoxGeometry(w,h,d);
      body.material = buildMat(matId, w, h);
    }
    const front = obj.children.find(c=>c.userData.isFront);
    if (front) {
      const frontT=0.018, bodyD=d-0.002;
      front.geometry.dispose();
      if (front.material.map) front.material.map.dispose();
      front.material.dispose();
      front.geometry = new THREE.BoxGeometry(w, h, frontT);
      front.position.z = (bodyD/2)-(frontT/2)+frontT;
      front.material = buildMat(frontMatId||matId, w, h);
    }
    if (typeId==="porta" && pivot) {
      const side=obj.userData.doorSide||"left";
      pivot.rotation.y=0;
      pivot.position.x = side==="left" ? -w/2 : w/2;
      const bodyOffX = side==="left" ? w/2 : -w/2;
      // reposiciona body e track dentro do pivot
      pivot.children.forEach(c=>{
        if(c.userData.isBody||c.userData.isTrack) c.position.x=bodyOffX;
      });
      // reconstrói track dentro do pivot
      const oldT=pivot.children.find(c=>c.userData.isTrack);
      if(oldT){oldT.traverse(c=>{if(c.isMesh){c.geometry.dispose();c.material.dispose();}});pivot.remove(oldT);}
      const newT=makeTrack(w,h,d);
      newT.position.x=bodyOffX;
      newT.visible=obj.userData.doorType==="sliding";
      pivot.add(newT);
    }
    {
      const _rb_slabD=obj.userData.slabD||d;
      const _rb_side=obj.userData.doorSide||"left";
      const _rb_hX=obj.userData.handleX||0;
      const _rb_hY=obj.userData.handleY||0;
      const _rb_hA=obj.userData.handleAngle||0;
      if (typeId==="gaveta") {
        const _rb_front=obj.children.find(c=>c.userData.isFront);
        if (_rb_front) { const h_=attachHandle(_rb_front,w,h,_rb_slabD,typeId,_rb_side,_rb_hX,_rb_hY,_rb_hA); if(h_)h_.visible=obj.userData.hasHandle!==false; }
      } else if (pivot) {
        const _rb_body=pivot.children.find(c=>c.userData.isBody);
        if(_rb_body){
          const _rb_oldH=_rb_body.children?.find(c=>c.userData.isHandle);
          if(_rb_oldH){_rb_oldH.traverse(c=>{if(c.isMesh){c.geometry.dispose();c.material.dispose();}});_rb_body.remove(_rb_oldH);}
          const h_=attachHandle(_rb_body,w,h,_rb_slabD,typeId,_rb_side,_rb_hX,_rb_hY,_rb_hA);
          if(h_)h_.visible=obj.userData.hasHandle!==false;
        }
      }
    }
  } else {
    obj.geometry.dispose();
    obj.geometry = new THREE.BoxGeometry(w,h,d);
    if(obj.material.map)obj.material.map.dispose();
    obj.material.dispose();
    obj.material = buildMat(matId,w,h);
  }
  obj.rotation.set(
    THREE.MathUtils.degToRad(rx||0),
    THREE.MathUtils.degToRad(ry||0),
    THREE.MathUtils.degToRad(rz||0)
  );
}

// ═══════════════════════════════════════════════════════════════════
// ANIMAÇÃO
// ═══════════════════════════════════════════════════════════════════
function toggleOpenClose(obj) {
  if (!obj?.userData) return;
  const {typeId} = obj.userData;
  if (typeId!=="gaveta"&&typeId!=="porta") return;
  const ud = obj.userData;
  if (ud.openProgress===0&&!ud.isOpen) {
    ud.baseX=obj.position.x; ud.baseZ=obj.position.z; ud.baseRY=obj.rotation.y;
  }
  ud.isOpen=!ud.isOpen;
  animSet.add(obj);
}

function applyDoorTransform(obj, progress) {
  const ud = obj.userData;
  const pivot = obj.children.find(c => c.userData.isPivot);
  if (!pivot) return;
  // pivot fica fixo na borda — só muda rotation.y
  // side=left: abre para fora (z positivo), rotação positiva
  // side=right: abre para fora (z positivo), rotação negativa
  const sign = ud.doorSide === "left" ? -1 : 1;
  pivot.rotation.y = sign * progress * THREE.MathUtils.degToRad(95);
}

function tickAnimations(dt) {
  for (const obj of animSet) {
    const ud=obj.userData;
    if(!ud){animSet.delete(obj);continue;}
    const target=ud.isOpen?1:0;
    ud.openProgress+=(target-ud.openProgress)*Math.min(dt*5,0.18);
    if(ud.typeId==="gaveta") obj.position.z=ud.baseZ+ud.openProgress*ud.d*0.85;
    else if(ud.typeId==="porta") {
      if(ud.doorType==="sliding") {
        const dir=ud.doorSide==="right"?1:-1;
        obj.position.x=ud.baseX+ud.openProgress*ud.w*dir;
        obj.position.z=ud.baseZ;
      } else applyDoorTransform(obj,ud.openProgress);
    }
    if(Math.abs(ud.openProgress-target)<0.003) {
      ud.openProgress=target;
      if(ud.typeId==="gaveta") obj.position.z=ud.baseZ+target*ud.d*0.85;
      else if(ud.typeId==="porta") {
        if(ud.doorType==="sliding"){
          const dir=ud.doorSide==="right"?1:-1;
          obj.position.x=ud.baseX+target*ud.w*dir;
          obj.position.z=ud.baseZ;
        } else applyDoorTransform(obj,target);
      }
      animSet.delete(obj);
    }
  }
}

// ═══════════════════════════════════════════════════════════════════
// OUTLINE
// ═══════════════════════════════════════════════════════════════════
const OUTLINE_TAG="__outline__";
function getOutlineBox(obj) {
  if(obj.isGroup&&obj.userData.w) {
    const{w,h,d}=obj.userData;
    if(obj.userData.typeId==="porta") {
      const pivot=obj.children.find(c=>c.userData.isPivot);
      const body=pivot?.children.find(c=>c.userData.isBody)||obj.children.find(c=>c.userData.isBody);
      if(body){
        const worldCenter=new THREE.Vector3();
        body.getWorldPosition(worldCenter);
        return{size:new THREE.Vector3(w+0.008,h+0.008,d+0.008),center:worldCenter};
      }
    }
    if(obj.userData.typeId==="gaveta") {
      const box=new THREE.Box3().setFromObject(obj);
      const size=new THREE.Vector3();box.getSize(size);size.addScalar(0.008);
      const center=new THREE.Vector3();box.getCenter(center);
      return{size,center};
    }
    return{size:new THREE.Vector3(w+0.008,h+0.008,d+0.008),center:obj.position.clone()};
  }
  const box=new THREE.Box3().setFromObject(obj);
  const size=new THREE.Vector3();box.getSize(size);size.addScalar(0.008);
  const center=new THREE.Vector3();box.getCenter(center);
  return{size,center};
}
function addOutline(obj,scene,outlineRef) {
  clearOutline(scene,outlineRef);
  const{size,center}=getOutlineBox(obj);
  const geo=new THREE.BoxGeometry(size.x,size.y,size.z);
  const edges=new THREE.EdgesGeometry(geo);
  geo.dispose();
  const ol=new THREE.LineSegments(edges,new THREE.LineBasicMaterial({color:0x44aaff,depthTest:false}));
  ol.position.copy(center);
  if(obj.userData&&obj.userData.typeId==="porta")ol.rotation.copy(obj.rotation);
  else ol.rotation.set(0,0,0);
  ol.userData[OUTLINE_TAG]=true;
  ol.renderOrder=999;
  scene.add(ol);
  if(outlineRef)outlineRef.current=ol;
}
function clearOutline(scene,outlineRef) {
  const ol=outlineRef?.current||scene.children.find(c=>c.userData[OUTLINE_TAG]);
  if(ol){ol.geometry.dispose();ol.material.dispose();scene.remove(ol);}
  if(outlineRef)outlineRef.current=null;
}
function syncOutline(obj,scene,outlineRef) {
  const ol=outlineRef?.current||scene.children.find(c=>c.userData[OUTLINE_TAG]);
  if(!ol)return;
  const{center}=getOutlineBox(obj);
  ol.position.copy(center);
  if(obj.userData&&obj.userData.typeId==="porta")ol.rotation.copy(obj.rotation);
  else ol.rotation.set(0,0,0);
}

// ═══════════════════════════════════════════════════════════════════
// SNAP
// ═══════════════════════════════════════════════════════════════════
const GRID=0.001;
function snapGrid(v,g=GRID){return Math.round(v/g)*g;}
function fastBox(obj){
  const{w=0.1,h=0.1,d=0.1}=obj.userData;
  const p=obj.position;
  return new THREE.Box3(
    new THREE.Vector3(p.x-w/2,p.y-h/2,p.z-d/2),
    new THREE.Vector3(p.x+w/2,p.y+h/2,p.z+d/2)
  );
}
const SNAP_MAG=0.06;
function edgeSnap(moving,others){
  const{w:mw=0.1,h:mh=0.1,d:md=0.1}=moving.userData;
  const px=moving.position.x,pz=moving.position.z;
  let bestX=null,bestZ=null,bdX=SNAP_MAG,bdZ=SNAP_MAG;
  for(const o of others){
    if(o===moving||o.userData.isFloor||!o.userData.id)continue;
    const{w:ow=0.1,d:od=0.1}=o.userData;
    const ox=o.position.x,oz=o.position.z;
    for(const delta of[(px+mw/2)-(ox-ow/2),(px-mw/2)-(ox+ow/2),px-ox])
      if(Math.abs(delta)<bdX){bdX=Math.abs(delta);bestX=delta;}
    for(const delta of[(pz+md/2)-(oz-od/2),(pz-md/2)-(oz+od/2),pz-oz])
      if(Math.abs(delta)<bdZ){bdZ=Math.abs(delta);bestZ=delta;}
  }
  if(bestX!==null)moving.position.x=snapGrid(moving.position.x-bestX);
  if(bestZ!==null)moving.position.z=snapGrid(moving.position.z-bestZ);
}

function resolveHit(hitObj,pieces){
  let o=hitObj;
  while(o){if(pieces.includes(o))return o;o=o.parent;}
  return null;
}

// ═══════════════════════════════════════════════════════════════════
// COMPONENTE PRINCIPAL
// ═══════════════════════════════════════════════════════════════════
function App() {
  const mountRef=useRef(null),sceneRef=useRef(null),cameraRef=useRef(null);
  const rendRef=useRef(null),piecesRef=useRef([]),selRef=useRef(null);
  const undoStack=useRef([]);
  const [undoCount,setUndoCount]=useState(0);
  const outlineRef=useRef(null);
  const _dragPt=useRef(new THREE.Vector3());
  const sph=useRef({theta:0.8,phi:0.65,radius:3.5,cx:0,cy:0.4,cz:0});
  const orbit=useRef({on:false,lx:0,ly:0});
  const panS=useRef({on:false,lx:0,ly:0});
  const dragS=useRef({on:false,ox:0,oz:0});
  const dplane=useRef(new THREE.Plane(new THREE.Vector3(0,1,0),0));
  const rc=useRef(new THREE.Raycaster());

  const [pieces,setPieces]=useState([]);
  const [selId,setSelId]=useState(null);
  const [selData,setSelData]=useState(null);
  const [actMat,setActMat]=useState("ps_freijo");
  const [actType,setActType]=useState("lateral");
  const [tab,setTab]=useState("add");
  const [status,setStatus]=useState("Bem-vindo! Adicione peças para montar seu móvel.");
  const [matSearch,setMatSearch]=useState("");
  const [matTarget,setMatTarget]=useState("corpo");
  const [editingId,setEditingId]=useState(null);
  const [editingName,setEditingName]=useState("");
  const renameRef=useRef(null);
  const [prices,setPrices]=useState({chapaW:2750,chapaH:1850,priceM2:145,fitaM:0.85,corteChapa:18,moObraM2:0});
  const [colisionOn,setColisionOn]=useState(false);
  const [sidebarW,setSidebarW]=useState(280);
  const sf=sidebarW/280;
  const [ferList,setFerList]=useState([]);
  const [selFerId,setSelFerId]=useState(null);
  const ferDragS=useRef({on:false,ox:0,oz:0});

  useEffect(()=>{
    const mount=mountRef.current;
    const W=mount.clientWidth,H=mount.clientHeight;
    const scene=new THREE.Scene();
    scene.background=new THREE.Color(0x0d0d16);
    scene.fog=new THREE.FogExp2(0x0d0d16,0.055);
    sceneRef.current=scene;
    const camera=new THREE.PerspectiveCamera(42,W/H,0.005,60);
    camera.position.set(2.2,1.8,2.8);
    camera.lookAt(0,0.4,0);
    cameraRef.current=camera;
    const renderer=new THREE.WebGLRenderer({antialias:true, preserveDrawingBuffer:true});
    renderer.setSize(W,H);
    renderer.setPixelRatio(Math.min(devicePixelRatio,2));
    renderer.toneMapping=THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure=1.1;
    mount.appendChild(renderer.domElement);
    rendRef.current=renderer;
    scene.add(new THREE.AmbientLight(0xfff8f0,0.55));
    const sun=new THREE.DirectionalLight(0xfff5e0,1.3);
    sun.position.set(4,7,4);
    scene.add(sun);
    const fill2=new THREE.DirectionalLight(0xc0d8ff,0.5);
    fill2.position.set(-3,3,-3);
    scene.add(fill2);
    const floor=new THREE.Mesh(new THREE.PlaneGeometry(8,8),new THREE.MeshStandardMaterial({color:0x141420,roughness:0.95}));
    floor.rotation.x=-Math.PI/2;
    floor.userData.isFloor=true;
    scene.add(floor);
    scene.add(new THREE.GridHelper(8,400,0x2a2a50,0x1a1a38));
    let fid,last=performance.now(),needsRender=true;
    rendRef._needsRender=()=>{needsRender=true;};
    const loop=()=>{
      fid=requestAnimationFrame(loop);
      const now=performance.now();
      const dt=Math.min((now-last)/1000,0.05);
      last=now;
      const hadAnim=animSet.size>0;
      tickAnimations(dt);
      const selNow=selRef.current;
      if(hadAnim&&selNow){
        const ol=outlineRef.current;
        if(ol){
          const{center}=getOutlineBox(selNow);
          ol.position.copy(center);
          if(selNow.userData&&selNow.userData.typeId==="porta")ol.rotation.copy(selNow.rotation);
          else ol.rotation.set(0,0,0);
        }
      }
      if(needsRender||hadAnim||animSet.size>0){renderer.render(scene,camera);needsRender=false;}
    };
    loop();
    const _wh=(e)=>{
      e.preventDefault();
      sph.current.radius=Math.max(0.5,Math.min(14,sph.current.radius+e.deltaY*0.004));
      const{theta,phi,radius,cx,cy,cz}=sph.current;
      camera.position.set(cx+radius*Math.sin(phi)*Math.sin(theta),cy+radius*Math.cos(phi),cz+radius*Math.sin(phi)*Math.cos(theta));
      camera.lookAt(cx,cy,cz);
      rendRef._needsRender();
    };
    renderer.domElement.addEventListener("wheel",_wh,{passive:false});
    const onResize=()=>{
      const w=mount.clientWidth,h=mount.clientHeight;
      camera.aspect=w/h;camera.updateProjectionMatrix();renderer.setSize(w,h);
    };
    window.addEventListener("resize",onResize);

    // Remove loading screen
    const ldg=document.getElementById('loading');
    if(ldg){ldg.style.opacity='0';ldg.style.transition='opacity 0.5s';setTimeout(()=>ldg.remove(),600);}

    return()=>{
      cancelAnimationFrame(fid);
      renderer.domElement.removeEventListener("wheel",_wh);
      window.removeEventListener("resize",onResize);
      animSet.clear();
      if(mount.contains(renderer.domElement))mount.removeChild(renderer.domElement);
      renderer.dispose();
    };
  },[]);

  const updateCam=useCallback(()=>{
    const{theta,phi,radius,cx,cy,cz}=sph.current;
    const cam=cameraRef.current;
    cam.position.set(cx+radius*Math.sin(phi)*Math.sin(theta),cy+radius*Math.cos(phi),cz+radius*Math.sin(phi)*Math.cos(theta));
    cam.lookAt(cx,cy,cz);
  },[]);

  const selectObj=useCallback((obj)=>{
    selRef.current=obj;
    if(!obj){clearOutline(sceneRef.current,outlineRef);setSelId(null);setSelData(null);setStatus("Clique em uma peça para selecionar");return;}
    addOutline(obj,sceneRef.current,outlineRef);
    const ud=obj.userData;
    const ol=outlineRef.current;
    if(ol)ol.material.color.set(ud.locked?0xff8800:0x44aaff);
    setSelId(ud.id);
    setSelData({...ud,py:Math.round((obj.position.y-(ud.h||0)/2)*100),
      hasHandle:ud.hasHandle!==false,
      handleY:ud.handleY!==undefined?ud.handleY:0,
      handleX:ud.handleX!==undefined?ud.handleX:0,
      handleAngle:ud.handleAngle||0,
      frontMatId:ud.frontMatId||ud.matId,
      doorSide:ud.doorSide||"left",
      doorType:ud.doorType||"hinged",
      locked:ud.locked||false});
    setActMat(ud.matId);
    if(ud.typeId!=="gaveta")setMatTarget("corpo");
    setTab(t=>(t==="add"||t==="edit"||t==="mat")?"edit":t);
    setStatus(ud.locked?`🔒 ${ud.label} (bloqueada)`:`✓ ${ud.label}`);
    rendRef._needsRender&&rendRef._needsRender();
  },[]);

  const getNDC=useCallback((e)=>{
    const r=mountRef.current.getBoundingClientRect();
    return new THREE.Vector2(((e.clientX-r.left)/r.width)*2-1,-((e.clientY-r.top)/r.height)*2+1);
  },[]);

  const onMD=useCallback((e)=>{
    if(e.button===2){orbit.current={on:true,lx:e.clientX,ly:e.clientY};return;}
    if(e.button===1||(e.button===0&&e.altKey)){panS.current={on:true,lx:e.clientX,ly:e.clientY};e.preventDefault();return;}
    if(e.button===0){
      rc.current.setFromCamera(getNDC(e),cameraRef.current);
      // Check ferragens first
      const ferObjs=sceneRef.current.children.filter(c=>c.userData.isFerragem);
      const ferHits=rc.current.intersectObjects(ferObjs,true);
      if(ferHits.length){
        const ferRoot=ferHits[0].object;
        let fo=ferRoot;while(fo&&!fo.userData.isFerragem)fo=fo.parent;
        if(fo){
          setSelFerId(fo.uuid);
          dplane.current.setFromNormalAndCoplanarPoint(new THREE.Vector3(0,1,0),new THREE.Vector3(0,fo.position.y,0));
          const pt=new THREE.Vector3();
          if(rc.current.ray.intersectPlane(dplane.current,pt)){
            ferDragS.current={on:true,obj:fo,ox:fo.position.x-pt.x,oz:fo.position.z-pt.z};
          }
          setTab(t=>t==="fer"?t:"fer");
          return;
        }
      }
      ferDragS.current={on:false};
      const hits=rc.current.intersectObjects(piecesRef.current,true);
      if(hits.length){
        const target=resolveHit(hits[0].object,piecesRef.current);
        if(target){
          selectObj(target);
          if(target.userData.locked)return;
          dplane.current.setFromNormalAndCoplanarPoint(new THREE.Vector3(0,1,0),new THREE.Vector3(0,target.position.y,0));
          const pt=new THREE.Vector3();
          if(rc.current.ray.intersectPlane(dplane.current,pt)){
            dragS.current.on=true;
            dragS.current.ox=target.position.x-pt.x;
            dragS.current.oz=target.position.z-pt.z;
            dragS.current.snapX=target.position.x;
            dragS.current.snapY=target.position.y;
            dragS.current.snapZ=target.position.z;
          }
        }
      } else selectObj(null);
    }
  },[getNDC,selectObj,setSelFerId]);

  const onMM=useCallback((e)=>{
    if(orbit.current.on){
      const dx=e.clientX-orbit.current.lx,dy=e.clientY-orbit.current.ly;
      sph.current.theta-=dx*0.007;
      sph.current.phi=Math.max(0.06,Math.min(1.54,sph.current.phi+dy*0.007));
      orbit.current.lx=e.clientX;orbit.current.ly=e.clientY;
      updateCam();rendRef._needsRender&&rendRef._needsRender();return;
    }
    if(panS.current.on){
      const dx=e.clientX-panS.current.lx,dy=e.clientY-panS.current.ly;
      const cam=cameraRef.current;
      const right=new THREE.Vector3().crossVectors(cam.getWorldDirection(new THREE.Vector3()),cam.up).normalize();
      sph.current.cx-=right.x*dx*0.003;
      sph.current.cz-=right.z*dx*0.003;
      sph.current.cy+=dy*0.003;
      panS.current.lx=e.clientX;panS.current.ly=e.clientY;
      updateCam();rendRef._needsRender&&rendRef._needsRender();return;
    }
    if(ferDragS.current.on&&ferDragS.current.obj){
      rc.current.setFromCamera(getNDC(e),cameraRef.current);
      const pt=_dragPt.current;
      if(rc.current.ray.intersectPlane(dplane.current,pt)){
        const fo=ferDragS.current.obj;
        fo.position.x=pt.x+(ferDragS.current.ox||0);
        fo.position.z=pt.z+(ferDragS.current.oz||0);
        setFerList(l=>[...l]);
        rendRef._needsRender&&rendRef._needsRender();
      }
      return;
    }
    if(dragS.current.on&&selRef.current){
      rc.current.setFromCamera(getNDC(e),cameraRef.current);
      const pt=_dragPt.current;
      if(rc.current.ray.intersectPlane(dplane.current,pt)){
        const obj=selRef.current;
        const prevX=obj.position.x,prevZ=obj.position.z;
        obj.position.x=pt.x+(dragS.current.ox||0);
        obj.position.z=pt.z+(dragS.current.oz||0);
        edgeSnap(obj,piecesRef.current);
        if(colisionOn){
          const box=fastBox(obj);
          const collides=piecesRef.current.some(o=>{if(o===obj)return false;return box.intersectsBox(fastBox(o));});
          if(collides){obj.position.x=prevX;obj.position.z=prevZ;}
        }
        syncOutline(obj,sceneRef.current,outlineRef);
        rendRef._needsRender&&rendRef._needsRender();
      }
    }
  },[getNDC,updateCam,colisionOn]);

  const onMU=useCallback(()=>{
    if(ferDragS.current.on){ferDragS.current={on:false};setFerList(l=>[...l]);}
    if(dragS.current.on&&selRef.current){
      const obj=selRef.current;
      obj.position.x=snapGrid(obj.position.x);
      obj.position.z=snapGrid(obj.position.z);
      const sx=dragS.current.snapX,sz=dragS.current.snapZ;
      if(sx!==undefined&&(Math.abs(obj.position.x-sx)>0.0005||Math.abs(obj.position.z-sz)>0.0005)){
        undoStack.current.push({type:"move",obj,fromX:sx,fromY:obj.position.y,fromZ:sz});
        if(undoStack.current.length>50)undoStack.current.shift();
        setUndoCount(undoStack.current.length);
      }
      if(obj.userData){
        const isAnimating=obj.userData.isOpen||(obj.userData.openProgress>0);
        if(!isAnimating){obj.userData.baseX=obj.position.x;obj.userData.baseZ=obj.position.z;obj.userData.baseRY=obj.rotation.y;}
      }
      syncOutline(obj,sceneRef.current,outlineRef);
    }
    dragS.current={on:false,ox:0,oz:0};
    orbit.current={on:false};
    panS.current={on:false};
    if(selRef.current){
      const obj=selRef.current;
      setSelData(d=>d?{...d,py:Math.round((obj.position.y-(obj.userData.h||0)/2)*100)}:d);
    }
  },[]);

  const addPiece=useCallback(()=>{
    const x=snapGrid((Math.random()-0.5)*0.8);
    const z=snapGrid((Math.random()-0.5)*0.8);
    const mid=(actType==="vidro"&&!(actMat||"").startsWith("vidro"))?"vidro_c":(actMat||"ps_freijo");
    const obj=makePiece(actType,mid,x,0,z);
    obj.userData.baseX=obj.position.x;obj.userData.baseZ=obj.position.z;obj.userData.baseRY=0;
    sceneRef.current.add(obj);
    piecesRef.current.push(obj);
    setPieces(prev=>[...prev,{id:obj.userData.id,label:obj.userData.label,typeId:obj.userData.typeId}]);
    undoStack.current.push({type:"add",obj});
    if(undoStack.current.length>50)undoStack.current.shift();
    setUndoCount(undoStack.current.length);
    selectObj(obj);
    rendRef._needsRender&&rendRef._needsRender();
    setStatus(`➕ ${obj.userData.label} adicionado`);
  },[actMat,actType,selectObj]);

  const delSel=useCallback(()=>{
    const obj=selRef.current;if(!obj)return;
    undoStack.current.push({type:"delete",obj,pos:obj.position.clone(),rot:obj.rotation.clone()});
    if(undoStack.current.length>50)undoStack.current.shift();
    setUndoCount(undoStack.current.length);
    clearOutline(sceneRef.current,outlineRef);
    animSet.delete(obj);
    sceneRef.current.remove(obj);
    obj.traverse(c=>{if(c.isMesh){c.geometry.dispose();if(c.material.map)c.material.map.dispose();c.material.dispose();}});
    piecesRef.current=piecesRef.current.filter(p=>p!==obj);
    setPieces(prev=>prev.filter(p=>p.id!==obj.userData.id));
    selectObj(null);
    rendRef._needsRender&&rendRef._needsRender();
    setStatus("🗑 Peça removida");
  },[selectObj]);

  const dupSel=useCallback(()=>{
    const src=selRef.current;if(!src)return;
    const ud=src.userData;
    const ox=snapGrid(src.position.x+GRID*2);
    const baseY=src.position.y-(ud.h||0)/2;
    const oz=snapGrid(src.position.z+GRID*2);
    const copy=makePiece(ud.typeId,ud.matId,ud.typeId==="porta"?ox-ud.w/2:ox,0,oz);
    copy.userData.w=ud.w;copy.userData.h=ud.h;copy.userData.d=ud.d;
    copy.userData.rx=ud.rx||0;copy.userData.ry=ud.ry||0;copy.userData.rz=ud.rz||0;
    copy.userData.hasHandle=ud.hasHandle!==false;
    copy.userData.handleX=ud.handleX||0;copy.userData.handleY=ud.handleY||0;copy.userData.handleAngle=ud.handleAngle||0;
    copy.userData.frontMatId=ud.frontMatId||ud.matId;
    copy.userData.label=ud.label+" (cópia)";
    if(ud.typeId==="porta"){copy.userData.doorSide=ud.doorSide||"left";copy.userData.doorType=ud.doorType||"hinged";}
    copy.position.y=baseY+(ud.h||0)/2;
    copy.userData.baseX=copy.position.x;copy.userData.baseZ=oz;copy.userData.baseRY=0;
    rebuildPiece(copy);
    sceneRef.current.add(copy);
    piecesRef.current.push(copy);
    setPieces(prev=>[...prev,{id:copy.userData.id,label:copy.userData.label,typeId:copy.userData.typeId}]);
    undoStack.current.push({type:"duplicate",obj:copy});
    if(undoStack.current.length>50)undoStack.current.shift();
    setUndoCount(undoStack.current.length);
    selectObj(copy);
    rendRef._needsRender&&rendRef._needsRender();
    setStatus(`📋 ${copy.userData.label}`);
  },[selectObj]);

  const updateDim=useCallback((axis,valCm)=>{
    const obj=selRef.current;if(!obj)return;
    const v=Math.max(0.001,(parseFloat(valCm)||1)/100);
    obj.userData[axis]=v;
    rebuildPiece(obj);
    addOutline(obj,sceneRef.current,outlineRef);
    const ol=outlineRef.current;
    if(ol)ol.material.color.set(obj.userData.locked?0xff8800:0x44aaff);
    setSelData(d=>({...d,[axis]:v,py:axis==="h"?Math.round((obj.position.y-(v)/2)*100):(d?.py??0)}));
    rendRef._needsRender&&rendRef._needsRender();
    setStatus(`📐 ${axis.toUpperCase()}: ${Math.round(v*100)}cm`);
  },[]);

  const updateRot=useCallback((axis,val)=>{
    const obj=selRef.current;if(!obj)return;
    let deg=parseFloat(val)||0;
    deg=((deg%360)+540)%360-180;
    obj.userData[axis]=deg;
    obj.rotation[axis.slice(1)]=THREE.MathUtils.degToRad(deg);
    syncOutline(obj,sceneRef.current,outlineRef);
    setSelData(d=>({...d,[axis]:Math.round(deg)}));
    rendRef._needsRender&&rendRef._needsRender();
  },[]);

  const updateY=useCallback((valCm)=>{
    const obj=selRef.current;if(!obj)return;
    const baseCm=parseFloat(valCm)||0;
    obj.position.y=baseCm/100+(obj.userData.h||0.1)/2;
    syncOutline(obj,sceneRef.current,outlineRef);
    setSelData(d=>({...d,py:Math.round(baseCm)}));
    rendRef._needsRender&&rendRef._needsRender();
  },[]);

  const applyMat=useCallback((mid)=>{
    setActMat(mid);
    const obj=selRef.current;if(!obj)return;
    obj.userData.matId=mid;
    if(obj.isGroup){
      const body=obj.children.find(c=>c.userData.isBody);
      if(body){if(body.material.map)body.material.map.dispose();body.material.dispose();body.material=buildMat(mid,obj.userData.w,obj.userData.h);}
    } else {
      if(obj.material.map)obj.material.map.dispose();obj.material.dispose();obj.material=buildMat(mid,obj.userData.w,obj.userData.h);
    }
    setSelData(d=>({...d,matId:mid}));
    rendRef._needsRender&&rendRef._needsRender();
    setStatus(`🎨 ${ALL_MAT_ITEMS.find(m=>m.id===mid)?.label||mid}`);
  },[]);

  const applyFrontMat=useCallback((mid)=>{
    const obj=selRef.current;if(!obj?.isGroup)return;
    obj.userData.frontMatId=mid;
    const front=obj.children.find(c=>c.userData.isFront);
    if(front){if(front.material.map)front.material.map.dispose();front.material.dispose();front.material=buildMat(mid,obj.userData.w,obj.userData.h);}
    setSelData(d=>({...d,frontMatId:mid}));
    rendRef._needsRender&&rendRef._needsRender();
    setStatus(`🎨 Frente: ${ALL_MAT_ITEMS.find(m=>m.id===mid)?.label||mid}`);
  },[]);

  const toggleOpen=useCallback(()=>{
    const obj=selRef.current;if(!obj)return;
    toggleOpenClose(obj);
    setSelData(d=>({...d,isOpen:obj.userData.isOpen}));
    rendRef._needsRender&&rendRef._needsRender();
    setStatus(obj.userData.isOpen?`🔓 Abrindo...`:`🔒 Fechando...`);
  },[]);

  // Helper: retorna o pai do handle (front para gaveta, body dentro do pivot para porta)
  const getHandleParent=(obj)=>{
    if(!obj?.isGroup)return null;
    if(obj.userData.typeId==="gaveta")
      return obj.children.find(c=>c.userData.isFront)||obj.children.find(c=>c.userData.isBody)||null;
    if(obj.userData.typeId==="porta"){
      const piv=obj.children.find(c=>c.userData.isPivot);
      return piv?.children.find(c=>c.userData.isBody)||null;
    }
    return null;
  };

  const toggleHandle=useCallback(()=>{
    const obj=selRef.current;if(!obj?.isGroup)return;
    const parent=getHandleParent(obj);
    const _h=parent?.children?.find(c=>c.userData.isHandle);
    if(!_h)return;
    const nowVisible=_h.visible;
    _h.visible=!nowVisible;
    obj.userData.hasHandle=!nowVisible;
    setSelData(d=>({...d,hasHandle:!nowVisible}));
    rendRef._needsRender&&rendRef._needsRender();
  },[]);

  const toggleLock=useCallback(()=>{
    const obj=selRef.current;if(!obj?.userData)return;
    const nowLocked=!obj.userData.locked;
    obj.userData.locked=nowLocked;
    const ol=outlineRef.current;
    if(ol)ol.material.color.set(nowLocked?0xff8800:0x44aaff);
    setSelData(d=>({...d,locked:nowLocked}));
    setPieces(prev=>prev.map(p=>p.id===obj.userData.id?{...p,locked:nowLocked}:p));
    rendRef._needsRender&&rendRef._needsRender();
    setStatus(nowLocked?`🔒 Bloqueada`:`🔓 Desbloqueada`);
  },[]);

  const toggleTransparent=useCallback(()=>{
    const obj=selRef.current;if(!obj?.userData)return;
    const nowT=!obj.userData.transparent;
    obj.userData.transparent=nowT;
    // Aplica opacidade em todos os meshes filhos (e no próprio obj se for mesh)
    const opacity=nowT?0.25:1;
    const applyOpacity=(o)=>{
      if(o.isMesh&&o.material){
        o.material.transparent=nowT;
        o.material.opacity=opacity;
        o.material.needsUpdate=true;
      }
      if(o.children)o.children.forEach(applyOpacity);
    };
    applyOpacity(obj);
    setSelData(d=>({...d,transparent:nowT}));
    rendRef._needsRender&&rendRef._needsRender();
    setStatus(nowT?`👻 Transparente`:`⬜ Opaca`);
  },[]);

  const undoAction=useCallback(()=>{
    const stack=undoStack.current;
    if(stack.length===0){setStatus("⚠ Nada para desfazer");return;}
    const entry=stack.pop();
    setUndoCount(stack.length);
    if(entry.type==="add"||entry.type==="duplicate"){
      const obj=entry.obj;if(!obj)return;
      clearOutline(sceneRef.current,outlineRef);animSet.delete(obj);
      sceneRef.current.remove(obj);
      obj.traverse(c=>{if(c.isMesh){c.geometry.dispose();if(c.material.map)c.material.map.dispose();c.material.dispose();}});
      piecesRef.current=piecesRef.current.filter(p=>p!==obj);
      setPieces(prev=>prev.filter(p=>p.id!==obj.userData.id));
      if(selRef.current===obj)selectObj(null);
      rendRef._needsRender&&rendRef._needsRender();
      setStatus("↩ Desfeito");
    } else if(entry.type==="delete"){
      const obj=entry.obj;if(!obj)return;
      obj.position.copy(entry.pos);obj.rotation.copy(entry.rot);
      sceneRef.current.add(obj);piecesRef.current.push(obj);
      setPieces(prev=>[...prev,{id:obj.userData.id,label:obj.userData.label,typeId:obj.userData.typeId}]);
      selectObj(obj);rendRef._needsRender&&rendRef._needsRender();
      setStatus("↩ Desfeito: remoção");
    } else if(entry.type==="move"){
      const obj=entry.obj;if(!obj)return;
      obj.position.set(entry.fromX,entry.fromY,entry.fromZ);
      if(obj.userData){obj.userData.baseX=entry.fromX;obj.userData.baseZ=entry.fromZ;}
      syncOutline(obj,sceneRef.current,outlineRef);
      rendRef._needsRender&&rendRef._needsRender();
      setStatus("↩ Desfeito: movimento");
    }
  },[selectObj]);

  useEffect(()=>{
    const handler=(e)=>{
      if((e.ctrlKey||e.metaKey)&&e.key==="z"&&!e.shiftKey){e.preventDefault();undoAction();return;}
      const tag=document.activeElement?.tagName;
      if(tag==="INPUT"||tag==="TEXTAREA")return;
      const isArrow=["ArrowLeft","ArrowRight","ArrowUp","ArrowDown"].includes(e.key);
      if(!isArrow)return;
      e.preventDefault();
      const obj=selRef.current;
      if(!obj?.userData||obj.userData.locked)return;
      const step=e.shiftKey?0.01:0.001;
      if(e.key==="ArrowLeft")obj.position.x-=step;
      if(e.key==="ArrowRight")obj.position.x+=step;
      if(e.key==="ArrowUp")obj.position.z-=step;
      if(e.key==="ArrowDown")obj.position.z+=step;
      obj.position.x=snapGrid(obj.position.x);obj.position.z=snapGrid(obj.position.z);
      if(obj.userData&&!obj.userData.isOpen&&!(obj.userData.openProgress>0)){
        obj.userData.baseX=obj.position.x;obj.userData.baseZ=obj.position.z;
      }
      syncOutline(obj,sceneRef.current,outlineRef);
      rendRef._needsRender&&rendRef._needsRender();
    };
    window.addEventListener("keydown",handler);
    return()=>window.removeEventListener("keydown",handler);
  },[undoAction]);

  const toggleDoorSide=useCallback((forceSide)=>{
    const obj=selRef.current;if(!obj?.userData||obj.userData.typeId!=="porta")return;
    obj.userData.isOpen=false;obj.userData.openProgress=0;
    animSet.delete(obj);
    const newSide=forceSide||(obj.userData.doorSide==="right"?"left":"right");
    obj.userData.doorSide=newSide;
    const w=obj.userData.w;
    const pivot=obj.children.find(c=>c.userData.isPivot);
    if(pivot){
      pivot.rotation.y=0;
      // Move pivot para nova borda; inverte body/track dentro do pivot
      pivot.position.x = newSide==="left" ? -w/2 : w/2;
      const bodyOffX = newSide==="left" ? w/2 : -w/2;
      pivot.children.forEach(c=>{
        if(c.userData.isBody||c.userData.isTrack) c.position.x=bodyOffX;
      });
    }
    // Recria marcador F
    const _body=pivot?.children.find(c=>c.userData.isBody);
    if(_body){
      const _oldF=_body.children?.find(c=>c.userData.isHandle);
      if(_oldF){_oldF.traverse(c=>{if(c.isMesh){c.geometry.dispose();c.material.dispose();}});_body.remove(_oldF);}
      attachHandle(_body,obj.userData.w,obj.userData.h,obj.userData.slabD||obj.userData.d,"porta",newSide,0,0,0);
    }
    addOutline(obj,sceneRef.current,outlineRef);
    setSelData(d=>({...d,doorSide:newSide,isOpen:false}));
    rendRef._needsRender&&rendRef._needsRender();
    setStatus(`🚪 Dobradiça: ${newSide==="left"?"Esquerda":"Direita"}`);
  },[]);

  const toggleDoorType=useCallback((newType)=>{
    const obj=selRef.current;if(!obj?.userData||obj.userData.typeId!=="porta")return;
    if(obj.userData.isOpen){
      obj.userData.isOpen=false;obj.userData.openProgress=0;
      const _p=obj.children.find(c=>c.userData.isPivot);
      if(_p){_p.rotation.y=0;_p.position.z=0;}
      animSet.delete(obj);
    }
    obj.userData.doorType=newType;
    const pivot=obj.children.find(c=>c.userData.isPivot);
    const track=pivot?.children.find(c=>c.userData.isTrack);
    if(track)track.visible=(newType==="sliding");
    const _tdtBody=pivot?.children.find(c=>c.userData.isBody);
    if(_tdtBody){
      const _tdtOldH=_tdtBody.children?.find(c=>c.userData.isHandle);
      if(_tdtOldH){_tdtOldH.traverse(c=>{if(c.isMesh){c.geometry.dispose();c.material.dispose();}});_tdtBody.remove(_tdtOldH);}
      const nh=attachHandle(_tdtBody,obj.userData.w,obj.userData.h,obj.userData.slabD||obj.userData.d,"porta",obj.userData.doorSide||"left",0,0,0);
      if(nh)nh.visible=obj.userData.hasHandle!==false;
    }
    setSelData(d=>({...d,doorType:newType,isOpen:false}));
    rendRef._needsRender&&rendRef._needsRender();
    setStatus(newType==="sliding"?"🛤 Porta de correr":"🚪 Porta de dobradiça");
  },[]);

  const setView=useCallback((v)=>{
    const s=sph.current;s.cx=0;s.cy=0.4;s.cz=0;
    if(v==="iso"){s.phi=0.65;s.theta=0.8;s.radius=3.5;}
    if(v==="top"){s.phi=0.06;s.theta=0;s.radius=3.5;}
    if(v==="front"){s.phi=1.52;s.theta=0;s.radius=3.5;}
    if(v==="back"){s.phi=1.52;s.theta=Math.PI;s.radius=3.5;}
    if(v==="left"){s.phi=1.52;s.theta=-Math.PI/2;s.radius=3.5;}
    if(v==="right"){s.phi=1.52;s.theta=Math.PI/2;s.radius=3.5;}
    updateCam();rendRef._needsRender&&rendRef._needsRender();
  },[updateCam]);

  const selFromList=useCallback((id)=>{
    const obj=piecesRef.current.find(p=>p.userData.id===id);
    if(obj)selectObj(obj);
  },[selectObj]);

  const startRename=useCallback((id,label,e)=>{
    e.stopPropagation();setEditingId(id);setEditingName(label);
    setTimeout(()=>renameRef.current?.focus(),30);
  },[]);

  const confirmRename=useCallback(()=>{
    const name=editingName.trim();if(!name){setEditingId(null);return;}
    const obj=piecesRef.current.find(p=>p.userData.id===editingId);
    if(obj)obj.userData.label=name;
    setPieces(prev=>prev.map(p=>p.id===editingId?{...p,label:name}:p));
    if(selRef.current?.userData.id===editingId)setSelData(d=>({...d,label:name}));
    setEditingId(null);
    setStatus(`✏ Renomeado: ${name}`);
  },[editingId,editingName]);

  const updateHandleY=useCallback((yCm)=>{
    const obj=selRef.current;if(!obj?.userData)return;
    const yM=(parseFloat(yCm)||0)/100;
    const maxY=obj.userData.h/2-0.02;
    const clamp=Math.max(-maxY,Math.min(maxY,yM));
    const parent=getHandleParent(obj);
    if(parent){
      const nh=attachHandle(parent,obj.userData.w,obj.userData.h,obj.userData.slabD||obj.userData.d,obj.userData.typeId,obj.userData.doorSide||"left",obj.userData.handleX||0,clamp,obj.userData.handleAngle||0);
      if(nh)nh.visible=obj.userData.hasHandle!==false;
    }
    obj.userData.handleY=clamp;
    setSelData(d=>({...d,handleY:clamp}));
    rendRef._needsRender&&rendRef._needsRender();
  },[getHandleParent]);

  const updateHandleX=useCallback((xCm)=>{
    const obj=selRef.current;if(!obj?.userData)return;
    const xM=(parseFloat(xCm)||0)/100;
    const maxX=obj.userData.w/2-0.015;
    const clamp=Math.max(-maxX,Math.min(maxX,xM));
    const parent=getHandleParent(obj);
    if(parent){
      const nh=attachHandle(parent,obj.userData.w,obj.userData.h,obj.userData.slabD||obj.userData.d,obj.userData.typeId,obj.userData.doorSide||"left",clamp,obj.userData.handleY||0,obj.userData.handleAngle||0);
      if(nh)nh.visible=obj.userData.hasHandle!==false;
    }
    obj.userData.handleX=clamp;
    setSelData(d=>({...d,handleX:clamp}));
    rendRef._needsRender&&rendRef._needsRender();
  },[getHandleParent]);

  const updateHandleAngle=useCallback((deg)=>{
    const obj=selRef.current;if(!obj?.userData)return;
    const angle=((parseFloat(deg)||0)%360+360)%360;
    const parent=getHandleParent(obj);
    if(parent){
      const nh=attachHandle(parent,obj.userData.w,obj.userData.h,obj.userData.slabD||obj.userData.d,obj.userData.typeId,obj.userData.doorSide||"left",obj.userData.handleX||0,obj.userData.handleY||0,angle);
      if(nh)nh.visible=obj.userData.hasHandle!==false;
    }
    obj.userData.handleAngle=angle;
    setSelData(d=>({...d,handleAngle:angle}));
    rendRef._needsRender&&rendRef._needsRender();
    setStatus(`🔩 Puxador: ${Math.round(angle)}°`);
  },[getHandleParent]);

  const generatePDF = () => {
    const renderer = rendRef.current;
    if (!renderer) return;
    // Força um render para garantir que o canvas está atualizado
    if (rendRef._needsRender) rendRef._needsRender();
    setTimeout(() => {
      try {
        const canvas = renderer.domElement;
        const imgData = canvas.toDataURL('image/png');
        const cw = canvas.width, ch = canvas.height;
        // Dimensões A4 em pontos (landscape se necessário)
        const landscape = cw > ch;
        const pW = landscape ? 841.89 : 595.28;
        const pH = landscape ? 595.28 : 841.89;
        const margin = 30;
        const maxW = pW - margin*2;
        const maxH = pH - margin*2 - 40; // espaço para header
        const ratio = Math.min(maxW/cw, maxH/ch);
        const iW = cw*ratio, iH = ch*ratio;
        const iX = margin + (maxW-iW)/2;
        const iY = margin + 36;

        // Monta PDF manualmente (formato mínimo)
        const now = new Date().toLocaleDateString('pt-BR');
        const title = 'Modelare 3D — Projeto';

        // Usa window.print com iframe para criar PDF
        const win = window.open('', '_blank', 'width=900,height=700');
        win.document.write(`<!DOCTYPE html><html><head>
          <title>${title}</title>
          <style>
            @page { size: ${landscape?'A4 landscape':'A4'}; margin: 15mm; }
            body { margin:0; padding:0; font-family:'Segoe UI',sans-serif; background:#fff; }
            .header { display:flex; justify-content:space-between; align-items:center;
              border-bottom:2px solid #1a3a6a; padding-bottom:8px; margin-bottom:16px; }
            .title { font-size:18px; font-weight:700; color:#1a3a6a; }
            .date { font-size:11px; color:#666; }
            .scene { width:100%; text-align:center; }
            .scene img { max-width:100%; border:1px solid #ddd; border-radius:4px; box-shadow:0 2px 8px rgba(0,0,0,.15); }
            .footer { margin-top:16px; font-size:9px; color:#999; text-align:center; border-top:1px solid #eee; padding-top:8px; }
          </style>
        </head><body>
          <div class="header">
            <div class="title">📐 ${title}</div>
            <div class="date">Gerado em ${now}</div>
          </div>
          <div class="scene"><img src="${imgData}"/></div>
          <div class="footer">Modelare 3D — Software de Design de Móveis Sob Medida</div>
          <script>window.onload=()=>{window.print();}<\/script>
        </body></html>`);
        win.document.close();
      } catch(e) {
        alert('Erro ao gerar PDF: ' + e.message);
      }
    }, 100);
  };

  const cm=v=>v!==undefined?Math.round(v*100):0;
  const tIcon=id=>PTYPES.find(t=>t.id===id)?.icon||"▭";
  const isMovable=selData?.typeId==="gaveta"||selData?.typeId==="porta";

  // ── RENDER ──────────────────────────────────────────────────────────────────
  return (
    <SfCtx.Provider value={sf}>
    <div style={{display:"flex",width:"100vw",height:"100vh",background:"#0c0c14",fontFamily:"'Segoe UI',sans-serif",color:"#ddd8cc",overflow:"hidden"}}>
      {/* SIDEBAR */}
      <div style={{width:sidebarW,minWidth:sidebarW,background:"#0e0e1c",borderRight:"1px solid #1e2040",display:"flex",flexDirection:"column",overflowY:"auto",flexShrink:0,zIndex:10}}>
        {/* Logo */}
        <div style={{padding:`${Math.round(10*sf)}px ${Math.round(12*sf)}px ${Math.round(8*sf)}px`,borderBottom:"1px solid #1e2040",background:"linear-gradient(135deg,#141428,#1a1a34)"}}>
          <div style={{fontSize:Math.round(16*sf),fontWeight:800,color:"#c8a060",lineHeight:1.2}}>Móveis sob medida</div>
          <div style={{fontSize:Math.round(11*sf),letterSpacing:3,color:"#f0c040",textTransform:"uppercase",marginTop:2}}>Modelare 3D</div>
          <div style={{marginTop:8,display:"flex",alignItems:"center",gap:6}}>
            <span style={{fontSize:9,color:"#3a5a7a"}}>⇔</span>
            <input type="range" min={200} max={420} step={5} value={sidebarW} onChange={e=>setSidebarW(Number(e.target.value))} style={{flex:1,accentColor:"#c8a060",cursor:"pointer",height:3}}/>
            <span style={{fontSize:9,color:"#3a5a7a",fontFamily:"monospace",minWidth:28,textAlign:"right"}}>{sidebarW}px</span>
          </div>
        </div>

        {/* Tabs */}
        <div style={{display:"flex",flexShrink:0,borderBottom:"2px solid #0e1020",background:"#090912"}}>
          {[{k:"add",icon:"🪚",label:"Construir"},{k:"edit",icon:"✏️",label:"Editar"},{k:"mat",icon:"🎨",label:"Acabamento"},{k:"cam",icon:"👁",label:"Vista"},{k:"cut",icon:"📐",label:"Orçamento"},{k:"fer",icon:"🔩",label:"Ferragem"}].map(({k,icon,label})=>{
            const active=tab===k;
            return (
              <div key={k} onClick={()=>setTab(k)} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:2,padding:`${Math.round(8*sf)}px 2px`,cursor:"pointer",background:active?"#0f1428":"transparent",borderBottom:active?"3px solid #5a9aff":"3px solid transparent"}}>
                <span style={{fontSize:Math.round(17*sf),lineHeight:1}}>{icon}</span>
                <span style={{fontSize:Math.round(8*sf),fontWeight:active?700:400,color:active?"#7ab4f8":"#3a5268",textAlign:"center"}}>{label}</span>
              </div>
            );
          })}
        </div>

        {/* ── ABA CONSTRUIR ── */}
        {tab==="add" && (
          <div style={{flex:1,display:"flex",flexDirection:"column"}}>
            <div style={{padding:`${Math.round(12*sf)}px ${Math.round(10*sf)}px`}}>
              <div style={{fontSize:Math.round(10*sf),fontWeight:700,color:"#4a7aaa",letterSpacing:1.5,textTransform:"uppercase",marginBottom:8}}>Tipo de Peça</div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr 1fr",gap:5,marginBottom:10}}>
                {PTYPES.map(t=>{
                  const active=actType===t.id;
                  return (
                    <div key={t.id} onClick={()=>setActType(t.id)} style={{display:"flex",flexDirection:"column",alignItems:"center",gap:3,padding:`${Math.round(8*sf)}px 4px`,borderRadius:8,cursor:"pointer",background:active?"linear-gradient(145deg,#162438,#0f1e30)":"#0b0b18",border:`1.5px solid ${active?"#4a8aCC":"#1a1a30"}`,transition:"all 0.15s"}}>
                      <span style={{fontSize:Math.round(18*sf),lineHeight:1}}>{t.icon}</span>
                      <span style={{fontSize:Math.round(8.5*sf),color:active?"#90c8f0":"#445a6a",fontWeight:active?600:400,textAlign:"center",lineHeight:1.2}}>{t.label}</span>
                    </div>
                  );
                })}
              </div>
              <div onClick={addPiece} style={{display:"flex",alignItems:"center",justifyContent:"center",gap:8,padding:`${Math.round(12*sf)}px`,borderRadius:10,cursor:"pointer",background:"linear-gradient(135deg,#1a4a28,#0e3018)",border:"1.5px solid #2a7a3a",userSelect:"none"}}>
                <span style={{fontSize:Math.round(18*sf)}}>➕</span>
                <div>
                  <div style={{fontSize:Math.round(12*sf),fontWeight:700,color:"#6ae080",lineHeight:1.2}}>Adicionar {PTYPES.find(t=>t.id===actType)?.label}</div>
                  <div style={{fontSize:Math.round(9*sf),color:"#3a7a4a",marginTop:1}}>clique para inserir na cena</div>
                </div>
              </div>
            </div>
            <div style={{height:1,background:"#0e1020"}}/>
            {/* Ações */}
            <div style={{padding:`${Math.round(10*sf)}px`}}>
              <div style={{fontSize:Math.round(10*sf),fontWeight:700,color:"#4a7aaa",letterSpacing:1.5,textTransform:"uppercase",marginBottom:8}}>Ações</div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6,marginBottom:8}}>
                <div onClick={selId?dupSel:null} style={{display:"flex",alignItems:"center",gap:7,padding:`${Math.round(10*sf)}px`,borderRadius:8,cursor:selId?"pointer":"not-allowed",background:selId?"#0e1e30":"#0a0a14",border:`1.5px solid ${selId?"#2a5a8a":"#151520"}`,opacity:selId?1:0.4,transition:"all 0.15s"}}>
                  <span style={{fontSize:Math.round(16*sf)}}>📋</span>
                  <div><div style={{fontSize:Math.round(10*sf),fontWeight:600,color:selId?"#6ab0e0":"#3a4a5a"}}>Duplicar</div></div>
                </div>
                <div onClick={selId?delSel:null} style={{display:"flex",alignItems:"center",gap:7,padding:`${Math.round(10*sf)}px`,borderRadius:8,cursor:selId?"pointer":"not-allowed",background:selId?"#1e0e0e":"#0a0a14",border:`1.5px solid ${selId?"#7a2a2a":"#151520"}`,opacity:selId?1:0.4,transition:"all 0.15s"}}>
                  <span style={{fontSize:Math.round(16*sf)}}>🗑</span>
                  <div><div style={{fontSize:Math.round(10*sf),fontWeight:600,color:selId?"#e06a6a":"#3a4a5a"}}>Remover</div></div>
                </div>
              </div>
              <div onClick={undoAction} style={{display:"flex",alignItems:"center",gap:10,padding:`${Math.round(10*sf)}px ${Math.round(12*sf)}px`,borderRadius:8,cursor:"pointer",background:"#0e0e1c",border:`1.5px solid ${undoCount>0?"#3a3a7a":"#1a1a2a"}`,transition:"all 0.15s",userSelect:"none"}}>
                <span style={{fontSize:Math.round(18*sf),opacity:undoCount>0?1:0.4}}>↩</span>
                <div style={{flex:1}}>
                  <div style={{fontSize:Math.round(11*sf),fontWeight:600,color:undoCount>0?"#8a8ad8":"#3a3a5a"}}>Desfazer</div>
                  <div style={{fontSize:Math.round(8.5*sf),color:"#2a2a5a"}}>{undoCount} ação{undoCount!==1?"ões":""} · Ctrl+Z</div>
                </div>
              </div>
            </div>
            <div style={{height:1,background:"#0e1020"}}/>
            {/* Lista */}
            <div style={{padding:`${Math.round(10*sf)}px`,flex:1,overflow:"hidden",display:"flex",flexDirection:"column"}}>
              <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:8}}>
                <div style={{fontSize:Math.round(10*sf),fontWeight:700,color:"#4a7aaa",letterSpacing:1.5,textTransform:"uppercase"}}>Peças na Cena</div>
                <div style={{fontSize:Math.round(10*sf),fontWeight:700,color:"#3a5a7a",background:"#0e1828",borderRadius:10,padding:`2px 7px`,border:"1px solid #1a2a3a"}}>{pieces.length}</div>
              </div>
              <div style={{flex:1,overflowY:"auto",display:"flex",flexDirection:"column",gap:4}}>
                {pieces.length===0&&<div style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:8,padding:`${Math.round(24*sf)}px`,color:"#2a3a4a",textAlign:"center"}}><span style={{fontSize:28,opacity:0.3}}>📦</span><div style={{fontSize:10}}>Nenhuma peça ainda.</div></div>}
                {pieces.map(p=>(
                  <div key={p.id} onClick={()=>selFromList(p.id)} style={{display:"flex",alignItems:"center",gap:8,padding:`${Math.round(8*sf)}px ${Math.round(10*sf)}px`,borderRadius:8,cursor:"pointer",background:selId===p.id?"#0e1e34":"#0b0b18",border:`1.5px solid ${selId===p.id?"#3a6aaa":"#161628"}`,transition:"all 0.15s"}}>
                    <span style={{fontSize:15,flexShrink:0}}>{tIcon(p.typeId)}</span>
                    {editingId===p.id
                      ?<input ref={renameRef} value={editingName} onChange={e=>setEditingName(e.target.value)} onBlur={confirmRename} onKeyDown={e=>{if(e.key==="Enter")confirmRename();if(e.key==="Escape")setEditingId(null);}} onClick={e=>e.stopPropagation()} style={{flex:1,background:"#0a1828",border:"1px solid #3a6090",borderRadius:4,color:"#a0d0ff",fontSize:11,padding:"3px 6px",outline:"none",minWidth:0}}/>
                      :<span style={{flex:1,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",fontSize:Math.round(11*sf),fontWeight:selId===p.id?600:400,color:selId===p.id?"#8ac8f8":"#506880"}}>{p.locked&&<span style={{color:"#cc7a00",marginRight:4}}>🔒</span>}{p.label}</span>
                    }
                    <span onClick={e=>startRename(p.id,p.label,e)} style={{fontSize:11,color:"#4a7aaa",cursor:"pointer",padding:"2px 5px",borderRadius:4,background:"#0e1828",border:"1px solid #1a3a4a"}}>✏</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── ABA EDITAR ── */}
        {tab==="edit" && (
          <div style={{flex:1,overflowY:"auto"}}>
            {!selId&&<div style={{display:"flex",flexDirection:"column",alignItems:"center",padding:`${Math.round(32*sf)}px 16px`,gap:10,textAlign:"center"}}><span style={{fontSize:36,opacity:0.25}}>✏️</span><div style={{fontSize:12,color:"#3a5a6a",lineHeight:1.5}}>Selecione uma peça<br/>na cena para editar</div></div>}
            {selData&&(
              <div style={{display:"flex",flexDirection:"column",gap:0}}>
                {/* Identidade */}
                <div style={{padding:`${Math.round(12*sf)}px ${Math.round(10*sf)}px`,borderBottom:"1px solid #0e1020"}}>
                  <div style={{fontSize:Math.round(10*sf),fontWeight:700,color:"#4a7aaa",letterSpacing:1.5,textTransform:"uppercase",marginBottom:8}}>Identidade</div>
                  <div style={{display:"flex",alignItems:"center",gap:6,padding:`7px 10px`,marginBottom:6,background:"#0a1020",border:"1.5px solid #1a2a3a",borderRadius:8}}>
                    <span style={{fontSize:14}}>{tIcon(selData.typeId)}</span>
                    {editingId===selData.id
                      ?<input ref={renameRef} value={editingName} onChange={e=>setEditingName(e.target.value)} onBlur={confirmRename} onKeyDown={e=>{if(e.key==="Enter")confirmRename();if(e.key==="Escape")setEditingId(null);}} style={{flex:1,background:"#0a1828",border:"1px solid #3a6090",borderRadius:4,color:"#a0d0ff",fontSize:12,padding:"3px 6px",outline:"none",minWidth:0}}/>
                      :<span style={{flex:1,fontSize:12,color:"#80b8d8",fontWeight:600,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{selData.label}</span>
                    }
                    <span onClick={e=>{e.stopPropagation();startRename(selData.id,selData.label,e);}} style={{fontSize:13,color:"#4a7aaa",cursor:"pointer",padding:"2px 5px",borderRadius:4,background:"#0e1828",border:"1px solid #1a3a4a"}}>✏</span>
                  </div>
                  <div style={{display:"flex",gap:6}}>
                    <div onClick={toggleLock} style={{flex:1,display:"flex",alignItems:"center",gap:10,padding:`10px 12px`,borderRadius:8,cursor:"pointer",background:selData.locked?"#1c0e00":"#0b0b18",border:`1.5px solid ${selData.locked?"#cc6600":"#1e2030"}`,transition:"all 0.15s"}}>
                      <span style={{fontSize:20}}>{selData.locked?"🔒":"🔓"}</span>
                      <div style={{flex:1}}>
                        <div style={{fontSize:11,fontWeight:600,color:selData.locked?"#ff9900":"#5a8aaa"}}>{selData.locked?"Bloqueada":"Livre"}</div>
                      </div>
                    </div>
                    <div onClick={toggleTransparent} title={selData.transparent?"Tornar opaca":"Tornar transparente"} style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:3,padding:"8px 12px",borderRadius:8,cursor:"pointer",background:selData.transparent?"#0a1a2a":"#0b0b18",border:`1.5px solid ${selData.transparent?"#3a8acc":"#1e2030"}`,transition:"all 0.15s",minWidth:52}}>
                      <span style={{fontSize:20,opacity:selData.transparent?0.4:1}}>⬜</span>
                      <span style={{fontSize:8,color:selData.transparent?"#5ab0e0":"#3a5a7a",fontWeight:600}}>{selData.transparent?"Opaca":"Transp."}</span>
                    </div>
                  </div>
                </div>
                {/* Dimensões */}
                <div style={{padding:`${Math.round(12*sf)}px ${Math.round(10*sf)}px`,borderBottom:"1px solid #0e1020"}}>
                  <div style={{fontSize:Math.round(10*sf),fontWeight:700,color:"#4a7aaa",letterSpacing:1.5,textTransform:"uppercase",marginBottom:8}}>Dimensões (cm)</div>
                  <div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:6,padding:8,borderRadius:8,marginBottom:10,background:"#080e18",border:"1px solid #1a2a3a"}}>
                    <span style={{fontSize:18}}>📦</span>
                    <span style={{fontSize:13,fontWeight:700,color:"#70c080",fontFamily:"monospace"}}>{cm(selData.w)} × {cm(selData.h)} × {cm(selData.d)} cm</span>
                  </div>
                  {[["w","↔ Largura"],["h","↕ Altura"],["d","↗ Prof."]].map(([ax,lb])=>(
                    <div key={ax} style={{display:"flex",alignItems:"center",gap:6,marginBottom:5}}>
                      <div style={{fontSize:9,color:"#4a6a7a",width:90,flexShrink:0}}>{lb}</div>
                      <input type="number" min={1} max={500} step={1} value={cm(selData[ax])} onChange={e=>updateDim(ax,e.target.value)} style={{flex:1,padding:"4px 6px",background:"#080c18",border:"1px solid #2a3a5a",borderRadius:4,color:"#80c0e0",fontSize:11,outline:"none",textAlign:"right"}}/>
                      <div style={{fontSize:9,color:"#3a5a7a"}}>cm</div>
                    </div>
                  ))}
                </div>
                {/* Animação */}
                {isMovable&&(
                  <div style={{padding:`${Math.round(12*sf)}px ${Math.round(10*sf)}px`,borderBottom:"1px solid #0e1020"}}>
                    <div style={{fontSize:Math.round(10*sf),fontWeight:700,color:"#4a7aaa",letterSpacing:1.5,textTransform:"uppercase",marginBottom:8}}>{selData.typeId==="gaveta"?"Gaveta":"Porta"}</div>
                    {selData.typeId==="porta"&&(
                      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6,marginBottom:8}}>
                        {[["hinged","🚪","Dobradiça"],["sliding","🛤","Correr"]].map(([t,icon,lbl])=>(
                          <div key={t} onClick={()=>toggleDoorType(t)} style={{display:"flex",flexDirection:"column",alignItems:"center",gap:4,padding:10,borderRadius:8,cursor:"pointer",background:selData.doorType===t?"linear-gradient(145deg,#0e2030,#0a1828)":"#0b0b18",border:`1.5px solid ${selData.doorType===t?"#3a8aaa":"#1a1a30"}`,transition:"all 0.15s"}}>
                            <span style={{fontSize:22}}>{icon}</span>
                            <span style={{fontSize:9.5,fontWeight:selData.doorType===t?700:400,color:selData.doorType===t?"#70c0d8":"#3a5a6a"}}>{lbl}</span>
                          </div>
                        ))}
                      </div>
                    )}
                    <div onClick={toggleOpen} style={{display:"flex",alignItems:"center",gap:12,padding:`12px 14px`,borderRadius:10,cursor:"pointer",marginBottom:8,background:selData.isOpen?"linear-gradient(135deg,#0e280e,#081808)":"linear-gradient(135deg,#0e0e28,#080818)",border:`1.5px solid ${selData.isOpen?"#3a8a3a":"#3a3a8a"}`,transition:"all 0.2s"}}>
                      <span style={{fontSize:26}}>{selData.isOpen?"🔓":"🔒"}</span>
                      <div style={{flex:1}}>
                        <div style={{fontSize:13,fontWeight:700,color:selData.isOpen?"#60d870":"#7888e8"}}>{selData.isOpen?"Aberto":"Fechado"}</div>
                        <div style={{fontSize:9,color:selData.isOpen?"#3a7a3a":"#3a3a7a",marginTop:2}}>toque para {selData.isOpen?"fechar":"abrir"}</div>
                      </div>
                    </div>
                    {selData.typeId==="porta"&&(
                      <div style={{display:"flex",alignItems:"center",gap:8,padding:"8px 10px",borderRadius:7,background:"#0e120a",border:"1px solid #3a4a1a",marginBottom:8}}>
                        <span style={{fontSize:16,color:"#ffcc44",fontWeight:900,fontFamily:"monospace",minWidth:18,textAlign:"center"}}>F</span>
                        <span style={{fontSize:9,color:"#6a8a3a"}}>Marcador de frente visível na face frontal da porta</span>
                      </div>
                    )}
                    {selData.typeId==="gaveta"&&(
                      <>
                        <div onClick={toggleHandle} style={{display:"flex",alignItems:"center",gap:10,padding:`10px 12px`,borderRadius:8,cursor:"pointer",marginBottom:8,background:selData.hasHandle?"#161608":"#0e0e0e",border:`1.5px solid ${selData.hasHandle?"#6a5a20":"#2a2a2a"}`,transition:"all 0.15s"}}>
                          <span style={{fontSize:20}}>🔩</span>
                          <div style={{flex:1}}>
                            <div style={{fontSize:11,fontWeight:600,color:selData.hasHandle?"#c8a040":"#4a4a4a"}}>{selData.hasHandle?"Com Puxador":"Sem Puxador"}</div>
                          </div>
                        </div>
                        {selData.hasHandle&&(
                          <div style={{background:"#0a0a14",borderRadius:8,padding:10,border:"1px solid #1e1e30"}}>
                            <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}>
                              <span style={{fontSize:9,color:"#4a6a7a",textTransform:"uppercase",letterSpacing:0.5}}>↕ Altura do Puxador</span>
                              <span style={{fontSize:10,color:"#c8a040",fontFamily:"monospace",fontWeight:700}}>{((selData.handleY||0)*100).toFixed(1)}cm</span>
                            </div>
                            <input type="range" min={-Math.round((selData.h/2-0.02)*100)} max={Math.round((selData.h/2-0.02)*100)} step={1} value={Math.round((selData.handleY||0)*100)} onChange={e=>updateHandleY(e.target.value)} style={{width:"100%",accentColor:"#c8a040",cursor:"pointer",height:3}}/>
                            <div style={{display:"flex",justifyContent:"space-between",marginTop:8,marginBottom:4}}>
                              <span style={{fontSize:9,color:"#4a6a7a",textTransform:"uppercase",letterSpacing:0.5}}>↔ Posição Horizontal</span>
                              <span style={{fontSize:10,color:"#c8a040",fontFamily:"monospace",fontWeight:700}}>{((selData.handleX||0)*100).toFixed(1)}cm</span>
                            </div>
                            <input type="range" min={-Math.round((selData.w/2-0.02)*100)} max={Math.round((selData.w/2-0.02)*100)} step={1} value={Math.round((selData.handleX||0)*100)} onChange={e=>updateHandleX(e.target.value)} style={{width:"100%",accentColor:"#7ab0e0",cursor:"pointer",height:3}}/>
                            <div style={{display:"flex",justifyContent:"space-between",marginTop:8,marginBottom:4}}>
                              <span style={{fontSize:9,color:"#4a6a7a",textTransform:"uppercase",letterSpacing:0.5}}>↻ Girar Puxador</span>
                              <span style={{fontSize:10,color:"#c8a040",fontFamily:"monospace",fontWeight:700}}>{Math.round(selData.handleAngle||0)}°</span>
                            </div>
                            <input type="range" min={0} max={180} step={5} value={Math.round(selData.handleAngle||0)} onChange={e=>updateHandleAngle(e.target.value)} style={{width:"100%",accentColor:"#a070d0",cursor:"pointer",height:3}}/>
                            <div style={{display:"flex",gap:4,marginTop:6}}>
                              {[0,45,90,135].map(a=>(
                                <div key={a} onClick={()=>updateHandleAngle(a)} style={{flex:1,padding:"4px 2px",borderRadius:4,textAlign:"center",cursor:"pointer",background:Math.round(selData.handleAngle||0)===a?"#2a1a4a":"#0a0a14",border:`1px solid ${Math.round(selData.handleAngle||0)===a?"#7a4aaa":"#1a1a2a"}`,fontSize:9,color:Math.round(selData.handleAngle||0)===a?"#c090f0":"#4a4a6a"}}>{a}°</div>
                              ))}
                            </div>
                          </div>
                        )}
                      </>
                    )}
                    {selData.typeId==="porta"&&(
                      <div style={{marginTop:8}}>
                        <div style={{fontSize:9,color:"#3a5a7a",letterSpacing:1,textTransform:"uppercase",marginBottom:6}}>
                          {selData.doorType==="sliding"?"Direção de Abertura":"Lado da Dobradiça"}
                        </div>
                        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6}}>
                          {selData.doorType==="sliding"
                            ?[["left","⬅","Esquerda"],["right","➡","Direita"]].map(([side,icon,lbl])=>(
                              <div key={side} onClick={()=>toggleDoorSide(side)} style={{display:"flex",flexDirection:"column",alignItems:"center",gap:4,padding:8,borderRadius:7,cursor:"pointer",background:selData.doorSide===side?"#0e2030":"#0b0b18",border:`1.5px solid ${selData.doorSide===side?"#3a7aaa":"#1a1a30"}`,transition:"all 0.15s"}}>
                                <span style={{fontSize:18}}>{icon}</span>
                                <span style={{fontSize:9,color:selData.doorSide===side?"#70c0e0":"#3a5a6a"}}>{lbl}</span>
                              </div>
                            ))
                            :[["right","⬅🚪","Esquerda"],["left","🚪➡","Direita"]].map(([side,icon,lbl])=>(
                              <div key={side} onClick={()=>toggleDoorSide(side)} style={{display:"flex",flexDirection:"column",alignItems:"center",gap:4,padding:8,borderRadius:7,cursor:"pointer",background:selData.doorSide===side?"#0e2030":"#0b0b18",border:`1.5px solid ${selData.doorSide===side?"#3a7aaa":"#1a1a30"}`,transition:"all 0.15s"}}>
                                <span style={{fontSize:18}}>{icon}</span>
                                <span style={{fontSize:9,color:selData.doorSide===side?"#70c0e0":"#3a5a6a"}}>{lbl}</span>
                              </div>
                            ))
                          }
                        </div>
                      </div>
                    )}
                  </div>
                )}
                {/* Rotação */}
                <div style={{padding:`${Math.round(12*sf)}px ${Math.round(10*sf)}px`,borderBottom:"1px solid #0e1020"}}>
                  <div style={{fontSize:Math.round(10*sf),fontWeight:700,color:"#4a7aaa",letterSpacing:1.5,textTransform:"uppercase",marginBottom:8}}>Rotação</div>
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:6}}>
                    {[["rx","X","#dd5555"],["ry","Y","#55dd55"],["rz","Z","#5555ff"]].map(([ax,label,color])=>(
                      <div key={ax} style={{display:"flex",flexDirection:"column",gap:4}}>
                        <div style={{fontSize:9,color,textAlign:"center",fontWeight:700}}>{label}</div>
                        <input type="number" min={-180} max={180} step={5} value={selData[ax]||0} onChange={e=>updateRot(ax,e.target.value)} style={{width:"100%",padding:`6px 2px`,borderRadius:6,textAlign:"center",background:"#090916",border:`1.5px solid ${color}44`,color,fontSize:12,outline:"none",fontWeight:700}}/>
                      </div>
                    ))}
                  </div>
                </div>
                {/* Altura do chão */}
                <div style={{padding:`${Math.round(12*sf)}px ${Math.round(10*sf)}px`}}>
                  <div style={{fontSize:Math.round(10*sf),fontWeight:700,color:"#4a7aaa",letterSpacing:1.5,textTransform:"uppercase",marginBottom:8}}>Altura do Chão</div>
                  <div style={{display:"flex",alignItems:"center",gap:4}}>
                    <div onClick={()=>updateY((selData.py??0)-1)} style={{width:32,height:36,background:"#0a1020",border:"1.5px solid #1a3a5a",borderRadius:6,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,color:"#4a7aaa",flexShrink:0,userSelect:"none"}}>−</div>
                    <input type="number" step={1} value={selData.py??0} onChange={e=>updateY(e.target.value)} style={{flex:1,padding:6,background:"#080c18",border:"1.5px solid #2a3a5a",color:"#80d0f0",fontSize:14,fontWeight:700,outline:"none",textAlign:"center",minWidth:0}}/>
                    <div onClick={()=>updateY((selData.py??0)+1)} style={{width:32,height:36,background:"#0a1020",border:"1.5px solid #1a3a5a",borderRadius:6,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,color:"#4a7aaa",flexShrink:0,userSelect:"none"}}>+</div>
                    <span style={{fontSize:9,color:"#2a4a5a",flexShrink:0}}>cm</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── ABA MATERIAL ── */}
        {tab==="mat" && (
          <div style={{flex:1,overflowY:"auto"}}>
            {!selId&&<div style={{display:"flex",flexDirection:"column",alignItems:"center",padding:`${Math.round(32*sf)}px 16px`,gap:10,textAlign:"center"}}><span style={{fontSize:36,opacity:0.25}}>🎨</span><div style={{fontSize:12,color:"#3a5a6a",lineHeight:1.5}}>Selecione uma peça<br/>para aplicar acabamento</div></div>}
            {selData&&(
              <>
                {selData.typeId==="gaveta"&&(
                  <div style={{padding:`${Math.round(10*sf)}px`,borderBottom:"1px solid #0e1020"}}>
                    <div style={{fontSize:Math.round(10*sf),fontWeight:700,color:"#4a7aaa",letterSpacing:1.5,textTransform:"uppercase",marginBottom:8}}>Aplicar em</div>
                    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6}}>
                      {[["corpo","🗄","Corpo"],["frente","⬜","Frente"]].map(([t,icon,lbl])=>(
                        <div key={t} onClick={()=>setMatTarget(t)} style={{display:"flex",flexDirection:"column",alignItems:"center",gap:4,padding:10,borderRadius:8,cursor:"pointer",background:matTarget===t?"linear-gradient(145deg,#0e2038,#0a1828)":"#0b0b18",border:`1.5px solid ${matTarget===t?"#3a7aaa":"#1a1a2a"}`,transition:"all 0.15s"}}>
                          <span style={{fontSize:20}}>{icon}</span>
                          <span style={{fontSize:10,fontWeight:matTarget===t?700:400,color:matTarget===t?"#70b8e0":"#3a5a6a"}}>{lbl}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                <div style={{padding:`${Math.round(10*sf)}px`,borderBottom:"1px solid #0e1020",position:"sticky",top:0,background:"#0e0e1c",zIndex:2}}>
                  <input value={matSearch} onChange={e=>setMatSearch(e.target.value)} placeholder="🔍 Buscar acabamento..." style={{width:"100%",padding:`8px 10px`,background:"#080e18",border:"1.5px solid #1a2a3a",borderRadius:8,color:"#a0c8e0",fontSize:11,boxSizing:"border-box",outline:"none"}}/>
                </div>
                {MAT_GROUPS.map(g=>{
                  const filtered=g.items.filter(m=>!matSearch||m.label.toLowerCase().includes(matSearch.toLowerCase()));
                  if(!filtered.length)return null;
                  const activeMid=matTarget==="frente"?selData.frontMatId:selData.matId;
                  return (
                    <div key={g.group} style={{padding:`${Math.round(10*sf)}px`,borderBottom:"1px solid #0e1020"}}>
                      <div style={{fontSize:9.5,fontWeight:700,color:"#3a5a7a",letterSpacing:1,textTransform:"uppercase",marginBottom:6}}>{g.group}</div>
                      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:4}}>
                        {filtered.map(m=>(
                          <div key={m.id} onClick={()=>matTarget==="frente"?applyFrontMat(m.id):applyMat(m.id)} style={{display:"flex",alignItems:"center",gap:5,padding:"4px 6px",borderRadius:4,cursor:"pointer",background:activeMid===m.id?"#1a2838":"#0a0a18",border:`1px solid ${activeMid===m.id?"#3a6a9a":"#141424"}`,transition:"all 0.1s"}}>
                            <div style={{width:18,height:18,borderRadius:3,flexShrink:0,background:m.color,border:`1px solid ${activeMid===m.id?"#4a7aaa":"#2a2a3a"}`}}/>
                            <div style={{fontSize:9,color:activeMid===m.id?"#a0c8e0":"#5a7a8a",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{m.label}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
                {selData.typeId==="vidro"&&(
                  <div style={{padding:`${Math.round(10*sf)}px`}}>
                    <div style={{fontSize:9.5,fontWeight:700,color:"#3a5a7a",letterSpacing:1,textTransform:"uppercase",marginBottom:6}}>Vidros</div>
                    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:4}}>
                      {MATS_GLASS.filter(m=>!matSearch||m.label.toLowerCase().includes(matSearch.toLowerCase())).map(m=>(
                        <div key={m.id} onClick={()=>applyMat(m.id)} style={{display:"flex",alignItems:"center",gap:5,padding:"4px 6px",borderRadius:4,cursor:"pointer",background:selData.matId===m.id?"#1a2838":"#0a0a18",border:`1px solid ${selData.matId===m.id?"#3a6a9a":"#141424"}`,transition:"all 0.1s"}}>
                          <div style={{width:18,height:18,borderRadius:3,flexShrink:0,background:"linear-gradient(135deg,#88ccff88,#ffffff44)",border:"1px solid #3a5a7a"}}/>
                          <div style={{fontSize:9,color:selData.matId===m.id?"#a0c8e0":"#5a7a8a"}}>{m.label}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* ── ABA VISTA ── */}
        {tab==="cam" && (
          <div style={{padding:`${Math.round(12*sf)}px ${Math.round(10*sf)}px`,flex:1,overflowY:"auto"}}>
            <div style={{fontSize:Math.round(10*sf),fontWeight:700,color:"#4a7aaa",letterSpacing:1.5,textTransform:"uppercase",marginBottom:10}}>Ângulo de Vista</div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:6,marginBottom:14}}>
              {[{v:"iso",icon:"⬡",label:"Iso"},{v:"top",icon:"⬆",label:"Topo"},{v:"front",icon:"▣",label:"Frente"},{v:"back",icon:"▣",label:"Trás"},{v:"left",icon:"◁",label:"Esq"},{v:"right",icon:"▷",label:"Dir"}].map(({v,icon,label})=>(
                <div key={v} onClick={()=>setView(v)} style={{display:"flex",flexDirection:"column",alignItems:"center",gap:4,padding:`${Math.round(10*sf)}px 4px`,borderRadius:8,cursor:"pointer",background:"#0b0b18",border:"1.5px solid #1a1a2a",transition:"all 0.15s"}} onMouseEnter={e=>{e.currentTarget.style.background="#0f1830";e.currentTarget.style.borderColor="#3a5a9a";}} onMouseLeave={e=>{e.currentTarget.style.background="#0b0b18";e.currentTarget.style.borderColor="#1a1a2a";}}>
                  <span style={{fontSize:18,color:"#5a8aaa"}}>{icon}</span>
                  <span style={{fontSize:9,color:"#3a5a7a",fontWeight:500}}>{label}</span>
                </div>
              ))}
            </div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6,marginBottom:14}}>
              {[{icon:"🔍",label:"Aproximar",onClick:()=>{sph.current.radius=Math.max(0.5,sph.current.radius-0.5);updateCam();rendRef._needsRender&&rendRef._needsRender();}},{icon:"🔎",label:"Afastar",onClick:()=>{sph.current.radius=Math.min(14,sph.current.radius+0.5);updateCam();rendRef._needsRender&&rendRef._needsRender();}}].map(({icon,label,onClick})=>(
                <div key={label} onClick={onClick} style={{display:"flex",alignItems:"center",gap:8,padding:`${Math.round(10*sf)}px`,borderRadius:8,cursor:"pointer",background:"#0b0b18",border:"1.5px solid #1a1a2a",transition:"all 0.15s"}} onMouseEnter={e=>{e.currentTarget.style.background="#0f1828";}} onMouseLeave={e=>{e.currentTarget.style.background="#0b0b18";}}>
                  <span style={{fontSize:18}}>{icon}</span>
                  <span style={{fontSize:10,color:"#4a6a8a",fontWeight:500}}>{label}</span>
                </div>
              ))}
            </div>
            <div onClick={()=>setColisionOn(v=>!v)} style={{display:"flex",alignItems:"center",gap:12,padding:`12px 14px`,borderRadius:10,cursor:"pointer",background:colisionOn?"linear-gradient(135deg,#0e1e10,#081408)":"#0b0b18",border:`1.5px solid ${colisionOn?"#2a8a3a":"#1a2a1a"}`,transition:"all 0.2s"}}>
              <span style={{fontSize:26}}>{colisionOn?"🧱":"🫥"}</span>
              <div style={{flex:1}}>
                <div style={{fontSize:12,fontWeight:700,color:colisionOn?"#60d870":"#3a5a4a"}}>{colisionOn?"Colisão Ativa":"Colisão Off"}</div>
                <div style={{fontSize:9,color:colisionOn?"#2a6a3a":"#2a3a2a",marginTop:2}}>{colisionOn?"peças não se atravessam":"peças passam umas pelas outras"}</div>
              </div>
            </div>
            {/* Separador */}
            <div style={{margin:"14px 0 10px",borderTop:"1px solid #1a2030"}}/>
            <div style={{fontSize:Math.round(10*sf),fontWeight:700,color:"#4a7aaa",letterSpacing:1.5,textTransform:"uppercase",marginBottom:10}}>Exportar</div>
            <div onClick={generatePDF} style={{display:"flex",alignItems:"center",gap:12,padding:"12px 14px",borderRadius:10,cursor:"pointer",background:"linear-gradient(135deg,#0e0e28,#08081c)",border:"1.5px solid #3a3a7a",transition:"all 0.15s"}} onMouseEnter={e=>e.currentTarget.style.borderColor="#6a6aaa"} onMouseLeave={e=>e.currentTarget.style.borderColor="#3a3a7a"}>
              <span style={{fontSize:26}}>📄</span>
              <div style={{flex:1}}>
                <div style={{fontSize:12,fontWeight:700,color:"#8888dd"}}>Gerar PDF</div>
                <div style={{fontSize:9,color:"#4a4a7a",marginTop:2}}>Print da cena atual em PDF</div>
              </div>
            </div>
          </div>
        )}

        {/* ── ABA ORÇAMENTO ── */}
        {tab==="cut" && <CutTab pieces={pieces} prices={prices} setPrices={setPrices} piecesRef={piecesRef}/>}
        {tab==="fer" && <FerragemTab ferList={ferList} setFerList={setFerList} selFerId={selFerId} setSelFerId={setSelFerId} sceneRef={sceneRef} setStatus={setStatus} rendRef={rendRef} sf={sf} piecesRef={piecesRef} selId={selId}/>}
      </div>

      {/* VIEWPORT */}
      <div style={{flex:1,position:"relative",display:"flex",flexDirection:"column"}}>
        <div ref={mountRef} style={{flex:1}}
          onMouseDown={onMD} onMouseMove={onMM} onMouseUp={onMU} onMouseLeave={onMU}
          onWheel={()=>{}} onContextMenu={e=>e.preventDefault()}/>
        {/* Status */}
        <div style={{height:22,background:"#080810",borderTop:"1px solid #121222",flexShrink:0,display:"flex",alignItems:"center",padding:"0 14px",fontSize:10,gap:8}}>
          <span style={{color:"#3a6a40"}}>●</span>
          <span style={{color:"#4a6a50",flex:1}}>{status}</span>
          <span style={{color:"#2a3a3a",fontSize:9}}>Peças: {pieces.length}</span>
          {window._m3dIsAdmin&&<span onClick={()=>window.openAdmin&&window.openAdmin()} style={{color:"#3a5a8a",fontSize:9,cursor:"pointer",padding:"2px 8px",borderRadius:3,background:"#080e18",border:"1px solid #1a2a40",userSelect:"none"}}>⚙ Admin</span>}
        </div>
        {/* Botões flutuantes */}
        {selId&&(
          <div style={{position:"absolute",bottom:30,right:10,display:"flex",gap:4,alignItems:"center"}}>
            <div onClick={dupSel} title="Duplicar" style={{width:32,height:32,borderRadius:6,background:"#0e1a10",border:"1px solid #2a5a30",display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",fontSize:14,userSelect:"none"}}>📋</div>
            {isMovable&&<div onClick={toggleOpen} style={{height:32,padding:"0 10px",borderRadius:6,display:"flex",alignItems:"center",gap:5,background:selData?.isOpen?"#0e2a0e":"#0e0e28",border:`1px solid ${selData?.isOpen?"#2a6a2a":"#2a2a6a"}`,cursor:"pointer",fontSize:11,color:selData?.isOpen?"#70c070":"#7070c0",userSelect:"none"}}>{selData?.isOpen?"🔓 Fechar":"🔒 Abrir"}</div>}
            <div onClick={delSel} title="Remover" style={{width:32,height:32,borderRadius:6,background:"#1a0a0a",border:"1px solid #5a2a2a",display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",fontSize:14,userSelect:"none"}}>🗑</div>
          </div>
        )}
        {/* Legenda */}
        <div style={{position:"absolute",bottom:30,left:10,pointerEvents:"none",fontSize:9,color:"#2a4a3a",lineHeight:1.8}}>
          <div>🖱 Arr. esq → mover peça</div>
          <div>🖱 Arr. dir → orbitar câmera</div>
          <div>🖱 Alt+arr → pan · Roda → zoom</div>
        </div>
        {/* HUD rotação */}
        {selData&&(
          <div style={{position:"absolute",top:10,right:10,pointerEvents:"none",background:"#0808168a",border:"1px solid #1e2a3a",borderRadius:8,padding:"7px 11px",fontSize:10,lineHeight:1.9}}>
            <div style={{color:"#3a5a7a",fontSize:8,letterSpacing:1,marginBottom:2}}>ROT.</div>
            <div style={{color:"#dd5555"}}>X {selData.rx||0}°</div>
            <div style={{color:"#55dd55"}}>Y {selData.ry||0}°</div>
            <div style={{color:"#5555dd"}}>Z {selData.rz||0}°</div>
          </div>
        )}
      </div>
    </div>
    </SfCtx.Provider>
  );
}

// ═══════════════════════════════════════════════════════════════════
// ABA ORÇAMENTO
// ═══════════════════════════════════════════════════════════════════
function CutTab({pieces, prices, setPrices, piecesRef}) {
  const sf=useContext(SfCtx);
  const CW=prices.chapaW,CH=prices.chapaH;
  const panels=piecesRef.current.map(o=>({
    id:o.userData.id,label:o.userData.label||"Peça",
    w:Math.round((o.userData.w||0)*1000),h:Math.round((o.userData.h||0)*1000),d:Math.round((o.userData.d||0)*1000),
    mat:ALL_MAT_ITEMS.find(m=>m.id===o.userData.matId)?.label||o.userData.matId||"MDF",
  })).filter(p=>p.w>10&&p.h>10);
  const totalM2=panels.reduce((a,p)=>a+(p.w/1000)*(p.h/1000),0);
  const totalPerim=panels.reduce((a,p)=>a+2*((p.w+p.h)/1000)+4*(p.d/1000),0);
  const chapas=Math.max(1,Math.ceil(totalM2/((CW/1000)*(CH/1000))));
  const matCost=totalM2*prices.priceM2;
  const fitaCost=totalPerim*prices.fitaM;
  const srrCost=chapas*prices.corteChapa;
  const moCost=totalM2*prices.moObraM2;
  const total=matCost+fitaCost+srrCost+moCost;

  const exportTxt=()=>{
    const rows=panels.map((p,i)=>`  ${i+1}. ${p.label} — ${p.w}×${p.h}×${p.d}mm (${p.mat})`);
    const txt=[`MODELARE 3D — PLANO DE CORTE`,`Data: ${new Date().toLocaleDateString("pt-BR")}`,`Peças: ${panels.length}`,`${"─".repeat(50)}`,...rows,`${"─".repeat(50)}`,`Área total: ${totalM2.toFixed(3)} m²`,`Chapas ${CW}×${CH}: ${chapas}`,`Fita: ${totalPerim.toFixed(2)} m`,`${"─".repeat(50)}`,`Material: R$ ${matCost.toFixed(2)}`,`Fita: R$ ${fitaCost.toFixed(2)}`,`Corte: R$ ${srrCost.toFixed(2)}`,`${"─".repeat(50)}`,`TOTAL: R$ ${total.toFixed(2)}`].join("\n");
    const blob=new Blob([txt],{type:"text/plain;charset=utf-8"});
    const url=URL.createObjectURL(blob);
    const a=document.createElement("a");
    a.href=url;a.download=`plano_corte_${new Date().toISOString().slice(0,10)}.txt`;
    document.body.appendChild(a);a.click();document.body.removeChild(a);URL.revokeObjectURL(url);
  };

  return (
    <div style={{flex:1,overflowY:"auto",padding:`${Math.round(10*sf)}px`}}>
      {/* Config preços */}
      <div style={{fontSize:Math.round(10*sf),fontWeight:700,color:"#4a7aaa",letterSpacing:1.5,textTransform:"uppercase",marginBottom:8}}>Configurações</div>
      {[{l:"Chapa Largura",f:"chapaW",s:"mm"},{l:"Chapa Altura",f:"chapaH",s:"mm"},{l:"MDF (m²)",f:"priceM2",s:"R$"},{l:"Fita (m)",f:"fitaM",s:"R$"},{l:"Corte/chapa",f:"corteChapa",s:"R$"},{l:"Mão de obra (m²)",f:"moObraM2",s:"R$"}].map(({l,f,s})=>(
        <div key={f} style={{display:"flex",alignItems:"center",gap:6,marginBottom:5}}>
          <div style={{fontSize:9,color:"#4a6a7a",flex:1}}>{l}</div>
          <input type="number" step="any" min={0} value={prices[f]} onChange={e=>setPrices(p=>({...p,[f]:parseFloat(e.target.value)||0}))} style={{width:72,padding:"3px 6px",background:"#080c18",border:"1px solid #2a3a5a",borderRadius:4,color:"#f0c040",fontSize:11,outline:"none",textAlign:"right"}}/>
          <span style={{fontSize:9,color:"#3a5a7a",width:24,flexShrink:0}}>{s}</span>
        </div>
      ))}
      {panels.length===0?<div style={{margin:"10px 0",padding:10,background:"#0e1420",border:"1px solid #2a3a4a",borderRadius:6,fontSize:11,color:"#4a6070",textAlign:"center"}}>Adicione peças para gerar o plano de corte</div>:(
        <>
          <div style={{height:1,background:"#1a2a3a",margin:"12px 0"}}/>
          <div style={{fontSize:Math.round(10*sf),fontWeight:700,color:"#4a7aaa",letterSpacing:1.5,textTransform:"uppercase",marginBottom:8}}>Lista de Corte ({panels.length})</div>
          <div style={{maxHeight:200,overflowY:"auto",marginBottom:10}}>
            {panels.map((p,i)=>(
              <div key={p.id} style={{padding:"4px 6px",borderRadius:3,marginBottom:2,background:i%2===0?"#0a0e18":"#080c14",borderLeft:"2px solid #2a4a6a"}}>
                <div style={{fontSize:9,color:"#90b0d0",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",fontWeight:500}}>{i+1}. {p.label}</div>
                <div style={{fontSize:9,color:"#5a8a6a",fontFamily:"monospace"}}>{p.w}×{p.h}×{p.d}mm · {p.mat.split(" ").slice(0,3).join(" ")}</div>
              </div>
            ))}
          </div>
          <div style={{background:"#070d18",borderRadius:6,padding:10,border:"1px solid #1a2a3a",marginBottom:10}}>
            <div style={{display:"flex",justifyContent:"space-between",marginBottom:3}}><span style={{fontSize:9,color:"#506070"}}>Área total:</span><span style={{fontSize:9,color:"#a0c0e0",fontFamily:"monospace"}}>{totalM2.toFixed(3)} m²</span></div>
            <div style={{display:"flex",justifyContent:"space-between",marginBottom:3}}><span style={{fontSize:9,color:"#506070"}}>Fita de borda:</span><span style={{fontSize:9,color:"#a0c0e0",fontFamily:"monospace"}}>{totalPerim.toFixed(2)} m</span></div>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",background:"#0e1828",borderRadius:5,padding:"8px 10px",border:"1px solid #2a3a5a"}}>
              <div><div style={{fontSize:9,color:"#608090"}}>Chapas {CW}×{CH}mm</div></div>
              <div style={{fontSize:22,fontWeight:800,color:"#f0c040",fontFamily:"monospace"}}>{chapas}</div>
            </div>
          </div>
          {[["Material MDF",matCost],["Fita de borda",fitaCost],["Corte / Serra",srrCost],...(prices.moObraM2>0?[["Mão de obra",moCost]]:[])].map(([lbl,val])=>(
            <div key={lbl} style={{display:"flex",justifyContent:"space-between",padding:"3px 0",borderBottom:"1px solid #0e1828"}}>
              <span style={{fontSize:10,color:"#607080"}}>{lbl}</span>
              <span style={{fontSize:10,color:"#80c080",fontFamily:"monospace"}}>R$ {val.toFixed(2)}</span>
            </div>
          ))}
          <div style={{display:"flex",justifyContent:"space-between",marginTop:8,padding:"6px 8px",background:"#0e1828",borderRadius:5,border:"1px solid #2a3a2a",marginBottom:10}}>
            <span style={{fontSize:12,color:"#c8a060",fontWeight:700}}>TOTAL</span>
            <span style={{fontSize:14,color:"#f0c040",fontWeight:800,fontFamily:"monospace"}}>R$ {total.toFixed(2)}</span>
          </div>
          <div onClick={exportTxt} style={{padding:11,borderRadius:7,cursor:"pointer",textAlign:"center",background:"linear-gradient(135deg,#112211,#0a1a0a)",border:"2px solid #2a8a3a",userSelect:"none"}}>
            <div style={{fontSize:18,marginBottom:3}}>📄</div>
            <div style={{fontSize:11,fontWeight:700,color:"#60d070"}}>Exportar .txt</div>
          </div>
        </>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// MOUNT
// ═══════════════════════════════════════════════════════════════════

// ═══════════════════════════════════════════════════════════════════
// CONSTRUTORES DE FERRAGEM 3D — Catálogo Profissional
// ═══════════════════════════════════════════════════════════════════
const _fMetal  = () => new THREE.MeshStandardMaterial({color:0xd8d8dc,roughness:0.12,metalness:0.92,side:THREE.DoubleSide});
const _fChrome = () => new THREE.MeshStandardMaterial({color:0xf0f0f4,roughness:0.04,metalness:0.99});
const _fDark   = () => new THREE.MeshStandardMaterial({color:0x383840,roughness:0.35,metalness:0.75});
const _fBrass  = () => new THREE.MeshStandardMaterial({color:0xc8a040,roughness:0.25,metalness:0.80});
const _fBlack  = () => new THREE.MeshStandardMaterial({color:0x181820,roughness:0.4,metalness:0.7});
const _fGold   = () => new THREE.MeshStandardMaterial({color:0xe8c060,roughness:0.15,metalness:0.92});
const _fNickel = () => new THREE.MeshStandardMaterial({color:0xe4e4e0,roughness:0.08,metalness:0.94});
const _fRose   = () => new THREE.MeshStandardMaterial({color:0xc87060,roughness:0.15,metalness:0.88});

// ── DOBRADIÇAS ──────────────────────────────────────────────────────
function makeDobradicaCaneco35() {
  const g=new THREE.Group();g.userData.ferLabel="Dobradiça Caneco 35mm";
  const cup=new THREE.Mesh(new THREE.CylinderGeometry(0.0175,0.0175,0.013,20),_fMetal()); cup.rotation.x=Math.PI/2; g.add(cup);
  const arm=new THREE.Mesh(new THREE.BoxGeometry(0.065,0.008,0.008),_fMetal()); arm.position.set(0.033,0,0.008); g.add(arm);
  const pivot=new THREE.Mesh(new THREE.CylinderGeometry(0.004,0.004,0.024,10),_fChrome()); pivot.rotation.z=Math.PI/2; pivot.position.set(0.002,0,0.006); g.add(pivot);
  for(const sx of[-0.012,0.012]){const s=new THREE.Mesh(new THREE.CylinderGeometry(0.003,0.003,0.004,8),_fDark());s.rotation.x=Math.PI/2;s.position.set(sx,0,-0.007);g.add(s);}
  return g;
}
function makeDobradicaCaneco26() {
  const g=new THREE.Group();g.userData.ferLabel="Dobradiça Caneco 26mm";
  const cup=new THREE.Mesh(new THREE.CylinderGeometry(0.013,0.013,0.010,16),_fMetal()); cup.rotation.x=Math.PI/2; g.add(cup);
  const arm=new THREE.Mesh(new THREE.BoxGeometry(0.050,0.006,0.006),_fMetal()); arm.position.set(0.025,0,0.006); g.add(arm);
  const pivot=new THREE.Mesh(new THREE.CylinderGeometry(0.003,0.003,0.018,10),_fChrome()); pivot.rotation.z=Math.PI/2; pivot.position.set(0.002,0,0.004); g.add(pivot);
  return g;
}
function makeDobradicaAmortecida() {
  const g=new THREE.Group();g.userData.ferLabel="Dobradiça com Amortecedor";
  const cup=new THREE.Mesh(new THREE.CylinderGeometry(0.0175,0.0175,0.013,20),_fNickel()); cup.rotation.x=Math.PI/2; g.add(cup);
  const arm=new THREE.Mesh(new THREE.BoxGeometry(0.065,0.008,0.008),_fNickel()); arm.position.set(0.033,0,0.008); g.add(arm);
  const damper=new THREE.Mesh(new THREE.CylinderGeometry(0.006,0.006,0.030,12),new THREE.MeshStandardMaterial({color:0xff8800,roughness:0.5,metalness:0.2})); damper.rotation.x=Math.PI/2; damper.position.set(-0.002,0,0.010); g.add(damper);
  const pivot=new THREE.Mesh(new THREE.CylinderGeometry(0.004,0.004,0.024,10),_fChrome()); pivot.rotation.z=Math.PI/2; pivot.position.set(0.002,0,0.006); g.add(pivot);
  return g;
}
function makeDobradicaPiano() {
  const g=new THREE.Group();g.userData.ferLabel="Dobradiça Piano";
  const m=_fMetal();
  const p1=new THREE.Mesh(new THREE.BoxGeometry(0.040,0.080,0.003),m); p1.position.x=-0.020; g.add(p1);
  const p2=new THREE.Mesh(new THREE.BoxGeometry(0.040,0.080,0.003),m); p2.position.x=0.020; g.add(p2);
  const pin=new THREE.Mesh(new THREE.CylinderGeometry(0.0025,0.0025,0.086,8),_fDark()); pin.rotation.z=Math.PI/2; g.add(pin);
  for(let i=-3;i<=3;i++){const k=new THREE.Mesh(new THREE.BoxGeometry(0.006,0.004,0.006),_fDark());k.position.set(0,i*0.011,0);g.add(k);}
  return g;
}
function makeDobradicaAngular165() {
  const g=new THREE.Group();g.userData.ferLabel="Dobradiça Angular 165°";
  const cup=new THREE.Mesh(new THREE.CylinderGeometry(0.0175,0.0175,0.013,20),_fChrome()); cup.rotation.x=Math.PI/2; g.add(cup);
  const arm1=new THREE.Mesh(new THREE.BoxGeometry(0.040,0.008,0.006),_fChrome()); arm1.position.set(0.021,0,0.008); g.add(arm1);
  const arm2=new THREE.Mesh(new THREE.BoxGeometry(0.035,0.006,0.006),_fChrome()); arm2.rotation.y=Math.PI*0.28; arm2.position.set(0.060,0,-0.002); g.add(arm2);
  return g;
}
function makeDobradicaInvisivel() {
  const g=new THREE.Group();g.userData.ferLabel="Dobradiça Invisível";
  const plate=new THREE.Mesh(new THREE.BoxGeometry(0.060,0.040,0.004),_fMetal()); g.add(plate);
  const mech=new THREE.Mesh(new THREE.BoxGeometry(0.030,0.020,0.018),_fDark()); mech.position.set(0.010,0,0.011); g.add(mech);
  const pin=new THREE.Mesh(new THREE.CylinderGeometry(0.003,0.003,0.022,8),_fChrome()); pin.rotation.x=Math.PI/2; pin.position.set(0.010,0,0.022); g.add(pin);
  return g;
}

// ── CORREDIÇAS ──────────────────────────────────────────────────────
function makeCorredica350() {
  const g=new THREE.Group();g.userData.ferLabel="Corrediça Telescópica 350mm";
  const outer=new THREE.Mesh(new THREE.BoxGeometry(0.350,0.017,0.009),_fMetal()); outer.position.x=0.175; g.add(outer);
  const inner=new THREE.Mesh(new THREE.BoxGeometry(0.320,0.012,0.007),_fChrome()); inner.position.set(0.160,0,0.006); g.add(inner);
  const stop=new THREE.Mesh(new THREE.BoxGeometry(0.009,0.019,0.011),_fDark()); stop.position.set(0.344,0,0); g.add(stop);
  for(let i=0;i<4;i++){const r=new THREE.Mesh(new THREE.SphereGeometry(0.005,8,6),_fDark());r.position.set(0.050+i*0.080,0,0.008);g.add(r);}
  return g;
}
function makeCorredica450() {
  const g=new THREE.Group();g.userData.ferLabel="Corrediça Telescópica 450mm";
  const outer=new THREE.Mesh(new THREE.BoxGeometry(0.450,0.017,0.009),_fMetal()); outer.position.x=0.225; g.add(outer);
  const inner=new THREE.Mesh(new THREE.BoxGeometry(0.420,0.012,0.007),_fChrome()); inner.position.set(0.210,0,0.006); g.add(inner);
  const stop=new THREE.Mesh(new THREE.BoxGeometry(0.009,0.019,0.011),_fDark()); stop.position.set(0.444,0,0); g.add(stop);
  for(let i=0;i<5;i++){const r=new THREE.Mesh(new THREE.SphereGeometry(0.005,8,6),_fDark());r.position.set(0.060+i*0.080,0,0.008);g.add(r);}
  return g;
}
function makeCorredica550() {
  const g=new THREE.Group();g.userData.ferLabel="Corrediça Telescópica 550mm";
  const outer=new THREE.Mesh(new THREE.BoxGeometry(0.550,0.017,0.009),_fMetal()); outer.position.x=0.275; g.add(outer);
  const inner=new THREE.Mesh(new THREE.BoxGeometry(0.520,0.012,0.007),_fChrome()); inner.position.set(0.260,0,0.006); g.add(inner);
  for(let i=0;i<6;i++){const r=new THREE.Mesh(new THREE.SphereGeometry(0.005,8,6),_fDark());r.position.set(0.050+i*0.090,0,0.008);g.add(r);}
  return g;
}
function makeCorredica_SoftClose() {
  const g=new THREE.Group();g.userData.ferLabel="Corrediça Soft-Close 450mm";
  const outer=new THREE.Mesh(new THREE.BoxGeometry(0.450,0.018,0.010),_fNickel()); outer.position.x=0.225; g.add(outer);
  const inner=new THREE.Mesh(new THREE.BoxGeometry(0.420,0.013,0.008),_fChrome()); inner.position.set(0.210,0,0.007); g.add(inner);
  const sc=new THREE.Mesh(new THREE.BoxGeometry(0.040,0.016,0.012),new THREE.MeshStandardMaterial({color:0xff6600,roughness:0.4,metalness:0.3})); sc.position.set(0.020,0,0.005); g.add(sc);
  for(let i=0;i<5;i++){const r=new THREE.Mesh(new THREE.SphereGeometry(0.005,8,6),_fDark());r.position.set(0.060+i*0.080,0,0.009);g.add(r);}
  return g;
}
function makeCorredica_Oculta() {
  const g=new THREE.Group();g.userData.ferLabel="Corrediça Oculta/Undermount";
  const body=new THREE.Mesh(new THREE.BoxGeometry(0.500,0.014,0.024),_fDark()); body.position.x=0.250; g.add(body);
  const rail=new THREE.Mesh(new THREE.BoxGeometry(0.470,0.006,0.020),_fChrome()); rail.position.set(0.235,0,0.002); g.add(rail);
  const clip=new THREE.Mesh(new THREE.BoxGeometry(0.020,0.014,0.028),new THREE.MeshStandardMaterial({color:0x404048,roughness:0.3,metalness:0.8})); clip.position.set(0.488,0,0.002); g.add(clip);
  return g;
}

// ── PUXADORES ───────────────────────────────────────────────────────
function makePuxadorCilindrico(w=0.128) {
  const g=new THREE.Group();g.userData.ferLabel=`Puxador Cilíndrico ${Math.round(w*1000)}mm`;
  const bar=new THREE.Mesh(new THREE.CylinderGeometry(0.007,0.007,w,14),_fChrome()); bar.rotation.z=Math.PI/2; g.add(bar);
  const lh=0.030;
  for(const sx of[-w/2,w/2]){
    const leg=new THREE.Mesh(new THREE.CylinderGeometry(0.005,0.005,lh,10),_fMetal()); leg.rotation.x=Math.PI/2; leg.position.set(sx,0,-lh/2); g.add(leg);
    const ros=new THREE.Mesh(new THREE.CylinderGeometry(0.010,0.010,0.005,12),_fDark()); ros.rotation.x=Math.PI/2; ros.position.set(sx,0,-(lh+0.001)); g.add(ros);
  }
  return g;
}
function makePuxadorCilindrico128() { return makePuxadorCilindrico(0.128); }
function makePuxadorCilindrico192() { return makePuxadorCilindrico(0.192); }
function makePuxadorCilindrico256() { return makePuxadorCilindrico(0.256); }
function makePuxadorCilindrico320() { return makePuxadorCilindrico(0.320); }

function makePuxadorQuadrado(w=0.128) {
  const g=new THREE.Group();g.userData.ferLabel=`Puxador Quadrado ${Math.round(w*1000)}mm`;
  const bar=new THREE.Mesh(new THREE.BoxGeometry(w,0.012,0.012),_fChrome()); g.add(bar);
  const lh=0.030;
  for(const sx of[-w/2,w/2]){
    const leg=new THREE.Mesh(new THREE.BoxGeometry(0.012,0.012,lh),_fMetal()); leg.position.set(sx,0,-lh/2); g.add(leg);
    const ros=new THREE.Mesh(new THREE.BoxGeometry(0.018,0.018,0.005),_fDark()); ros.position.set(sx,0,-(lh+0.001)); g.add(ros);
  }
  return g;
}
function makePuxadorQuadrado128() { return makePuxadorQuadrado(0.128); }
function makePuxadorQuadrado192() { return makePuxadorQuadrado(0.192); }
function makePuxadorQuadrado256() { return makePuxadorQuadrado(0.256); }

function makePuxadorRecesso(w=0.120) {
  const g=new THREE.Group();g.userData.ferLabel=`Puxador Recesso ${Math.round(w*1000)}mm`;
  const base=new THREE.Mesh(new THREE.BoxGeometry(w,0.035,0.007),_fDark()); g.add(base);
  const groove=new THREE.Mesh(new THREE.BoxGeometry(w*0.82,0.014,0.010),new THREE.MeshStandardMaterial({color:0x111118,roughness:0.9})); groove.position.z=0.008; g.add(groove);
  return g;
}
function makePuxadorRecesso120() { return makePuxadorRecesso(0.120); }
function makePuxadorRecesso160() { return makePuxadorRecesso(0.160); }

function makePuxadorGota(h=0.160) {
  const g=new THREE.Group();g.userData.ferLabel=`Puxador Gota ${Math.round(h*1000)}mm`;
  const bar=new THREE.Mesh(new THREE.CylinderGeometry(0.005,0.005,h,12),_fChrome()); g.add(bar);
  for(const sy of[-h/2,h/2]){
    const kn=new THREE.Mesh(new THREE.SphereGeometry(0.010,12,10),_fChrome()); kn.position.y=sy; g.add(kn);
    const leg=new THREE.Mesh(new THREE.CylinderGeometry(0.005,0.005,0.026,10),_fMetal()); leg.rotation.x=Math.PI/2; leg.position.set(0,sy,-0.013); g.add(leg);
    const ros=new THREE.Mesh(new THREE.CylinderGeometry(0.009,0.009,0.004,12),_fDark()); ros.rotation.x=Math.PI/2; ros.position.set(0,sy,-0.027); g.add(ros);
  }
  return g;
}
function makePuxadorGota128() { return makePuxadorGota(0.128); }
function makePuxadorGota192() { return makePuxadorGota(0.192); }

function makePuxadorConcha() {
  const g=new THREE.Group();g.userData.ferLabel="Puxador Concha Embutir";
  const plate=new THREE.Mesh(new THREE.BoxGeometry(0.100,0.050,0.005),_fMetal()); g.add(plate);
  const bowl=new THREE.Mesh(new THREE.CylinderGeometry(0.028,0.028,0.018,14,1,false,0,Math.PI),_fMetal()); bowl.rotation.x=Math.PI/2; bowl.position.set(0,0.005,0.014); g.add(bowl);
  return g;
}
function makePuxadorPerfil(w=0.600) {
  const g=new THREE.Group();g.userData.ferLabel=`Perfil Puxador Alu ${Math.round(w*100)}cm`;
  const back=new THREE.Mesh(new THREE.BoxGeometry(w,0.040,0.006),_fDark()); g.add(back);
  const ledge=new THREE.Mesh(new THREE.BoxGeometry(w,0.012,0.020),_fChrome()); ledge.position.set(0,-0.014,0.013); g.add(ledge);
  return g;
}
function makePuxadorPerfil600() { return makePuxadorPerfil(0.600); }
function makePuxadorPerfil900() { return makePuxadorPerfil(0.900); }

function makePuxadorBoceta() {
  const g=new THREE.Group();g.userData.ferLabel="Puxador Boceta / Botão";
  const base=new THREE.Mesh(new THREE.CylinderGeometry(0.016,0.016,0.006,14),_fChrome()); base.rotation.x=Math.PI/2; g.add(base);
  const knob=new THREE.Mesh(new THREE.SphereGeometry(0.012,14,10),_fChrome()); knob.position.z=0.016; g.add(knob);
  const screw=new THREE.Mesh(new THREE.CylinderGeometry(0.003,0.003,0.020,8),_fDark()); screw.rotation.x=Math.PI/2; screw.position.z=-0.010; g.add(screw);
  return g;
}
function makePuxadorGoldQuad(w=0.128) {
  const g=new THREE.Group();g.userData.ferLabel=`Puxador Gold ${Math.round(w*1000)}mm`;
  const bar=new THREE.Mesh(new THREE.BoxGeometry(w,0.014,0.014),_fGold()); g.add(bar);
  const lh=0.028;
  for(const sx of[-w/2,w/2]){
    const leg=new THREE.Mesh(new THREE.BoxGeometry(0.014,0.014,lh),_fGold()); leg.position.set(sx,0,-lh/2); g.add(leg);
    const ros=new THREE.Mesh(new THREE.CylinderGeometry(0.008,0.008,0.005,12),_fDark()); ros.rotation.x=Math.PI/2; ros.position.set(sx,0,-(lh+0.001)); g.add(ros);
  }
  return g;
}
function makePuxadorRoseGold(w=0.128) {
  const g=new THREE.Group();g.userData.ferLabel=`Puxador Rose Gold ${Math.round(w*1000)}mm`;
  const bar=new THREE.Mesh(new THREE.CylinderGeometry(0.007,0.007,w,14),_fRose()); bar.rotation.z=Math.PI/2; g.add(bar);
  const lh=0.030;
  for(const sx of[-w/2,w/2]){
    const leg=new THREE.Mesh(new THREE.CylinderGeometry(0.005,0.005,lh,10),_fRose()); leg.rotation.x=Math.PI/2; leg.position.set(sx,0,-lh/2); g.add(leg);
    const ros=new THREE.Mesh(new THREE.CylinderGeometry(0.010,0.010,0.005,12),_fDark()); ros.rotation.x=Math.PI/2; ros.position.set(sx,0,-(lh+0.001)); g.add(ros);
  }
  return g;
}
function makePuxadorPreto(w=0.128) {
  const g=new THREE.Group();g.userData.ferLabel=`Puxador Preto Fosco ${Math.round(w*1000)}mm`;
  const bar=new THREE.Mesh(new THREE.CylinderGeometry(0.007,0.007,w,14),_fBlack()); bar.rotation.z=Math.PI/2; g.add(bar);
  const lh=0.030;
  for(const sx of[-w/2,w/2]){
    const leg=new THREE.Mesh(new THREE.CylinderGeometry(0.005,0.005,lh,10),_fBlack()); leg.rotation.x=Math.PI/2; leg.position.set(sx,0,-lh/2); g.add(leg);
    const ros=new THREE.Mesh(new THREE.CylinderGeometry(0.010,0.010,0.005,12),_fBlack()); ros.rotation.x=Math.PI/2; ros.position.set(sx,0,-(lh+0.001)); g.add(ros);
  }
  return g;
}

// ── FECHADURAS & TRAVAS ─────────────────────────────────────────────
function makeFechadura() {
  const g=new THREE.Group();g.userData.ferLabel="Fechadura Cilíndrica";
  const body=new THREE.Mesh(new THREE.BoxGeometry(0.026,0.062,0.018),_fDark()); g.add(body);
  const face=new THREE.Mesh(new THREE.BoxGeometry(0.020,0.055,0.004),_fMetal()); face.position.z=0.011; g.add(face);
  const hole=new THREE.Mesh(new THREE.CylinderGeometry(0.006,0.006,0.005,12),new THREE.MeshStandardMaterial({color:0x080808})); hole.rotation.x=Math.PI/2; hole.position.set(0,0.008,0.014); g.add(hole);
  const bolt=new THREE.Mesh(new THREE.BoxGeometry(0.012,0.009,0.007),_fMetal()); bolt.position.set(0.018,-0.012,0); g.add(bolt);
  return g;
}
function makeFechoMagnetico() {
  const g=new THREE.Group();g.userData.ferLabel="Fecho Magnético";
  const body=new THREE.Mesh(new THREE.BoxGeometry(0.028,0.018,0.010),_fMetal()); g.add(body);
  const mag=new THREE.Mesh(new THREE.CylinderGeometry(0.007,0.007,0.008,12),new THREE.MeshStandardMaterial({color:0x606090,roughness:0.3,metalness:0.6})); mag.rotation.x=Math.PI/2; mag.position.z=0.005; g.add(mag);
  return g;
}
function makeFechoPush() {
  const g=new THREE.Group();g.userData.ferLabel="Fecho Push (Touch Latch)";
  const body=new THREE.Mesh(new THREE.CylinderGeometry(0.014,0.014,0.030,14),_fDark()); body.rotation.x=Math.PI/2; g.add(body);
  const tip=new THREE.Mesh(new THREE.SphereGeometry(0.007,10,8),_fMetal()); tip.position.z=0.018; g.add(tip);
  return g;
}
function makeTravaCorredia() {
  const g=new THREE.Group();g.userData.ferLabel="Trava para Corrediça";
  const body=new THREE.Mesh(new THREE.BoxGeometry(0.040,0.020,0.012),_fMetal()); g.add(body);
  const lever=new THREE.Mesh(new THREE.BoxGeometry(0.018,0.008,0.022),_fChrome()); lever.position.set(0.008,0,0.010); g.add(lever);
  return g;
}

// ── PÉS & NIVELADORES ───────────────────────────────────────────────
function makePeRegulavel80() {
  const g=new THREE.Group();g.userData.ferLabel="Pé Regulável 80mm";
  const base=new THREE.Mesh(new THREE.CylinderGeometry(0.024,0.028,0.009,16),_fDark()); base.position.y=-0.040+0.004; g.add(base);
  const stem=new THREE.Mesh(new THREE.CylinderGeometry(0.009,0.009,0.080,12),_fMetal()); g.add(stem);
  const nut=new THREE.Mesh(new THREE.CylinderGeometry(0.014,0.014,0.012,6),_fMetal()); nut.position.y=0.080*0.25; g.add(nut);
  const cap=new THREE.Mesh(new THREE.CylinderGeometry(0.016,0.016,0.014,12),_fDark()); cap.position.y=0.046; g.add(cap);
  return g;
}
function makePeRegulavel100() {
  const g=new THREE.Group();g.userData.ferLabel="Pé Regulável 100mm";
  const base=new THREE.Mesh(new THREE.CylinderGeometry(0.024,0.028,0.009,16),_fDark()); base.position.y=-0.050+0.004; g.add(base);
  const stem=new THREE.Mesh(new THREE.CylinderGeometry(0.009,0.009,0.100,12),_fMetal()); g.add(stem);
  const nut=new THREE.Mesh(new THREE.CylinderGeometry(0.014,0.014,0.012,6),_fMetal()); nut.position.y=0.100*0.25; g.add(nut);
  const cap=new THREE.Mesh(new THREE.CylinderGeometry(0.016,0.016,0.014,12),_fDark()); cap.position.y=0.056; g.add(cap);
  return g;
}
function makePeRegulavel150() {
  const g=new THREE.Group();g.userData.ferLabel="Pé Regulável 150mm";
  const base=new THREE.Mesh(new THREE.CylinderGeometry(0.026,0.030,0.010,16),_fDark()); base.position.y=-0.075+0.005; g.add(base);
  const stem=new THREE.Mesh(new THREE.CylinderGeometry(0.010,0.010,0.150,12),_fMetal()); g.add(stem);
  const nut=new THREE.Mesh(new THREE.CylinderGeometry(0.016,0.016,0.014,6),_fMetal()); nut.position.y=0.150*0.30; g.add(nut);
  const cap=new THREE.Mesh(new THREE.CylinderGeometry(0.018,0.018,0.015,12),_fDark()); cap.position.y=0.081; g.add(cap);
  return g;
}
function makePeQuadradoAco() {
  const g=new THREE.Group();g.userData.ferLabel="Pé Quadrado Aço 100mm";
  const leg=new THREE.Mesh(new THREE.BoxGeometry(0.040,0.100,0.040),_fMetal()); g.add(leg);
  const cap=new THREE.Mesh(new THREE.CylinderGeometry(0.018,0.018,0.008,4),_fDark()); cap.rotation.y=Math.PI/4; cap.position.y=-0.054; g.add(cap);
  const top=new THREE.Mesh(new THREE.BoxGeometry(0.060,0.006,0.060),_fMetal()); top.position.y=0.053; g.add(top);
  return g;
}
function makeRodizio() {
  const g=new THREE.Group();g.userData.ferLabel="Rodízio com Freio";
  const plate=new THREE.Mesh(new THREE.BoxGeometry(0.050,0.008,0.050),_fMetal()); plate.position.y=0.040; g.add(plate);
  const stem=new THREE.Mesh(new THREE.CylinderGeometry(0.006,0.006,0.040,10),_fMetal()); g.add(stem);
  const wheel=new THREE.Mesh(new THREE.CylinderGeometry(0.020,0.020,0.014,16),_fDark()); wheel.rotation.z=Math.PI/2; wheel.position.y=-0.030; g.add(wheel);
  const axle=new THREE.Mesh(new THREE.CylinderGeometry(0.003,0.003,0.028,8),_fMetal()); axle.rotation.z=Math.PI/2; axle.position.y=-0.030; g.add(axle);
  const brake=new THREE.Mesh(new THREE.BoxGeometry(0.014,0.008,0.022),new THREE.MeshStandardMaterial({color:0xff4400,roughness:0.5})); brake.position.set(0.022,-0.024,0); g.add(brake);
  return g;
}

// ── SUPORTES & CREMALHEIRAS ─────────────────────────────────────────
function makeSuportePrateleira() {
  const g=new THREE.Group();g.userData.ferLabel="Suporte Prateleira";
  const peg=new THREE.Mesh(new THREE.CylinderGeometry(0.004,0.004,0.018,10),_fMetal()); peg.rotation.z=Math.PI/2; g.add(peg);
  const shelf=new THREE.Mesh(new THREE.BoxGeometry(0.022,0.006,0.016),_fMetal()); shelf.position.set(0.013,0.007,0); g.add(shelf);
  return g;
}
function makeCremalheiraVertical() {
  const g=new THREE.Group();g.userData.ferLabel="Cremalheira Vertical 400mm";
  const rail=new THREE.Mesh(new THREE.BoxGeometry(0.018,0.400,0.007),_fMetal()); rail.position.y=0.200; g.add(rail);
  const nd=18;
  for(let i=0;i<nd;i++){const d=new THREE.Mesh(new THREE.BoxGeometry(0.009,0.005,0.005),_fDark()); d.position.set(0.014,0.018+i*0.022,0.003); g.add(d);}
  return g;
}
function makeCremalheiraHorizontal() {
  const g=new THREE.Group();g.userData.ferLabel="Cremalheira Horizontal 600mm";
  const rail=new THREE.Mesh(new THREE.BoxGeometry(0.600,0.018,0.007),_fMetal()); rail.position.x=0.300; g.add(rail);
  const nd=26;
  for(let i=0;i<nd;i++){const d=new THREE.Mesh(new THREE.BoxGeometry(0.005,0.009,0.005),_fDark()); d.position.set(0.015+i*0.022,0.014,0.003); g.add(d);}
  return g;
}

// ── PISTÕES A GÁS ───────────────────────────────────────────────────
function makePistaoGas(len=0.300) {
  const g=new THREE.Group();g.userData.ferLabel=`Pistão a Gás ${Math.round(len*1000)}mm`;
  const cyl=new THREE.Mesh(new THREE.CylinderGeometry(0.014,0.014,len*0.55,12),_fDark()); cyl.rotation.z=Math.PI/2; cyl.position.x=len*0.22; g.add(cyl);
  const rod=new THREE.Mesh(new THREE.CylinderGeometry(0.007,0.007,len*0.6,10),_fChrome()); rod.rotation.z=Math.PI/2; rod.position.x=len*0.56; g.add(rod);
  for(const x of[0,len-0.010]){
    const bracket=new THREE.Mesh(new THREE.BoxGeometry(0.016,0.024,0.010),_fMetal()); bracket.position.x=x; g.add(bracket);
    const pin=new THREE.Mesh(new THREE.CylinderGeometry(0.004,0.004,0.026,8),_fMetal()); pin.position.set(x,0,0); g.add(pin);
  }
  return g;
}
function makePistao300() { return makePistaoGas(0.300); }
function makePistao400() { return makePistaoGas(0.400); }

// ── SISTEMAS DE ABERTURA ────────────────────────────────────────────
function makeSistemaUp() {
  const g=new THREE.Group();g.userData.ferLabel="Sistema Cama Down/Up";
  const base=new THREE.Mesh(new THREE.BoxGeometry(0.030,0.080,0.020),_fDark()); g.add(base);
  const arm1=new THREE.Mesh(new THREE.BoxGeometry(0.200,0.008,0.008),_fMetal()); arm1.position.set(0.100,0.020,0); arm1.rotation.z=-0.4; g.add(arm1);
  const arm2=new THREE.Mesh(new THREE.BoxGeometry(0.150,0.008,0.008),_fMetal()); arm2.position.set(0.080,-0.020,0); arm2.rotation.z=0.3; g.add(arm2);
  const spring=new THREE.Mesh(new THREE.CylinderGeometry(0.010,0.010,0.080,8),new THREE.MeshStandardMaterial({color:0x8090a0,roughness:0.3,metalness:0.7})); spring.rotation.x=Math.PI/2; spring.position.set(0.060,0,0); g.add(spring);
  return g;
}
function makeSistemaFlip() {
  const g=new THREE.Group();g.userData.ferLabel="Articulador Flap-Up";
  const box=new THREE.Mesh(new THREE.BoxGeometry(0.050,0.040,0.025),_fDark()); g.add(box);
  const armL=new THREE.Mesh(new THREE.BoxGeometry(0.180,0.007,0.007),_fMetal()); armL.position.set(0.090,0.015,0); g.add(armL);
  const armR=new THREE.Mesh(new THREE.BoxGeometry(0.140,0.007,0.007),_fMetal()); armR.position.set(0.070,-0.010,0); g.add(armR);
  return g;
}

// ── ILUMINAÇÃO LED (integrada) ───────────────────────────────────────
function makePerfilLedLinear(len=0.600) {
  const g=new THREE.Group();g.userData.ferLabel=`Perfil LED Linear ${Math.round(len*100)}cm`;
  const body=new THREE.Mesh(new THREE.BoxGeometry(len,0.016,0.014),new THREE.MeshStandardMaterial({color:0xe0e0e0,roughness:0.3,metalness:0.6})); body.position.x=len/2; g.add(body);
  const led=new THREE.Mesh(new THREE.BoxGeometry(len*0.92,0.006,0.006),new THREE.MeshStandardMaterial({color:0xffffcc,emissive:0xffffcc,emissiveIntensity:0.8,roughness:0.9})); led.position.set(len/2,-0.002,0); g.add(led);
  const diff=new THREE.Mesh(new THREE.BoxGeometry(len,0.004,0.014),new THREE.MeshStandardMaterial({color:0xffffff,transparent:true,opacity:0.5})); diff.position.set(len/2,0.008,0); g.add(diff);
  return g;
}
function makePerfilLed600() { return makePerfilLedLinear(0.600); }
function makePerfilLed900() { return makePerfilLedLinear(0.900); }

// ── ACESSÓRIOS INTERNOS ─────────────────────────────────────────────
function makeDivisorGaveta() {
  const g=new THREE.Group();g.userData.ferLabel="Divisor Gaveta Ajustável";
  const rail=new THREE.Mesh(new THREE.BoxGeometry(0.400,0.004,0.004),_fMetal()); g.add(rail);
  for(let i=0;i<3;i++){
    const div=new THREE.Mesh(new THREE.BoxGeometry(0.004,0.060,0.340),_fChrome()); div.position.set(-0.120+i*0.120,0.030,0); g.add(div);
  }
  return g;
}
function makeOrganizador() {
  const g=new THREE.Group();g.userData.ferLabel="Organizador para Gaveta";
  const base=new THREE.Mesh(new THREE.BoxGeometry(0.450,0.040,0.280),new THREE.MeshStandardMaterial({color:0xf5f0e8,roughness:0.8})); g.add(base);
  for(let c=0;c<3;c++) for(let r=0;r<2;r++){
    const wall=new THREE.Mesh(new THREE.BoxGeometry(0.002,0.038,0.130),new THREE.MeshStandardMaterial({color:0xe0dbd0,roughness:0.8})); wall.position.set(-0.145+c*0.145,0,-0.070+r*0.140); g.add(wall);
  }
  return g;
}
function makeTrilhoCorrer() {
  const g=new THREE.Group();g.userData.ferLabel="Sistema Porta de Correr";
  const trilho=new THREE.Mesh(new THREE.BoxGeometry(0.900,0.022,0.022),_fDark()); trilho.position.x=0.450; g.add(trilho);
  for(let i=0;i<3;i++){
    const roda=new THREE.Mesh(new THREE.CylinderGeometry(0.010,0.010,0.022,12),_fMetal()); roda.rotation.z=Math.PI/2; roda.position.set(0.150+i*0.250,0,0); g.add(roda);
  }
  const parador=new THREE.Mesh(new THREE.BoxGeometry(0.030,0.030,0.025),_fMetal()); parador.position.set(0.890,0,0); g.add(parador);
  return g;
}

// ── CATALOG COMPLETO ────────────────────────────────────────────────
const FERRAGENS_CAT = [
  // DOBRADIÇAS
  {id:"dob_caneco35",     group:"Dobradiças", label:"Caneco 35mm",        make:makeDobradicaCaneco35,   color:"#8090a0"},
  {id:"dob_caneco26",     group:"Dobradiças", label:"Caneco 26mm",        make:makeDobradicaCaneco26,   color:"#7080a0"},
  {id:"dob_amortecida",   group:"Dobradiças", label:"c/ Amortecedor",     make:makeDobradicaAmortecida, color:"#9080a0"},
  {id:"dob_piano",        group:"Dobradiças", label:"Piano",              make:makeDobradicaPiano,      color:"#a090b0"},
  {id:"dob_165",          group:"Dobradiças", label:"Angular 165°",       make:makeDobradicaAngular165, color:"#c0c0d0"},
  {id:"dob_invisivel",    group:"Dobradiças", label:"Invisível",          make:makeDobradicaInvisivel,  color:"#808090"},
  // CORREDIÇAS
  {id:"cor_350",          group:"Corrediças", label:"Telescópica 350mm",  make:makeCorredica350,        color:"#a0a8b0"},
  {id:"cor_450",          group:"Corrediças", label:"Telescópica 450mm",  make:makeCorredica450,        color:"#90a0b0"},
  {id:"cor_550",          group:"Corrediças", label:"Telescópica 550mm",  make:makeCorredica550,        color:"#80a0b8"},
  {id:"cor_sc",           group:"Corrediças", label:"Soft-Close 450mm",   make:makeCorredica_SoftClose, color:"#b0a070"},
  {id:"cor_oculta",       group:"Corrediças", label:"Oculta/Undermount",  make:makeCorredica_Oculta,    color:"#606070"},
  // PUXADORES - CROMADO
  {id:"pux_cil128",       group:"Puxadores",  label:"Cilíndrico 128mm",   make:makePuxadorCilindrico128,color:"#c8c8d0"},
  {id:"pux_cil192",       group:"Puxadores",  label:"Cilíndrico 192mm",   make:makePuxadorCilindrico192,color:"#c0c0ca"},
  {id:"pux_cil256",       group:"Puxadores",  label:"Cilíndrico 256mm",   make:makePuxadorCilindrico256,color:"#b8b8c8"},
  {id:"pux_cil320",       group:"Puxadores",  label:"Cilíndrico 320mm",   make:makePuxadorCilindrico320,color:"#b0b0c0"},
  {id:"pux_quad128",      group:"Puxadores",  label:"Quadrado 128mm",     make:makePuxadorQuadrado128,  color:"#c0c8d8"},
  {id:"pux_quad192",      group:"Puxadores",  label:"Quadrado 192mm",     make:makePuxadorQuadrado192,  color:"#b8c0d0"},
  {id:"pux_quad256",      group:"Puxadores",  label:"Quadrado 256mm",     make:makePuxadorQuadrado256,  color:"#b0b8c8"},
  {id:"pux_gota128",      group:"Puxadores",  label:"Gota 128mm",         make:makePuxadorGota128,      color:"#d0d0d8"},
  {id:"pux_gota192",      group:"Puxadores",  label:"Gota 192mm",         make:makePuxadorGota192,      color:"#c8c8d0"},
  {id:"pux_rec120",       group:"Puxadores",  label:"Recesso 120mm",      make:makePuxadorRecesso120,   color:"#505058"},
  {id:"pux_rec160",       group:"Puxadores",  label:"Recesso 160mm",      make:makePuxadorRecesso160,   color:"#484850"},
  {id:"pux_concha",       group:"Puxadores",  label:"Concha Embutir",     make:makePuxadorConcha,       color:"#909098"},
  {id:"pux_boceta",       group:"Puxadores",  label:"Boceta / Botão",     make:makePuxadorBoceta,       color:"#d8d8e0"},
  {id:"pux_perf600",      group:"Puxadores",  label:"Perfil Alu 600mm",   make:makePuxadorPerfil600,    color:"#404048"},
  {id:"pux_perf900",      group:"Puxadores",  label:"Perfil Alu 900mm",   make:makePuxadorPerfil900,    color:"#383840"},
  {id:"pux_preto128",     group:"Puxadores",  label:"Preto Fosco 128mm",  make:makePuxadorPreto,        color:"#202028"},
  {id:"pux_rose128",      group:"Puxadores",  label:"Rose Gold 128mm",    make:makePuxadorRoseGold,     color:"#c87060"},
  // FECHADURAS
  {id:"fec_cil",          group:"Fechaduras", label:"Cilíndrica",         make:makeFechadura,           color:"#303038"},
  {id:"fec_mag",          group:"Fechaduras", label:"Magnético",          make:makeFechoMagnetico,      color:"#505060"},
  {id:"fec_push",         group:"Fechaduras", label:"Push (Touch Latch)", make:makeFechoPush,           color:"#404050"},
  {id:"fec_trava_cor",    group:"Fechaduras", label:"Trava Corrediça",    make:makeTravaCorredia,       color:"#606070"},
  // PÉS & RODÍZIOS
  {id:"pe_80",            group:"Pés",        label:"Pé Regulável 80mm",  make:makePeRegulavel80,       color:"#707080"},
  {id:"pe_100",           group:"Pés",        label:"Pé Regulável 100mm", make:makePeRegulavel100,      color:"#686878"},
  {id:"pe_150",           group:"Pés",        label:"Pé Regulável 150mm", make:makePeRegulavel150,      color:"#606070"},
  {id:"pe_quad",          group:"Pés",        label:"Pé Quadrado Aço",    make:makePeQuadradoAco,       color:"#909090"},
  {id:"pe_roda",          group:"Pés",        label:"Rodízio c/ Freio",   make:makeRodizio,             color:"#585860"},
  // SUPORTES
  {id:"sup_prat",         group:"Suportes",   label:"Suporte Prateleira", make:makeSuportePrateleira,   color:"#a0a8b0"},
  {id:"sup_crem_v",       group:"Suportes",   label:"Cremalheira 400mm",  make:makeCremalheiraVertical, color:"#808890"},
  {id:"sup_crem_h",       group:"Suportes",   label:"Cremalheira H 600mm",make:makeCremalheiraHorizontal,color:"#787888"},
  // PISTÕES
  {id:"pis_300",          group:"Pistões",    label:"Pistão Gás 300mm",   make:makePistao300,           color:"#7080a0"},
  {id:"pis_400",          group:"Pistões",    label:"Pistão Gás 400mm",   make:makePistao400,           color:"#6878a0"},
  {id:"pis_up",           group:"Pistões",    label:"Sistema Up/Down",    make:makeSistemaUp,           color:"#8090a8"},
  {id:"pis_flip",         group:"Pistões",    label:"Articulador Flap",   make:makeSistemaFlip,         color:"#7888a0"},
  // SISTEMAS
  {id:"sis_correr",       group:"Sistemas",   label:"Porta de Correr",    make:makeTrilhoCorrer,        color:"#484850"},
  // ILUMINAÇÃO
  {id:"led_600",          group:"LED",        label:"Perfil LED 600mm",   make:makePerfilLed600,        color:"#f0f0c0"},
  {id:"led_900",          group:"LED",        label:"Perfil LED 900mm",   make:makePerfilLed900,        color:"#eeeed8"},
  // ACESSÓRIOS
  {id:"div_gaveta",       group:"Acessórios", label:"Divisor Gaveta",     make:makeDivisorGaveta,       color:"#d0c8b8"},
  {id:"org_gaveta",       group:"Acessórios", label:"Organizador Gaveta", make:makeOrganizador,         color:"#e0d8c8"},
];

const FERRAGENS_GROUPS = [...new Set(FERRAGENS_CAT.map(f=>f.group))];

// ═══════════════════════════════════════════════════════════════════
// ABA FERRAGEM
// ═══════════════════════════════════════════════════════════════════
function FerragemTab({ferList,setFerList,selFerId,setSelFerId,sceneRef,setStatus,rendRef,sf=1,piecesRef,selId}) {
  const [actFer, setActFer] = useState("pux_cil128");
  const [activeGroup, setActiveGroup] = useState("Puxadores");
  const [search, setSearch] = useState("");

  const getSelFer = () => sceneRef.current?.children.find(c=>c.uuid===selFerId) || null;

  const addFerragem = () => {
    const cat = FERRAGENS_CAT.find(f=>f.id===actFer);
    if(!cat) return;
    const scene = sceneRef.current;
    const fer = cat.make();
    fer.userData.isFerragem = true;
    fer.userData.ferLabel   = cat.label;
    fer.userData.ferCatId   = cat.id;

    const pieceObj = selId ? piecesRef.current.find(p=>p.userData.id===selId) : null;
    if(pieceObj) {
      const {d=0.04} = pieceObj.userData;
      fer.position.set(pieceObj.position.x, pieceObj.position.y, pieceObj.position.z+d/2+0.004);
    } else {
      fer.position.set((Math.random()-0.5)*0.5, 0.04, (Math.random()-0.5)*0.5);
    }
    scene.add(fer);
    setFerList(prev=>[...prev, {uuid:fer.uuid, label:cat.label, catId:cat.id, group:cat.group}]);
    setSelFerId(fer.uuid);
    rendRef._needsRender&&rendRef._needsRender();
    setStatus(`🔩 ${cat.label} inserida`);
  };

  const removeFer = (uuid) => {
    const scene = sceneRef.current;
    const obj = scene.children.find(c=>c.uuid===uuid);
    if(obj){obj.traverse(c=>{if(c.isMesh){c.geometry.dispose();c.material.dispose();}});scene.remove(obj);}
    setFerList(prev=>prev.filter(f=>f.uuid!==uuid));
    if(selFerId===uuid) setSelFerId(null);
    rendRef._needsRender&&rendRef._needsRender();
    setStatus("🗑 Ferragem removida");
  };

  const selFer = getSelFer();
  const getFerVals = () => selFer ? {
    px: Math.round(selFer.position.x*1000),
    py: Math.round(selFer.position.y*1000),
    pz: Math.round(selFer.position.z*1000),
    rx: Math.round(THREE.MathUtils.radToDeg(selFer.rotation.x)),
    ry: Math.round(THREE.MathUtils.radToDeg(selFer.rotation.y)),
    rz: Math.round(THREE.MathUtils.radToDeg(selFer.rotation.z)),
  } : null;

  const moveFer = (axis, mm) => {
    if(!selFer) return;
    selFer.position[axis] = parseFloat(mm)/1000;
    rendRef._needsRender&&rendRef._needsRender();
    setFerList(l=>[...l]);
  };
  const rotateFer = (axis, deg) => {
    if(!selFer) return;
    selFer.rotation[axis] = THREE.MathUtils.degToRad(parseFloat(deg)||0);
    rendRef._needsRender&&rendRef._needsRender();
    setFerList(l=>[...l]);
  };
  const snapFerToFace = (face) => {
    if(!selFer) return;
    const pieceObj = selId ? piecesRef.current.find(p=>p.userData.id===selId) : null;
    if(!pieceObj) { setStatus("⚠ Selecione uma peça primeiro"); return; }
    const {w=0.1,h=0.1,d=0.04} = pieceObj.userData;
    const px=pieceObj.position.x, py=pieceObj.position.y, pz=pieceObj.position.z;
    const fp = {
      frente: [px, py, pz+d/2+0.003, 0,0,0],
      tras:   [px, py, pz-d/2-0.003, 0,Math.PI,0],
      topo:   [px, py+h/2+0.003, pz, -Math.PI/2,0,0],
      base:   [px, py-h/2-0.003, pz, Math.PI/2,0,0],
      esq:    [px-w/2-0.003, py, pz, 0,-Math.PI/2,0],
      dir:    [px+w/2+0.003, py, pz, 0,Math.PI/2,0],
    };
    const f=fp[face]; if(!f)return;
    selFer.position.set(f[0],f[1],f[2]);
    selFer.rotation.set(f[3],f[4],f[5]);
    rendRef._needsRender&&rendRef._needsRender();
    setFerList(l=>[...l]);
    setStatus(`📐 Encaixado: face ${face}`);
  };

  const filteredCat = FERRAGENS_CAT.filter(f=> {
    const matchGroup = !search && f.group===activeGroup;
    const matchSearch = search && (f.label.toLowerCase().includes(search.toLowerCase()) || f.group.toLowerCase().includes(search.toLowerCase()));
    return matchGroup || matchSearch;
  });

  const fv = getFerVals();

  return (
    <div style={{flex:1,overflowY:"auto",display:"flex",flexDirection:"column"}}>
      {/* Search */}
      <div style={{padding:`${Math.round(8*sf)}px`,borderBottom:"1px solid #0e1020",position:"sticky",top:0,background:"#0e0e1c",zIndex:2}}>
        <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="🔍 Buscar ferragem..." style={{width:"100%",padding:"6px 10px",background:"#080e18",border:"1.5px solid #1a2a3a",borderRadius:6,color:"#a0c8e0",fontSize:11,boxSizing:"border-box",outline:"none"}}/>
      </div>

      {/* Group tabs */}
      {!search && (
        <div style={{display:"flex",flexWrap:"wrap",gap:3,padding:`${Math.round(6*sf)}px`,borderBottom:"1px solid #0e1020",background:"#090912"}}>
          {FERRAGENS_GROUPS.map(g=>{
            const active=activeGroup===g;
            return (
              <div key={g} onClick={()=>setActiveGroup(g)} style={{padding:`3px ${Math.round(7*sf)}px`,borderRadius:4,cursor:"pointer",background:active?"#0e2038":"#0b0b18",border:`1px solid ${active?"#3a6aaa":"#1a1a2a"}`,fontSize:Math.round(8.5*sf),color:active?"#80c0e0":"#3a5a6a",whiteSpace:"nowrap",transition:"all 0.12s"}}>{g}</div>
            );
          })}
        </div>
      )}

      {/* Catalog grid */}
      <div style={{padding:`${Math.round(8*sf)}px`,borderBottom:"1px solid #0e1020"}}>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:4,marginBottom:8,maxHeight:220,overflowY:"auto"}}>
          {filteredCat.map(f=>{
            const active=actFer===f.id;
            return (
              <div key={f.id} onClick={()=>setActFer(f.id)} style={{display:"flex",alignItems:"center",gap:5,padding:`${Math.round(5*sf)}px ${Math.round(7*sf)}px`,borderRadius:5,cursor:"pointer",background:active?"linear-gradient(135deg,#0e2038,#0a1828)":"#0b0b18",border:`1.5px solid ${active?"#3a7aaa":"#1a1a2a"}`,transition:"all 0.1s"}}>
                <div style={{width:10,height:10,borderRadius:2,flexShrink:0,background:f.color,border:"1px solid #2a3a4a"}}/>
                <div style={{fontSize:Math.round(9*sf),color:active?"#80c0e0":"#4a6a7a",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",lineHeight:1.2}}>{f.label}</div>
              </div>
            );
          })}
        </div>
        <div onClick={addFerragem} style={{display:"flex",alignItems:"center",justifyContent:"center",gap:7,padding:`${Math.round(8*sf)}px`,borderRadius:7,cursor:"pointer",background:"linear-gradient(135deg,#0e2a3a,#081828)",border:"1.5px solid #2a5a7a",userSelect:"none"}}>
          <span style={{fontSize:15}}>➕</span>
          <div style={{fontSize:Math.round(10*sf),fontWeight:700,color:"#6ab0e0"}}>Inserir {FERRAGENS_CAT.find(f=>f.id===actFer)?.label||"Ferragem"}</div>
        </div>
        {selId&&<div style={{fontSize:8,color:"#2a5a6a",textAlign:"center",marginTop:3}}>posicionada na face da peça selecionada</div>}
      </div>

      {/* Transform panel */}
      {selFer && fv && (
        <div style={{padding:`${Math.round(8*sf)}px`,borderBottom:"1px solid #0e1020",background:"#090916"}}>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:7}}>
            <div style={{fontSize:Math.round(9.5*sf),fontWeight:700,color:"#c8a060",letterSpacing:1,textTransform:"uppercase",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",flex:1}}>🔩 {ferList.find(f=>f.uuid===selFerId)?.label||"Ferragem"}</div>
            <div onClick={()=>removeFer(selFerId)} style={{fontSize:8,color:"#aa4444",cursor:"pointer",padding:"2px 6px",borderRadius:3,background:"#1a0a0a",border:"1px solid #5a2222",flexShrink:0,marginLeft:6}}>🗑</div>
          </div>

          {/* Snap faces */}
          <div style={{marginBottom:7}}>
            <div style={{fontSize:8,color:"#4a6a7a",letterSpacing:0.8,textTransform:"uppercase",marginBottom:4}}>📐 Face da peça selecionada</div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:3}}>
              {[["frente","Frente"],["tras","Trás"],["topo","Topo"],["base","Base"],["esq","Esq"],["dir","Dir"]].map(([face,lbl])=>(
                <div key={face} onClick={()=>snapFerToFace(face)} style={{padding:"4px 2px",borderRadius:3,textAlign:"center",cursor:selId?"pointer":"not-allowed",background:selId?"#0e1a28":"#080810",border:`1px solid ${selId?"#2a4a6a":"#141420"}`,opacity:selId?1:0.4}}>
                  <div style={{fontSize:Math.round(8.5*sf),color:selId?"#60a0c0":"#2a3a4a"}}>{lbl}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Position */}
          <div style={{marginBottom:7}}>
            <div style={{fontSize:8,color:"#4a6a7a",letterSpacing:0.8,textTransform:"uppercase",marginBottom:4}}>📍 Posição (mm)</div>
            {[["x","X","#dd5555"],["y","Y","#55dd55"],["z","Z","#5588ff"]].map(([ax,lb,col])=>(
              <div key={ax} style={{display:"flex",alignItems:"center",gap:4,marginBottom:3}}>
                <div style={{fontSize:9,color:col,width:10,fontWeight:700,flexShrink:0}}>{lb}</div>
                <div onClick={()=>moveFer(ax,(fv[`p${ax}`]-5))} style={{width:20,height:20,background:"#0a1020",border:`1px solid ${col}44`,borderRadius:3,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,color:col,flexShrink:0,userSelect:"none"}}>−</div>
                <input type="number" step={1} value={fv[`p${ax}`]} onChange={e=>moveFer(ax,e.target.value)} style={{flex:1,padding:"2px 4px",background:"#070c18",border:`1px solid ${col}44`,borderRadius:3,color:col,fontSize:10,outline:"none",textAlign:"center",minWidth:0}}/>
                <div onClick={()=>moveFer(ax,(fv[`p${ax}`]+5))} style={{width:20,height:20,background:"#0a1020",border:`1px solid ${col}44`,borderRadius:3,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,color:col,flexShrink:0,userSelect:"none"}}>+</div>
              </div>
            ))}
          </div>

          {/* Rotation */}
          <div>
            <div style={{fontSize:8,color:"#4a6a7a",letterSpacing:0.8,textTransform:"uppercase",marginBottom:4}}>🔄 Rotação</div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:4,marginBottom:5}}>
              {[["x","X","#dd5555"],["y","Y","#55dd55"],["z","Z","#5588ff"]].map(([ax,lb,col])=>(
                <div key={ax}>
                  <div style={{fontSize:8,color:col,textAlign:"center",fontWeight:700,marginBottom:2}}>{lb}</div>
                  <input type="number" step={5} min={-180} max={180} value={fv[`r${ax}`]} onChange={e=>rotateFer(ax,e.target.value)} style={{width:"100%",padding:"3px 2px",borderRadius:4,textAlign:"center",background:"#070c18",border:`1.5px solid ${col}44`,color:col,fontSize:10,outline:"none",fontWeight:700}}/>
                </div>
              ))}
            </div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:3}}>
              {[[0,"0°"],[90,"90°"],[180,"180°"],[-90,"-90°"]].map(([d,lbl])=>(
                <div key={d} onClick={()=>rotateFer('y',d)} style={{padding:"3px 2px",borderRadius:3,textAlign:"center",cursor:"pointer",background:fv.ry===d?"#1a2a4a":"#0a0a18",border:`1px solid ${fv.ry===d?"#3a5a8a":"#1a1a2a"}`,fontSize:8.5,color:fv.ry===d?"#80c0e0":"#3a5a6a"}}>{lbl}</div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* List */}
      {ferList.length > 0 && (
        <div style={{padding:`${Math.round(8*sf)}px`}}>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:5}}>
            <div style={{fontSize:Math.round(9.5*sf),fontWeight:700,color:"#4a7aaa",letterSpacing:1.5,textTransform:"uppercase"}}>Na Cena ({ferList.length})</div>
            <div onClick={()=>{
              const scene=sceneRef.current;
              scene.children.filter(c=>c.userData.isFerragem).forEach(o=>{o.traverse(c=>{if(c.isMesh){c.geometry.dispose();c.material.dispose();}});scene.remove(o);});
              setFerList([]);setSelFerId(null);rendRef._needsRender&&rendRef._needsRender();
              setStatus("🗑 Todas ferragens removidas");
            }} style={{fontSize:8,color:"#884444",cursor:"pointer",padding:"2px 6px",borderRadius:3,background:"#140a0a",border:"1px solid #3a1a1a"}}>Limpar</div>
          </div>
          <div style={{display:"flex",flexDirection:"column",gap:3}}>
            {ferList.map((f,i)=>{
              const active=selFerId===f.uuid;
              return (
                <div key={f.uuid} onClick={()=>setSelFerId(active?null:f.uuid)} style={{display:"flex",alignItems:"center",gap:5,padding:"5px 7px",borderRadius:4,cursor:"pointer",background:active?"#0e1e34":"#0a0a18",border:`1.5px solid ${active?"#3a6aaa":"#161628"}`,transition:"all 0.1s"}}>
                  <span style={{fontSize:10,color:"#3a5a6a",flexShrink:0,minWidth:40,textOverflow:"ellipsis",overflow:"hidden"}}>{f.group}</span>
                  <span style={{fontSize:Math.round(9*sf),color:active?"#80c0e0":"#4a6a7a",flex:1,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{f.label}</span>
                  <div onClick={e=>{e.stopPropagation();removeFer(f.uuid);}} style={{fontSize:10,color:"#7a3a3a",cursor:"pointer",padding:"1px 4px",borderRadius:2,background:"#1a0a0a",border:"1px solid #3a1a1a",flexShrink:0}}>✕</div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {ferList.length===0&&!selFer&&(
        <div style={{display:"flex",flexDirection:"column",alignItems:"center",padding:`${Math.round(20*sf)}px 16px`,gap:7,textAlign:"center"}}>
          <span style={{fontSize:26,opacity:0.2}}>🔩</span>
          <div style={{fontSize:9,color:"#2a4a5a",lineHeight:1.7}}>Selecione grupo → ferragem<br/>e clique Inserir<br/><span style={{color:"#1a3a4a"}}>Arraste na cena para mover</span></div>
        </div>
      )}
    </div>
  );
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);
</script>

</body>
</html>
