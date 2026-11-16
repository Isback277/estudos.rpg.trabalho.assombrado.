// Carteira de RPG Trabalhista — protótipo funcional com persistência local.
const $ = (s, root=document) => root.querySelector(s);
const $$ = (s, root=document) => [...root.querySelectorAll(s)];
const KEY = "carteira-rpg-v1";
const ATTRS = ["Físico","Carisma","Sabedoria","Presença","Sorte"];
const SKILLS = ["Atletismo","Combate","Furtividade","Investigação","Percepção","Persuasão","Sobrevivência","Ocultismo"];

let db = JSON.parse(localStorage.getItem(KEY) || '{"users":[],"campaigns":[],"characters":[],"creatures":[],"logs":[]}');
let currentUser = null, authMode = "login", page = "overview", currentCampaign = null;

function save(){ localStorage.setItem(KEY, JSON.stringify(db)); }
function id(){ return crypto.randomUUID ? crypto.randomUUID() : String(Date.now())+Math.random().toString(16).slice(2); }
function esc(s=""){return String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));}
function toast(msg){const t=$("#toast");t.textContent=msg;t.classList.add("show");setTimeout(()=>t.classList.remove("show"),2600);}
function userCampaigns(){return db.campaigns.filter(c=>c.owner===currentUser.id || c.members.includes(currentUser.id));}
function ownedCharacters(){return db.characters.filter(c=>c.owner===currentUser.id);}
function authMessage(m){$("#authMessage").textContent=m;}

function showApp(){ 
  $("#authView").classList.add("hidden");
  $("#appView").classList.remove("hidden");
  $("#userName").textContent=currentUser.name;
  $("#userEmail").textContent=currentUser.email;
  $("#userAvatar").textContent=(currentUser.name||"J")[0].toUpperCase();
  render(); 
}

function showAuth(){ 
  $("#appView").classList.add("hidden");
  $("#authView").classList.remove("hidden"); 
}

function setAuthMode(mode){
  authMode=mode;
  $$("[data-auth-tab]").forEach(b=>b.classList.toggle("active",b.dataset.authTab===mode));
  $("#nameWrap").classList.toggle("hidden",mode!=="signup");
  $("#authSubmit").textContent=mode==="signup"?"Criar minha conta":"Entrar";
  $("#password").autocomplete=mode==="signup"?"new-password":"current-password";
  authMessage("");
}

$$("[data-auth-tab]").forEach(b=>b.addEventListener("click",()=>setAuthMode(b.dataset.authTab)));

$("#authForm").addEventListener("submit",e=>{
  e.preventDefault();
  const email=$("#email").value.trim().toLowerCase(),password=$("#password").value,name=$("#displayName").value.trim()||email.split("@")[0];
  if(password.length<6)return authMessage("A senha precisa ter pelo menos 6 caracteres.");
  let u=db.users.find(x=>x.email===email);
  if(authMode==="signup"){
    if(u)return authMessage("Este e-mail já está cadastrado neste navegador.");
    u={id:id(),email,password,name};
    db.users.push(u);
    save();
  }else if(!u||u.password!==password)return authMessage("E-mail ou senha incorretos.");
  currentUser=u;
  save();
  showApp();
  const code=$("#inviteCodeAuth").value.trim().toUpperCase();
  if(code)joinCampaign(code);
});

$("#inviteCodeAuth").addEventListener("change",()=>{});
$("#signOutBtn").addEventListener("click",()=>{currentUser=null;showAuth();});
$("#profileBtn").addEventListener("click",()=>openModal("Perfil",`<p class="muted">Conta local de demonstração</p><label>Nome de exibição<input id="profileName" value="${esc(currentUser.name)}"></label><button class="primary" id="saveProfile">Salvar</button>`,()=>{ $("#saveProfile").onclick=()=>{currentUser.name=$("#profileName").value.trim()||currentUser.name;save();showApp();toast("Perfil atualizado.");};}));
$("#mainNav").addEventListener("click",e=>{const b=e.target.closest("[data-page]");if(!b)return;page=b.dataset.page;render();});
$("#modalClose").onclick=()=>$("#modal").close();

function openModal(title,html,after){
  $("#modalTitle").textContent=title;
  $("#modalBody").innerHTML=html;
  $("#modal").showModal();
  after?.();
}

function header(eyebrow,title){
  $("#pageEyebrow").textContent=eyebrow;
  $("#pageTitle").textContent=title;
}

