// XoFilmy xoAdmin.js - Admin functionality

// Import Firebase modules
import { verifyAdmin, addMovie, getAllMovies, updateMovie, deleteMovie, getMovieById } from "./data.js";
import { getTotalMoviesCount, getTrendingMoviesCount, getRecentAdditionsCount, getCategoryDistribution, getMonthlyAdditions, getRecentActivity } from "./analytics.js";

// Global variables for pagination
let currentPage = 1;
let moviesPerPage = 20;
let allMovies = [];
let filteredMovies = [];
let lastVisibleDoc = null;

document.addEventListener('DOMContentLoaded', () => {
    // Initialize admin login
    initAdminLogin();
    
    // Initialize movie form
    initMovieForm();
    
    // Initialize movie list
    initMovieList();
    
    // Initialize analytics
    initAnalytics();
    
    // Check if user is already logged in
    checkLoginStatus();
});

// Initialize admin login
function initAdminLogin() {
    const loginForm = document.getElementById('login-form');
    const loginError = document.getElementById('login-error');
    
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            
            try {
                const isAdmin = await verifyAdmin(email, password);
                
                if (isAdmin) {
                    // Store login status in session storage
                    sessionStorage.setItem('xofilmy_admin', 'true');
                    
                    // Show admin panel
                    document.getElementById('login-container').style.display = 'none';
                    document.getElementById('admin-panel').style.display = 'block';
                    
                    // Load movie list
                    loadMovieList();
                } else {
                    loginError.textContent = 'Invalid email or password';
                    loginError.style.display = 'block';
                }
            } catch (error) {
                console.error('Login error:', error);
                loginError.textContent = 'An error occurred. Please try again.';
                loginError.style.display = 'block';
            }
        });
    }
    
    // Logout button
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            sessionStorage.removeItem('xofilmy_admin');
            window.location.reload();
        });
    }
}

// Check if user is already logged in
function checkLoginStatus() {
    const isAdmin = sessionStorage.getItem('xofilmy_admin') === 'true';
    
    if (isAdmin) {
        // Show admin panel
        document.getElementById('login-container').style.display = 'none';
        document.getElementById('admin-panel').style.display = 'block';
        
        // Load movie list
        loadMovieList();
    }
}

