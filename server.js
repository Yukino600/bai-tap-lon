// Backend Server with MongoDB
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/btl';
const GUARDIAN_API_KEY = process.env.GUARDIAN_API_KEY;
const FOOTBALL_DATA_API_KEY = process.env.FOOTBALL_DATA_API_KEY;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('src'));
app.use(express.static(__dirname));

// MongoDB Connection
mongoose.connect(MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
.then(() => {
    console.log('✅ Connected to MongoDB');
    console.log('📊 Database: btl');
    console.log('🔗 URI:', MONGODB_URI);
})
.catch(err => console.error('❌ MongoDB connection error:', err));

// User Schema
const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true
    },
    password: {
        type: String,
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// User Model
const User = mongoose.model('users', userSchema);

// Comment Schema
const commentSchema = new mongoose.Schema({
    articleId: {
        type: String,
        required: true
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'users',
        required: true
    },
    userName: String,
    text: {
        type: String,
        required: true
    },
    likes: {
        type: Number,
        default: 0
    },
    likedBy: {
        type: [String],
        default: []
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

const Comment = mongoose.model('comments', commentSchema);

// Routes

// Signup
app.post('/api/signup', async (req, res) => {
    try {
        const { name, email, password } = req.body;

        // Validate email is @gmail.com
        if (!email.toLowerCase().endsWith('@gmail.com')) {
            return res.status(400).json({ error: 'Only Gmail accounts are allowed (@gmail.com)' });
        }

        // Check if user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ error: 'Email already registered' });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create new user
        const user = new User({
            name,
            email,
            password: hashedPassword
        });

        await user.save();

        // Generate token
        const token = jwt.sign({ userId: user._id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });

        res.json({
            success: true,
            message: 'Account created successfully',
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email
            }
        });
    } catch (error) {
        res.status(500).json({ error: 'Server error: ' + error.message });
    }
});

// Login
app.post('/api/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        // Find user
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ error: 'Invalid email or password' });
        }

        // Check password
        const isValidPassword = await bcrypt.compare(password, user.password);
        if (!isValidPassword) {
            return res.status(400).json({ error: 'Invalid email or password' });
        }

        // Generate token
        const token = jwt.sign({ userId: user._id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });

        res.json({
            success: true,
            message: 'Login successful',
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email
            }
        });
    } catch (error) {
        res.status(500).json({ error: 'Server error: ' + error.message });
    }
});

// Verify Token Middleware
const verifyToken = (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
        return res.status(401).json({ error: 'No token provided' });
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.userId = decoded.userId;
        next();
    } catch (error) {
        res.status(401).json({ error: 'Invalid token' });
    }
};

// Get Comments for Article
app.get('/api/comments/:articleId', async (req, res) => {
    try {
        // Decode the article ID from URL
        const articleId = decodeURIComponent(req.params.articleId);
        console.log('Fetching comments for article:', articleId);
        
        // Get userId from token if present
        let currentUserId = null;
        const authHeader = req.headers['authorization'];
        if (authHeader && authHeader.startsWith('Bearer ')) {
            const token = authHeader.substring(7);
            try {
                const decoded = jwt.verify(token, JWT_SECRET);
                currentUserId = decoded.id;
            } catch (err) {
                // Token invalid or expired, continue without user ID
            }
        }
        
        const comments = await Comment.find({ articleId: articleId })
            .populate('userId', 'name')
            .sort({ createdAt: -1 });
        
        // Add hasLiked field for current user
        const commentsWithLikeStatus = comments.map(comment => {
            const commentObj = comment.toObject();
            if (currentUserId) {
                const userIdStr = currentUserId.toString();
                commentObj.hasLiked = comment.likedBy.some(id => id.toString() === userIdStr);
            } else {
                commentObj.hasLiked = false;
            }
            return commentObj;
        });
        
        console.log(`Found ${comments.length} comments for article ${articleId}`);
        
        res.json({ success: true, comments: commentsWithLikeStatus });
    } catch (error) {
        console.error('Error fetching comments:', error);
        res.status(500).json({ error: 'Server error: ' + error.message });
    }
});

