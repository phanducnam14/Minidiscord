import { useEffect, useRef, useState, useCallback } from 'react';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';

/**
 * Custom hook quản lý kết nối WebSocket STOMP
 * Kết nối tới backend Spring Boot qua SockJS
 */
const useWebSocket = () => {
  const clientRef = useRef(null);
  const [connected, setConnected] = useState(false);
  // Lưu các subscription để cleanup
  const subscriptionsRef = useRef(new Map());

  useEffect(() => {
    const client = new Client({
      // Dùng SockJS factory để kết nối qua proxy hiện tại (quan trọng cho ngrok)
      webSocketFactory: () => new SockJS('/ws'),
      reconnectDelay: 5000,
      onConnect: () => {
        console.log('[WebSocket] Kết nối thành công');
        setConnected(true);
      },
      onDisconnect: () => {
        console.log('[WebSocket] Ngắt kết nối');
        setConnected(false);
      },
      onStompError: (frame) => {
        console.error('[WebSocket] Lỗi STOMP:', frame);
        setConnected(false);
      },
    });

    client.activate();
    clientRef.current = client;

    return () => {
      // Unsubscribe tất cả trước khi deactivate
      subscriptionsRef.current.forEach((sub) => sub.unsubscribe());
      subscriptionsRef.current.clear();
      client.deactivate();
    };
  }, []);

  /**
   * Đăng ký nhận message từ một destination
   * @returns function để unsubscribe
   */
  const subscribe = useCallback((destination, callback) => {
    const client = clientRef.current;
    if (!client || !client.connected) {
      // Chờ kết nối rồi subscribe
      const interval = setInterval(() => {
        if (clientRef.current?.connected) {
          clearInterval(interval);
          const sub = clientRef.current.subscribe(destination, (message) => {
            try {
              callback(JSON.parse(message.body));
            } catch (e) {
              callback(message.body);
            }
          });
          subscriptionsRef.current.set(destination, sub);
        }
      }, 300);
      return () => clearInterval(interval);
    }

    const sub = client.subscribe(destination, (message) => {
      try {
        callback(JSON.parse(message.body));
      } catch (e) {
        callback(message.body);
      }
    });
    subscriptionsRef.current.set(destination, sub);

    return () => {
      sub.unsubscribe();
      subscriptionsRef.current.delete(destination);
    };
  }, []);

  /**
   * Gửi message tới một destination
   */
  const publish = useCallback((destination, body) => {
    const client = clientRef.current;
    if (!client?.connected) {
      console.warn('[WebSocket] Chưa kết nối, không thể gửi:', destination);
      return;
    }
    client.publish({
      destination,
      body: JSON.stringify(body),
    });
  }, []);

  return { client: clientRef.current, connected, subscribe, publish };
};

export default useWebSocket;
