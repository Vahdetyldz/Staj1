const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const fs = require('fs');
const app = express();
const port = 3003;

let receivedData = [];
let dataArray = [];

app.use((req, res, next) => {
  if (req.headers['content-type'] === 'application/json') {
    let data = '';
    req.on('data', chunk => {
      data += chunk;
    });
    req.on('end', () => {
      try {
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

app.use(express.static(path.join(__dirname, 'public')));

app.get('/config', (req, res) => {
  res.json({
    baseUrl: `http://localhost:${port}`
  });
});


app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/time', (req, res) => {
  const epochTime = Math.floor(Date.now() / 1000);
  res.json({ epochTime: epochTime });
});

const writeDataToFile = (filename, content) => {
  fs.writeFileSync(filename, JSON.stringify(content, null, 2), 'utf8');
};

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

const fileData = readDataFromFile('data.json');
dataArray = fileData.data;

app.post('/data', (req, res) => {
  const data = req.body;
  data.requestTime = Date.now();

  let allData = readDataFromFile('data.json').data;
  allData.push(data);

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

  const uniqueUnixValues = new Set();

  const uniqueData = [];

  receivedData.forEach(group => {
    const uniqueItems = group.data.filter(item => {
      if (!uniqueUnixValues.has(item.unix)) {
        uniqueUnixValues.add(item.unix);
        return true;
      }
      return false;
    });

    if (uniqueItems.length > 0) {
      uniqueData.push({
        ...group,
        data: uniqueItems,
      });
    }
  });

  const sortedData = uniqueData.sort((a, b) => a.requestTime - b.requestTime);

  console.log('Sorted Data:', JSON.stringify(sortedData, null, 2));
  res.json(sortedData);
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
