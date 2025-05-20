// XoFilmy App.js - Main application functionality

import { getTrendingMovies, getLatestMovies, searchMovies, getMovieById, getMovieBySlug } from './data.js';

// DOM Elements
let menuBtn;
let searchBtn;
let menuOverlay;
let searchOverlay;
let darkModeToggle;
let lastVisibleDoc = null;
let currentPage = 1;

// Show skeleton loading immediately before DOM is fully loaded
showInitialSkeletons();

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Initialize UI elements
    initUI();
    
    // Load trending movies
    loadTrendingMovies();
    
    // Load latest movies
    loadLatestMovies();
    
    // Check and apply theme
    checkTheme();
    
    // Register service worker
    registerServiceWorker();
});

// Show skeleton loading immediately
function showInitialSkeletons() {
    // Check if we're on the home page
    if (window.location.pathname.endsWith('index.html') || window.location.pathname.endsWith('/')) {
        // Create skeleton for trending section
        const trendingSection = document.createElement('div');
        trendingSection.id = 'trending-movies';
        trendingSection.className = 'trending-container';
        
        // Add 5 skeleton cards to trending section
        for (let i = 0; i < 5; i++) {
            const skeletonHTML = `
                <div class="skeleton-card">
                    <div class="skeleton-poster skeleton-pulse"></div>
                    <div class="skeleton-info">
                        <div class="skeleton-title skeleton-pulse"></div>
                        <div class="skeleton-category skeleton-pulse"></div>
                    </div>
                </div>
            `;
            trendingSection.innerHTML += skeletonHTML;
        }
        
        // Create skeleton for latest section
        const latestSection = document.createElement('div');
        latestSection.id = 'latest-movies';
        latestSection.className = 'latest-container';
        
        // Add 20 skeleton cards to latest section
        for (let i = 0; i < 20; i++) {
            const skeletonHTML = `
                <div class="skeleton-card">
                    <div class="skeleton-poster skeleton-pulse"></div>
                    <div class="skeleton-info">
                        <div class="skeleton-title skeleton-pulse"></div>
                        <div class="skeleton-category skeleton-pulse"></div>
                    </div>
                </div>
            `;
            latestSection.innerHTML += skeletonHTML;
        }
        
        // Insert skeletons as soon as possible
        window.addEventListener('DOMContentLoaded', () => {
            const trendingContainer = document.getElementById('trending-movies');
            const latestContainer = document.getElementById('latest-movies');
            
            if (trendingContainer) {
                trendingContainer.innerHTML = trendingSection.innerHTML;
            }
            
            if (latestContainer) {
                latestContainer.innerHTML = latestSection.innerHTML;
            }
        }, { once: true });
    }
}

// Initialize UI elements and event listeners
function initUI() {
    // Menu elements
    menuBtn = document.getElementById('menu-btn');
    menuOverlay = document.getElementById('menu-overlay');
    const closeMenuBtn = document.getElementById('close-menu-btn');
    
    // Search elements
    searchBtn = document.getElementById('search-btn');
    searchOverlay = document.getElementById('search-overlay');
    const closeSearchBtn = document.getElementById('close-search-btn');
    const searchForm = document.getElementById('search-form');
    
    // Theme toggle
    darkModeToggle = document.getElementById('dark-mode-toggle');
    
    // Pagination elements
    const prevPageBtn = document.getElementById('prev-page');
    const nextPageBtn = document.getElementById('next-page');
    
    // Event listeners for menu
    if (menuBtn) {
        menuBtn.addEventListener('click', toggleMenu);
    }
    
    if (closeMenuBtn) {
        closeMenuBtn.addEventListener('click', toggleMenu);
    }
    
    // Event listeners for search
    if (searchBtn) {
        searchBtn.addEventListener('click', toggleSearch);
    }
    
    if (closeSearchBtn) {
        closeSearchBtn.addEventListener('click', toggleSearch);
    }
    
    // Event listener for search form
    if (searchForm) {
        searchForm.addEventListener('submit', handleSearch);
    }
    
    // Event listener for theme toggle
    if (darkModeToggle) {
        darkModeToggle.addEventListener('click', toggleTheme);
    }
    
    // Event listeners for pagination
    if (prevPageBtn) {
        prevPageBtn.addEventListener('click', () => navigatePage('prev'));
    }
    
    if (nextPageBtn) {
        nextPageBtn.addEventListener('click', () => navigatePage('next'));
    }
}

