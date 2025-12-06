// SoundSense Dublin - Main Application
class SoundSenseApp {
    constructor() {
        this.init();
    }

    async init() {
        console.log('SoundSense Dublin - Initializing...');
        
        // Initialize components
        await this.initMap();
        this.initVoiceAssistant();
        this.initHapticModule();
        this.initMLAdapter();
        this.initEventListeners();
        
        // Load mock data
        this.loadMockData();
        
        // Start periodic updates
        this.startUpdates();
        
        console.log('SoundSense Dublin - Ready!');
        this.speak("Welcome to SoundSense Dublin. I will guide you through the city with audio and haptic feedback.");
    }

    // ===== MAP INITIALIZATION =====
    async initMap() {
        // Initialize Dublin map
        this.map = L.map('map').setView([53.3498, -6.2603], 14);
        
        // Add OpenStreetMap tiles
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors',
            maxZoom: 19
        }).addTo(this.map);

        // User marker with pulsing effect
        this.userPosition = [53.3498, -6.2603];
        this.userMarker = L.circleMarker(this.userPosition, {
            color: '#4361ee',
            fillColor: '#3a0ca3',
            fillOpacity: 0.8,
            radius: 12
        }).addTo(this.map);
        
        this.userMarker.bindPopup('<b>You are here</b><br>SoundSense is guiding you').openPopup();

        // Detection circle
        this.detectionRadius = 100; // meters
        this.detectionCircle = L.circle(this.userPosition, {
            radius: this.detectionRadius,
            color: '#4cc9f0',
            fillColor: '#4cc9f0',
            fillOpacity: 0.1,
            dashArray: '10, 10'
        }).addTo(this.map);

        // Initialize obstacle markers layer
        this.obstacleLayer = L.layerGroup().addTo(this.map);
        
        // Initialize audio bottle markers layer
        this.audioLayer = L.layerGroup().addTo(this.map);
        
        // Initialize event markers layer
        this.eventLayer = L.layerGroup().addTo(this.map);
    }

    // ===== VOICE ASSISTANT =====
    initVoiceAssistant() {
        this.speechSynthesis = window.speechSynthesis;
        this.voiceQueue = [];
        this.isSpeaking = false;
        
        // Get available voices
        this.loadVoices();
        
        // Initialize Speech Recognition
        this.initSpeechRecognition();
    }

    loadVoices() {
        // Load available voices
        setTimeout(() => {
            this.voices = this.speechSynthesis.getVoices();
            console.log('Available voices:', this.voices.length);
        }, 1000);
    }

    initSpeechRecognition() {
        if ('webkitSpeechRecognition' in window) {
            this.recognition = new webkitSpeechRecognition();
            this.recognition.continuous = true;
            this.recognition.interimResults = true;
            this.recognition.lang = 'en-US';
            
            this.recognition.onresult = (event) => {
                const transcript = Array.from(event.results)
                    .map(result => result[0])
                    .map(result => result.transcript)
                    .join('');
                
                this.processVoiceCommand(transcript);
            };
            
            this.recognition.onerror = (event) => {
                console.error('Speech recognition error:', event.error);
            };
        }
    }

    speak(text, options = {}) {
        return new Promise((resolve) => {
            if (!this.speechSynthesis) {
                console.log('Text to speak:', text);
                resolve();
                return;
            }

            const utterance = new SpeechSynthesisUtterance(text);
            
            // Configure voice
            if (this.voices && this.voices.length > 0) {
                const englishVoice = this.voices.find(v => v.lang.startsWith('en'));
                if (englishVoice) utterance.voice = englishVoice;
            }
            
            // Configure based on options
            utterance.rate = options.rate || 1.0;
            utterance.pitch = options.pitch || 1.0;
            utterance.volume = options.volume || 1.0;
            
            utterance.onend = () => {
                this.isSpeaking = false;
                resolve();
            };
            
            utterance.onerror = (event) => {
                console.error('Speech synthesis error:', event);
                this.isSpeaking = false;
                resolve();
            };
            
            this.speechSynthesis.speak(utterance);
            this.isSpeaking = true;
            
            // Update UI
            this.updateVoiceFeedback(text);
        });
    }

    updateVoiceFeedback(text) {
        const voiceMessage = document.getElementById('voiceMessage');
        const voiceProgress = document.getElementById('voiceProgress');
        
        if (voiceMessage) {
            voiceMessage.textContent = text;
        }
        
        // Simulate progress
        if (voiceProgress) {
            let progress = 0;
            const interval = setInterval(() => {
                progress += 1;
                voiceProgress.style.width = `${progress}%`;
                
                if (progress >= 100) {
                    clearInterval(interval);
                }
            }, text.length * 10);
        }
    }

    // ===== HAPTIC FEEDBACK =====
    initHapticModule() {
        // Check for vibration API support
        this.vibrationSupported = 'vibrate' in navigator;
        
        if (this.vibrationSupported) {
            console.log('Vibration API supported');
            this.updateHapticStatus('Connected');
        } else {
            console.log('Vibration API not supported');
            this.updateHapticStatus('Simulation Mode');
        }
        
        // Haptic feedback patterns
        this.hapticPatterns = {
            friend: [100, 50, 100, 50, 100], // Friend nearby pattern
            obstacle: [200, 100, 200], // Obstacle warning
            event: [100, 100, 100, 100], // Event notification
            emergency: [500, 200, 500] // Emergency alert
        };
    }

    vibrate(pattern) {
        if (this.vibrationSupported && this.hapticPatterns[pattern]) {
            navigator.vibrate(this.hapticPatterns[pattern]);
            console.log(`Vibrating pattern: ${pattern}`);
        } else {
            // Simulate haptic feedback in UI
            this.simulateHaptic(pattern);
        }
    }

    simulateHaptic(pattern) {
        const indicator = document.getElementById('hapticIndicator');
        if (indicator) {
            indicator.style.animation = 'none';
            setTimeout(() => {
                indicator.style.animation = 'shake 0.5s';
            }, 10);
        }
        
        // Add shake animation to CSS
        const style = document.createElement('style');
        style.textContent = `
            @keyframes shake {
                0%, 100% { transform: translateX(0); }
                25% { transform: translateX(-5px); }
                75% { transform: translateX(5px); }
            }
        `;
        document.head.appendChild(style);
    }

    updateHapticStatus(status) {
        const statusText = document.getElementById('hapticStatusText');
        const statusLed = document.getElementById('hapticStatusLed');
        
        if (statusText) statusText.textContent = status;
        if (statusLed) {
            statusLed.style.background = status === 'Connected' ? '#4ade80' : '#fbbf24';
        }
    }

    // ===== OBSTACLE DETECTION =====
    async scanForObstacles() {
        console.log('Scanning for obstacles...');
        
        // Update UI
        this.updateButtonState('detectObstaclesBtn', true, 'Scanning...');
        
        // Simulate API call
        const obstacles = await this.fetchObstacles();
        
        // Clear previous obstacles
        this.obstacleLayer.clearLayers();
        
        // Display obstacles
        obstacles.forEach(obstacle => {
            this.addObstacleMarker(obstacle);
            this.addObstacleToList(obstacle);
        });
        
        // Update obstacle labels on map
        this.updateObstacleLabels(obstacles);
        
        // Provide audio feedback
        await this.announceObstacles(obstacles);
        
        // Provide haptic feedback if obstacles are close
        const closeObstacles = obstacles.filter(o => o.distance < 50);
        if (closeObstacles.length > 0) {
            this.vibrate('obstacle');
        }
        
        // Update UI
        this.updateButtonState('detectObstaclesBtn', false, 'Scan Area (100m)');
        this.updateLastScanTime();
        
        // Update alert count
        this.updateAlertCount(obstacles.length);
    }

    addObstacleMarker(obstacle) {
        const marker = L.circleMarker([obstacle.lat, obstacle.lng], {
            color: this.getObstacleColor(obstacle.type),
            fillColor: this.getObstacleColor(obstacle.type),
            fillOpacity: 0.7,
            radius: 8
        }).addTo(this.obstacleLayer);
        
        const popupContent = `
            <div class="obstacle-popup">
                <h4>${obstacle.type.toUpperCase()}</h4>
                <p>${obstacle.description}</p>
                <div class="obstacle-meta">
                    <span class="source">Source: ${obstacle.source}</span>
                    <span class="distance">${obstacle.distance}m away</span>
                </div>
            </div>
        `;
        
        marker.bindPopup(popupContent);
        
        // Add click event for audio announcement
        marker.on('click', () => {
            this.speak(`Obstacle: ${obstacle.description}. ${obstacle.distance} meters away.`);
        });
        
        return marker;
    }

    getObstacleColor(type) {
        const colors = {
            construction: '#f8961e',
            permanent: '#f72585',
            temporary: '#4cc9f0',
            hazard: '#dc2626'
        };
        return colors[type] || '#6b7280';
    }

    addObstacleToList(obstacle) {
        const list = document.getElementById('obstacleList');
        if (!list) return;
        
        const item = document.createElement('div');
        item.className = 'obstacle-item';
        item.innerHTML = `
            <div class="obstacle-icon">
                <i class="fas fa-${this.getObstacleIcon(obstacle.type)}"></i>
            </div>
            <div class="obstacle-info">
                <h4>${obstacle.description}</h4>
                <div class="obstacle-details">
                    <span class="distance">${obstacle.distance}m</span>
                    <span class="source ${obstacle.source}">${obstacle.source}</span>
                </div>
            </div>
        `;
        
        list.appendChild(item);
    }

    getObstacleIcon(type) {
        const icons = {
            construction: 'hard-hat',
            permanent: 'exclamation-triangle',
            temporary: 'clock',
            hazard: 'radiation'
        };
        return icons[type] || 'exclamation-circle';
    }

    updateObstacleLabels(obstacles) {
        const labelsContainer = document.getElementById('obstacleLabels');
        if (!labelsContainer) return;
        
        labelsContainer.innerHTML = '';
        
        obstacles.slice(0, 5).forEach(obstacle => {
            const label = document.createElement('div');
            label.className = `obstacle-label label-${obstacle.type}`;
            label.innerHTML = `
                <i class="fas fa-${this.getObstacleIcon(obstacle.type)}"></i>
                <span>${obstacle.description}</span>
            `;
            labelsContainer.appendChild(label);
        });
    }

    async announceObstacles(obstacles) {
        if (obstacles.length === 0) {
            await this.speak("No obstacles detected in your vicinity.");
            return;
        }
        
        const sortedObstacles = [...obstacles].sort((a, b) => a.distance - b.distance);
        const closest = sortedObstacles[0];
        
        let message = `Detected ${obstacles.length} obstacles. `;
        message += `Closest is ${closest.distance} meters away: ${closest.description}. `;
        
        if (obstacles.length > 1) {
            message += `There are ${obstacles.length - 1} more obstacles in the area.`;
        }
        
        await this.speak(message);
    }

    // ===== AUDIO BOTTLES =====
    async loadAudioBottles() {
        console.log('Loading audio bottles...');
        
        // Simulate API call
        const audioBottles = await this.fetchAudioBottles();
        
        // Clear previous audio markers
        this.audioLayer.clearLayers();
        
        // Display audio bottles
        audioBottles.forEach(bottle => {
            this.addAudioBottleMarker(bottle);
            this.addAudioBottleToList(bottle);
        });
        
        // Update proximity indicator
        this.updateProximityIndicator(audioBottles);
        
        // Check if any audio bottle is very close
        const veryCloseBottle = audioBottles.find(b => b.distance < 20);
        if (veryCloseBottle) {
            this.autoPlayAudioBottle(veryCloseBottle);
        }
    }

    addAudioBottleMarker(bottle) {
        const icon = L.divIcon({
            className: 'audio-bottle-marker',
            html: `<div class="audio-marker">
                     <i class="fas fa-wave-square"></i>
                   </div>`,
            iconSize: [40, 40],
            iconAnchor: [20, 40]
        });
        
        const marker = L.marker([bottle.lat, bottle.lng], { icon })
            .addTo(this.audioLayer);
        
        const popupContent = `
            <div class="audio-popup">
                <h4>${bottle.title}</h4>
                <p>${bottle.description}</p>
                <div class="audio-meta">
                    <span class="author">By: ${bottle.author}</span>
                    <span class="duration">${bottle.duration}s</span>
                </div>
                <button class="play-audio-btn" data-id="${bottle.id}">
                    <i class="fas fa-play"></i> Play
                </button>
            </div>
        `;
        
        marker.bindPopup(popupContent);
        
        // Add click event to play audio
        marker.on('popupopen', () => {
            const playBtn = document.querySelector(`[data-id="${bottle.id}"]`);
            if (playBtn) {
                playBtn.addEventListener('click', () => this.playAudioBottle(bottle));
            }
        });
    }

    async playAudioBottle(bottle) {
        console.log('Playing audio bottle:', bottle.title);
        
        // In a real app, this would play actual audio
        // For now, we'll use text-to-speech
        await this.speak(`Audio message from ${bottle.author}: ${bottle.description}`);
    }

    autoPlayAudioBottle(bottle) {
        this.speak(`Approaching audio message: ${bottle.title}. ${bottle.distance} meters away.`);
        
        // Schedule auto-play if user gets even closer
        setTimeout(() => {
            if (bottle.distance < 10) {
                this.playAudioBottle(bottle);
            }
        }, 2000);
    }

    updateProximityIndicator(audioBottles) {
        if (audioBottles.length === 0) {
            document.getElementById('proximityValue').textContent = 'None';
            document.getElementById('proximityFill').style.width = '0%';
            return;
        }
        
        const closest = audioBottles.reduce((prev, curr) => 
            prev.distance < curr.distance ? prev : curr
        );
        
        document.getElementById('proximityValue').textContent = `${closest.distance}m`;
        
        // Calculate fill percentage (closer = more fill)
        const maxDistance = 200;
        const fillPercentage = Math.max(0, 100 - (closest.distance / maxDistance * 100));
        document.getElementById('proximityFill').style.width = `${fillPercentage}%`;
    }

    // ===== ACCESSIBILITY EVENTS =====
    async loadAccessibilityEvents() {
        console.log('Loading accessibility events...');
        
        // Simulate API call
        const events = await this.fetchEvents();
        
        // Clear previous event markers
        this.eventLayer.clearLayers();
        
        // Display events
        events.forEach(event => {
            this.addEventMarker(event);
            this.addEventToList(event);
        });
        
        // Check for friends nearby
        this.checkForFriends();
    }

    addEventMarker(event) {
        const icon = L.divIcon({
            className: 'event-marker',
            html: `<div class="event-marker-icon" style="background: ${event.color}">
                     <i class="fas fa-calendar-alt"></i>
                   </div>`,
            iconSize: [40, 40],
            iconAnchor: [20, 40]
        });
        
        const marker = L.marker([event.lat, event.lng], { icon })
            .addTo(this.eventLayer);
        
        const popupContent = `
            <div class="event-popup">
                <h4>${event.title}</h4>
                <p>${event.description}</p>
                <div class="event-details">
                    <div class="event-time">
                        <i class="fas fa-clock"></i>
                        ${event.time}
                    </div>
                    <div class="event-location">
                        <i class="fas fa-map-marker-alt"></i>
                        ${event.location}
                    </div>
                    <div class="event-accessibility">
                        <i class="fas fa-wheelchair"></i>
                        ${event.accessibility}
                    </div>
                </div>
                <button class="event-remind-btn" data-id="${event.id}">
                    <i class="fas fa-bell"></i> Set Reminder
                </button>
            </div>
        `;
        
        marker.bindPopup(popupContent);
    }

    addEventToList(event) {
        const list = document.getElementById('eventsList');
        if (!list) return;
        
        const item = document.createElement('div');
        item.className = 'event-item';
        item.innerHTML = `
            <div class="event-color" style="background: ${event.color}"></div>
            <div class="event-content">
                <h4>${event.title}</h4>
                <p class="event-description">${event.description}</p>
                <div class="event-meta">
                    <span class="event-time">
                        <i class="fas fa-clock"></i> ${event.time}
                    </span>
                    <span class="event-distance">
                        <i class="fas fa-location-arrow"></i> ${event.distance}m
                    </span>
                </div>
                <div class="event-tags">
                    ${event.tags.map(tag => `<span class="event-tag">${tag}</span>`).join('')}
                </div>
            </div>
        `;
        
        list.appendChild(item);
    }

    checkForFriends() {
        // Simulate friend detection
        const friendsNearby = Math.random() > 0.5 ? 1 : 0;
        
        if (friendsNearby > 0) {
            document.getElementById('friendsNearby').textContent = `${friendsNearby} friend nearby`;
            
            // Provide haptic feedback
            this.vibrate('friend');
            
            // Provide audio notification
            this.speak("Friend detected nearby. You can meet at the accessibility event.");
        }
    }

    // ===== MACHINE LEARNING ADAPTER =====
    initMLAdapter() {
        // Load user preferences
        this.userProfile = this.loadUserProfile();
        
        // Apply initial adaptations
        this.applyAdaptations();
    }

    loadUserProfile() {
        // In a real app, this would come from backend
        return {
            visionType: 'low_vision',
            contrastSensitivity: 5,
            audioDetail: 5,
            hapticIntensity: 5,
            preferredVoiceRate: 1.0
        };
    }

    applyAdaptations() {
        // Apply visual adaptations
        this.applyVisualAdaptations();
        
        // Apply audio adaptations
        this.applyAudioAdaptations();
        
        // Apply haptic adaptations
        this.applyHapticAdaptations();
    }

    applyVisualAdaptations() {
        const contrast = this.userProfile.contrastSensitivity;
        const root = document.documentElement;
        
        // Adjust contrast
        if (contrast > 7) {
            root.style.setProperty('--primary-color', '#0056b3');
            root.style.setProperty('--secondary-color', '#003d82');
        } else if (contrast < 3) {
            root.style.setProperty('--primary-color', '#6c8eff');
            root.style.setProperty('--secondary-color', '#8a5fff');
        }
        
        // Update vision type display
        document.getElementById('visionType').textContent = 
            this.userProfile.visionType.replace('_', ' ').toUpperCase();
    }

    applyAudioAdaptations() {
        const audioDetail = this.userProfile.audioDetail;
        
        // Adjust voice rate based on audio detail preference
        let rate = 1.0;
        if (audioDetail > 7) rate = 0.9; // Slower for more detail
        if (audioDetail < 3) rate = 1.2; // Faster for less detail
        
        this.userProfile.preferredVoiceRate = rate;
    }

    applyHpticAdaptations() {
        const intensity = this.userProfile.hapticIntensity;
        
        // Adjust haptic patterns based on intensity
        if (intensity > 7) {
            // Stronger vibrations
            this.hapticPatterns = {
                friend: [200, 100, 200, 100, 200],
                obstacle: [300, 150, 300],
                event: [150, 150, 150, 150],
                emergency: [600, 300, 600]
            };
        } else if (intensity < 3) {
            // Softer vibrations
            this.hapticPatterns = {
                friend: [50, 25, 50, 25, 50],
                obstacle: [100, 50, 100],
                event: [50, 50, 50, 50],
                emergency: [300, 150, 300]
            };
        }
    }

    // ===== EVENT LISTENERS =====
    initEventListeners() {
        // Obstacle detection
        document.getElementById('detectObstaclesBtn').addEventListener('click', () => {
            this.scanForObstacles();
        });
        
        // Radius slider
        document.getElementById('radiusSlider').addEventListener('input', (e) => {
            const radius = e.target.value;
            document.getElementById('radiusValue').textContent = radius;
            this.detectionRadius = parseInt(radius);
            this.detectionCircle.setRadius(this.detectionRadius);
        });
        
        // Audio bottle recording
        document.getElementById('recordAudioBtn').addEventListener('click', () => {
            this.recordAudioBottle();
        });
        
        // Auto-play nearby audio
        document.getElementById('playNearbyBtn').addEventListener('click', () => {
            this.autoPlayNearbyAudio();
        });
        
        // ML Adaptation
        document.getElementById('mlAdaptBtn').addEventListener('click', () => {
            this.showMLPanel();
        });
        
        document.getElementById('saveMLSettings').addEventListener('click', () => {
            this.saveMLSettings();
        });
        
        document.getElementById('closeMLPanel').addEventListener('click', () => {
            this.hideMLPanel();
        });
        
        // Haptic feedback buttons
        document.querySelectorAll('.vibration-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const pattern = e.target.closest('.vibration-btn').dataset.pattern;
                this.vibrate(pattern);
            });
        });
        
        // Emergency button
        document.getElementById('emergencyBtn').addEventListener('click', () => {
            this.triggerEmergency();
        });
        
        // Voice control
        document.getElementById('voiceControlBtn').addEventListener('click', () => {
            this.toggleVoiceControl();
        });
        
        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            this.handleKeyboardShortcuts(e);
        });
    }

    // ===== DATA FETCHING (MOCK) =====
    async fetchObstacles() {
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Mock obstacle data for Dublin
        return [
            {
                id: 1,
                lat: 53.3505,
                lng: -6.2621,
                type: 'construction',
                description: 'Road construction on O\'Connell Street',
                source: 'municipal',
                distance: 45,
                severity: 'medium',
                updatedAt: '2024-01-15T10:30:00Z'
            },
            {
                id: 2,
                lat: 53.3479,
                lng: -6.2598,
                type: 'temporary',
                description: 'Christmas market stall setup',
                source: 'volunteer',
                distance: 120,
                severity: 'low',
                updatedAt: '2024-01-15T09:15:00Z'
            },
            {
                id: 3,
                lat: 53.3492,
                lng: -6.2603,
                type: 'permanent',
                description: 'Fixed obstacle: Historical monument',
                source: 'municipal',
                distance: 80,
                severity: 'low',
                updatedAt: '2024-01-14T14:20:00Z'
            },
            {
                id: 4,
                lat: 53.3511,
                lng: -6.2635,
                type: 'hazard',
                description: 'Uneven pavement near Trinity College',
                source: 'volunteer',
                distance: 150,
                severity: 'high',
                updatedAt: '2024-01-15T11:45:00Z'
            }
        ];
    }

    async fetchAudioBottles() {
        await new Promise(resolve => setTimeout(resolve, 300));
        
        return [
            {
                id: 1,
                lat: 53.3439,
                lng: -6.2676,
                title: 'Dublin Castle History',
                description: 'Welcome to Dublin Castle, built in 1204 on the site of a Viking settlement.',
                author: 'Tourism Dublin',
                duration: 45,
                distance: 320,
                category: 'historical'
            },
            {
                id: 2,
                lat: 53.3469,
                lng: -6.2618,
                title: 'Trinity College Library',
                description: 'The Long Room houses 200,000 of the Library\'s oldest books, including the Book of Kells.',
                author: 'Cultural Guide',
                duration: 60,
                distance: 180,
                category: 'cultural'
            },
            {
                id: 3,
                lat: 53.3495,
                lng: -6.2602,
                title: 'Local Cafe Recommendation',
                description: 'The best coffee in Dublin is just around the corner. Ask for their special blend.',
                author: 'Local Resident',
                duration: 30,
                distance: 65,
                category: 'local'
            }
        ];
    }

    async fetchEvents() {
        await new Promise(resolve => setTimeout(resolve, 400));
        
        return [
            {
                id: 1,
                lat: 53.3461,
                lng: -6.2598,
                title: 'Accessible Music Concert',
                description: 'Orchestral performance with audio description and tactile experiences',
                time: 'Today, 19:00',
                location: 'National Concert Hall',
                distance: 200,
                color: '#4361ee',
                accessibility: 'Wheelchair access, Audio description, Tactile tour',
                tags: ['music', 'accessible', 'evening']
            },
            {
                id: 2,
                lat: 53.3509,
                lng: -6.2605,
                title: 'Tactile Art Exhibition',
                description: 'Touch-friendly art exhibition for visually impaired visitors',
                time: 'Daily 10:00-18:00',
                location: 'Irish Museum of Modern Art',
                distance: 85,
                color: '#f72585',
                accessibility: 'Tactile art, Guided tours, Braille descriptions',
                tags: ['art', 'tactile', 'exhibition']
            },
            {
                id: 3,
                lat: 53.3473,
                lng: -6.2627,
                title: 'Braille Learning Workshop',
                description: 'Free workshop for learning Braille basics',
                time: 'Wednesday 16:00',
                location: 'Dublin City Library',
                distance: 120,
                color: '#4cc9f0',
                accessibility: 'All materials provided, One-on-one assistance',
                tags: ['education', 'workshop', 'free']
            }
        ];
    }

    // ===== UI UPDATES =====
    updateButtonState(buttonId, isLoading, text) {
        const button = document.getElementById(buttonId);
        if (button) {
            button.disabled = isLoading;
            button.innerHTML = isLoading ? 
                `<i class="fas fa-spinner fa-spin"></i> ${text}` :
                text;
        }
    }

    updateLastScanTime() {
        const now = new Date();
        const timeString = now.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
        document.getElementById('lastScanTime').textContent = timeString;
    }

    updateAlertCount(count) {
        document.getElementById('alertCount').textContent = count;
        document.getElementById('voiceAlertCount').textContent = count;
    }

    // ===== ML PANEL CONTROLS =====
    showMLPanel() {
        document.getElementById('mlPanel').classList.add('active');
        
        // Set slider values from user profile
        document.getElementById('contrastSlider').value = this.userProfile.contrastSensitivity;
        document.getElementById('audioDetailSlider').value = this.userProfile.audioDetail;
        document.getElementById('hapticSlider').value = this.userProfile.hapticIntensity;
    }

    hideMLPanel() {
        document.getElementById('mlPanel').classList.remove('active');
    }

    saveMLSettings() {
        // Update user profile from sliders
        this.userProfile.contrastSensitivity = parseInt(document.getElementById('contrastSlider').value);
        this.userProfile.audioDetail = parseInt(document.getElementById('audioDetailSlider').value);
        this.userProfile.hapticIntensity = parseInt(document.getElementById('hapticSlider').value);
        
        // Apply adaptations
        this.applyAdaptations();
        
        // Hide panel
        this.hideMLPanel();
        
        // Provide feedback
        this.speak("Adaptation settings saved successfully.");
    }

    // ===== EMERGENCY FUNCTION =====
    triggerEmergency() {
        // Provide strong haptic feedback
        this.vibrate('emergency');
        
        // Speak emergency message
        this.speak("Emergency assistance requested. Your location has been shared with emergency contacts.", {
            rate: 0.8,
            volume: 1.0
        });
        
        // In a real app, this would send location to emergency services
        console.log('Emergency triggered at:', this.userPosition);
        
        // Flash emergency button
        const emergencyBtn = document.getElementById('emergencyBtn');
        emergencyBtn.style.animation = 'pulse-emergency 1s infinite';
        
        // Add emergency animation to CSS
        const style = document.createElement('style');
        style.textContent = `
            @keyframes pulse-emergency {
                0%, 100% { box-shadow: 0 0 0 0 rgba(247, 37, 133, 0.7); }
                50% { box-shadow: 0 0 0 20px rgba(247, 37, 133, 0); }
            }
        `;
        document.head.appendChild(style);
    }

    // ===== VOICE CONTROL =====
    toggleVoiceControl() {
        if (this.recognition) {
            if (this.isListening) {
                this.recognition.stop();
                this.isListening = false;
                document.getElementById('voiceStatus').textContent = 'Paused';
                this.speak("Voice control paused.");
            } else {
                this.recognition.start();
                this.isListening = true;
                document.getElementById('voiceStatus').textContent = 'Listening';
                this.speak("Voice control activated. Say 'scan area' or 'play audio'.");
            }
        }
    }

    processVoiceCommand(transcript) {
        const lowerTranscript = transcript.toLowerCase();
        
        if (lowerTranscript.includes('scan area') || lowerTranscript.includes('detect obstacles')) {
            this.scanForObstacles();
        } else if (lowerTranscript.includes('play audio') || lowerTranscript.includes('play message')) {
            this.autoPlayNearbyAudio();
        } else if (lowerTranscript.includes('show events')) {
            this.loadAccessibilityEvents();
        } else if (lowerTranscript.includes('emergency') || lowerTranscript.includes('help')) {
            this.triggerEmergency();
        } else if (lowerTranscript.includes('stop speaking') || lowerTranscript.includes('quiet')) {
            this.speechSynthesis.cancel();
        }
    }

    // ===== KEYBOARD SHORTCUTS =====
    handleKeyboardShortcuts(e) {
        // Space bar for quick help
        if (e.code === 'Space') {
            e.preventDefault();
            this.speak("Quick commands: S to scan area, A to play audio, E for events, H for help.");
        }
        
        // S for scan
        if (e.code === 'KeyS') {
            e.preventDefault();
            this.scanForObstacles();
        }
        
        // A for audio
        if (e.code === 'KeyA') {
            e.preventDefault();
            this.autoPlayNearbyAudio();
        }
        
        // E for events
        if (e.code === 'KeyE') {
            e.preventDefault();
            this.loadAccessibilityEvents();
        }
        
        // H for help
        if (e.code === 'KeyH') {
            e.preventDefault();
            this.showHelp();
        }
        
        // M for ML adaptation
        if (e.code === 'KeyM') {
            e.preventDefault();
            this.showMLPanel();
        }
    }

    // ===== HELPER FUNCTIONS =====
    async recordAudioBottle() {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            this.speak("Audio recording is not supported in your browser.");
            return;
        }
        
        try {
            this.speak("Starting audio recording. Please speak your message now.");
            
            // In a real app, this would record actual audio
            // For now, we'll simulate recording
            await new Promise(resolve => setTimeout(resolve, 3000));
            
            this.speak("Recording saved as an audio bottle. It will be available to other users nearby.");
            
            // Simulate adding to list
            this.addAudioBottleToList({
                id: Date.now(),
                title: 'My Recording',
                description: 'User recorded message',
                author: 'You',
                duration: 3,
                distance: 0
            });
            
        } catch (error) {
            console.error('Error recording audio:', error);
            this.speak("Sorry, there was an error recording your message.");
        }
    }

    async autoPlayNearbyAudio() {
        const bottles = await this.fetchAudioBottles();
        if (bottles.length > 0) {
            const closest = bottles.reduce((prev, curr) => 
                prev.distance < curr.distance ? prev : curr
            );
            
            if (closest.distance < 100) {
                await this.playAudioBottle(closest);
            } else {
                this.speak(`The closest audio message is ${closest.distance} meters away. Getting closer will trigger auto-play.`);
            }
        } else {
            this.speak("No audio messages found in your vicinity.");
        }
    }

    showHelp() {
        const helpMessage = `
            SoundSense Dublin Help Guide:
            1. Press the Scan Area button to detect obstacles around you.
            2. Audio bottles will automatically play when you get close.
            3. Accessibility events show nearby activities with friend detection.
            4. Use the AI Adapt button to customize the interface for your vision needs.
            5. Keyboard shortcuts: Space for help, S to scan, A for audio, E for events.
            6. Say "scan area" or "play audio" for voice commands.
        `;
        
        this.speak(helpMessage);
    }

    // ===== PERIODIC UPDATES =====
    startUpdates() {
        // Update user position periodically (simulated)
        setInterval(() => {
            this.simulateMovement();
        }, 10000);
        
        // Check for new obstacles every 30 seconds
        setInterval(() => {
            this.checkForNewObstacles();
        }, 30000);
        
        // Update audio bottle proximity every 15 seconds
        setInterval(() => {
            this.updateAudioProximity();
        }, 15000);
    }

    simulateMovement() {
        // Simulate small position changes
        const latChange = (Math.random() - 0.5) * 0.001;
        const lngChange = (Math.random() - 0.5) * 0.001;
        
        this.userPosition[0] += latChange;
        this.userPosition[1] += lngChange;
        
        this.userMarker.setLatLng(this.userPosition);
        this.detectionCircle.setLatLng(this.userPosition);
        this.map.panTo(this.userPosition);
    }

    async checkForNewObstacles() {
        const obstacles = await this.fetchObstacles();
        const newObstacles = obstacles.filter(o => o.distance < this.detectionRadius);
        
        if (newObstacles.length > 0) {
            this.speak(`Update: ${newObstacles.length} new obstacles detected in your area.`);
        }
    }

    async updateAudioProximity() {
        const bottles = await this.fetchAudioBottles();
        this.updateProximityIndicator(bottles);
        
        // Check for very close bottles
        const veryClose = bottles.find(b => b.distance < 10);
        if (veryClose) {
            this.autoPlayAudioBottle(veryClose);
        }
    }

    // ===== LOAD MOCK DATA =====
    loadMockData() {
        // Initial data load
        this.scanForObstacles();
        this.loadAudioBottles();
        this.loadAccessibilityEvents();
    }
}

