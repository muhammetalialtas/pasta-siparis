const Airtable = require('airtable');

exports.handler = async (event) => {
  try {
    const data = JSON.parse(event.body);

    const base = new Airtable({ apiKey: process.env.AIRTABLE_TOKEN })
      .base(process.env.AIRTABLE_BASE_ID);

    const trackingCode = Math.random().toString(36).substring(2, 8).toUpperCase();

    await base(process.env.AIRTABLE_TABLE_NAME).create([
      {
        fields: {
          Name: data.name,
          Phone: data.phone,
          Email: data.email,
          Flavor: data.flavor,
          Size: data.size,
          Message: data.message,
          ImageURL: data.imageUrl || '',
          Status: 'Pending',
          TrackingCode: trackingCode
        }
      }
    ]);

    return {
      statusCode: 200,
      body: JSON.stringify({ success: true, trackingCode })
    };
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
};
