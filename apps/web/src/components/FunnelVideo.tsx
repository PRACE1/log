import type { CSSProperties } from 'react';
import {
  MediaCommunitySkin,
  MediaOutlet,
  MediaPlayer,
} from '@vidstack/react';
import 'vidstack/styles/defaults.css';
import 'vidstack/styles/community-skin/video.css';
import 'vidstack/styles/community-skin/audio.css';

type FunnelVideoProps = {
  src: string;
  title?: string;
  variant?: 'autoplay' | 'controls';
  autoPlay?: boolean;
  muted?: boolean;
  loop?: boolean;
  className?: string;
};

// Same player as open-offer-builder/frontend/src/components/FunnelVideo.tsx:
// VidStack MediaPlayer + outlet + community skin. Blue brand accents.
export function FunnelVideo({
  src,
  title,
  variant = 'controls',
  autoPlay = false,
  muted = false,
  loop = false,
  className = '',
}: FunnelVideoProps) {
  if (variant === 'autoplay') {
    return (
      <MediaPlayer
        className={`block size-full ${className}`}
        title={title}
        src={src}
        autoPlay
        muted
        loop
        playsInline
        preload="auto"
        style={{ '--video-brand': '#2a8cff' } as CSSProperties}
      >
        <MediaOutlet />
      </MediaPlayer>
    );
  }

  return (
    <MediaPlayer
      className={`block size-full ${className}`}
      title={title}
      src={src}
      autoPlay={autoPlay}
      muted={muted}
      loop={loop}
      playsInline
      preload="metadata"
      style={{ '--video-brand': '#2a8cff' } as CSSProperties}
    >
      <MediaOutlet />
      <MediaCommunitySkin />
    </MediaPlayer>
  );
}
