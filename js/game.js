/**
 * Multi-Display Quiz Game
 * Synchronizes 3 displays using BroadcastChannel API
 */

class MultiDisplayGame {
    constructor() {
        this.displayId = null;
        this.displayConfig = null;
        this.selectedAnswers = [];
        this.isPlayingResult = false;
        this.allDisplaysState = {
            1: { answers: [], completed: false, allCorrect: false },
            2: { answers: [], completed: false, allCorrect: false },
            3: { answers: [], completed: false, allCorrect: false }
        };
        
        const cryptoObj = (typeof window !== 'undefined' && window.crypto) ? window.crypto : null;
        this.clientId = (cryptoObj && typeof cryptoObj.randomUUID === 'function')
            ? cryptoObj.randomUUID()
            : `client-${Date.now()}-${Math.random().toString(16).slice(2)}`;
        
        // BroadcastChannel for cross-tab communication when available
        this.channel = (typeof BroadcastChannel !== 'undefined')
            ? new BroadcastChannel('multi-display-game')
            : null;
        this.socket = null;
        this.reconnectTimer = null;
        this.pendingMessages = [];
        
        // DOM Elements
        this.elements = {
            selectorScreen: document.getElementById('selector-screen'),
            gameScreen: document.getElementById('game-screen'),
            idleLayer: document.getElementById('idle-layer'),
            interactiveLayer: document.getElementById('interactive-layer'),
            resultLayer: document.getElementById('result-layer'),
            idleVideo: document.getElementById('idle-video'),
            resultVideo: document.getElementById('result-video'),
            resultVideoSource: document.getElementById('result-video-source'),
            backgroundImage: document.getElementById('display-image'),
            displayTitle: document.getElementById('display-title'),
            answerButtons: document.getElementById('answer-buttons'),
            answerSlots: document.querySelectorAll('.answer-slot'),
            waitingOverlay: document.getElementById('waiting-overlay'),
            waitingStatus: document.getElementById('waiting-status')
        };
        
        this.init();
    }
    
    init() {
        // Setup display selector buttons
        document.querySelectorAll('.selector-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.selectDisplay(e));
            btn.addEventListener('touchend', (e) => {
                e.preventDefault();
                this.selectDisplay(e);
            });
        });
        
        // Setup BroadcastChannel listener when supported
        if (this.channel) {
            this.channel.onmessage = (event) => this.handleIncomingMessage(event.data);
        } else {
            console.warn('BroadcastChannel not available; falling back to WebSocket only');
        }
        
        // Setup idle layer touch/click
        this.elements.idleLayer.addEventListener('click', () => this.exitIdleMode());
        this.elements.idleLayer.addEventListener('touchend', (e) => {
            e.preventDefault();
            this.exitIdleMode();
        });

