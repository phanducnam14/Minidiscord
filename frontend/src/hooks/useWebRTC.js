import { useRef, useState, useCallback } from 'react';

const ICE_SERVERS = [{ urls: 'stun:stun.l.google.com:19302' }];

const useWebRTC = ({ publish, subscribe, currentUser }) => {
  const [peers, setPeers] = useState(new Map());
  const peersRef = useRef(new Map());

  const [localStream, setLocalStream] = useState(null);
  const localStreamRef = useRef(null);
  const [currentChannelId, setCurrentChannelId] = useState(null);

  const [isMicOn, setIsMicOn] = useState(true);
  const [isCamOn, setIsCamOn] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const screenStreamRef = useRef(null);

  const subUnsubscribers = useRef([]);

  const createPeerConnection = useCallback((peerId, channelId) => {
    const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });

    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => {
        pc.addTrack(track, localStreamRef.current);
      });
    }

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        publish('/app/voice/signal', {
          type: 'ICE_CANDIDATE',
          fromUserId: currentUser?.id,
          toUserId: peerId,
          channelId,
          candidate: JSON.stringify(event.candidate),
        });
      }
    };

    pc.ontrack = (event) => {
      const remoteStream = event.streams[0];
      setPeers((prev) => {
        const next = new Map(prev);
        const existing = next.get(peerId) || {};
        next.set(peerId, { ...existing, stream: remoteStream });
        return next;
      });
      peersRef.current.set(peerId, {
        ...(peersRef.current.get(peerId) || {}),
        peerConnection: pc,
        stream: remoteStream,
      });
    };

    return pc;
  }, [publish, currentUser]);

  const joinVoiceChannel = useCallback(async (channelId) => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: true });
      localStreamRef.current = stream;
      setLocalStream(stream);
      setCurrentChannelId(channelId);
      setIsMicOn(true);
      setIsCamOn(true);
      setIsScreenSharing(false);

      publish('/app/voice/' + channelId + '/join', {});

      const unsubVoice = subscribe('/topic/voice/' + channelId, async (message) => {
        const { type, fromUserId, fromUserName, fromUserAvatar } = message;
        if (fromUserId === currentUser?.id) return;

        if (type === 'JOINED') {
          setPeers((prev) => {
            const next = new Map(prev);
            next.set(fromUserId, {
              name: fromUserName,
              avatar: fromUserAvatar,
              stream: null,
            });
            return next;
          });

          const pc = createPeerConnection(fromUserId, channelId);
          peersRef.current.set(fromUserId, {
            ...(peersRef.current.get(fromUserId) || {}),
            peerConnection: pc,
            name: fromUserName,
            avatar: fromUserAvatar,
          });

          const offer = await pc.createOffer();
          await pc.setLocalDescription(offer);

          publish('/app/voice/signal', {
            type: 'OFFER',
            fromUserId: currentUser?.id,
            toUserId: fromUserId,
            channelId,
            sdp: JSON.stringify(offer),
          });

        } else if (type === 'LEFT') {
          const peerData = peersRef.current.get(fromUserId);
          if (peerData?.peerConnection) {
            peerData.peerConnection.close();
          }
          peersRef.current.delete(fromUserId);
          setPeers((prev) => {
            const next = new Map(prev);
            next.delete(fromUserId);
            return next;
          });
        }
      });

      const unsubPrivate = subscribe('/queue/voice/' + currentUser?.id, async (message) => {
        const { type, fromUserId, sdp, candidate } = message;

        if (type === 'OFFER') {
          const pc = createPeerConnection(fromUserId, channelId);
          peersRef.current.set(fromUserId, {
            ...(peersRef.current.get(fromUserId) || {}),
            peerConnection: pc,
          });
          await pc.setRemoteDescription(JSON.parse(sdp));
          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);

          publish('/app/voice/signal', {
            type: 'ANSWER',
            fromUserId: currentUser?.id,
            toUserId: fromUserId,
            channelId,
            sdp: JSON.stringify(answer),
          });

        } else if (type === 'ANSWER') {
          const peerData = peersRef.current.get(fromUserId);
          if (peerData?.peerConnection) {
            await peerData.peerConnection.setRemoteDescription(JSON.parse(sdp));
          }

        } else if (type === 'ICE_CANDIDATE') {
          const peerData = peersRef.current.get(fromUserId);
          if (peerData?.peerConnection) {
            try {
              await peerData.peerConnection.addIceCandidate(JSON.parse(candidate));
            } catch (e) {
              console.error('[WebRTC] Lỗi add:', e);
            }
          }
        }
      });

      subUnsubscribers.current = [unsubVoice, unsubPrivate].filter(Boolean);

    } catch (e) {
      console.error('[WebRTC] Lỗi join:', e);
    }
  }, [publish, subscribe, currentUser, createPeerConnection]);

  const stopScreenShare = useCallback(() => {
    if (screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach(t => t.stop());
      screenStreamRef.current = null;
    }
    
    if (localStreamRef.current) {
      const camTrack = localStreamRef.current.getVideoTracks()[0];
      if (camTrack) {
        peersRef.current.forEach(({ peerConnection }) => {
          const sender = peerConnection.getSenders().find(s => s.track?.kind === 'video');
          if (sender) sender.replaceTrack(camTrack);
        });
      }
      setLocalStream(new MediaStream(localStreamRef.current.getTracks()));
    }
    setIsScreenSharing(false);
  }, []);

  const startScreenShare = useCallback(async () => {
    try {
      const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
      screenStreamRef.current = screenStream;
      
      const screenTrack = screenStream.getVideoTracks()[0];
      
      screenTrack.onended = () => {
        stopScreenShare();
      };

      peersRef.current.forEach(({ peerConnection }) => {
        const sender = peerConnection.getSenders().find(s => s.track?.kind === 'video');
        if (sender) sender.replaceTrack(screenTrack);
      });

      if (localStreamRef.current) {
        const audioTrack = localStreamRef.current.getAudioTracks()[0];
        const newLocalStream = new MediaStream([screenTrack]);
        if (audioTrack) newLocalStream.addTrack(audioTrack);
        setLocalStream(newLocalStream);
      }
      
      setIsScreenSharing(true);
    } catch (e) {
      console.error('[WebRTC] Lỗi share screen:', e);
    }
  }, [stopScreenShare]);

  const toggleScreenShare = useCallback(() => {
    if (isScreenSharing) stopScreenShare();
    else startScreenShare();
  }, [isScreenSharing, startScreenShare, stopScreenShare]);

  const leaveVoiceChannel = useCallback(() => {
    if (!currentChannelId) return;

    publish('/app/voice/' + currentChannelId + '/leave', {});

    peersRef.current.forEach(({ peerConnection }) => {
      if (peerConnection) peerConnection.close();
    });
    peersRef.current.clear();

    if (screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach((t) => t.stop());
      screenStreamRef.current = null;
    }

    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((t) => t.stop());
      localStreamRef.current = null;
    }

    subUnsubscribers.current.forEach((fn) => typeof fn === 'function' && fn());
    subUnsubscribers.current = [];

    setLocalStream(null);
    setPeers(new Map());
    setCurrentChannelId(null);
    setIsMicOn(true);
    setIsCamOn(true);
    setIsScreenSharing(false);
  }, [publish, currentChannelId]);

  const toggleMic = useCallback(() => {
    if (!localStreamRef.current) return;
    const audioTrack = localStreamRef.current.getAudioTracks()[0];
    if (audioTrack) {
      audioTrack.enabled = !audioTrack.enabled;
      setIsMicOn(audioTrack.enabled);
    }
  }, []);

  const toggleCamera = useCallback(() => {
    if (!localStreamRef.current) return;
    const videoTrack = localStreamRef.current.getVideoTracks()[0];
    if (videoTrack) {
      videoTrack.enabled = !videoTrack.enabled;
      setIsCamOn(videoTrack.enabled);
    }
  }, []);

  return {
    peers,
    localStream,
    currentChannelId,
    isMicOn,
    isCamOn,
    isScreenSharing,
    joinVoiceChannel,
    leaveVoiceChannel,
    toggleMic,
    toggleCamera,
    toggleScreenShare,
  };
};

export default useWebRTC;
