const allowedOrigin = process.env.SITE_ORIGIN || '*';
const AIRTABLE_TOKEN = process.env.AIRTABLE_TOKEN;
const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID;
const AIRTABLE_TABLE = process.env.AIRTABLE_TABLE_NAME || 'Table 1';
const ADMIN_SECRET = process.env.ADMIN_SECRET;

function cors(statusCode, body) {
  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': allowedOrigin,
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Allow-Methods': 'POST, OPTIONS'
    },
    body: JSON.stringify(body)
  };
}

function ensureAuth(authHeader) {
  if (!ADMIN_SECRET) return false;
  if (!authHeader) return false;
  const [type, token] = authHeader.split(' ');
  return type === 'Bearer' && token === ADMIN_SECRET;
}

async function findByTracking(trackingCode) {
  const formula = `TrackingCode="${trackingCode.replace(/"/g, '\\"')}"`;
  const url = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${encodeURIComponent(AIRTABLE_TABLE)}?maxRecords=1&filterByFormula=${encodeURIComponent(formula)}`;
  const resp = await fetch(url, { headers: { Authorization: `Bearer ${AIRTABLE_TOKEN}` } });
  const data = await resp.json();
  if (!resp.ok) throw new Error(data.error?.message || 'Airtable sorgu hatası');
  return data.records?.[0] || null;
}

async function patchStatus(id, status) {
  const url = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${encodeURIComponent(AIRTABLE_TABLE)}`;
  const resp = await fetch(url, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${AIRTABLE_TOKEN}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ records: [{ id, fields: { Status: status } }] })
  });
  const data = await resp.json();
  if (!resp.ok) throw new Error(data.error?.message || 'Airtable update hatası');
  return data;
}

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return cors(200, {});
  if (event.httpMethod !== 'POST') return cors(405, { error: 'Method not allowed' });
  if (!ensureAuth(event.headers.authorization)) return cors(401, { error: 'Unauthorized' });

  try {
    const { trackingCode, status } = JSON.parse(event.body || '{}');
    const allowed = ['Pending', 'Approved', 'Rejected', 'In Production', 'Delivered'];
    if (!trackingCode || !status || !allowed.includes(status)) {
      return cors(400, { error: 'Geçersiz veri' });
    }

    const rec = await findByTracking(trackingCode);
    if (!rec) return cors(404, { error: 'Kayıt bulunamadı' });

    await patchStatus(rec.id, status);
    return cors(200, { ok: true });
  } catch (err) {
    return cors(500, { error: err.message || 'Sunucu hatası' });
  }
};