// ===== INITIALIZE APPLICATION =====
document.addEventListener('DOMContentLoaded', () => {
    // Create and initialize the app
    window.soundSenseApp = new SoundSenseApp();
    
    // Add CSS for custom markers
    const style = document.createElement('style');
    style.textContent = `
        .audio-bottle-marker .audio-marker {
            width: 40px;
            height: 40px;
            background: linear-gradient(135deg, #4cc9f0, #4361ee);
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-size: 18px;
            box-shadow: 0 4px 15px rgba(76, 201, 240, 0.6);
            border: 3px solid white;
            animation: pulse-audio 2s infinite;
        }
        
        .event-marker .event-marker-icon {
            width: 40px;
            height: 40px;
            background: linear-gradient(135deg, #f72585, #3a0ca3);
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-size: 18px;
            box-shadow: 0 4px 15px rgba(247, 37, 133, 0.6);
            border: 3px solid white;
            animation: pulse-event 2s infinite;
        }
        
        @keyframes pulse-audio {
            0%, 100% { transform: scale(1); }
            50% { transform: scale(1.1); }
        }
        
        @keyframes pulse-event {
            0%, 100% { transform: scale(1); opacity: 1; }
            50% { transform: scale(1.05); opacity: 0.8; }
        }
        
        .obstacle-popup, .audio-popup, .event-popup {
            min-width: 250px;
            font-family: 'Poppins', sans-serif;
        }
        
        .obstacle-popup h4, .audio-popup h4, .event-popup h4 {
            margin: 0 0 10px 0;
            color: #212529;
        }
        
        .obstacle-meta, .audio-meta, .event-details {
            display: flex;
            flex-direction: column;
            gap: 5px;
            margin: 10px 0;
            font-size: 12px;
            color: #6c7280;
        }
        
        .source {
            padding: 2px 8px;
            border-radius: 10px;
            font-size: 10px;
            font-weight: 600;
            display: inline-block;
        }
        
        .source.municipal {
            background: #4361ee;
            color: white;
        }
        
        .source.volunteer {
            background: #4cc9f0;
            color: white;
        }
        
        .play-audio-btn, .event-remind-btn {
            width: 100%;
            padding: 8px 16px;
            background: linear-gradient(135deg, #4361ee, #3a0ca3);
            color: white;
            border: none;
            border-radius: 8px;
            cursor: pointer;
            font-weight: 600;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
            margin-top: 10px;
            transition: all 0.3s ease;
        }
        
        .play-audio-btn:hover, .event-remind-btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 15px rgba(67, 97, 238, 0.4);
        }
    `;
    document.head.appendChild(style);
});

// ===== GLOBAL ACCESS =====
// Make app accessible from console for debugging
window.SoundSenseApp = SoundSenseApp;
