// Global Variables
let currentSection = "dashboard";
let currentMood = 3;
let meditationTimer = null;
let meditationDuration = 600; // 10 minutes default
let meditationTimeLeft = meditationDuration;
let breathingInterval = null;
let isBreathing = false;
let moodChart = null;
let moodHistoryChart = null;
let correlationChart = null;

// Data Storage Keys
const STORAGE_KEYS = {
  MOOD_HISTORY: "mindfit_mood_history",
  GRATITUDE_ENTRIES: "mindfit_gratitude_entries",
  MEDITATION_STATS: "mindfit_meditation_stats",
  GOALS: "mindfit_goals",
  THEME: "mindfit_theme",
  USER_PREFERENCES: "mindfit_preferences",
};

// Mood Configuration
const MOOD_CONFIG = {
  emojis: ["😢", "😕", "😐", "😊", "😄"],
  labels: ["Terrible", "Bad", "Okay", "Good", "Amazing"],
  colors: ["#f56565", "#ed8936", "#ffd700", "#48bb78", "#00ff00"],
};

// Initialize Application
document.addEventListener("DOMContentLoaded", function () {
  initializeApp();
});

async function initializeApp() {
  showLoadingScreen();

  try {
    // Initialize core components
    await Promise.all([
      loadTheme(),
      setupNavigation(),
      setupMoodSlider(),
      loadDashboardData(),
      loadGratitudeEntries(),
      loadMeditationStats(),
      loadGoals(),
      getNewQuote(),
    ]);

    // Setup event listeners
    setupEventListeners();

    // Initialize charts
    initializeCharts();

    // Show dashboard by default
    showSection("dashboard");
  } catch (error) {
    console.error("Error initializing app:", error);
    showNotification("Error loading application", "error");
  } finally {
    hideLoadingScreen();
  }
}

// Loading Screen
function showLoadingScreen() {
  const loadingScreen = document.getElementById("loadingScreen");
  loadingScreen.style.display = "flex";
}

function hideLoadingScreen() {
  const loadingScreen = document.getElementById("loadingScreen");
  setTimeout(() => {
    loadingScreen.classList.add("hidden");
    setTimeout(() => {
      loadingScreen.style.display = "none";
    }, 500);
  }, 1000);
}

// Theme Management
function loadTheme() {
  const savedTheme = getCookie(STORAGE_KEYS.THEME) || "dark";
  document.documentElement.setAttribute("data-theme", savedTheme);
  updateThemeIcon(savedTheme);
}

function toggleTheme() {
  const currentTheme = document.documentElement.getAttribute("data-theme");
  const newTheme = currentTheme === "dark" ? "light" : "dark";

  document.documentElement.setAttribute("data-theme", newTheme);
  setCookie(STORAGE_KEYS.THEME, newTheme, 365);
  updateThemeIcon(newTheme);

  showNotification(`Switched to ${newTheme} mode`, "info");
}

function updateThemeIcon(theme) {
  const themeIcon = document.querySelector("#themeToggle i");
  themeIcon.className = theme === "dark" ? "fas fa-sun" : "fas fa-moon";
}

// Navigation
function setupNavigation() {
  const navLinks = document.querySelectorAll(".nav-link");
  navLinks.forEach((link) => {
    link.addEventListener("click", (e) => {
      e.preventDefault();
      const section = link.getAttribute("data-section");
      showSection(section);
    });
  });
}

function showSection(sectionName) {
  // Hide all sections
  document.querySelectorAll(".section").forEach((section) => {
    section.classList.remove("active");
  });

  // Show target section
  const targetSection = document.getElementById(sectionName);
  if (targetSection) {
    targetSection.classList.add("active");
    currentSection = sectionName;

    // Update navigation
    document.querySelectorAll(".nav-link").forEach((link) => {
      link.classList.remove("active");
    });

    const activeLink = document.querySelector(
      `[data-section="${sectionName}"]`
    );
    if (activeLink) {
      activeLink.classList.add("active");
    }

    // Load section-specific data
    loadSectionData(sectionName);
  }
}

function loadSectionData(sectionName) {
  switch (sectionName) {
    case "dashboard":
      updateDashboardStats();
      updateActivityFeed();
      break;
    case "mood":
      updateMoodHistory();
      updateMoodPatterns();
      break;
    case "gratitude":
      displayGratitudeEntries();
      break;
    case "meditation":
      updateMeditationStats();
      break;
    case "goals":
      displayGoals();
      break;
    case "insights":
      updateInsights();
      break;
  }
}

// Event Listeners
function setupEventListeners() {
  // Theme toggle
  document.getElementById("themeToggle").addEventListener("click", toggleTheme);

  // Search functionality
  const gratitudeSearch = document.getElementById("gratitudeSearch");
  if (gratitudeSearch) {
    gratitudeSearch.addEventListener(
      "input",
      debounce(filterGratitudeEntries, 300)
    );
  }

  // Keyboard shortcuts
  document.addEventListener("keydown", handleKeyboardShortcuts);

  // Window resize
  window.addEventListener("resize", debounce(handleWindowResize, 250));
}

function handleKeyboardShortcuts(e) {
  // Ctrl/Cmd + Number keys for quick navigation
  if ((e.ctrlKey || e.metaKey) && e.key >= "1" && e.key <= "6") {
    e.preventDefault();
    const sections = [
      "dashboard",
      "mood",
      "gratitude",
      "meditation",
      "goals",
      "insights",
    ];
    const sectionIndex = parseInt(e.key) - 1;
    if (sections[sectionIndex]) {
      showSection(sections[sectionIndex]);
    }
  }

  // Escape key to close modals
  if (e.key === "Escape") {
    closeModal();
  }
}

function handleWindowResize() {
  // Resize charts if they exist
  if (moodChart) moodChart.resize();
  if (moodHistoryChart) moodHistoryChart.resize();
  if (correlationChart) correlationChart.resize();
}

