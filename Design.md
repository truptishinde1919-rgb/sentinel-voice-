# UI/UX Design System & Component Specifications
## Project: SentinelVoice (Team Nexus)

---

## 1. Design Philosophy: Cybernetic FinTech HUD

SentinelVoice is designed to instill immediate confidence, authority, and high-tech elegance. Moving away from standard sterile corporate banking portals, SentinelVoice uses an **Obsidian Cybernetic HUD** aesthetic inspired by modern Security Operations Centers (SOC) and luxury titanium credit cards.

### Core Visual Tenets:
1. **Depth Through Glassmorphism**: Translucent panels (`bg-slate-900/75 backdrop-blur-xl`) with hairline neon borders (`border-cyan-500/20`) give an elevated layered feel.
2. **Real-Time Telemetry Pulses**: Live visual heartbeats, glowing radar sweeps, and live audio frequency waveforms indicate the system is constantly watching and verifying.
3. **Explicit State Signifiers**:
   - 🟢 **Emerald (`#10b981`)**: Biometrics verified, policies passed, actions successfully executed.
   - 🔵 **Cyan (`#06b6d4`)**: Active streaming audio, facial tracking brackets, live balance indicators.
   - 🔴 **Rose (`#f43f5e`)**: Fraud alert, liveness spoof detected, warm handoff triggered.
   - 🟣 **Indigo (`#6366f1`)**: Agent reasoning traces and supervisor SOC dispatches.

---

## 2. Color Palette & Tokens

```css
/* Core Dark Palette */
--bg-void:        #04060a;  /* Deepest space black */
--bg-slate-950:   #070a13;  /* Primary canvas background */
--bg-slate-900:   #0c1222;  /* Panel glass background */
--bg-slate-800:   #141e38;  /* Panel border & container */

/* Biometric & Brand Accents */
--cyan-accent:    #06b6d4;  /* Active facial HUD, brackets, waveform */
--emerald-pass:   #10b981;  /* Verified biometrics, approved policies */
--rose-alert:     #f43f5e;  /* Spoof alerts, policy violations, warm handoff */
--amber-warn:     #f59e0b;  /* Elevated credit utilization, secondary check */
--indigo-neural:  #6366f1;  /* AI reasoning & LangGraph state dispatch */
```

---

## 3. Component Design Specifications

### 3.1 Obsidian Metal Credit Card (`AccountSummary.tsx`)
- **Card Geometry**: 16:9 ratio, rounded 2xl corners (`rounded-2xl`).
- **Surface Texture**: Obsidian metallic gradient (`bg-gradient-to-br from-slate-900 via-indigo-950/80 to-slate-950`) with diagonal holographic glare.
- **Physical Details**:
  * Golden EMV Chip with micro-circuit grid.
  * Contactless NFC wireless wave symbol (`)))`).
  * Embossed cardholder name and expiration date.
  * Metallic Hologram Visa Platinum badge.
- **Balance Counter**: Real-time balance readout with green pulse on successful fee waiver crediting.

### 3.2 Multimodal Biometric Vision HUD (`BiometricOverlay.tsx`)
- **Video & Canvas**: 640x480 resolution scaled to 16:9 aspect-video container.
- **Dynamic Bounding Box**:
  * Four corner brackets that follow the facial coordinates `[x, y, w, h]` returned by the backend.
  * Smooth micro-jitter and sub-pixel breath animation.
  * Shifts color from **Cyan** (tracking) to **Emerald** (verified) or **Rose** (spoof detected).
- **HUD Scanline Sweep**: Continuous vertical laser sweep gradient moving across the face boundary.
- **Biometric Score Gauges**:
  * **Face Match Confidence**: 0–100% linear meter (green if $\ge 85\%$).
  * **3D Passive Liveness**: 0–100% linear meter with blink and micro-pulse flags.
  * **Dynamic Fraud Risk**: 0–100% gauge (red pulse if $> 15\%$).

### 3.3 Voice Interface & Waveform Widget (`VoiceWidget.tsx`)
- **Waveform Canvas**: 36 dynamic audio bars rendered on HTML5 Canvas.
  * **Listening State**: Cyan-to-emerald gradient with high oscillation.
  * **Thinking / Guardrail State**: Indigo-to-purple harmonic breathing animation.
  * **Idle State**: Subtle low-opacity resting pulse.
- **Microphone Action Button**:
  * Large 48px circular button with cyan glow when ready.
  * Turns glowing rose with pulsing rings when listening.
- **Conversation Transcript Stream**:
  * Differentiated chat bubbles for Customer (verified cyan pill) and Sentinel Agent (indigo bot pill).
  * Explicit action execution badges with checkmark and dollar amounts credited.

### 3.4 Compliance & Audit Trace Logger (`AuditLogger.tsx`)
- **Header**: Terminal icon with real-time "Copy JSON" button giving 2-second visual feedback.
- **Tab Bar**: 4 quick filters (`ALL`, `GUARDRAILS`, `BIOMETRICS`, `RAW`).
- **Rule Cards**: Each evaluated rule shows:
  * Rule ID and Title
  * Target Condition vs. Evaluated Condition
  * Green `PASSED` or Red `VIOLATED` tag.
- **Expandable JSON Drawer**: Formatted syntax-highlighted JSON trace payload.

### 3.5 Supervisor Operations Center Dashboard (`/admin/page.tsx`)
- **KPI Summary Grid**: Active Sessions, Autonomous Resolution Rate (94.2%), Blocked Fraud Attempts (8), Average Latency (320ms).
- **Active Call Cards**: Live customer identity, sentiment gauge, channel badge, and "Monitor Audio" action.
- **Warm Transfer Queue**: Highlighted with red border and pulsing alert when fraud risk exceeds 15.0%.
- **Takeover Modal**: One-click "Accept Warm Handoff" to patch supervisor directly into audio stream.

---

## 4. Accessibility & Responsiveness
- **Contrast Ratios**: Meets WCAG 2.1 AA standards (high-contrast text on dark backgrounds).
- **Grid Layout**: 12-column responsive layout:
  * Desktop (lg): 4 cols (Account) + 5 cols (Vision & Voice) + 3 cols (Audit Logger).
  * Tablet / Mobile: Stacks gracefully into single-column scrollable experience.
- **Visual Status Badges**: All color-coded alerts include text equivalents (`PASSED`, `VIOLATED`, `WARM TRANSFER`) to ensure full accessibility for color-blind users.
