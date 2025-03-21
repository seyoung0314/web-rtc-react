import React, { useMemo } from "react";
import { Headphones,HeadphoneOff } from 'lucide-react';

export const ToggleAudioButton = React.memo(({ isAudioMuted, onClick }) => {
  
  return (
    <button onClick={onClick} style={{ display: "flex", alignItems: "center" }}>
      {isAudioMuted ? (
        <>
          <HeadphoneOff size={24} color="red" /> 
        </>
      ) : (
        <>
          <Headphones size={24} color="green" /> 
        </>
      )}
    </button>
  );
});