// Mood Tracking
function setupMoodSlider() {
  const slider = document.getElementById("moodSlider");
  const display = document.getElementById("moodDisplayLarge");

  if (slider && display) {
    slider.addEventListener("input", function () {
      currentMood = parseInt(this.value);
      display.textContent = MOOD_CONFIG.emojis[currentMood - 1];
      display.style.animation = "none";
      display.offsetHeight; // Trigger reflow
      display.style.animation = "pulse 0.5s ease";
    });

    // Initialize display
    display.textContent = MOOD_CONFIG.emojis[currentMood - 1];
  }
}

function saveMoodEnhanced() {
  const moodNote = document.getElementById("moodNote").value.trim();
  const timestamp = new Date().toISOString();
  const date = new Date().toISOString().split("T")[0];

  const moodEntry = {
    id: Date.now(),
    mood: currentMood,
    note: moodNote,
    timestamp: timestamp,
    date: date,
  };

  // Save to session storage (current session)
  sessionStorage.setItem("currentMood", JSON.stringify(moodEntry));

  // Save to local storage (history)
  const moodHistory = JSON.parse(
    localStorage.getItem(STORAGE_KEYS.MOOD_HISTORY) || "[]"
  );
  moodHistory.push(moodEntry);
  localStorage.setItem(STORAGE_KEYS.MOOD_HISTORY, JSON.stringify(moodHistory));

  // Clear note
  document.getElementById("moodNote").value = "";

  // Update UI
  updateDashboardStats();
  updateMoodHistory();
  addActivityItem(
    "mood",
    `Logged mood: ${MOOD_CONFIG.labels[currentMood - 1]}`
  );

  showNotification("Mood saved successfully! 🎯", "success");
}

function updateMoodHistory() {
  const filter = document.getElementById("moodHistoryFilter")?.value || "7";
  const days = parseInt(filter);
  const moodHistory = JSON.parse(
    localStorage.getItem(STORAGE_KEYS.MOOD_HISTORY) || "[]"
  );

  // Filter data by selected timeframe
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - days);

  const filteredData = moodHistory.filter(
    (entry) => new Date(entry.timestamp) >= cutoffDate
  );

  updateMoodHistoryChart(filteredData);
}

function updateMoodPatterns() {
  const moodHistory = JSON.parse(
    localStorage.getItem(STORAGE_KEYS.MOOD_HISTORY) || "[]"
  );
  const patternsContainer = document.getElementById("moodPatterns");

  if (!patternsContainer || moodHistory.length === 0) return;

  // Calculate patterns
  const patterns = calculateMoodPatterns(moodHistory);

  patternsContainer.innerHTML = patterns
    .map(
      (pattern) => `
        <div class="pattern-item">
            <div class="pattern-value">${pattern.value}</div>
            <div class="pattern-label">${pattern.label}</div>
        </div>
    `
    )
    .join("");
}

function calculateMoodPatterns(moodHistory) {
  if (moodHistory.length === 0) return [];

  const patterns = [];

  // Average mood
  const avgMood =
    moodHistory.reduce((sum, entry) => sum + entry.mood, 0) /
    moodHistory.length;
  patterns.push({
    value: avgMood.toFixed(1),
    label: "Average Mood",
  });

  // Most common mood
  const moodCounts = {};
  moodHistory.forEach((entry) => {
    moodCounts[entry.mood] = (moodCounts[entry.mood] || 0) + 1;
  });
  const mostCommonMood = Object.keys(moodCounts).reduce((a, b) =>
    moodCounts[a] > moodCounts[b] ? a : b
  );
  patterns.push({
    value: MOOD_CONFIG.emojis[mostCommonMood - 1],
    label: "Most Common",
  });

  // Mood trend
  if (moodHistory.length >= 2) {
    const recent = moodHistory.slice(-7); // Last 7 entries
    const older = moodHistory.slice(-14, -7); // Previous 7 entries

    if (older.length > 0) {
      const recentAvg =
        recent.reduce((sum, entry) => sum + entry.mood, 0) / recent.length;
      const olderAvg =
        older.reduce((sum, entry) => sum + entry.mood, 0) / older.length;
      const trend = recentAvg - olderAvg;

      patterns.push({
        value: trend > 0 ? "📈" : trend < 0 ? "📉" : "➡️",
        label: "Trend",
      });
    }
  }

  return patterns;
}

// Gratitude Journal
function saveGratitudeEnhanced() {
  const gratitudeText = document.getElementById("gratitudeText").value.trim();
  const category = document.getElementById("gratitudeCategory").value;

  if (!gratitudeText) {
    showNotification("Please write something you're grateful for!", "warning");
    return;
  }

  const gratitudeEntry = {
    id: Date.now(),
    text: gratitudeText,
    category: category,
    timestamp: new Date().toISOString(),
    date: new Date().toLocaleDateString("en-US", {
      weekday: "short",
      year: "numeric",
      month: "short",
      day: "numeric",
    }),
  };

  const gratitudeEntries = JSON.parse(
    localStorage.getItem(STORAGE_KEYS.GRATITUDE_ENTRIES) || "[]"
  );
  gratitudeEntries.unshift(gratitudeEntry);
  localStorage.setItem(
    STORAGE_KEYS.GRATITUDE_ENTRIES,
    JSON.stringify(gratitudeEntries)
  );

  // Clear form
  clearGratitudeForm();

  // Update UI
  displayGratitudeEntries();
  updateDashboardStats();
  addActivityItem("gratitude", "Added gratitude entry");

  showNotification("Gratitude entry saved! 🙏", "success");
}

function clearGratitudeForm() {
  document.getElementById("gratitudeText").value = "";
  document.getElementById("gratitudeCategory").value = "general";
}

