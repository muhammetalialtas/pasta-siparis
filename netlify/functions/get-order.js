const allowedOrigin = process.env.SITE_ORIGIN || '*';
const AIRTABLE_TOKEN = process.env.AIRTABLE_TOKEN;
const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID;
const AIRTABLE_TABLE = process.env.AIRTABLE_TABLE_NAME || 'Table 1';

function cors(statusCode, body) {
  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': allowedOrigin,
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Allow-Methods': 'GET, OPTIONS'
    },
    body: JSON.stringify(body)
  };
}

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return cors(200, {});
  if (event.httpMethod !== 'GET') return cors(405, { error: 'Method not allowed' });

  try {
    const { trackingCode } = event.queryStringParameters || {};
    if (!trackingCode) return cors(400, { error: 'trackingCode gerekli' });

    const formula = `TrackingCode="${trackingCode.replace(/"/g, '\\"')}"`;
    const url = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${encodeURIComponent(AIRTABLE_TABLE)}?maxRecords=1&filterByFormula=${encodeURIComponent(formula)}`;

    const resp = await fetch(url, {
      headers: { Authorization: `Bearer ${AIRTABLE_TOKEN}` }
    });
    const data = await resp.json();
    if (!resp.ok) throw new Error(data.error?.message || 'Airtable sorgu hatası');

    const rec = data.records?.[0];
    if (!rec) return cors(404, { error: 'Sipariş bulunamadı' });

    const f = rec.fields;
    return cors(200, {
      trackingCode: f.TrackingCode,
      status: f.Status,
      name: f.Name,
      flavor: f.Flavor,
      size: f.Size,
      message: f.Message || '',
      imageUrl: f.ImageURL || ''
    });
  } catch (err) {
    return cors(500, { error: err.message || 'Sunucu hatası' });
  }
};
