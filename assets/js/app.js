const API_BASE_URL = 'http://localhost:4000/api';
const STORAGE_KEY = 'uvisionCurrentUser';
const chartInstances = {};

document.addEventListener('DOMContentLoaded', async () => {
  const state = createDemoState();

  await bindLivePreview(state);
  await initAuthPage();
  await initDashboard(state);
  await initTrackerPage();
  await initProfilePage();
  await initAiPage();
  await initHealthPage(state);
  await initAdminPage();
  initForms();
});

function createDemoState() {
  const baseUv = 6.2;
  const times = [];
  const uvSeries = [];
  const vitaminSeries = [];

  for (let i = 49; i >= 0; i -= 1) {
    const time = new Date(Date.now() - i * 5 * 60 * 1000);
    const uv = Number((baseUv + Math.sin(i / 5) * 1.2 + (Math.random() * 0.8 - 0.4)).toFixed(1));
    times.push(formatTimeLabel(time));
    uvSeries.push(Math.max(0.5, uv));
  }

  for (let i = 6; i >= 0; i -= 1) {
    vitaminSeries.push(Number((420 + (6 - i) * 35 + Math.random() * 80).toFixed(0)));
  }

  return {
    currentUv: uvSeries[uvSeries.length - 1],
    recommendedMinutes: 18,
    vitaminDToday: 680,
    riskLevel: 'Moderate',
    liveValue: Number((3.2 + Math.random() * 5).toFixed(1)),
    times,
    uvSeries,
    vitaminSeries,
    healthSeries: [18, 21, 24, 28, 30, 34]
  };
}

async function bindLivePreview(state) {
  const uvElements = document.querySelectorAll('[data-live-uv]');
  const timeElements = document.querySelectorAll('[data-live-time]');
  if (!uvElements.length && !timeElements.length) {
    return;
  }

  const updateLive = async () => {
    let uvIndex = state.liveValue;
    let recordedAt = new Date();

    try {
      const response = await apiRequest('/uv/latest');
      if (response && response.data) {
        uvIndex = Number(response.data.uv_index || state.liveValue);
        recordedAt = new Date(response.data.recorded_at || Date.now());
      } else {
        uvIndex = Number((2.8 + Math.random() * 6).toFixed(1));
      }
    } catch (error) {
      uvIndex = Number((2.8 + Math.random() * 6).toFixed(1));
    }

    uvElements.forEach((element) => {
      element.textContent = Number(uvIndex).toFixed(1);
    });
    timeElements.forEach((element) => {
      element.textContent = recordedAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    });
  };

  await updateLive();
  setInterval(updateLive, 5000);
}

async function initAuthPage() {
  if (document.body.dataset.page !== 'auth') {
    return;
  }

  const loginForm = document.getElementById('loginForm');
  const signupForm = document.getElementById('signupForm');

  if (loginForm) {
    loginForm.addEventListener('submit', async (event) => {
      event.preventDefault();

      const payload = {
        email: document.getElementById('loginEmail').value.trim(),
        password: document.getElementById('loginPassword').value
      };

      const messageEl = document.getElementById('loginMessage');

      try {
        const response = await apiRequest('/auth/login', {
          method: 'POST',
          body: JSON.stringify(payload)
        });

        if (!response.success) {
          throw new Error(response.message || 'Login failed');
        }

        saveCurrentUser(response.user);
        showMessage(messageEl, `Login successful. Welcome ${response.user.name}. Redirecting to dashboard...`, 'success');
        setTimeout(() => {
          window.location.href = '/pages/dashboard.html';
        }, 900);
      } catch (error) {
        showMessage(messageEl, error.message || 'Unable to login right now.', 'danger');
      }
    });
  }

  if (signupForm) {
    signupForm.addEventListener('submit', async (event) => {
      event.preventDefault();

      const payload = {
        name: document.getElementById('signupName').value.trim(),
        email: document.getElementById('signupEmail').value.trim(),
        age: Number(document.getElementById('signupAge').value),
        gender: document.getElementById('signupGender').value,
        skin_type: document.getElementById('signupSkinType').value,
        lifestyle: document.getElementById('signupLifestyle').value,
        password: document.getElementById('signupPassword').value
      };

      const messageEl = document.getElementById('signupMessage');

      try {
        const response = await apiRequest('/auth/signup', {
          method: 'POST',
          body: JSON.stringify(payload)
        });

        if (!response.success) {
          throw new Error(response.message || 'Signup failed');
        }

        showMessage(messageEl, 'Account created successfully. You can now log in with the same email and password.', 'success');
        signupForm.reset();
      } catch (error) {
        showMessage(messageEl, error.message || 'Unable to create account right now.', 'danger');
      }
    });
  }
}