        this.setupWebSocket();
    }
    
    selectDisplay(event) {
        const displayNum = parseInt(event.target.dataset.display);
        this.displayId = displayNum;
        this.displayConfig = GAME_CONFIG.displays[displayNum];
        
        // Switch to game screen
        this.elements.selectorScreen.classList.remove('active');
        this.elements.gameScreen.classList.add('active');
        
        // Broadcast that this display is ready
        this.broadcast({
            type: 'DISPLAY_READY',
            displayId: this.displayId
        });
        
        // Start in idle mode
        this.enterIdleMode();
    }
    
    enterIdleMode() {
        // Show idle layer, hide others
        this.elements.idleLayer.classList.remove('hidden');
        this.elements.interactiveLayer.classList.add('hidden');
        this.elements.resultLayer.classList.add('hidden');
        
        // Reset state for this display only
        this.selectedAnswers = [];
        this.isPlayingResult = false;
        
        // Only reset own display state, keep others intact until they reset themselves
        if (this.displayId) {
            this.allDisplaysState[this.displayId] = {
                answers: [],
                completed: false,
                allCorrect: false
            };
        }
        
        // Clear answer slots UI
        this.elements.answerSlots.forEach(slot => {
            slot.innerHTML = '';
            slot.className = 'answer-slot';
        });
        
        // Hide waiting overlay
        if (this.elements.waitingOverlay) {
            this.elements.waitingOverlay.classList.remove('active');
        }
        
        // Clear answer buttons selection state
        document.querySelectorAll('.answer-btn').forEach(btn => {
            btn.classList.remove('selected');
            btn.disabled = false;
        });
        
        // Start idle video
        this.elements.idleVideo.currentTime = 0;
        this.elements.idleVideo.play().catch(err => {
            console.log('Video autoplay blocked, waiting for interaction');
        });
        
        // Broadcast idle state
        this.broadcast({
            type: 'ENTER_IDLE',
            displayId: this.displayId
        });
    }
    
    exitIdleMode() {
        // Hide idle layer, show interactive
        this.elements.idleLayer.classList.add('hidden');
        this.elements.interactiveLayer.classList.remove('hidden');
        
        // Pause idle video
        this.elements.idleVideo.pause();
        
        // Setup display content
        this.setupInteractiveContent();
        
        // Broadcast that this display exited idle
        this.broadcast({
            type: 'EXIT_IDLE',
            displayId: this.displayId
        });
    }
    
    setupInteractiveContent() {
        // Set main image and title
        this.elements.backgroundImage.src = this.displayConfig.image;
        this.elements.displayTitle.textContent = this.displayConfig.title;
        
        // Reset selected answers for fresh start
        this.selectedAnswers = [];
        
        // Hide waiting overlay
        if (this.elements.waitingOverlay) {
            this.elements.waitingOverlay.classList.remove('active');
        }
        
        // Generate answer buttons with images
        this.elements.answerButtons.innerHTML = '';
        this.displayConfig.answers.forEach(answer => {
            const btn = document.createElement('button');
            btn.className = 'answer-btn';
            btn.dataset.answerId = answer.id;
            
            // Create image element instead of text
            const img = document.createElement('img');
            img.src = answer.image;
            img.alt = answer.id;
            btn.appendChild(img);
            
            btn.addEventListener('click', () => this.selectAnswer(answer));
            btn.addEventListener('touchend', (e) => {
                e.preventDefault();
                this.selectAnswer(answer);
            });
            
            this.elements.answerButtons.appendChild(btn);
        });
        
        // Reset slots completely
        this.elements.answerSlots.forEach(slot => {
            slot.innerHTML = '';
            slot.className = 'answer-slot';
        });
        
        // Reset this display's state
        this.allDisplaysState[this.displayId] = {
            answers: [],
            completed: false,
            allCorrect: false
        };
    }
    
    selectAnswer(answer) {
        // Check if already selected 3 answers
        if (this.selectedAnswers.length >= 3) return;
        
        // Check if this answer was already selected
        if (this.selectedAnswers.find(a => a.id === answer.id)) return;
        
        // Add to selected answers
        this.selectedAnswers.push(answer);
        
        // Update button state
        const btn = document.querySelector(`[data-answer-id="${answer.id}"]`);
        if (btn) btn.classList.add('selected');
        
        // Update slot UI with image
        const slotIndex = this.selectedAnswers.length - 1;
        const slot = this.elements.answerSlots[slotIndex];
        
        // Create image for slot
        const img = document.createElement('img');
        img.src = answer.image;
        img.alt = answer.id;
        slot.innerHTML = '';
        slot.appendChild(img);
        slot.classList.add('filled');
        
        // Check if answer is correct and show glow
        setTimeout(() => {
            if (answer.correct) {
                slot.classList.add('correct');
            } else {
                slot.classList.add('incorrect');
            }
        }, GAME_CONFIG.timing.answerRevealDelay);
        
        // Update display state
        const allCorrect = this.selectedAnswers.every(a => a.correct);
        this.allDisplaysState[this.displayId] = {
            answers: this.selectedAnswers.map(a => a.id),
            completed: this.selectedAnswers.length === 3,
            allCorrect: allCorrect
        };
        
        // Broadcast answer selection
        this.broadcast({
            type: 'ANSWER_SELECTED',
            displayId: this.displayId,
            answer: answer,
            state: this.allDisplaysState[this.displayId]
        });
        
        // Check if this display completed
        if (this.selectedAnswers.length === 3) {
            this.showWaitingScreen();
            this.checkGameCompletion();
        }
    }
    
    showWaitingScreen() {
        // Show waiting overlay
        if (!this.elements.waitingOverlay) return;
        this.elements.waitingOverlay.classList.add('active');
        this.updateWaitingStatus();
    }
    
    hideWaitingScreen() {
        if (!this.elements.waitingOverlay) return;
        this.elements.waitingOverlay.classList.remove('active');
    }
    
    updateWaitingStatus() {
        if (!this.elements.waitingStatus) return;
        const completedDisplays = Object.entries(this.allDisplaysState)
            .filter(([id, state]) => state.completed)
            .map(([id]) => `Display ${id}`);
        
        const pendingDisplays = Object.entries(this.allDisplaysState)
            .filter(([id, state]) => !state.completed)
            .map(([id]) => `Display ${id}`);
        
        let statusText = '';
        if (completedDisplays.length > 0) {
            statusText += `✓ ${completedDisplays.join(', ')} done`;
        }
        if (pendingDisplays.length > 0) {
            if (statusText) statusText += '\n';
            statusText += `⏳ Waiting: ${pendingDisplays.join(', ')}`;
        }
        
        this.elements.waitingStatus.textContent = statusText;
    }
    
    checkGameCompletion() {
        // Update waiting status
        this.updateWaitingStatus();
        
        // Check if all displays have completed
        const allCompleted = Object.values(this.allDisplaysState).every(s => s.completed);
        
        if (allCompleted && !this.isPlayingResult) {
            // Hide waiting screen
            this.hideWaitingScreen();
            
            // Check if all answers across all displays are correct
            const allCorrect = Object.values(this.allDisplaysState).every(s => s.allCorrect);
            
            // Mark as playing result immediately to prevent duplicate calls
            this.isPlayingResult = true;
            
            // Play appropriate result video
            setTimeout(() => {
                this.playResultVideo(allCorrect);
            }, 1000);
        }
    }
    
    playResultVideo(success) {
        // isPlayingResult should already be set by checkGameCompletion
        // but ensure it's set here as a fallback
        this.isPlayingResult = true;
        
        // Hide waiting overlay first
        this.hideWaitingScreen();
        
        // Show result layer
        this.elements.interactiveLayer.classList.add('hidden');
        this.elements.resultLayer.classList.remove('hidden');
        
        // Set video source
        const videoPath = success ? GAME_CONFIG.videos.success : GAME_CONFIG.videos.failure;
        this.elements.resultVideoSource.src = videoPath;
        this.elements.resultVideo.load();
        
        // Broadcast result BEFORE playing so other displays can sync
        this.broadcast({
            type: 'GAME_RESULT',
            displayId: this.displayId,
            success: success
        });
        
        // Now play the video
        this.elements.resultVideo.play().catch(err => console.log('Result video play error:', err));
        
        // Handle video end
        this.elements.resultVideo.onended = () => {
            this.isPlayingResult = false;
            if (success) {
                // If success, just return to idle after video ends
                this.enterIdleMode();
            } else {
                // If failure, wait 10 seconds then return to idle
                setTimeout(() => {
                    this.enterIdleMode();
                }, GAME_CONFIG.timing.resultVideoDelay);
            }
        };
    }
    
    setupWebSocket() {
        if (typeof WebSocket === 'undefined') {
            console.warn('WebSocket not supported in this browser');
            return;
        }
        if (this.socket && (this.socket.readyState === WebSocket.OPEN || this.socket.readyState === WebSocket.CONNECTING)) {
            return;
        }
        const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
        const endpoint = `${protocol}://${window.location.host}`;
        try {
            this.socket = new WebSocket(endpoint);
        } catch (err) {
            console.warn('WebSocket initialization failed', err);
            this.scheduleReconnect();
            return;
        }
        this.socket.addEventListener('open', () => {
            if (this.reconnectTimer) {
                clearTimeout(this.reconnectTimer);
                this.reconnectTimer = null;
            }
            console.log('WebSocket connected');
            while (this.pendingMessages.length) {
                const queuedMessage = this.pendingMessages.shift();
                this.socket.send(JSON.stringify(queuedMessage));
            }
        });
        this.socket.addEventListener('message', (event) => {
            try {
                const data = JSON.parse(event.data);
                this.handleIncomingMessage(data);
            } catch (err) {
                console.warn('Invalid WebSocket payload received', err);
            }
        });
        this.socket.addEventListener('close', () => {
            this.scheduleReconnect();
        });
        this.socket.addEventListener('error', () => {
            if (this.socket && this.socket.readyState !== WebSocket.CLOSED) {
                this.socket.close();
            }
        });
    }

    scheduleReconnect() {
        if (this.reconnectTimer) return;
        this.reconnectTimer = setTimeout(() => {
            this.reconnectTimer = null;
            this.setupWebSocket();
        }, 2000);
    }

    broadcast(message) {
        const payload = { ...message, senderId: this.clientId };
        if (this.channel) {
            this.channel.postMessage(payload);
        }
        if (this.socket && this.socket.readyState === WebSocket.OPEN) {
            this.socket.send(JSON.stringify(payload));
        } else if (this.socket) {
            this.pendingMessages.push(payload);
            if (this.pendingMessages.length > 50) {
                this.pendingMessages.shift();
            }
        }
    }
    
    handleIncomingMessage(message) {
        if (!message) return;
        if (message.senderId && message.senderId === this.clientId) return;
        
        switch (message.type) {
            case 'DISPLAY_READY':
                console.log(`Display ${message.displayId} is ready`);
                break;
                
            case 'ENTER_IDLE':
                // Another display entered idle mode - reset their state in our tracking
                if (message.displayId !== this.displayId) {
                    this.allDisplaysState[message.displayId] = {
                        answers: [],
                        completed: false,
                        allCorrect: false
                    };
                    this.elements.idleVideo.currentTime = 0;
                }
                break;
                
            case 'EXIT_IDLE':
                // Another display exited idle
                // You could sync behavior here if needed
                break;
                
            case 'ANSWER_SELECTED':
                // Update other display's state
                if (message.displayId !== this.displayId) {
                    this.allDisplaysState[message.displayId] = message.state;
                    console.log('Updated state for display', message.displayId, message.state);
                    console.log('All states:', JSON.stringify(this.allDisplaysState));
                    
                    // Update waiting status if we're on waiting screen
                    this.updateWaitingStatus();
                    
                    // Check if game is complete from this display's perspective
                    if (this.allDisplaysState[this.displayId].completed) {
                        this.checkGameCompletion();
                    }
                }
                break;
                
            case 'GAME_RESULT':
                // Sync result video across displays
                // Skip if this display already triggered the result (to avoid double-play)
                if (this.displayId && !this.isPlayingResult) {
                    // Set flag immediately to prevent race conditions
                    this.isPlayingResult = true;
                    
                    // Hide waiting overlay first
                    this.hideWaitingScreen();
                    
                    // Hide interactive, show result
                    this.elements.interactiveLayer.classList.add('hidden');
                    this.elements.resultLayer.classList.remove('hidden');
                    
                    const videoPath = message.success ? 
                        GAME_CONFIG.videos.success : 
                        GAME_CONFIG.videos.failure;
                    
                    this.elements.resultVideoSource.src = videoPath;
                    this.elements.resultVideo.load();
                    this.elements.resultVideo.play().catch(err => console.log('Sync play error:', err));
                    
                    this.elements.resultVideo.onended = () => {
                        this.isPlayingResult = false;
                        if (message.success) {
                            this.enterIdleMode();
                        } else {
                            setTimeout(() => {
                                this.enterIdleMode();
                            }, GAME_CONFIG.timing.resultVideoDelay);
                        }
                    };
                }
                break;
                
            case 'RESET_GAME':
                // Reset and return to idle
                this.enterIdleMode();
                break;
        }
    }
    
    // Utility to reset game from console or external trigger
    resetGame() {
        this.broadcast({ type: 'RESET_GAME' });
        this.enterIdleMode();
    }
}

// Initialize game when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.game = new MultiDisplayGame();
});
