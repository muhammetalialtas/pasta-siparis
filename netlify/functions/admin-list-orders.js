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
      'Access-Control-Allow-Methods': 'GET, OPTIONS'
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

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return cors(200, {});
  if (event.httpMethod !== 'GET') return cors(405, { error: 'Method not allowed' });
  if (!ensureAuth(event.headers.authorization)) return cors(401, { error: 'Unauthorized' });

  try {
    const { status, offset } = event.queryStringParameters || {};
    const params = new URLSearchParams();
    params.set('pageSize', '10');
    if (status && status !== 'ALL') {
      const formula = `Status="${status.replace(/"/g, '\\"')}"`;
      params.set('filterByFormula', formula);
    }
    if (offset) params.set('offset', offset);

    const url = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${encodeURIComponent(AIRTABLE_TABLE)}?${params.toString()}`;
    const resp = await fetch(url, { headers: { Authorization: `Bearer ${AIRTABLE_TOKEN}` } });
    const data = await resp.json();
    if (!resp.ok) throw new Error(data.error?.message || 'Airtable list hatası');

    return cors(200, data); // { records: [...], offset?: '...' }
  } catch (err) {
    return cors(500, { error: err.message || 'Sunucu hatası' });
  }
};