function displayGratitudeEntries() {
  const gratitudeEntries = JSON.parse(
    localStorage.getItem(STORAGE_KEYS.GRATITUDE_ENTRIES) || "[]"
  );
  const container = document.getElementById("gratitudeEntriesContainer");

  if (!container) return;

  if (gratitudeEntries.length === 0) {
    container.innerHTML = `
            <div class="glass-card">
                <div style="text-align: center; padding: 2rem; color: var(--text-secondary);">
                    <i class="fas fa-heart" style="font-size: 3rem; margin-bottom: 1rem; opacity: 0.5;"></i>
                    <p>No gratitude entries yet. Start by writing what you're grateful for!</p>
                </div>
            </div>
        `;
    return;
  }

  const entriesHTML = gratitudeEntries
    .map(
      (entry) => `
        <div class="gratitude-entry" data-category="${entry.category}">
            <div class="gratitude-entry-header">
                <span class="gratitude-category">${entry.category}</span>
                <span class="gratitude-date">${entry.date}</span>
            </div>
            <div class="gratitude-text">${entry.text}</div>
        </div>
    `
    )
    .join("");

  container.innerHTML = `
        <div class="glass-card">
            <div class="card-header">
                <h3>Your Gratitude Journey</h3>
                <div class="card-actions">
                    <button class="btn-icon" onclick="exportGratitudeData()">
                        <i class="fas fa-download"></i>
                    </button>
                </div>
            </div>
            <div class="gratitude-entries">
                ${entriesHTML}
            </div>
        </div>
    `;
}

function filterGratitudeEntries() {
  const searchTerm = document
    .getElementById("gratitudeSearch")
    .value.toLowerCase();
  const categoryFilter = document.getElementById("categoryFilter").value;
  const entries = document.querySelectorAll(".gratitude-entry");

  entries.forEach((entry) => {
    const text = entry
      .querySelector(".gratitude-text")
      .textContent.toLowerCase();
    const category = entry.getAttribute("data-category");

    const matchesSearch = text.includes(searchTerm);
    const matchesCategory =
      categoryFilter === "all" || category === categoryFilter;

    entry.style.display = matchesSearch && matchesCategory ? "block" : "none";
  });
}

function exportGratitudeData() {
  const gratitudeEntries = JSON.parse(
    localStorage.getItem(STORAGE_KEYS.GRATITUDE_ENTRIES) || "[]"
  );

  if (gratitudeEntries.length === 0) {
    showNotification("No gratitude entries to export", "warning");
    return;
  }

  const dataStr = JSON.stringify(gratitudeEntries, null, 2);
  const dataBlob = new Blob([dataStr], { type: "application/json" });

  const link = document.createElement("a");
  link.href = URL.createObjectURL(dataBlob);
  link.download = `gratitude-entries-${
    new Date().toISOString().split("T")[0]
  }.json`;
  link.click();

  showNotification("Gratitude data exported successfully!", "success");
}

// Meditation & Mindfulness
function setMeditationTime(seconds) {
  meditationDuration = seconds;
  meditationTimeLeft = seconds;
  updateTimerDisplay();

  // Update active preset button
  document
    .querySelectorAll(".preset-btn")
    .forEach((btn) => btn.classList.remove("active"));
  event.target.classList.add("active");
}

function toggleMeditation() {
  const startBtn = document.getElementById("meditationStartBtn");

  if (meditationTimer) {
    // Stop meditation
    clearInterval(meditationTimer);
    meditationTimer = null;
    startBtn.innerHTML = '<i class="fas fa-play"></i> Start';
    showNotification("Meditation paused", "info");
  } else {
    // Start meditation
    startMeditation();
    startBtn.innerHTML = '<i class="fas fa-pause"></i> Pause';
    showNotification("Meditation started. Find your center 🧘‍♀️", "success");
  }
}

function startMeditation() {
  meditationTimer = setInterval(() => {
    meditationTimeLeft--;
    updateTimerDisplay();
    updateTimerProgress();

    if (meditationTimeLeft <= 0) {
      completeMeditation();
    }
  }, 1000);
}

function completeMeditation() {
  clearInterval(meditationTimer);
  meditationTimer = null;

  const sessionDuration = meditationDuration - meditationTimeLeft;
  saveMeditationSession(sessionDuration);

  document.getElementById("meditationStartBtn").innerHTML =
    '<i class="fas fa-play"></i> Start';

  showNotification("Meditation completed! Well done 🌟", "success");

  // Reset timer
  meditationTimeLeft = meditationDuration;
  updateTimerDisplay();
  updateTimerProgress();
}

function resetMeditation() {
  if (meditationTimer) {
    clearInterval(meditationTimer);
    meditationTimer = null;
  }

  meditationTimeLeft = meditationDuration;
  updateTimerDisplay();
  updateTimerProgress();

  document.getElementById("meditationStartBtn").innerHTML =
    '<i class="fas fa-play"></i> Start';
  showNotification("Meditation timer reset", "info");
}

function updateTimerDisplay() {
  const minutes = Math.floor(meditationTimeLeft / 60);
  const seconds = meditationTimeLeft % 60;
  const display = `${minutes.toString().padStart(2, "0")}:${seconds
    .toString()
    .padStart(2, "0")}`;

  const timerText = document.getElementById("timerText");
  if (timerText) {
    timerText.textContent = display;
  }
}

function updateTimerProgress() {
  const progress =
    ((meditationDuration - meditationTimeLeft) / meditationDuration) * 283;
  const progressCircle = document.getElementById("timerProgress");

  if (progressCircle) {
    progressCircle.style.strokeDashoffset = 283 - progress;
  }
}

function saveMeditationSession(duration) {
  const meditationStats = JSON.parse(
    localStorage.getItem(STORAGE_KEYS.MEDITATION_STATS) || "{}"
  );

  const today = new Date().toISOString().split("T")[0];

  // Update stats
  meditationStats.totalMinutes =
    (meditationStats.totalMinutes || 0) + Math.floor(duration / 60);
  meditationStats.totalSessions = (meditationStats.totalSessions || 0) + 1;
  meditationStats.longestSession = Math.max(
    meditationStats.longestSession || 0,
    Math.floor(duration / 60)
  );
  meditationStats.lastSession = today;

  // Update streak
  if (!meditationStats.lastSession || meditationStats.lastSession === today) {
    meditationStats.streak = (meditationStats.streak || 0) + 1;
  } else {
    const lastDate = new Date(meditationStats.lastSession);
    const todayDate = new Date(today);
    const daysDiff = Math.floor((todayDate - lastDate) / (1000 * 60 * 60 * 24));

    if (daysDiff === 1) {
      meditationStats.streak = (meditationStats.streak || 0) + 1;
    } else {
      meditationStats.streak = 1;
    }
  }

  localStorage.setItem(
    STORAGE_KEYS.MEDITATION_STATS,
    JSON.stringify(meditationStats)
  );

  // Update UI
  updateMeditationStats();
  updateDashboardStats();
  addActivityItem(
    "meditation",
    `Meditated for ${Math.floor(duration / 60)} minutes`
  );
}

