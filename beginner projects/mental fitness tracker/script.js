// Global variables
let currentMood = 3;
const moodEmojis = ["😢", "😕", "😐", "😊", "😄"];

// Initialize app
document.addEventListener("DOMContentLoaded", function () {
  initializeApp();
});

function initializeApp() {
  loadTheme();
  loadMoodFromSession();
  loadGratitudeHistory();
  getNewQuote();
  updateStats();
  setupMoodSlider();
}

// Theme Management
function toggleTheme() {
  const currentTheme = document.documentElement.getAttribute("data-theme");
  const newTheme = currentTheme === "dark" ? "light" : "dark";

  document.documentElement.setAttribute("data-theme", newTheme);
  document.getElementById("theme-icon").textContent =
    newTheme === "dark" ? "☀️" : "🌙";

  // Save theme preference in cookies
  setCookie("theme", newTheme, 365);

  showFeedback(`Switched to ${newTheme} mode`);
}

function loadTheme() {
  const savedTheme = getCookie("theme") || "light";
  document.documentElement.setAttribute("data-theme", savedTheme);
  document.getElementById("theme-icon").textContent =
    savedTheme === "dark" ? "☀️" : "🌙";
}

// Mood Tracking
function setupMoodSlider() {
  const slider = document.getElementById("moodSlider");
  const display = document.getElementById("moodDisplay");

  slider.addEventListener("input", function () {
    currentMood = parseInt(this.value);
    display.textContent = moodEmojis[currentMood - 1];
    display.classList.add("pulse");
    setTimeout(() => display.classList.remove("pulse"), 500);
  });
}

function saveMood() {
  // Save to sessionStorage (clears when tab closes)
  sessionStorage.setItem("currentMood", currentMood);
  sessionStorage.setItem("moodTimestamp", new Date().toISOString());

  // Also save to localStorage for statistics
  const moodHistory = JSON.parse(localStorage.getItem("moodHistory") || "[]");
  moodHistory.push({
    mood: currentMood,
    date: new Date().toISOString().split("T")[0],
    timestamp: new Date().toISOString(),
  });
  localStorage.setItem("moodHistory", JSON.stringify(moodHistory));

  document.getElementById(
    "moodFeedback"
  ).textContent = `✅ Mood saved! You're feeling ${getMoodText(
    currentMood
  )} today.`;

  showFeedback("Mood saved successfully!");
  updateStats();
}

function loadMoodFromSession() {
  const savedMood = sessionStorage.getItem("currentMood");
  if (savedMood) {
    currentMood = parseInt(savedMood);
    document.getElementById("moodSlider").value = currentMood;
    document.getElementById("moodDisplay").textContent =
      moodEmojis[currentMood - 1];

    const timestamp = sessionStorage.getItem("moodTimestamp");
    if (timestamp) {
      const savedDate = new Date(timestamp).toLocaleDateString();
      document.getElementById(
        "moodFeedback"
      ).textContent = `Last saved: ${savedDate} - ${getMoodText(currentMood)}`;
    }
  }
}

function getMoodText(mood) {
  const moodTexts = ["terrible", "bad", "okay", "good", "amazing"];
  return moodTexts[mood - 1];
}

// Gratitude Journal
function saveGratitude() {
  const gratitudeText = document.getElementById("gratitudeText").value.trim();

  if (!gratitudeText) {
    showFeedback("Please write something you're grateful for!", "warning");
    return;
  }

  const gratitudeEntries = JSON.parse(
    localStorage.getItem("gratitudeEntries") || "[]"
  );
  const newEntry = {
    id: Date.now(),
    text: gratitudeText,
    date: new Date().toISOString(),
    displayDate: new Date().toLocaleDateString("en-US", {
      weekday: "short",
      year: "numeric",
      month: "short",
      day: "numeric",
    }),
  };

  gratitudeEntries.unshift(newEntry); // Add to beginning
  localStorage.setItem("gratitudeEntries", JSON.stringify(gratitudeEntries));

  document.getElementById("gratitudeText").value = "";
  loadGratitudeHistory();
  updateStats();

  showFeedback("Gratitude entry saved! 🙏");
}

function loadGratitudeHistory() {
  const gratitudeEntries = JSON.parse(
    localStorage.getItem("gratitudeEntries") || "[]"
  );
  const entriesContainer = document.getElementById("gratitudeEntries");

  if (gratitudeEntries.length === 0) {
    entriesContainer.innerHTML =
      '<p style="color: var(--text-secondary); text-align: center; padding: 20px;">No entries yet. Start by writing what you\'re grateful for!</p>';
    return;
  }

  // Show only the last 5 entries
  const recentEntries = gratitudeEntries.slice(0, 5);
  entriesContainer.innerHTML = recentEntries
    .map(
      (entry) => `
                <div class="gratitude-entry">
                    <div class="gratitude-entry-date">${entry.displayDate}</div>
                    <div>${entry.text}</div>
                </div>
            `
    )
    .join("");
}

