// Tables Page JavaScript

// API Base URL
const API_URL = '/api';

// User Authentication State
let currentUser = null;
let authToken = null;
let currentLeague = 'premier-league';

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
            showNotification('Login successful!', 'success');
        } else {
            showNotification(data.error || 'Login failed', 'error');
        }
    } catch (error) {
        console.error('Login error:', error);
        showNotification('Network error. Please try again.', 'error');
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
        showNotification('Network error. Please try again.', 'error');
    }
}

// Logout
function logout() {
    currentUser = null;
    authToken = null;
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
function showNotification(message, type = 'info') {
    const toast = document.getElementById('notificationToast');
    toast.textContent = message;
    toast.className = `notification-toast ${type}`;
    toast.classList.add('show');
    
    setTimeout(() => {
        toast.classList.remove('show');
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

// Select League from dropdown
function selectLeague(league) {
    currentLeague = league;
    
    // Update legend based on league type
    updateLegend(league);
    
    // Load data for selected league
    loadStandings(league);
    loadTopScorers(league);
    loadTopAssists(league);
}

// Update legend text based on league
function updateLegend(league) {
    const legendChampions = document.getElementById('legendChampions');
    const legendEuropa = document.getElementById('legendEuropa');
    const legendRelegation = document.getElementById('legendRelegation');
    
    if (league === 'champions-league') {
        // Champions League new format
        legendChampions.textContent = 'Round of 16 (1st - 8th)';
        legendEuropa.textContent = 'Knockout Playoffs (9th - 24th)';
        legendRelegation.textContent = 'Eliminated (25th - 36th)';
    } else {
        // Regular league format
        legendChampions.textContent = 'Champions League';
        legendEuropa.textContent = 'Europa League';
        legendRelegation.textContent = 'Relegation';
    }
}

// Load Standings
async function loadStandings(league) {
    const standingsBody = document.getElementById('standingsBody');
    standingsBody.innerHTML = '<tr><td colspan="10" style="text-align: center; padding: 2rem; color: var(--text-gray);">Loading standings...</td></tr>';
    
    try {
        const response = await fetch(`${API_URL}/standings/${league}`);
        const data = await response.json();
        
        if (data.success && data.standings && data.standings.length > 0) {
            standingsBody.innerHTML = '';
            
            data.standings.forEach((team, index) => {
                const row = document.createElement('tr');
                
                // Add position indicator class based on league type
                let positionClass = '';
                
                if (currentLeague === 'champions-league') {
                    // Champions League new format (2024-25):
                    // 1-8: Direct to Round of 16
                    // 9-24: Knockout playoffs
                    // 25-36: Eliminated
                    if (index < 8) positionClass = 'position-champions';
                    else if (index < 24) positionClass = 'position-europa';
                    else positionClass = 'position-relegation';
                } else {
                    // Regular league format
                    if (index === 0) positionClass = 'position-first';
                    else if (index < 4) positionClass = 'position-champions';
                    else if (index < 6) positionClass = 'position-europa';
                    else if (index >= data.standings.length - 3) positionClass = 'position-relegation';
                }
                
                row.className = positionClass;
                row.innerHTML = `
                    <td class="position-number">${team.position}</td>
                    <td class="team-cell">
                        <img src="${team.crest}" alt="${team.name}" class="team-crest-small">
                        <span class="team-name">${team.name}</span>
                    </td>
                    <td>${team.playedGames}</td>
                    <td>${team.won}</td>
                    <td>${team.draw}</td>
                    <td>${team.lost}</td>
                    <td>${team.goalsFor}</td>
                    <td>${team.goalsAgainst}</td>
                    <td class="${team.goalDifference >= 0 ? 'positive' : 'negative'}">${team.goalDifference >= 0 ? '+' : ''}${team.goalDifference}</td>
                    <td class="points"><strong>${team.points}</strong></td>
                `;
                
                standingsBody.appendChild(row);
            });
        } else {
            standingsBody.innerHTML = '<tr><td colspan="10" style="text-align: center; padding: 2rem; color: var(--text-gray);">No standings data available</td></tr>';
        }
    } catch (error) {
        console.error('Error loading standings:', error);
        standingsBody.innerHTML = '<tr><td colspan="10" style="text-align: center; padding: 2rem; color: var(--text-red);">Failed to load standings</td></tr>';
    }
}

// Load Top Scorers
async function loadTopScorers(league) {
    const scorersContainer = document.getElementById('topScorers');
    scorersContainer.innerHTML = '<tr><td colspan="3" style="text-align: center; padding: 2rem; color: var(--text-gray);">Loading top scorers...</td></tr>';
    
    try {
        const response = await fetch(`${API_URL}/scorers/${league}`);
        const data = await response.json();
        
        if (data.success && data.scorers && data.scorers.length > 0) {
            scorersContainer.innerHTML = '';
            
            // Filter only players with goals
            const scorers = data.scorers.filter(s => s.goals > 0).slice(0, 10);
            
            // Load all player images first, then render in order
            for (let index = 0; index < scorers.length; index++) {
                const scorer = scorers[index];
                const row = document.createElement('tr');
                
                // Get player name and nationality
                const playerName = scorer.player.name;
                const nationality = scorer.player.nationality || 'Unknown';
                
                // Fallback to default faceless avatar
                const fallbackUrl = 'https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&f=y&s=128';
                
                // Try to get player image from TheSportsDB API
                let photoUrl = fallbackUrl;
                try {
                    const searchUrl = `https://www.thesportsdb.com/api/v1/json/3/searchplayers.php?p=${encodeURIComponent(playerName)}`;
                    const playerResponse = await fetch(searchUrl);
                    const playerData = await playerResponse.json();
                    
                    if (playerData.player && playerData.player.length > 0) {
                        // Find player matching the team
                        const matchingPlayer = playerData.player.find(p => 
                            p.strPlayer.toLowerCase() === playerName.toLowerCase() &&
                            p.strSport === 'Soccer'
                        );
                        
                        if (matchingPlayer && matchingPlayer.strThumb) {
                            photoUrl = matchingPlayer.strThumb;
                        } else if (playerData.player[0].strThumb) {
                            photoUrl = playerData.player[0].strThumb;
                        }
                    }
                } catch (e) {
                    console.log('Could not fetch player image for', playerName);
                }
                
                // Get country flag
                const countryCode = getCountryCode(nationality);
                const flagUrl = countryCode ? `https://flagcdn.com/w20/${countryCode}.png` : '';
                
                row.innerHTML = `
                    <td class="rank-cell">${index + 1}</td>
                    <td class="player-cell">
                        <img src="${photoUrl}" alt="${playerName}" class="player-photo" onerror="this.onerror=null; this.src='${fallbackUrl}'">
                        <div class="player-info">
                            <div class="player-name">${playerName}</div>
                            <div class="player-team">
                                <img src="${scorer.team.crest}" alt="${scorer.team.name}" class="team-crest-tiny">
                                ${scorer.team.shortName || scorer.team.name}
                            </div>
                        </div>
                    </td>
                    <td class="stat-cell">${scorer.goals}</td>
                `;
                
                scorersContainer.appendChild(row);
            }
        } else {
            scorersContainer.innerHTML = '<tr><td colspan="3" style="text-align: center; padding: 2rem; color: var(--text-gray);">No scorer data available</td></tr>';
        }
    } catch (error) {
        console.error('Error loading scorers:', error);
        scorersContainer.innerHTML = '<tr><td colspan="3" style="text-align: center; padding: 2rem; color: var(--text-red);">Failed to load top scorers</td></tr>';
    }
}

// Load Top Assists (using scorers endpoint and checking assists field)
async function loadTopAssists(league) {
    const assistsContainer = document.getElementById('topAssists');
    assistsContainer.innerHTML = '<tr><td colspan="3" style="text-align: center; padding: 2rem; color: var(--text-gray);">Loading top assists...</td></tr>';
    
    try {
        const response = await fetch(`${API_URL}/scorers/${league}`);
        const data = await response.json();
        
        if (data.success && data.scorers && data.scorers.length > 0) {
            // Filter and sort by assists
            const assistProviders = data.scorers
                .filter(s => s.assists && s.assists > 0)
                .sort((a, b) => b.assists - a.assists)
                .slice(0, 10);
            
            if (assistProviders.length > 0) {
                assistsContainer.innerHTML = '';
                
                // Load all player images first, then render in order
                for (let index = 0; index < assistProviders.length; index++) {
                    const scorer = assistProviders[index];
                    const row = document.createElement('tr');
                    
                    // Get player name and nationality
                    const playerName = scorer.player.name;
                    const nationality = scorer.player.nationality || 'Unknown';
                    
                    // Fallback to default faceless avatar
                    const fallbackUrl = 'https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&f=y&s=128';
                    
                    // Try to get player image from TheSportsDB API
                    let photoUrl = fallbackUrl;
                    try {
                        const searchUrl = `https://www.thesportsdb.com/api/v1/json/3/searchplayers.php?p=${encodeURIComponent(playerName)}`;
                        const playerResponse = await fetch(searchUrl);
                        const playerData = await playerResponse.json();
                        
                        if (playerData.player && playerData.player.length > 0) {
                            // Find player matching the team
                            const matchingPlayer = playerData.player.find(p => 
                                p.strPlayer.toLowerCase() === playerName.toLowerCase() &&
                                p.strSport === 'Soccer'
                            );
                            
                            if (matchingPlayer && matchingPlayer.strThumb) {
                                photoUrl = matchingPlayer.strThumb;
                            } else if (playerData.player[0].strThumb) {
                                photoUrl = playerData.player[0].strThumb;
                            }
                        }
                    } catch (e) {
                        console.log('Could not fetch player image for', playerName);
                    }
                    
                    // Get country flag
                    const countryCode = getCountryCode(nationality);
                    const flagUrl = countryCode ? `https://flagcdn.com/w20/${countryCode}.png` : '';
                    
                    row.innerHTML = `
                        <td class="rank-cell">${index + 1}</td>
                        <td class="player-cell">
                            <img src="${photoUrl}" alt="${playerName}" class="player-photo" onerror="this.onerror=null; this.src='${fallbackUrl}'">
                            <div class="player-info">
                                <div class="player-name">${playerName}</div>
                                <div class="player-team">
                                    <img src="${scorer.team.crest}" alt="${scorer.team.name}" class="team-crest-tiny">
                                    ${scorer.team.shortName || scorer.team.name}
                                </div>
                            </div>
                        </td>
                        <td class="stat-cell">${scorer.assists}</td>
                    `;
                    
                    assistsContainer.appendChild(row);
                }
            } else {
                assistsContainer.innerHTML = '<tr><td colspan="3" style="text-align: center; padding: 2rem; color: var(--text-gray);">Assist data not available for this league</td></tr>';
            }
        } else {
            assistsContainer.innerHTML = '<tr><td colspan="3" style="text-align: center; padding: 2rem; color: var(--text-gray);">Assist data not available for this league</td></tr>';
        }
    } catch (error) {
        console.error('Error loading assists:', error);
        assistsContainer.innerHTML = '<tr><td colspan="3" style="text-align: center; padding: 2rem; color: var(--text-gray);">Assist data not available for this league</td></tr>';
    }
}

// Helper function to get country code from nationality
function getCountryCode(nationality) {
    const countryMap = {
        'England': 'gb-eng',
        'Spain': 'es',
        'Germany': 'de',
        'France': 'fr',
        'Italy': 'it',
        'Portugal': 'pt',
        'Brazil': 'br',
        'Argentina': 'ar',
        'Netherlands': 'nl',
        'Belgium': 'be',
        'Croatia': 'hr',
        'Denmark': 'dk',
        'Sweden': 'se',
        'Norway': 'no',
        'Poland': 'pl',
        'Switzerland': 'ch',
        'Austria': 'at',
        'Czech Republic': 'cz',
        'Serbia': 'rs',
        'Ukraine': 'ua',
        'Turkey': 'tr',
        'Greece': 'gr',
        'Romania': 'ro',
        'Morocco': 'ma',
        'Senegal': 'sn',
        'Nigeria': 'ng',
        'Ghana': 'gh',
        'Ivory Coast': 'ci',
        'Cameroon': 'cm',
        'Egypt': 'eg',
        'Algeria': 'dz',
        'South Korea': 'kr',
        'Japan': 'jp',
        'Australia': 'au',
        'United States': 'us',
        'Mexico': 'mx',
        'Colombia': 'co',
        'Uruguay': 'uy',
        'Chile': 'cl',
        'Ecuador': 'ec',
        'Peru': 'pe',
        'Venezuela': 've',
        'Scotland': 'gb-sct',
        'Wales': 'gb-wls',
        'Northern Ireland': 'gb-nir',
        'Republic of Ireland': 'ie',
        'Albania': 'al',
        'Bosnia-Herzegovina': 'ba',
        'Bulgaria': 'bg',
        'Finland': 'fi',
        'Hungary': 'hu',
        'Iceland': 'is',
        'North Macedonia': 'mk',
        'Slovakia': 'sk',
        'Slovenia': 'si'
    };
    
    return countryMap[nationality] || null;
}

// Initialize page
document.addEventListener('DOMContentLoaded', function() {
    checkLoginStatus();
    updateMobileMenuUser();
    loadStandings(currentLeague);
    loadTopScorers(currentLeague);
    loadTopAssists(currentLeague);
    
    // Initialize custom dropdown for league selector
    const customSelect = document.getElementById('customLeagueSelectTables');
    const selectSelected = customSelect.querySelector('.select-selected');
    const selectItems = document.getElementById('leagueOptionsTables');
    
    // Toggle dropdown with animation
    selectSelected.addEventListener('click', function(e) {
        e.stopPropagation();
        const isOpen = customSelect.classList.contains('select-arrow-active');
        
        if (isOpen) {
            // Close with animation
            customSelect.classList.remove('select-arrow-active');
            selectItems.classList.remove('select-open');
        } else {
            // Open with animation
            customSelect.classList.add('select-arrow-active');
            selectItems.classList.add('select-open');
        }
    });
    
    // Handle option selection
    const options = selectItems.querySelectorAll('div[data-value]');
    options.forEach(option => {
        option.addEventListener('click', function() {
            const league = this.getAttribute('data-value');
            const flag = this.getAttribute('data-flag');
            const text = this.querySelector('span').textContent;
            
            // Update selected display
            selectSelected.innerHTML = `
                <img src="${flag}" alt="${text}" class="flag-icon">
                <span>${text}</span>
            `;
            
            // Close dropdown with animation
            customSelect.classList.remove('select-arrow-active');
            selectItems.classList.remove('select-open');
            
            // Load data for selected league
            selectLeague(league);
        });
    });
    
    // Close dropdown when clicking outside
    document.addEventListener('click', function(e) {
        if (!customSelect.contains(e.target)) {
            customSelect.classList.remove('select-arrow-active');
            selectItems.classList.remove('select-open');
        }
    });
});
