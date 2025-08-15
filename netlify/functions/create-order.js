// netlify/functions/create-order.js
exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const missing = [
      !process.env.AIRTABLE_TOKEN && 'AIRTABLE_TOKEN',
      !process.env.AIRTABLE_BASE_ID && 'AIRTABLE_BASE_ID',
      !process.env.AIRTABLE_TABLE_NAME && 'AIRTABLE_TABLE_NAME',
    ].filter(Boolean);
    if (missing.length) {
      console.error('Missing envs:', missing);
      return { statusCode: 500, body: JSON.stringify({ error: 'Missing envs', missing }) };
    }

    const data = JSON.parse(event.body || '{}');
    const trackingCode = Math.random().toString(36).substring(2, 8).toUpperCase();

    const res = await fetch(`https://api.airtable.com/v0/${process.env.AIRTABLE_BASE_ID}/${encodeURIComponent(process.env.AIRTABLE_TABLE_NAME)}`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.AIRTABLE_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        records: [
          {
            fields: {
              Name: data.name,
              Phone: data.phone,
              Email: data.email,
              Flavor: data.flavor,
              Size: data.size,
              Message: data.message || '',
              ImageURL: data.imageUrl || '',
              Status: 'Pending',
              TrackingCode: trackingCode
            }
          }
        ],
        typecast: true
      })
    });

    const body = await res.json();

    if (!res.ok) {
      console.error('Airtable error:', res.status, body);
      return { statusCode: 500, body: JSON.stringify({ error: 'Airtable error', status: res.status, details: body }) };
    }

    return { statusCode: 200, body: JSON.stringify({ trackingCode }) };
  } catch (err) {
    console.error('Handler error:', err);
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
};
