import { useEffect, useRef } from 'react';
import marsEsaAudio from '../../assets/mars_esa.mp3';

export function BackgroundMusic() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const hasStartedRef = useRef(false);

  useEffect(() => {
    const audio = new Audio(marsEsaAudio);
    audio.loop = true;
    audio.preload = 'auto';
    audio.volume = 0.25;
    audioRef.current = audio;

    const startAudio = () => {
      if (hasStartedRef.current) return;
      hasStartedRef.current = true;

      audio.play().catch(() => {
        hasStartedRef.current = false;
      });
    };

    window.addEventListener('pointerdown', startAudio, { once: true });
    window.addEventListener('keydown', startAudio, { once: true });
    window.addEventListener('touchstart', startAudio, { once: true });

    return () => {
      window.removeEventListener('pointerdown', startAudio);
      window.removeEventListener('keydown', startAudio);
      window.removeEventListener('touchstart', startAudio);
      audio.pause();
      audioRef.current = null;
    };
  }, []);

  return null;
}
