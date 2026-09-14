const { createClient } = supabase;
const client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
const form = document.getElementById('order-form');
const msg = document.getElementById('form-msg');

function setFormMessage(text, error = false) {
  msg.textContent = text;
  msg.classList.toggle('error', error);
}

form.addEventListener('submit', async event => {
  event.preventDefault();

  if (!SUPABASE_URL.startsWith('http') || SUPABASE_ANON_KEY.includes('YOUR_')) {
    setFormMessage('The order system is not configured yet. Please try again later.', true);
    return;
  }

  const button = form.querySelector('button[type="submit"]');
  button.disabled = true;
  setFormMessage('Sending your order…');

  const payload = {
    name: document.getElementById('order-name').value.trim(),
    whatsapp: document.getElementById('order-whatsapp').value.trim(),
    email: document.getElementById('order-email').value.trim() || null,
    service: document.getElementById('order-service').value,
    budget: document.getElementById('order-budget').value.trim() || null,
    requirements: document.getElementById('order-requirements').value.trim(),
    status: 'New'
  };

  const { error } = await client.from('orders').insert(payload);
  button.disabled = false;

  if (error) {
    setFormMessage('We could not submit the order. Please try again or contact us on WhatsApp.', true);
    return;
  }

  form.reset();
  setFormMessage('Order received! Nexvision will contact you soon. ✓');
});