function render(){ 
  $$(".nav-item[data-page]").forEach(b=>b.classList.toggle("active",b.dataset.page===page));
  ({overview:renderOverview,campaigns:renderCampaigns,characters:renderCharacters,creatures:renderCreatures,combat:renderCombat}[page]||renderOverview)(); 
}

function empty(msg){return `<div class="empty">${msg}</div>`;}

function renderOverview(){
  header("SEU ESPAÇO","Visão geral");
  const camps=userCampaigns(),chars=ownedCharacters(),creatures=db.creatures.filter(x=>x.owner===currentUser.id);
  $("#content").innerHTML=`
    <section class="welcome"><p class="eyebrow">BEM-VINDO À SUA MESA</p><h3>Suas histórias começam aqui.</h3><p>Organize personagens, convide jogadores, crie criaturas e conduza combates em um só lugar. Seu painel reúne as ferramentas essenciais da campanha.</p></section>
    <div class="stats"><div class="stat"><small>Campanhas</small><strong>${camps.length}</strong></div><div class="stat"><small>Personagens</small><strong>${chars.length}</strong></div><div class="stat"><small>Criaturas criadas</small><strong>${creatures.length}</strong></div><div class="stat"><small>Combates registrados</small><strong>${db.logs.filter(x=>x.owner===currentUser.id).length}</strong></div></div>
    <div class="section-head"><div><h3>Acesso rápido</h3><p>Continue preparando sua próxima sessão.</p></div></div>
    <div class="cards"><article class="item-card"><span class="tag">CAMPANHAS</span><h3>Administrar mesa</h3><p>Crie uma campanha, gere convites e gerencie seus participantes.</p><button class="secondary" data-go="campaigns">Abrir campanhas</button></article><article class="item-card"><span class="tag">PERSONAGENS</span><h3>Sua ficha</h3><p>Crie personagens e acompanhe atributos, perícias e sanidade mental.</p><button class="secondary" data-go="characters">Ver personagens</button></article><article class="item-card"><span class="tag">MESTRE</span><h3>Bestiário e combate</h3><p>Monte criaturas e use os dados para registrar ações de combate.</p><button class="secondary" data-go="creatures">Criar criatura</button></article></div>
    <div class="section-head"><div><h3>Suas campanhas</h3><p>Campanhas em que você é mestre ou participante.</p></div></div>${camps.length?`<div class="cards">${camps.slice(0,3).map(c=>campaignCard(c)).join("")}</div>`:empty("Você ainda não participa de campanhas.")}`;
  $$("[data-go]").forEach(b=>b.onclick=()=>{page=b.dataset.go;render();});
}

function campaignCard(c){
  return `<article class="item-card"><div class="card-top"><span class="tag">${c.owner===currentUser.id?"MESTRE":"JOGADOR"}</span><span class="muted tiny">${c.members.length} membro(s)</span></div><h3>${esc(c.name)}</h3><p>${esc(c.description||"Sem descrição.")}</p><div class="card-actions"><button class="secondary" data-open-campaign="${c.id}">Abrir</button>${c.owner===currentUser.id?`<button class="secondary" data-invite="${c.id}">Convite</button>`:""}</div></article>`;
}

function renderCampaigns(){
  header("ORGANIZAÇÃO","Campanhas");
  const camps=userCampaigns();
  $("#content").innerHTML=`<div class="section-head"><div><h3>Suas campanhas</h3><p>Crie uma mesa ou entre usando um código de convite.</p></div><button class="primary" id="newCampaign">+ Nova campanha</button></div><div class="panel"><h3>Entrar com convite</h3><div class="field-row"><label>Código de convite<input id="joinCode" placeholder="Digite o código"></label><button class="secondary" id="joinBtn">Entrar</button></div></div><div class="section-head"><div><h3>Campanhas disponíveis</h3></div></div>${camps.length?`<div class="cards">${camps.map(campaignCard).join("")}</div>`:empty("Nenhuma campanha encontrada.")}`;
  $("#newCampaign").onclick=createCampaignModal;
  $("#joinBtn").onclick=()=>joinCampaign($("#joinCode").value.trim().toUpperCase());
  $$("[data-open-campaign]").forEach(b=>b.onclick=()=>openCampaign(b.dataset.openCampaign));
  $$("[data-invite]").forEach(b=>b.onclick=()=>inviteModal(b.dataset.invite));
}