// Toggle menu overlay
function toggleMenu() {
    if (menuOverlay) {
        menuOverlay.classList.toggle('active');
        document.body.classList.toggle('no-scroll');
    }
}

// Toggle search overlay
function toggleSearch() {
    if (searchOverlay) {
        searchOverlay.classList.toggle('active');
        document.body.classList.toggle('no-scroll');
        
        // Focus on search input when opened
        if (searchOverlay.classList.contains('active')) {
            document.getElementById('search-input').focus();
        }
    }
}

// Handle search form submission
async function handleSearch(e) {
    e.preventDefault();
    
    const searchInput = document.getElementById('search-input');
    const searchTerm = searchInput.value.trim();
    const searchResults = document.getElementById('search-results');
    const noResults = document.getElementById('no-results');
    
    if (searchTerm === '') {
        return;
    }
    
    // Show loading state
    searchResults.innerHTML = '<div class="loading">Searching...</div>';
    noResults.style.display = 'none';
    
    try {
        // Get search results from Firebase
        const results = await searchMovies(searchTerm);
        
        // Display results
        if (results.length > 0) {
            displaySearchResults(results);
            noResults.style.display = 'none';
        } else {
            searchResults.innerHTML = '';
            noResults.style.display = 'flex';
        }
    } catch (error) {
        console.error('Search error:', error);
        searchResults.innerHTML = '<div class="error">An error occurred. Please try again.</div>';
    }
}

// Display search results
function displaySearchResults(results) {
    const searchResults = document.getElementById('search-results');
    
    // Clear previous results
    searchResults.innerHTML = '';
    
    // Create movie cards for each result
    results.forEach(movie => {
        const movieCard = createMovieCard(movie);
        searchResults.appendChild(movieCard);
    });
}

// Load trending movies
async function loadTrendingMovies() {
    const trendingSection = document.getElementById('trending-movies');
    
    if (!trendingSection) {
        return;
    }
    
    try {
        // Show skeleton loading
        trendingSection.innerHTML = '';
        for (let i = 0; i < 5; i++) {
            trendingSection.appendChild(createSkeletonCard());
        }
        
        // Get trending movies from Firebase
        const trendingMovies = await getTrendingMovies(5);
        
        // Clear loading state
        trendingSection.innerHTML = '';
        
        // Display trending movies
        if (trendingMovies.length > 0) {
            trendingMovies.forEach(movie => {
                // Only add trending tag if the movie is actually marked as trending
                const isTrending = movie.trending === true;
                const movieCard = createMovieCard(movie, isTrending);
                trendingSection.appendChild(movieCard);
            });
        } else {
            trendingSection.innerHTML = '<div class="no-movies">No trending movies available.</div>';
        }
    } catch (error) {
        console.error('Error loading trending movies:', error);
        trendingSection.innerHTML = '<div class="error">Failed to load trending movies.</div>';
    }
}

// Load latest movies with pagination
async function loadLatestMovies() {
    const latestSection = document.getElementById('latest-movies');
    const pageInfo = document.getElementById('page-info');
    
    if (!latestSection) {
        return;
    }
    
    try {
        // Show skeleton loading
        latestSection.innerHTML = '';
        for (let i = 0; i < 20; i++) {
            latestSection.appendChild(createSkeletonCard());
        }
        
        // Get latest movies from Firebase
        const { movies, lastVisible } = await getLatestMovies(lastVisibleDoc, 20);
        
        // Update last visible document for pagination
        lastVisibleDoc = lastVisible;
        
        // Clear loading state
        latestSection.innerHTML = '';
        
        // Update page info
        if (pageInfo) {
            pageInfo.textContent = `Page ${currentPage}`;
        }
        
        // Display latest movies
        if (movies.length > 0) {
            movies.forEach(movie => {
                const movieCard = createMovieCard(movie);
                latestSection.appendChild(movieCard);
            });
        } else {
            latestSection.innerHTML = '<div class="no-movies">No movies available.</div>';
        }
    } catch (error) {
        console.error('Error loading latest movies:', error);
        latestSection.innerHTML = '<div class="error">Failed to load latest movies.</div>';
    }
}

