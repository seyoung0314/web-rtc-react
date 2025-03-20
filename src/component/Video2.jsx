import React, { useEffect, useRef, useState } from "react";
import Janus from "../janus.js";
import { useDispatch } from "react-redux";
import styles from "./Video2.module.css";

const JanusWebRTC = ({ studyId, roomCode }) => {
  const dispatch = useDispatch();

  const [isStarted, setIsStarted] = useState(false);
  const [username, setUsername] = useState("");

  const mainVideoRef = useRef(null);
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null); // 상대방 비디오를 위한 ref

  let janus = null;
  let storePlugin = null;
  let mystream = null;

  const opaqueId = "videoroom-test-" + Janus.randomString(12);
  const roomId = 1234;
  const pin = null;
  const serverUrl = "https://janus.jsflux.co.kr/janus";

  useEffect(() => {
    console.log("roomId : ", roomId);

    if (!isStarted) return;

    Janus.init({
      debug: "all",
      callback: function () {
        if (!Janus.isWebrtcSupported()) {
          Janus.log("No WebRTC support...");
          return;
        }

        janus = new Janus({
          server: serverUrl,
          success: function () {
            janus.attach({
              plugin: "janus.plugin.videoroom",
              opaqueId: opaqueId,
              success: function (pluginHandle) {
                storePlugin = pluginHandle;

                let register = pin
                  ? {
                      request: "join",
                      room: roomId,
                      ptype: "publisher",
                      display: username,
                      pin: pin,
                    }
                  : {
                      request: "join",
                      room: roomId,
                      ptype: "publisher",
                      display: username,
                    };

                storePlugin.send({ message: register });
              },
              error: function (error) {
                Janus.error("Error attaching plugin...", error);
              },
              onmessage: function (msg, jsep) {
                let event = msg["videoroom"];
                if (event === "joined") {
                  dispatch({
                    type: "JOIN_ROOM",
                    payload: {
                      room: msg["room"],
                      publisherId: msg["id"],
                      display: username,
                      publisherPvtId: msg["private_id"],
                    },
                  });

                  publishOwnFeed(true);

                  if (msg["publishers"] && msg["publishers"].length > 0) {
                    let publisher = msg["publishers"][0]; // 첫 번째 사람만 받음 (1:1이므로)
                    newRemoteFeed(publisher.id, publisher.display);
                  }
                } else if (event === "event" && msg["publishers"]) {
                  let publisher = msg["publishers"][0]; // 첫 번째 사람만 받음
                  newRemoteFeed(publisher.id, publisher.display);
                } else if (event === "unpublished") {
                  remoteVideoRef.current.srcObject = null; // 상대방이 나갔을 때 비디오 제거
                }

                if (jsep) {
                  storePlugin.handleRemoteJsep({ jsep: jsep });
                }
              },
              onlocalstream: function (stream) {
                if (localVideoRef.current) {
                  localVideoRef.current.srcObject = stream;
                }

                if(mainVideoRef.current){
                  mainVideoRef.current.srcObject = stream;
                }
              },
              oncleanup: function () {
                mystream = null;
              },
            });
          },
          error: function (error) {
            Janus.error(error);
          },
          destroyed: function () {
            Janus.log("Janus Destroyed!");
          },
        });
      },
    });

    return () => {
      if (janus) {
        janus.destroy();
      }
    };
  }, [isStarted]);

  const joinRoom = () => {
    if (!username) {
      alert("아이디를 입력해주세요.");
      return;
    }
    setIsStarted(true);
  };

  const publishOwnFeed = (start) => {
    if (start) {
      let constraints = { audio: true, video: true };

      navigator.mediaDevices
        .getUserMedia(constraints)
        .then((stream) => {
          if (localVideoRef.current) {
            localVideoRef.current.srcObject = stream;
          }
          mystream = stream;

          storePlugin.createOffer({
            stream: stream,
            success: function (jsep) {
              let body = {
                request: "configure",
                room: roomId,
                audio: true,
                video: true,
              };
              storePlugin.send({ message: body, jsep: jsep });
            },
            error: function (error) {
              Janus.error("WebRTC error:", error);
            },
          });
        })
        .catch((error) => {
          Janus.error("Error getting user media:", error);
        });
    }
  };

  const newRemoteFeed = (id, display) => {
    janus.attach({
      plugin: "janus.plugin.videoroom",
      opaqueId: opaqueId,
      success: function (pluginHandle) {
        let remoteFeed = pluginHandle;

        let subscribe = {
          request: "join",
          room: roomId,
          ptype: "subscriber",
          feed: id,
        };

        remoteFeed.send({ message: subscribe });

        remoteFeed.onmessage = function (msg, jsep) {
          if (jsep) {
            remoteFeed.createAnswer({
              jsep: jsep,
              media: { audioSend: false, videoSend: false },
              success: function (jsep) {
                let body = { request: "start", room: roomId };
                remoteFeed.send({ message: body, jsep: jsep });
              },
              error: function (error) {
                Janus.error("WebRTC error:", error);
              },
            });
          }
        };

        remoteFeed.onremotestream = function (stream) {
          if (remoteVideoRef.current) {
            remoteVideoRef.current.srcObject = stream;
          }
        };

        remoteFeed.oncleanup = function () {
          if (remoteVideoRef.current) {
            remoteVideoRef.current.srcObject = null;
          }
        };
      },
    });
  };

  const videoClick = (videoRef) =>{
    console.log("click");
    
    if (videoRef.current && mainVideoRef.current) {
      mainVideoRef.current.srcObject = videoRef.current.srcObject;
    }
    
  }

  return (
    <div>
      <h2>Janus WebRTC 1:1 화상채팅</h2>
      {!isStarted ? (
        <>
          <input
            type="text"
            placeholder="닉네임 입력"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
          <button onClick={joinRoom}>방 참가</button>
        </>
      ) : (
        <div className={styles.videoContainer}>
          <h3>메인 화면</h3>
          <video
            ref={mainVideoRef}
            autoPlay
            playsInline
            muted // 내꺼 소리끄기
            className={styles.mainVideo}
          />
          <div className={styles.smallVideoContainer}>
            <video
              ref={localVideoRef}
              autoPlay
              playsInline
              className={styles.smallVideo}
              onClick={() => videoClick(localVideoRef)}
            />
            <video
              ref={remoteVideoRef}
              autoPlay
              playsInline
              className={styles.smallVideo}
              onClick={() => videoClick(remoteVideoRef)}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default JanusWebRTC;
