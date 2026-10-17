'use client';

import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Camera, ShieldAlert, ShieldCheck, Eye, Activity, RefreshCw, AlertCircle, Scan } from 'lucide-react';
import { BiometricTelemetry } from '@/lib/websocket';

interface BiometricOverlayProps {
  telemetry: BiometricTelemetry | null;
  onSimulateSpoofToggle: (isSpoofed: boolean) => void;
  isSpoofActive: boolean;
  onSendTelemetryFrame?: (telemetryData: any) => void;
}

export const BiometricOverlay: React.FC<BiometricOverlayProps> = ({
  telemetry,
  onSimulateSpoofToggle,
  isSpoofActive,
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [cameraActive, setCameraActive] = useState<boolean>(false);
  const [cameraError, setCameraError] = useState<string | null>(null);

  // Initialize Camera stream if permitted
  useEffect(() => {
    let stream: MediaStream | null = null;
    async function startCamera() {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: 'user' },
          audio: false,
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play();
          setCameraActive(true);
        }
      } catch (err: any) {
        setCameraError(err.message || 'Camera permission not granted. Running in simulated biometric mode.');
        setCameraActive(false);
      }
    }
    startCamera();

    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  // Continuous Canvas HUD rendering for bounding box and biometric telemetry
  useEffect(() => {
    let animationFrameId: number;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let scanY = 0;
    let scanDirection = 1;

    const render = () => {
      const width = canvas.width;
      const height = canvas.height;
      ctx.clearRect(0, 0, width, height);

      // If camera is active, render video frame to canvas
      if (cameraActive && videoRef.current && videoRef.current.readyState >= 2) {
        ctx.drawImage(videoRef.current, 0, 0, width, height);
      } else {
        // Render high-tech simulated biometric avatar canvas
        const grad = ctx.createRadialGradient(width / 2, height / 2, 40, width / 2, height / 2, 280);
        grad.addColorStop(0, '#0c1a38');
        grad.addColorStop(1, '#050811');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, width, height);

        // Grid lines
        ctx.strokeStyle = 'rgba(6, 182, 212, 0.08)';
        ctx.lineWidth = 1;
        for (let x = 0; x < width; x += 30) {
          ctx.beginPath();
          ctx.moveTo(x, 0);
          ctx.lineTo(x, height);
          ctx.stroke();
        }
        for (let y = 0; y < height; y += 30) {
          ctx.beginPath();
          ctx.moveTo(0, y);
          ctx.lineTo(width, y);
          ctx.stroke();
        }

        // Draw facial biometric wireframe silhouette
        ctx.save();
        ctx.translate(width / 2, height / 2 - 20);
        ctx.strokeStyle = isSpoofActive ? 'rgba(244, 63, 94, 0.6)' : 'rgba(6, 182, 212, 0.5)';
        ctx.lineWidth = 1.5;

        // Head ellipse
        ctx.beginPath();
        ctx.ellipse(0, 0, 85, 115, 0, 0, Math.PI * 2);
        ctx.stroke();

        // Facial landmarks
        const time = Date.now() * 0.003;
        const blink = Math.sin(time * 2) > 0.94 ? 1 : 8;

        // Eyes
        ctx.fillStyle = isSpoofActive ? '#f43f5e' : '#06b6d4';
        ctx.beginPath();
        ctx.ellipse(-32, -20, 10, blink, 0, 0, Math.PI * 2);
        ctx.ellipse(32, -20, 10, blink, 0, 0, Math.PI * 2);
        ctx.fill();

        // Nose bridge
        ctx.beginPath();
        ctx.moveTo(0, -10);
        ctx.lineTo(-4, 20);
        ctx.lineTo(4, 20);
        ctx.stroke();

        // Mouth arc
        ctx.beginPath();
        ctx.arc(0, 48, 22, 0.1, Math.PI - 0.1);
        ctx.stroke();

        ctx.restore();
      }

      // Draw dynamic HUD Bounding Box from server telemetry or default coordinates
      const box = telemetry?.bounding_box || { x: width * 0.3, y: height * 0.2, w: width * 0.4, h: height * 0.55 };
      const isRiskHigh = (telemetry?.fraud_risk_score || 0) > 15 || isSpoofActive;

      const primaryColor = isRiskHigh ? '#f43f5e' : '#10b981';
      const bracketLen = 22;

      ctx.save();
      ctx.strokeStyle = primaryColor;
      ctx.lineWidth = 2.5;

      // Top-Left Corner
      ctx.beginPath();
      ctx.moveTo(box.x, box.y + bracketLen);
      ctx.lineTo(box.x, box.y);
      ctx.lineTo(box.x + bracketLen, box.y);
      ctx.stroke();

      // Top-Right Corner
      ctx.beginPath();
      ctx.moveTo(box.x + box.w - bracketLen, box.y);
      ctx.lineTo(box.x + box.w, box.y);
      ctx.lineTo(box.x + box.w, box.y + bracketLen);
      ctx.stroke();

      // Bottom-Left Corner
      ctx.beginPath();
      ctx.moveTo(box.x, box.y + box.h - bracketLen);
      ctx.lineTo(box.x, box.y + box.h);
      ctx.lineTo(box.x + bracketLen, box.y + box.h);
      ctx.stroke();

      // Bottom-Right Corner
      ctx.beginPath();
      ctx.moveTo(box.x + box.w - bracketLen, box.y + box.h);
      ctx.lineTo(box.x + box.w, box.y + box.h);
      ctx.lineTo(box.x + box.w, box.y + box.h - bracketLen);
      ctx.stroke();

      // Laser scan line inside bounding box
      scanY += scanDirection * 2.2;
      if (scanY > box.h) scanDirection = -1;
      if (scanY < 0) scanDirection = 1;

      const currentScanLine = box.y + scanY;
      const scanGrad = ctx.createLinearGradient(box.x, currentScanLine, box.x + box.w, currentScanLine);
      scanGrad.addColorStop(0, 'rgba(6, 182, 212, 0)');
      scanGrad.addColorStop(0.5, isRiskHigh ? 'rgba(244, 63, 94, 0.8)' : 'rgba(16, 185, 129, 0.8)');
      scanGrad.addColorStop(1, 'rgba(6, 182, 212, 0)');

      ctx.strokeStyle = scanGrad;
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.moveTo(box.x, currentScanLine);
      ctx.lineTo(box.x + box.w, currentScanLine);
      ctx.stroke();

      // Target Header Tag
      ctx.fillStyle = isRiskHigh ? 'rgba(244, 63, 94, 0.85)' : 'rgba(16, 185, 129, 0.85)';
      ctx.fillRect(box.x, box.y - 20, 150, 18);
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 10px monospace';
      ctx.fillText(
        isRiskHigh ? 'FLAG: FRAUD RISK ALERT' : 'PASSIVE BIOMETRICS: ACTIVE',
        box.x + 6,
        box.y - 7
      );

      ctx.restore();

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [cameraActive, telemetry, isSpoofActive]);

  const riskScore = telemetry?.fraud_risk_score ?? (isSpoofActive ? 64.5 : 4.2);
  const faceConfidence = telemetry?.confidence_score ?? (isSpoofActive ? 42.1 : 96.8);
  const livenessScore = telemetry?.liveness_score ?? (isSpoofActive ? 28.0 : 97.4);
  const livenessPassed = telemetry?.liveness_passed ?? !isSpoofActive;
  const isHighRisk = riskScore > 15;

  return (
    <div className="cyber-card rounded-2xl overflow-hidden p-5 space-y-4" id="biometric-hud">
      {/* HUD Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="relative">
            <Scan className={`w-4 h-4 ${isHighRisk ? 'text-rose-400' : 'text-emerald-400'} animate-pulse`} />
            <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
          </div>
          <div>
            <h3 className="text-xs font-bold tracking-wider text-slate-200 uppercase">
              Multimodal Biometric Vision HUD
            </h3>
            <p className="text-[10px] text-slate-400">
              Sub-frame 2D/3D Passive Liveness & Acoustic Tracking
            </p>
          </div>
        </div>

        {/* Verification Status Pill */}
        <div className="flex items-center gap-2">
          <span
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold tracking-wide uppercase border ${
              isHighRisk
                ? 'bg-rose-500/20 border-rose-500/40 text-rose-300 animate-pulse'
                : 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300'
            }`}
          >
            {isHighRisk ? <ShieldAlert className="w-3.5 h-3.5" /> : <ShieldCheck className="w-3.5 h-3.5" />}
            {isHighRisk ? 'ESCALATION TRIGGERED' : 'BIOMETRIC PASS: 99.4%'}
          </span>
        </div>
      </div>

      {/* Video & Canvas Container */}
      <div className="relative w-full aspect-video rounded-xl overflow-hidden bg-slate-950 border border-slate-800 shadow-inner group">
        {/* Hidden video element for webcam */}
        <video
          ref={videoRef}
          playsInline
          muted
          autoPlay
          className="hidden"
        />

        {/* Dynamic Canvas HUD */}
        <canvas
          ref={canvasRef}
          width={640}
          height={480}
          className="w-full h-full object-cover"
        />

        {/* Top-Right Telemetry Watermark */}
        <div className="absolute top-3 right-3 bg-slate-950/80 backdrop-blur-md px-2.5 py-1.5 rounded-lg border border-slate-800 text-[10px] font-mono text-cyan-300/90 flex items-center gap-2">
          <Activity className="w-3 h-3 text-cyan-400 animate-pulse" />
          <span>FPS: 30.0 • FPS JITTER: 0.8ms</span>
        </div>

        {/* Bottom Bar: Anti-Spoofing Sensors */}
        <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between pointer-events-none">
          <div className="bg-slate-950/85 backdrop-blur-md px-3 py-1 rounded-lg border border-slate-800/80 text-[10px] text-slate-300 flex items-center gap-2 font-mono">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span>SPECTRAL SHIELD: 3D_PULSE_OK</span>
          </div>

          <div className="bg-slate-950/85 backdrop-blur-md px-3 py-1 rounded-lg border border-slate-800/80 text-[10px] text-slate-300 font-mono">
            VOICE ACOUSTIC: {telemetry?.voice_acoustic_score ?? 96.2}%
          </div>
        </div>
      </div>

      {/* Biometric Scores Matrix */}
      <div className="grid grid-cols-3 gap-3">
        {/* Face Match Confidence */}
        <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800/80">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span className="flex items-center gap-1">
              <Eye className="w-3.5 h-3.5 text-cyan-400" /> Face Match
            </span>
            <span className={`font-mono font-bold ${faceConfidence >= 85 ? 'text-emerald-400' : 'text-rose-400'}`}>
              {faceConfidence.toFixed(1)}%
            </span>
          </div>
          <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-300 ${faceConfidence >= 85 ? 'bg-cyan-400' : 'bg-rose-500'}`}
              style={{ width: `${Math.min(100, faceConfidence)}%` }}
            />
          </div>
          <div className="text-[10px] text-slate-400 mt-1">Req: &gt;= 85.0%</div>
        </div>

        {/* Passive Liveness */}
        <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800/80">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span className="flex items-center gap-1">
              <Activity className="w-3.5 h-3.5 text-emerald-400" /> 3D Liveness
            </span>
            <span className={`font-mono font-bold ${livenessPassed ? 'text-emerald-400' : 'text-rose-400'}`}>
              {livenessScore.toFixed(1)}%
            </span>
          </div>
          <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-300 ${livenessPassed ? 'bg-emerald-400' : 'bg-rose-500'}`}
              style={{ width: `${Math.min(100, livenessScore)}%` }}
            />
          </div>
          <div className="text-[10px] text-slate-400 mt-1">{livenessPassed ? 'Liveness: PASSED' : 'FLAG: REPLAY DETECTED'}</div>
        </div>

        {/* Dynamic Fraud Risk Score */}
        <div className={`p-3 rounded-xl border transition-all ${
          isHighRisk
            ? 'bg-rose-950/40 border-rose-500/40 shadow-lg shadow-rose-950/40'
            : 'bg-slate-900/60 border-slate-800/80'
        }`}>
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span className="flex items-center gap-1 font-semibold text-slate-300">
              <ShieldAlert className={`w-3.5 h-3.5 ${isHighRisk ? 'text-rose-400' : 'text-emerald-400'}`} /> Fraud Risk
            </span>
            <span className={`font-mono font-black ${isHighRisk ? 'text-rose-400 animate-pulse text-sm' : 'text-emerald-400'}`}>
              {riskScore.toFixed(1)}%
            </span>
          </div>
          <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-300 ${isHighRisk ? 'bg-rose-500' : 'bg-emerald-400'}`}
              style={{ width: `${Math.min(100, riskScore)}%` }}
            />
          </div>
          <div className="text-[10px] text-slate-400 mt-1">
            {isHighRisk ? 'Threshold Exceeded (>15%)' : 'Nominal Safe Zone (<=15%)'}
          </div>
        </div>
      </div>

      {/* Interactive Biometric Testing Controls */}
      <div className="flex items-center justify-between pt-1">
        <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
          <AlertCircle className="w-3.5 h-3.5 text-cyan-400" />
          <span>Test anti-spoofing guardrails against synthetic presentation attacks:</span>
        </div>
        <button
          onClick={() => onSimulateSpoofToggle(!isSpoofActive)}
          className={`px-3 py-1.5 rounded-xl text-xs font-semibold tracking-wide transition-all border flex items-center gap-1.5 ${
            isSpoofActive
              ? 'bg-rose-500 text-white border-rose-400 shadow-lg shadow-rose-500/30'
              : 'bg-slate-900 text-slate-300 border-slate-700 hover:border-slate-500 hover:text-white'
          }`}
        >
          <RefreshCw className={`w-3 h-3 ${isSpoofActive ? 'animate-spin' : ''}`} />
          {isSpoofActive ? 'Disable Spoof Injection' : 'Inject Synthetic Spoof Attack'}
        </button>
      </div>
    </div>
  );
};
