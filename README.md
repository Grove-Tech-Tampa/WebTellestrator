# 🎨 Telestrator — Web-Based Telestration Application

A high-performance, low-latency, web-based real-time telestration application designed for live presentations, sermon illustrations, and broadcast environments.

An iPad on stage serves as the **Presenter** interface for drawing over sermon slides or images. ProPresenter 7 displays the live annotations natively by embedding the **Viewer URL** directly as a **Web Element** on any slide — no Syphon or external capture software required!

---

## 🌟 Key Features

- **⚡ Near-Zero-Lag Sync**: Real-time vector stroke synchronization over WebSocket (<10ms latency on local WiFi).
- **🎭 Native ProPresenter 7 Integration**: Add the Viewer URL (`http://<server-ip>:3000/viewer.html?pin=XXXX`) directly onto any ProPresenter slide as a Web Element.
- **📺 Registered Viewer Target Computers**: Register persistent viewer machines (e.g., *"Spurgeon"* PIN `1001`, *"Whitfield"* PIN `1002`). Presenters can launch directly with one tap on stage without typing PINs. Includes live green **Online** / **Offline** status indicators.
- **📱 Apple Pencil & iPad Optimized**:
  - 240Hz ProMotion coalesced events for silky-smooth curves.
  - Variable pressure sensitivity & constant pen size toggle.
  - Palm rejection & gesture callout/selection suppression.
  - iPad input toggles: Enable/Disable Finger Drawing or Stylus input independently in settings.
- **🎨 Complete Telestration Tools**:
  - **5 Drawing Instruments**: Pen (✒️), Pencil (✏️), Marker (🖍️), Brush (🖌️), and Eraser (🧽).
  - **Stamps**: Vector shapes (circle ◯, rectangle ⬜, star ⭐, arrow ➔, checkmark ✓, x-mark ✗) + Auto-incrementing Numbered Markers (1️⃣, 2️⃣, 3️⃣…) with a quick **`🔄#1`** counter reset.
  - **Color Picker**: 12 preset projection-optimized colors + HSL wheel + opacity sliders.
- **📁 Image Collections & Drag-and-Drop Management**:
  - Create and manage sermon image collections.
  - Drag-and-drop batch photo uploads (PNG, JPG, SVG, WebP, GIF up to 20MB).
  - Drag-and-drop thumbnail reordering.
  - Individual photo deletion and full collection deletion.
- **🖼️ Per-Slide Annotation Persistence**:
  - Drawings are automatically saved per slide. Navigating away from an image preserves its annotations; navigating back restores them seamlessly on both Presenter and Viewer screens.
- **👆 Mobile & iPad Gesture Navigation**:
  - Next/Previous slide buttons or 2-finger / screen-edge swipe gestures.
- **🐳 Containerized & Full CI/CD**:
  - Ready for Docker & Proxmox LXC/VM deployment with persistent storage volumes.
  - Full GitHub Actions CI/CD pipeline automated on PR merge to `main`.

---

## 📋 System Requirements & Prerequisites

1. **Host Machine (Server)**:
   - **Docker / Proxmox VE** (or Node.js v18+ LTS).
2. **Presenter Device (Stage)**:
   - Apple iPad running Safari (iPadOS 14+) with Apple Pencil or finger touch.
3. **Viewer / Production Display**:
   - ProPresenter 7 (macOS or Windows) on production computer(s).
4. **Network**:
   - Local Area Network (Wi-Fi or Ethernet) connecting the iPad and production computers.

---

## 🚀 Deployment Options

### Option A: Local Node.js Development

```bash
# Clone repository
git clone https://github.com/Grove-Tech-Tampa/WebTellestrator.git
cd WebTellestrator

# Install dependencies and start
npm install
npm start
```

---

### Option B: Docker & Docker Compose (Proxmox VE / Server)

Run directly on your Proxmox server or Docker host:

```bash
# Build and launch with volume persistence
docker compose up -d
```

Or using standard Docker CLI:

```bash
# Create persistent storage volumes
docker volume create telestrator-data
docker volume create telestrator-uploads

# Run container
docker run -d \
  --name telestrator \
  --restart unless-stopped \
  -p 3000:3000 \
  -v telestrator-data:/app/server/data \
  -v telestrator-uploads:/app/public/uploads \
  ghcr.io/grove-tech-tampa/webtellestrator:latest
```

---

## 🔄 Automated CI/CD Pipeline (GitHub Actions)

This repository includes a full CI/CD pipeline configured in `.github/workflows/deploy.yml`:

### CI/CD Workflow Steps:
1. **On PR Merge to `main`**:
   - **Validate**: Checks code syntax and verifies server entry point.
   - **Build & Push**: Builds production Docker image and publishes it to GitHub Container Registry (`ghcr.io/grove-tech-tampa/webtellestrator:latest`).
   - **Deploy**: Connects via SSH to your Proxmox Docker server, pulls the new container image, gracefully recreates the container, and prunes unused images.

### Required GitHub Repository Secrets:

To enable automated deployment to your Proxmox server, add the following under **GitHub Repository ➔ Settings ➔ Secrets and variables ➔ Actions**:

