import { io } from 'socket.io-client';

export const socket = io('http://localhost:5000', {
  autoConnect: true,
  reconnection: true,
});

socket.on('connect', () => {
  console.log('Connected to detection server');
});

socket.on('connect_error', (error) => {
  console.error('Connection error:', error);
});