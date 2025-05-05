// DOM Elements
const loginBtn = document.getElementById("loginBtn");
const loginBtnPopup = document.getElementById("loginBtnPopup");
const profileSection = document.getElementById("profileSection");
const userProfileImg = document.getElementById("userProfileImg");
const logoutDropdown = document.getElementById("logoutDropdown");
const logoutBtn = document.getElementById("logoutBtn");
const searchIcon = document.getElementById("searchIcon");
const themeToggle = document.getElementById("themeToggle");
const searchPopup = document.getElementById("searchPopup");
const closeSearch = document.getElementById("closeSearch");
const searchInput = document.getElementById("searchInput");
const clearSearch = document.getElementById("clearSearch");
const searchResults = document.getElementById("searchResults");
const currentSongCover = document.getElementById("currentSongCover");
const audioWave = document.getElementById("audioWave");
const songTitle = document.getElementById("songTitle");
const artistName = document.getElementById("artistName");
const progress = document.getElementById("progress");
const progressHandle = document.getElementById("progressHandle");
const progressBar = document.querySelector(".progress-bar");
const currentTime = document.getElementById("currentTime");
const totalTime = document.getElementById("totalTime");
const timerBtn = document.getElementById("timerBtn");
const prevBtn = document.getElementById("prevBtn");
const playPauseBtn = document.getElementById("playPauseBtn");
const playIcon = document.getElementById("playIcon");
const nextBtn = document.getElementById("nextBtn");
const repeatBtn = document.getElementById("repeatBtn");
const timerPopup = document.getElementById("timerPopup");
const closeTimer = document.getElementById("closeTimer");
const timerOptions = document.querySelectorAll(".timer-options button");
const timerActive = document.getElementById("timerActive");
const timerValue = document.getElementById("timerValue");
const cancelTimer = document.getElementById("cancelTimer");
const loginRequired = document.getElementById("loginRequired");

// Global Variables
let songs = [];
let currentSongIndex = 0;
let isPlaying = false;
let isRepeat = false;
let audio = new Audio();
let timerTimeout = null;
let progressInterval = null;
let isLoggedIn = false;
let isSearching = false;
const defaultCoverArt = "default-cover.png";

// Fetch songs data
async function fetchSongs() {
  try {
    const response = await fetch(
      "https://raw.githubusercontent.com/urlinq/xomusic/refs/heads/main/allsongs.json"
    );
    const data = await response.json();
    songs = data;

    // Start with a random song
    shuffleSongs();
    loadSong(currentSongIndex);
  } catch (error) {
    console.error("Error fetching songs:", error);
  }
}

// Shuffle songs array
function shuffleSongs() {
  for (let i = songs.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [songs[i], songs[j]] = [songs[j], songs[i]];
  }
  currentSongIndex = 0;
}

// Media Session API for notification controls
function setupMediaSession() {
  if ("mediaSession" in navigator) {
    navigator.mediaSession.metadata = new MediaMetadata({
      title: songs[currentSongIndex].title,
      artist: songs[currentSongIndex].artist,
      album: "XO Music",
      artwork: [
        {
          src: songs[currentSongIndex].coverArt || defaultCoverArt,
          sizes: "96x96",
          type: "image/png",
        },
        {
          src: songs[currentSongIndex].coverArt || defaultCoverArt,
          sizes: "128x128",
          type: "image/png",
        },
        {
          src: songs[currentSongIndex].coverArt || defaultCoverArt,
          sizes: "192x192",
          type: "image/png",
        },
        {
          src: songs[currentSongIndex].coverArt || defaultCoverArt,
          sizes: "256x256",
          type: "image/png",
        },
        {
          src: songs[currentSongIndex].coverArt || defaultCoverArt,
          sizes: "384x384",
          type: "image/png",
        },
        {
          src: songs[currentSongIndex].coverArt || defaultCoverArt,
          sizes: "512x512",
          type: "image/png",
        },
      ],
    });

    navigator.mediaSession.setActionHandler("play", () => {
      if (!isPlaying) togglePlay();
    });

    navigator.mediaSession.setActionHandler("pause", () => {
      if (isPlaying) togglePlay();
    });

    navigator.mediaSession.setActionHandler("previoustrack", prevSong);
    navigator.mediaSession.setActionHandler("nexttrack", nextSong);

    navigator.mediaSession.setActionHandler("seekto", (details) => {
      if (details.fastSeek && "fastSeek" in audio) {
        audio.fastSeek(details.seekTime);
        return;
      }
      audio.currentTime = details.seekTime;
      updateProgress();
    });
  }
}

