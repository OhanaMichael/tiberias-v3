// ████████████████████████████████████████████████████████████████
// 🎯 Admin Dashboard - JavaScript
// ████████████████████████████████████████████████████████████████

let charts = {};
let currentData = null;

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  initDateControls();
  loadDashboard();
});

// Date Controls
function initDateControls() {
  const periodSelect = document.getElementById('periodSelect');
  periodSelect.addEventListener('change', (e) => {
    const isCustom = e.target.value === 'custom';
    document.getElementById('customDates').classList.toggle('hidden', !isCustom);
    document.getElementById('customDatesEnd').classList.toggle('hidden', !isCustom);
    
    if (!isCustom) {
      updateDashboard();
    }
  });
  
  // Set default dates
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - 30);
  
  document.getElementById('startDate').value = formatDate(startDate);
  document.getElementById('endDate').value = formatDate(endDate);
}

function formatDate(date) {
  return date.toISOString().split('T')[0];
}

// Load Dashboard
async function loadDashboard() {
  showLoading(true);
  
  try {
    const { startDate, endDate, hotelId } = getFilters();
    
    // Fetch data from API
    const response = await fetch(`/api/get-analytics?startDate=${startDate}&endDate=${endDate}${hotelId ? '&hotelId=' + hotelId : ''}`);
    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.error || 'Failed to load data');
    }
    
    currentData = data;
    
    // Update UI
    updateKPIs(data.stats);
    updateHotelFilter(data.stats);
    updateCharts(data.stats);
    
  } catch (error) {
    console.error('Error loading dashboard:', error);
    alert('שגיאה בטעינת הנתונים: ' + error.message);
  } finally {
    showLoading(false);
  }
}

function updateDashboard() {
  loadDashboard();
}

// Get Filters
function getFilters() {
  const periodSelect = document.getElementById('periodSelect').value;
  let startDate, endDate;
  
  if (periodSelect === 'custom') {
    startDate = document.getElementById('startDate').value;
    endDate = document.getElementById('endDate').value;
  } else {
    const days = parseInt(periodSelect);
    endDate = new Date();
    startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    
    startDate = formatDate(startDate);
    endDate = formatDate(endDate);
  }
  
  const hotelId = document.getElementById('hotelFilter').value;
  
  return { startDate, endDate, hotelId };
}

// Update KPIs
function updateKPIs(stats) {
  document.getElementById('totalClicks').textContent = stats.total.toLocaleString();
  document.getElementById('uniqueVisitors').textContent = stats.uniqueVisitors.toLocaleString();
  
  // Mobile percentage
  const mobileClicks = stats.byDevice['mobile'] || 0;
  const mobilePercent = stats.total > 0 ? Math.round((mobileClicks / stats.total) * 100) : 0;
  document.getElementById('mobilePercent').textContent = mobilePercent + '%';
  
  // Booking.com clicks
  const bookingClicks = stats.byAction['booking_com'] || 0;
  document.getElementById('bookingClicks').textContent = bookingClicks.toLocaleString();
}

// Update Hotel Filter
function updateHotelFilter(stats) {
  const select = document.getElementById('hotelFilter');
  const currentValue = select.value;
  
  // Clear existing options except first
  select.innerHTML = '<option value="">כל המלונות</option>';
  
  // Add hotel options
  if (stats.topHotels) {
    stats.topHotels.forEach(hotel => {
      const option = document.createElement('option');
      option.value = hotel.id;
      option.textContent = `${hotel.name} (${hotel.count})`;
      select.appendChild(option);
    });
  }
  
  // Restore selection if exists
  if (currentValue) {
    select.value = currentValue;
  }
}

// Update Charts
function updateCharts(stats) {
  updateDailyChart(stats.byDate);
  updateHotelChart(stats.topHotels);
  updateActionChart(stats.byAction);
  updateDeviceChart(stats.byDevice);
  updateSourceChart(stats.bySource);
  updateHourChart(stats.byHour);
}

// Daily Chart
function updateDailyChart(byDate) {
  const ctx = document.getElementById('dailyChart');
  
  if (charts.daily) {
    charts.daily.destroy();
  }
  
  const dates = Object.keys(byDate).sort();
  const values = dates.map(date => byDate[date]);
  
  charts.daily = new Chart(ctx, {
    type: 'line',
    data: {
      labels: dates.map(d => {
        const date = new Date(d);
        return `${date.getDate()}/${date.getMonth() + 1}`;
      }),
      datasets: [{
        label: 'קליקים',
        data: values,
        borderColor: '#667eea',
        backgroundColor: 'rgba(102, 126, 234, 0.1)',
        tension: 0.4,
        fill: true
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false }
      }
    }
  });
}

