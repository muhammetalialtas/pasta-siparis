exports.handler = async () => {
  // Burada verileri veritabanı veya JSON’dan çekebilirsin
  const orders = [
    { id: 1, name: "Ayşe", cake: "Çikolatalı", status: "Beklemede" },
    { id: 2, name: "Ahmet", cake: "Meyveli", status: "Beklemede" }
  ];
  
  return {
    statusCode: 200,
    body: JSON.stringify({ ok: true, orders })
  };
};
