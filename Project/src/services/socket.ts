import { io, Socket } from 'socket.io-client';
import { DetectionResult } from '../types/detection';

class SocketService {
  private static instance: SocketService;
  private socket: Socket;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;

  private constructor() {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.hostname;
    const port = '5000';
    const url = `${protocol}//${host}:${port}`;

    this.socket = io(url, {
      transports: ['websocket', 'polling'],
      autoConnect: false,
      reconnection: true,
      reconnectionAttempts: this.maxReconnectAttempts,
      reconnectionDelay: 1000,
      timeout: 10000,
    });

    this.setupEventListeners();
  }

  public static getInstance(): SocketService {
    if (!SocketService.instance) {
      SocketService.instance = new SocketService();
    }
    return SocketService.instance;
  }

  private setupEventListeners() {
    this.socket.on('connect_error', this.handleConnectionError.bind(this));
    this.socket.on('error', (error) => console.error('Socket error:', error));
    this.socket.on('disconnect', () => console.log('Disconnected from server'));
    this.socket.on('connection_status', (status) => console.log('Connection status:', status));
  }

  private handleConnectionError(error: Error) {
    console.error('Connection error:', error);
    this.reconnectAttempts++;
    
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      setTimeout(() => {
        this.connect();
      }, Math.min(1000 * Math.pow(2, this.reconnectAttempts), 10000));
    }
  }

  public connect(): void {
    if (!this.socket.connected) {
      this.socket.connect();
    }
  }

  public disconnect(): void {
    this.socket.disconnect();
  }

  public onConnect(callback: () => void): void {
    this.socket.on('connect', callback);
  }

  public onDisconnect(callback: () => void): void {
    this.socket.on('disconnect', callback);
  }

  public onDetectionResult(callback: (result: DetectionResult) => void): void {
    this.socket.on('detection_result', callback);
  }

  public analyzeFrame(frame: string): void {
    if (this.socket.connected) {
      this.socket.emit('analyze_frame', { frame });
    }
  }

  public isConnected(): boolean {
    return this.socket.connected;
  }
}

export const socketService = SocketService.getInstance();