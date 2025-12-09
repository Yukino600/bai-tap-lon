// Football News Website - Interactive JavaScript

// API Base URL
const API_URL = '/api';

// User Authentication State
let currentUser = null;
let authToken = null;

// Check if user is logged in on page load
function checkLoginStatus() {
    authToken = localStorage.getItem('authToken');
    const savedUser = localStorage.getItem('currentUser');
    
    if (authToken && savedUser) {
        currentUser = JSON.parse(savedUser);
        updateUIForLoggedInUser();
        // Verify token is still valid
        verifyToken();
    }
}

// Verify token with server
async function verifyToken() {
    try {
        const response = await fetch(`${API_URL}/profile`, {
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });
        
        if (!response.ok) {
            // Token invalid, logout
            logout();
        }
    } catch (error) {
        console.error('Token verification error:', error);
    }
}

// Update UI when user is logged in
function updateUIForLoggedInUser() {
    const userButton = document.getElementById('userButton');
    const userNameDisplay = document.getElementById('userNameDisplay');
    const logoutButton = document.getElementById('logoutButton');
    const commentInput = document.getElementById('commentInput');
    const commentButton = document.getElementById('commentButton');
    
    if (currentUser) {
        userButton.classList.add('logged-in-hidden');
        userNameDisplay.textContent = currentUser.name;
        userNameDisplay.classList.add('logged-in-visible');
        logoutButton.classList.add('logged-in-visible');
        
        // Enable commenting
        commentInput.placeholder = 'Add a comment...';
        commentInput.removeAttribute('readonly');
        commentInput.removeAttribute('onclick');
        commentButton.removeAttribute('disabled');
    } else {
        userButton.classList.remove('logged-in-hidden');
        userNameDisplay.classList.remove('logged-in-visible');
        logoutButton.classList.remove('logged-in-visible');
        
        // Disable commenting
        commentInput.placeholder = 'Login to add a comment...';
        commentInput.setAttribute('readonly', 'true');
        commentInput.setAttribute('onclick', 'promptLogin()');
        commentButton.setAttribute('disabled', 'true');
    }
    
    // Update mobile menu user state
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
function switchToSignup(e) {
    e.preventDefault();
    toggleLoginModal();
    setTimeout(() => toggleSignupModal(), 300);
}

// Switch to Login
function switchToLogin(e) {
    e.preventDefault();
    toggleSignupModal();
    setTimeout(() => toggleLoginModal(), 300);
}

// Handle Login
async function handleLogin(e) {
    e.preventDefault();
    
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
        
        if (response.ok && data.success) {
            currentUser = data.user;
            authToken = data.token;
            localStorage.setItem('currentUser', JSON.stringify(currentUser));
            localStorage.setItem('authToken', authToken);
            updateUIForLoggedInUser();
            toggleLoginModal();
            
            showNotification('Welcome back, ' + data.user.name + '!', 'success');
            document.getElementById('loginForm').reset();
        } else {
            showNotification(data.error || 'Login failed', 'error');
        }
    } catch (error) {
        showNotification('Server error. Please try again.', 'error');
        console.error('Login error:', error);
    }
}

// Handle Signup
async function handleSignup(e) {
    e.preventDefault();
    
    const name = document.getElementById('signupName').value;
    const email = document.getElementById('signupEmail').value;
    const password = document.getElementById('signupPassword').value;
    
    try {
        const response = await fetch(`${API_URL}/signup`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ name, email, password })
        });
        
        const data = await response.json();
        
        if (response.ok && data.success) {
            currentUser = data.user;
            authToken = data.token;
            localStorage.setItem('currentUser', JSON.stringify(currentUser));
            localStorage.setItem('authToken', authToken);
            updateUIForLoggedInUser();
            toggleSignupModal();
            
            showNotification('Account created successfully! Welcome, ' + data.user.name + '!', 'success');
            document.getElementById('signupForm').reset();
        } else {
            showNotification(data.error || 'Signup failed', 'error');
        }
    } catch (error) {
        showNotification('Server error. Please try again.', 'error');
        console.error('Signup error:', error);
    }
}