function updateMeditationStats() {
  const stats = JSON.parse(
    localStorage.getItem(STORAGE_KEYS.MEDITATION_STATS) || "{}"
  );

  const elements = {
    totalMeditationTime: stats.totalMinutes || 0,
    meditationSessions: stats.totalSessions || 0,
    longestSession: stats.longestSession || 0,
    meditationStreak: stats.streak || 0,
  };

  Object.entries(elements).forEach(([id, value]) => {
    const element = document.getElementById(id);
    if (element) {
      element.textContent = value;
    }
  });
}

// Breathing Exercise
function toggleBreathing() {
  const breathingBtn = document.getElementById("breathingBtn");
  const breathingCircle = document.getElementById("breathingCircle");
  const breathingText = document.getElementById("breathingText");

  if (isBreathing) {
    // Stop breathing exercise
    clearInterval(breathingInterval);
    isBreathing = false;
    breathingBtn.innerHTML = '<i class="fas fa-wind"></i> Start Breathing';
    breathingText.textContent = "Click to start";
    breathingCircle.classList.remove("inhale", "exhale");
    showNotification("Breathing exercise stopped", "info");
  } else {
    // Start breathing exercise
    startBreathingExercise();
    breathingBtn.innerHTML = '<i class="fas fa-stop"></i> Stop Breathing';
    showNotification(
      "Breathing exercise started. Follow the circle 🌬️",
      "success"
    );
  }
}

function startBreathingExercise() {
  isBreathing = true;
  let phase = "inhale"; // inhale, hold, exhale, hold
  let count = 0;

  const breathingCircle = document.getElementById("breathingCircle");
  const breathingText = document.getElementById("breathingText");

  const phases = {
    inhale: { duration: 4, text: "Breathe In", class: "inhale" },
    hold1: { duration: 2, text: "Hold", class: "inhale" },
    exhale: { duration: 6, text: "Breathe Out", class: "exhale" },
    hold2: { duration: 2, text: "Hold", class: "exhale" },
  };

  const phaseOrder = ["inhale", "hold1", "exhale", "hold2"];
  let currentPhaseIndex = 0;

  breathingInterval = setInterval(() => {
    const currentPhase = phases[phaseOrder[currentPhaseIndex]];

    if (count === 0) {
      breathingText.textContent = currentPhase.text;
      breathingCircle.className = `breathing-circle ${currentPhase.class}`;
    }

    count++;

    if (count >= currentPhase.duration) {
      count = 0;
      currentPhaseIndex = (currentPhaseIndex + 1) % phaseOrder.length;
    }
  }, 1000);
}

// Goals Management
function createGoal() {
  const title = document.getElementById("goalTitle").value.trim();
  const category = document.getElementById("goalCategory").value;
  const target = parseInt(document.getElementById("goalTarget").value);
  const unit = document.getElementById("goalUnit").value;
  const description = document.getElementById("goalDescription").value.trim();

  if (!title || !target || target <= 0) {
    showNotification("Please fill in all required fields", "warning");
    return;
  }

  const goal = {
    id: Date.now(),
    title,
    category,
    target,
    unit,
    description,
    progress: 0,
    createdAt: new Date().toISOString(),
    completed: false,
  };

  const goals = JSON.parse(localStorage.getItem(STORAGE_KEYS.GOALS) || "[]");
  goals.push(goal);
  localStorage.setItem(STORAGE_KEYS.GOALS, JSON.stringify(goals));

  // Clear form
  clearGoalForm();

  // Update UI
  displayGoals();
  addActivityItem("goal", `Created goal: ${title}`);

  showNotification("Goal created successfully! 🎯", "success");
}

function clearGoalForm() {
  document.getElementById("goalTitle").value = "";
  document.getElementById("goalCategory").value = "meditation";
  document.getElementById("goalTarget").value = "";
  document.getElementById("goalUnit").value = "days";
  document.getElementById("goalDescription").value = "";
}

function displayGoals() {
  const goals = JSON.parse(localStorage.getItem(STORAGE_KEYS.GOALS) || "[]");
  const container = document.getElementById("goalsList");

  if (!container) return;

  if (goals.length === 0) {
    container.innerHTML = `
            <div class="glass-card" style="text-align: center; padding: 2rem; color: var(--text-secondary);">
                <i class="fas fa-target" style="font-size: 3rem; margin-bottom: 1rem; opacity: 0.5;"></i>
                <p>No goals set yet. Create your first mental wellness goal!</p>
            </div>
        `;
    return;
  }

  container.innerHTML = goals.map((goal) => createGoalCard(goal)).join("");
}

function createGoalCard(goal) {
  const progressPercentage = Math.min((goal.progress / goal.target) * 100, 100);
  const isCompleted = goal.progress >= goal.target;

  return `
        <div class="goal-card ${isCompleted ? "completed" : ""}">
            <div class="goal-header">
                <div>
                    <div class="goal-title">${goal.title}</div>
                    ${
                      goal.description
                        ? `<div class="goal-description">${goal.description}</div>`
                        : ""
                    }
                </div>
                <span class="goal-category-badge">${goal.category}</span>
            </div>
            <div class="goal-progress">
                <div class="progress-bar">
                    <div class="progress-fill" style="width: ${progressPercentage}%"></div>
                </div>
                <div class="progress-text">
                    <span>${goal.progress} / ${goal.target} ${goal.unit}</span>
                    <span>${progressPercentage.toFixed(0)}%</span>
                </div>
            </div>
            <div class="goal-actions">
                <button class="btn-icon" onclick="updateGoalProgress(${
                  goal.id
                }, 1)" ${isCompleted ? "disabled" : ""}>
                    <i class="fas fa-plus"></i>
                </button>
                <button class="btn-icon" onclick="updateGoalProgress(${
                  goal.id
                }, -1)" ${goal.progress <= 0 ? "disabled" : ""}>
                    <i class="fas fa-minus"></i>
                </button>
                <button class="btn-icon" onclick="deleteGoal(${goal.id})">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        </div>
    `;
}