// Hotel Chart
function updateHotelChart(hotels) {
  const ctx = document.getElementById('hotelChart');
  
  if (charts.hotel) {
    charts.hotel.destroy();
  }
  
  if (!hotels || hotels.length === 0) return;
  
  const labels = hotels.map(h => h.name);
  const values = hotels.map(h => h.count);
  
  charts.hotel = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: labels,
      datasets: [{
        label: 'קליקים',
        data: values,
        backgroundColor: [
          '#667eea',
          '#764ba2',
          '#f093fb',
          '#4facfe',
          '#00f2fe',
          '#43e97b',
          '#fa709a'
        ]
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false }
      }
    }
  });
}

// Action Chart
function updateActionChart(byAction) {
  const ctx = document.getElementById('actionChart');
  
  if (charts.action) {
    charts.action.destroy();
  }
  
  const actionNames = {
    'direct': 'הזמנה ישירה',
    'booking_com': 'Booking.com',
    'phone': 'טלפון',
    'website': 'אתר רשמי',
    'share_whatsapp': 'שיתוף WhatsApp',
    'share_facebook': 'שיתוף Facebook',
    'share_copy': 'העתקת קישור'
  };
  
  const labels = Object.keys(byAction).map(k => actionNames[k] || k);
  const values = Object.values(byAction);
  
  charts.action = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: labels,
      datasets: [{
        data: values,
        backgroundColor: [
          '#667eea',
          '#764ba2',
          '#f093fb',
          '#4facfe',
          '#00f2fe',
          '#43e97b',
          '#fa709a'
        ]
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false
    }
  });
}

// Device Chart
function updateDeviceChart(byDevice) {
  const ctx = document.getElementById('deviceChart');
  
  if (charts.device) {
    charts.device.destroy();
  }
  
  const deviceNames = {
    'mobile': 'נייד',
    'desktop': 'מחשב',
    'tablet': 'טאבלט'
  };
  
  const labels = Object.keys(byDevice).map(k => deviceNames[k] || k);
  const values = Object.values(byDevice);
  
  charts.device = new Chart(ctx, {
    type: 'pie',
    data: {
      labels: labels,
      datasets: [{
        data: values,
        backgroundColor: ['#667eea', '#764ba2', '#f093fb']
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false
    }
  });
}

// Source Chart
function updateSourceChart(bySource) {
  const ctx = document.getElementById('sourceChart');
  
  if (charts.source) {
    charts.source.destroy();
  }
  
  const sourceNames = {
    'google': 'Google',
    'facebook': 'Facebook',
    'instagram': 'Instagram',
    'direct': 'ישיר',
    'other': 'אחר'
  };
  
  const labels = Object.keys(bySource).map(k => sourceNames[k] || k);
  const values = Object.values(bySource);
  
  charts.source = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: labels,
      datasets: [{
        label: 'קליקים',
        data: values,
        backgroundColor: '#667eea'
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      indexAxis: 'y',
      plugins: {
        legend: { display: false }
      }
    }
  });
}

// Hour Chart
function updateHourChart(byHour) {
  const ctx = document.getElementById('hourChart');
  
  if (charts.hour) {
    charts.hour.destroy();
  }
  
  const hours = Array.from({length: 24}, (_, i) => i);
  const values = hours.map(h => byHour[h] || 0);
  
  charts.hour = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: hours.map(h => h + ':00'),
      datasets: [{
        label: 'קליקים',
        data: values,
        backgroundColor: '#764ba2'
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false }
      }
    }
  });
}

// Export to Excel
function exportToExcel() {
  if (!currentData || !currentData.clicks) {
    alert('אין נתונים לייצוא');
    return;
  }
  
  // Create CSV
  const headers = ['תאריך', 'שעה', 'מלון', 'פעולה', 'מכשיר', 'דפדפן', 'עיר'];
  const rows = currentData.clicks.map(c => [
    c.clicked_at?.split('T')[0] || '',
    c.clicked_at?.split('T')[1]?.split('.')[0] || '',
    c.hotel_name || '',
    c.action || '',
    c.device_type || '',
    c.browser || '',
    c.city || ''
  ]);
  
  let csv = headers.join(',') + '\n';
  csv += rows.map(row => row.join(',')).join('\n');
  
  // Download
  const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `analytics-${new Date().toISOString().split('T')[0]}.csv`;
  link.click();
}

// Loading
function showLoading(show) {
  document.getElementById('loading').classList.toggle('hidden', !show);
}
