# Security Monitoring System

An advanced real-time security monitoring system using TensorFlow.js and React.

## Features

- Real-time face detection using BlazeFace
- Pose estimation using MoveNet
- Object detection using COCO-SSD
- Body segmentation for improved detection
- Activity analysis for:
  - Fighting detection
  - Theft detection
  - Fire hazard detection
  - Suspicious behavior monitoring

## Running Locally

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the development server:
   ```bash
   npm run dev
   ```

## Performance Optimization

The system uses several techniques to maintain high performance:

- WebGL backend for TensorFlow.js
- Model warmup for faster initial predictions
- Efficient state management with Zustand
- Optimized rendering with React
- Throttled updates for stats and notifications

## Browser Support

For best performance, use a modern browser with WebGL support. The application works best in:
- Chrome (recommended)
- Firefox
- Safari
- Edge

## Hardware Requirements

- Webcam
- GPU recommended for better performance
- Minimum 4GB RAM
- Modern CPU (Intel i5/AMD Ryzen 5 or better recommended)