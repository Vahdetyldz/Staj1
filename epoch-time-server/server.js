const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const fs = require('fs'); // File system modülünü dahil et
const app = express();
const port = 3000;

let receivedData=[];

let dataArray = [];


// Middleware to handle raw JSON data and convert NaN to strings
app.use((req, res, next) => {
  if (req.headers['content-type'] === 'application/json') {
    let data = '';
    req.on('data', chunk => {
      data += chunk;
    });
    req.on('end', () => {
      try {
        // Replace NaN values with "NaN" strings
        data = data.replace(/:\s*NaN/g, ': "NaN"');
        req.body = JSON.parse(data);
        next();
      } catch (e) {
        return res.status(400).json({ error: 'Invalid JSON' });
      }
    });
  } else {
    next();
  }
});

// Statik dosyaları servis et
app.use(express.static(path.join(__dirname, 'public')));

// Ana dizin endpoint'i
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/time', (req, res) => {
  const epochTime = Math.floor(Date.now() / 1000);
  res.json({ epochTime: epochTime });
});

// JSON dosyasına verileri yazma fonksiyonu
const writeDataToFile = (filename, content) => {
  fs.writeFileSync(filename, JSON.stringify(content, null, 2), 'utf8');
};

// JSON dosyasından verileri okuma fonksiyonu
const readDataFromFile = (filename) => {
  if (fs.existsSync(filename)) {
    try {
      const rawData = fs.readFileSync(filename, 'utf8');
      return rawData.length ? JSON.parse(rawData) : { data: [], count: 0 };
    } catch (error) {
      console.error('Error parsing JSON file:', error);
      return { data: [], count: 0 };
    }
  }
  return { data: [], count: 0 };
};

// Sunucu başlatıldığında verileri yükle
const fileData = readDataFromFile('data.json');
dataArray = fileData.data;

app.post('/data', (req, res) => {
  const data = req.body;
  data.requestTime = Date.now();

  // Gelen veriyi JSON dosyasına ekleyin (tekrar eden verileri dikkate almadan)
  let allData = readDataFromFile('data.json').data;
  allData.push(data);

  // Veri sayısını ekleyin
  const dataCount = allData.length;
  const jsonDataWithCount = { data: allData, count: dataCount };

  writeDataToFile('data.json', jsonDataWithCount);

  res.status(201).json({ message: 'Data received', data: data });
});

app.post('/data1', (req, res) => {
  if (!Array.isArray(req.body)) {
    console.log("reqbody de sıkıntı var");
  }
  receivedData = req.body;
  res.status(200).send('Veri alındı');
});

app.get('/data', (req, res) => {
  if (!Array.isArray(receivedData)) {
    return res.status(400).json({ error: 'Geçersiz veri formatı' });
  }
  console.log('Gelen veri (get /data):', JSON.stringify(receivedData, null, 2));

  // Benzersiz unix değerlerini takip etmek için bir Set oluşturun
  const uniqueUnixValues = new Set();
  
  // Benzersiz veri gruplarını tutacak bir dizi oluşturun
  const uniqueData = [];

  // Her bir veri grubunu kontrol edin
  receivedData.forEach(group => {
    // Grup içindeki benzersiz data item'lerini tutacak bir dizi
    const uniqueItems = group.data.filter(item => {
      if (!uniqueUnixValues.has(item.unix)) {
        uniqueUnixValues.add(item.unix);
        return true;
      }
      return false;
    });

    // Eğer benzersiz item'ler varsa, bu grubu ekleyin
    if (uniqueItems.length > 0) {
      uniqueData.push({
        ...group,
        data: uniqueItems,
      });
    }
  });

  // Verileri requestTime'a göre sırala
  const sortedData = uniqueData.sort((a, b) => a.requestTime - b.requestTime);
  
  console.log('Sorted Data:', JSON.stringify(sortedData, null, 2));
  res.json(sortedData);
});



app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});

// bir grubun içindeki tek bir veri aynıysa hiçbir veri ekrana yazdırılmıyor