// Logout
function logout() {
    currentUser = null;
    authToken = null;
    localStorage.removeItem('currentUser');
    localStorage.removeItem('authToken');
    updateUIForLoggedInUser();
    showNotification('Logged out successfully!', 'success');
}

// Prompt login when clicking comment input
function promptLogin() {
    showNotification('Please login to comment on articles', 'error');
    setTimeout(() => toggleLoginModal(), 1000);
}

// Show notification
function showNotification(message, type) {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    notification.style.cssText = `
        position: fixed;
        top: 100px;
        right: 20px;
        background: ${type === 'success' ? 'var(--primary-green)' : '#ff4141'};
        color: ${type === 'success' ? 'var(--black)' : 'white'};
        padding: 1rem 1.5rem;
        border-radius: 12px;
        font-weight: 700;
        z-index: 3000;
        box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
        animation: slideInRight 0.4s ease;
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideOutRight 0.4s ease';
        setTimeout(() => notification.remove(), 400);
    }, 3000);
}

// Add CSS for notifications
const style = document.createElement('style');
style.textContent = `
    @keyframes slideInRight {
        from {
            transform: translateX(400px);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    @keyframes slideOutRight {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(400px);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);

// Smooth scroll to article detail
function scrollToArticle() {
    const articleDetail = document.getElementById('article-detail');
    articleDetail.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// Toggle like button
function toggleLike(button) {
    button.classList.toggle('liked');
    const likeCount = button.querySelector('span');
    const currentCount = parseInt(likeCount.textContent);
    
    if (button.classList.contains('liked')) {
        likeCount.textContent = currentCount + 1;
        // Change SVG to filled
        const svg = button.querySelector('svg');
        svg.setAttribute('fill', 'currentColor');
    } else {
        likeCount.textContent = currentCount - 1;
        // Change SVG to outline
        const svg = button.querySelector('svg');
        svg.setAttribute('fill', 'none');
    }
}

// Add new comment
async function addComment() {
    // Check if user is logged in
    if (!currentUser || !authToken) {
        promptLogin();
        return;
    }
    
    const commentInput = document.getElementById('commentInput');
    const commentText = commentInput.value.trim();
    
    if (commentText === '') {
        showNotification('Please enter a comment before posting.', 'error');
        return;
    }
    
    // Get current article ID
    const articleDetail = document.querySelector('.article-detail');
    const articleId = articleDetail.getAttribute('data-article-id') || 'main-article';
    
    try {
        const response = await fetch(`${API_URL}/comments`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify({
                articleId: articleId,
                text: commentText
            })
        });
        
        const data = await response.json();
        
        if (response.ok && data.success) {
            const commentsList = document.getElementById('commentsList');
            
            // Create new comment element
            const newComment = document.createElement('div');
            newComment.className = 'comment';
            newComment.style.opacity = '0';
            newComment.style.transform = 'translateY(-20px)';
            
            // Generate initials from user name
            const initials = currentUser.name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
            
            newComment.innerHTML = `
                <div class="user-avatar">${initials}</div>
                <div class="comment-content">
                    <div class="comment-header">
                        <span class="comment-author">${currentUser.name}</span>
                        <span class="comment-time">Just now</span>
                    </div>
                    <p class="comment-text">${commentText}</p>
                    <div class="comment-actions">
                        <button class="like-btn" onclick="toggleLike(this)">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                            </svg>
                            <span>0</span>
                        </button>
                    </div>
                </div>
            `;
            
            // Hide "no comments" message if exists
            const noCommentsMessage = document.getElementById('noCommentsMessage');
            if (noCommentsMessage) {
                noCommentsMessage.remove();
            }
            
            // Insert at the top of comments list
            commentsList.insertBefore(newComment, commentsList.firstChild);
            
            // Animate the new comment
            setTimeout(() => {
                newComment.style.transition = 'all 0.5s ease';
                newComment.style.opacity = '1';
                newComment.style.transform = 'translateY(0)';
            }, 10);
            
            // Clear input
            commentInput.value = '';
            
            // Update comment count
            const commentCount = document.getElementById('commentCount');
            const currentCount = parseInt(commentCount.textContent) || 0;
            commentCount.textContent = currentCount + 1;
            
            // Show success notification
            showNotification('Comment posted successfully!', 'success');
        } else {
            showNotification(data.error || 'Failed to post comment', 'error');
        }
    } catch (error) {
        showNotification('Server error. Please try again.', 'error');
        console.error('Comment error:', error);
    }
}

// Toggle mobile menu
function toggleMenu() {
    const mobileMenu = document.getElementById('mobileMenu');
    const mobileOverlay = document.getElementById('mobileMenuOverlay');
    
    if (mobileMenu && mobileOverlay) {
        mobileMenu.classList.toggle('active');
        mobileOverlay.classList.toggle('active');
        
        // Prevent body scroll when menu is open
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

// Toggle search (placeholder for future implementation)
function toggleSearch() {
    showNotification('Search functionality - Coming soon!', 'error');
}

// Add enter key support for comment input and check login status
document.addEventListener('DOMContentLoaded', function() {
    // Check if user is logged in
    checkLoginStatus();
    
    // Load news articles from API
    loadNewsArticles();
    
    // Load upcoming fixtures
    loadUpcomingFixtures();
    
    // Load default standings
    loadStandings('premier-league');
    
    // Add league selector event listener - Custom dropdown
    const customSelect = document.getElementById('customLeagueSelect');
    const selectSelected = customSelect?.querySelector('.select-selected');
    const selectItems = document.getElementById('leagueOptions');
    
    if (selectSelected && selectItems) {
        // Toggle dropdown
        selectSelected.addEventListener('click', function() {
            selectItems.style.display = selectItems.style.display === 'none' ? 'block' : 'none';
        });
        
        // Handle option selection
        const options = selectItems.querySelectorAll('div[data-value]');
        options.forEach(option => {
            option.addEventListener('click', function() {
                const league = this.getAttribute('data-value');
                const flagUrl = this.getAttribute('data-flag');
                const leagueName = this.querySelector('span').textContent;
                
                // Update selected display
                selectSelected.innerHTML = `
                    <img src="${flagUrl}" alt="${leagueName}" class="flag-icon">
                    <span>${leagueName}</span>
                `;
                
                // Hide dropdown
                selectItems.style.display = 'none';
                
                // Load standings for selected league
                loadStandings(league);
            });
        });
        
        // Close dropdown when clicking outside
        document.addEventListener('click', function(e) {
            if (!customSelect.contains(e.target)) {
                selectItems.style.display = 'none';
            }
        });
    }
    
    const commentInput = document.getElementById('commentInput');
    if (commentInput) {
        commentInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter' && currentUser) {
                addComment();
            }
        });
    }
    
    // Close modals when clicking outside
    document.getElementById('loginModal').addEventListener('click', function(e) {
        if (e.target === this) {
            toggleLoginModal();
        }
    });
    
    document.getElementById('signupModal').addEventListener('click', function(e) {
        if (e.target === this) {
            toggleSignupModal();
        }
    });
    
    // Smooth scroll for all anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            const href = this.getAttribute('href');
            if (href !== '#') {
                e.preventDefault();
                const target = document.querySelector(href);
                if (target) {
                    target.scrollIntoView({
                        behavior: 'smooth'
                    });
                }
            }
        });
    });
    
    // Add loading animation for images
    const images = document.querySelectorAll('img');
    images.forEach(img => {
        img.addEventListener('load', function() {
            this.style.opacity = '0';
            setTimeout(() => {
                this.style.transition = 'opacity 0.5s ease';
                this.style.opacity = '1';
            }, 10);
        });
    });
    
    // Lazy loading for news cards
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, {
        threshold: 0.1
    });
    
    document.querySelectorAll('.news-card').forEach((card, index) => {
        card.style.opacity = '0';
        card.style.transform = 'translateY(30px)';
        card.style.transition = `all 0.6s ease ${index * 0.1}s`;
        observer.observe(card);
    });
});