// Add Comment (Protected)
app.post('/api/comments', verifyToken, async (req, res) => {
    try {
        const { articleId, text } = req.body;
        
        const user = await User.findById(req.userId);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        const comment = new Comment({
            articleId,
            userId: req.userId,
            userName: user.name,
            text
        });

        await comment.save();

        res.json({
            success: true,
            message: 'Comment added successfully',
            comment: {
                id: comment._id,
                userName: user.name,
                text: comment.text,
                likes: comment.likes,
                createdAt: comment.createdAt
            }
        });
    } catch (error) {
        res.status(500).json({ error: 'Server error: ' + error.message });
    }
});

// Like Comment (Protected)
app.post('/api/comments/:commentId/like', verifyToken, async (req, res) => {
    try {
        const comment = await Comment.findById(req.params.commentId);
        if (!comment) {
            return res.status(404).json({ error: 'Comment not found' });
        }

        const userId = req.userId;
        
        console.log('Like request - User ID:', userId);
        console.log('Comment likedBy array:', comment.likedBy);
        
        // Convert to string for comparison
        const userIdStr = userId.toString();
        const hasLiked = comment.likedBy.some(id => id.toString() === userIdStr);
        
        console.log('Has liked?', hasLiked);
        
        if (hasLiked) {
            // Unlike - remove user from likedBy array
            comment.likedBy = comment.likedBy.filter(id => id.toString() !== userIdStr);
            comment.likes = Math.max(0, comment.likes - 1);
        } else {
            // Like - add user to likedBy array
            comment.likedBy.push(userIdStr);
            comment.likes += 1;
        }
        
        console.log('New likedBy array:', comment.likedBy);
        console.log('New likes count:', comment.likes);
        
        await comment.save();

        res.json({ success: true, likes: comment.likes, hasLiked: !hasLiked });
    } catch (error) {
        console.error('Like error:', error);
        res.status(500).json({ error: 'Server error: ' + error.message });
    }
});

// Get User Profile (Protected)
app.get('/api/profile', verifyToken, async (req, res) => {
    try {
        const user = await User.findById(req.userId).select('-password');
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json({
            success: true,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                createdAt: user.createdAt
            }
        });
    } catch (error) {
        res.status(500).json({ error: 'Server error: ' + error.message });
    }
});

// Get Football News from The Guardian API
app.get('/api/news', async (req, res) => {
    try {
        const fetch = (await import('node-fetch')).default;
        const page = req.query.page || 1;
        const pageSize = req.query.pageSize || 6;
        const search = req.query.search || '';
        
        // Guardian API call with all needed fields including thumbnail
        // Add search query (q parameter) if provided
        let guardianUrl = `https://content.guardianapis.com/search?section=football&page=${page}&page-size=${pageSize}&show-fields=headline,thumbnail,trailText,byline,body&show-elements=image&api-key=${GUARDIAN_API_KEY}`;
        
        if (search) {
            guardianUrl += `&q=${encodeURIComponent(search)}`;
        }
        
        console.log('Fetching from Guardian API:', guardianUrl.replace(GUARDIAN_API_KEY, 'API_KEY_HIDDEN'));
        
        // Add timeout to prevent hanging
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 10000); // 10 second timeout
        
        try {
            const response = await fetch(guardianUrl, { signal: controller.signal });
            clearTimeout(timeout);
            
            // Check for rate limit
            if (response.status === 429) {
                return res.status(429).json({ error: 'API rate limit reached' });
            }
            
            const data = await response.json();
            
            console.log('Guardian API response status:', data.response?.status);
            console.log('Number of results:', data.response?.results?.length);
            
            if (data.response && data.response.results) {
                const articles = data.response.results.map(article => {
                    // Try to get image from multiple sources
                    let imageUrl = article.fields?.thumbnail;
                    
                    // If no thumbnail, try to get from elements
                    if (!imageUrl && article.elements) {
                        const imageElement = article.elements.find(el => el.type === 'image');
                        if (imageElement && imageElement.assets && imageElement.assets.length > 0) {
                            // Get the largest image
                            const sortedAssets = imageElement.assets.sort((a, b) => (b.typeData?.width || 0) - (a.typeData?.width || 0));
                            imageUrl = sortedAssets[0]?.file;
                        }
                    }
                    
                    // Fallback image
                    if (!imageUrl) {
                        imageUrl = 'https://images.unsplash.com/photo-1657957746418-6a38df9e1ea7?w=800';
                    }
                    
                    return {
                        id: article.id,
                        title: article.fields?.headline || article.webTitle || 'Untitled',
                        excerpt: article.fields?.trailText || '',
                        body: article.fields?.body || article.fields?.trailText || '',
                        author: article.fields?.byline || 'The Guardian',
                        image: imageUrl,
                        url: article.webUrl,
                        publishedDate: article.webPublicationDate,
                        category: article.sectionName || 'Football'
                    };
                });
                
                res.json({
                    success: true,
                    articles,
                    total: data.response.total,
                    pages: data.response.pages,
                    currentPage: data.response.currentPage
                });
            } else {
                console.error('Guardian API error response:', data);
                res.status(500).json({ error: 'Failed to fetch news', details: data.message });
            }
        } catch (fetchError) {
            clearTimeout(timeout);
            if (fetchError.name === 'AbortError') {
                console.error('Guardian API request timeout');
                res.status(504).json({ error: 'Request timeout - Guardian API is slow' });
            } else {
                throw fetchError;
            }
        }
    } catch (error) {
        console.error('News API error:', error);
        res.status(500).json({ error: 'Server error: ' + error.message });
    }
});