function createCampaignModal(){
  openModal("Criar campanha",`<label>Nome da campanha<input id="campName" placeholder="Nome da sua aventura"></label><label>Descrição<textarea id="campDesc" placeholder="Resumo ou ambientação da campanha"></textarea></label><button class="primary full" id="createCampBtn">Criar campanha</button>`,()=>{
    $("#createCampBtn").onclick=()=>{
      const name=$("#campName").value.trim();
      if(!name)return toast("Informe um nome.");
      const c={id:id(),name,description:$("#campDesc").value.trim(),owner:currentUser.id,members:[currentUser.id],invite:makeCode(),created:Date.now()};
      db.campaigns.push(c);
      save();
      $("#modal").close();
      render();
      toast("Campanha criada!");
    };
  });
}

function makeCode(){return Math.random().toString(36).slice(2,8).toUpperCase();}

function inviteModal(cid){
  const c=db.campaigns.find(x=>x.id===cid);
  openModal("Convite da campanha",`<p class="muted">Compartilhe este código com os jogadores.</p><div class="notice" style="font-size:22px;text-align:center;letter-spacing:5px;font-weight:800">${c.invite}</div><button class="primary full" id="copyInvite">Copiar código</button>`,()=>{
    $("#copyInvite").onclick=async()=>{
      try{
        await navigator.clipboard.writeText(c.invite);
        toast("Código copiado.");
      }catch{
        toast("Código: "+c.invite);
      }
    };
  });
}

function joinCampaign(code){
  if(!code)return toast("Digite um código de convite.");
  const c=db.campaigns.find(x=>x.invite===code.toUpperCase());
  if(!c)return toast("Convite não encontrado neste navegador.");
  if(!c.members.includes(currentUser.id))c.members.push(currentUser.id);
  save();
  page="campaigns";
  render();
  toast("Você entrou em "+c.name+".");
}

function openCampaign(cid){
  const c=db.campaigns.find(x=>x.id===cid);
  currentCampaign=cid;
  const members=c.members.map(uid=>db.users.find(u=>u.id===uid)?.name||"Conta").join(", ");
  openModal(c.name,`<p>${esc(c.description||"Sem descrição.")}</p><p class="muted">Participantes: ${esc(members)}</p><p class="muted">Papel: ${c.owner===currentUser.id?"Mestre":"Jogador"}</p>${c.owner===currentUser.id?`<button class="secondary" id="campInvite">Gerar/mostrar convite</button>`:""}`,()=>{
    if($("#campInvite"))$("#campInvite").onclick=()=>{ $("#modal").close();inviteModal(cid);};
  });
}

function renderCharacters(){
  header("SUA COLEÇÃO","Personagens");
  const chars=ownedCharacters();
  $("#content").innerHTML=`<div class="section-head"><div><h3>Meus personagens</h3><p>Ficha mecânica e informações do personagem.</p></div><button class="primary" id="newCharacter">+ Criar personagem</button></div>${chars.length?`<div class="cards">${chars.map(c=>`<article class="item-card"><span class="tag">${esc(c.role||"PERSONAGEM")}</span><h3>${esc(c.name)}</h3><p>${esc(c.concept||"Sem descrição.")}</p><div class="badge-line"><span class="tag">SM ${c.sm}/10</span><span class="tag">PV ${c.pv}</span></div><div class="card-actions"><button class="secondary" data-edit-char="${c.id}">Editar ficha</button><button class="danger" data-delete-char="${c.id}">Excluir</button></div></article>`).join("")}</div>`:empty("Você ainda não criou personagens.")}`;
  $("#newCharacter").onclick=()=>characterModal();
  $$("[data-edit-char]").forEach(b=>b.onclick=()=>characterModal(b.dataset.editChar));
  $$("[data-delete-char]").forEach(b=>b.onclick=()=>{
    if(confirm("Excluir este personagem?")){
      db.characters=db.characters.filter(c=>c.id!==b.dataset.deleteChar);
      save();
      render();
    }
  });
}

