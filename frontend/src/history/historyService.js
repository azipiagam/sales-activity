/**
 * History Service
 * Service untuk mengelola data dan fungsi terkait History
 */

const getHistoryByDate = (date) => {
  const dateKey = formatDateKey(date);
  
  const storedHistory = localStorage.getItem(`history_${dateKey}`);
  
  if (storedHistory) {
    return JSON.parse(storedHistory);
  }
  
  return [];
};

const saveHistory = (historyData, date) => {
  const dateKey = formatDateKey(date);
  const existingHistory = getHistoryByDate(date);
  
  const newHistory = {
    id: Date.now().toString(),
    ...historyData,
    createdAt: new Date().toISOString(),
  };
  
  const updatedHistory = [...existingHistory, newHistory];
  localStorage.setItem(`history_${dateKey}`, JSON.stringify(updatedHistory));
  
  return newHistory;
};

const updateHistory = (historyId, updatedData, date) => {
  const dateKey = formatDateKey(date);
  const existingHistory = getHistoryByDate(date);
  
  const updatedHistory = existingHistory.map(history => 
    history.id === historyId ? { ...history, ...updatedData, updatedAt: new Date().toISOString() } : history
  );
  
  localStorage.setItem(`history_${dateKey}`, JSON.stringify(updatedHistory));
  
  return updatedHistory.find(history => history.id === historyId);
};

const deleteHistory = (historyId, date) => {
  const dateKey = formatDateKey(date);
  const existingHistory = getHistoryByDate(date);
  
  const filteredHistory = existingHistory.filter(history => history.id !== historyId);
  localStorage.setItem(`history_${dateKey}`, JSON.stringify(filteredHistory));
  
  return true;
};

const getHistoryByDateRange = (startDate, endDate) => {
  const allHistory = [];
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    const history = getHistoryByDate(d);
    allHistory.push(...history);
  }
  
  return allHistory.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
};

const getHistoryCount = (date) => {
  const history = getHistoryByDate(date);
  return history.length;
};

const getDoneCount = (date) => {
  const history = getHistoryByDate(date);
  return history.filter(h => h.status === 'done' || h.completed).length;
};

const formatDateKey = (date) => {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const getHistoryStatistics = (date) => {
  const history = getHistoryByDate(date);
  const total = history.length;
  const done = history.filter(h => h.status === 'done' || h.completed).length;
  const pending = total - done;
  
  return {
    total,
    done,
    pending,
  };
};

const getAllHistory = () => {
  const allHistory = [];
  
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith('history_')) {
      const history = JSON.parse(localStorage.getItem(key));
      allHistory.push(...history);
    }
  }
  
  return allHistory.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
};

export {
  getHistoryByDate,
  saveHistory,
  updateHistory,
  deleteHistory,
  getHistoryByDateRange,
  getHistoryCount,
  getDoneCount,
  getHistoryStatistics,
  getAllHistory,
  formatDateKey,
};

