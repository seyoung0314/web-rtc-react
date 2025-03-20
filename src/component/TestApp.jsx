import React from 'react'

const TestApp = () => {
  return (
    <div>
      <h1>Video Room</h1>
      <iframe 
        src="http://127.0.0.1:8081/src/videoroomtest.html"  // 기존 화상채팅 페이지 URL
        width="100%" 
        height="600px" 
        frameBorder="0" 
        title="Video Chat"
        allow="microphone; camera"
      />
    </div>
  )
}

export default TestApp