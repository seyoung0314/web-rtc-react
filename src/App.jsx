import { useState } from "react";
import reactLogo from "./assets/react.svg";
import viteLogo from "/vite.svg";
import { Provider } from 'react-redux';
import { store } from './store/index.js';  // store.js에서 내보낸 store
import "./App.css";
import VideoRoom from "./component/VideoRoom";
import Video from "./component/Video";
import Video2 from "./component/Video2";
import TestApp from "./component/TestApp";

function App() {
  const [count, setCount] = useState(0);

  return (
    <>
      <Provider store={store}>
        {/* <VideoRoom /> */}
        <Video2 />
        {/* <TestApp/> */}
      </Provider>
    </>
  );
}

export default App;
