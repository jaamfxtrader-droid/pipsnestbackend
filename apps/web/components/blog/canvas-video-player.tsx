"use client";

import { useEffect, useRef, useState } from "react";
import { Pause, Play, Volume1, Volume2, VolumeX } from "lucide-react";
import { cn } from "@/lib/utils";

type CanvasVideoPlayerProps = {
  src: string;
  title?: string | null;
  posterSrc?: string | null;
  preview?: boolean;
  className?: string;
};

export function CanvasVideoPlayer({ src, title, posterSrc, preview = false, className }: CanvasVideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const frameRef = useRef<number | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const gainRef = useRef<GainNode | null>(null);
  const sourceReadyRef = useRef(false);
  const [playing, setPlaying] = useState(false);
  const [volume, setVolume] = useState(preview ? 0 : 1.1);
  const [previousVolume, setPreviousVolume] = useState(1.1);
  const [speed, setSpeed] = useState(1);
  const [hasFrame, setHasFrame] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    video.volume = Math.min(volume, 1);
    video.muted = volume === 0 || preview;
    if (gainRef.current) gainRef.current.gain.value = volume;
  }, [volume, preview]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    video.playbackRate = speed;
  }, [speed]);

  useEffect(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;
    const context = canvas.getContext("2d");
    if (!context) return;

    function drawFrame() {
      if (!video || !canvas || !context) return;
      const width = video.videoWidth || canvas.clientWidth || 640;
      const height = video.videoHeight || canvas.clientHeight || 360;
      if (canvas.width !== width) canvas.width = width;
      if (canvas.height !== height) canvas.height = height;
      try {
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        if (video.readyState >= 2) setHasFrame(true);
      } catch {
        return;
      }
      frameRef.current = window.requestAnimationFrame(drawFrame);
    }

    frameRef.current = window.requestAnimationFrame(drawFrame);
    return () => {
      if (frameRef.current) window.cancelAnimationFrame(frameRef.current);
    };
  }, [src]);

  async function togglePlayback() {
    const video = videoRef.current;
    if (!video) return;
    setupAudioGain();
    if (video.paused) {
      await video.play();
      setPlaying(true);
    } else {
      video.pause();
      setPlaying(false);
    }
  }

  function setupAudioGain() {
    const video = videoRef.current;
    if (!video || preview || sourceReadyRef.current) return;
    const AudioContextCtor = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextCtor) return;
    const context = new AudioContextCtor();
    const source = context.createMediaElementSource(video);
    const gain = context.createGain();
    gain.gain.value = volume;
    source.connect(gain).connect(context.destination);
    audioContextRef.current = context;
    gainRef.current = gain;
    sourceReadyRef.current = true;
  }

  async function handleMouseEnter() {
    if (!preview || !videoRef.current) return;
    try {
      setupAudioGain();
      await videoRef.current.play();
      setPlaying(true);
    } catch {
      setPlaying(false);
    }
  }

  function handleMouseLeave() {
    if (!preview || !videoRef.current) return;
    videoRef.current.pause();
    setPlaying(false);
  }

  const VolumeIcon = volume === 0 || preview ? VolumeX : volume < 0.5 ? Volume1 : Volume2;
  const muted = volume === 0 || preview;
  const progress = duration > 0 ? Math.min(100, Math.max(0, (currentTime / duration) * 100)) : 0;

  return (
    <div
      className={cn("group relative overflow-hidden rounded-lg bg-slate-950", className)}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <video
        ref={videoRef}
        src={src}
        crossOrigin="anonymous"
        preload="metadata"
        playsInline
        controls={false}
        controlsList="nodownload noplaybackrate noremoteplayback"
        disablePictureInPicture
        onContextMenu={(event) => event.preventDefault()}
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onLoadedMetadata={(event) => setDuration(event.currentTarget.duration || 0)}
        onTimeUpdate={(event) => setCurrentTime(event.currentTarget.currentTime || 0)}
        className="hidden"
      />
      <canvas ref={canvasRef} aria-label={title ?? "Blog video"} className="aspect-video h-full w-full object-cover" />
      {posterSrc && !hasFrame ? <img src={posterSrc} alt="" className="absolute inset-0 h-full w-full object-cover" /> : null}
      {!hasFrame && !posterSrc ? <div className="absolute inset-0 animate-pulse bg-slate-800" /> : null}
      {!preview ? (
        <div className="absolute inset-x-3 bottom-3 rounded-lg bg-slate-950/80 p-3 text-white opacity-0 shadow-lg backdrop-blur-md transition group-hover:opacity-100 group-focus-within:opacity-100">
          <div className="mb-3 h-1.5 overflow-hidden rounded-full bg-white/15">
            <div className="h-full rounded-full bg-primary transition-[width]" style={{ width: `${progress}%` }} />
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <button type="button" onClick={togglePlayback} className="grid h-10 w-10 place-items-center rounded-full bg-white text-slate-950" aria-label={playing ? "Pause video" : "Play video"}>
              {playing ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4 fill-current" />}
            </button>
            <button
              type="button"
              onClick={() => setVolume((current) => {
                if (current === 0) return previousVolume || 1.1;
                setPreviousVolume(current);
                return 0;
              })}
              className="grid h-9 w-9 place-items-center rounded-full bg-white/10 text-white transition hover:bg-white/20"
              aria-label={muted ? "Unmute video" : "Mute video"}
              title={muted ? "Unmute" : "Mute"}
            >
              <VolumeIcon className="h-4 w-4" />
            </button>
            <label className="flex min-w-0 flex-1 items-center gap-2 text-xs font-semibold">
              <input
                type="range"
                min="0"
                max="2"
                step="0.05"
                value={volume}
                onChange={(event) => setVolume(Number(event.target.value))}
                className="w-full accent-primary"
                aria-label="Video volume"
              />
              <span className="w-10 text-right">{Math.round(volume * 100)}%</span>
            </label>
            <select
              value={speed}
              onChange={(event) => setSpeed(Number(event.target.value))}
              className="h-9 rounded-md border border-white/10 bg-white/10 px-2 text-xs font-bold text-white outline-none"
              aria-label="Video speed"
            >
              {[1, 1.25, 1.5, 2, 3].map((value) => (
                <option key={value} value={value} className="bg-slate-950">
                  {value}x
                </option>
              ))}
            </select>
          </div>
        </div>
      ) : (
        <div className="pointer-events-none absolute inset-0 grid place-items-center bg-slate-950/0 transition group-hover:bg-slate-950/10">
          <span className="grid h-11 w-11 place-items-center rounded-full bg-white/90 text-slate-950 opacity-0 transition group-hover:opacity-100">
            {playing ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4 fill-current" />}
          </span>
        </div>
      )}
    </div>
  );
}
