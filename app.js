const STORAGE_KEY = 'supermtv_tickets_v1';
const ADMIN_PASS = '1234';
const CUSTOMER_KEY = 'supermtv_customers_v1';
let selectedCatalogItem = null;

const CATALOG = [
  {type:'filme', name:'Velozes e Furiosos 10', year:'2023'},
  {type:'filme', name:'Avatar O Caminho da Água', year:'2022'},
  {type:'filme', name:'Bad Boys Até o Fim', year:'2024'},
  {type:'filme', name:'Divertida Mente 2', year:'2024'},
  {type:'filme', name:'Godzilla e Kong O Novo Império', year:'2024'},
  {type:'filme', name:'Duna Parte 2', year:'2024'},
  {type:'filme', name:'Deadpool & Wolverine', year:'2024'},
  {type:'filme', name:'Moana 2', year:'2024'},
  {type:'serie', name:'The Boys', year:'2019'},
  {type:'serie', name:'Round 6', year:'2021'},
  {type:'serie', name:'Stranger Things', year:'2016'},
  {type:'serie', name:'La Casa de Papel', year:'2017'},
  {type:'serie', name:'Wandinha', year:'2022'},
  {type:'serie', name:'The Last of Us', year:'2023'},
  {type:'serie', name:'House of the Dragon', year:'2022'},
  {type:'serie', name:'Bridgerton', year:'2020'}
];

const $ = (id) => document.getElementById(id);
const nowBR = () => new Date().toLocaleString('pt-BR');

