const client = supabase.createClient(
  SUPABASE_URL,
  SUPABASE_ANON_KEY
);

const form = document.getElementById("order-form");
const msg = document.getElementById("form-msg");

form.addEventListener("submit", async (event) => {
  event.preventDefault();

  msg.textContent = "Sending order...";

  const payload = {
    name: document.getElementById("order-name").value.trim(),
    whatsapp: document.getElementById("order-whatsapp").value.trim(),
    email: document.getElementById("order-email").value.trim() || null,
    service: document.getElementById("order-service").value,
    budget: document.getElementById("order-budget").value.trim() || null,
    requirements: document.getElementById("order-requirements").value.trim(),
    status: "New"
  };

  const result = await client
    .from("orders")
    .insert([payload]);

  if (result.error) {
    console.error("SUPABASE ERROR:", result.error);

    msg.textContent = "Error: " + result.error.message;
    return;
  }

  form.reset();
  msg.textContent = "Order saved successfully!";
});