function updateGoalProgress(goalId, change) {
  const goals = JSON.parse(localStorage.getItem(STORAGE_KEYS.GOALS) || "[]");
  const goalIndex = goals.findIndex((g) => g.id === goalId);

  if (goalIndex === -1) return;

  const goal = goals[goalIndex];
  const newProgress = Math.max(0, goal.progress + change);
  goal.progress = Math.min(newProgress, goal.target);

  // Check if goal was just completed
  if (goal.progress === goal.target && !goal.completed) {
    goal.completed = true;
    showNotification(`🎉 Goal completed: ${goal.title}!`, "success");
    addActivityItem("goal", `Completed goal: ${goal.title}`);
  }

  localStorage.setItem(STORAGE_KEYS.GOALS, JSON.stringify(goals));
  displayGoals();
}

function deleteGoal(goalId) {
  if (!confirm("Are you sure you want to delete this goal?")) return;

  const goals = JSON.parse(localStorage.getItem(STORAGE_KEYS.GOALS) || "[]");
  const filteredGoals = goals.filter((g) => g.id !== goalId);

  localStorage.setItem(STORAGE_KEYS.GOALS, JSON.stringify(filteredGoals));
  displayGoals();

  showNotification("Goal deleted", "info");
}

// Dashboard Functions
function updateDashboardStats() {
  const moodHistory = JSON.parse(
    localStorage.getItem(STORAGE_KEYS.MOOD_HISTORY) || "[]"
  );
  const gratitudeEntries = JSON.parse(
    localStorage.getItem(STORAGE_KEYS.GRATITUDE_ENTRIES) || "[]"
  );
  const meditationStats = JSON.parse(
    localStorage.getItem(STORAGE_KEYS.MEDITATION_STATS) || "{}"
  );

  // Calculate stats
  const avgMood =
    moodHistory.length > 0
      ? (
          moodHistory.reduce((sum, entry) => sum + entry.mood, 0) /
          moodHistory.length
        ).toFixed(1)
      : "0";

  const streak = calculateCurrentStreak();
  const thisMonthGratitude = gratitudeEntries.filter((entry) => {
    const entryDate = new Date(entry.timestamp);
    const now = new Date();
    return (
      entryDate.getMonth() === now.getMonth() &&
      entryDate.getFullYear() === now.getFullYear()
    );
  }).length;

  const thisWeekMeditation = meditationStats.totalMinutes || 0;

  // Update UI
  updateStatElement("avgMoodStat", avgMood);
  updateStatElement("streakStat", streak);
  updateStatElement("gratitudeStat", thisMonthGratitude);
  updateStatElement("meditationStat", thisWeekMeditation);
}

function updateStatElement(id, value) {
  const element = document.getElementById(id);
  if (element) {
    element.textContent = value;
  }
}

function calculateCurrentStreak() {
  const moodHistory = JSON.parse(
    localStorage.getItem(STORAGE_KEYS.MOOD_HISTORY) || "[]"
  );
  const gratitudeEntries = JSON.parse(
    localStorage.getItem(STORAGE_KEYS.GRATITUDE_ENTRIES) || "[]"
  );

  if (moodHistory.length === 0 && gratitudeEntries.length === 0) return 0;

  // Combine all activities by date
  const activities = {};

  moodHistory.forEach((entry) => {
    const date = entry.date;
    activities[date] = true;
  });

  gratitudeEntries.forEach((entry) => {
    const date = new Date(entry.timestamp).toISOString().split("T")[0];
    activities[date] = true;
  });

  // Calculate streak
  let streak = 0;
  const today = new Date();

  for (let i = 0; i < 365; i++) {
    const checkDate = new Date(today);
    checkDate.setDate(today.getDate() - i);
    const dateStr = checkDate.toISOString().split("T")[0];

    if (activities[dateStr]) {
      streak++;
    } else {
      break;
    }
  }

  return streak;
}

function updateActivityFeed() {
  const container = document.getElementById("activityFeed");
  if (!container) return;

  const activities = getRecentActivities();

  if (activities.length === 0) {
    container.innerHTML = `
            <div style="text-align: center; padding: 2rem; color: var(--text-secondary);">
                <p>No recent activity. Start tracking your mental wellness!</p>
            </div>
        `;
    return;
  }

  container.innerHTML = activities
    .slice(0, 5)
    .map(
      (activity) => `
        <div class="activity-item">
            <div class="activity-icon">
                <i class="fas fa-${activity.icon}"></i>
            </div>
            <div class="activity-content">
                <div class="activity-text">${activity.text}</div>
                <div class="activity-time">${activity.time}</div>
            </div>
        </div>
    `
    )
    .join("");
}

function getRecentActivities() {
  const activities = JSON.parse(
    localStorage.getItem("mindfit_activities") || "[]"
  );
  return activities.sort(
    (a, b) => new Date(b.timestamp) - new Date(a.timestamp)
  );
}

function addActivityItem(type, text) {
  const activities = JSON.parse(
    localStorage.getItem("mindfit_activities") || "[]"
  );

  const iconMap = {
    mood: "smile",
    gratitude: "heart",
    meditation: "leaf",
    goal: "target",
  };

  const activity = {
    id: Date.now(),
    type,
    text,
    icon: iconMap[type] || "circle",
    timestamp: new Date().toISOString(),
    time: new Date().toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    }),
  };

  activities.unshift(activity);

  // Keep only last 50 activities
  if (activities.length > 50) {
    activities.splice(50);
  }

  localStorage.setItem("mindfit_activities", JSON.stringify(activities));
}