function getTickets(){
  return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
}
function saveTickets(tickets){
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tickets));
}
function getCustomers(){
  return JSON.parse(localStorage.getItem(CUSTOMER_KEY) || '[]');
}
function saveCustomers(customers){
  localStorage.setItem(CUSTOMER_KEY, JSON.stringify(customers));
}
function isMovieOrSeries(){
  return /filme|série|serie/i.test($('ticketType').value);
}
function posterSvg(item){
  const initials = item.name.split(' ').filter(Boolean).slice(0,3).map(w=>w[0]).join('').toUpperCase();
  const bg = item.type === 'filme' ? '#f97316' : '#e11d48';
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="220" height="320" viewBox="0 0 220 320"><defs><linearGradient id="g" x1="0" x2="1" y1="0" y2="1"><stop stop-color="${bg}"/><stop offset="1" stop-color="#111827"/></linearGradient></defs><rect width="220" height="320" rx="20" fill="url(#g)"/><circle cx="176" cy="52" r="30" fill="rgba(255,255,255,.18)"/><text x="110" y="150" font-size="54" text-anchor="middle" fill="white" font-family="Arial" font-weight="900">${initials}</text><text x="110" y="202" font-size="18" text-anchor="middle" fill="white" font-family="Arial" font-weight="700">${item.type.toUpperCase()}</text><text x="110" y="240" font-size="15" text-anchor="middle" fill="#e5e7eb" font-family="Arial">${item.year}</text></svg>`;
  return 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(svg);
}
function makeCode(){
  return 'TCK-' + Math.floor(100000 + Math.random() * 900000);
}

$('ticketForm').addEventListener('submit', (e)=>{
  e.preventDefault();
  const ticket = {
    id: crypto.randomUUID(),
    code: makeCode(),
    customerName: $('customerName').value.trim(),
    customerContact: $('customerContact').value.trim(),
    platform: $('platform').value,
    type: $('ticketType').value,
    contentName: $('contentName').value.trim(),
    catalogType: selectedCatalogItem?.type || '',
    catalogYear: selectedCatalogItem?.year || '',
    description: $('description').value.trim(),
    status: 'Novo',
    createdAt: nowBR(),
    updatedAt: nowBR(),
    resolvedBy: '',
    resolutionNote: ''
  };
  const tickets = getTickets();
  tickets.unshift(ticket);
  saveTickets(tickets);
  e.target.reset();
  selectedCatalogItem = null;
  updateCatalogVisibility();
  $('createdBox').classList.remove('hidden');
  $('createdBox').innerHTML = `<b>Chamado enviado com sucesso!</b><br>Código: <strong>${ticket.code}</strong><br>Guarde esse código para consultar o andamento.`;
  renderCustomers();
updateCatalogVisibility();
renderAdmin();
});

$('saveCustomerBtn').addEventListener('click', ()=>{
  const name = $('customerName').value.trim();
  const contact = $('customerContact').value.trim();
  if(!name || !contact){ alert('Preencha nome e contato para salvar o cadastro.'); return; }
  const customers = getCustomers();
  const existing = customers.find(c => c.contact.toLowerCase() === contact.toLowerCase());
  if(existing){ existing.name = name; existing.updatedAt = nowBR(); }
  else customers.unshift({id: crypto.randomUUID(), name, contact, createdAt: nowBR(), updatedAt: nowBR()});
  saveCustomers(customers);
  renderCustomers();
  alert('Cadastro salvo com sucesso.');
});

$('savedCustomer').addEventListener('change', ()=>{
  const customer = getCustomers().find(c => c.id === $('savedCustomer').value);
  if(customer){
    $('customerName').value = customer.name;
    $('customerContact').value = customer.contact;
  }
});

$('ticketType').addEventListener('change', ()=>{
  selectedCatalogItem = null;
  updateCatalogVisibility();
});
$('contentName').addEventListener('input', renderCatalogResults);

$('searchBtn').addEventListener('click', ()=>{
  const code = $('searchCode').value.trim().toUpperCase();
  const ticket = getTickets().find(t => t.code.toUpperCase() === code);
  if(!ticket){
    $('searchResult').innerHTML = '<div class="empty">Chamado não encontrado.</div>';
    return;
  }
  $('searchResult').innerHTML = ticketCard(ticket, false);
});

$('toggleAdmin').addEventListener('click', ()=>{
  $('adminArea').classList.toggle('hidden');
  window.scrollTo({top: document.body.scrollHeight, behavior:'smooth'});
});

$('loginBtn').addEventListener('click', ()=>{
  if($('adminPass').value === ADMIN_PASS){
    $('loginBox').classList.add('hidden');
    $('adminPanel').classList.remove('hidden');
    renderCustomers();
updateCatalogVisibility();
renderAdmin();
  }else alert('Senha incorreta.');
});

$('filterStatus').addEventListener('change', renderAdmin);
$('filterPlatform').addEventListener('change', renderAdmin);

$('clearAll').addEventListener('click', ()=>{
  if(confirm('Deseja limpar todos os tickets de teste?')){
    saveTickets([]);
    renderCustomers();
updateCatalogVisibility();
renderAdmin();
    $('searchResult').innerHTML = '';
  }
});

function ticketCard(t, admin=true){
  const statusClass = t.status.split(' ')[0];
  return `<article class="ticket">
    <div class="ticket-top">
      <div>
        <div class="code">${t.code}</div>
        <small>Aberto em ${t.createdAt}</small>
      </div>
      <span class="pill ${statusClass}">${t.status}</span>
    </div>
    <div class="ticket-grid">
      <div class="mini"><span>Cliente</span><b>${escapeHtml(t.customerName)}</b></div>
      <div class="mini"><span>Contato/usuário</span><b>${escapeHtml(t.customerContact)}</b></div>
      <div class="mini"><span>Plataforma</span><b>${t.platform}</b></div>
      <div class="mini"><span>Tipo</span><b>${t.type}</b></div>
      <div class="mini"><span>Conteúdo</span><b>${escapeHtml(t.contentName)}${t.catalogYear ? ' • '+escapeHtml(t.catalogYear) : ''}</b></div>
      <div class="mini"><span>Atualizado</span><b>${t.updatedAt}</b></div>
    </div>
    <div class="desc">${escapeHtml(t.description)}</div>
    ${t.resolutionNote ? `<div class="resolved-note"><b>Resposta do suporte:</b> ${escapeHtml(t.resolutionNote)}<br><small>Atendido por: ${escapeHtml(t.resolvedBy || 'Suporte')}</small></div>` : ''}
    ${admin ? adminActions(t) : ''}
  </article>`;
}

function adminActions(t){
  return `<div class="actions">
    <button class="secondary" onclick="updateStatus('${t.id}','Em análise')">Em análise</button>
    <button class="primary" onclick="resolveTicket('${t.id}','Pedido realizado')">Pedido realizado</button>
    <button class="primary" onclick="resolveTicket('${t.id}','Reparo feito')">Reparo feito</button>
    <button class="outline" onclick="resolveTicket('${t.id}','Não encontrado')">Não encontrado</button>
    <button class="outline" onclick="updateStatus('${t.id}','Resolvido')">Resolvido</button>
    <button class="danger outline" onclick="deleteTicket('${t.id}')">Excluir</button>
  </div>`;
}

window.updateStatus = function(id, status){
  const tickets = getTickets().map(t => t.id === id ? {...t, status, updatedAt: nowBR()} : t);
  saveTickets(tickets);
  renderCustomers();
updateCatalogVisibility();
renderAdmin();
}

window.resolveTicket = function(id, status){
  const by = prompt('Nome de quem atendeu:', 'Suporte');
  if(by === null) return;
  const noteDefault = status === 'Não encontrado' ? 'Conteúdo não encontrado no momento.' : 'Chamado atendido com sucesso.';
  const note = prompt('Mensagem para o cliente:', noteDefault);
  if(note === null) return;
  const tickets = getTickets().map(t => t.id === id ? {
    ...t,
    status,
    updatedAt: nowBR(),
    resolvedBy: by.trim() || 'Suporte',
    resolutionNote: note.trim() || noteDefault
  } : t);
  saveTickets(tickets);
  renderCustomers();
updateCatalogVisibility();
renderAdmin();
}

window.deleteTicket = function(id){
  if(confirm('Excluir este chamado?')){
    saveTickets(getTickets().filter(t => t.id !== id));
    renderCustomers();
updateCatalogVisibility();
renderAdmin();
  }
}

function renderAdmin(){
  const all = getTickets();
  const status = $('filterStatus')?.value || '';
  const platform = $('filterPlatform')?.value || '';
  const tickets = all.filter(t => (!status || t.status === status) && (!platform || t.platform === platform));
  const counts = {
    total: all.length,
    novo: all.filter(t=>t.status==='Novo').length,
    analise: all.filter(t=>t.status==='Em análise').length,
    realizado: all.filter(t=>t.status==='Pedido realizado').length,
    reparo: all.filter(t=>t.status==='Reparo feito').length,
    resolvido: all.filter(t=>['Resolvido','Pedido realizado','Reparo feito'].includes(t.status)).length
  };
  if($('stats')) $('stats').innerHTML = `
    <div class="stat"><b>${counts.total}</b><span>Total</span></div>
    <div class="stat"><b>${counts.novo}</b><span>Novos</span></div>
    <div class="stat"><b>${counts.analise}</b><span>Em análise</span></div>
    <div class="stat"><b>${counts.realizado}</b><span>Pedidos feitos</span></div>
    <div class="stat"><b>${counts.reparo}</b><span>Reparos feitos</span></div>
    <div class="stat"><b>${counts.resolvido}</b><span>Atendidos</span></div>`;
  if($('ticketList')) $('ticketList').innerHTML = tickets.length ? tickets.map(t=>ticketCard(t,true)).join('') : '<div class="empty">Nenhum chamado encontrado.</div>';
}

function renderCustomers(){
  const select = $('savedCustomer');
  if(!select) return;
  const customers = getCustomers();
  select.innerHTML = '<option value="">Novo cliente / preencher manual</option>' + customers.map(c => `<option value="${c.id}">${escapeHtml(c.name)} - ${escapeHtml(c.contact)}</option>`).join('');
}

function updateCatalogVisibility(){
  const box = $('catalogBox');
  if(!box) return;
  if(isMovieOrSeries()){
    box.classList.remove('hidden');
    $('contentLabel').querySelector('input').placeholder = 'Digite para buscar e selecionar pela imagem';
    renderCatalogResults();
  }else{
    box.classList.add('hidden');
    $('selectedContentText').textContent = 'Nenhum selecionado';
    $('contentLabel').querySelector('input').placeholder = 'Ex: HBO, SporTV, Telecine';
  }
}

function renderCatalogResults(){
  if(!isMovieOrSeries()) return;
  const q = $('contentName').value.trim().toLowerCase();
  const wantedType = /filme/i.test($('ticketType').value) ? 'filme' : 'serie';
  const results = CATALOG.filter(item => item.type === wantedType && (!q || item.name.toLowerCase().includes(q))).slice(0,8);
  $('catalogResults').innerHTML = results.length ? results.map(item => `
    <button type="button" class="poster-card ${selectedCatalogItem?.name === item.name ? 'selected' : ''}" onclick="selectCatalogItem('${escapeAttr(item.name)}')">
      <img src="${posterSvg(item)}" alt="${escapeAttr(item.name)}" />
      <span>${escapeHtml(item.name)}</span>
      <small>${item.year}</small>
    </button>`).join('') : '<div class="empty mini-empty">Nenhum item no catálogo. Digite o nome manualmente.</div>';
}

window.selectCatalogItem = function(name){
  selectedCatalogItem = CATALOG.find(item => item.name === name);
  if(!selectedCatalogItem) return;
  $('contentName').value = selectedCatalogItem.name;
  $('selectedContentText').textContent = `${selectedCatalogItem.name} • ${selectedCatalogItem.year}`;
  renderCatalogResults();
}

function escapeAttr(str=''){
  return String(str).replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
}

function escapeHtml(str=''){
  return str.replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
}

renderCustomers();
updateCatalogVisibility();
renderAdmin();