// Load song details
function loadSong(index) {
  if (!songs.length) return;

  const song = songs[index];
  songTitle.textContent = song.title;
  artistName.textContent = song.artist;

  // Use default cover if none provided
  currentSongCover.src = song.coverArt || defaultCoverArt;

  // Set audio source
  audio.src = song.url;

  // Reset progress
  progress.style.width = "0%";
  progressHandle.style.left = "0%";
  currentTime.textContent = "0:00";
  totalTime.textContent = "0:00";

  // Pre-load audio metadata
  audio.load();

  // Setup media session for mobile notifications
  if ("mediaSession" in navigator) {
    setupMediaSession();
  }
}

// Format time in MM:SS
function formatTime(seconds) {
  if (isNaN(seconds)) return "0:00";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

// Play/Pause song
function togglePlay() {
  if (!isLoggedIn) {
    showLoginRequired();
    return;
  }

  if (isPlaying) {
    audio.pause();
    playIcon.className = "bx bx-play";
    audioWave.classList.remove("playing");

    // Stop spinning
    currentSongCover.classList.remove("spin");
  } else {
    audio.play().catch((error) => {
      console.error("Error playing audio:", error);
    });
    playIcon.className = "bx bx-pause";
    audioWave.classList.add("playing");

    // Start spinning
    currentSongCover.classList.add("spin");
  }

  isPlaying = !isPlaying;

  // Update media session playback state
  if ("mediaSession" in navigator) {
    navigator.mediaSession.playbackState = isPlaying ? "playing" : "paused";
  }
}

audio.addEventListener("ended", () => {
  isPlaying = false;
  playIcon.className = "bx bx-play";
  audioWave.classList.remove("playing");
  currentSongCover.classList.remove("spin");
});

// Update progress bar
function updateProgress() {
  if (!isPlaying) return;

  const currentSeconds = audio.currentTime;
  const totalSeconds = audio.duration;

  if (!isNaN(totalSeconds)) {
    const progressPercent = (currentSeconds / totalSeconds) * 100;
    progress.style.width = `${progressPercent}%`;
    progressHandle.style.left = `${progressPercent}%`;

    currentTime.textContent = formatTime(currentSeconds);
    totalTime.textContent = formatTime(totalSeconds);

    // Update media session position state
    if (
      "mediaSession" in navigator &&
      "setPositionState" in navigator.mediaSession
    ) {
      navigator.mediaSession.setPositionState({
        duration: audio.duration,
        position: audio.currentTime,
        playbackRate: audio.playbackRate,
      });
    }
  }
}

// Set progress on click
function setProgress(e) {
  if (!isLoggedIn) {
    showLoginRequired();
    return;
  }

  const width = progressBar.clientWidth;
  const clickX = e.offsetX;
  const duration = audio.duration;

  audio.currentTime = (clickX / width) * duration;
  updateProgress();
}

// Play next song
function nextSong() {
  if (!isLoggedIn) {
    showLoginRequired();
    return;
  }

  currentSongIndex = (currentSongIndex + 1) % songs.length;
  loadSong(currentSongIndex);

  if (isPlaying) {
    audio.play();
  }
}

// Play previous song
function prevSong() {
  if (!isLoggedIn) {
    showLoginRequired();
    return;
  }

  currentSongIndex = (currentSongIndex - 1 + songs.length) % songs.length;
  loadSong(currentSongIndex);

  if (isPlaying) {
    audio.play();
  }
}

// Toggle repeat mode
function toggleRepeat() {
  if (!isLoggedIn) {
    showLoginRequired();
    return;
  }

  isRepeat = !isRepeat;

  if (isRepeat) {
    repeatBtn.classList.add("active");
    audio.loop = true;

    // Change icon to repeat-1
    repeatBtn.innerHTML = '<i class="dus-repeat_one"></i>';
  } else {
    repeatBtn.classList.remove("active");
    audio.loop = false;

    // Restore original repeat icon
    repeatBtn.innerHTML = '<i class="dus-repeat2"></i>';
  }
}

// Show login required popup
function showLoginRequired() {
  loginRequired.style.display = "flex";
}

// Hide login required popup
function hideLoginRequired() {
  loginRequired.style.display = "none";
}

// Search functionality
function showSearch() {
  searchPopup.style.display = "flex";
  searchInput.focus();
  isSearching = true;
}

function hideSearch() {
  searchPopup.style.display = "none";
  searchInput.value = "";
  searchResults.innerHTML = "";
  isSearching = false;
}

function clearSearchInput() {
  searchInput.value = "";
  searchInput.focus();
  searchResults.innerHTML = "";
}

function performSearch(query) {
  if (!query.trim()) {
    searchResults.innerHTML = "";
    return;
  }

  const results = songs.filter(
    (song) =>
      song.title.toLowerCase().includes(query.toLowerCase()) ||
      song.artist.toLowerCase().includes(query.toLowerCase())
  );

  displaySearchResults(results);
}

function displaySearchResults(results) {
  searchResults.innerHTML = "";

  if (results.length === 0) {
    searchResults.innerHTML = '<div class="no-results">No songs found</div>';
    return;
  }

  results.forEach((song, index) => {
    const resultItem = document.createElement("div");
    resultItem.className = "search-result-item";
    resultItem.innerHTML = `
            <img src="${song.coverArt || defaultCoverArt}" alt="${song.title}">
            <div class="search-result-info">
                <h4>${song.title}</h4>
                <p>${song.artist}</p>
            </div>
        `;

    resultItem.addEventListener("click", () => {
      // Find the index of this song in the original array
      const songIndex = songs.findIndex((s) => s.id === song.id);
      if (songIndex !== -1) {
        currentSongIndex = songIndex;
        loadSong(currentSongIndex);

        if (isLoggedIn) {
          isPlaying = false; // Reset so togglePlay will start playing
          togglePlay();
        } else {
          showLoginRequired();
        }
      }
      hideSearch();
    });

    searchResults.appendChild(resultItem);
  });
}

// Timer functionality
function showTimer() {
  timerPopup.classList.add("show");
}

function hideTimer() {
  timerPopup.classList.remove("show");
}

function setTimer(minutes) {
  // Clear previous timer if exists
  if (timerTimeout) {
    clearTimeout(timerTimeout);
    timerTimeout = null;
  }

  // Set new timer
  const milliseconds = minutes * 60 * 1000;
  timerTimeout = setTimeout(() => {
    audio.pause();
    isPlaying = false;
    playIcon.className = "bx bx-play";
    audioWave.classList.remove("playing");
    timerActive.style.display = "none";
    timerBtn.classList.remove("active");
  }, milliseconds);

  // Update UI
  timerValue.textContent = minutes;
  timerActive.style.display = "block";
  timerBtn.classList.add("active");
}

function cancelTimerFunction() {
  if (timerTimeout) {
    clearTimeout(timerTimeout);
    timerTimeout = null;
  }

  timerActive.style.display = "none";
  timerBtn.classList.remove("active");
}

// Theme toggle functionality
function toggleTheme() {
  const body = document.body;

  if (body.classList.contains("dark-theme")) {
    body.classList.remove("dark-theme");
    body.classList.add("light-theme");
    themeToggle.className = "bx bx-sun";
  } else {
    body.classList.remove("light-theme");
    body.classList.add("dark-theme");
    themeToggle.className = "bx bx-moon";
  }
}

// Firebase Authentication
function initAuth() {
  const { auth, onAuthStateChanged } = window.firebaseAuth;

  onAuthStateChanged(auth, (user) => {
    if (user) {
      // User is signed in
      isLoggedIn = true;
      loginBtn.style.display = "none";
      profileSection.style.display = "block";
      // If user has a profile picture, use it
      if (user.photoURL) {
        userProfileImg.src = user.photoURL;
      }
    } else {
      // User is signed out
      isLoggedIn = false;
      loginBtn.style.display = "block";
      profileSection.style.display = "none";
      userProfileImg.src = "user.svg";
    }
  });
}

function logout() {
  const { auth, signOut } = window.firebaseAuth;

  signOut(auth)
    .then(() => {
      // Sign-out successful
      isLoggedIn = false;
      logoutDropdown.style.display = "none";

      // If a song is playing, pause it
      if (isPlaying) {
        audio.pause();
        isPlaying = false;
        playIcon.className = "bx bx-play";
        audioWave.classList.remove("playing");
      }
    })
    .catch((error) => {
      console.error("Error signing out:", error);
    });
}

function goToLoginPage() {
  window.location.href = "login-signup.html";
}

// Event Listeners
document.addEventListener("DOMContentLoaded", () => {
  // Initialize Firebase Auth
  initAuth();

  // Fetch songs
  fetchSongs();

  // Audio event listeners
  audio.addEventListener("ended", () => {
    if (!isRepeat) {
      nextSong();
    }
  });

  audio.addEventListener("timeupdate", updateProgress);

  audio.addEventListener("loadedmetadata", () => {
    totalTime.textContent = formatTime(audio.duration);
  });

  // Player controls
  playPauseBtn.addEventListener("click", togglePlay);
  nextBtn.addEventListener("click", nextSong);
  prevBtn.addEventListener("click", prevSong);
  repeatBtn.addEventListener("click", toggleRepeat);
  progressBar.addEventListener("click", setProgress);

  // Timer
  timerBtn.addEventListener("click", showTimer);
  closeTimer.addEventListener("click", hideTimer);
  cancelTimer.addEventListener("click", cancelTimerFunction);

  timerOptions.forEach((option) => {
    option.addEventListener("click", () => {
      const minutes = parseInt(option.getAttribute("data-time"));
      setTimer(minutes);
    });
  });

  // Search
  searchIcon.addEventListener("click", showSearch);
  closeSearch.addEventListener("click", hideSearch);
  clearSearch.addEventListener("click", clearSearchInput);

  searchInput.addEventListener("input", (e) => {
    performSearch(e.target.value);
  });

  // Theme toggle
  themeToggle.addEventListener("click", toggleTheme);

  // Profile/login
  userProfileImg.addEventListener("click", () => {
    logoutDropdown.style.display =
      logoutDropdown.style.display === "block" ? "none" : "block";
  });

  logoutBtn.addEventListener("click", logout);

  loginBtn.addEventListener("click", goToLoginPage);
  loginBtnPopup.addEventListener("click", goToLoginPage);

  // Close logout dropdown when clicking outside
  document.addEventListener("click", (e) => {
    if (
      !profileSection.contains(e.target) &&
      logoutDropdown.style.display === "block"
    ) {
      logoutDropdown.style.display = "none";
    }
  });

  // Close login required popup when clicking outside
  loginRequired.addEventListener("click", (e) => {
    if (e.target === loginRequired) {
      hideLoginRequired();
    }
  });

  // Handle keyboard events
  document.addEventListener("keydown", (e) => {
    if (isSearching) return; // Don't handle keyboard events when searching

    switch (e.key) {
      case " ": // Space
        e.preventDefault();
        togglePlay();
        break;
      case "ArrowRight":
        nextSong();
        break;
      case "ArrowLeft":
        prevSong();
        break;
      case "r":
        toggleRepeat();
        break;
      case "Escape":
        if (timerPopup.classList.contains("show")) {
          hideTimer();
        }
        break;
    }
  });
});

if ("serviceWorker" in navigator) {
  navigator.serviceWorker
    .register("service-worker.js")
    .then(() => console.log("✔ Service Worker Registered"));
}

let deferredPrompt;

window.addEventListener("beforeinstallprompt", (e) => {
  // Prevent Chrome's default mini-infobar
  e.preventDefault();
  deferredPrompt = e;

  // Show our custom banner
  const banner = document.getElementById("install-banner");
  banner.style.display = "block";

  // Handle Install button click
  document.getElementById("install-btn").addEventListener("click", () => {
    banner.style.display = "none";
    deferredPrompt.prompt();

    deferredPrompt.userChoice.then((choiceResult) => {
      if (choiceResult.outcome === "accepted") {
        console.log("✅ User accepted the install prompt");
        localStorage.setItem("xo_installed", "yes");
      } else {
        console.log("❌ User dismissed the install prompt");
      }
      deferredPrompt = null;
    });
  });
});

// Always check on load if not installed
window.addEventListener("load", () => {
  if (localStorage.getItem("xo_installed") !== "yes") {
    // Still not installed, keep banner ready (if prompt is available)
    console.log("📢 App not installed yet.");
  }
});