function characterModal(cid){
  const c=cid?db.characters.find(x=>x.id===cid):{name:"",concept:"",role:"Personagem",sm:10,pv:10,attrs:{},skills:{}};
  const attrHtml=ATTRS.map(a=>`<label>${a}<input class="stat-input" type="number" min="0" max="10" data-attr="${a}" value="${c.attrs?.[a]??0}"></label>`).join("");
  const skillHtml=SKILLS.map(s=>`<label>${s}<select data-skill="${s}">${[0,1,2,3,4,5].map(n=>`<option value="${n}" ${(c.skills?.[s]??0)===n?"selected":""}>${n} ${n===1?"• nível 1":n===3?"• nível 3":n===5?"• nível 5":""}</option>`).join("")}</select></label>`).join("");
  
  openModal(cid?"Editar personagem":"Criar personagem",`<div class="form-grid"><label>Nome<input id="charName" value="${esc(c.name)}"></label><label>Tipo/função<input id="charRole" value="${esc(c.role)}"></label><label class="wide">Conceito<textarea id="charConcept">${esc(c.concept)}</textarea></label></div><h3>PV e sanidade mental</h3><div class="form-grid"><label>Pontos de vida (PV)<input id="charPv" type="number" min="0" value="${c.pv}"></label><label>Sanidade mental (SM)<input id="charSm" type="number" min="0" max="10" value="${c.sm}"></label></div><h3 style="margin-top:18px">Atributos base</h3><div class="attribute-grid">${attrHtml}</div><h3 style="margin-top:18px">Perícias (0 a 5)</h3><div class="form-grid">${skillHtml}</div><button class="primary full" id="saveChar">Salvar personagem</button>`,()=>{
    $("#saveChar").onclick=()=>{
      const name=$("#charName").value.trim();
      if(!name)return toast("Dê um nome ao personagem.");
      const item={
        id:cid||id(),
        owner:currentUser.id,
        name,
        role:$("#charRole").value,
        concept:$("#charConcept").value,
        pv:Math.max(0,+$("#charPv").value||0),
        sm:Math.min(10,Math.max(0,+$("#charSm").value||0)),
        attrs:Object.fromEntries($$("[data-attr]").map(x=>[x.dataset.attr,Math.max(0,+x.value||0)])),
        skills:Object.fromEntries($$("[data-skill]").map(x=>[x.dataset.skill,+x.value]))
      };
      if(cid)db.characters=db.characters.map(x=>x.id===cid?item:x);
      else db.characters.push(item);
      save();
      $("#modal").close();
      render();
      toast("Ficha salva.");
    };
  });
}

function renderCreatures(){
  header("FERRAMENTAS DO MESTRE","Criaturas");
  const list=db.creatures.filter(x=>x.owner===currentUser.id);
  $("#content").innerHTML=`<div class="section-head"><div><h3>Bestiário</h3><p>Crie e mantenha suas criaturas e inimigos.</p></div><button class="primary" id="newCreature">+ Criar criatura</button></div><div class="notice">As criaturas são privadas da conta que as criou neste protótipo.</div><div style="height:15px"></div>${list.length?`<div class="cards">${list.map(x=>`<article class="item-card"><span class="tag">${esc(x.type||"CRIATURA")}</span><h3>${esc(x.name)}</h3><p>${esc(x.description||"Sem descrição.")}</p><div class="badge-line"><span class="tag">PV ${x.pv}</span><span class="tag">Defesa ${x.defense}</span><span class="tag">SM ${x.sm}</span></div><div class="card-actions"><button class="secondary" data-edit-creature="${x.id}">Editar</button><button class="danger" data-del-creature="${x.id}">Excluir</button></div></article>`).join("")}</div>`:empty("Seu bestiário está vazio.")}`;
  $("#newCreature").onclick=()=>creatureModal();
  $$("[data-edit-creature]").forEach(b=>b.onclick=()=>creatureModal(b.dataset.editCreature));
  $$("[data-del-creature]").forEach(b=>b.onclick=()=>{
    if(confirm("Excluir criatura?")){
      db.creatures=db.creatures.filter(x=>x.id!==b.dataset.delCreature);
      save();
      render();
    }
  });
}