// Get full article body (separate endpoint for better performance)
app.get('/api/article/:articleId', async (req, res) => {
    try {
        const fetch = (await import('node-fetch')).default;
        const articleId = req.params.articleId;
        
        // Fetch full article content with body text
        const guardianUrl = `https://content.guardianapis.com/${articleId}?show-fields=bodyText,body&api-key=${GUARDIAN_API_KEY}`;
        
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 10000);
        
        try {
            const response = await fetch(guardianUrl, { signal: controller.signal });
            clearTimeout(timeout);
            
            const data = await response.json();
            
            if (data.response && data.response.content) {
                const article = data.response.content;
                const fullBody = article.fields?.bodyText || article.fields?.body || '';
                
                res.json({
                    success: true,
                    body: fullBody
                });
            } else {
                res.status(404).json({ error: 'Article not found' });
            }
        } catch (fetchError) {
            clearTimeout(timeout);
            if (fetchError.name === 'AbortError') {
                res.status(504).json({ error: 'Request timeout' });
            } else {
                throw fetchError;
            }
        }
    } catch (error) {
        console.error('Article fetch error:', error);
        res.status(500).json({ error: 'Server error: ' + error.message });
    }
});

// Get League Standings
app.get('/api/standings/:league', async (req, res) => {
    try {
        console.log('📊 Standings request for league:', req.params.league);
        console.log('🔑 API Key available:', !!FOOTBALL_DATA_API_KEY);
        console.log('🔑 API Key value:', FOOTBALL_DATA_API_KEY ? FOOTBALL_DATA_API_KEY.substring(0, 10) + '...' : 'undefined');
        
        const fetch = (await import('node-fetch')).default;
        const leagueMap = {
            'premier-league': 'PL',    // Premier League
            'champions-league': 'CL',  // UEFA Champions League
            'bundesliga': 'BL1',       // Bundesliga
            'eredivisie': 'DED',       // Eredivisie
            'serie-a-brazil': 'BSA',   // Campeonato Brasileiro Série A
            'la-liga': 'PD',           // Primera Division
            'ligue-1': 'FL1',          // Ligue 1
            'championship': 'ELC',     // Championship
            'primeira-liga': 'PPL',    // Primeira Liga
            'euros': 'EC',             // European Championship
            'serie-a': 'SA'            // Serie A
        };
        
        const leagueCode = leagueMap[req.params.league];
        if (!leagueCode) {
            console.log('❌ Invalid league:', req.params.league);
            return res.status(400).json({ error: 'Invalid league - only top 5 European leagues available on free tier' });
        }
        
        const url = `https://api.football-data.org/v4/competitions/${leagueCode}/standings`;
        console.log('🌐 Fetching from:', url);
        
        const response = await fetch(url, {
            headers: {
                'X-Auth-Token': FOOTBALL_DATA_API_KEY
            }
        });
        
        const data = await response.json();
        console.log('📦 Full API Response:', JSON.stringify(data, null, 2));
        console.log('📦 Response status:', response.status);
        console.log('📦 API Response:', data.standings ? 'Data received' : 'No data', data.message || data.error || '');
        
        if (data.standings && data.standings.length > 0) {
            const standings = data.standings[0].table;
            const allTeams = standings.map(team => ({
                position: team.position,
                name: team.team.shortName || team.team.name,
                crest: team.team.crest,
                playedGames: team.playedGames,
                won: team.won,
                draw: team.draw,
                lost: team.lost,
                goalsFor: team.goalsFor,
                goalsAgainst: team.goalsAgainst,
                goalDifference: team.goalDifference,
                points: team.points
            }));
            
            res.json({ success: true, standings: allTeams });
        } else {
            res.status(404).json({ error: 'No standings data available', message: data.message });
        }
    } catch (error) {
        console.error('Standings API error:', error);
        res.status(500).json({ error: 'Server error: ' + error.message });
    }
});