// Initialize movie form
function initMovieForm() {
    const movieForm = document.getElementById('movie-form');
    const formSuccess = document.getElementById('form-success');
    const formError = document.getElementById('form-error');
    
    if (movieForm) {
        movieForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            try {
                // Get submit button and check if we're editing or adding
                const submitBtn = document.getElementById('submit-btn');
                const isEditing = submitBtn.hasAttribute('data-edit-id');
                const movieId = isEditing ? submitBtn.getAttribute('data-edit-id') : null;
                
                // Show loading state
                submitBtn.disabled = true;
                submitBtn.textContent = isEditing ? 'Updating Movie...' : 'Adding Movie...';
                
                // Get form data
                const title = document.getElementById('movie-title').value;
                const category = document.getElementById('movie-category').value;
                const genre = document.getElementById('movie-genre').value;
                const duration = document.getElementById('movie-duration').value;
                const releaseDate = document.getElementById('movie-release-date').value;
                const language = document.getElementById('movie-language').value;
                const starcast = document.getElementById('movie-starcast').value;
                const size = document.getElementById('movie-size').value;
                const description = document.getElementById('movie-description').value;
                const downloadLink = document.getElementById('movie-download-link').value;
                const trending = document.getElementById('movie-trending').checked;
                
                // Get cover URL
                const coverUrl = document.getElementById('movie-cover').value;
                
                // Get screenshot URLs
                const screenshotUrls = [];
                for (let i = 1; i <= 6; i++) {
                    const url = document.getElementById(`movie-screenshot-${i}`).value;
                    if (url) {
                        screenshotUrls.push(url);
                    }
                }
                
                // Validate required fields
                if (!title || !category || !genre || !duration || !releaseDate || !language || !description || !downloadLink || !coverUrl) {
                    throw new Error('Please fill in all required fields');
                }
                
                // Create movie data object
                const movieData = {
                    title,
                    category,
                    genre,
                    duration,
                    releaseDate,
                    language,
                    starcast,
                    size,
                    description,
                    downloadLink,
                    trending,
                    coverUrl,
                    screenshots: screenshotUrls
                };
                
                if (isEditing) {
                    // Update existing movie
                    await updateMovie(movieId, movieData);
                    formSuccess.textContent = 'Movie updated successfully!';
                } else {
                    // Add new movie
                    await addMovie(movieData, coverUrl, screenshotUrls);
                    formSuccess.textContent = 'Movie added successfully!';
                }
                
                // Show success message
                formSuccess.style.display = 'block';
                formError.style.display = 'none';
                
                // Reset form and button
                movieForm.reset();
                submitBtn.removeAttribute('data-edit-id');
                submitBtn.textContent = 'Add Movie';
                
                // Clear previews
                document.getElementById('cover-preview').style.display = 'none';
                for (let i = 1; i <= 6; i++) {
                    const preview = document.getElementById(`screenshot-preview-${i}`);
                    if (preview) {
                        preview.style.display = 'none';
                    }
                }
                
                // Reload movie list and switch to it if we were editing
                loadMovieList();
                if (isEditing) {
                    document.getElementById('movie-list-tab').click();
                }
                
                // Hide success message after 5 seconds
                setTimeout(() => {
                    formSuccess.style.display = 'none';
                }, 5000);
            } catch (error) {
                console.error('Error processing movie:', error);
                formError.textContent = error.message || 'An error occurred. Please try again.';
                formError.style.display = 'block';
                formSuccess.style.display = 'none';
            } finally {
                // Reset button state if not already done
                const submitBtn = document.getElementById('submit-btn');
                if (submitBtn.disabled) {
                    submitBtn.disabled = false;
                    if (!submitBtn.hasAttribute('data-edit-id')) {
                        submitBtn.textContent = 'Add Movie';
                    } else {
                        submitBtn.textContent = 'Update Movie';
                    }
                }
            }
        });
    }
    
    // Preview cover image
    const coverInput = document.getElementById('movie-cover');
    const coverPreview = document.getElementById('cover-preview');
    
    if (coverInput && coverPreview) {
        coverInput.addEventListener('input', (e) => {
            const url = e.target.value;
            if (url) {
                coverPreview.src = url;
                coverPreview.style.display = 'block';
            } else {
                coverPreview.style.display = 'none';
            }
        });
    }
    
    // Preview screenshot images
    for (let i = 1; i <= 6; i++) {
        const screenshotInput = document.getElementById(`movie-screenshot-${i}`);
        const screenshotPreview = document.getElementById(`screenshot-preview-${i}`);
        
        if (screenshotInput && screenshotPreview) {
            screenshotInput.addEventListener('input', (e) => {
                const url = e.target.value;
                if (url) {
                    screenshotPreview.src = url;
                    screenshotPreview.style.display = 'block';
                } else {
                    screenshotPreview.style.display = 'none';
                }
            });
        }
    }
}

// Initialize analytics functionality
async function initAnalytics() {
    const analyticsTab = document.getElementById('analytics-tab');
    
    if (analyticsTab) {
        analyticsTab.addEventListener('click', loadAnalyticsData);
    }
}

// Load analytics data
async function loadAnalyticsData() {
    try {
        // Update analytics cards with real data
        const totalMovies = await getTotalMoviesCount();
        const trendingMovies = await getTrendingMoviesCount();
        const recentAdditions = await getRecentAdditionsCount();
        
        // Update the analytics cards
        document.getElementById('total-movies').textContent = totalMovies;
        document.getElementById('trending-movies').textContent = trendingMovies;
        document.getElementById('recent-additions').textContent = recentAdditions;
        document.getElementById('active-users').textContent = '2.3k'; // Placeholder as we don't track this
        
        // Load category distribution data
        loadCategoryChart();
        
        // Load monthly additions data
        loadMonthlyChart();
        
        // Load recent activity
        loadRecentActivity();
    } catch (error) {
        console.error('Error loading analytics data:', error);
    }
}