// View count animation
function animateViewCount() {
    const viewElements = document.querySelectorAll('.views span');
    viewElements.forEach(element => {
        const text = element.textContent;
        if (text.includes('K')) {
            const number = parseFloat(text);
            let current = 0;
            const increment = number / 50;
            const timer = setInterval(() => {
                current += increment;
                if (current >= number) {
                    element.textContent = number.toFixed(1) + 'K views';
                    clearInterval(timer);
                } else {
                    element.textContent = current.toFixed(1) + 'K views';
                }
            }, 20);
        }
    });
}

// Load News Articles from The Guardian API
async function loadNewsArticles() {
    const newsGrid = document.querySelector('.news-grid');
    
    try {
        // Show loading state
        newsGrid.innerHTML = '<div class="loading-message" style="grid-column: 1/-1; text-align: center; padding: 3rem; color: var(--text-gray);"><p>Loading latest football news...</p></div>';
        
        // Add timeout to fetch request
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 15000); // 15 second timeout
        
        const response = await fetch(`${API_URL}/news?pageSize=21`, { 
            signal: controller.signal 
        });
        clearTimeout(timeout);
        
        const data = await response.json();
        
        if (data.success && data.articles && data.articles.length > 0) {
            // Pick first article for hero section
            const heroArticle = data.articles[0];
            const heroTimeAgo = getTimeAgo(new Date(heroArticle.publishedDate));
            
            // Clean HTML from excerpt
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = heroArticle.excerpt;
            const cleanExcerpt = tempDiv.textContent || tempDiv.innerText || heroArticle.excerpt;
            
            const heroSection = document.getElementById('heroArticle');
            if (heroSection) {
                heroSection.style.display = 'block';
                heroSection.querySelector('img').src = heroArticle.image;
                document.getElementById('heroTitle').textContent = heroArticle.title;
                document.getElementById('heroExcerpt').textContent = cleanExcerpt;
                document.getElementById('heroAuthor').textContent = 'By ' + heroArticle.author;
                document.getElementById('heroTime').textContent = heroTimeAgo;
                
                // Make hero clickable
                heroSection.onclick = () => {
                    const articleData = {
                        id: heroArticle.id,
                        title: heroArticle.title,
                        author: heroArticle.author,
                        timeAgo: heroTimeAgo,
                        category: heroArticle.category,
                        image: heroArticle.image,
                        excerpt: cleanExcerpt,
                        body: heroArticle.body,
                        url: heroArticle.url
                    };
                    sessionStorage.setItem('currentArticle', JSON.stringify(articleData));
                    window.location.href = 'article.html';
                };
                heroSection.style.cursor = 'pointer';
            }
            
            // Display remaining articles in grid (skip first one used for hero)
            const gridArticles = data.articles.slice(1);
            newsGrid.innerHTML = ''; // Clear loading message
            
            gridArticles.forEach(article => {
                const timeAgo = getTimeAgo(new Date(article.publishedDate));
                
                // Clean HTML from excerpt
                const tempDiv = document.createElement('div');
                tempDiv.innerHTML = article.excerpt;
                const cleanExcerpt = tempDiv.textContent || tempDiv.innerText || article.excerpt;
                
                // Store article data as a global variable with unique ID
                const articleId = `article_${article.id.replace(/\//g, '_')}`;
                window[articleId] = {
                    id: article.id,
                    title: article.title,
                    author: article.author,
                    timeAgo: timeAgo,
                    category: article.category,
                    image: article.image,
                    excerpt: cleanExcerpt,
                    body: article.body,
                    url: article.url
                };
                
                const articleCard = `
                    <article class="news-card" onclick="navigateToArticle('${articleId}')">
                        <div class="news-card-image">
                            <img src="${article.image}" alt="${article.title}" onerror="this.src='https://images.unsplash.com/photo-1657957746418-6a38df9e1ea7?w=800'">
                            <div class="news-category">${article.category}</div>
                        </div>
                        <div class="news-card-content">
                            <h3 class="news-card-title">${article.title}</h3>
                            <p class="news-card-excerpt">${cleanExcerpt}</p>
                            <div class="news-card-meta">
                                <span>${article.author}</span>
                                <div class="news-card-stats">
                                    <span class="stat-item">
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                            <circle cx="12" cy="12" r="10"></circle>
                                            <polyline points="12 6 12 12 16 14"></polyline>
                                        </svg>
                                        ${timeAgo}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </article>
                `;
                
                newsGrid.innerHTML += articleCard;
            });
            
            // Re-apply lazy loading animation
            document.querySelectorAll('.news-card').forEach((card, index) => {
                card.style.opacity = '0';
                card.style.transform = 'translateY(30px)';
                card.style.transition = `all 0.6s ease ${index * 0.1}s`;
                setTimeout(() => {
                    card.style.opacity = '1';
                    card.style.transform = 'translateY(0)';
                }, 100);
            });
        } else {
            newsGrid.innerHTML = '<div class="loading-message" style="grid-column: 1/-1; text-align: center; padding: 3rem; color: var(--text-red);"><p>Failed to load news articles. Please try again later.</p></div>';
        }
    } catch (error) {
        console.error('Error loading news:', error);
        
        if (error.name === 'AbortError') {
            newsGrid.innerHTML = '<div class="loading-message" style="grid-column: 1/-1; text-align: center; padding: 3rem; color: var(--text-red);"><p>⏱️ Request timeout. The Guardian API is taking too long to respond.<br><button onclick="loadNewsArticles()" style="margin-top: 1rem; padding: 0.5rem 1.5rem; background: var(--primary-green); color: var(--black); border: none; border-radius: 8px; cursor: pointer; font-weight: bold;">🔄 Try Again</button></p></div>';
        } else {
            newsGrid.innerHTML = '<div class="loading-message" style="grid-column: 1/-1; text-align: center; padding: 3rem; color: var(--text-red);"><p>❌ Could not load latest news. Please check your connection.<br><button onclick="loadNewsArticles()" style="margin-top: 1rem; padding: 0.5rem 1.5rem; background: var(--primary-green); color: var(--black); border: none; border-radius: 8px; cursor: pointer; font-weight: bold;">🔄 Try Again</button></p></div>';
        }
        showNotification('Could not load latest news', 'error');
    }
}

