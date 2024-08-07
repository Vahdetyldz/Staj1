const fs = require('fs');

// JSON dosyasının yolunu belirtin
const filePath = 'data.json';

// JSON dosyasını oku ve doğru formatta olup olmadığını kontrol et
fs.readFile(filePath, 'utf8', (err, data) => {
  if (err) {
    console.error('Dosya okunamadı:', err);
    return;
  }

  try {
    const jsonData = JSON.parse(data);
    // Verinin array olup olmadığını kontrol et
    if (Array.isArray(jsonData.data)) {
      sendData(jsonData.data);
    } else {
      console.error('Veri array formatında değil');
    }
  } catch (err) {
    console.error('JSON.parse hatası:', err);
  }
});

// Veri gönder
async function sendData(data) {
  try {
    // Veriyi gönder
    const response1 = await fetch('http://localhost:3000/data1', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    });

    if (!response1.ok) {
      throw new Error('Network response for exampleData was not ok');
    }

    console.log('Veri başarıyla gönderildi');

  } catch (error) {
    console.error('Error sending data:', error);
  }
}
