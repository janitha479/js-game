/**
 * Single Display Quiz Game
 * Shows 3 questions sequentially on one display
 */

class QuizGame {
    constructor() {
        this.currentQuestion = 1; // 1, 2, or 3
        this.selectedAnswers = [];
        this.allQuestionsResults = []; // Track results for all 3 questions
        this.isPlayingResult = false;
        
        // DOM Elements
        this.elements = {
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
            transitionOverlay: document.getElementById('transition-overlay'),
            transitionImage: document.getElementById('transition-image')
        };
        
        this.init();
    }
    
    init() {
        // Setup idle layer touch/click
        this.elements.idleLayer.addEventListener('click', () => this.exitIdleMode());
        this.elements.idleLayer.addEventListener('touchend', (e) => {
            e.preventDefault();
            this.exitIdleMode();
        });

        // Start in idle mode
        this.enterIdleMode();
    }
    
    enterIdleMode() {
        // Show idle layer, hide others
        this.elements.idleLayer.classList.remove('hidden');
        this.elements.interactiveLayer.classList.add('hidden');
        this.elements.resultLayer.classList.add('hidden');
        
        // Reset state
        this.currentQuestion = 1;
        this.selectedAnswers = [];
        this.allQuestionsResults = [];
        this.isPlayingResult = false;
        
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
    }
    
    exitIdleMode() {
        // Hide idle layer, show interactive
        this.elements.idleLayer.classList.add('hidden');
        this.elements.interactiveLayer.classList.remove('hidden');
        
        // Pause idle video
        this.elements.idleVideo.pause();
        
        // Start with question 1
        this.currentQuestion = 1;
        this.setupQuestionContent();
    }
    
