require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const fs = require('fs');
const app = express();
const port = process.env.PORT || 3000; // 3000 varsayılan port

let receivedData = [];
let dataArray = [];
let tempArray = [];

app.get('/config', (req, res) => {
  res.json({ port: port });
});

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
  
  dataArray.push(data);

  writeDataToFile('data.json', jsonDataWithCount);
  let newData = data.data.filter(item => 
    !tempArray.some(existingData => 
      existingData.data.some(existingItem => existingItem.unix === item.unix))
  );

  if (newData.length > 0) {
    data.data = newData;
    tempArray.push(data);
    res.status(201).json({ message: 'Data received', data: data });
  } else {
    res.status(409).json({ message: 'Duplicate data', data: data });
  }
});

app.post('/data1', (req, res) => {
  if (!Array.isArray(req.body)) {
    console.log("Gelen veride hata var!!!");
  }
  receivedData = req.body;
  res.status(200).send('Veri alındı');
});

app.get('/data', (req, res) => {
  if (!Array.isArray(receivedData)) {
    return res.status(400).json({ error: 'Geçersiz veri formatı' });
  }
  console.log(`http://localhost:${process.env.PORT}`);
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

  if (uniqueData.length != 0) {
    const sortedData = uniqueData.sort((a, b) => a.requestTime - b.requestTime);
    res.json(sortedData);
  }
  else{
    const sortedData = tempArray.sort((a, b) => a.requestTime - b.requestTime);
    res.json(sortedData);
  }
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
