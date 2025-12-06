
// ML Adapter for Vision Impairment Personalization
class MLAdapter {
    constructor() {
        this.profiles = {
            'total_blind': {
                contrast: 10,
                audioDetail: 10,
                hapticIntensity: 8,
                voiceRate: 0.9
            },
            'low_vision': {
                contrast: 7,
                audioDetail: 7,
                hapticIntensity: 6,
                voiceRate: 1.0
            },
            'color_blind': {
                contrast: 8,
                audioDetail: 6,
                hapticIntensity: 5,
                voiceRate: 1.1
            },
            'light_sensitive': {
                contrast: 3,
                audioDetail: 5,
                hapticIntensity: 4,
                voiceRate: 1.0
            }
        };
        
        this.currentProfile = 'low_vision';
        this.learningData = [];
        this.init();
    }
    
    init() {
        this.loadLearningData();
        this.setupEventListeners();
    }
    
    loadLearningData() {
        // Load previous user interactions
        const savedData = localStorage.getItem('soundSenseLearningData');
        if (savedData) {
            this.learningData = JSON.parse(savedData);
        }
    }
    
    setupEventListeners() {
        // Monitor user interactions
        document.addEventListener('click', (e) => {
            this.recordInteraction('click', e.target.className);
        });
        
        document.addEventListener('keydown', (e) => {
            this.recordInteraction('keypress', e.code);
        });
        
        // Monitor voice command usage
        if (window.soundSenseApp) {
            const originalSpeak = window.soundSenseApp.speak;
            window.soundSenseApp.speak = (...args) => {
                this.recordInteraction('voice_output', args[0]);
                return originalSpeak.apply(window.soundSenseApp, args);
            };
        }
    }
    
    recordInteraction(type, data) {
        const interaction = {
            type,
            data,
            timestamp: new Date().toISOString(),
            profile: this.currentProfile
        };
        
        this.learningData.push(interaction);
        
        // Keep only last 1000 interactions
        if (this.learningData.length > 1000) {
            this.learningData = this.learningData.slice(-1000);
        }
        
        // Save to localStorage
        localStorage.setItem('soundSenseLearningData', JSON.stringify(this.learningData));
        
        // Periodically analyze patterns
        if (this.learningData.length % 50 === 0) {
            this.analyzePatterns();
        }
    }
    
    analyzePatterns() {
        // Simple pattern analysis
        const recentInteractions = this.learningData.slice(-100);
        
        // Analyze voice command frequency
        const voiceCommands = recentInteractions.filter(i => i.type === 'voice_output');
        const voiceFrequency = voiceCommands.length / recentInteractions.length;
        
        // Analyze UI interaction patterns
        const uiInteractions = recentInteractions.filter(i => 
            i.type === 'click' && i.data.includes('btn')
        );
        
        // Adjust profile based on usage patterns
        if (voiceFrequency > 0.3) {
            // User relies heavily on voice - optimize for audio
            this.optimizeForAudioUsage();
        }
        
        if (uiInteractions.length > 20) {
            // User interacts with UI frequently - might need better contrast
            this.optimizeForVisualUsage();
        }
    }
    
    optimizeForAudioUsage() {
        // Increase audio detail and haptic feedback
        const profile = this.profiles[this.currentProfile];
        profile.audioDetail = Math.min(10, profile.audioDetail + 1);
        profile.hapticIntensity = Math.min(10, profile.hapticIntensity + 1);
        
        // Apply changes
        this.applyProfile(this.currentProfile);
    }
    
    optimizeForVisualUsage() {
        // Increase contrast for better visibility
        const profile = this.profiles[this.currentProfile];
        profile.contrast = Math.min(10, profile.contrast + 1);
        
        // Apply changes
        this.applyProfile(this.currentProfile);
    }
    
    detectVisionTypeFromBehavior() {
        // Analyze interaction patterns to guess vision type
        const patterns = {
            total_blind: {
                voiceFrequency: 0.4,
                uiInteraction: 0.1,
                errorRate: 0.2
            },
            low_vision: {
                voiceFrequency: 0.2,
                uiInteraction: 0.3,
                errorRate: 0.1
            },
            color_blind: {
                voiceFrequency: 0.15,
                uiInteraction: 0.4,
                errorRate: 0.15
            }
        };
        
        // Calculate current user's patterns
        const recentInteractions = this.learningData.slice(-50);
        const voiceFrequency = recentInteractions.filter(i => i.type === 'voice_output').length / 50;
        const uiInteraction = recentInteractions.filter(i => i.type === 'click').length / 50;
        
        // Find closest match
        let bestMatch = 'low_vision';
        let smallestDiff = Infinity;
        
        for (const [type, pattern] of Object.entries(patterns)) {
            const diff = Math.abs(pattern.voiceFrequency - voiceFrequency) + 
                        Math.abs(pattern.uiInteraction - uiInteraction);
            
            if (diff < smallestDiff) {
                smallestDiff = diff;
                bestMatch = type;
            }
        }
        
        return bestMatch;
    }
    
