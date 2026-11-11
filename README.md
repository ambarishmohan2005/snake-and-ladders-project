# 🎲 Snake & Ladders - A Little Game I Built for Fun

> A casual, lightweight, feature-packed Snake & Ladders board game built in pure HTML5, CSS3, and Vanilla JavaScript. Runs 100% offline as an installable Progressive Web App (PWA) with zero npm dependencies, zero build steps, and zero backend.

---

## 🌟 Highlights & Features

- **🎮 Classic & Custom Gameplay:**
  - Standard 10×10 (100-square) boustrophedon board layout (alternating left-to-right / right-to-left zigzag numbering).
  - Exact 100 Goal rule with overshoot bounce-back (e.g., rolling a 5 when on square 97 moves to 100 then bounces back to 98).
  - Rolls of 6 earn an immediate bonus turn.
  - Multi-finisher tournament rankings (1st, 2nd, 3rd places with medals; game continues until all or all-but-one finish).

- **🐍 Procedural Snakes & Ladders Board Generator:**
  - Choose between 6, 7, or 8 pairs of snakes and ladders (both counts always remain equal).
  - **Procedural Board Randomizer:** Generate mathematically sound random boards with one click.
  - Smart placement guarantees: no snake or ladder on square 1 or 100, jump distances bounded between 10 and 60 squares, no cyclical loops, and no start/end coordinate collisions.
  - Live preview modal lets you inspect and regenerate random layouts before starting the match.

- **🎨 Dynamic SVG Graphics & Animations:**
  - Fully dynamic SVG overlay with smooth Bézier curves, animated tongues, expressive eyes, and patterned scales for snakes.
  - Dual-rail ladders with realistic perspective rungs.
  - Highlighting pulse rings on ladder feet and snake mouths for instant visual clarity.

- **👥 Humans & Autonomous AI Robots:**
  - 2 to 6 players in any combination of human and computer-controlled players.
  - Configurable AI robot personalities with realistic rolling delays and automated turn management.
  - 8 distinct player peg color palettes with custom color pickers and token icons.

- **🎲 3D Animated Dice & Anti-Cheat Dragging:**
  - Interactive 3D CSS cube dice with rolling physics and authentic dot/pip faces.
  - **Anti-Cheat Drag-and-Drop:** Players can optionally drag their peg directly to the board. An intelligent validator enforces that pegs can only be placed on the exact rolled destination square, snapping back to origin if an illegal move is attempted.

- **📊 Live Players Status & Analytics Table:**
  - Real-time tournament leaderboard tracking rankings, current square, distance to goal, snakes bitten, ladders climbed, number of sixes rolled, and total turns taken.

- **📱 Mobile Responsive & Accessibility:**
  - Board Zoom Stepper (50% to 150%) with one-click 1:1 reset.
  - **Peg-Focused Auto-Tracking:** Automatically smooth-scrolls and centers the active player's peg on mobile viewports.
  - Dark Mode and Light Mode with persistent theme memory.
  - Keyboard accessible controls and full ARIA labeling.

- **⚡ 100% Offline Progressive Web App (PWA):**
  - Installable directly to Windows, macOS, Android, and iOS home screens.
  - Complete W3C Web App Manifest with adaptive maskable icons.
  - Bulletproof Service Worker (`v12`) with Cache-First strategy and self-healing emergency fallback. Works with or without active web servers.
  - **LocalStorage State Persistence:** Auto-saves board layouts, turn orders, player positions, rankings, zoom levels, and commentary logs so refreshing never loses your game.

---

## 📁 Project Architecture & File Structure

This project was intentionally engineered with **zero build tools, zero bundlers, and zero external packages**. Every line of code runs natively in all modern web browsers.

```
snake-and-ladders-project/
├── index.html            # Main semantic HTML5 markup, UI layout & modals
├── style.css             # Responsive styling, CSS variables, dark/light theme, 3D dice animations
├── script.js             # Core game engine, board generation, procedural SVG, AI, state persistence
├── service-worker.js     # Cache-First PWA Service Worker (v12) with self-healing offline engine
├── manifest.json         # W3C Web App Manifest for mobile/desktop PWA installation
├── icons/                # High-resolution vector and raster app icons
│   ├── icon.svg          # Master scalable vector game icon
│   ├── icon-192.png      # Standard 192×192 PNG icon
│   ├── icon-512.png      # Standard 512×512 PNG icon
│   ├── icon-maskable-192.png # Android adaptive maskable 192×192 icon
│   └── icon-maskable-512.png # Android adaptive maskable 512×512 icon
├── README.md             # Comprehensive project documentation & deployment guide
└── Project Prompt.txt    # Original 11-phase engineering requirements specification
```

