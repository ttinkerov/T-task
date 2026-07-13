'use client';

import { useEffect, useState } from 'react';

const BACKGROUND_VIDEOS = [
  {
    src: 'https://assets.mixkit.co/videos/preview/mixkit-software-developer-working-on-code-close-up-1728-large.mp4',
    alt: 'Разработчик пишет код',
  },
  {
    src: 'https://assets.mixkit.co/videos/preview/mixkit-rows-of-servers-in-a-server-room-49879-large.mp4',
    alt: 'Серверная комната',
  },
  {
    src: 'https://assets.mixkit.co/videos/preview/mixkit-team-working-on-laptops-in-a-modern-office-19908-large.mp4',
    alt: 'Команда в офисе',
  },
] as const;

const ROTATE_MS = 9000;

export function BigTechBackground() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    const updateMotion = () => setReduceMotion(media.matches);
    updateMotion();
    media.addEventListener('change', updateMotion);
    return () => media.removeEventListener('change', updateMotion);
  }, []);

  useEffect(() => {
    if (reduceMotion) return undefined;

    const interval = window.setInterval(() => {
      setActiveIndex((current) => (current + 1) % BACKGROUND_VIDEOS.length);
    }, ROTATE_MS);

    return () => window.clearInterval(interval);
  }, [reduceMotion]);

  return (
    <div className="tt-bg" aria-hidden="true">
      <div className="tt-bg__videos">
        {BACKGROUND_VIDEOS.map((video, index) => (
          <video
            key={video.src}
            className={`tt-bg__video ${index === activeIndex ? 'is-active' : ''}`}
            autoPlay
            loop
            muted
            playsInline
            preload="metadata"
            aria-label={video.alt}
          >
            <source src={video.src} type="video/mp4" />
          </video>
        ))}
      </div>
      <div className="tt-bg__overlay" />
    </div>
  );
}
