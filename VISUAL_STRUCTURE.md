# 🎨 Visual Structure Reference

## Page Flow (Top to Bottom)

```
┌─────────────────────────────────────────────────────────┐
│                    NAVBAR (Fixed)                        │
│  [🌐 CollabSphere]  [Home|Features|About]  [Login|Register] │
│              (Tubelight animation on active)             │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│                    HERO SECTION                          │
│                                                          │
│              Collaborate. Communicate.                   │
│                     Create.                              │
│                                                          │
│    CollabSphere connects teams worldwide with chat,     │
│           video meetings, and shared workspaces.        │
│                                                          │
│         [Get Started]  [View Demo]                      │
│                                                          │
│              (Scroll to reveal 3D globe)                │
│                      🌍                                  │
│                                                          │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│                  FEATURES SECTION                        │
│                                                          │
│        Everything You Need to Collaborate               │
│                                                          │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐             │
│  │ 💬 Chat  │  │ 📹 Video │  │ 📁 Collab│             │
│  │          │  │          │  │          │             │
│  └──────────┘  └──────────┘  └──────────┘             │
│                                                          │
│  ┌──────────┐  ┌──────────┐                            │
│  │ 📤 Share │  │ 🔒 Secure│                            │
│  │          │  │          │                            │
│  └──────────┘  └──────────┘                            │
│                                                          │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│                HOW IT WORKS SECTION                      │
│                                                          │
│           Get Started in 3 Simple Steps                 │
│                                                          │
│     ①                ②                ③                │
│  Create a      →   Invite Your   →   Chat, Meet       │
│   Collab           Team               & Collaborate     │
│                                                          │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│                   ABOUT SECTION                          │
│                                                          │
│  ┌──────────────────┐  ┌──────────────────┐           │
│  │ Built for Teams  │  │   ⭕ Animated    │           │
│  │ That Move Fast   │  │   ⭕ Rotating     │           │
│  │                  │  │   ⭕ Rings        │           │
│  │ ✓ Slack-inspired │  │      🌐          │           │
│  │ ✓ Zoom-quality   │  │                  │           │
│  │ ✓ Modern tech    │  │                  │           │
│  │ ✓ Real-time      │  │                  │           │
│  │                  │  │                  │           │
│  │ [Learn More]     │  │                  │           │
│  └──────────────────┘  └──────────────────┘           │
│                                                          │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│                    CTA SECTION                           │
│                                                          │
│         Start Collaborating Without Limits              │
│                                                          │
│    Join thousands of teams already using CollabSphere   │
│                                                          │
│  [Create Your First Collab]  [Schedule a Demo]         │
│                                                          │
│     10K+          50K+           99.9%                  │
│  Active Users  Messages Sent    Uptime                  │
│                                                          │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│                      FOOTER                              │
│                                                          │
│  🌐 CollabSphere    Built With           Connect        │
│                                                          │
│  Empowering teams   [React] [Node.js]    🔗 GitHub     │
│  to collaborate     [Socket.io] [MongoDB]               │
│  seamlessly         [WebRTC] [Tailwind]                 │
│                                                          │
│  ─────────────────────────────────────────────────────  │
│                                                          │
│  © 2024 CollabSphere    Privacy | Terms | Contact       │
│                                                          │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│              MOBILE NAVBAR (Fixed Bottom)                │
│         [Home]  [Features]  [About]  [☰]               │
└─────────────────────────────────────────────────────────┘
```

---

## 🎨 Color Scheme

### Backgrounds
- **Hero/Main**: `#0B0F1A` → `#0F1729` → `#131B2E` (gradient)
- **Sections**: `slate-950`, `slate-900`
- **Cards**: `slate-800/40` with backdrop-blur

### Accents
- **Primary**: Cyan-500 → Blue-600 (gradient)
- **Secondary**: Violet-500
- **Glow**: Cyan-500/10, Blue-500/10

### Text
- **Headings**: White
- **Body**: Slate-400
- **Muted**: Slate-500

### Effects
- **Glass**: `backdrop-blur-xl`
- **Borders**: `slate-700/50`, `slate-800/50`
- **Shadows**: `shadow-cyan-500/25`

---

## 📐 Layout Specs

### Navbar
- **Desktop**: Fixed top, max-w-7xl container
- **Mobile**: Fixed bottom, full width
- **Height**: ~60px
- **Z-index**: 50

### Hero
- **Height**: 200vh (enables scroll animations)
- **Viewport**: 100vh sticky container
- **Text**: Centered initially
- **Globe**: Reveals at 30% scroll

### Sections
- **Padding**: py-24 (96px vertical)
- **Container**: max-w-7xl mx-auto
- **Gap**: 6-12 between elements

### Grid Layouts
- **Features**: 1 col mobile, 2 col tablet, 3 col desktop
- **How It Works**: 1 col mobile, 3 col desktop
- **About**: 1 col mobile, 2 col desktop

---

## 🎭 Animations

### Navbar
- **Tubelight**: `layoutId` animation on active tab
- **Duration**: 0.6s spring

### Hero
- **Text Fade**: Opacity 1 → 0 (0-30% scroll)
- **Text Move**: Y 0% → -30% (0-50% scroll)
- **Globe Reveal**: Opacity 0 → 1 (0-50% scroll)
- **Globe Scale**: 0.8 → 1 (0-50% scroll)

### Cards
- **Hover**: Scale 1.02, Y -5px
- **Glow**: Gradient opacity 0 → 5%

### Scroll Entrance
- **Initial**: opacity: 0, y: 20
- **Animate**: opacity: 1, y: 0
- **Stagger**: 0.1s delay per item

---

## 🔧 Responsive Breakpoints

- **Mobile**: < 768px
  - Single column layouts
  - Bottom navbar
  - Smaller text sizes
  - Stacked buttons

- **Tablet**: 768px - 1024px
  - 2-column grids
  - Medium text sizes

- **Desktop**: > 1024px
  - 3-column grids
  - Top navbar
  - Full-size text
  - Side-by-side buttons

---

## 🎯 Interactive Elements

### Buttons
- **Primary**: Gradient bg, shadow glow, scale on hover
- **Secondary**: Border, transparent bg, hover glow

### Cards
- **Hover**: Lift effect, border color change, glow
- **Transition**: 300ms ease

### Links
- **Hover**: Color change to cyan-400
- **Transition**: 200ms

---

## 📱 Mobile Optimizations

- Bottom navbar for thumb reach
- Larger touch targets (min 44px)
- Simplified animations
- Reduced motion support (recommended)
- Optimized font sizes
- Stacked layouts

---

This visual guide helps you understand the complete structure at a glance! 🎨