// Load category distribution chart
async function loadCategoryChart() {
    try {
        const categoryChart = document.getElementById('category-chart');
        const categoryData = await getCategoryDistribution();
        
        // Calculate total for percentage
        const total = Object.values(categoryData).reduce((sum, count) => sum + count, 0);
        
        // Create visual chart with bars
        let chartContent = '<div class="chart-container-inner">';
        
        // Add chart bars
        chartContent += '<div class="chart-bars">';
        for (const [category, count] of Object.entries(categoryData)) {
            if (count > 0) {
                const percentage = Math.round((count / total) * 100);
                const barHeight = Math.max(percentage, 5); // Minimum 5% height for visibility
                
                chartContent += `
                    <div class="chart-bar-item">
                        <div class="chart-bar-label">${category}</div>
                        <div class="chart-bar-container">
                            <div class="chart-bar" style="height: ${barHeight}%" title="${count} movies (${percentage}%)">
                                <span class="chart-bar-value">${count}</span>
                            </div>
                        </div>
                    </div>
                `;
            }
        }
        chartContent += '</div>';
        
        // Add legend
        chartContent += '<div class="chart-legend">';
        for (const [category, count] of Object.entries(categoryData)) {
            if (count > 0) {
                const percentage = Math.round((count / total) * 100);
                chartContent += `
                    <div class="chart-legend-item">
                        <div class="chart-legend-color" data-category="${category}"></div>
                        <div class="chart-legend-label">${category}: ${count} (${percentage}%)</div>
                    </div>
                `;
            }
        }
        chartContent += '</div>';
        
        chartContent += '</div>';
        categoryChart.innerHTML = chartContent;
    } catch (error) {
        console.error('Error loading category chart:', error);
    }
}

// Load monthly additions chart
async function loadMonthlyChart() {
    try {
        const monthlyChart = document.getElementById('monthly-chart');
        const monthlyData = await getMonthlyAdditions();
        
        // Find maximum value for scaling
        const maxValue = Math.max(...Object.values(monthlyData), 1);
        
        // Create visual chart with bars
        let chartContent = '<div class="chart-container-inner">';
        
        // Add line chart
        chartContent += '<div class="monthly-chart-container">';
        
        // Add bars
        chartContent += '<div class="monthly-bars">';
        for (const [month, count] of Object.entries(monthlyData)) {
            const percentage = Math.round((count / maxValue) * 100);
            const barHeight = Math.max(percentage, 5); // Minimum 5% height for visibility
            
            chartContent += `
                <div class="monthly-bar-item">
                    <div class="monthly-bar-container">
                        <div class="monthly-bar" style="height: ${barHeight}%" title="${count} movies added in ${month}">
                            <span class="monthly-bar-value">${count}</span>
                        </div>
                    </div>
                    <div class="monthly-bar-label">${month.split(' ')[0]}</div>
                </div>
            `;
        }
        chartContent += '</div>';
        
        chartContent += '</div>';
        monthlyChart.innerHTML = chartContent;
    } catch (error) {
        console.error('Error loading monthly chart:', error);
    }
}

// Load recent activity
async function loadRecentActivity() {
    try {
        const activityList = document.getElementById('activity-list');
        const recentActivity = await getRecentActivity(3);
        
        if (activityList && recentActivity.length > 0) {
            activityList.innerHTML = '';
            
            recentActivity.forEach(activity => {
                const activityItem = document.createElement('div');
                activityItem.className = 'activity-item';
                
                const icon = activity.type === 'add' ? 'bx-plus-circle' : 
                             activity.type === 'update' ? 'bx-edit' : 'bx-trash';
                             
                const actionText = activity.type === 'add' ? 'Added new movie: ' : 
                                  activity.type === 'update' ? 'Updated movie: ' : 'Deleted movie: ';
                
                activityItem.innerHTML = `
                    <div class="activity-icon"><i class='bx ${icon}'></i></div>
                    <div class="activity-content">
                        <div class="activity-text">${actionText}<strong>${activity.title}</strong></div>
                        <div class="activity-time">${formatDate(activity.date)}</div>
                    </div>
                `;
                
                activityList.appendChild(activityItem);
            });
        }
    } catch (error) {
        console.error('Error loading recent activity:', error);
    }
}

