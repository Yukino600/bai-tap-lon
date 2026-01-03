// Fixtures Page JavaScript

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

// Format date and time
function formatMatchTime(dateString) {
    const date = new Date(dateString);
    const hours = date.getUTCHours().toString().padStart(2, '0');
    const minutes = date.getUTCMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes} GMT`;
}

// Format date
function formatMatchDate(dateString) {
    const date = new Date(dateString);
    const options = { weekday: 'short', day: 'numeric', month: 'short' };
    return date.toLocaleDateString('en-GB', options);
}

// Load all fixtures
async function loadAllFixtures() {
    const container = document.getElementById('fixturesContainer');
    
    try {
        const response = await fetch(`${API_URL}/all-fixtures`);
        const data = await response.json();
        
        if (data.success && data.leagues && data.leagues.length > 0) {
            container.innerHTML = '';
            
            data.leagues.forEach(league => {
                const leagueSection = document.createElement('div');
                leagueSection.className = 'fixtures-league-section';
                
                let fixturesHTML = '';
                
                league.fixtures.forEach(fixture => {
                    fixturesHTML += `
                        <div class="fixture-row">
                            <div class="fixture-date">${formatMatchDate(fixture.date)}</div>
                            <div class="fixture-match">
                                <div class="fixture-team home">
                                    <span class="team-name">${fixture.homeTeam}</span>
                                    <img src="${fixture.homeLogo}" alt="${fixture.homeTeam}" class="team-crest" onerror="this.style.display='none'">
                                </div>
                                <div class="fixture-center">
                                    <div class="fixture-vs">v</div>
                                    <div class="fixture-time">${formatMatchTime(fixture.date)}</div>
                                </div>
                                <div class="fixture-team away">
                                    <img src="${fixture.awayLogo}" alt="${fixture.awayTeam}" class="team-crest" onerror="this.style.display='none'">
                                    <span class="team-name">${fixture.awayTeam}</span>
                                </div>
                            </div>
                        </div>
                    `;
                });
                
                leagueSection.innerHTML = `
                    <div class="league-header">
                        <h2 class="league-name">${league.league}</h2>
                    </div>
                    <div class="fixtures-list">
                        ${fixturesHTML}
                    </div>
                `;
                
                container.appendChild(leagueSection);
            });
        } else {
            container.innerHTML = '<p class="no-fixtures">No upcoming fixtures available</p>';
        }
    } catch (error) {
        console.error('Error loading fixtures:', error);
        container.innerHTML = '<p class="fixtures-error">Failed to load fixtures. Please try again later.</p>';
    }
}

// Initialize page
document.addEventListener('DOMContentLoaded', function() {
    checkLoginStatus();
    updateMobileMenuUser();
    loadAllFixtures();
});
