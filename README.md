# 🎵 Spotify First Copy

A premium, fully functional Spotify-inspired music streaming web app with real-time song search and playback powered by the **JioSaavn API**. Features a secure authentication system, interactive media player, and stunning UI/UX with micro-animations.

![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=for-the-badge&logo=html5&logoColor=white)
![CSS3](https://img.shields.io/badge/CSS3-1572B6?style=for-the-badge&logo=css3&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)
![JioSaavn](https://img.shields.io/badge/JioSaavn_API-2BC5B4?style=for-the-badge&logo=music&logoColor=white)

---

## ✨ Features

### 🔐 Authentication
- Secure login with session management (`sessionStorage`)
- Password visibility toggle
- Animated error handling with shake effects
- Loading spinner on login
- Default credentials: `vishal` / `12345`

### 🔍 Live Search
- Real-time song search powered by JioSaavn API
- Debounced input (400ms) for optimal performance
- Search results with album art and highlighted matching text
- Keyboard shortcuts: `Ctrl+K` or `/` to focus, `Escape` to close, `Enter` to play
- **Recent Searches** — last 10 played songs saved to `localStorage` and shown on focus

### 🎶 Audio Player
- Real audio streaming from JioSaavn CDN (160kbps)
- Full playback controls: Play/Pause, Next, Previous
- Seekable progress bar with drag support
- Live time tracking (current / total duration)
- **Shuffle mode** — randomized next track
- **Repeat mode** — loops current track
- Auto-advance to next song on track end

### 🔊 Volume Control
- Adjustable volume slider with drag support
- Mute/unmute toggle with smart icon switching (🔊 🔉 🔇)
- Volume level remembered on unmute

### 🎨 UI/UX & Animations
- **Dark theme** inspired by Spotify's premium aesthetic
- **Mouse-tracking glow** — radial green gradient follows cursor on music cards
- **Click star burst** — colorful star particles scatter on every click (✦ ★ ✧)
- **Glowing borders** — green border glow on hover for cards, badges, buttons
- **Lift & scale** — cards float up with spring animations on hover
- **Staggered entrance** — cards fade in one-by-one using IntersectionObserver
- **Player bar pulse** — now-playing album art glows when music is playing
- **Search result slide** — green left-border slides in on hover
- **Glassmorphism** login screen with animated gradient background
- Fully responsive design (desktop, tablet, mobile)

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Structure | HTML5 (Semantic) |
| Styling | Vanilla CSS (Custom Properties, Grid, Flexbox) |
| Logic | Vanilla JavaScript (ES6+, IIFE pattern) |
| Music API | [JioSaavn API](https://github.com/sumitkolhe/jiosaavn-api) (self-hosted) |
| Fonts | [Inter](https://fonts.google.com/specimen/Inter) via Google Fonts |

---

## 🚀 Getting Started

### Prerequisites
- **Node.js** v20+ installed
- **Git** installed

### 1. Clone the repository

```bash
git clone https://github.com/vishal1237451/spotifyclone.git
cd spotifyclone
```

### 2. Set up the JioSaavn API (required for song search & playback)

```bash
cd jiosaavn-api
npm install --legacy-peer-deps
npx tsc && npx tsc-alias
node start.mjs
```

The API server will start at `http://localhost:3000`.

### 3. Serve the frontend

Open a **new terminal** and run:

```bash
npx -y http-server . -p 8080 -c-1
```

### 4. Open in browser

Navigate to **http://localhost:8080** and login with:

| Username | Password |
|----------|----------|
| `vishal` | `12345` |
| `user` | `password` |

---

## 📁 Project Structure

```
spotifyclone/
├── index.html          # Main HTML structure
├── index.css           # Complete design system & animations
├── app.js              # Application logic, player, search, auth
├── README.md           # This file
└── jiosaavn-api/       # Self-hosted JioSaavn API
    ├── start.mjs       # Node.js server entry point
    ├── src/            # API source code (TypeScript)
    ├── dist/           # Compiled JS output
    └── package.json    # API dependencies
```

---

## ⌨️ Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Space` | Play / Pause |
| `Ctrl + K` | Focus search bar |
| `/` | Focus search bar |
| `Escape` | Close search |
| `Enter` | Play first search result |

---

## 📸 Screenshots

### Login Screen
> Premium glassmorphism design with animated gradient background

### Home Page
> Real Bollywood songs with album art, quick-play cards, and trending sections

### Search
> Live search with JioSaavn integration, album art, and highlighted matches

### Now Playing
> Full player bar with progress tracking, volume control, and glowing album art

---

## 🙏 Credits

- **[JioSaavn API](https://github.com/sumitkolhe/jiosaavn-api)** by Sumit Kolhe — Unofficial API for song data & streaming
- **[Inter Font](https://fonts.google.com/specimen/Inter)** — Clean, modern typography
- **Spotify** — Design inspiration

---

## 📄 License

This project is for **educational purposes only**. It is not affiliated with or endorsed by Spotify or JioSaavn.

---

<p align="center">
  Made with ❤️ by <a href="https://github.com/vishal1237451">Vishal</a>
</p>
