# Multi-Display Quiz Game

A synchronized 3-display interactive quiz game for portrait displays (1080×1920).

## Project Structure

```
game/
├── index.html          # Main HTML file
├── css/
│   └── styles.css      # All game styles
├── js/
│   ├── config.js       # Game configuration (images, answers, videos)
│   └── game.js         # Main game logic
└── assets/
    ├── videos/
    │   ├── idle.mp4    # Idle/attract loop video (ADD YOUR VIDEO)
    │   ├── success.mp4 # Win video - all 9 correct (ADD YOUR VIDEO)
    │   └── failure.mp4 # Lose video - any wrong (ADD YOUR VIDEO)
    └── images/
        ├── display1.jpg # Image for display 1 (ADD YOUR IMAGE)
        ├── display2.jpg # Image for display 2 (ADD YOUR IMAGE)
        └── display3.jpg # Image for display 3 (ADD YOUR IMAGE)
```

## How to Use

### 1. Add Your Assets

Replace placeholder paths in `js/config.js` with your actual files:

**Videos** (place in `assets/videos/`):
- `idle.mp4` - Looping attract video shown when idle
- `success.mp4` - Victory video when all 9 answers are correct
- `failure.mp4` - Failure video when any answer is wrong

**Images** (place in `assets/images/`):
- `display1.jpg` - Image shown on Display 1
- `display2.jpg` - Image shown on Display 2
- `display3.jpg` - Image shown on Display 3

### 2. Configure Questions & Answers

Edit `js/config.js` to set your custom content:

```javascript
displays: {
    1: {
        image: 'assets/images/your-image.jpg',
        title: 'Your Question Title',
        answers: [
            { id: 'a1', text: 'Answer Text', correct: true },
            // ... 6 answers total, 3 must be correct
        ],
        correctAnswers: ['a1', 'a3', 'a5']  // IDs of correct answers
    },
    // ... repeat for displays 2 and 3
}
```

### 3. Run the Game

**Start the Node.js server:**
```bash
cd e:\game
node server.js
```

Open 3 browser tabs to `http://localhost:8080`

**Alternative: VS Code Live Server**
Install "Live Server" extension, right-click `index.html` → "Open with Live Server"

### 4. Setup Each Display

1. Open the game URL in 3 separate browser windows/tabs
2. Click "Display 1" on the first screen, "Display 2" on second, "Display 3" on third
3. Each display shows the idle video loop
4. Touch any display to start that display's quiz

## Game Flow

```
┌─────────────────────────────────────────────────────────────┐
│                    DISPLAY SELECTOR                          │
│     [Display 1]    [Display 2]    [Display 3]               │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│                      IDLE MODE                               │
│              (Synced video loop on all displays)            │
│                   "Touch to Start"                          │
└─────────────────────────────────────────────────────────────┘
                           ↓ (touch any display)
┌─────────────────────────────────────────────────────────────┐
│                   INTERACTIVE MODE                           │
│    ┌──────────┐   ┌──────────┐   ┌──────────┐              │
│    │ Display 1│   │ Display 2│   │ Display 3│              │
│    │  Image   │   │  Image   │   │  Image   │              │
│    │  Title   │   │  Title   │   │  Title   │              │
│    │ 6 Btns   │   │ 6 Btns   │   │ 6 Btns   │              │
│    │ 3 Slots  │   │ 3 Slots  │   │ 3 Slots  │              │
│    └──────────┘   └──────────┘   └──────────┘              │
│                                                              │
│    Select 3 answers per display (9 total)                   │
│    Slots glow: GREEN = correct, RED = incorrect             │
└─────────────────────────────────────────────────────────────┘
                           ↓ (all 9 selected)
┌─────────────────────────────────────────────────────────────┐
│                     RESULT VIDEO                             │
│                                                              │
│   All 9 correct → success.mp4 → return to idle             │
│   Any wrong → failure.mp4 → wait 10s → return to idle      │
└─────────────────────────────────────────────────────────────┘
```

## Browser Requirements

- Modern browser with BroadcastChannel API support (Chrome, Firefox, Edge, Safari 15.4+)
- All 3 displays must be in the same browser (same origin)
- For multiple devices, you'd need a WebSocket server instead

## Keyboard Shortcuts (for testing)

Open browser console and use:
```javascript
game.resetGame()  // Reset all displays to idle
```

## Tips

- Use portrait-oriented videos (1080×1920) for best results
- Test on actual touch screens for accurate touch behavior
- Videos should be optimized for web playback (H.264 MP4)