// Quotes
async function getNewQuote() {
  const quoteText = document.getElementById("dashboardQuote");
  const quoteAuthor = document.getElementById("dashboardAuthor");

  if (!quoteText || !quoteAuthor) return;

  try {
    quoteText.textContent = "Loading inspiration...";
    quoteAuthor.textContent = "";

    const response = await fetch(
      "https://api.quotable.io/random?minLength=50&maxLength=150"
    );

    if (!response.ok) {
      throw new Error("Failed to fetch quote");
    }

    const data = await response.json();

    // Animate quote change
    quoteText.style.opacity = "0";
    setTimeout(() => {
      quoteText.textContent = `"${data.content}"`;
      quoteAuthor.textContent = `— ${data.author}`;
      quoteText.style.opacity = "1";
    }, 300);
  } catch (error) {
    console.error("Error fetching quote:", error);

    // Fallback quotes
    const fallbackQuotes = [
      {
        content: "The only way to do great work is to love what you do.",
        author: "Steve Jobs",
      },
      {
        content:
          "Mindfulness is a way of befriending ourselves and our experience.",
        author: "Jon Kabat-Zinn",
      },
      {
        content: "Peace comes from within. Do not seek it without.",
        author: "Buddha",
      },
      {
        content:
          "The present moment is the only time over which we have dominion.",
        author: "Thích Nhất Hạnh",
      },
      {
        content:
          "Happiness is not something ready made. It comes from your own actions.",
        author: "Dalai Lama",
      },
    ];

    const randomQuote =
      fallbackQuotes[Math.floor(Math.random() * fallbackQuotes.length)];

    quoteText.style.opacity = "0";
    setTimeout(() => {
      quoteText.textContent = `"${randomQuote.content}"`;
      quoteAuthor.textContent = `— ${randomQuote.author}`;
      quoteText.style.opacity = "1";
    }, 300);
  }
}

// Charts
function initializeCharts() {
  initializeMoodChart();
  initializeMoodHistoryChart();
  initializeCorrelationChart();
}

function initializeMoodChart() {
  const ctx = document.getElementById("moodChart");
  if (!ctx) return;

  const moodHistory = JSON.parse(
    localStorage.getItem(STORAGE_KEYS.MOOD_HISTORY) || "[]"
  );
  const last7Days = getLast7DaysData(moodHistory);

  moodChart = new Chart(ctx, {
    type: "line",
    data: {
      labels: last7Days.labels,
      datasets: [
        {
          label: "Mood",
          data: last7Days.data,
          borderColor: "#667eea",
          backgroundColor: "rgba(102, 126, 234, 0.1)",
          borderWidth: 3,
          fill: true,
          tension: 0.4,
          pointBackgroundColor: "#667eea",
          pointBorderColor: "#ffffff",
          pointBorderWidth: 2,
          pointRadius: 6,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false,
        },
      },
      scales: {
        y: {
          beginAtZero: true,
          max: 5,
          ticks: {
            stepSize: 1,
            callback: function (value) {
              return MOOD_CONFIG.emojis[value - 1] || "";
            },
          },
          grid: {
            color: "rgba(255, 255, 255, 0.1)",
          },
        },
        x: {
          grid: {
            color: "rgba(255, 255, 255, 0.1)",
          },
        },
      },
    },
  });
}

function initializeMoodHistoryChart() {
  const ctx = document.getElementById("moodHistoryChart");
  if (!ctx) return;

  updateMoodHistoryChart();
}

function updateMoodHistoryChart(data = null) {
  const ctx = document.getElementById("moodHistoryChart");
  if (!ctx) return;

  if (moodHistoryChart) {
    moodHistoryChart.destroy();
  }

  const moodHistory =
    data || JSON.parse(localStorage.getItem(STORAGE_KEYS.MOOD_HISTORY) || "[]");
  const chartData = prepareChartData(moodHistory);

  moodHistoryChart = new Chart(ctx, {
    type: "bar",
    data: {
      labels: chartData.labels,
      datasets: [
        {
          label: "Average Mood",
          data: chartData.data,
          backgroundColor: chartData.colors,
          borderColor: chartData.colors,
          borderWidth: 1,
          borderRadius: 4,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false,
        },
      },
      scales: {
        y: {
          beginAtZero: true,
          max: 5,
          ticks: {
            stepSize: 1,
          },
          grid: {
            color: "rgba(255, 255, 255, 0.1)",
          },
        },
        x: {
          grid: {
            color: "rgba(255, 255, 255, 0.1)",
          },
        },
      },
    },
  });
}

function initializeCorrelationChart() {
  const ctx = document.getElementById("correlationChart");
  if (!ctx) return;

  // This would show correlations between different activities and mood
  // For now, we'll show a simple placeholder
  correlationChart = new Chart(ctx, {
    type: "scatter",
    data: {
      datasets: [
        {
          label: "Mood vs Gratitude",
          data: generateCorrelationData(),
          backgroundColor: "rgba(102, 126, 234, 0.6)",
          borderColor: "#667eea",
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false,
        },
      },
      scales: {
        x: {
          title: {
            display: true,
            text: "Gratitude Entries",
          },
          grid: {
            color: "rgba(255, 255, 255, 0.1)",
          },
        },
        y: {
          title: {
            display: true,
            text: "Average Mood",
          },
          min: 1,
          max: 5,
          grid: {
            color: "rgba(255, 255, 255, 0.1)",
          },
        },
      },
    },
  });
}

