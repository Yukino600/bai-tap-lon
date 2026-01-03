// Latest News Page JavaScript with Infinite Scroll

// API Base URL
const API_URL = '/api';

// User Authentication State
let currentUser = null;
let authToken = null;

// Infinite Scroll State
let currentPage = 1;
const pageSize = 20;
let isLoading = false;
let hasMoreArticles = true;
let apiLimitReached = false;
let totalArticlesLoaded = 0;

// Search State
let searchQuery = '';
let allLoadedArticles = [];

// Check if user is logged in on page load
function checkLoginStatus() {
    authToken = localStorage.getItem('authToken');
    const savedUser = localStorage.getItem('currentUser');
    
    if (authToken && savedUser) {
        currentUser = JSON.parse(savedUser);
        updateUIForLoggedInUser();
    }
}

// Update UI when user is logged in
function updateUIForLoggedInUser() {
    const userButton = document.getElementById('userButton');
    const userNameDisplay = document.getElementById('userNameDisplay');
    const logoutButton = document.getElementById('logoutButton');
    
    if (currentUser) {
        userButton.classList.add('logged-in-hidden');
        userNameDisplay.textContent = currentUser.name;
        userNameDisplay.classList.add('logged-in-visible');
        logoutButton.classList.add('logged-in-visible');
    }
    
    // Update mobile menu
    updateMobileMenuUser();
}

// Toggle Login Modal
function toggleLoginModal() {
    const modal = document.getElementById('loginModal');
    modal.classList.toggle('active');
}

// Toggle Signup Modal
function toggleSignupModal() {
    const modal = document.getElementById('signupModal');
    modal.classList.toggle('active');
}

// Switch to Signup
function switchToSignup(event) {
    if (event) event.preventDefault();
    toggleLoginModal();
    toggleSignupModal();
}

// Switch to Login
function switchToLogin(event) {
    if (event) event.preventDefault();
    toggleSignupModal();
    toggleLoginModal();
}