// Motivational Quotes
async function getNewQuote() {
  const quoteText = document.getElementById("quoteText");
  const quoteAuthor = document.getElementById("quoteAuthor");
  const buttonText = document.getElementById("quoteButtonText");

  // Show loading state
  buttonText.innerHTML = '<span class="loading"></span>';
  quoteText.textContent = "Loading inspiration...";
  quoteAuthor.textContent = "";

  try {
    // Using quotable.io API - free and doesn't require authentication
    const response = await fetch(
      "https://api.quotable.io/random?minLength=50&maxLength=150"
    );

    if (!response.ok) {
      throw new Error("Failed to fetch quote");
    }

    const data = await response.json();

    // Animate the quote change
    quoteText.style.opacity = "0";
    setTimeout(() => {
      quoteText.textContent = `"${data.content}"`;
      quoteAuthor.textContent = `— ${data.author}`;
      quoteText.style.opacity = "1";
    }, 300);
  } catch (error) {
    console.error("Error fetching quote:", error);

    // Fallback quotes if API fails
    const fallbackQuotes = [
      {
        content: "The only way to do great work is to love what you do.",
        author: "Steve Jobs",
      },
      {
        content:
          "Life is what happens to you while you're busy making other plans.",
        author: "John Lennon",
      },
      {
        content:
          "The future belongs to those who believe in the beauty of their dreams.",
        author: "Eleanor Roosevelt",
      },
      {
        content:
          "It is during our darkest moments that we must focus to see the light.",
        author: "Aristotle",
      },
      {
        content:
          "Success is not final, failure is not fatal: it is the courage to continue that counts.",
        author: "Winston Churchill",
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
  } finally {
    buttonText.textContent = "Get New Quote";
  }
}

// Statistics
function updateStats() {
  const gratitudeEntries = JSON.parse(
    localStorage.getItem("gratitudeEntries") || "[]"
  );
  const moodHistory = JSON.parse(localStorage.getItem("moodHistory") || "[]");

  // Total entries
  document.getElementById("totalEntries").textContent = gratitudeEntries.length;

  // Average mood
  if (moodHistory.length > 0) {
    const avgMood =
      moodHistory.reduce((sum, entry) => sum + entry.mood, 0) /
      moodHistory.length;
    document.getElementById("averageMood").textContent = avgMood.toFixed(1);
  }

  // Streak calculation (simplified - consecutive days with entries)
  const streak = calculateStreak(gratitudeEntries);
  document.getElementById("streakDays").textContent = streak;
}

function calculateStreak(entries) {
  if (entries.length === 0) return 0;

  const today = new Date().toDateString();
  const sortedEntries = entries.sort(
    (a, b) => new Date(b.date) - new Date(a.date)
  );

  let streak = 0;
  let currentDate = new Date();

  for (let entry of sortedEntries) {
    const entryDate = new Date(entry.date).toDateString();
    const checkDate = currentDate.toDateString();

    if (entryDate === checkDate) {
      streak++;
      currentDate.setDate(currentDate.getDate() - 1);
    } else {
      break;
    }
  }

  return streak;
}

// Utility Functions
function showFeedback(message, type = "success") {
  const feedback = document.getElementById("feedbackModal");
  const feedbackText = document.getElementById("feedbackText");

  feedbackText.textContent = message;
  feedback.style.background =
    type === "warning" ? "var(--warning-color)" : "var(--success-color)";
  feedback.classList.add("show");

  setTimeout(() => {
    feedback.classList.remove("show");
  }, 2000);
}

// Cookie Management
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

// Add some keyboard shortcuts for better UX
document.addEventListener("keydown", function (e) {
  // Ctrl/Cmd + Enter to save gratitude
  if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
    if (document.activeElement === document.getElementById("gratitudeText")) {
      saveGratitude();
    }
  }

  // Escape to clear gratitude text
  if (e.key === "Escape") {
    if (document.activeElement === document.getElementById("gratitudeText")) {
      document.getElementById("gratitudeText").value = "";
    }
  }
});

// Add smooth scrolling for better UX
document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
  anchor.addEventListener("click", function (e) {
    e.preventDefault();
    document.querySelector(this.getAttribute("href")).scrollIntoView({
      behavior: "smooth",
    });
  });
});
