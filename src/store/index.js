import { configureStore, createSlice } from "@reduxjs/toolkit";
import webRtcReducer from "./slices/webRtcSlice"



// 리덕스는 단 하나의 스토어만 사용 (앱당 하나)
// 스토어는 최상단 컴포넌트에 제공해야한다. (여기선 app.jsx)
const store = configureStore({

  //  다중 슬라이스 -> 컴포넌트들이 상태값을 가져갈때 키를 명시해야함
  // (=> useSelector 시 키를 넣어야함)
  reducer: {
    webRtc: webRtcReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['ADD_PUBLISH_STREAM'],
      },
    }),
});

export { store };