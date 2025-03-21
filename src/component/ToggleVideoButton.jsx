import React, { useMemo } from "react";
import { Video,VideoOff } from 'lucide-react';

export const ToggleVideoButton = React.memo(({ isVideoMuted, onClick }) => {
  
  return (
    <button onClick={onClick} style={{ display: "flex", alignItems: "center" }}>
      {isVideoMuted ? (
        <>
          <VideoOff size={24} color="red" /> 
        </>
      ) : (
        <>
          <Video size={24} color="green" /> 
        </>
      )}
    </button>
  );
});
