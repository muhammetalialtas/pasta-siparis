exports.handler = async (event) => {
  const key = event.headers['x-admin-key'];
  if (key !== process.env.ADMIN_KEY) {
    return { statusCode: 401, body: JSON.stringify({ ok: false, error: "unauthorized" }) };
  }

  const { id } = JSON.parse(event.body);
  // Burada id’li siparişin durumunu "Reddedildi" yap
  return { statusCode: 200, body: JSON.stringify({ ok: true, message: `Sipariş ${id} reddedildi` }) };
};