function getLast7DaysData(moodHistory) {
  const last7Days = [];
  const today = new Date();

  for (let i = 6; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(today.getDate() - i);
    const dateStr = date.toISOString().split("T")[0];

    last7Days.push({
      date: dateStr,
      label: date.toLocaleDateString("en-US", { weekday: "short" }),
      mood: 0,
      count: 0,
    });
  }

  // Fill in actual mood data
  moodHistory.forEach((entry) => {
    const dayData = last7Days.find((day) => day.date === entry.date);
    if (dayData) {
      dayData.mood += entry.mood;
      dayData.count++;
    }
  });

  // Calculate averages
  last7Days.forEach((day) => {
    if (day.count > 0) {
      day.mood = day.mood / day.count;
    } else {
      day.mood = null;
    }
  });

  return {
    labels: last7Days.map((day) => day.label),
    data: last7Days.map((day) => day.mood),
  };
}

function prepareChartData(moodHistory) {
  const groupedData = {};

  moodHistory.forEach((entry) => {
    const date = entry.date;
    if (!groupedData[date]) {
      groupedData[date] = { total: 0, count: 0 };
    }
    groupedData[date].total += entry.mood;
    groupedData[date].count++;
  });

  const labels = [];
  const data = [];
  const colors = [];

  Object.keys(groupedData)
    .sort()
    .slice(-14)
    .forEach((date) => {
      const avgMood = groupedData[date].total / groupedData[date].count;
      const formattedDate = new Date(date).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      });

      labels.push(formattedDate);
      data.push(avgMood);
      colors.push(MOOD_CONFIG.colors[Math.round(avgMood) - 1]);
    });

  return { labels, data, colors };
}

function generateCorrelationData() {
  // Generate sample correlation data
  const data = [];
  for (let i = 0; i < 20; i++) {
    data.push({
      x: Math.floor(Math.random() * 10),
      y: Math.random() * 4 + 1,
    });
  }
  return data;
}

// Insights
function updateInsights() {
  const timeframe =
    document.getElementById("insightsTimeframe")?.value || "week";
  const insights = generateInsights(timeframe);

  displayInsights(insights);
  generateRecommendations();
}

function generateInsights(timeframe) {
  const moodHistory = JSON.parse(
    localStorage.getItem(STORAGE_KEYS.MOOD_HISTORY) || "[]"
  );
  const gratitudeEntries = JSON.parse(
    localStorage.getItem(STORAGE_KEYS.GRATITUDE_ENTRIES) || "[]"
  );
  const meditationStats = JSON.parse(
    localStorage.getItem(STORAGE_KEYS.MEDITATION_STATS) || "{}"
  );

  // Filter data by timeframe
  const cutoffDate = new Date();
  const days = timeframe === "week" ? 7 : timeframe === "month" ? 30 : 90;
  cutoffDate.setDate(cutoffDate.getDate() - days);

  const filteredMood = moodHistory.filter(
    (entry) => new Date(entry.timestamp) >= cutoffDate
  );
  const filteredGratitude = gratitudeEntries.filter(
    (entry) => new Date(entry.timestamp) >= cutoffDate
  );

  return {
    avgMood:
      filteredMood.length > 0
        ? (
            filteredMood.reduce((sum, entry) => sum + entry.mood, 0) /
            filteredMood.length
          ).toFixed(1)
        : 0,
    moodEntries: filteredMood.length,
    gratitudeEntries: filteredGratitude.length,
    meditationMinutes: meditationStats.totalMinutes || 0,
    bestDay: findBestDay(filteredMood),
    moodTrend: calculateMoodTrend(filteredMood),
  };
}

function displayInsights(insights) {
  const container = document.getElementById("insightsGrid");
  if (!container) return;

  container.innerHTML = `
        <div class="insight-item">
            <div class="insight-icon">😊</div>
            <div class="insight-title">Average Mood</div>
            <div class="insight-description">${insights.avgMood}/5.0</div>
        </div>
        <div class="insight-item">
            <div class="insight-icon">📊</div>
            <div class="insight-title">Mood Entries</div>
            <div class="insight-description">${
              insights.moodEntries
            } logged</div>
        </div>
        <div class="insight-item">
            <div class="insight-icon">🙏</div>
            <div class="insight-title">Gratitude Entries</div>
            <div class="insight-description">${
              insights.gratitudeEntries
            } written</div>
        </div>
        <div class="insight-item">
            <div class="insight-icon">🧘‍♀️</div>
            <div class="insight-title">Meditation</div>
            <div class="insight-description">${
              insights.meditationMinutes
            } minutes</div>
        </div>
        <div class="insight-item">
            <div class="insight-icon">⭐</div>
            <div class="insight-title">Best Day</div>
            <div class="insight-description">${insights.bestDay}</div>
        </div>
        <div class="insight-item">
            <div class="insight-icon">${
              insights.moodTrend > 0
                ? "📈"
                : insights.moodTrend < 0
                ? "📉"
                : "➡️"
            }</div>
            <div class="insight-title">Mood Trend</div>
            <div class="insight-description">${
              insights.moodTrend > 0
                ? "Improving"
                : insights.moodTrend < 0
                ? "Declining"
                : "Stable"
            }</div>
        </div>
    `;
}

function findBestDay(moodHistory) {
  if (moodHistory.length === 0) return "No data";

  const dayAverages = {};

  moodHistory.forEach((entry) => {
    const dayOfWeek = new Date(entry.timestamp).toLocaleDateString("en-US", {
      weekday: "long",
    });
    if (!dayAverages[dayOfWeek]) {
      dayAverages[dayOfWeek] = { total: 0, count: 0 };
    }
    dayAverages[dayOfWeek].total += entry.mood;
    dayAverages[dayOfWeek].count++;
  });

  let bestDay = "No data";
  let bestAverage = 0;

  Object.keys(dayAverages).forEach((day) => {
    const average = dayAverages[day].total / dayAverages[day].count;
    if (average > bestAverage) {
      bestAverage = average;
      bestDay = day;
    }
  });

  return bestDay;
}

