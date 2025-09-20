"use client";
import { useEffect, useState } from "react";

interface CountdownProps {
  endTime: number; // timestamp (ms)
}

export default function Countdown({ endTime }: CountdownProps) {
  const [timeLeft, setTimeLeft] = useState(endTime - Date.now());

  useEffect(() => {
    const interval = setInterval(() => {
      setTimeLeft(endTime - Date.now());
    }, 1000);
    return () => clearInterval(interval);
  }, [endTime]);

  if (timeLeft <= 0) {
    return <span className="text-red-400 font-bold">Auction ended</span>;
  }

  const hours = Math.floor(timeLeft / (1000 * 60 * 60));
  const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((timeLeft % (1000 * 60)) / 1000);

  return (
    <span className="font-mono text-lg">
      {hours}h {minutes}m {seconds}s
    </span>
  );
}