function creatureModal(cid){
  const c=cid?db.creatures.find(x=>x.id===cid):{name:"",type:"Aberração",description:"",pv:20,defense:10,sm:10,attack:2};
  openModal(cid?"Editar criatura":"Criar criatura",`<div class="form-grid"><label>Nome<input id="crName" value="${esc(c.name)}"></label><label>Categoria<input id="crType" value="${esc(c.type)}"></label><label class="wide">Descrição<textarea id="crDesc">${esc(c.description)}</textarea></label><label>PV<input id="crPv" type="number" min="0" value="${c.pv}"></label><label>Defesa/dificuldade<input id="crDef" type="number" min="0" value="${c.defense}"></label><label>SM<input id="crSm" type="number" min="0" value="${c.sm}"></label><label>Bônus de ataque<input id="crAtk" type="number" value="${c.attack}"></label></div><button class="primary full" id="saveCreature">Salvar criatura</button>`,()=>{
    $("#saveCreature").onclick=()=>{
      if(!$("#crName").value.trim())return toast("Informe o nome.");
      const item={id:cid||id(),owner:currentUser.id,name:$("#crName").value.trim(),type:$("#crType").value,description:$("#crDesc").value,pv:+$("#crPv").value||0,defense:+$("#crDef").value||0,sm:+$("#crSm").value||0,attack:+$("#crAtk").value||0};
      if(cid)db.creatures=db.creatures.map(x=>x.id===cid?item:x);
      else db.creatures.push(item);
      save();
      $("#modal").close();
      render();
      toast("Criatura salva.");
    };
  });
}

function renderCombat(){
  header("MESA DE JOGO","Combate");
  const chars=ownedCharacters(),creatures=db.creatures.filter(x=>x.owner===currentUser.id),logs=db.logs.filter(x=>x.owner===currentUser.id).slice().reverse().slice(0,10);
  $("#content").innerHTML=`<div class="section-head"><div><h3>Central de combate</h3><p>Role dados e registre ações da batalha.</p></div></div><div class="combat-grid"><section class="panel"><h3>Teste de ação</h3><p class="hint">Role 1d12 + um modificador informado.</p><label>Personagem ou criatura<input id="rollerName" placeholder="Nome de quem está agindo"></label><label>Tipo de ação<select id="rollType"><option>Ataque</option><option>Teste</option><option>Bloqueio</option><option>Magia / Bruxaria</option><option>Resistência Mental — Aceitar</option><option>Resistência Mental — Resistir</option></select></label><label>Modificador<input id="rollMod" type="number" value="0"></label><label>Dificuldade (opcional)<input id="rollDc" type="number" placeholder="Ex.: 15"></label><button class="primary full" id="rollBtn">Rolar 1d12</button><div id="rollOutput"></div></section><section class="panel"><h3>Atalhos de ficha</h3><p class="hint">Selecione um personagem.</p><label>Personagem<select id="combatChar"><option value="">Escolher personagem</option>${chars.map(c=>`<option value="${c.id}">${esc(c.name)}</option>`).join("")}</select></label><div id="charQuick" class="notice">Nenhum personagem selecionado.</div><h3 style="margin-top:22px">Criaturas</h3><button class="secondary" id="gotoCreatures">Abrir bestiário</button></section></div><div class="section-head"><div><h3>Registro recente</h3></div></div>${logs.length?`<div class="panel">${logs.map(l=>`<div class="log"><b>${esc(l.actor)}</b> — ${esc(l.type)}: <b>${l.total}</b> (${l.die} + ${l.mod}) ${l.dc?`• ${l.total>=l.dc?"Sucesso":"Falha"} contra ${l.dc}`:""}<small>${new Date(l.time).toLocaleString("pt-BR")}</small></div>`).join("")}</div>`:empty("Nenhuma rolagem registrada.")}`;
  
  // Linha corrigida (removido o traço incorreto que havia na frente)
  $("#rollBtn").onclick=()=>{
    const actor=$("#rollerName").value.trim()||currentUser.name,type=$("#rollType").value,mod=+$("#rollMod").value||0,dc=$("#rollDc").value?+$("#rollDc").value:null,die=Math.floor(Math.random()*12)+1,total=die+mod;
    const log={id:id(),owner:currentUser.id,actor,type,die,mod,total,dc,time:Date.now()};
    db.logs.push(log);
    save();
    $("#rollOutput").innerHTML=`<div class="roll-result">${total}</div><p class="muted">1d12 (${die}) + ${mod} ${dc!==null?`• ${total>=dc?"Sucesso":"Falha"} contra ${dc}`:""}</p>`;
    toast("Rolagem registrada.");
  };

  $("#combatChar").onchange=()=>{
    const c=chars.find(x=>x.id===$("#combatChar").value);
    $("#charQuick").innerHTML=c?`<b>${esc(c.name)}</b><p>PV: ${c.pv} · SM: ${c.sm}/10</p><p>${ATTRS.map(a=>`${a}: ${c.attrs?.[a]??0}`).join(" · ")}</p>`:"Nenhum personagem selecionado.";
  };

  $("#gotoCreatures").onclick=()=>{page="creatures";render();};
}

if(currentUser){showApp();}else{showAuth();}