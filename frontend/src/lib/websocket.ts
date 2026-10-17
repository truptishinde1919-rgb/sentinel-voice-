export interface BiometricTelemetry {
  face_detected: boolean;
  bounding_box: { x: number; y: number; w: number; h: number };
  confidence_score: number;
  liveness_score: number;
  liveness_passed: boolean;
  voice_acoustic_score: number;
  anti_spoofing_flags: string[];
  fraud_risk_score: number;
  decision: 'PASSED' | 'CHALLENGE_REQUIRED' | 'WARM_HANDOFF_ESCALATED';
  reason: string;
  timestamp: number;
}

export interface AgentResponsePayload {
  type: string;
  reply: string;
  action_executed: any;
  guardrail_result: any;
  fraud_risk_score: number;
  biometric_telemetry: BiometricTelemetry;
  warm_handoff: boolean;
  audit_trace: any[];
  updated_user?: any;
}

export class ServicingWebSocketClient {
  private ws: WebSocket | null = null;
  private sessionId: string;
  private url: string;
  private reconnectInterval: number = 3000;
  private isConnecting: boolean = false;
  private messageHandlers: ((data: any) => void)[] = [];
  private statusHandlers: ((connected: boolean) => void)[] = [];

  constructor(sessionId: string) {
    this.sessionId = sessionId;
    const envWsUrl = process.env.NEXT_PUBLIC_WS_URL;
    if (envWsUrl) {
      const base = envWsUrl.replace(/\/+$/, '');
      this.url = `${base}/ws/servicing/${sessionId}`;
    } else {
      const protocol = typeof window !== 'undefined' && window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const host = typeof window !== 'undefined' ? window.location.hostname : 'localhost';
      this.url = `${protocol}//${host}:8000/ws/servicing/${sessionId}`;
    }
  }

  public connect() {
    if (typeof window === 'undefined') return;
    if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) {
      return;
    }

    this.isConnecting = true;
    try {
      this.ws = new WebSocket(this.url);

      this.ws.onopen = () => {
        this.isConnecting = false;
        this.notifyStatus(true);
      };

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          this.notifyMessage(data);
        } catch (e) {
          console.error('Failed to parse WebSocket message', e);
        }
      };

      this.ws.onclose = () => {
        this.isConnecting = false;
        this.notifyStatus(false);
        setTimeout(() => this.connect(), this.reconnectInterval);
      };

      this.ws.onerror = (err) => {
        console.warn('Servicing WebSocket connection warning', err);
        this.ws?.close();
      };
    } catch (e) {
      this.isConnecting = false;
      this.notifyStatus(false);
    }
  }

  public onMessage(handler: (data: any) => void) {
    this.messageHandlers.push(handler);
    return () => {
      this.messageHandlers = this.messageHandlers.filter((h) => h !== handler);
    };
  }

  public onStatus(handler: (connected: boolean) => void) {
    this.statusHandlers.push(handler);
    return () => {
      this.statusHandlers = this.statusHandlers.filter((h) => h !== handler);
    };
  }

  private notifyMessage(data: any) {
    for (const handler of this.messageHandlers) {
      handler(data);
    }
  }

  private notifyStatus(connected: boolean) {
    for (const handler of this.statusHandlers) {
      handler(connected);
    }
  }

  public sendFrame(frameData: {
    user_id: string;
    user_risk_tier: number;
    frame_base64?: string;
    audio_telemetry?: any;
    action_context?: string;
  }) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(
        JSON.stringify({
          type: 'FRAME_TELEMETRY',
          ...frameData,
        })
      );
    }
  }

  public sendAudioTranscript(payload: {
    text: string;
    user_id: string;
    biometric_telemetry?: any;
  }) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(
        JSON.stringify({
          type: 'AUDIO_TRANSCRIPT',
          ...payload,
        })
      );
    }
  }

  public disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }
}