---

## 🚀 Running Locally

Because this project is built entirely with standard web technologies, there are no dependencies to install (`npm install` is not required).

### Option 1: VS Code Live Server / Live Preview (Recommended)
1. Open the project folder in **VS Code**.
2. Right-click [`index.html`](file:///c:/Users/mohan/OneDrive/Desktop/snake-and-ladders-project/index.html) and select **Open with Live Server** (or open via the **Live Preview** extension).
3. The game will launch in your browser at `http://localhost:5500/` or an assigned local port.

### Option 2: Python Built-in HTTP Server
If you have Python installed, open PowerShell or terminal in the project directory and run:
```bash
python -m http.server 8080
```
Then visit `http://localhost:8080` in your web browser.

### Option 3: Node.js Built-in HTTP Server
Without installing any global packages:
```bash
npx serve .
```

> **Note on PWA Service Workers:** Service Workers require a secure origin (`http://localhost` or `https://`). Running via any of the local web servers above allows full PWA installation and offline caching.

---

## 🌐 Deploying to GitHub Pages (Free & 1-Click)

This project uses relative paths (`./`) throughout all asset references, manifests, and Service Worker registration, making it 100% compatible with GitHub Pages sub-directories.

### Step-by-Step Deployment:
1. **Initialize Git & Commit:**
   ```bash
   git init
   git add .
   git commit -m "Initial commit - Complete Snake and Ladders PWA"
   ```
2. **Push to GitHub:**
   ```bash
   git branch -M main
   git remote add origin https://github.com/<your-username>/<your-repo-name>.git
   git push -u origin main
   ```
3. **Enable GitHub Pages:**
   - In your GitHub repository, navigate to **Settings** &rarr; **Pages** (under the "Code and automation" sidebar).
   - Under **Build and deployment &rarr; Source**, select **Deploy from a branch**.
   - Under **Branch**, choose `main` and folder `/ (root)`, then click **Save**.
4. **Play Your Live Game:**
   - Within 1–2 minutes, GitHub will publish your site to:
     `https://<your-username>.github.io/<your-repo-name>/`
   - Open that URL on your phone or desktop browser, click **Install App**, and play completely offline anywhere!

---

## 📸 Screenshots & Gameplay Tour

*(Add your captured screenshots into this section or link to demo media)*

### 1. Board & Live Tournament View
The classic 10×10 boustrophedon board rendered with procedural SVG snakes, dual-rail ladders, and animated player pegs.
> `![Board View](screenshots/board-view.png)`

### 2. Random Layout Generator Modal
Customize equal counts of snakes and ladders (6 to 8) and instantly preview randomized layouts before starting the match.
> `![Board Generator Preview](screenshots/board-generator.png)`

### 3. Live Players Status Table & Leaderboard
Track every player's statistics in real-time, including distance-to-goal, ladders climbed, snakes encountered, and sixes rolled.
> `![Players Status](screenshots/players-status.png)`

### 4. PWA Offline Installation & Dark Mode
Seamless dark/light mode toggle and one-click desktop/mobile app installation.
> `![PWA Dark Mode](screenshots/pwa-dark-mode.png)`

---

## 🛠️ Technology Stack & Design Decisions

| Category | Choice | Rationale |
| :--- | :--- | :--- |
| **Markup** | HTML5 Semantic Elements | Clean structure, zero overhead, screen-reader accessible. |
| **Styling** | CSS3 (Custom Variables, Flexbox, Grid, 3D Transforms) | Hardware-accelerated 3D dice rolls, smooth transitions, responsive mobile layouts, light/dark theming. |
| **Logic** | Vanilla ES6+ JavaScript | Zero external frameworks; procedural board layout algorithm; collision detection; modular state machines. |
| **Graphics** | Dynamic SVG DOM Injection | Sharp vector rendering on all screen densities without raster pixelation. |
| **Offline** | W3C Service Worker API (v12) | Self-healing cache-first strategy with network revalidation and reliable navigation fallbacks. |
| **Persistence** | Browser `localStorage` | Seamless state auto-saving and restoration across page refreshes and device reboots. |

---

## 📄 License

This project is open-source and free for educational, personal, and hobby use under the [MIT License](LICENSE).
Feel free to fork, customize, and build upon it!