// Get top scorers for a league
app.get('/api/scorers/:league', async (req, res) => {
    try {
        const fetch = (await import('node-fetch')).default;
        const league = req.params.league;
        
        // Map league names to competition codes
        const leagueMap = {
            'premier-league': 'PL',
            'la-liga': 'PD',
            'serie-a': 'SA',
            'bundesliga': 'BL1',
            'ligue-1': 'FL1',
            'champions-league': 'CL',
            'eredivisie': 'DED',
            'championship': 'ELC',
            'primeira-liga': 'PPL',
            'serie-a-brazil': 'BSA'
        };
        
        const leagueCode = leagueMap[league] || 'PL';
        const url = `https://api.football-data.org/v4/competitions/${leagueCode}/scorers`;
        
        const response = await fetch(url, {
            headers: {
                'X-Auth-Token': FOOTBALL_DATA_API_KEY
            }
        });
        
        const data = await response.json();
        
        console.log('Scorers API Response:', JSON.stringify(data, null, 2));
        
        if (data.scorers && data.scorers.length > 0) {
            const scorersData = data.scorers.map(scorer => ({
                player: {
                    name: scorer.player?.name || 'Unknown',
                    nationality: scorer.player?.nationality || '',
                    photo: scorer.player?.photo || null,
                    id: scorer.player?.id || null
                },
                team: {
                    name: scorer.team?.name || 'Unknown',
                    crest: scorer.team?.crest || '',
                    shortName: scorer.team?.shortName || ''
                },
                goals: scorer.goals || scorer.playedMatches || 0,
                assists: scorer.assists || 0,
                penalties: scorer.penalties || 0
            }));
            
            res.json({ success: true, scorers: scorersData });
        } else {
            res.json({ success: false, scorers: [], message: 'No scorers data available' });
        }
    } catch (error) {
        console.error('Scorers API error:', error);
        res.status(500).json({ error: 'Server error: ' + error.message });
    }
});

// Get upcoming fixtures from top 5 leagues
app.get('/api/fixtures', async (req, res) => {
    try {
        const fetch = (await import('node-fetch')).default;
        const topLeagues = ['PL', 'PD', 'SA', 'BL1', 'FL1']; // Premier League, La Liga, Serie A, Bundesliga, Ligue 1
        
        let allFixtures = [];
        
        // Fetch upcoming matches from each league
        for (const leagueCode of topLeagues) {
            const url = `https://api.football-data.org/v4/competitions/${leagueCode}/matches?status=SCHEDULED`;
            
            const response = await fetch(url, {
                headers: {
                    'X-Auth-Token': FOOTBALL_DATA_API_KEY
                }
            });
            
            const data = await response.json();
            
            if (data.matches && data.matches.length > 0) {
                // Get only first match from each league
                const nextMatch = data.matches[0];
                allFixtures.push({
                    homeTeam: nextMatch.homeTeam.name,
                    homeLogo: nextMatch.homeTeam.crest,
                    awayTeam: nextMatch.awayTeam.name,
                    awayLogo: nextMatch.awayTeam.crest,
                    date: nextMatch.utcDate,
                    competition: nextMatch.competition.name,
                    matchday: nextMatch.matchday
                });
            }
        }
        
        // Sort by date and get 4 nearest matches
        allFixtures.sort((a, b) => new Date(a.date) - new Date(b.date));
        const nearestFixtures = allFixtures.slice(0, 4);
        
        res.json({ success: true, fixtures: nearestFixtures });
    } catch (error) {
        console.error('Fixtures API error:', error);
        res.status(500).json({ error: 'Server error: ' + error.message });
    }
});

