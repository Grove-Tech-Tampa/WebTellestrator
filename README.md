# 🎨 Telestrator — Web-Based Telestration Application

A high-performance, low-latency, web-based real-time telestration application designed for live presentations, sermon illustrations, and broadcast environments.

An iPad on stage serves as the **Presenter** interface for drawing over sermon slides or images. A remote computer (Mac/PC) joins as a **Viewer** in a browser tab to feed the clean output canvas directly into **ProPresenter** (via Syphon, NDI Screen Capture, or Window Capture) for projection onto auditorium screens.

---

## 🌟 Key Features

- **⚡ Near-Zero-Lag Sync**: Real-time vector stroke synchronization over WebSocket (<10ms latency on local WiFi).
- **📱 Apple Pencil & iPad Optimized**:
  - 240Hz ProMotion coalesced events for silky-smooth curves.
  - Pressure sensitivity & tilt telemetry support.
  - Palm rejection & Apple Pencil hover protection.
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
- **🔐 PIN Session System**:
  - Simple PIN-based presentation room creation. Presenter and Viewer join using the same numeric PIN.
- **🖥️ Chrome-Less Viewer Output**:
  - Pure, full-viewport canvas mirror with no toolbars or UI elements — ready for Syphon / NDI capture into ProPresenter.

---

## 📋 System Requirements & Prerequisites

1. **Host Machine (Server)**:
   - **Node.js**: LTS version (v18.x, v20.x, or v22.x recommended).
   - **Operating System**: macOS, Windows 10/11, or Linux.
2. **Presenter Device (Stage)**:
   - Apple iPad running Safari (iPadOS 14+) with Apple Pencil or finger touch.
3. **Viewer Device (Production Booth)**:
   - Mac or PC running ProPresenter 7 with Google Chrome or Safari.
4. **Network**:
   - Local Area Network (Wi-Fi or Ethernet) connecting the iPad and the ProPresenter computer.

---

## 🚀 Quick Start Guide

### 1. Installation

Clone or extract the project files into your workspace directory:

```bash
cd TellestratorDev
npm install
```

### 2. Launch the Server

Start the Telestrator backend server:

```bash
npm start
```

The server output will log your local IP address:

```text
Server listening on port 3000
Local Network IPs:
  http://192.168.1.50:3000
```

---

## 📖 Usage & Workflow

### 1. Host Landing Page
Navigate to `http://localhost:3000` (or `http://<your-ip>:3000` from any device on your local network).
- Enter a 4-to-6 digit numeric **PIN** (e.g. `3661`).
- Click **Present** on the iPad, or click **View** on the ProPresenter computer.

---

### 2. Presenter Mode (iPad on Stage)
URL: `http://<server-ip>:3000/presenter.html?pin=3661`

1. **Open Library**: Tap the **📚 Library** icon on the bottom floating dock to slide out the collection manager.
2. **Upload & Select Slides**: Create a collection (e.g., *"Sunday Sermon"*), drop in photos, and tap a thumbnail to display it.
3. **Draw & Annotate**:
   - Select tools: Pen ✒️, Pencil ✏️, Marker 🖍️, Brush 🖌️, Eraser 🧽, or Stamps ⬡.
   - Tap **`🔄#1`** in the stamp picker to reset numbered markers back to `1`.
   - Adjust stroke size and opacity via the floating dock sliders.
4. **Navigate Slides**: Tap the **‹ Previous** / **Next ➔** edge buttons, or swipe left/right with 2 fingers anywhere on screen.
5. **iPad Input Settings (⚙️)**: Tap the Settings Gear to enable or disable Finger Touch Drawing vs. Apple Pencil Stylus input independently.

---

### 3. Viewer Mode & ProPresenter Integration (BOOTH)
URL: `http://<server-ip>:3000/viewer.html?pin=3661`

1. Open `http://localhost:3000/viewer.html?pin=3661` in Safari or Chrome on the ProPresenter Mac.
2. The viewer automatically connects and displays a clean, chrome-less video output of the background image and annotations.

#### 🎥 Bringing Output into ProPresenter 7:

- **Method A: Syphon / Screen Capture Utility (macOS — Zero Latency)**
  1. Use **Syphoner** or **ScreenCaptureSyphon** on macOS to capture the browser window containing `viewer.html` and publish it as a Syphon source.
  2. Open ProPresenter 7 ➔ **Settings** ➔ **Inputs** ➔ Add a new **Video Input** ➔ Select **Syphon**.
  3. Trigger the Video Input on your presentation slides or Props layer.

- **Method B: NDI Tools (macOS / Windows)**
  1. Open **NDI Screen Capture** (from NDI Tools) on the computer running the browser viewer window.
  2. Select the browser window as an NDI source.
  3. In ProPresenter 7 ➔ **Settings** ➔ **Inputs** ➔ Add **Video Input** ➔ Select **NDI**.

---

## 📁 File Structure Overview

```
TellestratorDev/
├── package.json                   # Project dependencies & scripts
├── README.md                      # Project documentation
├── server/
│   ├── index.js                   # Express HTTP & Socket.IO server entry
│   ├── routes/
│   │   ├── api.js                 # REST API for collections, reordering & favorites
│   │   └── upload.js              # Image file upload handler (Multer)
│   └── services/
│       ├── socketService.js       # Real-time WebSocket session relaying & state storage
│       └── collectionService.js   # Disk JSON storage for collections & favorites
└── public/
    ├── index.html                 # App landing page & mode selector
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
        │   ├── BrushEngine.js     # 5 brush rendering algorithms
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