// Helper function to convert date to "time ago" format
function getTimeAgo(date) {
    const seconds = Math.floor((new Date() - date) / 1000);
    
    let interval = seconds / 31536000;
    if (interval > 1) return Math.floor(interval) + " years ago";
    
    interval = seconds / 2592000;
    if (interval > 1) return Math.floor(interval) + " months ago";
    
    interval = seconds / 86400;
    if (interval > 1) return Math.floor(interval) + " days ago";
    
    interval = seconds / 3600;
    if (interval > 1) return Math.floor(interval) + "h ago";
    
    interval = seconds / 60;
    if (interval > 1) return Math.floor(interval) + "m ago";
    
    return "Just now";
}

// Navigate to article page
function navigateToArticle(articleId) {
    const articleData = window[articleId];
    if (articleData) {
        sessionStorage.setItem('currentArticle', JSON.stringify(articleData));
        window.location.href = 'article.html';
    }
}

// Show Article Detail with Comments
async function showArticleDetail(articleData) {
    const { id, title, author, timeAgo, category, image, excerpt, body, url } = articleData;
    const articleDetail = document.querySelector('.article-detail');
    
    // Show the article detail section
    articleDetail.style.display = 'block';
    
    // Store article ID for comments
    articleDetail.setAttribute('data-article-id', id);
    
    // Update article content
    const articleHeader = articleDetail.querySelector('.article-header img');
    const articleTitle = articleDetail.querySelector('.article-title');
    const articleAuthor = articleDetail.querySelector('.hero-footer .author');
    const articleTime = articleDetail.querySelector('.hero-meta .time');
    const articleBadge = articleDetail.querySelector('.badge');
    const articleBody = articleDetail.querySelector('.article-body');
    
    articleHeader.src = image;
    articleTitle.textContent = title;
    articleAuthor.textContent = 'By ' + author;
    articleTime.innerHTML = `
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"></circle>
            <polyline points="12 6 12 12 16 14"></polyline>
        </svg>
        ${timeAgo}
    `;
    articleBadge.textContent = category;
    
    // Show loading message while fetching full article
    articleBody.innerHTML = '<p style="color: var(--text-gray); text-align: center; padding: 2rem;">Loading full article...</p>';
    
    // Scroll to article detail section
    articleDetail.scrollIntoView({ behavior: 'smooth', block: 'start' });
    
    // Fetch full article body
    let articleContent = excerpt;
    try {
        const response = await fetch(`${API_URL}/article/${encodeURIComponent(id)}`);
        const data = await response.json();
        
        if (data.success && data.body) {
            articleContent = data.body;
        }
    } catch (error) {
        console.error('Error fetching full article:', error);
        // Fallback to excerpt if full body fetch fails
    }
    
    // Clean and format the body text
    // Remove HTML tags if present
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = articleContent;
    articleContent = tempDiv.textContent || tempDiv.innerText || articleContent;
    
    // Split into paragraphs (by double line breaks or every ~500 characters)
    let paragraphs = articleContent.split(/\n\n+/);
    if (paragraphs.length === 1) {
        // If no natural breaks, split every 500 chars at sentence end
        const sentences = articleContent.match(/[^.!?]+[.!?]+/g) || [articleContent];
        paragraphs = [];
        let currentPara = '';
        sentences.forEach(sentence => {
            if ((currentPara + sentence).length > 500 && currentPara.length > 0) {
                paragraphs.push(currentPara.trim());
                currentPara = sentence;
            } else {
                currentPara += sentence;
            }
        });
        if (currentPara) paragraphs.push(currentPara.trim());
    }
    
    const formattedBody = paragraphs.map(p => `<p>${p.trim()}</p>`).join('');
    
    // Update article body with full content
    articleBody.innerHTML = `
        ${formattedBody}
        
        <div style="background: var(--light-gray); border-left: 4px solid var(--primary-green); padding: 1.5rem; border-radius: 12px; margin: 2.5rem 0;">
            <p style="margin: 0; color: var(--text-white);"><strong>📰 Article Source: The Guardian</strong></p>
            <p style="margin: 0.5rem 0 0 0; color: var(--text-gray); font-size: 0.9rem;">This article is provided by The Guardian's API for educational purposes.</p>
        </div>
        
        <p style="margin-top: 2rem;">
            <a href="${url}" target="_blank" style="display: inline-block; background: var(--primary-green); color: var(--black); padding: 1rem 2rem; border-radius: 12px; text-decoration: none; font-weight: 900; font-size: 1rem; transition: all 0.3s; box-shadow: 0 4px 15px rgba(0, 255, 65, 0.3);" onmouseover="this.style.background='var(--light-green)'; this.style.transform='translateY(-2px)'" onmouseout="this.style.background='var(--primary-green)'; this.style.transform='translateY(0)'">
                🔗 View on The Guardian Website →
            </a>
        </p>
        
        <h2 style="margin-top: 3rem;">Join the Discussion</h2>
        <p>What are your thoughts on this story? Share your opinion in the comments below!</p>
    `;
    
    // Load comments for this article
    loadCommentsForArticle(id);
    
    // Scroll to article detail section
    articleDetail.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// Load comments for specific article
async function loadCommentsForArticle(articleId) {
    try {
        const response = await fetch(`${API_URL}/comments/${articleId}`);
        const data = await response.json();
        
        const commentsList = document.getElementById('commentsList');
        const commentCount = document.getElementById('commentCount');
        
        if (data.success && data.comments && data.comments.length > 0) {
            commentCount.textContent = data.comments.length;
            commentsList.innerHTML = '';
            
            data.comments.forEach(comment => {
                const timeAgo = getTimeAgo(new Date(comment.createdAt));
                const initials = comment.userName.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
                
                const commentHTML = `
                    <div class="comment">
                        <div class="user-avatar">${initials}</div>
                        <div class="comment-content">
                            <div class="comment-header">
                                <span class="comment-author">${comment.userName}</span>
                                <span class="comment-time">${timeAgo}</span>
                            </div>
                            <p class="comment-text">${comment.text}</p>
                            <div class="comment-actions">
                                <button class="like-btn ${comment.likes > 0 ? 'liked' : ''}" onclick="toggleLike(this)">
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="${comment.likes > 0 ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2">
                                        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                                    </svg>
                                    <span>${comment.likes || 0}</span>
                                </button>
                            </div>
                        </div>
                    </div>
                `;
                
                commentsList.innerHTML += commentHTML;
            });
        } else {
            commentCount.textContent = '0';
            commentsList.innerHTML = '<p id="noCommentsMessage" style="color: var(--text-gray); text-align: center; padding: 2rem;">No comments yet. Be the first to share your thoughts!</p>';
        }
    } catch (error) {
        console.error('Error loading comments:', error);
        document.getElementById('commentCount').textContent = '0';
        document.getElementById('commentsList').innerHTML = '<p style="color: var(--text-gray); text-align: center; padding: 2rem;">Failed to load comments.</p>';
    }
}

// Call animation on load (optional - currently disabled for performance)
// animateViewCount();

// Load league standings
async function loadStandings(league) {
    const standingsList = document.getElementById('standingsList');
    
    if (!standingsList) return;
    
    try {
        standingsList.innerHTML = '<p style="color: var(--text-gray); text-align: center; padding: 2rem;">Loading standings...</p>';
        
        const response = await fetch(`${API_URL}/standings/${league}`);
        const data = await response.json();
        
        if (data.success && data.standings) {
            standingsList.innerHTML = '';
            
            // Show only top 5 teams in sidebar
            data.standings.slice(0, 5).forEach(team => {
                const positionClass = team.position <= 4 ? 'top' : 'normal';
                
                const standingItem = `
                    <div class="standings-item">
                        <div class="standings-left">
                            <span class="position ${positionClass}">${team.position}</span>
                            <img src="${team.crest}" alt="${team.name}" class="team-logo" onerror="this.style.display='none'">
                            <span>${team.name}</span>
                        </div>
                        <div class="standings-right">
                            <span class="played">${team.playedGames}</span>
                            <span class="points">${team.points}</span>
                        </div>
                    </div>
                `;
                
                standingsList.innerHTML += standingItem;
            });
        } else {
            standingsList.innerHTML = '<p style="color: var(--text-red); text-align: center; padding: 2rem;">Failed to load standings</p>';
        }
    } catch (error) {
        console.error('Error loading standings:', error);
        standingsList.innerHTML = '<p style="color: var(--text-red); text-align: center; padding: 2rem;">Error loading standings</p>';
    }
}

async function loadUpcomingFixtures() {
    const fixturesGrid = document.getElementById('fixturesGrid');
    
    if (!fixturesGrid) return;
    
    try {
        const response = await fetch(`${API_URL}/fixtures`);
        const data = await response.json();
        
        if (data.success && data.fixtures && data.fixtures.length > 0) {
            fixturesGrid.innerHTML = '';
            
            data.fixtures.forEach(fixture => {
                const matchDate = new Date(fixture.date);
                const formattedDate = matchDate.toLocaleDateString('en-US', { 
                    weekday: 'short', 
                    month: 'short', 
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                });
                
                const fixtureCard = `
                    <div class="fixture-card">
                        <div class="fixture-competition">${fixture.competition} - Matchday ${fixture.matchday}</div>
                        <div class="fixture-teams">
                            <div class="fixture-team">
                                <img src="${fixture.homeLogo}" alt="${fixture.homeTeam}" onerror="this.style.display='none'">
                                <span class="fixture-team-name">${fixture.homeTeam}</span>
                            </div>
                            <div class="fixture-vs">VS</div>
                            <div class="fixture-team">
                                <img src="${fixture.awayLogo}" alt="${fixture.awayTeam}" onerror="this.style.display='none'">
                                <span class="fixture-team-name">${fixture.awayTeam}</span>
                            </div>
                        </div>
                        <div class="fixture-date">${formattedDate}</div>
                    </div>
                `;
                
                fixturesGrid.innerHTML += fixtureCard;
            });
        } else {
            fixturesGrid.innerHTML = '<p style="color: var(--text-gray); text-align: center; padding: 2rem;">No upcoming fixtures available</p>';
        }
    } catch (error) {
        console.error('Error loading fixtures:', error);
        fixturesGrid.innerHTML = '<p style="color: var(--text-red); text-align: center; padding: 2rem;">Error loading fixtures</p>';
    }
}

console.log('⚽ Football News Website loaded successfully!');