function calculateMoodTrend(moodHistory) {
  if (moodHistory.length < 2) return 0;

  const sortedHistory = moodHistory.sort(
    (a, b) => new Date(a.timestamp) - new Date(b.timestamp)
  );
  const firstHalf = sortedHistory.slice(
    0,
    Math.floor(sortedHistory.length / 2)
  );
  const secondHalf = sortedHistory.slice(Math.floor(sortedHistory.length / 2));

  const firstAvg =
    firstHalf.reduce((sum, entry) => sum + entry.mood, 0) / firstHalf.length;
  const secondAvg =
    secondHalf.reduce((sum, entry) => sum + entry.mood, 0) / secondHalf.length;

  return secondAvg - firstAvg;
}

function generateRecommendations() {
  const container = document.getElementById("recommendationsList");
  if (!container) return;

  const recommendations = [
    {
      title: "Practice Daily Gratitude",
      description:
        "Writing down 3 things you're grateful for each day can significantly improve your mood and overall well-being.",
    },
    {
      title: "Establish a Meditation Routine",
      description:
        "Even 5-10 minutes of daily meditation can reduce stress and increase mindfulness.",
    },
    {
      title: "Track Your Mood Patterns",
      description:
        "Regular mood tracking helps identify triggers and patterns in your emotional well-being.",
    },
    {
      title: "Set Achievable Goals",
      description:
        "Break down larger wellness goals into smaller, manageable daily actions.",
    },
  ];

  container.innerHTML = recommendations
    .map(
      (rec) => `
        <div class="recommendation-item">
            <div class="recommendation-title">${rec.title}</div>
            <div class="recommendation-description">${rec.description}</div>
        </div>
    `
    )
    .join("");
}

// Utility Functions
function showNotification(message, type = "info") {
  const container = document.getElementById("notificationContainer");
  if (!container) return;

  const notification = document.createElement("div");
  notification.className = `notification ${type}`;
  notification.textContent = message;

  container.appendChild(notification);

  // Trigger animation
  setTimeout(() => notification.classList.add("show"), 100);

  // Remove notification after 4 seconds
  setTimeout(() => {
    notification.classList.remove("show");
    setTimeout(() => {
      if (notification.parentNode) {
        notification.parentNode.removeChild(notification);
      }
    }, 300);
  }, 4000);
}

function showModal(title, content) {
  const modal = document.getElementById("modal");
  const modalOverlay = document.getElementById("modalOverlay");
  const modalTitle = document.getElementById("modalTitle");
  const modalBody = document.getElementById("modalBody");

  if (!modal || !modalOverlay) return;

  modalTitle.textContent = title;
  modalBody.innerHTML = content;
  modalOverlay.classList.add("show");
}

function closeModal() {
  const modalOverlay = document.getElementById("modalOverlay");
  if (modalOverlay) {
    modalOverlay.classList.remove("show");
  }
}

function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

function setCookie(name, value, days) {
  const expires = new Date();
  expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000);
  document.cookie = `${name}=${value};expires=${expires.toUTCString()};path=/`;
}

function getCookie(name) {
  const nameEQ = name + "=";
  const ca = document.cookie.split(";");
  for (let i = 0; i < ca.length; i++) {
    let c = ca[i];
    while (c.charAt(0) === " ") c = c.substring(1, c.length);
    if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
  }
  return null;
}

// Load initial data
function loadDashboardData() {
  return new Promise((resolve) => {
    updateDashboardStats();
    updateActivityFeed();
    resolve();
  });
}

function loadGratitudeEntries() {
  return new Promise((resolve) => {
    displayGratitudeEntries();
    resolve();
  });
}

function loadMeditationStats() {
  return new Promise((resolve) => {
    updateMeditationStats();
    resolve();
  });
}

function loadGoals() {
  return new Promise((resolve) => {
    displayGoals();
    resolve();
  });
}

// Refresh functions
function refreshMoodChart() {
  if (moodChart) {
    const moodHistory = JSON.parse(
      localStorage.getItem(STORAGE_KEYS.MOOD_HISTORY) || "[]"
    );
    const last7Days = getLast7DaysData(moodHistory);

    moodChart.data.labels = last7Days.labels;
    moodChart.data.datasets[0].data = last7Days.data;
    moodChart.update();
  }

  showNotification("Mood chart refreshed", "info");
}

function filterMoodHistory() {
  updateMoodHistory();
}

// Export functionality
window.exportData = function () {
  const data = {
    moodHistory: JSON.parse(
      localStorage.getItem(STORAGE_KEYS.MOOD_HISTORY) || "[]"
    ),
    gratitudeEntries: JSON.parse(
      localStorage.getItem(STORAGE_KEYS.GRATITUDE_ENTRIES) || "[]"
    ),
    meditationStats: JSON.parse(
      localStorage.getItem(STORAGE_KEYS.MEDITATION_STATS) || "{}"
    ),
    goals: JSON.parse(localStorage.getItem(STORAGE_KEYS.GOALS) || "[]"),
    exportDate: new Date().toISOString(),
  };

  const dataStr = JSON.stringify(data, null, 2);
  const dataBlob = new Blob([dataStr], { type: "application/json" });

  const link = document.createElement("a");
  link.href = URL.createObjectURL(dataBlob);
  link.download = `mental-fitness-data-${
    new Date().toISOString().split("T")[0]
  }.json`;
  link.click();

  showNotification("All data exported successfully!", "success");
};

// Make functions globally available
window.showSection = showSection;
window.saveMoodEnhanced = saveMoodEnhanced;
window.saveGratitudeEnhanced = saveGratitudeEnhanced;
window.clearGratitudeForm = clearGratitudeForm;
window.filterGratitudeEntries = filterGratitudeEntries;
window.exportGratitudeData = exportGratitudeData;
window.setMeditationTime = setMeditationTime;
window.toggleMeditation = toggleMeditation;
window.resetMeditation = resetMeditation;
window.toggleBreathing = toggleBreathing;
window.createGoal = createGoal;
window.updateGoalProgress = updateGoalProgress;
window.deleteGoal = deleteGoal;
window.getNewQuote = getNewQuote;
window.refreshMoodChart = refreshMoodChart;
window.filterMoodHistory = filterMoodHistory;
window.updateInsights = updateInsights;
window.closeModal = closeModal;
