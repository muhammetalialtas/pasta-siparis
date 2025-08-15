async function loadOrders() {
  const res = await fetch('/.netlify/functions/getOrders');
  const data = await res.json();
  if (data.ok) {
    renderOrders(data.orders);
  } else {
    alert("Siparişler alınamadı.");
  }
}

function renderOrders(orders) {
  const container = document.getElementById('orders');
  container.innerHTML = '';
  orders.forEach(order => {
    const div = document.createElement('div');
    div.classList.add('order');
    div.innerHTML = `
      <p><strong>${order.name}</strong> - ${order.cake} (${order.status})</p>
      <button onclick="updateOrder(${order.id}, 'approveOrder')">✅ Onayla</button>
      <button onclick="updateOrder(${order.id}, 'rejectOrder')">❌ Reddet</button>
    `;
    container.appendChild(div);
  });
}

async function updateOrder(id, action) {
  const key = document.getElementById("key").value;
  if (!key) {
    alert("Lütfen admin anahtarını gir.");
    return;
  }
  
  const res = await fetch(`/.netlify/functions/${action}`, {
    method: "POST",
    headers: { "x-admin-key": key },
    body: JSON.stringify({ id })
  });
  
  const data = await res.json();
  alert(data.message || data.error);
  if (data.ok) loadOrders();
}
