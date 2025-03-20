import { useState } from "react";
import reactLogo from "./assets/react.svg";
import viteLogo from "/vite.svg";
import { Provider } from "react-redux";
import { store } from "./store/index.js"; // store.js에서 내보낸 store
import "./App.css";
import VideoRoom from "./component/VideoRoom";
import Video from "./component/Video";
import Chat from "./component/Chat";
import Video2 from "./component/Video2";
import TestApp from "./component/TestApp";

function App() {
  const [count, setCount] = useState(0);

  const roomId = 10001;

  return (
    <>
      <Provider store={store}>
        {/* <VideoRoom /> */}
        <div className="wrap">
          <div className="video-container">
            <Video2 roomCode={roomId} />
          </div>
          <div className="chat-container">
            <Chat />
          </div>
        </div>
        {/* <TestApp/> */}
      </Provider>
    </>
  );
}

export default App;
