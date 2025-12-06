
const express = require('express');
const cors = require('cors');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../frontend')));

// Mock Database
let obstacles = [
    {
        id: 1,
        lat: 53.3505,
        lng: -6.2621,
        type: 'construction',
        description: 'Road construction on O\'Connell Street',
        source: 'municipal',
        severity: 'medium',
        updatedAt: new Date().toISOString(),
        distance: 45
    }
];

let audioBottles = [
    {
        id: 1,
        lat: 53.3439,
        lng: -6.2676,
        title: 'Dublin Castle History',
        description: 'Welcome to Dublin Castle, built in 1204 on the site of a Viking settlement.',
        author: 'Tourism Dublin',
        audioUrl: 'https://example.com/audio1.mp3',
        duration: 45,
        category: 'historical',
        createdAt: new Date().toISOString()
    }
];

let events = [
    {
        id: 1,
        lat: 53.3461,
        lng: -6.2598,
        title: 'Accessible Music Concert',
        description: 'Orchestral performance with audio description and tactile experiences',
        time: 'Today, 19:00',
        location: 'National Concert Hall',
        organizer: 'Dublin Cultural Center',
        accessibility: 'Wheelchair access, Audio description, Tactile tour',
        category: 'cultural',
        verified: true,
        attendees: ['user123', 'user456']
    }
];

let users = [
    {
        id: 'user123',
        name: 'Alex',
        location: [53.3498, -6.2603],
        visionType: 'low_vision',
        preferences: {
            contrast: 7,
            audioDetail: 7,
            hapticIntensity: 6
        }
    }
];

// ===== API ROUTES =====

// 1. OBSTACLE DETECTION API
app.get('/api/obstacles', (req, res) => {
    const { lat, lng, radius = 100 } = req.query;
    
    // Calculate distances
    const obstaclesWithDistance = obstacles.map(obstacle => {
        const distance = calculateDistance(
            parseFloat(lat), parseFloat(lng),
            obstacle.lat, obstacle.lng
        );
        return { ...obstacle, distance: Math.round(distance) };
    });
    
    // Filter by radius
    const nearbyObstacles = obstaclesWithDistance.filter(o => o.distance <= radius);
    
    res.json(nearbyObstacles);
});

app.post('/api/obstacles', (req, res) => {
    const newObstacle = {
        id: obstacles.length + 1,
        ...req.body,
        updatedAt: new Date().toISOString(),
        distance: 0
    };
    
    obstacles.push(newObstacle);
    
    // In real app, notify nearby users via WebSocket
    console.log('New obstacle reported:', newObstacle);
    
    res.json({
        success: true,
        message: 'Obstacle reported successfully',
        obstacle: newObstacle
    });
});

// 2. AUDIO BOTTLES API
app.get('/api/audio-bottles', (req, res) => {
    const { lat, lng, radius = 200 } = req.query;
    
    const bottlesWithDistance = audioBottles.map(bottle => {
        const distance = calculateDistance(
            parseFloat(lat), parseFloat(lng),
            bottle.lat, bottle.lng
        );
        return { ...bottle, distance: Math.round(distance) };
    });
    
    const nearbyBottles = bottlesWithDistance.filter(b => b.distance <= radius);
    
    res.json(nearbyBottles);
});

app.post('/api/audio-bottles', (req, res) => {
    const { title, description, author, lat, lng, category } = req.body;
    
    const newBottle = {
        id: audioBottles.length + 1,
        title,
        description,
        author,
        lat: parseFloat(lat),
        lng: parseFloat(lng),
        audioUrl: `https://storage.example.com/audio/${Date.now()}.mp3`,
        duration: 0, // Would be calculated from actual audio
        category,
        createdAt: new Date().toISOString()
    };
    
    audioBottles.push(newBottle);
    
    res.json({
        success: true,
        message: 'Audio bottle created successfully',
        bottle: newBottle
    });
});

// 3. ACCESSIBILITY EVENTS API
app.get('/api/events', (req, res) => {
    const { lat, lng, radius = 500 } = req.query;
    
    const eventsWithDistance = events.map(event => {
        const distance = calculateDistance(
            parseFloat(lat), parseFloat(lng),
            event.lat, event.lng
        );
        return { ...event, distance: Math.round(distance) };
    });
    
    const nearbyEvents = eventsWithDistance.filter(e => e.distance <= radius);
    
    res.json(nearbyEvents);
});