    applyProfile(profileName) {
        this.currentProfile = profileName;
        const profile = this.profiles[profileName];
        
        // Apply to UI
        this.applyVisualSettings(profile.contrast);
        this.applyAudioSettings(profile.audioDetail);
        this.applyHapticSettings(profile.hapticIntensity);
        
        // Update app if available
        if (window.soundSenseApp) {
            window.soundSenseApp.userProfile = {
                ...window.soundSenseApp.userProfile,
                contrastSensitivity: profile.contrast,
                audioDetail: profile.audioDetail,
                hapticIntensity: profile.hapticIntensity,
                preferredVoiceRate: profile.voiceRate
            };
            
            window.soundSenseApp.applyAdaptations();
        }
        
        // Save to localStorage
        localStorage.setItem('soundSenseProfile', profileName);
        
        // Provide feedback
        this.announceAdaptation(profileName);
    }
    
    applyVisualSettings(contrastLevel) {
        const root = document.documentElement;
        
        switch(true) {
            case contrastLevel >= 8:
                // High contrast mode
                root.style.setProperty('--primary-color', '#000000');
                root.style.setProperty('--secondary-color', '#333333');
                root.style.setProperty('--card-bg', '#ffffff');
                root.style.setProperty('--light-color', '#f0f0f0');
                break;
                
            case contrastLevel >= 5:
                // Medium contrast
                root.style.setProperty('--primary-color', '#0056b3');
                root.style.setProperty('--secondary-color', '#003d82');
                break;
                
            case contrastLevel <= 3:
                // Low contrast (for light sensitivity)
                root.style.setProperty('--primary-color', '#6c8eff');
                root.style.setProperty('--secondary-color', '#8a5fff');
                root.style.setProperty('--card-bg', 'rgba(255, 255, 255, 0.85)');
                break;
        }
    }
    
    applyAudioSettings(audioDetail) {
        // Adjust TTS settings based on detail level
        if (window.soundSenseApp) {
            const rate = 1.1 - (audioDetail * 0.02); // More detail = slower speech
            window.soundSenseApp.userProfile.preferredVoiceRate = Math.max(0.7, Math.min(1.3, rate));
        }
    }
    
    applyHapticSettings(intensity) {
        // Adjust vibration patterns based on intensity
        const patterns = {
            friend: [100 * intensity/5, 50 * intensity/5, 100 * intensity/5],
            obstacle: [200 * intensity/5, 100 * intensity/5, 200 * intensity/5],
            event: [100 * intensity/5, 100 * intensity/5, 100 * intensity/5],
            emergency: [500 * intensity/5, 200 * intensity/5, 500 * intensity/5]
        };
        
        if (window.soundSenseApp) {
            window.soundSenseApp.hapticPatterns = patterns;
        }
    }
    
    announceAdaptation(profileName) {
        const messages = {
            total_blind: "Adapting for complete visual impairment. Enhanced audio and haptic feedback activated.",
            low_vision: "Adapting for low vision. Increased contrast and detailed audio descriptions enabled.",
            color_blind: "Adapting for color vision deficiency. Enhanced contrast patterns applied.",
            light_sensitive: "Adapting for light sensitivity. Reduced brightness and softer colors applied."
        };
        
        if (window.soundSenseApp && messages[profileName]) {
            window.soundSenseApp.speak(messages[profileName]);
        }
    }
    
    // Public API
    autoDetectAndApply() {
        const detectedType = this.detectVisionTypeFromBehavior();
        this.applyProfile(detectedType);
        return detectedType;
    }
    
    setProfile(profileName) {
        if (this.profiles[profileName]) {
            this.applyProfile(profileName);
        }
    }
    
    getCurrentProfile() {
        return {
            name: this.currentProfile,
            settings: this.profiles[this.currentProfile]
        };
    }
    
    exportLearningData() {
        return JSON.stringify(this.learningData, null, 2);
    }
}

// Initialize ML Adapter
document.addEventListener('DOMContentLoaded', () => {
    window.mlAdapter = new MLAdapter();
    
    // Auto-detect after a short delay
    setTimeout(() => {
        const detectedType = window.mlAdapter.autoDetectAndApply();
        console.log(`ML Adapter: Auto-detected vision type: ${detectedType}`);
    }, 5000);
});
