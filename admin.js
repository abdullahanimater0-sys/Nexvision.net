const { createClient } = supabase;
const client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const ALLOWED_ADMIN_UID = 'c442b1b7-8749-4f35-b90a-bc64e52f60d6';

const loginPanel = document.getElementById('login-panel');
const dashboardPanel = document.getElementById('dashboard-panel');
const loginForm = document.getElementById('login-form');
const loginMsg = document.getElementById('login-msg');
const logoutBtn = document.getElementById('logout-btn');
const refreshBtn = document.getElementById('refresh-orders');
const ordersList = document.getElementById('orders-list');
const ordersMsg = document.getElementById('orders-msg');
const searchInput = document.getElementById('order-search');
const statusFilter = document.getElementById('status-filter');

let orders = [];

function configReady() {
  return SUPABASE_URL.startsWith('http') && !SUPABASE_ANON_KEY.includes('YOUR_');
}

function setMessage(el, text, error = false) {
  el.textContent = text;
  el.classList.toggle('error', error);
}

function showLogin() {
  loginPanel.classList.remove('hidden');
  dashboardPanel.classList.add('hidden');
  logoutBtn.classList.add('hidden');
}

function showDashboard() {
  loginPanel.classList.add('hidden');
  dashboardPanel.classList.remove('hidden');
  logoutBtn.classList.remove('hidden');
}

function formatDate(value) {
  if (!value) return '';
  return new Intl.DateTimeFormat('en-PK', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value));
}

function normalizeWhatsApp(value) {
  return (value || '').replace(/\D/g, '');
}

function updateStats() {
  document.getElementById('count-total').textContent = orders.length;
  document.getElementById('count-new').textContent = orders.filter(o => o.status === 'New').length;
  document.getElementById('count-progress').textContent = orders.filter(o => o.status === 'In Progress').length;
  document.getElementById('count-complete').textContent = orders.filter(o => o.status === 'Completed').length;
}

function filteredOrders() {
  const q = searchInput.value.trim().toLowerCase();
  const status = statusFilter.value;
  return orders.filter(order => {
    const haystack = [order.name, order.email, order.whatsapp, order.service, order.budget, order.requirements].join(' ').toLowerCase();
    const matchesQuery = !q || haystack.includes(q);
    const matchesStatus = status === 'all' || order.status === status;
    return matchesQuery && matchesStatus;
  });
}

function renderOrders() {
  ordersList.innerHTML = '';
  const visible = filteredOrders();

  if (!visible.length) {
    ordersList.innerHTML = '<div class="empty-state"><h3>No orders found</h3><p>New client inquiries will appear here.</p></div>';
    return;
  }

  const template = document.getElementById('order-template');
  visible.forEach(order => {
    const fragment = template.content.cloneNode(true);
    const card = fragment.querySelector('.order-card');
    card.dataset.id = order.id;
    fragment.querySelector('.order-id').textContent = `Order #${order.id}`;
    fragment.querySelector('.order-name').textContent = order.name || 'Unnamed client';
    fragment.querySelector('.order-service').textContent = `Service: ${order.service || '—'}`;
    fragment.querySelector('.order-budget').textContent = `Budget: ${order.budget || '—'}`;
    fragment.querySelector('.order-date').textContent = formatDate(order.created_at);
    fragment.querySelector('.order-contact').textContent = [order.email, order.whatsapp].filter(Boolean).join('  •  ');
    fragment.querySelector('.order-requirements').textContent = order.requirements || 'No project details provided.';

    const badge = fragment.querySelector('.status-badge');
    badge.textContent = order.status || 'New';
    badge.dataset.status = order.status || 'New';

    const statusSelect = fragment.querySelector('.order-status');
    statusSelect.value = order.status || 'New';
    statusSelect.addEventListener('change', () => updateOrderStatus(order.id, statusSelect.value));

    const wa = fragment.querySelector('.order-whatsapp');
    const number = normalizeWhatsApp(order.whatsapp);
    if (number) {
      const text = encodeURIComponent(`Hello ${order.name || ''}, this is Nexvision regarding your project inquiry.`);
      wa.href = `https://wa.me/${number}?text=${text}`;
    } else {
      wa.removeAttribute('href');
      wa.classList.add('disabled');
    }

    fragment.querySelector('.order-delete').addEventListener('click', () => deleteOrder(order.id));
    ordersList.appendChild(fragment);
  });
}

async function ensureAdminSession(session) {
  if (!session || session.user.id !== ALLOWED_ADMIN_UID) {
    if (session) await client.auth.signOut();
    showLogin();
    setMessage(loginMsg, session ? 'This account is not authorized for the Nexvision admin dashboard.' : '');
    return false;
  }
  showDashboard();
  await loadOrders();
  return true;
}

async function loadOrders() {
  setMessage(ordersMsg, 'Loading orders…');
  const { data, error } = await client.from('orders').select('*').order('created_at', { ascending: false });
  if (error) {
    setMessage(ordersMsg, `Could not load orders: ${error.message}`, true);
    return;
  }
  orders = data || [];
  setMessage(ordersMsg, '');
  updateStats();
  renderOrders();
}

async function updateOrderStatus(id, status) {
  const { error } = await client.from('orders').update({ status }).eq('id', id);
  if (error) {
    setMessage(ordersMsg, `Could not update order: ${error.message}`, true);
    return;
  }
  const order = orders.find(item => item.id === id);
  if (order) order.status = status;
  updateStats();
  renderOrders();
}

async function deleteOrder(id) {
  if (!window.confirm(`Delete order #${id}? This cannot be undone.`)) return;
  const { error } = await client.from('orders').delete().eq('id', id);
  if (error) {
    setMessage(ordersMsg, `Could not delete order: ${error.message}`, true);
    return;
  }
  orders = orders.filter(order => order.id !== id);
  updateStats();
  renderOrders();
}

loginForm.addEventListener('submit', async event => {
  event.preventDefault();
  if (!configReady()) {
    setMessage(loginMsg, 'Add your Supabase project URL and public anon key in supabase-config.js first.', true);
    return;
  }
  setMessage(loginMsg, 'Signing in…');
  const email = document.getElementById('admin-email').value.trim();
  const password = document.getElementById('admin-password').value;
  const { data, error } = await client.auth.signInWithPassword({ email, password });
  if (error) {
    setMessage(loginMsg, error.message, true);
    return;
  }
  await ensureAdminSession(data.session);
});

logoutBtn.addEventListener('click', async () => {
  await client.auth.signOut();
  showLogin();
});

refreshBtn.addEventListener('click', loadOrders);
searchInput.addEventListener('input', renderOrders);
statusFilter.addEventListener('change', renderOrders);

(async () => {
  if (!configReady()) {
    showLogin();
    setMessage(loginMsg, 'Before using admin login, add the Supabase URL and public anon key to supabase-config.js.', true);
    return;
  }
  const { data } = await client.auth.getSession();
  await ensureAdminSession(data.session);
})();
