/**
 * Plan Service
 * Service untuk mengelola data dan fungsi terkait Plan
 */

const getPlansByDate = (date) => {
  const dateKey = formatDateKey(date);
  
  const storedPlans = localStorage.getItem(`plans_${dateKey}`);
  
  if (storedPlans) {
    return JSON.parse(storedPlans);
  }
  
  return [];
};

const savePlan = (planData, date) => {
  const dateKey = formatDateKey(date);
  const existingPlans = getPlansByDate(date);
  
  const newPlan = {
    id: Date.now().toString(),
    ...planData,
    createdAt: new Date().toISOString(),
  };
  
  const updatedPlans = [...existingPlans, newPlan];
  localStorage.setItem(`plans_${dateKey}`, JSON.stringify(updatedPlans));
  
  return newPlan;
};

// Update plan
const updatePlan = (planId, updatedData, date) => {
  const dateKey = formatDateKey(date);
  const existingPlans = getPlansByDate(date);
  
  const updatedPlans = existingPlans.map(plan => 
    plan.id === planId ? { ...plan, ...updatedData, updatedAt: new Date().toISOString() } : plan
  );
  
  localStorage.setItem(`plans_${dateKey}`, JSON.stringify(updatedPlans));
  
  return updatedPlans.find(plan => plan.id === planId);
};

// Hapus plan
const deletePlan = (planId, date) => {
  const dateKey = formatDateKey(date);
  const existingPlans = getPlansByDate(date);
  
  const filteredPlans = existingPlans.filter(plan => plan.id !== planId);
  localStorage.setItem(`plans_${dateKey}`, JSON.stringify(filteredPlans));
  
  return true;
};

// Hitung Plan
const getPlanCount = (date) => {
  const plans = getPlansByDate(date);
  return plans.length;
};

// Total Done
const getDoneCount = (date) => {
  const plans = getPlansByDate(date);
  return plans.filter(plan => plan.status === 'done' || plan.completed).length;
};

// Format key (YYYY-MM-DD)
const formatDateKey = (date) => {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const getPlanStatistics = (date) => {
  const plans = getPlansByDate(date);
  const total = plans.length;
  const done = plans.filter(plan => plan.status === 'done' || plan.completed).length;
  const pending = total - done;
  
  return {
    total,
    done,
    pending,
  };
};

export {
  getPlansByDate,
  savePlan,
  updatePlan,
  deletePlan,
  getPlanCount,
  getDoneCount,
  getPlanStatistics,
  formatDateKey,
};

