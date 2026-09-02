"use client";

import * as React from "react";
import {
  Camera,
  Mic,
  Volume2,
  Settings,
  ShieldCheck,
  Check,
  X,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/Button";

interface DeviceSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedCameraId?: string;
  selectedMicId?: string;
  onSelectCamera?: (deviceId: string) => void;
  onSelectMic?: (deviceId: string) => void;
}

export function DeviceSettingsModal({
  isOpen,
  onClose,
  selectedCameraId,
  selectedMicId,
  onSelectCamera,
  onSelectMic,
}: DeviceSettingsModalProps) {
  const [videoDevices, setVideoDevices] = React.useState<MediaDeviceInfo[]>([]);
  const [audioDevices, setAudioDevices] = React.useState<MediaDeviceInfo[]>([]);
  const [activeCamera, setActiveCamera] = React.useState<string>(selectedCameraId || "");
  const [activeMic, setActiveMic] = React.useState<string>(selectedMicId || "");
  const [micVolume, setMicVolume] = React.useState<number>(0);
  const [noiseSuppression, setNoiseSuppression] = React.useState<boolean>(true);

  const videoPreviewRef = React.useRef<HTMLVideoElement | null>(null);
  const mediaStreamRef = React.useRef<MediaStream | null>(null);

  // Enumerate Devices
  React.useEffect(() => {
    if (!isOpen) return;

    navigator.mediaDevices?.enumerateDevices?.().then((devices) => {
      const vids = devices.filter((d) => d.kind === "videoinput");
      const auds = devices.filter((d) => d.kind === "audioinput");
      setVideoDevices(vids);
      setAudioDevices(auds);
      if (!activeCamera && vids.length > 0) setActiveCamera(vids[0].deviceId);
      if (!activeMic && auds.length > 0) setActiveMic(auds[0].deviceId);
    });
  }, [isOpen, activeCamera, activeMic]);

  // Camera & Mic stream preview with live audio meter
  React.useEffect(() => {
    if (!isOpen) {
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach((t) => t.stop());
      }
      return;
    }

    let audioContext: AudioContext | null = null;
    let analyser: AnalyserNode | null = null;
    let micSource: MediaStreamAudioSourceNode | null = null;
    let animFrame: number;

    navigator.mediaDevices
      ?.getUserMedia({
        video: activeCamera ? { deviceId: { exact: activeCamera } } : true,
        audio: activeMic ? { deviceId: { exact: activeMic }, noiseSuppression } : true,
      })
      .then((stream) => {
        mediaStreamRef.current = stream;
        if (videoPreviewRef.current) {
          videoPreviewRef.current.srcObject = stream;
        }

        // Setup audio VU meter
        audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        analyser = audioContext.createAnalyser();
        analyser.fftSize = 256;
        micSource = audioContext.createMediaStreamSource(stream);
        micSource.connect(analyser);

        const dataArray = new Uint8Array(analyser.frequencyBinCount);
        const checkVolume = () => {
          if (!analyser) return;
          analyser.getByteFrequencyData(dataArray);
          let sum = 0;
          for (let i = 0; i < dataArray.length; i++) {
            sum += dataArray[i];
          }
          const avg = sum / dataArray.length;
          setMicVolume(Math.min(100, Math.round((avg / 128) * 100)));
          animFrame = requestAnimationFrame(checkVolume);
        };
        checkVolume();
      })
      .catch((err) => {
        console.warn("Media preview access error:", err);
      });

    return () => {
      cancelAnimationFrame(animFrame);
      if (audioContext) audioContext.close();
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach((t) => t.stop());
      }
    };
  }, [isOpen, activeCamera, activeMic, noiseSuppression]);

  const handleSave = () => {
    if (onSelectCamera && activeCamera) onSelectCamera(activeCamera);
    if (onSelectMic && activeMic) onSelectMic(activeMic);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4 animate-in fade-in select-none text-white">
      <div className="relative w-full max-w-lg rounded-3xl bg-slate-900 border border-slate-700/80 p-6 shadow-2xl space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-indigo-600/20 text-indigo-400">
              <Settings className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-white">Classroom Audio & Video Settings</h3>
              <p className="text-xs text-slate-400">Configure devices and test microphone input</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Video Preview Box */}
        <div className="space-y-1.5">
          <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
            Camera Preview
          </label>
          <div className="relative h-44 w-full rounded-2xl bg-slate-950 border border-slate-800 overflow-hidden flex items-center justify-center">
            <video
              ref={videoPreviewRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover mirror"
            />
            <span className="absolute bottom-2 left-2 text-[10px] font-bold bg-slate-900/80 px-2 py-0.5 rounded text-slate-300 border border-slate-700">
              Live Preview
            </span>
          </div>
        </div>

        {/* Camera Selector */}
        <div className="space-y-1.5">
          <label className="flex items-center gap-1.5 text-xs font-bold text-slate-300">
            <Camera className="h-3.5 w-3.5 text-indigo-400" />
            <span>Select Camera</span>
          </label>
          <select
            value={activeCamera}
            onChange={(e) => setActiveCamera(e.target.value)}
            className="w-full rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
          >
            {videoDevices.map((d, i) => (
              <option key={d.deviceId || i} value={d.deviceId}>
                {d.label || `Camera ${i + 1}`}
              </option>
            ))}
          </select>
        </div>

        {/* Microphone Selector & Live VU Meter */}
        <div className="space-y-2">
          <label className="flex items-center gap-1.5 text-xs font-bold text-slate-300">
            <Mic className="h-3.5 w-3.5 text-emerald-400" />
            <span>Select Microphone</span>
          </label>
          <select
            value={activeMic}
            onChange={(e) => setActiveMic(e.target.value)}
            className="w-full rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
          >
            {audioDevices.map((d, i) => (
              <option key={d.deviceId || i} value={d.deviceId}>
                {d.label || `Microphone ${i + 1}`}
              </option>
            ))}
          </select>

          {/* Real-Time Microphone Volume Meter */}
          <div className="space-y-1 pt-1">
            <div className="flex items-center justify-between text-[11px] text-slate-400">
              <span>Mic Input Level Test</span>
              <span className="font-mono">{micVolume}%</span>
            </div>
            <div className="h-2 w-full rounded-full bg-slate-800 overflow-hidden">
              <div
                style={{ width: `${micVolume}%` }}
                className={`h-full rounded-full transition-all duration-75 ${
                  micVolume > 70 ? "bg-rose-500" : micVolume > 30 ? "bg-emerald-400" : "bg-indigo-400"
                }`}
              />
            </div>
          </div>
        </div>

        {/* Noise Suppression Toggle */}
        <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-800/60 border border-slate-700/60">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-indigo-400" />
            <div>
              <span className="text-xs font-bold text-white block">AI Background Noise Filter</span>
              <span className="text-[10px] text-slate-400">Suppresses keyboard clicks and echo</span>
            </div>
          </div>
          <input
            type="checkbox"
            checked={noiseSuppression}
            onChange={(e) => setNoiseSuppression(e.target.checked)}
            className="h-4 w-4 rounded accent-indigo-600"
          />
        </div>

        {/* Footer Actions */}
        <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
          <Button
            variant="outline"
            size="sm"
            onClick={onClose}
            className="border-slate-700 text-slate-300 hover:bg-slate-800 text-xs"
          >
            Cancel
          </Button>
          <Button
            variant="default"
            size="sm"
            onClick={handleSave}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs"
          >
            Save Changes
          </Button>
        </div>
      </div>
    </div>
  );
}
