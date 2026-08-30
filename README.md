# 🎨 Telestrator — Web-Based Telestration Application

A high-performance, low-latency, web-based real-time telestration application designed for live presentations, sermon illustrations, and broadcast environments.

An iPad on stage serves as the **Presenter** interface for drawing over sermon slides or images. ProPresenter 7 displays the live annotations natively by embedding the **Viewer URL** directly as a **Web Element** on any slide — no Syphon or external capture software required!

---

## 🌟 Key Features

- **⚡ Near-Zero-Lag Sync**: Real-time vector stroke synchronization over WebSocket (<10ms latency on local WiFi).
- **🎭 Native ProPresenter 7 Integration**: Add the Viewer URL (`http://<server-ip>:3000/viewer.html?pin=XXXX`) directly onto any ProPresenter slide as a Web Element.
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
  - Pure, full-viewport canvas mirror with no toolbars or UI elements — optimized for ProPresenter Web Objects or NDI streams.

---

## 📋 System Requirements & Prerequisites

1. **Host Machine (Server)**:
   - **Node.js**: LTS version (v18.x, v20.x, or v22.x recommended).
   - **Operating System**: macOS, Windows 10/11, or Linux.
2. **Presenter Device (Stage)**:
   - Apple iPad running Safari (iPadOS 14+) with Apple Pencil or finger touch.
3. **Viewer / Production Display**:
   - ProPresenter 7 (macOS or Windows) on the production computer.
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
- Click **Present** on the iPad, or click **View** on the production computer.

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

### 3. ProPresenter 7 Integration (NATIVE & DIRECT)

No Syphon or external screen capture software is needed! You can embed the Viewer canvas directly into ProPresenter as a native **Web Element**.

#### 🎥 Adding Viewer as a Web Element in ProPresenter 7:

1. Open **ProPresenter 7** on your production computer.
2. Edit an existing slide or create a new slide/presentation for Telestration.
3. Click **+ Add Element** in the Slide Editor ➔ Select **Web**.
4. In the Inspector sidebar for the Web Element:
   - Set **URL** to: `http://localhost:3000/viewer.html?pin=3661`  
     *(or `http://<server-ip>:3000/viewer.html?pin=3661` if running on a separate machine)*.
   - Adjust the Web Element size to **1920 x 1080** (full 16:9 canvas).
5. Trigger the slide! ProPresenter will display the live telestrator canvas and background images natively on screen.

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
