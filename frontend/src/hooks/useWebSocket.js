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

  const subscribeToDestination = useCallback((destination, callback) => {
    const client = clientRef.current;
    if (!client?.connected) {
      return null;
    }

    const existingEntry = subscriptionsRef.current.get(destination);
    existingEntry?.subscription?.unsubscribe();

    const subscription = client.subscribe(destination, (message) => {
      try {
        callback(JSON.parse(message.body));
      } catch {
        callback(message.body);
      }
    });

    subscriptionsRef.current.set(destination, { callback, subscription });
    return subscription;
  }, []);

  useEffect(() => {
    const subscriptions = subscriptionsRef.current;

    const client = new Client({
      // Dùng SockJS factory để kết nối qua proxy hiện tại (quan trọng cho ngrok)
      webSocketFactory: () => new SockJS('/ws'),
      reconnectDelay: 5000,
      onConnect: () => {
        console.log('[WebSocket] Kết nối thành công');
        setConnected(true);

        subscriptions.forEach((entry, destination) => {
          subscribeToDestination(destination, entry.callback);
        });
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
      subscriptions.forEach((entry) => entry.subscription?.unsubscribe());
      subscriptions.clear();
      client.deactivate();
    };
  }, [subscribeToDestination]);

  /**
   * Đăng ký nhận message từ một destination
   * @returns function để unsubscribe
   */
  const subscribe = useCallback((destination, callback) => {
    subscribeToDestination(destination, callback);

    if (!subscriptionsRef.current.get(destination)) {
      subscriptionsRef.current.set(destination, { callback, subscription: null });
    }

    return () => {
      const currentEntry = subscriptionsRef.current.get(destination);
      if (currentEntry?.callback !== callback) {
        return;
      }

      currentEntry.subscription?.unsubscribe();
      subscriptionsRef.current.delete(destination);
    };
  }, [subscribeToDestination]);

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

  return { connected, subscribe, publish };
};

export default useWebSocket;
