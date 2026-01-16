# TODO - Automatic Game Handling System

## Completed ✅
- [x] Create `lib/gameHandler.js` - Centralized game management system
- [x] Update `command/game/caklontong.js` - Use game handler format
- [x] Update `command/game/asahotak.js` - Use game handler format
- [x] Update `index.js` - Simplified game handling with generic handler
- [x] Add `command/game/tebaktebakan.js` - New sample game for demonstration

## How to Add New Games
1. Create a new file in `command/game/` folder (e.g., `mygame.js`)
2. Export an object with:
   - `name`: Unique identifier (filename without .js)
   - `displayName`: Shown in messages
   - `reward`: Text describing the reward
   - `maxWrongAttempts`: Max wrong answers (default: 3)
   - `start`: Function to fetch question and create session
   - `onWin`: (optional) Custom win handler
   - `onLose`: (optional) Custom lose handler

## Example Game Template
```javascript
module.exports = {
  name: "mygame",
  displayName: "My Game",
  reward: "EXP +100",
  maxWrongAttempts: 3,

  start: async (ctx) => {
    // Fetch question from API
    // Send question message
    // Set global.gameSession
  },

  onWin: async (ctx, session) => {
    // Add rewards
  },

  onLose: async (ctx, session) => {
    // Custom lose message
  }
};
```

## Benefits
- No need to modify `index.js` when adding new games
- Each game can have custom win/lose behavior
- Generic answer checking handles all games automatically
- Easy to maintain and extend