// Get fixtures by league - 5 matches per league
app.get('/api/fixtures/:league', async (req, res) => {
    try {
        const fetch = (await import('node-fetch')).default;
        const league = req.params.league;
        
        // Map league names to API codes
        const leagueMap = {
            'premier-league': 'PL',
            'la-liga': 'PD',
            'serie-a': 'SA',
            'bundesliga': 'BL1',
            'ligue-1': 'FL1',
            'champions-league': 'CL',
            'eredivisie': 'DED',
            'championship': 'ELC',
            'primeira-liga': 'PPL',
            'serie-a-brazil': 'BSA'
        };
        
        const leagueCode = leagueMap[league];
        if (!leagueCode) {
            return res.status(400).json({ error: 'Invalid league' });
        }
        
        const url = `https://api.football-data.org/v4/competitions/${leagueCode}/matches?status=SCHEDULED`;
        
        const response = await fetch(url, {
            headers: {
                'X-Auth-Token': FOOTBALL_DATA_API_KEY
            }
        });
        
        const data = await response.json();
        
        if (data.matches && data.matches.length > 0) {
            // Get first 5 upcoming matches
            const fixtures = data.matches.slice(0, 5).map(match => ({
                homeTeam: match.homeTeam.shortName || match.homeTeam.name,
                homeTeamFull: match.homeTeam.name,
                homeLogo: match.homeTeam.crest,
                awayTeam: match.awayTeam.shortName || match.awayTeam.name,
                awayTeamFull: match.awayTeam.name,
                awayLogo: match.awayTeam.crest,
                date: match.utcDate,
                competition: match.competition.name,
                matchday: match.matchday
            }));
            
            res.json({ success: true, fixtures: fixtures });
        } else {
            res.json({ success: true, fixtures: [] });
        }
    } catch (error) {
        console.error('Fixtures API error:', error);
        res.status(500).json({ error: 'Server error: ' + error.message });
    }
});

// Get all fixtures from multiple leagues
app.get('/api/all-fixtures', async (req, res) => {
    try {
        const fetch = (await import('node-fetch')).default;
        const leagues = [
            { code: 'PL', name: 'Premier League' },
            { code: 'BL1', name: 'Bundesliga' },
            { code: 'SA', name: 'Serie A' },
            { code: 'PD', name: 'La Liga' },
            { code: 'FL1', name: 'Ligue 1' },
            { code: 'CL', name: 'Champions League' }
        ];
        
        let allLeagueFixtures = [];
        
        for (const league of leagues) {
            const url = `https://api.football-data.org/v4/competitions/${league.code}/matches?status=SCHEDULED`;
            
            const response = await fetch(url, {
                headers: {
                    'X-Auth-Token': FOOTBALL_DATA_API_KEY
                }
            });
            
            const data = await response.json();
            
            if (data.matches && data.matches.length > 0) {
                const fixtures = data.matches.slice(0, 5).map(match => ({
                    homeTeam: match.homeTeam.shortName || match.homeTeam.name,
                    homeTeamFull: match.homeTeam.name,
                    homeLogo: match.homeTeam.crest,
                    awayTeam: match.awayTeam.shortName || match.awayTeam.name,
                    awayTeamFull: match.awayTeam.name,
                    awayLogo: match.awayTeam.crest,
                    date: match.utcDate,
                    matchday: match.matchday
                }));
                
                allLeagueFixtures.push({
                    league: league.name,
                    leagueCode: league.code,
                    fixtures: fixtures
                });
            }
        }
        
        res.json({ success: true, leagues: allLeagueFixtures });
    } catch (error) {
        console.error('All fixtures API error:', error);
        res.status(500).json({ error: 'Server error: ' + error.message });
    }
});

// Serve HTML pages
app.get('/', (req, res) => {
    res.sendFile(__dirname + '/src/pages/football-news.html');
});

app.get('/football-news.html', (req, res) => {
    res.sendFile(__dirname + '/src/pages/football-news.html');
});

app.get('/latest.html', (req, res) => {
    res.sendFile(__dirname + '/src/pages/latest.html');
});

app.get('/article.html', (req, res) => {
    res.sendFile(__dirname + '/src/pages/article.html');
});

app.get('/fixtures.html', (req, res) => {
    res.sendFile(__dirname + '/src/pages/fixtures.html');
});

app.get('/tables.html', (req, res) => {
    res.sendFile(__dirname + '/src/pages/tables.html');
});

app.get('/login.html', (req, res) => {
    res.sendFile(__dirname + '/src/pages/login.html');
});

app.get('/search.html', (req, res) => {
    res.sendFile(__dirname + '/src/pages/search.html');
});

// Start server
app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    console.log(`📊 Database: btl`);
    console.log(`👥 Collection: users`);
});
