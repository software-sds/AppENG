// App.js
import React, { useRef, useState, useEffect } from "react";
import * as tf from "@tensorflow/tfjs";
import * as cocossd from "@tensorflow-models/coco-ssd";
import Webcam from "react-webcam";
import "./App.css";
import { drawRect } from "./utilities";

function App() {
  const webcamRef = useRef(null);
  const canvasRef = useRef(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [detections, setDetections] = useState([]);
  const [detectionFrequency, setDetectionFrequency] = useState(66);

  const runCoco = async () => {
    try {
      const net = await cocossd.load();
      setLoading(false);
      setInterval(() => {
        detect(net);
      }, detectionFrequency);
    } catch (error) {
      console.error("Failed to load the COCO-SSD model", error);
      setError("Failed to load the COCO-SSD model");
      setLoading(false);
    }
  };

  const detect = async (net) => {
    if (
      webcamRef.current &&
      webcamRef.current.video.readyState === 4
    ) {
      const video = webcamRef.current.video;
      const videoWidth = webcamRef.current.video.videoWidth;
      const videoHeight = webcamRef.current.video.videoHeight;

      webcamRef.current.video.width = videoWidth;
      webcamRef.current.video.height = videoHeight;

      canvasRef.current.width = videoWidth;
      canvasRef.current.height = videoHeight;

      try {
        const obj = await net.detect(video);
        setDetections(obj);

        const ctx = canvasRef.current.getContext("2d");
        drawRect(obj, ctx);
      } catch (error) {
        console.error("Failed to detect objects", error);
      }
    }
  };

  useEffect(() => {
    runCoco();
  }, [detectionFrequency]);

  if (loading) {
    return <div className="App-loading">Loading model...</div>;
  }

  if (error) {
    return <div className="App-error">Error: {error}</div>;
  }

  return (
    <div className="App">
      <header className="App-header">
        <Webcam
          ref={webcamRef}
          muted={true}
          style={{
            position: "absolute",
            marginLeft: "auto",
            marginRight: "auto",
            left: 0,
            right: 0,
            textAlign: "center",
            zindex: 9,
            width: 640,
            height: 480,
          }}
          onError={(e) => setError(`Webcam error: ${e.message}`)}
        />

        <canvas
          ref={canvasRef}
          style={{
            position: "absolute",
            marginLeft: "auto",
            marginRight: "auto",
            left: 0,
            right: 0,
            textAlign: "center",
            zindex: 8,
            width: 640,
            height: 480,
          }}
        />
      </header>
      <aside className="App-sidebar">
        <h2>Detections</h2>
        {detections.map((detection, index) => (
          <div key={index}>
            {detection.class} - {Math.round(detection.score * 100)}%
          </div>
        ))}
      </aside>
      <footer className="App-footer">
        <label>
          Detection Frequency (ms): 
          <input 
            type="number" 
            value={detectionFrequency} 
            onChange={(e) => setDetectionFrequency(Number(e.target.value))} 
          />
        </label>
      </footer>
    </div>
  );
}

export default App;
