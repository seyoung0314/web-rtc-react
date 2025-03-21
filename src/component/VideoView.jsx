import React from 'react';
import styles from './Video2.module.css';

const Video = ({ ref, videoType, onClick, isMuted, className }) => {
  return (
    <video
      ref={ref}
      autoPlay
      playsInline
      muted={isMuted}
      className={className}
      onClick={onClick}
    />
  );
};

export default Video;