// Format date for activity display
function formatDate(date) {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    if (date >= today) {
        return `Today, ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    } else if (date >= yesterday) {
        return `Yesterday, ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    } else {
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    }
}

// Function to switch between tabs
function switchTab(activeTab, activeSection) {
    // Remove active class from all tabs
    const movieListTab = document.getElementById('movie-list-tab');
    const addMovieTab = document.getElementById('add-movie-tab');
    const analyticsTab = document.getElementById('analytics-tab');
    
    // Hide all sections
    const movieListSection = document.getElementById('movie-list-section');
    const addMovieSection = document.getElementById('add-movie-section');
    const analyticsSection = document.getElementById('analytics-section');
    
    if (movieListTab) movieListTab.classList.remove('active');
    if (addMovieTab) addMovieTab.classList.remove('active');
    if (analyticsTab) analyticsTab.classList.remove('active');
    
    if (movieListSection) movieListSection.style.display = 'none';
    if (addMovieSection) addMovieSection.style.display = 'none';
    if (analyticsSection) analyticsSection.style.display = 'none';
    
    // Add active class to selected tab and show selected section
    if (activeTab) activeTab.classList.add('active');
    if (activeSection) activeSection.style.display = 'block';
    
    // If switching to movie list, refresh the list
    if (activeSection === movieListSection) {
        loadMovieList();
    }
    
    // If switching to analytics, load analytics data
    if (activeSection === analyticsSection) {
        loadAnalyticsData();
    }
}

// Load movie list
async function loadMovieList() {
    const movieList = document.getElementById('movie-list');
    const prevPageBtn = document.getElementById('prev-page');
    const nextPageBtn = document.getElementById('next-page');
    const pageInfo = document.getElementById('page-info');
    
    if (!movieList) {
        return;
    }
    
    try {
        // Show loading state
        movieList.innerHTML = '<tr><td colspan="6" class="loading"><i class="bx bx-loader-alt bx-spin"></i> Loading movies...</td></tr>';
        
        // Get all movies if not already loaded
        if (allMovies.length === 0) {
            allMovies = await getAllMovies();
            filteredMovies = [...allMovies];
        }
        
        // Apply search and filters
        applyFilters();
        
        // Calculate pagination
        const totalPages = Math.ceil(filteredMovies.length / moviesPerPage);
        const startIndex = (currentPage - 1) * moviesPerPage;
        const endIndex = startIndex + moviesPerPage;
        const currentMovies = filteredMovies.slice(startIndex, endIndex);
        
        // Update pagination buttons
        prevPageBtn.disabled = currentPage <= 1;
        nextPageBtn.disabled = currentPage >= totalPages;
        pageInfo.textContent = `Page ${currentPage} of ${totalPages || 1}`;
        
        // Clear loading state
        movieList.innerHTML = '';
        
        // Display movies
        if (currentMovies.length > 0) {
            currentMovies.forEach(movie => {
                const row = document.createElement('tr');
                
                row.innerHTML = `
                    <td>
                        <img src="${movie.coverUrl}" alt="${movie.title}" class="movie-thumbnail">
                    </td>
                    <td>${movie.title}</td>
                    <td>${movie.category}</td>
                    <td>${movie.status || 'published'}</td>
                    <td>${new Date(movie.createdAt.seconds * 1000).toLocaleDateString()}</td>
                    <td class="action-cell">
                        <button class="table-action edit" data-id="${movie.id}" title="Edit">
                            <i class='bx bx-edit'></i>
                        </button>
                        <button class="table-action delete" data-id="${movie.id}" title="Delete">
                            <i class='bx bx-trash'></i>
                        </button>
                        <button class="table-action ${movie.status === 'private' ? 'show' : 'hide'}" data-id="${movie.id}" data-status="${movie.status || 'published'}" title="${movie.status === 'private' ? 'Make Public' : 'Make Private'}">
                            ${movie.status === 'private' ? '<i class=\'bx bx-show\'></i>' : '<i class=\'bx bx-hide\'></i>'}
                        </button>
                    </td>
                `;
                
                movieList.appendChild(row);
            });
            
            // Add event listeners to action buttons
            addActionButtonListeners();
        } else {
            movieList.innerHTML = '<tr><td colspan="6" class="no-movies">No movies found matching your criteria.</td></tr>';
        }
    } catch (error) {
        console.error('Error loading movies:', error);
        movieList.innerHTML = '<tr><td colspan="6" class="error">Failed to load movies.</td></tr>';
    }
}