// Create a movie card element
function createMovieCard(movie, isTrending = false) {
    const movieCard = document.createElement('div');
    movieCard.className = 'movie-card';
    
    // Create URL-friendly movie name
    const movieSlug = createMovieSlug(movie.title);
    
    // Create movie card HTML
    movieCard.innerHTML = `
        <a href="movie.html?${movieSlug}" class="movie-link" data-id="${movie.id}">
            <div class="movie-poster">
                <img src="${movie.coverUrl}" alt="${movie.title}" loading="lazy">
                ${isTrending ? '<span class="trending-tag">Trending</span>' : ''}
            </div>
            <div class="movie-info">
                <h3 class="movie-title">${movie.title}</h3>
                <p class="movie-category">${movie.category}</p>
            </div>
        </a>
    `;
    
    return movieCard;
}

// Create URL-friendly slug from movie title
function createMovieSlug(title) {
    // Remove special characters, replace spaces with hyphens, and convert to lowercase
    return title
        .toLowerCase()
        .replace(/[^\w\s-]/g, '') // Remove special characters
        .replace(/\s+/g, '-') // Replace spaces with hyphens
        .replace(/-+/g, '-'); // Replace multiple hyphens with single hyphen
}

// Create skeleton loading card
function createSkeletonCard() {
    const skeletonCard = document.createElement('div');
    skeletonCard.className = 'skeleton-card';
    
    // Create skeleton card HTML
    skeletonCard.innerHTML = `
        <div class="skeleton-poster skeleton-pulse"></div>
        <div class="skeleton-info">
            <div class="skeleton-title skeleton-pulse"></div>
            <div class="skeleton-category skeleton-pulse"></div>
        </div>
    `;
    
    return skeletonCard;
}

// Navigate between pages
async function navigatePage(direction) {
    // Disable buttons during navigation to prevent multiple clicks
    const prevBtn = document.getElementById('prev-page');
    const nextBtn = document.getElementById('next-page');
    
    if (prevBtn) prevBtn.disabled = true;
    if (nextBtn) nextBtn.disabled = true;
    
    try {
        if (direction === 'prev' && currentPage > 1) {
            currentPage--;
            lastVisibleDoc = null; // Reset to first page
            
            // Load previous pages
            for (let i = 1; i < currentPage; i++) {
                const { lastVisible } = await getLatestMovies(lastVisibleDoc, 20);
                lastVisibleDoc = lastVisible;
            }
            
            // Scroll to top of the latest movies section
            const latestSection = document.querySelector('.movie-section:nth-of-type(2)');
            if (latestSection) {
                latestSection.scrollIntoView({ behavior: 'smooth' });
            }
            
            loadLatestMovies();
        } else if (direction === 'next' && lastVisibleDoc) {
            currentPage++;
            
            // Scroll to top of the latest movies section
            const latestSection = document.querySelector('.movie-section:nth-of-type(2)');
            if (latestSection) {
                latestSection.scrollIntoView({ behavior: 'smooth' });
            }
            
            loadLatestMovies();
        }
    } finally {
        // Re-enable buttons after navigation
        setTimeout(() => {
            if (prevBtn) prevBtn.disabled = false;
            if (nextBtn) nextBtn.disabled = false;
        }, 500); // Small delay to prevent accidental double clicks
    }
}

// Toggle between dark and light theme
function toggleTheme() {
    const htmlElement = document.documentElement;
    const themeToggleText = document.querySelector('.theme-toggle-text');
    
    if (htmlElement.classList.contains('dark-theme')) {
        htmlElement.classList.remove('dark-theme');
        localStorage.setItem('theme', 'light');
        if (themeToggleText) themeToggleText.textContent = 'Dark Mode';
    } else {
        htmlElement.classList.add('dark-theme');
        localStorage.setItem('theme', 'dark');
        if (themeToggleText) themeToggleText.textContent = 'Light Mode';
    }
}

