import { useEffect, useRef, useState } from "react";
import Janus from "../janus.js";

const VideoRoom = () => {
  const dispatch = useDispatch();
  const mystream = useSelector((state) => state.videoRoom.mystream);
  const mainFeed = useSelector((state) => state.videoRoom.mainFeed);
  const username = useSelector((state) => state.videoRoom.username);


  const localVideoRef = useRef(null);
  const [janus, setJanus] = useState(null);
  const [plugin, setPlugin] = useState(null);
  const [room, setRoom] = useState(1234); // 기본 방 ID
  const [isStarted, setIsStarted] = useState(false); // Janus 실행 여부
  const serverUrl = "https://janus.jsflux.co.kr/janus"; // Janus 서버 URL

  // Janus 초기화
  const startJanus = () => {
    if (isStarted) return; // 이미 시작되었으면 실행 안 함
    setIsStarted(true);

    Janus.init({
      debug: "all",
      callback: () => {
        if (!Janus.isWebrtcSupported()) {
          alert("No WebRTC support... ");
          return;
        }

        // Janus 세션 생성
        const j = new Janus({
          server: serverUrl,
          success: () => {
            j.attach({
              plugin: "janus.plugin.videoroom",
              success: (pluginHandle) => {
                console.log("Plugin attached!", pluginHandle);

                setStorePlugin(pluginHandle);

                const register = {
                  request: "join",
                  room: room,
                  ptype: "publisher",
                  display: username,
                  // pin: pin || undefined,
                };


              },
              error: (err) => console.error("Error attaching plugin...", err),
              onmessage: (msg, jsep) => handleMessage(msg, jsep),
              onlocalstream: (stream) => {
                console.log("Local stream received:", stream);
                setMystream(stream);
                localVideoRef.current.srcObject = stream;
              },
              onremotestream: (stream) => {
                console.log("Remote stream received:", stream);
                // 원격은 수신만가능
              },
              consentDialog: () => {},
              onlocaltarack: (track, added) => {},
              onremotetrack: (track, mid, added) => {},
              oncleanup: () => {},
              detached: () => {},
            });
          },
          error: (err) => console.error("Error starting Janus:", err),
          destroyed: () => console.log("Janus session destroyed"),
        });

        setJanus(j);
      },
    });
  };

  // 메시지 처리
  const handleMessage = (msg, jsep) => {
    console.log("수신된 메시지:", msg);
    if (jsep) {
      plugin?.handleRemoteJsep({ jsep });
    }

    const event = msg["videoroom"];
    if (event) {
      if (event === "joined") {
        console.log("Successfully joined room", msg["room"]);
        // 방에 참가한 후 처리 (자신의 피드를 전송하거나, 다른 참가자와의 연결 설정)
        publishOwnFeed(true);
      } else if (event === "event" && msg["publishers"]) {
        // 새로 참가한 퍼블리셔가 있을 경우 처리
        const publishers = msg["publishers"];
        publishers.forEach((publisher) => {
          const { id, display } = publisher;
          console.log(`New publisher: ${id} - ${display}`);
          // 다른 피드를 구독할 수 있도록 설정 (subscribe)
          subscribeToFeed(id);
        });
      }
    }
  };

  // 방에 참가
  const joinRoom = () => {
    if (!plugin || !username) return;

    const register = {
      request: "join",
      room: room,
      ptype: "publisher",
      display: username,
    };
    plugin.send({ message: register });
  };

  // 자신의 피드를 전송
  const publishOwnFeed = (add) => {
    if (!mystream) return;
    if (add) {
      plugin.send({
        message: {
          request: "publish",
          audio: true,
          video: true,
        },
        jsep: mystream,
      });
    }
  };

  // 다른 피드를 구독
  const subscribeToFeed = (id) => {
    plugin.send({
      message: {
        request: "subscribe",
        room: room,
        feed: id,
      },
    });
  };

  return (
    <div>
      <h2>Janus WebRTC React</h2>
      {!isStarted && <button onClick={startJanus}>Janus 시작</button>}
      {isStarted && (
        <>
          <input
            type="text"
            placeholder="닉네임 입력"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
          <button onClick={joinRoom}>방 참가</button>
          <video
            ref={localVideoRef}
            autoPlay
            playsInline
            muted
            style={{ width: "100%", height: "auto" }}
          />
        </>
      )}
    </div>
  );
};

export default VideoRoom;
