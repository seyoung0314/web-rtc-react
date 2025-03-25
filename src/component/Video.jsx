import React, { useEffect, useRef, useState } from 'react';
import Janus from "../janus.js";
import { useDispatch } from 'react-redux';

const JanusWebRTC = ({ studyId }) => {
  const dispatch = useDispatch();
  
  const [isStarted, setIsStarted] = useState(false);
  const [username, setUsername] = useState('');
  const [remoteStreams, setRemoteStreams] = useState([]); // State to store remote streams
  const localVideoRef = useRef(null);

  let janus = null;
  let storePlugin = null;
  let mystream = null;
  
  const opaqueId = "videoroom-test-" + Janus.randomString(12);
  const roomId = 10001;  // 예시로 roomId 설정 (실제 값은 적절하게 설정 필요)
  const pin = null;  // 필요시 PIN 설정
  const serverUrl = "https://janus.jsflux.co.kr/janus"; // Janus 서버 URL

  useEffect(() => {
    if (!isStarted) return; // 방 참가가 시작되기 전까지는 실행하지 않음

    // Janus 초기화
    Janus.init({
      debug: "all",
      callback: function () {
        if (!Janus.isWebrtcSupported()) {
          Janus.log("No WebRTC support...");
          return;
        }

        // 세션 생성
        janus = new Janus({
          server: serverUrl, // Janus 서버 주소
          success: function () {
            janus.attach({
              plugin: "janus.plugin.videoroom",
              opaqueId: opaqueId,
              success: function (pluginHandle) {
                storePlugin = pluginHandle;
                Janus.log("Plugin attached! (" + storePlugin.getPlugin() + ", id=" + storePlugin.getId() + ")");
                Janus.log("  -- This is a publisher/manager");

                // 방 참여
                let register = pin ? {
                  request: "join",
                  room: roomId,
                  ptype: "publisher",
                  display: username,
                  pin: pin,
                } : {
                  request: "join",
                  room: roomId,
                  ptype: "publisher",
                  display: username,
                };

                storePlugin.send({ message: register });
              },
              error: function (error) {
                Janus.error("  -- Error attaching plugin...", error);
              },
              onmessage: function (msg, jsep) {
                Janus.debug(" ::: Got a message (publisher) :::", msg);
                var event = msg["videoroom"];
                if (event) {
                  if (event === "joined") {
                    dispatch({
                      type: 'JOIN_ROOM',
                      payload: {
                        room: msg["room"],
                        publisherId: msg["id"],
                        display: username,
                        publisherPvtId: msg["private_id"],
                      },
                    });
                    Janus.log("Successfully joined room " + msg["room"] + " with ID " + msg["id"]);

                    // Publisher 피드 publish
                    publishOwnFeed(true);

                    if (msg["publishers"]) {
                      var list = msg["publishers"];
                      for (var f in list) {
                        var id = list[f]["id"];
                        var display = list[f]["display"];
                        var audio = list[f]["audio_codec"];
                        var video = list[f]["video_codec"];
                        newRemoteFeed(id, display, audio, video);
                      }
                    }
                  } else if (event === "destroyed") {
                    Janus.warn("The room has been destroyed!");
                  }else if (event === "event") {
                    // 새로운 Publisher 접속시
                    if (msg["publishers"]) {
                        var list = msg["publishers"];
                        Janus.debug(
                            "Got a list of available publishers/feeds:",
                            list
                        );
                        for (var f in list) {
                            var id = list[f]["id"];
                            var display = list[f]["display"];
                            var audio = list[f]["audio_codec"];
                            var video = list[f]["video_codec"];
                            Janus.debug(
                                "  >> [" +
                                id +
                                "] " +
                                display +
                                " (audio: " +
                                audio +
                                ", video: " +
                                video +
                                ")"
                            );
                            // 모두 Subscribe 진행unpublish
                            newRemoteFeed(id, display, audio, video);
                        }
                      }
                    }
                }
                if (jsep) {
                  storePlugin.handleRemoteJsep({ jsep: jsep });
                }
              },
              onlocalstream: function (stream) {
                mystream = stream;
                dispatch({
                  type: 'ADD_PUBLISH_STREAM',
                  payload: { stream },
                });
                dispatch({
                  type: 'CHANGE_MAIN_FEED',
                  payload: { stream, display: username },
                });

                // 로컬 비디오 스트림을 화면에 표시
                if (localVideoRef.current) {
                  localVideoRef.current.srcObject = stream;
                }
              },
              onremotestream: function (stream) {
                // 여기서 다른 Subscriber 스트림을 처리
              },
              oncleanup: function () {
                Janus.log(" ::: Got a cleanup notification: we are unpublished now :::");
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

    // 컴포넌트 언마운트 시 Janus 세션 종료
    return () => {
      if (janus) {
        janus.destroy();
      }
    };
  }, [isStarted]); // isStarted가 변경될 때마다 실행됨

  // 방 참가
  const joinRoom = () => {
    if (!username) {
      alert("아이디를 입력해주세요.");
      return;
    }
    setIsStarted(true); // 방 참가 시 isStarted를 true로 변경
  };

  // Publisher 스트림 송출
  const publishOwnFeed = (start) => {
    if (start) {
      let constraints = {
        audio: true,
        video: true,
      };

      navigator.mediaDevices.getUserMedia(constraints)
        .then(function (stream) {
          if (localVideoRef.current) {
            localVideoRef.current.srcObject = stream;
          }
          mystream = stream;
          storePlugin.createOffer({
            stream: stream,
            success: function (jsep) {
              let body = { request: "configure", room: roomId, audio: true, video: true };
              storePlugin.send({ message: body, jsep: jsep });
            },
            error: function (error) {
              Janus.error("WebRTC error:", error);
            },
          });
        })
        .catch(function (error) {
          Janus.error("Error getting user media:", error);
        });
    }
  };

  // Remote Feed 수신
  const newRemoteFeed = (id, display, audio, video) => {
    let remoteFeed = null;
    janus.attach({
      plugin: "janus.plugin.videoroom",
      opaqueId: opaqueId,
      success: function (pluginHandle) {
        remoteFeed = pluginHandle;
        Janus.log("Plugin attached! (" + remoteFeed.getPlugin() + ", id=" + remoteFeed.getId() + ")");
        
        let subscribe = {
          request: "join",
          room: roomId,
          ptype: "subscriber",
          feed: id,
        };

        remoteFeed.send({ message: subscribe });
      },
      onmessage: function (msg, jsep) {
        if (jsep) {
          remoteFeed.createAnswer({
            jsep: jsep,
            media: { data: true, audioSend: false, videoSend: false },
            success: function (jsep) {
              let body = { request: "start", room: roomId };
              remoteFeed.send({ message: body, jsep: jsep });
            },
            error: function (error) {
              Janus.error("WebRTC error:", error);
            },
          });
        }
      },
      onremotestream: function (stream) {
        setRemoteStreams((prevStreams) => [
          ...prevStreams,
          { id: remoteFeed.rfid, stream },
        ]);
        dispatch({
          type: 'ADD_SUBSCRIBE_STREAM',
          payload: { rfid: remoteFeed.rfid, stream },
        });
      },
      oncleanup: function () {
        setRemoteStreams((prevStreams) =>
          prevStreams.filter((stream) => stream.id !== remoteFeed.rfid)
        );
        dispatch({
          type: 'REMOVE_SUBSCRIBER',
          payload: { rfid: remoteFeed.rfid },
        });
      },
    });
  };

  return (
    <div>
      <h2>Janus WebRTC React</h2>
      {!isStarted && (
        <>
          <input
            type="text"
            placeholder="닉네임 입력"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
          <button onClick={joinRoom}>방 참가</button>
        </>
      )}
      {isStarted && (
        <>
          <video
            ref={localVideoRef}
            autoPlay
            playsInline
            muted
            style={{ width: "100%", height: "auto" }}
          />
          {remoteStreams.map((remoteStream) => (
            <video
              key={remoteStream.id}
              ref={(ref) => (remoteStream.ref = ref)} // Reference each video element
              autoPlay
              playsInline
              style={{ width: "100%", height: "auto" }}
            />
          ))}
        </>
      )}
    </div>
  );
};

export default JanusWebRTC;