// Check and apply saved theme
function checkTheme() {
    const savedTheme = localStorage.getItem('theme');
    const htmlElement = document.documentElement;
    const themeToggleText = document.querySelector('.theme-toggle-text');
    
    if (savedTheme === 'dark') {
        htmlElement.classList.add('dark-theme');
        if (themeToggleText) themeToggleText.textContent = 'Light Mode';
    } else {
        htmlElement.classList.remove('dark-theme');
        if (themeToggleText) themeToggleText.textContent = 'Dark Mode';
    }
}

// Register service worker for PWA functionality
function registerServiceWorker() {
    if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
            navigator.serviceWorker.register('/sw.js')
                .then(registration => {
                    console.log('ServiceWorker registration successful with scope: ', registration.scope);
                })
                .catch(error => {
                    console.log('ServiceWorker registration failed: ', error);
                });
        });
    }
}

// Initialize movie page if on movie.html
if (window.location.pathname.includes('movie.html')) {
    document.addEventListener('DOMContentLoaded', initMoviePage);
}

// Initialize movie page
async function initMoviePage() {
    try {
        // Show skeleton loading
        showMovieSkeleton(true);
        
        // Get movie slug from URL
        const queryString = window.location.search.substring(1); // Remove the '?' character
        
        // If there's no query string or it contains 'id=', use the old method for backward compatibility
        if (!queryString || queryString.includes('id=')) {
            const urlParams = new URLSearchParams(window.location.search);
            const movieId = urlParams.get('id');
            
            if (!movieId) {
                window.location.href = 'index.html';
                return;
            }
            
            // Get movie details by ID
            const movie = await getMovieById(movieId);
            
            if (!movie) {
                window.location.href = 'index.html';
                return;
            }
            
            // Update URL to use the new format without reloading the page
            const movieSlug = createMovieSlug(movie.title);
            const newUrl = `movie.html?${movieSlug}`;
            window.history.replaceState({}, document.title, newUrl);
            
            // Display movie details
            displayMovieDetails(movie);
            
            // Load related movies
            await loadRelatedMovies(movie);
            
            // Hide skeleton loading
            showMovieSkeleton(false);
        } else {
            // New method: Get movie by slug
            const movieSlug = queryString; // The query string is the slug
            
            // Get movie details by slug
            const movie = await getMovieBySlug(movieSlug);
            
            if (!movie) {
                window.location.href = 'index.html';
                return;
            }
            
            // Display movie details
            displayMovieDetails(movie);
            
            // Load related movies
            await loadRelatedMovies(movie);
            
            // Hide skeleton loading
            showMovieSkeleton(false);
        }
    } catch (error) {
        console.error('Error loading movie details:', error);
        // Hide skeleton loading even on error
        showMovieSkeleton(false);
        window.location.href = 'index.html';
    }
}

// Show or hide skeleton loading
function showMovieSkeleton(show) {
    const skeletonElement = document.getElementById('movie-skeleton');
    const movieDetailElement = document.getElementById('movie-detail');
    
    if (skeletonElement && movieDetailElement) {
        if (show) {
            skeletonElement.style.display = 'block';
            movieDetailElement.style.display = 'none';
        } else {
            // Add a small delay for a smoother transition
            setTimeout(() => {
                skeletonElement.style.display = 'none';
                movieDetailElement.style.display = 'block';
                
                // Add a fade-in effect when showing the actual content
                movieDetailElement.style.opacity = '0';
                movieDetailElement.style.transition = 'opacity 0.3s ease';
                
                // Force a reflow to ensure the transition works
                void movieDetailElement.offsetWidth;
                
                movieDetailElement.style.opacity = '1';
            }, 300);
        }
    }
}