async function initDashboard(state) {
  if (document.body.dataset.page !== 'dashboard') {
    return;
  }

  const currentUser = getCurrentUser();
  const userId = currentUser?.id || 1;

  if (currentUser) {
    setText('activeUserLabel', `Showing data for ${currentUser.name}`);
  }

  renderDashboardFallback(state);
  renderMlPredictionFallback();

  try {
    const [latestUv, uvHistory, recommendation, exposureLogs, mlPrediction] = await Promise.all([
      apiRequest('/uv/latest'),
      apiRequest('/uv/history?limit=50'),
      apiRequest(`/recommendations/latest/${userId}`),
      apiRequest(`/exposure?userId=${userId}`),
      apiRequest('/predict/latest')
    ]);

    if (latestUv?.data) {
      const uvIndex = Number(latestUv.data.uv_index);
      setText('currentUvIndex', uvIndex.toFixed(1));
      setText('liveUvValue', uvIndex.toFixed(1));
      setText('dashboardUpdateTime', new Date(latestUv.data.recorded_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
      updateRiskDisplay(uvIndex);
    }

    if (uvHistory?.data?.length) {
      const chartRows = [...uvHistory.data].reverse();
      renderLineChart(
        'uvChart',
        chartRows.map((item) => formatTimeLabel(item.recorded_at)),
        chartRows.map((item) => Number(item.uv_index)),
        'UV Index',
        '#f7b500',
        'rgba(247,181,0,0.18)'
      );
    }

    if (recommendation?.data) {
      const item = recommendation.data;
      setText('recommendedExposure', `${item.duration_minutes} min`);
      setText('bestTimeWindow', `${formatClockTime(item.recommended_time_start)} - ${formatClockTime(item.recommended_time_end)}`);
      setText('recommendationDuration', `${item.duration_minutes} minutes`);
      setText('expectedVitaminD', `${Math.round(Number(item.expected_vitamin_d))} IU`);
      setText('riskLevelText', item.risk_level);
      updateRiskBadge(item.risk_level);
    }

    if (exposureLogs?.data?.length) {
      renderExposureHistory(exposureLogs.data);
      const vitaminTotal = exposureLogs.data.reduce((sum, item) => sum + Number(item.vitamin_d_generated || 0), 0);
      setText('estimatedVitaminD', `${Math.round(vitaminTotal)} IU`);
      renderWeeklyChartFromExposure(exposureLogs.data, state);
    }

    if (mlPrediction?.data) {
      updateMlPredictionCard(mlPrediction.data);
    }

    setText('bodyAreaAssumption', 'Based on saved exposure logs');
  } catch (error) {
    console.warn('Dashboard fallback mode active:', error.message);
  }

  setInterval(async () => {
    try {
      const [latestUv, mlPrediction] = await Promise.all([
        apiRequest('/uv/latest'),
        apiRequest('/predict/latest')
      ]);

      if (latestUv?.data) {
        const uvIndex = Number(latestUv.data.uv_index);
        setText('liveUvValue', uvIndex.toFixed(1));
        setText('currentUvIndex', uvIndex.toFixed(1));
        setText('dashboardUpdateTime', new Date(latestUv.data.recorded_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
        updateRiskDisplay(uvIndex);
      }

      if (mlPrediction?.data) {
        updateMlPredictionCard(mlPrediction.data);
      }
    } catch (error) {
      console.warn('Live UV refresh failed:', error.message);
    }
  }, 5000);
}

async function initTrackerPage() {
  if (document.body.dataset.page !== 'tracker') {
    return;
  }

  const currentUser = getCurrentUser();
  const userId = currentUser?.id || 1;
  const form = document.getElementById('exposureForm');
  const messageEl = document.getElementById('trackerMessage');

  await loadExposureSummary(userId);

  if (!form) {
    return;
  }

  form.addEventListener('submit', async (event) => {
    event.preventDefault();

    const exposureDate = document.getElementById('exposureDate').value;
    const startTime = document.getElementById('exposureStartTime').value;
    const endTime = document.getElementById('exposureEndTime').value;
    const durationMinutes = calculateDurationMinutes(startTime, endTime);

    if (durationMinutes <= 0) {
      showMessage(messageEl, 'End time must be later than start time.', 'danger');
      return;
    }

    const payload = {
      user_id: userId,
      exposure_date: exposureDate,
      start_time: `${startTime}:00`,
      end_time: `${endTime}:00`,
      duration_minutes: durationMinutes,
      body_area_exposed: document.getElementById('bodyAreaExposed').value,
      sunscreen_used: document.getElementById('sunscreenUsed').value === 'Yes',
      vitamin_d_generated: estimateVitaminDFromMinutes(durationMinutes)
    };

    try {
      const response = await apiRequest('/exposure', {
        method: 'POST',
        body: JSON.stringify(payload)
      });

      if (!response.success) {
        throw new Error(response.message || 'Unable to save exposure log');
      }

      showMessage(messageEl, 'Exposure log saved successfully to the backend database.', 'success');
      await loadExposureSummary(userId);
    } catch (error) {
      showMessage(messageEl, error.message || 'Unable to save exposure log.', 'danger');
    }
  });
}

async function initProfilePage() {
  if (document.body.dataset.page !== 'profile') {
    return;
  }

  const currentUser = getCurrentUser();
  const userId = currentUser?.id || 1;
  const form = document.getElementById('profileForm');
  const messageEl = document.getElementById('profileMessage');

  await loadProfileData(userId);

  if (!form) {
    return;
  }

  form.addEventListener('submit', async (event) => {
    event.preventDefault();

    const payload = {
      name: document.getElementById('profileName').value.trim(),
      email: document.getElementById('profileEmail').value.trim(),
      age: Number(document.getElementById('profileAge').value),
      gender: document.getElementById('profileGender').value,
      skin_type: normalizeSkinType(document.getElementById('profileSkinType').value),
      lifestyle: document.getElementById('profileLifestyle').value,
      vitamin_d_level: Number(document.getElementById('profileVitaminDLevel').value || 0)
    };

    try {
      const response = await apiRequest(`/users/${userId}`, {
        method: 'PUT',
        body: JSON.stringify(payload)
      });

      if (!response.success) {
        throw new Error(response.message || 'Unable to update profile');
      }

      if (currentUser) {
        saveCurrentUser({
          ...currentUser,
          name: payload.name,
          email: payload.email
        });
      }

      showMessage(messageEl, 'Profile updated successfully.', 'success');
      await loadProfileData(userId);
    } catch (error) {
      showMessage(messageEl, error.message || 'Unable to update profile.', 'danger');
    }
  });
}

async function initAiPage() {
  if (document.body.dataset.page !== 'ai') {
    return;
  }

  const form = document.getElementById('aiForm');
  if (!form) {
    return;
  }

  const currentUser = getCurrentUser();
  const userId = currentUser?.id || 1;
  const messageEl = document.getElementById('aiMessage');

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const uv = Number(document.getElementById('inputUv').value);
    const duration = Number(document.getElementById('inputDuration').value);
    const skinType = document.getElementById('inputSkin').value.trim();
    const factorMap = {
      Sensitive: 1.2,
      Combination: 1.1,
      Normal: 1.0,
      Oily: 0.9,
      Dry: 0.95
    };

    try {
      const profile = await apiRequest(`/users/${userId}`);

      const response = await apiRequest(`/recommendations/calculate/${userId}`, {
        method: 'POST',
        body: JSON.stringify({
          exposure_duration: duration,
          uv_index_override: uv,
          skin_type_override: skinType,
          lifestyle_override: profile?.data?.lifestyle || 'Indoor'
        })
      });

      const result = response?.data?.calculation;

      if (!result) {
        throw new Error('No AI result returned');
      }

      setText('aiEstimatedValue', `${result.estimated_vitamin_d} IU`);
      setText('aiSafeDuration', `${result.safe_duration} min`);
      setText('aiRiskValue', result.risk_level);
      showMessage(messageEl, 'Prediction generated by the Python AI module and stored in the database.', 'success');
    } catch (error) {
      const estimated = Math.round(uv * duration * factorMap[skinType] * 8);
      const safe = Math.max(10, Math.round(30 - uv - (1.2 - factorMap[skinType]) * 10));
      const risk = uv >= 8 ? 'High' : uv >= 5 ? 'Moderate' : 'Low';

      setText('aiEstimatedValue', `${estimated} IU`);
      setText('aiSafeDuration', `${safe} min`);
      setText('aiRiskValue', risk);
      showMessage(messageEl, `Backend AI unavailable, showing browser fallback result. ${error.message}`, 'warning');
    }
  });
}

async function initHealthPage(state) {
  if (document.body.dataset.page !== 'health') {
    return;
  }

  renderLineChart('healthChart', ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'], state.healthSeries, 'Vitamin D Lab Value', '#0f6cbd', 'rgba(15,108,189,0.14)');

  const currentUser = getCurrentUser();
  const userId = currentUser?.id || 1;
  const form = document.getElementById('healthForm');
  const messageEl = document.getElementById('healthMessage');

  await loadHealthData(userId, state);

  if (!form) {
    return;
  }

  form.addEventListener('submit', async (event) => {
    event.preventDefault();

    const payload = {
      user_id: userId,
      test_date: document.getElementById('labTestDate').value,
      vitamin_d_value: Number(document.getElementById('labVitaminDValue').value),
      notes: document.getElementById('labNotes').value.trim()
    };

    try {
      const response = await apiRequest('/health-data/lab-results', {
        method: 'POST',
        body: JSON.stringify(payload)
      });

      if (!response.success) {
        throw new Error(response.message || 'Unable to save lab result');
      }

      showMessage(messageEl, 'Lab result saved successfully.', 'success');
      form.reset();
      await loadHealthData(userId, state);
    } catch (error) {
      showMessage(messageEl, error.message || 'Unable to save lab result.', 'danger');
    }
  });
}

async function initAdminPage() {
  if (document.body.dataset.page !== 'admin') {
    return;
  }

  const messageEl = document.getElementById('adminMessage');
  const recalculateButton = document.getElementById('recalculateButton');

  await loadAdminData();

  if (recalculateButton) {
    recalculateButton.addEventListener('click', async () => {
      try {
        const response = await apiRequest('/admin/recalculate', {
          method: 'POST',
          body: JSON.stringify({})
        });

        showMessage(messageEl, response.message || 'Recalculation triggered.', 'success');
        setText('adminLastSync', new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
      } catch (error) {
        showMessage(messageEl, error.message || 'Unable to trigger recalculation.', 'danger');
      }
    });
  }
}

function initForms() {
  document.querySelectorAll('[data-demo-submit]').forEach((form) => {
    form.addEventListener('submit', (event) => {
      event.preventDefault();
      const target = document.getElementById(form.dataset.demoSubmit);
      if (target) {
        showMessage(target, 'Demo form saved successfully. Backend connection for this page will be added next.', 'success');
      }
    });
  });
}

async function loadExposureSummary(userId) {
  try {
    const response = await apiRequest(`/exposure?userId=${userId}`);
    if (!response?.data?.length) {
      return;
    }

    const today = new Date().toISOString().slice(0, 10);
    const todayRows = response.data.filter((item) => String(item.exposure_date).slice(0, 10) === today);
    const totalMinutes = todayRows.reduce((sum, item) => sum + Number(item.duration_minutes || 0), 0);
    const totalVitaminD = todayRows.reduce((sum, item) => sum + Number(item.vitamin_d_generated || 0), 0);

    setText('todaySessions', String(todayRows.length));
    setText('todayExposureMinutes', `${totalMinutes} min`);
    setText('todayVitaminD', `${Math.round(totalVitaminD)} IU`);
  } catch (error) {
    console.warn('Exposure summary fallback mode active:', error.message);
  }
}

async function loadProfileData(userId) {
  try {
    const response = await apiRequest(`/users/${userId}`);
    if (!response?.data) {
      return;
    }

    const user = response.data;
    const normalizedSkinType = normalizeSkinType(user.skin_type);
    setText('profileSummaryName', user.name);
    setText('profileSummaryEmail', user.email);
    setText('profileSummaryAge', String(user.age));
    setText('profileSummarySkinType', normalizedSkinType);
    setText('profileSummaryLifestyle', user.lifestyle);
    setText('profileSummaryStatus', getVitaminStatusLabel(user.vitamin_d_level));

    setInputValue('profileName', user.name);
    setInputValue('profileEmail', user.email);
    setInputValue('profileAge', user.age);
    setInputValue('profileGender', user.gender);
    setInputValue('profileSkinType', normalizedSkinType);
    setInputValue('profileLifestyle', user.lifestyle);
    setInputValue('profileVitaminDLevel', user.vitamin_d_level || '');
  } catch (error) {
    console.warn('Profile fallback mode active:', error.message);
  }
}

async function loadHealthData(userId, state) {
  try {
    const response = await apiRequest(`/health-data/lab-results/${userId}`);
    if (!response?.data?.length) {
      return;
    }

    const rows = response.data;
    const latest = rows[rows.length - 1];
    const labels = rows.map((row) => formatShortDate(row.test_date));
    const values = rows.map((row) => Number(row.vitamin_d_value));

    setText('healthLatestValue', String(latest.vitamin_d_value));
    setText('healthStatusValue', getVitaminStatusLabel(latest.vitamin_d_value));
    setText('healthStatusNote', getVitaminStatusNote(latest.vitamin_d_value));

    renderLineChart('healthChart', labels, values, 'Vitamin D Lab Value', '#0f6cbd', 'rgba(15,108,189,0.14)');
    renderHealthHistory(rows);
  } catch (error) {
    console.warn('Health fallback mode active:', error.message);
    renderLineChart('healthChart', ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'], state.healthSeries, 'Vitamin D Lab Value', '#0f6cbd', 'rgba(15,108,189,0.14)');
  }
}

async function loadAdminData() {
  try {
    const [summary, users, uvLogs] = await Promise.all([
      apiRequest('/admin/summary'),
      apiRequest('/admin/users'),
      apiRequest('/admin/uv-logs?limit=10')
    ]);

    if (summary?.data) {
      setText('adminUserCount', String(summary.data.total_users));
      setText('adminUvLogCount', String(summary.data.total_uv_logs));
      setText('adminSystemStatus', 'Online');
      setText('adminArduinoStatus', 'Awaiting integration');
      setText('adminDatabaseStatus', 'Connected');
      setText('adminAiStatus', 'Backend scaffold active');
      if (summary.data.last_recommendation_time) {
        setText('adminLastSync', new Date(summary.data.last_recommendation_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
      }
    }

    if (users?.data?.length) {
      renderAdminUsers(users.data);
    }

    if (uvLogs?.data?.length) {
      renderAdminUvLogs(uvLogs.data);
    }
  } catch (error) {
    console.warn('Admin fallback mode active:', error.message);
    setText('adminDatabaseStatus', 'Unavailable');
    setText('adminSystemStatus', 'Fallback mode');
  }
}

function renderDashboardFallback(state) {
  setText('currentUvIndex', state.currentUv.toFixed(1));
  setText('recommendedExposure', `${state.recommendedMinutes} min`);
  setText('estimatedVitaminD', `${state.vitaminDToday} IU`);
  setText('riskLevelText', state.riskLevel);
  setText('liveUvValue', state.liveValue.toFixed(1));
  setText('dashboardUpdateTime', new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
  updateRiskBadge(state.riskLevel);
  renderLineChart('uvChart', state.times, state.uvSeries, 'UV Index', '#f7b500', 'rgba(247,181,0,0.18)');
  renderBarChart('weeklyChart', ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'], state.vitaminSeries, 'Vitamin D (IU)', '#0f6cbd');
}

function renderMlPredictionFallback() {
  setText('mlPredictedUv', '--');
  setText('mlPredictionSource', 'ML service not loaded yet');
  setText('mlPredictionUpdatedAt', '--');
}

function updateMlPredictionCard(data) {
  const predictedUv = Number(data.uv_prediction);
  const source = [data.location_name, data.region].filter(Boolean).join(', ');

  setText('mlPredictedUv', Number.isFinite(predictedUv) ? predictedUv.toFixed(2) : '--');
  setText('mlPredictionSource', source || 'India weather dataset');
  setText('mlPredictionUpdatedAt', data.last_updated ? formatDateTime(data.last_updated) : '--');
}

function renderExposureHistory(rows) {
  const tableBody = document.getElementById('exposureHistoryTableBody');
  if (!tableBody) {
    return;
  }

  tableBody.innerHTML = rows.slice(0, 10).map((row) => `
    <tr>
      <td>${String(row.exposure_date).slice(0, 10)}</td>
      <td>${formatClockTime(row.start_time)}</td>
      <td>${formatClockTime(row.end_time)}</td>
      <td>${row.duration_minutes} min</td>
      <td>${row.body_area_exposed}</td>
      <td>${row.sunscreen_used ? 'Yes' : 'No'}</td>
      <td>${Math.round(Number(row.vitamin_d_generated || 0))} IU</td>
    </tr>
  `).join('');
}

function renderWeeklyChartFromExposure(rows, state) {
  const byDate = {};
  rows.forEach((row) => {
    const date = String(row.exposure_date).slice(0, 10);
    byDate[date] = (byDate[date] || 0) + Number(row.vitamin_d_generated || 0);
  });

  const dates = Object.keys(byDate).sort().slice(-7);
  if (!dates.length) {
    renderBarChart('weeklyChart', ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'], state.vitaminSeries, 'Vitamin D (IU)', '#0f6cbd');
    return;
  }

  renderBarChart(
    'weeklyChart',
    dates.map((date) => formatShortDate(date)),
    dates.map((date) => Math.round(byDate[date])),
    'Vitamin D (IU)',
    '#0f6cbd'
  );
}

function renderHealthHistory(rows) {
  const tableBody = document.getElementById('healthHistoryTableBody');
  if (!tableBody) {
    return;
  }

  tableBody.innerHTML = rows.slice().reverse().map((row) => `
    <tr>
      <td>${String(row.test_date).slice(0, 10)}</td>
      <td>${Number(row.vitamin_d_value).toFixed(1)} ng/mL</td>
      <td>${row.notes || '-'}</td>
    </tr>
  `).join('');
}

function renderAdminUsers(rows) {
  const tableBody = document.getElementById('adminUsersTableBody');
  if (!tableBody) {
    return;
  }

  tableBody.innerHTML = rows.map((row) => `
    <tr>
      <td>${row.name}</td>
      <td>${row.skin_type}</td>
      <td>${row.lifestyle}</td>
      <td><span class="status-pill ${getStatusToneClass(row.status)}">${row.status}</span></td>
    </tr>
  `).join('');
}

function renderAdminUvLogs(rows) {
  const tableBody = document.getElementById('adminUvLogsTableBody');
  if (!tableBody) {
    return;
  }

  tableBody.innerHTML = rows.map((row) => `
    <tr>
      <td>${row.id}</td>
      <td>${Number(row.uv_value).toFixed(2)}</td>
      <td>${Number(row.uv_index).toFixed(1)}</td>
      <td>${formatDateTime(row.recorded_at)}</td>
      <td>Stored</td>
    </tr>
  `).join('');
}

function updateRiskDisplay(uvIndex) {
  if (uvIndex >= 8) {
    setText('riskLevelText', 'High');
    updateRiskBadge('High');
    setLiveRiskStatus('High exposure warning', 'risk-high');
  } else if (uvIndex <= 2) {
    setText('riskLevelText', 'Low');
    updateRiskBadge('Low');
    setLiveRiskStatus('Low UV, limited synthesis', 'risk-low');
  } else {
    setText('riskLevelText', 'Moderate');
    updateRiskBadge('Moderate');
    setLiveRiskStatus('Balanced window', 'risk-moderate');
  }
}

function updateRiskBadge(riskLevel) {
  const riskBadge = document.getElementById('riskBadge');
  if (!riskBadge) {
    return;
  }

  const normalized = String(riskLevel).toLowerCase();
  const className = normalized === 'high' ? 'risk-high' : normalized === 'low' ? 'risk-low' : 'risk-moderate';
  riskBadge.className = `risk-pill ${className}`;
  riskBadge.textContent = riskLevel;
}

function setLiveRiskStatus(text, toneClass) {
  const liveStatus = document.getElementById('liveRiskStatus');
  if (!liveStatus) {
    return;
  }

  liveStatus.textContent = text;
  liveStatus.className = `risk-pill ${toneClass}`;
}

async function apiRequest(path, options = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {})
    },
    ...options
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(data?.message || `Request failed with status ${response.status}`);
  }

  return data;
}

function getCurrentUser() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY));
  } catch (error) {
    return null;
  }
}

function saveCurrentUser(user) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
}

function showMessage(element, text, tone = 'success') {
  if (!element) {
    return;
  }

  element.textContent = text;
  element.className = `alert alert-${tone} mt-3 mb-0`;
}

function setInputValue(id, value) {
  const element = document.getElementById(id);
  if (element) {
    element.value = value;
  }
}

function calculateDurationMinutes(startTime, endTime) {
  const [startHour, startMinute] = startTime.split(':').map(Number);
  const [endHour, endMinute] = endTime.split(':').map(Number);
  return (endHour * 60 + endMinute) - (startHour * 60 + startMinute);
}

function estimateVitaminDFromMinutes(durationMinutes) {
  return Math.round(durationMinutes * 36);
}

function formatClockTime(value) {
  if (!value) {
    return '--';
  }

  const raw = String(value).slice(0, 8);
  const [hours, minutes] = raw.split(':').map(Number);
  const date = new Date();
  date.setHours(hours, minutes, 0, 0);
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function formatTimeLabel(value) {
  return new Date(value).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function formatShortDate(value) {
  return new Date(value).toLocaleDateString([], { month: 'short', day: 'numeric' });
}

function formatDateTime(value) {
  return new Date(value).toLocaleString([], {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
}

function getVitaminStatusLabel(value) {
  const numeric = Number(value || 0);
  if (numeric >= 30) {
    return 'Healthy';
  }
  if (numeric >= 20) {
    return 'Low';
  }
  return 'Deficient';
}

function getVitaminStatusNote(value) {
  const numeric = Number(value || 0);
  if (numeric >= 30) {
    return 'Healthy range';
  }
  if (numeric >= 20) {
    return 'Needs improvement';
  }
  return 'Urgent follow-up suggested';
}

function getStatusToneClass(status) {
  if (status === 'Healthy') {
    return 'risk-low';
  }
  if (status === 'Deficient') {
    return 'risk-high';
  }
  return 'risk-moderate';
}

function renderLineChart(canvasId, labels, data, label, borderColor, backgroundColor) {
  const element = document.getElementById(canvasId);
  if (!element || typeof Chart === 'undefined') {
    return;
  }

  if (chartInstances[canvasId]) {
    chartInstances[canvasId].destroy();
  }

  chartInstances[canvasId] = new Chart(element, {
    type: 'line',
    data: {
      labels,
      datasets: [{
        label,
        data,
        tension: 0.35,
        fill: true,
        borderColor,
        backgroundColor,
        borderWidth: 3,
        pointRadius: 2.5,
        pointHoverRadius: 4
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: true } },
      scales: {
        y: { beginAtZero: true, grid: { color: 'rgba(17, 68, 119, 0.08)' } },
        x: { grid: { display: false } }
      }
    }
  });
}

function renderBarChart(canvasId, labels, data, label, backgroundColor) {
  const element = document.getElementById(canvasId);
  if (!element || typeof Chart === 'undefined') {
    return;
  }

  if (chartInstances[canvasId]) {
    chartInstances[canvasId].destroy();
  }

  chartInstances[canvasId] = new Chart(element, {
    type: 'bar',
    data: {
      labels,
      datasets: [{
        label,
        data,
        backgroundColor,
        borderRadius: 12
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: true } },
      scales: {
        y: { beginAtZero: true, grid: { color: 'rgba(17, 68, 119, 0.08)' } },
        x: { grid: { display: false } }
      }
    }
  });
}

function normalizeSkinType(value) {
  const mapping = {
    'Type I': 'Sensitive',
    'Type II': 'Combination',
    'Type III': 'Normal',
    'Type IV': 'Oily',
    'Type V': 'Dry',
    'Type VI': 'Dry'
  };

  return mapping[value] || value || 'Normal';
}

function setText(id, value) {
  const element = document.getElementById(id);
  if (element) {
    element.textContent = value;
  }
}