// Handle Login
async function handleLogin(event) {
    event.preventDefault();
    
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    
    try {
        const response = await fetch(`${API_URL}/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, password })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            authToken = data.token;
            currentUser = data.user;
            localStorage.setItem('authToken', authToken);
            localStorage.setItem('currentUser', JSON.stringify(currentUser));
            
            toggleLoginModal();
            updateUIForLoggedInUser();
            showNotification('Welcome back, ' + currentUser.name + '!', 'success');
        } else {
            showNotification(data.error || 'Login failed', 'error');
        }
    } catch (error) {
        console.error('Login error:', error);
        showNotification('Login failed. Please try again.', 'error');
    }
}

// Handle Signup
async function handleSignup(event) {
    event.preventDefault();
    
    const name = document.getElementById('signupName').value;
    const email = document.getElementById('signupEmail').value;
    const password = document.getElementById('signupPassword').value;
    
    // Validate Gmail
    if (!email.endsWith('@gmail.com')) {
        showNotification('Please use a Gmail account (@gmail.com)', 'error');
        return;
    }
    
    try {
        const response = await fetch(`${API_URL}/signup`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ name, email, password })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            authToken = data.token;
            currentUser = data.user;
            localStorage.setItem('authToken', authToken);
            localStorage.setItem('currentUser', JSON.stringify(currentUser));
            
            toggleSignupModal();
            updateUIForLoggedInUser();
            showNotification('Account created successfully!', 'success');
        } else {
            showNotification(data.error || 'Signup failed', 'error');
        }
    } catch (error) {
        console.error('Signup error:', error);
        showNotification('Signup failed. Please try again.', 'error');
    }
}

// Logout
function logout() {
    authToken = null;
    currentUser = null;
    localStorage.removeItem('authToken');
    localStorage.removeItem('currentUser');
    
    const userButton = document.getElementById('userButton');
    const userNameDisplay = document.getElementById('userNameDisplay');
    const logoutButton = document.getElementById('logoutButton');
    
    userButton.classList.remove('logged-in-hidden');
    userNameDisplay.classList.remove('logged-in-visible');
    logoutButton.classList.remove('logged-in-visible');
    
    updateMobileMenuUser();
    showNotification('Logged out successfully', 'success');
}

// Show Notification
function showNotification(message, type = 'success') {
    const notification = document.getElementById('notification');
    notification.textContent = message;
    notification.className = `notification ${type} show`;
    
    setTimeout(() => {
        notification.classList.remove('show');
    }, 3000);
}

// Toggle Search
function toggleSearch() {
    showNotification('Search functionality - Coming soon!', 'error');
}

// Toggle mobile menu
function toggleMenu() {
    const mobileMenu = document.getElementById('mobileMenu');
    const mobileOverlay = document.getElementById('mobileMenuOverlay');
    
    if (mobileMenu && mobileOverlay) {
        mobileMenu.classList.toggle('active');
        mobileOverlay.classList.toggle('active');
        
        if (mobileMenu.classList.contains('active')) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
    }
}

// Update mobile menu user state
function updateMobileMenuUser() {
    const mobileLoggedOut = document.getElementById('mobileLoggedOut');
    const mobileLoggedIn = document.getElementById('mobileLoggedIn');
    const mobileUserAvatar = document.getElementById('mobileUserAvatar');
    const mobileUserName = document.getElementById('mobileUserName');
    const mobileUserEmail = document.getElementById('mobileUserEmail');
    
    if (currentUser && mobileLoggedIn && mobileLoggedOut) {
        mobileLoggedOut.style.display = 'none';
        mobileLoggedIn.style.display = 'block';
        if (mobileUserName) mobileUserName.textContent = currentUser.name;
        if (mobileUserEmail) mobileUserEmail.textContent = currentUser.email;
        if (mobileUserAvatar) mobileUserAvatar.textContent = currentUser.name.charAt(0).toUpperCase();
    } else if (mobileLoggedIn && mobileLoggedOut) {
        mobileLoggedOut.style.display = 'block';
        mobileLoggedIn.style.display = 'none';
    }
}

// Format date
function formatDate(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor(diffTime / (1000 * 60 * 60));
    const diffMinutes = Math.floor(diffTime / (1000 * 60));
    
    if (diffMinutes < 60) {
        return `${diffMinutes} min ago`;
    } else if (diffHours < 24) {
        return `${diffHours} hours ago`;
    } else if (diffDays < 7) {
        return `${diffDays} days ago`;
    } else {
        return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
    }
}

// Create article card HTML
function createArticleCard(article) {
    const title = article.title || 'Untitled Article';
    const excerpt = article.excerpt || 'No description available';
    const image = article.image || 'https://images.unsplash.com/photo-1657957746418-6a38df9e1ea7?w=800';
    const category = article.category || 'Football';
    const author = article.author || 'The Guardian';
    const publishedDate = article.publishedDate;
    const date = publishedDate ? formatDate(publishedDate) : 'Recent';
    const articleId = article.id || '';
    const articleUrl = article.url || '';
    
    // Create unique storage key for this article
    const storageKey = `article_${articleId.replace(/\//g, '_')}`;
    
    // Store article data in window object (same as home page)
    window[storageKey] = {
        id: articleId,
        title: title,
        author: author,
        timeAgo: date,
        category: category,
        image: image,
        excerpt: excerpt,
        body: article.body || excerpt,
        url: articleUrl
    };
    
    return `
        <article class="news-card" onclick="navigateToArticle('${storageKey}')">
            <div class="news-card-image">
                <img src="${image}" alt="${title}" onerror="this.src='https://images.unsplash.com/photo-1657957746418-6a38df9e1ea7?w=800'">
            </div>
            <div class="news-card-content">
                <span class="news-card-category">${category}</span>
                <h3 class="news-card-title">${title}</h3>
                <p class="news-card-excerpt">${excerpt}</p>
                <div class="news-card-meta">
                    <span class="news-card-source">${author}</span>
                    <span class="news-card-date">${date}</span>
                </div>
                <div class="news-card-read-more">Read full story</div>
            </div>
        </article>
    `;
}

// Navigate to article page (same pattern as home page)
function navigateToArticle(storageKey) {
    const articleData = window[storageKey];
    if (articleData) {
        sessionStorage.setItem('currentArticle', JSON.stringify(articleData));
        window.location.href = 'article.html';
    }
}

// Update article count display
function updateArticleCount() {
    const countText = document.getElementById('articleCountText');
    if (countText) {
        if (totalArticlesLoaded === 0) {
            countText.textContent = 'Loading articles...';
        } else {
            countText.textContent = `${totalArticlesLoaded} articles loaded`;
        }
    }
}

// Load articles
async function loadArticles(page = 1) {
    if (isLoading || !hasMoreArticles || apiLimitReached) return;
    
    isLoading = true;
    const loader = document.getElementById('loadingIndicator');
    const endMessage = document.getElementById('endOfContent');
    const rateLimitMsg = document.getElementById('rateLimitMessage');
    const grid = document.getElementById('newsGrid');
    
    if (loader) loader.classList.remove('hidden');
    
    try {
        const response = await fetch(`${API_URL}/news?page=${page}&pageSize=${pageSize}`);
        
        // Check for API rate limit (429 status)
        if (response.status === 429) {
            apiLimitReached = true;
            hasMoreArticles = false;
            if (loader) loader.classList.add('hidden');
            if (rateLimitMsg) rateLimitMsg.style.display = 'block';
            showNotification('API rate limit reached', 'error');
            return;
        }
        
        const data = await response.json();
        
        if (data.success && data.articles && data.articles.length > 0) {
            // Store articles for search functionality
            allLoadedArticles = allLoadedArticles.concat(data.articles);
            
            const articlesHTML = data.articles.map(article => createArticleCard(article)).join('');
            grid.insertAdjacentHTML('beforeend', articlesHTML);
            
            currentPage = page;
            totalArticlesLoaded += data.articles.length;
            updateArticleCount();
            
            // Check if we've loaded all available pages
            if (page >= data.pages || data.articles.length < pageSize) {
                hasMoreArticles = false;
                if (loader) loader.classList.add('hidden');
                if (endMessage) endMessage.style.display = 'block';
            }
        } else {
            hasMoreArticles = false;
            if (loader) loader.classList.add('hidden');
            
            if (page === 1) {
                grid.innerHTML = `
                    <div class="no-news">
                        <h3>No Articles Available</h3>
                        <p>Check back later for the latest football news.</p>
                    </div>
                `;
            } else {
                if (endMessage) endMessage.style.display = 'block';
            }
        }
    } catch (error) {
        console.error('Error loading articles:', error);
        
        // Check if it's a rate limit error
        if (error.message && error.message.includes('429')) {
            apiLimitReached = true;
            hasMoreArticles = false;
            if (rateLimitMsg) rateLimitMsg.style.display = 'block';
        } else {
            showNotification('Failed to load articles', 'error');
        }
        
        if (loader) loader.classList.add('hidden');
    } finally {
        isLoading = false;
    }
}

// Infinite Scroll Handler
function handleScroll() {
    if (isLoading || !hasMoreArticles || apiLimitReached) return;
    
    const scrollTop = window.scrollY || document.documentElement.scrollTop;
    const scrollHeight = document.documentElement.scrollHeight;
    const clientHeight = document.documentElement.clientHeight;
    
    // Load more when user is 300px from bottom
    if (scrollTop + clientHeight >= scrollHeight - 300) {
        loadArticles(currentPage + 1);
    }
    
    // Show/hide scroll to top button
    const scrollBtn = document.getElementById('scrollToTop');
    if (scrollBtn) {
        if (scrollTop > 500) {
            scrollBtn.classList.add('visible');
        } else {
            scrollBtn.classList.remove('visible');
        }
    }
}

// Scroll to top function
function scrollToTop() {
    window.scrollTo({
        top: 0,
        behavior: 'smooth'
    });
}

// Debounce function for scroll
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

// Handle search input
function handleSearch(event) {
    const query = event.target.value.trim().toLowerCase();
    const clearBtn = document.getElementById('searchClearBtn');
    
    // Show/hide clear button
    if (clearBtn) {
        clearBtn.style.display = query ? 'flex' : 'none';
    }
    
    // Debounce the search
    clearTimeout(window.searchTimeout);
    window.searchTimeout = setTimeout(() => {
        performSearch(query);
    }, 300);
}

// Perform search on loaded articles
async function performSearch(query) {
    searchQuery = query;
    const grid = document.getElementById('newsGrid');
    const countText = document.getElementById('articleCountText');
    
    if (!query) {
        // Show all articles
        displayAllArticles();
        return;
    }
    
    // Show loading state
    grid.innerHTML = `
        <div class="loading-message" style="grid-column: 1/-1; text-align: center; padding: 3rem;">
            <div class="spinner"></div>
            <p style="color: var(--text-gray); margin-top: 1rem;">Searching for "${query}"...</p>
        </div>
    `;
    
    try {
        // Search from API with the query
        const response = await fetch(`${API_URL}/news?page=1&pageSize=50&search=${encodeURIComponent(query)}`);
        const data = await response.json();
        
        let results = [];
        
        if (data.success && data.articles && data.articles.length > 0) {
            results = data.articles;
        } else {
            // Fallback: filter locally loaded articles
            results = allLoadedArticles.filter(article => {
                const title = (article.title || '').toLowerCase();
                const excerpt = (article.excerpt || '').toLowerCase();
                const author = (article.author || '').toLowerCase();
                const category = (article.category || '').toLowerCase();
                const body = (article.body || '').toLowerCase();
                
                return title.includes(query) || 
                       excerpt.includes(query) || 
                       author.includes(query) || 
                       category.includes(query) ||
                       body.includes(query);
            });
        }
        
        if (results.length === 0) {
            grid.innerHTML = `
                <div class="no-results" style="grid-column: 1/-1;">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <circle cx="11" cy="11" r="8"></circle>
                        <path d="m21 21-4.35-4.35"></path>
                    </svg>
                    <h3>No results found for "${query}"</h3>
                    <p>Try different keywords or clear the search</p>
                </div>
            `;
            if (countText) countText.textContent = 'No matching articles';
        } else {
            grid.innerHTML = results.map(article => createArticleCard(article)).join('');
            if (countText) countText.textContent = `${results.length} result${results.length !== 1 ? 's' : ''} found`;
        }
    } catch (error) {
        console.error('Search error:', error);
        
        // Fallback to local search on error
        const filteredArticles = allLoadedArticles.filter(article => {
            const title = (article.title || '').toLowerCase();
            const excerpt = (article.excerpt || '').toLowerCase();
            const author = (article.author || '').toLowerCase();
            const category = (article.category || '').toLowerCase();
            
            return title.includes(query) || 
                   excerpt.includes(query) || 
                   author.includes(query) || 
                   category.includes(query);
        });
        
        if (filteredArticles.length === 0) {
            grid.innerHTML = `
                <div class="no-results" style="grid-column: 1/-1;">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <circle cx="11" cy="11" r="8"></circle>
                        <path d="m21 21-4.35-4.35"></path>
                    </svg>
                    <h3>No results found for "${query}"</h3>
                    <p>Try different keywords or clear the search</p>
                </div>
            `;
            if (countText) countText.textContent = 'No matching articles';
        } else {
            grid.innerHTML = filteredArticles.map(article => createArticleCard(article)).join('');
            if (countText) countText.textContent = `${filteredArticles.length} result${filteredArticles.length !== 1 ? 's' : ''} found`;
        }
    }
    
    // Hide infinite scroll elements during search
    const loader = document.getElementById('loadingIndicator');
    const endMessage = document.getElementById('endMessage');
    if (loader) loader.classList.add('hidden');
    if (endMessage) endMessage.style.display = 'none';
}

// Display all loaded articles (clear search)
function displayAllArticles() {
    const grid = document.getElementById('newsGrid');
    
    if (allLoadedArticles.length > 0) {
        grid.innerHTML = allLoadedArticles.map(article => createArticleCard(article)).join('');
    }
    
    updateArticleCount();
    
    // Restore infinite scroll elements
    if (hasMoreArticles) {
        const loader = document.getElementById('loadingIndicator');
        if (loader) loader.classList.remove('hidden');
    } else {
        const endMessage = document.getElementById('endMessage');
        if (endMessage) endMessage.style.display = 'block';
    }
}

// Clear search
function clearSearch() {
    const searchInput = document.getElementById('searchInput');
    const clearBtn = document.getElementById('searchClearBtn');
    
    if (searchInput) {
        searchInput.value = '';
        searchInput.focus();
    }
    if (clearBtn) {
        clearBtn.style.display = 'none';
    }
    
    searchQuery = '';
    displayAllArticles();
}

// Initialize page
document.addEventListener('DOMContentLoaded', function() {
    checkLoginStatus();
    
    // Load initial articles
    loadArticles(1);
    
    // Add scroll listener with debounce
    window.addEventListener('scroll', debounce(handleScroll, 100));
    
    // Add keyboard shortcut for scroll to top (Home key)
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Home') {
            scrollToTop();
        }
    });
});