// Article Page JavaScript

// API Base URL
const API_URL = '/api';

// User Authentication State
let currentUser = null;
let authToken = null;

// Store the referrer page
let referrerPage = 'football-news.html';

// Go back to previous page
function goBack(event) {
    event.preventDefault();
    
    // Check if we have browser history
    if (document.referrer && document.referrer.includes(window.location.origin)) {
        window.history.back();
    } else {
        window.location.href = referrerPage;
    }
}

// Setup back button based on referrer
function setupBackButton() {
    const backButton = document.getElementById('backButton');
    const backButtonText = document.getElementById('backButtonText');
    const referrer = document.referrer;
    
    if (referrer.includes('latest.html')) {
        referrerPage = 'latest.html';
        backButtonText.textContent = 'Back to Latest';
    } else if (referrer.includes('fixtures.html')) {
        referrerPage = 'fixtures.html';
        backButtonText.textContent = 'Back to Fixtures';
    } else if (referrer.includes('tables.html')) {
        referrerPage = 'tables.html';
        backButtonText.textContent = 'Back to Tables';
    } else {
        referrerPage = 'football-news.html';
        backButtonText.textContent = 'Back to Home';
    }
    
    backButton.href = referrerPage;
}

// Get article data from URL parameters or sessionStorage
function getArticleFromURL() {
    // First try sessionStorage (more reliable for large data)
    const storedData = sessionStorage.getItem('currentArticle');
    if (storedData) {
        try {
            const article = JSON.parse(storedData);
            // Clear after reading to avoid stale data
            sessionStorage.removeItem('currentArticle');
            return article;
        } catch (error) {
            console.error('Error parsing stored article data:', error);
        }
    }
    
    // Fallback to URL parameters (for backwards compatibility)
    const params = new URLSearchParams(window.location.search);
    const articleData = params.get('data');
    
    if (articleData) {
        try {
            return JSON.parse(decodeURIComponent(articleData));
        } catch (error) {
            console.error('Error parsing article data:', error);
            return null;
        }
    }
    return null;
}

// Load and display article
async function loadArticle() {
    // Setup back button first
    setupBackButton();
    
    const articleData = getArticleFromURL();
    
    if (!articleData) {
        document.getElementById('articleBody').innerHTML = '<p style="color: var(--text-red); text-align: center; padding: 2rem;">Article not found. <a href="football-news.html" style="color: var(--primary-green);">Go back to home</a></p>';
        return;
    }
    
    // Update article header
    document.getElementById('articleImage').src = articleData.image;
    document.getElementById('articleTitle').textContent = articleData.title;
    document.getElementById('articleAuthor').textContent = 'By ' + articleData.author;
    document.getElementById('articleCategory').textContent = articleData.category;
    document.getElementById('articleTime').innerHTML = `
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"></circle>
            <polyline points="12 6 12 12 16 14"></polyline>
        </svg>
        ${articleData.timeAgo}
    `;
    document.getElementById('guardianLink').href = articleData.url;
    
    // Store article ID for comments
    const articleDetail = document.querySelector('.article-detail');
    articleDetail.setAttribute('data-article-id', articleData.id);
    
    // Show loading message while fetching full article
    document.getElementById('articleBody').innerHTML = '<p style="color: var(--text-gray); text-align: center; padding: 2rem;">Loading full article...</p>';
    
    // Fetch full article body
    let articleContent = articleData.excerpt;
    try {
        const response = await fetch(`${API_URL}/article/${encodeURIComponent(articleData.id)}`);
        const data = await response.json();
        
        if (data.success && data.body) {
            articleContent = data.body;
        }
    } catch (error) {
        console.error('Error fetching full article:', error);
        // Fallback to excerpt if full body fetch fails
    }
    
    // Clean and format the body text
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = articleContent;
    articleContent = tempDiv.textContent || tempDiv.innerText || articleContent;
    
    // Split into paragraphs
    let paragraphs = articleContent.split(/\n\n+/);
    if (paragraphs.length === 1) {
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
    document.getElementById('articleBody').innerHTML = formattedBody;
    
    // Load comments for this article
    loadCommentsForArticle(articleData.id);
}

// Check if user is logged in on page load
function checkLoginStatus() {
    authToken = localStorage.getItem('authToken');
    const savedUser = localStorage.getItem('currentUser');
    
    if (authToken && savedUser) {
        currentUser = JSON.parse(savedUser);
        updateUIForLoggedInUser();
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
        
        if (commentInput) {
            commentInput.placeholder = 'Add a comment...';
            commentInput.readOnly = false;
            commentButton.disabled = false;
        }
    }
    
    updateMobileMenuUser();
}

// Logout function
function logout() {
    localStorage.removeItem('authToken');
    localStorage.removeItem('currentUser');
    currentUser = null;
    authToken = null;
    
    window.location.href = 'football-news.html';
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

// Switch between Login and Signup
function switchToSignup(e) {
    e.preventDefault();
    toggleLoginModal();
    toggleSignupModal();
}

function switchToLogin(e) {
    e.preventDefault();
    toggleSignupModal();
    toggleLoginModal();
}

// Prompt Login
function promptLogin() {
    if (!currentUser) {
        toggleLoginModal();
        showNotification('Please login to comment', 'error');
    }
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
        
        if (response.ok && data.success) {
            authToken = data.token;
            currentUser = data.user;
            
            localStorage.setItem('authToken', authToken);
            localStorage.setItem('currentUser', JSON.stringify(currentUser));
            
            toggleLoginModal();
            updateUIForLoggedInUser();
            showNotification('Login successful!', 'success');
        } else {
            showNotification(data.error || 'Login failed', 'error');
        }
    } catch (error) {
        showNotification('Server error. Please try again.', 'error');
        console.error('Login error:', error);
    }
}

// Handle Signup
async function handleSignup(event) {
    event.preventDefault();
    
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
        showNotification('Server error. Please try again.', 'error');
        console.error('Signup error:', error);
    }
}

