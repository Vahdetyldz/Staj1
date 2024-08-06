async function fetchDataAndRenderCharts() {
  try {
    const response = await fetch('/data.json');
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();

    // Gelen veriyi konsola yazdırma
    console.log('Received Data:', data);

    // Veriyi benzersiz hale getirme ve tüm verileri birleştirme
    const uniqueData = getUniqueData(data.data);
    const allData = getAllData(uniqueData);

    // Bat_v ve Bat_l için veriyi sıralama
    const sortedRequestTimes = uniqueData.map(item => new Date(item.requestTime).toLocaleString());
    const sortedBatVs = uniqueData.map(item => item.bat_v);
    const sortedBatLs = uniqueData.map(item => item.bat_l);

    // DT, ST ve SH verilerini sıralama
    const sortedDts = allData.dt.sort((a, b) => new Date(a.time) - new Date(b.time));
    const sortedSts = allData.st.sort((a, b) => new Date(a.time) - new Date(b.time));
    const sortedShs = allData.sh.sort((a, b) => new Date(a.time) - new Date(b.time));

    // Grafiklerin güncellenmesi
    updateChart('chartBatteryVoltage', sortedRequestTimes, sortedBatVs, 'Battery Voltage', 'rgba(255, 99, 132, 0.6)');
    updateChart('chartBatteryLevel', sortedRequestTimes, sortedBatLs, 'Battery Level', 'rgba(54, 162, 235, 0.6)');
    updateChart('chartDT', sortedDts.map(d => d.time), sortedDts.map(d => d.dt), 'DT', 'rgba(75, 192, 192, 0.6)');
    updateChart('chartST', sortedSts.map(s => s.time), sortedSts.map(s => s.st), 'ST', 'rgba(153, 102, 255, 0.6)');
    updateChart('chartSH', sortedShs.map(s => s.time), sortedShs.map(s => s.sh), 'SH', 'rgba(255, 159, 64, 0.6)');
  } catch (error) {
    console.error('Error fetching data:', error);
  }
}

// Benzersiz verileri almak için fonksiyon
function getUniqueData(data) {
  const seen = new Set();
  const uniqueData = [];

  data.forEach(item => {
    if (!seen.has(item.requestTime)) {
      seen.add(item.requestTime);
      uniqueData.push(item);
    }
  });

  return uniqueData;
}

// Tüm verileri birleştiren ve en güncel veriyi seçen fonksiyon
function getAllData(data) {
  const dtMap = new Map();
  const stMap = new Map();
  const shMap = new Map();

  data.forEach(item => {
    item.data.forEach(subItem => {
      const unixTime = subItem.unix;
      if (!dtMap.has(unixTime) || dtMap.get(unixTime).timestamp < item.requestTime) {
        dtMap.set(unixTime, { time: new Date(unixTime * 1000).toLocaleString(), dt: subItem.dt, timestamp: item.requestTime });
      }
      if (!stMap.has(unixTime) || stMap.get(unixTime).timestamp < item.requestTime) {
        stMap.set(unixTime, { time: new Date(unixTime * 1000).toLocaleString(), st: subItem.st, timestamp: item.requestTime });
      }
      if (!shMap.has(unixTime) || shMap.get(unixTime).timestamp < item.requestTime) {
        shMap.set(unixTime, { time: new Date(unixTime * 1000).toLocaleString(), sh: subItem.sh, timestamp: item.requestTime });
      }
    });
  });

  // Map nesnelerini dizilere dönüştür
  return {
    dt: Array.from(dtMap.values()),
    st: Array.from(stMap.values()),
    sh: Array.from(shMap.values())
  };
}

// Grafiklerin güncellenmesi
function updateChart(canvasId, labels, data, label, color) {
  const ctx = document.getElementById(canvasId).getContext('2d');
  const chart = Chart.getChart(canvasId); // Mevcut grafiği al
  if (chart) {
    chart.data.labels = labels;
    chart.data.datasets[0].data = data;
    chart.update(); // Grafiği güncelle
  } else {
    createChart(canvasId, labels, data, label, color); // Eğer grafik yoksa yeni grafik oluştur
  }
}

// Grafik oluşturma fonksiyonu
function createChart(canvasId, labels, data, label, color) {
  const ctx = document.getElementById(canvasId).getContext('2d');
  new Chart(ctx, {
    type: 'line',
    data: {
      labels: labels,
      datasets: [{
        label: label,
        data: data,
        backgroundColor: color,
        borderColor: color,
        borderWidth: 2,
        fill: false
      }]
    },
    options: {
      scales: {
        x: {
          ticks: {
            stepSize: 0.1 // remove this line to get autoscaling
          }
        },
        y: {
          beginAtZero: true
        }
      }
    }
  });
}

// Sayfa yüklendiğinde grafik oluşturma fonksiyonunu çağır
window.onload = fetchDataAndRenderCharts;