    setupQuestionContent() {
        // Get config for current question (using display configs)
        const questionConfig = GAME_CONFIG.displays[this.currentQuestion];
        
        // Set background image for this question
        this.elements.interactiveLayer.style.backgroundImage = 
            `url('${questionConfig.background}')`;
        
        // Set main image and title
        this.elements.backgroundImage.src = questionConfig.image;
        this.elements.displayTitle.textContent = questionConfig.title;
        
        // Reset selected answers for this question
        this.selectedAnswers = [];
        
        // Hide waiting overlay
        if (this.elements.waitingOverlay) {
            this.elements.waitingOverlay.classList.remove('active');
        }
        
        // Generate answer buttons with images
        this.elements.answerButtons.innerHTML = '';
        questionConfig.answers.forEach(answer => {
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
    }
    
    selectAnswer(answer) {
        if (this.selectedAnswers.length >= 3) return;

        const alreadySelected = this.selectedAnswers.some(a => a.id === answer.id);
        const btn = document.querySelector(`[data-answer-id="${answer.id}"]`);
        if (alreadySelected) return;

        if (!answer.correct) {
            this.handleIncorrectSelection(btn);
            return;
        }

        this.selectedAnswers.push(answer);

        if (btn) btn.classList.add('selected');

        const slotIndex = this.selectedAnswers.length - 1;
        const slot = this.elements.answerSlots[slotIndex];

        if (slot) {
            const img = document.createElement('img');
            img.src = answer.image;
            img.alt = answer.id;
            slot.innerHTML = '';
            slot.appendChild(img);
            slot.classList.add('filled');

            setTimeout(() => {
                slot.classList.add('correct');
            }, GAME_CONFIG.timing.answerRevealDelay);
        }

        // Check if all 3 answers are selected for this question
        if (this.selectedAnswers.length === 3) {
            const allCorrect = this.selectedAnswers.every(a => a.correct);
            this.allQuestionsResults.push({
                question: this.currentQuestion,
                answers: this.selectedAnswers.map(a => a.id),
                allCorrect: allCorrect
            });

            // Show transition overlay then move to next question or finish
            this.showTransitionAndContinue();
        }
    }

    handleIncorrectSelection(button) {
        if (!button || button.classList.contains('incorrect')) return;
        const duration = GAME_CONFIG.timing.incorrectFeedbackDuration || 1400;
        button.classList.add('incorrect');
        setTimeout(() => {
            button.classList.remove('incorrect');
        }, duration);
    }
    
    showTransitionAndContinue() {
        // Get the transition image based on current question
        let transitionImage = null;
        if (this.currentQuestion === 1) {
            transitionImage = GAME_CONFIG.transitionImages.afterQuestion1;
        } else if (this.currentQuestion === 2) {
            transitionImage = GAME_CONFIG.transitionImages.afterQuestion2;
        } else if (this.currentQuestion === 3) {
            transitionImage = GAME_CONFIG.transitionImages.afterQuestion3;
        }

        // Step 1: Fade out the main image and answer buttons
        this.elements.backgroundImage.classList.add('vanish');
        this.elements.answerButtons.classList.add('hidden-transition');

        setTimeout(() => {
            // Step 2: Show transition image overlay in center and blur background
            this.elements.transitionImage.src = transitionImage;
            this.elements.transitionOverlay.classList.remove('hidden');
            this.elements.transitionOverlay.classList.add('active');

            // Apply blur transition timing from config
            this.elements.interactiveLayer.style.transition = `filter ${GAME_CONFIG.timing.blurTransitionDuration}ms ease`;
            this.elements.interactiveLayer.classList.add('blurred');

            // Step 3: After transition image display time, show loading
            setTimeout(() => {
                if (this.elements.waitingOverlay) {
                    this.elements.waitingOverlay.classList.add('active');
                }

                // Step 4: Keep loading for configured duration, then continue
                setTimeout(() => {
                    // Hide loading
                    if (this.elements.waitingOverlay) {
                        this.elements.waitingOverlay.classList.remove('active');
                    }

                    // Hide transition overlay
                    this.elements.transitionOverlay.classList.remove('active');
                    this.elements.transitionOverlay.classList.add('hidden');

                    // Remove blur and restore visibility
                    this.elements.interactiveLayer.classList.remove('blurred');
                    this.elements.backgroundImage.classList.remove('vanish');
                    this.elements.answerButtons.classList.remove('hidden-transition');

                    if (this.currentQuestion < 3) {
                        // Move to next question
                        this.currentQuestion++;
                        this.setupQuestionContent();
                    } else {
                        // All 3 questions completed - check overall result
                        this.checkGameCompletion();
                    }
                }, GAME_CONFIG.timing.loadingDelayAfterTransition);
            }, GAME_CONFIG.timing.transitionImageDisplay);
        }, GAME_CONFIG.timing.imageVanishDuration);
    }
    
    checkGameCompletion() {
        // Check if all answers across all 3 questions are correct
        const allCorrect = this.allQuestionsResults.every(r => r.allCorrect);
        
        // Play appropriate result video
        this.playResultVideo(allCorrect);
    }
    
    playResultVideo(success) {
        this.isPlayingResult = true;
        
        // Hide interactive, show result layer
        this.elements.interactiveLayer.classList.add('hidden');
        this.elements.resultLayer.classList.remove('hidden');
        
        // Set video source
        const videoPath = success ? GAME_CONFIG.videos.success : GAME_CONFIG.videos.failure;
        this.elements.resultVideoSource.src = videoPath;
        this.elements.resultVideo.load();
        
        // Play the video
        this.elements.resultVideo.play().catch(err => console.log('Result video play error:', err));
        
        // Handle video end
        this.elements.resultVideo.onended = () => {
            this.isPlayingResult = false;
            if (success) {
                // If success, just return to idle after video ends
                this.enterIdleMode();
            } else {
                // If failure, wait then return to idle
                setTimeout(() => {
                    this.enterIdleMode();
                }, GAME_CONFIG.timing.resultVideoDelay);
            }
        };
    }
    
    // Utility to reset game from console or external trigger
    resetGame() {
        this.enterIdleMode();
    }
}

// Initialize game when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.game = new QuizGame();
});

function waitForMediaReady(el) {
    return new Promise((resolve) => {
        if (!el) return resolve();
        if ((el.readyState ?? 0) >= 3 || el.complete) return resolve();
        const evt = el.tagName === 'VIDEO' ? 'canplaythrough' : 'load';
        const done = () => {
            el.removeEventListener(evt, done);
            resolve();
        };
        el.addEventListener(evt, done, { once: true });
        if (el.tagName === 'VIDEO') el.load();
    });
}

async function preloadQuestionAssets(question) {
    const mainImage = new Image();
    mainImage.src = question.displayImage;
    const answers = question.answers.map((ans) => {
        const img = new Image();
        img.src = ans.image;
        return waitForMediaReady(img);
    });
    await Promise.all([waitForMediaReady(mainImage), ...answers]);
    return { mainImage };
}

async function loadNextQuestion(question) {
    waitingOverlay.classList.add('active');
    const { mainImage } = await preloadQuestionAssets(question);
    displayImage.src = mainImage.src;
    renderAnswers(question.answers);
    waitingOverlay.classList.remove('active');
}

async function showResultVideo() {
    waitingOverlay.classList.add('active');
    await waitForMediaReady(resultVideo);
    interactiveLayer.classList.add('hidden');
    resultLayer.classList.remove('hidden');
    waitingOverlay.classList.remove('active');
    resultVideo.currentTime = 0;
    await resultVideo.play();
}