// Display movie details on movie page
function displayMovieDetails(movie) {
    // Set page title
    document.title = `${movie.title} - XoFilmy`;
    
    // Update Open Graph meta tags for social media sharing
    updateOpenGraphTags(movie);
    
    // Set movie title
    const movieTitle = document.getElementById('movie-title');
    if (movieTitle) {
        movieTitle.textContent = movie.title;
    }
    
    // Set movie cover
    const movieCover = document.getElementById('movie-cover');
    if (movieCover) {
        movieCover.src = movie.coverUrl;
        movieCover.alt = movie.title;
    }
    
    // Set movie details
    const movieDetails = document.getElementById('movie-details');
    if (movieDetails) {
        movieDetails.innerHTML = `
            <div class="detail-item">
                <span class="detail-label">Genre:</span>
                <span class="detail-value">${movie.genre}</span>
            </div>
            <div class="detail-item">
                <span class="detail-label">Duration:</span>
                <span class="detail-value">${movie.duration}</span>
            </div>
            <div class="detail-item">
                <span class="detail-label">Release Date:</span>
                <span class="detail-value">${movie.releaseDate}</span>
            </div>
            <div class="detail-item">
                <span class="detail-label">Language:</span>
                <span class="detail-value">${movie.language}</span>
            </div>
            <div class="detail-item">
                <span class="detail-label">Starcast:</span>
                <span class="detail-value">${movie.starcast}</span>
            </div>
            <div class="detail-item">
                <span class="detail-label">Size:</span>
                <span class="detail-value">${movie.size}</span>
            </div>
        `;
    }
    
    // Set movie description
    const movieDescription = document.getElementById('movie-description');
    if (movieDescription) {
        movieDescription.textContent = movie.description;
    }
    
    // Set download link
    const downloadBtn = document.getElementById('download-btn');
    if (downloadBtn) {
        downloadBtn.href = movie.downloadLink;
    }
    
    // Set screenshots
    const screenshotSection = document.getElementById('screenshots');
    if (screenshotSection && movie.screenshots && movie.screenshots.length > 0) {
        screenshotSection.innerHTML = '';
        
        movie.screenshots.forEach(screenshot => {
            const screenshotItem = document.createElement('div');
            screenshotItem.className = 'screenshot-item';
            screenshotItem.innerHTML = `<img src="${screenshot}" alt="Screenshot" loading="lazy">`;
            screenshotSection.appendChild(screenshotItem);
        });
    }
}

// Update Open Graph meta tags for social media sharing
function updateOpenGraphTags(movie) {
    // Helper function to create or update meta tags
    function setMetaTag(property, content) {
        let metaTag = document.querySelector(`meta[property="${property}"]`);
        
        if (!metaTag) {
            metaTag = document.createElement('meta');
            metaTag.setAttribute('property', property);
            document.head.appendChild(metaTag);
        }
        
        metaTag.setAttribute('content', content);
    }
    
    // Set Open Graph meta tags
    setMetaTag('og:title', `${movie.title} - XoFilmy`);
    setMetaTag('og:description', movie.description.substring(0, 150) + '...');
    setMetaTag('og:image', movie.coverUrl);
    setMetaTag('og:url', window.location.href);
    setMetaTag('og:type', 'website');
    
    // Set Twitter Card meta tags
    setMetaTag('twitter:card', 'summary_large_image');
    setMetaTag('twitter:title', `${movie.title} - XoFilmy`);
    setMetaTag('twitter:description', movie.description.substring(0, 150) + '...');
    setMetaTag('twitter:image', movie.coverUrl);
}

// Load related movies on movie page
async function loadRelatedMovies(currentMovie) {
    const relatedSection = document.getElementById('related-movies');
    
    if (!relatedSection) {
        return;
    }
    
    try {
        // Import getRelatedMovies function
        const { getRelatedMovies } = await import('./data.js');
        
        // Get related movies
        const relatedMovies = await getRelatedMovies(currentMovie, 7);
        
        // Display related movies
        if (relatedMovies.length > 0) {
            relatedSection.innerHTML = '';
            
            relatedMovies.forEach(movie => {
                const movieCard = createMovieCard(movie);
                relatedSection.appendChild(movieCard);
            });
        } else {
            relatedSection.innerHTML = '<div class="no-movies">No related movies available.</div>';
        }
    } catch (error) {
        console.error('Error loading related movies:', error);
        relatedSection.innerHTML = '<div class="error">Failed to load related movies.</div>';
    }
}