app.post('/api/events', (req, res) => {
    const { title, description, time, location, lat, lng, organizer, accessibility } = req.body;
    
    const newEvent = {
        id: events.length + 1,
        title,
        description,
        time,
        location,
        lat: parseFloat(lat),
        lng: parseFloat(lng),
        organizer,
        accessibility,
        category: 'business',
        verified: false, // Needs verification
        attendees: [],
        createdAt: new Date().toISOString()
    };
    
    events.push(newEvent);
    
    res.json({
        success: true,
        message: 'Event submitted for verification',
        event: newEvent
    });
});

// 4. USER PROFILE & ML ADAPTATION API
app.get('/api/user/:id', (req, res) => {
    const user = users.find(u => u.id === req.params.id);
    
    if (!user) {
        return res.status(404).json({ error: 'User not found' });
    }
    
    res.json(user);
});

app.put('/api/user/:id/preferences', (req, res) => {
    const user = users.find(u => u.id === req.params.id);
    
    if (!user) {
        return res.status(404).json({ error: 'User not found' });
    }
    
    user.preferences = { ...user.preferences, ...req.body };
    user.visionType = req.body.visionType || user.visionType;
    
    res.json({
        success: true,
        message: 'Preferences updated',
        user
    });
});

// 5. FRIEND DETECTION API
app.get('/api/nearby-friends/:userId', (req, res) => {
    const user = users.find(u => u.id === req.params.userId);
    
    if (!user) {
        return res.status(404).json({ error: 'User not found' });
    }
    
    const [userLat, userLng] = user.location;
    const friends = users.filter(u => {
        if (u.id === req.params.userId) return false;
        
        const distance = calculateDistance(userLat, userLng, u.location[0], u.location[1]);
        return distance <= 100; // Within 100 meters
    });
    
    res.json(friends);
});

// 6. REAL-TIME UPDATES (WebSocket Simulation)
app.post('/api/update-location', (req, res) => {
    const { userId, lat, lng } = req.body;
    
    const user = users.find(u => u.id === userId);
    if (user) {
        user.location = [parseFloat(lat), parseFloat(lng)];
        user.lastActive = new Date().toISOString();
    }
    
    // In real app, broadcast to WebSocket connections
    console.log(`User ${userId} location updated:`, [lat, lng]);
    
    res.json({ success: true });
});

// 7. EMERGENCY API
app.post('/api/emergency', (req, res) => {
    const { userId, lat, lng, message } = req.body;
    
    console.log('EMERGENCY ALERT:', {
        userId,
        location: [lat, lng],
        message,
        timestamp: new Date().toISOString()
    });
    
    // In real app, this would:
    // 1. Notify emergency contacts
    // 2. Alert nearby volunteers
    // 3. Send to emergency services
    
    res.json({
        success: true,
        message: 'Emergency alert sent. Help is on the way.',
        alertId: Date.now()
    });
});

// Helper function to calculate distance between two coordinates
function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lon2 - lon1) * Math.PI / 180;
    
    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    
    return R * c;
}

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        services: {
            obstacles: obstacles.length,
            audioBottles: audioBottles.length,
            events: events.length,
            users: users.length
        }
    });
});

// Serve frontend
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

// Start server
app.listen(PORT, () => {
    console.log(`
    🚀 SoundSense Dublin Backend Server
    📍 Port: ${PORT}
    🌐 URL: http://localhost:${PORT}
    
    📡 Available Endpoints:
    ├── GET  /api/obstacles            - Get nearby obstacles
    ├── POST /api/obstacles            - Report new obstacle
    ├── GET  /api/audio-bottles        - Get nearby audio bottles
    ├── POST /api/audio-bottles        - Create audio bottle
    ├── GET  /api/events               - Get nearby events
    ├── POST /api/events               - Submit new event
    ├── GET  /api/user/:id             - Get user profile
    ├── PUT  /api/user/:id/preferences - Update preferences
    ├── GET  /api/nearby-friends/:id   - Find nearby friends
    ├── POST /api/update-location      - Update user location
    └── POST /api/emergency            - Send emergency alert
    
    🎯 Frontend: http://localhost:${PORT}
    `);
});
