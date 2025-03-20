import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  mystream: null,  // Publish Stream
  mainFeed: null,
  username: '',
  storePlugin: null,  // storePlugin 상태 추가
  remoteStreams: [],  // Remote Streams 상태 추가
  room: null,  // 방 상태 추가
  publisherId: null,  // Publisher ID 추가
  publisherPvtId: null,  // Publisher Private ID 추가
};

const webRtcSlice = createSlice({
  name: "webRtc",
  initialState,
  reducers: {
    addPublishStream: (state, action) => {
      state.mystream = { id: action.payload.id };  // ID만 저장
    },
    removePublishStream: (state) => {
      state.mystream = null;
    },
    changeMainFeed: (state, action) => {
      state.mainFeed = action.payload;
    },
    setUsername: (state, action) => {
      state.username = action.payload;
    },
    setStorePlugin: (state, action) => {
      state.storePlugin = action.payload;
    },
    addSubscribeStream: (state, action) => {
      state.remoteStreams.push(action.payload);  // Remote stream 추가
    },
    removeSubscriber: (state, action) => {
      state.remoteStreams = state.remoteStreams.filter(
        (stream) => stream.rfid !== action.payload.rfid
      );
    },
  },
});

export const {
  addPublishStream,
  removePublishStream,
  changeMainFeed,
  setUsername,
  setStorePlugin,
  addSubscribeStream,
  removeSubscriber,
  joinRoom,  // JOIN_ROOM 액션을 export
} = webRtcSlice.actions;

export default webRtcSlice.reducer;
