"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/Button";

interface LiveCameraCaptureProps {
  label: string;
  facingMode?: "environment" | "user";
  onCapture: (payload: { fileName: string; previewUrl: string; sizeKb: number; deviceTimestamp: string; blob: Blob }) => void;
}

export function LiveCameraCapture({ label, facingMode = "environment", onCapture }: LiveCameraCaptureProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [streaming, setStreaming] = useState(false);
  const [error, setError] = useState("");
  const [previewUrl, setPreviewUrl] = useState("");

  useEffect(() => {
    return () => {
      const stream = videoRef.current?.srcObject as MediaStream | null;
      stream?.getTracks().forEach((track) => track.stop());
    };
  }, []);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: facingMode }, width: { ideal: 1280 } },
        audio: false
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      setStreaming(true);
      setError("");
    } catch {
      setError("Kamera tidak tersedia. Gunakan perangkat mobile dengan izin kamera aktif.");
    }
  };

  const stopCamera = () => {
    const stream = videoRef.current?.srcObject as MediaStream | null;
    stream?.getTracks().forEach((track) => track.stop());
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setStreaming(false);
  };

  const captureFrame = async () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    const width = Math.min(video.videoWidth || 1280, 1280);
    const height = Math.round((video.videoHeight || 720) * (width / (video.videoWidth || 1280)));
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext("2d");
    if (!context) return;

    context.drawImage(video, 0, 0, width, height);

    let quality = 0.78;
    let blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/webp", quality));

    while (blob && blob.size > 80 * 1024 && quality > 0.35) {
      quality -= 0.08;
      blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/webp", quality));
    }

    if (!blob) {
      setError("Gagal mengambil gambar dari kamera.");
      return;
    }

    const url = URL.createObjectURL(blob);
    setPreviewUrl(url);
    onCapture({
      fileName: `${label.toLowerCase().replace(/\s+/g, "-")}-${Date.now()}.webp`,
      previewUrl: url,
      sizeKb: Number((blob.size / 1024).toFixed(1)),
      deviceTimestamp: new Date().toISOString(),
      blob
    });
    stopCamera();
  };

  return (
    <div className="space-y-3 rounded-2xl border border-primary/15 bg-white/90 p-4 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-slate-900">{label}</p>
          <p className="text-xs text-slate-500">Gunakan kamera live. Upload galeri tidak disediakan.</p>
        </div>
        {!streaming ? (
          <Button variant="secondary" className="px-3 py-2 text-sm" onClick={startCamera}>
            Aktifkan Kamera
          </Button>
        ) : (
          <Button variant="secondary" className="px-3 py-2 text-sm" onClick={stopCamera}>
            Tutup Kamera
          </Button>
        )}
      </div>

      {streaming ? (
        <div className="space-y-3">
          <video ref={videoRef} className="w-full rounded-xl bg-slate-950 object-cover" playsInline muted />
          <Button className="w-full" onClick={captureFrame}>Ambil Foto Live</Button>
        </div>
      ) : null}

      {previewUrl ? (
        <div className="space-y-2">
          <img src={previewUrl} alt={label} className="h-52 w-full rounded-xl object-cover" />
          <p className="text-xs text-slate-500">Foto terbaru siap dipakai untuk tahap ini.</p>
        </div>
      ) : null}

      {error ? <p className="text-xs text-red-600">{error}</p> : null}

      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}