// Apply search and filters to movie list
function applyFilters() {
    const searchInput = document.getElementById('movie-search');
    const categoryFilter = document.getElementById('category-filter');
    const statusFilter = document.getElementById('status-filter');
    
    const searchTerm = searchInput ? searchInput.value.toLowerCase() : '';
    const categoryValue = categoryFilter ? categoryFilter.value : '';
    const statusValue = statusFilter ? statusFilter.value : '';
    
    // Reset to page 1 when filters change
    currentPage = 1;
    
    // Apply filters
    filteredMovies = allMovies.filter(movie => {
        // Search term filter
        const matchesSearch = !searchTerm || 
            movie.title.toLowerCase().includes(searchTerm) || 
            (movie.description && movie.description.toLowerCase().includes(searchTerm));
        
        // Category filter
        const matchesCategory = !categoryValue || movie.category === categoryValue;
        
        // Status filter
        const movieStatus = movie.status || 'published';
        const matchesStatus = !statusValue || movieStatus === statusValue;
        
        return matchesSearch && matchesCategory && matchesStatus;
    });
}

// Add event listeners to action buttons
function addActionButtonListeners() {
    // Edit buttons
    const editButtons = document.querySelectorAll('.table-action.edit');
    editButtons.forEach(button => {
        button.addEventListener('click', async () => {
            const movieId = button.getAttribute('data-id');
            try {
                // Get movie data
                const movie = await getMovieById(movieId);
                if (movie) {
                    // Show add movie tab
                    document.getElementById('add-movie-tab').click();
                    
                    // Populate form with movie data
                    populateEditForm(movie);
                    
                    // Change submit button text
                    const submitBtn = document.getElementById('submit-btn');
                    submitBtn.textContent = 'Update Movie';
                    submitBtn.setAttribute('data-edit-id', movieId);
                }
            } catch (error) {
                console.error('Error getting movie for edit:', error);
                alert('Failed to load movie data for editing. Please try again.');
            }
        });
    });
    
    // Delete buttons
    const deleteButtons = document.querySelectorAll('.table-action.delete');
    deleteButtons.forEach(button => {
        button.addEventListener('click', async () => {
            const movieId = button.getAttribute('data-id');
            
            if (confirm('Are you sure you want to delete this movie?')) {
                try {
                    await deleteMovie(movieId);
                    alert('Movie deleted successfully!');
                    
                    // Remove from local arrays and reload list
                    allMovies = allMovies.filter(movie => movie.id !== movieId);
                    filteredMovies = filteredMovies.filter(movie => movie.id !== movieId);
                    loadMovieList();
                } catch (error) {
                    console.error('Error deleting movie:', error);
                    alert('Failed to delete movie. Please try again.');
                }
            }
        });
    });
    
    // Status buttons (show/hide)
    const statusButtons = document.querySelectorAll('.table-action.show, .table-action.hide');
    statusButtons.forEach(button => {
        button.addEventListener('click', async () => {
            const movieId = button.getAttribute('data-id');
            const currentStatus = button.getAttribute('data-status');
            const newStatus = currentStatus === 'published' ? 'private' : 'published';
            
            try {
                await updateMovie(movieId, { status: newStatus });
                
                // Update status in local arrays
                allMovies = allMovies.map(movie => {
                    if (movie.id === movieId) {
                        return { ...movie, status: newStatus };
                    }
                    return movie;
                });
                
                filteredMovies = filteredMovies.map(movie => {
                    if (movie.id === movieId) {
                        return { ...movie, status: newStatus };
                    }
                    return movie;
                });
                
                loadMovieList();
            } catch (error) {
                console.error('Error updating movie status:', error);
                alert('Failed to update movie status. Please try again.');
            }
        });
    });
}

