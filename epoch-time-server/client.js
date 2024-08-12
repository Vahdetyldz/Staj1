require('dotenv').config();
async function fetchModule() {
  return await import('node-fetch');
}

const fs = require('fs');
const filePath = 'data.json';

async function getConfig(fetch) {
  const port = process.env.PORT || 3000;  // process.env.PORT kullanarak port alıyoruz
  const baseUrl = `http://localhost:${port}`;
  const response = await fetch(`${baseUrl}/config`);
  console.log(`http://localhost:${process.env.PORT}`);
  if (!response.ok) {
    throw new Error('Network response for config was not ok');
  }
  return await response.json();
}
fs.readFile(filePath, 'utf8', async (err, data) => {
  if (err) {
    console.error('Dosya okunamadı:', err);
    return;
  }

  try {
    const jsonData = JSON.parse(data);
    if (Array.isArray(jsonData.data)) {
      const fetch = (await fetchModule()).default;
      const config = await getConfig(fetch);
      const baseUrl = `http://localhost:${process.env.PORT || 3000}`;
      await sendData(jsonData.data, fetch, baseUrl);
    } else {
      console.error('Veri array formatında değil');
    }
  } catch (err) {
    console.error('JSON.parse hatası:', err);
  }
});

async function sendData(data, fetch, baseUrl) {
  try {
    const response1 = await fetch(`${baseUrl}/data1`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    });

    if (!response1.ok) {
      throw new Error('Network response for data1 was not ok');
    }

    console.log('Veri başarıyla gönderildi');

  } catch (error) {
    console.error('Veri gönderilirken hata oluştu:', error);
  }
}
