/**
 * Game Configuration
 * Replace placeholder paths with your actual assets
 */

const GAME_CONFIG = {
    // Video paths - replace with your actual video files
    videos: {
        idle: 'assets/videos/idle.mp4',       // Idle/attract loop video
        success: 'assets/videos/success.mp4', // Win video (all 9 answers correct)
        failure: 'assets/videos/failure.mp4'  // Lose video (any answer wrong)
    },

    // Transition images shown between questions
    transitionImages: {
        afterQuestion1: 'assets/images/ab.png',      // Shown after completing question 1
        afterQuestion2: 'assets/images/retain.png',  // Shown after completing question 2
        afterQuestion3: 'assets/images/lock.png'     // Shown after completing question 3
    },

    // Timing configuration (in milliseconds)
    timing: {
        fadeTransition: 500,      // Fade transition duration
        resultVideoDelay: 10000,  // Delay after failure video before returning to idle
        answerRevealDelay: 500,   // Delay before showing answer result
        incorrectFeedbackDuration: 1400, // Duration for wrong-answer glow fade
        imageVanishDuration: 800,  // Duration for main image to vanish
        transitionImageDisplay: 4000, // How long to show transition image before loading appears
        blurTransitionDuration: 600, // Duration for blur effect
        loadingDelayAfterTransition: 2000 // How long to keep loading visible before advancing
    },

    // Question configurations (shown sequentially on single display)
    displays: {
        1: {
            background: 'assets/images/bg.png',
            image: 'assets/images/display1.png',
            title: '',
            answers: [
                { id: 'a1', image: 'assets/images/answers/d1_a1.png', correct: true },
                { id: 'a2', image: 'assets/images/answers/d1_a2.png', correct: false },
                { id: 'a3', image: 'assets/images/answers/d1_a3.png', correct: true },
                { id: 'a4', image: 'assets/images/answers/d1_a5.png', correct: false },
                { id: 'a5', image: 'assets/images/answers/d1_a4.png', correct: true },
                { id: 'a6', image: 'assets/images/answers/d1_a6.png', correct: false }
            ],
            correctAnswers: ['a1', 'a3', 'a5']
        },
        2: {
            background: 'assets/images/bg1.png',
            image: 'assets/images/display2.png',
            title: '',
            answers: [
                { id: 'b1', image: 'assets/images/answers/d2_a1.png', correct: true },
                { id: 'b2', image: 'assets/images/answers/d2_a2.png', correct: false },
                { id: 'b3', image: 'assets/images/answers/d2_a3.png', correct: true },
                { id: 'b4', image: 'assets/images/answers/d2_a4.png', correct: true },
                { id: 'b5', image: 'assets/images/answers/d2_a5.png', correct: false },
                { id: 'b6', image: 'assets/images/answers/d2_a6.png', correct: false }
            ],
            correctAnswers: ['b1', 'b3', 'b4']
        },
        3: {
            background: 'assets/images/bg2.png',
            image: 'assets/images/display3.png',
            title: '',
            answers: [
                { id: 'c1', image: 'assets/images/answers/d3_a1.png', correct: true },
                { id: 'c2', image: 'assets/images/answers/d3_a2.png', correct: false },
                { id: 'c3', image: 'assets/images/answers/d3_a3.png', correct: true },
                { id: 'c4', image: 'assets/images/answers/d3_a4.png', correct: true },
                { id: 'c5', image: 'assets/images/answers/d3_a5.png', correct: false },
                { id: 'c6', image: 'assets/images/answers/d3_a6.png', correct: false }
            ],
            correctAnswers: ['c1', 'c3', 'c4']
        }
    }
};

// Export for module systems (optional)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = GAME_CONFIG;
}
