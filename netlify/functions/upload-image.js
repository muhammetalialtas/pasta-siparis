const { google } = require("googleapis");

async function getSheets() {
  const auth = new google.auth.JWT(
    process.env.GOOGLE_CLIENT_EMAIL,
    null,
    process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
    ["https://www.googleapis.com/auth/spreadsheets"]
  );
  return google.sheets({ version: "v4", auth });
}

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  const key = event.headers["x-admin-key"];
  if (key !== process.env.ADMIN_KEY) {
    return { statusCode: 401, body: JSON.stringify({ ok: false, error: "unauthorized" }) };
  }

  try {
    const { id } = JSON.parse(event.body || "{}");
    if (!id) return { statusCode: 400, body: JSON.stringify({ ok: false, error: "id gerekli" }) };

    const sheets = await getSheets();
    const getRes = await sheets.spreadsheets.values.get({
      spreadsheetId: process.env.SHEET_ID,
      range: "Sayfa1!A2:E"
    });

    const rows = getRes.data.values || [];
    const rowIndex = rows.findIndex(r => r[0] === String(id));
    if (rowIndex === -1) throw new Error("Sipariş bulunamadı");

    rows[rowIndex][3] = "Reddedildi"; // D sütunu: status

    await sheets.spreadsheets.values.update({
      spreadsheetId: process.env.SHEET_ID,
      range: `Sayfa1!A${rowIndex + 2}:E${rowIndex + 2}`,
      valueInputOption: "RAW",
      requestBody: { values: [rows[rowIndex]] }
    });

    return { statusCode: 200, body: JSON.stringify({ ok: true, message: `Sipariş ${id} reddedildi` }) };
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ ok: false, error: err.message }) };
  }
};