| Secret Name | Description | Example |
| :--- | :--- | :--- |
| `PROXMOX_HOST` | IP address or hostname of Proxmox server | `192.168.1.100` |
| `PROXMOX_USER` | SSH username on Proxmox server | `root` or `deploy` |
| `PROXMOX_SSH_KEY` | Private SSH key for authentication | `-----BEGIN OPENSSH PRIVATE KEY-----...` |
| `PROXMOX_PORT` | *(Optional)* SSH port (default `22`) | `22` |
| `PROXMOX_DEPLOY_PATH` | *(Optional)* Target directory on Proxmox | `/opt/telestrator` |

---

## 📖 Usage & Workflow

### 1. Host Landing Page
Navigate to `http://localhost:3000` (or `http://<server-ip>:3000`).
- **One-Tap Target Selection**: Tap **Present on Spurgeon** or **Present on Whitfield** to launch directly for that production machine.
- **Custom Session PIN**: Enter any custom PIN to create a temporary presentation room.

---

### 2. Presenter Mode (iPad on Stage)
URL: `http://<server-ip>:3000/presenter.html?pin=1001`

1. **Open Library**: Tap **📚 Library** on the bottom dock to open collections.
2. **Upload & Select Slides**: Drop in sermon graphics and tap a slide thumbnail.
3. **Draw & Annotate**:
   - Select tools: Pen ✒️, Pencil ✏️, Marker 🖍️, Brush 🖌️, Eraser 🧽, or Stamps ⬡.
   - Tap **`🔄#1`** in the stamp picker to reset numbered markers back to `1`.
4. **Navigate Slides**: Tap navigation arrows or swipe left/right with 2 fingers anywhere on screen.
5. **Settings (⚙️)**: Toggle Finger Drawing, Apple Pencil Input, or Pencil Pressure Sensitivity independently.

---

### 3. ProPresenter 7 Integration (NATIVE & DIRECT)

No Syphon or external screen capture software is needed! Embed the Viewer canvas directly into ProPresenter as a native **Web Element**.

#### 🎥 Adding Viewer as a Web Element in ProPresenter 7:

1. Open **ProPresenter 7** on your production computer.
2. Edit an existing slide or create a new slide for Telestration.
3. Click **+ Add Element** in the Slide Editor ➔ Select **Web**.
4. In the Inspector sidebar for the Web Element:
   - Set **URL** to: `http://<server-ip>:3000/viewer.html?pin=1001`
   - Adjust Web Element size to **1920 x 1080** (full 16:9 canvas).
5. Trigger the slide! ProPresenter displays the live telestrator canvas and background images natively on screen.

---

## 📁 File Structure Overview

```
WebTellestrator/
├── Dockerfile                     # Production Node.js 20 Alpine container build
├── docker-compose.yml             # Docker Compose orchestration with persistent volumes
├── .dockerignore                  # Excluded Docker build context paths
├── .github/
│   └── workflows/
│       └── deploy.yml             # Full CI/CD pipeline (Validate -> GHCR -> Proxmox SSH Deploy)
├── package.json                   # Project dependencies & scripts
├── README.md                      # Comprehensive project documentation
├── server/
│   ├── index.js                   # Express HTTP & Socket.IO server entry
│   ├── routes/
│   │   ├── api.js                 # REST API for collections, known viewers & favorites
│   │   └── upload.js              # Image file upload handler (Multer)
│   └── services/
│       ├── socketService.js       # Real-time WebSocket session relaying & state storage
│       ├── collectionService.js   # Disk JSON storage for collections & favorites
│       └── knownViewerService.js  # Registered viewer device persistence & status tracking
└── public/
    ├── index.html                 # Landing page with registered viewer target cards
    ├── presenter.html             # Full presenter interface for iPad
    ├── viewer.html                # Chrome-less viewer canvas for ProPresenter
    ├── css/
    │   ├── common.css             # Glassmorphism dark design system & UI tokens
    │   ├── presenter.css          # Floating dock, slide panel & modal styles
    │   └── viewer.css             # Clean zero-margin viewer output styles
    └── js/
        ├── shared/
        │   ├── constants.js       # Shared event names, brush configs, preset colors
        │   └── SocketClient.js    # Client-side Socket.IO wrapper & reconnect logic
        ├── canvas/
        │   ├── DrawingEngine.js   # Dual HTML5 canvas, Apple Pencil 240Hz & gesture engine
        │   ├── BrushEngine.js     # 5 brush rendering algorithms with pressure scaling
        │   ├── StampEngine.js     # Vector shape & numbered marker renderer
        │   └── CanvasHistory.js   # Per-slide snapshot undo/redo manager
        ├── presenter/
        │   ├── ToolPanel.js       # Floating dock UI controller
        │   ├── ColorPicker.js     # HSL color wheel & favorites modal
        │   ├── CollectionManager.js # Photo upload, reordering & deletion manager
        │   ├── NavigationMode.js  # Touch/swipe gesture & slide navigation engine
        │   └── PresenterApp.js    # Main presenter orchestrator
        └── viewer/
            └── ViewerApp.js       # Real-time viewer canvas replay & snapshot renderer
```

---

## 📄 License

MIT License. Designed for live church presentation and broadcast workflows.