// Initialize pagination and search/filter functionality
function initMovieList() {
    const movieSearch = document.getElementById('movie-search');
    const categoryFilter = document.getElementById('category-filter');
    const statusFilter = document.getElementById('status-filter');
    const prevPageBtn = document.getElementById('prev-page');
    const nextPageBtn = document.getElementById('next-page');
    
    // Add event listeners for search and filters
    if (movieSearch) {
        movieSearch.addEventListener('input', () => {
            applyFilters();
            loadMovieList();
        });
    }
    
    if (categoryFilter) {
        categoryFilter.addEventListener('change', () => {
            applyFilters();
            loadMovieList();
        });
    }
    
    if (statusFilter) {
        statusFilter.addEventListener('change', () => {
            applyFilters();
            loadMovieList();
        });
    }
    
    // Add direct click event listeners for pagination buttons
    if (prevPageBtn) {
        prevPageBtn.onclick = function() {
            if (currentPage > 1) {
                currentPage--;
                loadMovieList();
            }
        };
    }
    
    if (nextPageBtn) {
        nextPageBtn.onclick = function() {
            const totalPages = Math.ceil(filteredMovies.length / moviesPerPage);
            if (currentPage < totalPages) {
                currentPage++;
                loadMovieList();
            }
        };
    }
    
    // Add event listeners for tab switching
    const movieListTab = document.getElementById('movie-list-tab');
    const addMovieTab = document.getElementById('add-movie-tab');
    const analyticsTab = document.getElementById('analytics-tab');
    
    const movieListSection = document.getElementById('movie-list-section');
    const addMovieSection = document.getElementById('add-movie-section');
    const analyticsSection = document.getElementById('analytics-section');
    
    if (movieListTab && addMovieTab && analyticsTab) {
        // Switch to movie list tab
        movieListTab.addEventListener('click', () => {
            switchTab(movieListTab, movieListSection);
        });
        
        // Switch to add movie tab
        addMovieTab.addEventListener('click', () => {
            switchTab(addMovieTab, addMovieSection);
        });
        
        // Switch to analytics tab
        analyticsTab.addEventListener('click', () => {
            switchTab(analyticsTab, analyticsSection);
        });
    }
}

// Populate edit form with movie data
function populateEditForm(movie) {
    // Set form values
    document.getElementById('movie-title').value = movie.title || '';
    document.getElementById('movie-category').value = movie.category || '';
    document.getElementById('movie-genre').value = movie.genre || '';
    document.getElementById('movie-duration').value = movie.duration || '';
    document.getElementById('movie-release-date').value = movie.releaseDate || '';
    document.getElementById('movie-language').value = movie.language || '';
    document.getElementById('movie-starcast').value = movie.starcast || '';
    document.getElementById('movie-size').value = movie.size || '';
    document.getElementById('movie-description').value = movie.description || '';
    document.getElementById('movie-download-link').value = movie.downloadLink || '';
    document.getElementById('movie-trending').checked = movie.trending || false;
    
    // Set cover image
    const coverInput = document.getElementById('movie-cover');
    const coverPreview = document.getElementById('cover-preview');
    coverInput.value = movie.coverUrl || '';
    if (movie.coverUrl) {
        coverPreview.src = movie.coverUrl;
        coverPreview.style.display = 'block';
    }
    
    // Set screenshots
    if (movie.screenshots && movie.screenshots.length > 0) {
        for (let i = 0; i < movie.screenshots.length && i < 6; i++) {
            const screenshotInput = document.getElementById(`movie-screenshot-${i + 1}`);
            const screenshotPreview = document.getElementById(`screenshot-preview-${i + 1}`);
            
            if (screenshotInput && screenshotPreview) {
                screenshotInput.value = movie.screenshots[i];
                screenshotPreview.src = movie.screenshots[i];
                screenshotPreview.style.display = 'block';
            }
        }
    }
}