import React, { useMemo } from "react";

export const ToggleVideoButton = React.memo(({ isVideoMuted, onClick }) => {

  console.log("toggled : " ,isVideoMuted);
  
  return (
    <button onClick={onClick}>
      {isVideoMuted ? "카메라 켜기" : "카메라 끄기"}
    </button>
  );
});