// Show notification toast
function showNotification(message, type = 'success') {
    const notification = document.getElementById('notification');
    notification.textContent = message;
    notification.className = `notification ${type}`;
    notification.classList.add('show');
    
    setTimeout(() => {
        notification.classList.remove('show');
    }, 3000);
}

// Add Comment
async function addComment() {
    const commentInput = document.getElementById('commentInput');
    const commentText = commentInput.value.trim();
    
    if (!currentUser) {
        promptLogin();
        return;
    }
    
    if (!commentText) {
        showNotification('Please enter a comment before posting.', 'error');
        return;
    }
    
    const articleDetail = document.querySelector('.article-detail');
    const articleId = articleDetail.getAttribute('data-article-id');
    
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
            
            const newComment = document.createElement('div');
            newComment.className = 'comment';
            newComment.style.opacity = '0';
            newComment.style.transform = 'translateY(-20px)';
            
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
            
            // Set comment ID from server response
            newComment.setAttribute('data-comment-id', data.comment.id);
            
            commentsList.insertBefore(newComment, commentsList.firstChild);
            
            setTimeout(() => {
                newComment.style.transition = 'all 0.5s ease';
                newComment.style.opacity = '1';
                newComment.style.transform = 'translateY(0)';
            }, 10);
            
            commentInput.value = '';
            
            const commentCount = document.getElementById('commentCount');
            const currentCount = parseInt(commentCount.textContent) || 0;
            commentCount.textContent = currentCount + 1;
            
            showNotification('Comment posted successfully!', 'success');
        } else {
            showNotification(data.error || 'Failed to post comment', 'error');
        }
    } catch (error) {
        showNotification('Server error. Please try again.', 'error');
        console.error('Comment error:', error);
    }
}

// Load comments for specific article
async function loadCommentsForArticle(articleId) {
    console.log('Loading comments for article:', articleId);
    
    try {
        // Encode the article ID properly for URL
        const encodedId = encodeURIComponent(articleId);
        const response = await fetch(`${API_URL}/comments/${encodedId}`);
        const data = await response.json();
        
        console.log('Comments response:', data);
        
        const commentsList = document.getElementById('commentsList');
        const commentCount = document.getElementById('commentCount');
        
        if (data.success && data.comments && data.comments.length > 0) {
            commentCount.textContent = data.comments.length;
            commentsList.innerHTML = '';
            
            console.log(`Found ${data.comments.length} comments`);
            
            data.comments.forEach(comment => {
                const timeAgo = getTimeAgo(new Date(comment.createdAt));
                const initials = comment.userName.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
                
                const commentHTML = `
                    <div class="comment" data-comment-id="${comment._id}">
                        <div class="user-avatar">${initials}</div>
                        <div class="comment-content">
                            <div class="comment-header">
                                <span class="comment-author">${comment.userName}</span>
                                <span class="comment-time">${timeAgo}</span>
                            </div>
                            <p class="comment-text">${comment.text}</p>
                            <div class="comment-actions">
                                <button class="like-btn ${comment.hasLiked ? 'liked' : ''}" onclick="toggleLike(this)">
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="${comment.hasLiked ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2">
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

// Toggle Like
async function toggleLike(button) {
    if (!currentUser) {
        promptLogin();
        return;
    }
    
    // Prevent multiple clicks
    if (button.disabled) return;
    button.disabled = true;
    
    const comment = button.closest('.comment');
    const commentId = comment.getAttribute('data-comment-id');
    
    if (!commentId) {
        showNotification('Unable to like this comment', 'error');
        button.disabled = false;
        return;
    }
    
    const countSpan = button.querySelector('span');
    const originalCount = parseInt(countSpan.textContent);
    const wasLiked = button.classList.contains('liked');
    
    // Update like count in database
    try {
        const response = await fetch(`${API_URL}/comments/${commentId}/like`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            }
        });
        
        const data = await response.json();
        
        if (response.ok && data.success) {
            // Update with actual count from server
            countSpan.textContent = data.likes;
            // Update button state based on server response
            if (data.hasLiked) {
                button.classList.add('liked');
                button.querySelector('svg').setAttribute('fill', 'currentColor');
            } else {
                button.classList.remove('liked');
                button.querySelector('svg').setAttribute('fill', 'none');
            }
        } else {
            showNotification('Failed to update like', 'error');
        }
    } catch (error) {
        console.error('Like error:', error);
        showNotification('Failed to update like', 'error');
    } finally {
        button.disabled = false;
    }
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

// Initialize page
document.addEventListener('DOMContentLoaded', function() {
    checkLoginStatus();
    updateMobileMenuUser();
    loadArticle();
    
    const commentInput = document.getElementById('commentInput');
    if (commentInput) {
        commentInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter' && currentUser) {
                addComment();
            }
        });
    }
});

console.log('⚽ Article page loaded successfully!');
