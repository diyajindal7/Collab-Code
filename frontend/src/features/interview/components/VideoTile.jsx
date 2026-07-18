import { useEffect, useRef } from "react";

export default function VideoTile({ stream, label, muted = false, isScreen = false }) {
  const videoRef = useRef(null);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.srcObject = stream || null;
    }
  }, [stream]);

  return (
    <div className="overflow-hidden rounded-lg border border-slate-700 bg-slate-950">
      <div className="border-b border-slate-800 px-3 py-2 text-xs font-medium text-slate-300">
        {label}
      </div>
      {stream ? (
        <video
          ref={videoRef}
          autoPlay
          muted={muted}
          playsInline
          className={`w-full bg-black ${isScreen ? "max-h-72 object-contain" : "h-36 object-cover"}`}
        />
      ) : (
        <div className="flex h-36 items-center justify-center text-sm text-slate-500">
          No video
        </div>
      )}
    </div>
  );
}
