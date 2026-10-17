import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'SentinelVoice | Multimodal AI Fraud Verification & Servicing',
  description: 'Enterprise Autonomous Customer Servicing with Real-Time Biometric Fraud Checks and Deterministic Guardrails',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen cyber-grid text-slate-100 antialiased selection:bg-cyan-500 selection:text-black">
        {children}
      </body>
    </html>
  );
}
