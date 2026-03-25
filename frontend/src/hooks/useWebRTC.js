import { useRef, useState, useCallback } from 'react';
import useToastStore from '../store/useToastStore';

const ICE_SERVERS = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' },
  {
    urls: "turn:openrelay.metered.ca:80",
    username: "openrelayproject",
    credential: "openrelayproject"
  },
  {
    urls: "turn:openrelay.metered.ca:443",
    username: "openrelayproject",
    credential: "openrelayproject"
  },
  {
    urls: "turn:openrelay.metered.ca:443?transport=tcp",
    username: "openrelayproject",
    credential: "openrelayproject"
  }
];

const useWebRTC = ({ publish, subscribe, currentUser }) => {
  const [peers, setPeers] = useState(new Map());
  const peersRef = useRef(new Map());
  const { addToast } = useToastStore();

  const [localStream, setLocalStream] = useState(null);
  const localStreamRef = useRef(null);
  const [currentChannelId, setCurrentChannelId] = useState(null);

  const [isMicOn, setIsMicOn] = useState(true);
  const [isCamOn, setIsCamOn] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const screenStreamRef = useRef(null);

  const subUnsubscribers = useRef([]);

  const createPeerConnection = useCallback((peerId, channelId) => {
    console.log(`[WebRTC] Đang tạo PeerConnection cho: ${peerId}`);
    const pc = new RTCPeerConnection({ 
      iceServers: ICE_SERVERS,
      sdpSemantics: 'unified-plan',
      iceTransportPolicy: 'all',
      bundlePolicy: 'max-bundle'
    });

    if (localStreamRef.current) {
      console.log(`[WebRTC] Đang thêm ${localStreamRef.current.getTracks().length} tracks vào PC cho ${peerId}`);
      localStreamRef.current.getTracks().forEach((track) => {
        pc.addTrack(track, localStreamRef.current);
      });
    }

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        console.log(`[WebRTC] Gửi ICE Candidate cho ${peerId}`);
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
      console.log(`[WebRTC] Nhận track từ ${peerId}:`, event.track.kind);
      
      let remoteStream = event.streams[0];
      if (!remoteStream) {
        remoteStream = new MediaStream([event.track]);
      }

      setPeers((prev) => {
        const next = new Map(prev);
        const existing = next.get(peerId) || {};
        
        // Luôn tạo mới MediaStream để React useEffect bắt được thay đổi reference
        const tracks = existing.stream ? existing.stream.getTracks() : [];
        if (!tracks.find(t => t.id === event.track.id)) {
          tracks.push(event.track);
        }
        const updatedStream = new MediaStream(tracks);
        
        next.set(peerId, { ...existing, stream: updatedStream });
        return next;
      });

      peersRef.current.set(peerId, {
        ...(peersRef.current.get(peerId) || {}),
        peerConnection: pc,
        stream: peers.get(peerId)?.stream || remoteStream,
      });
    };

    pc.onconnectionstatechange = () => {
      console.log(`[WebRTC] Trạng thái kết nối với ${peerId}: ${pc.connectionState}`);
    };

    pc.oniceconnectionstatechange = () => {
      console.log(`[WebRTC] Trạng thái ICE với ${peerId}: ${pc.iceConnectionState}`);
    };

    return pc;
  }, [publish, currentUser]);

  const joinVoiceChannel = useCallback(async (channelId) => {
    try {
      let stream;
      let audioReady = false;
      let videoReady = false;

      try {
        stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: true });
        audioReady = true;
        videoReady = true;
      } catch (err) {
        console.warn('[WebRTC] Không thể lấy cả Audio và Video, đang thử từng cái:', err);
        try {
          stream = await navigator.mediaDevices.getUserMedia({ audio: true });
          audioReady = true;
          videoReady = false;
        } catch (errAudio) {
          console.warn('[WebRTC] Không có Micro:', errAudio);
          try {
            stream = await navigator.mediaDevices.getUserMedia({ video: true });
            audioReady = false;
            videoReady = true;
          } catch (errVideo) {
            console.error('[WebRTC] Không tìm thấy thiết bị nào:', errVideo);
            throw new Error('Không thể truy cập Micro hoặc Camera. Vui lòng cấp quyền trong trình duyệt hoặc kiểm tra lại thiết bị.');
          }
        }
      }

      localStreamRef.current = stream;
      setLocalStream(stream);
      setCurrentChannelId(channelId);
      setIsMicOn(audioReady);
      setIsCamOn(videoReady);
      setIsScreenSharing(false);

      const unsubVoice = subscribe('/topic/voice/' + channelId, async (message) => {
        const { type, fromUserId, fromUserName, fromUserAvatar } = message;
        if (fromUserId === currentUser?.id) return;

        console.log(`[WebRTC] Nhận message ${type} từ ${fromUserId}`);

        if (type === 'JOINED') {
          addToast(`${fromUserName} đã tham gia kênh thoại`);
          console.log(`[WebRTC] ${fromUserName} đã tham gia. Đang tạo Offer...`);
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
          // Khởi tạo hàng đợi ICE candidates
          pc.iceCandidatesQueue = [];

          peersRef.current.set(fromUserId, {
            ...(peersRef.current.get(fromUserId) || {}),
            peerConnection: pc,
            name: fromUserName,
            avatar: fromUserAvatar,
          });

          const offer = await pc.createOffer({
            offerToReceiveAudio: true,
            offerToReceiveVideo: true
          });

          // Gửi OFFER trước để đảm bảo phía kia nhận được trước khi các ICE_CANDIDATE chạy tới
          publish('/app/voice/signal', {
            type: 'OFFER',
            fromUserId: currentUser?.id,
            toUserId: fromUserId,
            channelId,
            sdp: JSON.stringify(offer),
          });

          // setLocalDescription sẽ kích hoạt onicecandidate
          await pc.setLocalDescription(offer);

        } else if (type === 'LEFT') {
          const peerData = peersRef.current.get(fromUserId);
          addToast(`${peerData?.name || 'Người dùng'} đã rời kênh thoại`);
          
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

      const unsubPrivate = subscribe('/topic/voice/signal/' + currentUser?.id, async (message) => {
        const { type, fromUserId, sdp, candidate } = message;

        if (type === 'OFFER') {
          const pc = createPeerConnection(fromUserId, channelId);
          pc.iceCandidatesQueue = []; // Đệm candidate
          
          peersRef.current.set(fromUserId, {
            ...(peersRef.current.get(fromUserId) || {}),
            peerConnection: pc,
          });
          
          await pc.setRemoteDescription(JSON.parse(sdp));
          
          // Xử lý các candidate bị nghẽn trong hàng đợi
          while (pc.iceCandidatesQueue.length > 0) {
            const queuedCandidate = pc.iceCandidatesQueue.shift();
            try { await pc.addIceCandidate(queuedCandidate); } 
            catch (e) { console.error('[WebRTC] Lỗi add queued candidate:', e); }
          }

          const answer = await pc.createAnswer();

          // Gửi ANSWER trước
          publish('/app/voice/signal', {
            type: 'ANSWER',
            fromUserId: currentUser?.id,
            toUserId: fromUserId,
            channelId,
            sdp: JSON.stringify(answer),
          });

          // Kích hoạt onicecandidate
          await pc.setLocalDescription(answer);

        } else if (type === 'ANSWER') {
          const peerData = peersRef.current.get(fromUserId);
          if (peerData?.peerConnection) {
            await peerData.peerConnection.setRemoteDescription(JSON.parse(sdp));
            // Xử lý các candidate bị nghẽn
            while (peerData.peerConnection.iceCandidatesQueue?.length > 0) {
              const queuedCandidate = peerData.peerConnection.iceCandidatesQueue.shift();
              try { await peerData.peerConnection.addIceCandidate(queuedCandidate); } 
              catch (e) { console.error('[WebRTC] Lỗi add queued candidate:', e); }
            }
          }

        } else if (type === 'ICE_CANDIDATE') {
          const peerData = peersRef.current.get(fromUserId);
          if (peerData?.peerConnection) {
            const pc = peerData.peerConnection;
            const candidateObj = JSON.parse(candidate);
            if (!pc.remoteDescription) {
              // Bị Race condition: nhận ICE trước khi RemoteDescription set xong -> đưa vào hàng đợi
              if (!pc.iceCandidatesQueue) pc.iceCandidatesQueue = [];
              pc.iceCandidatesQueue.push(candidateObj);
            } else {
              try {
                await pc.addIceCandidate(candidateObj);
              } catch (e) {
                console.error('[WebRTC] Lỗi add candidate:', e);
              }
            }
          }
        }
      });

      subUnsubscribers.current = [unsubVoice, unsubPrivate].filter(Boolean);

      console.log('[WebRTC] Đã chuẩn bị xong Signaling, đang gửi lệnh JOIN...');
      publish('/app/voice/' + channelId + '/join', {});

    } catch (e) {
      console.error('[WebRTC] Lỗi join:', e);
      addToast(e.message || 'Có lỗi xảy ra khi tham gia kênh thoại.', 'error');
    }
  }, [publish, subscribe, currentUser, createPeerConnection, addToast]);

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
      } else {
        // Nếu không có cam, gỡ track screen ra
        peersRef.current.forEach(({ peerConnection }) => {
          const sender = peerConnection.getSenders().find(s => s.track?.kind === 'video');
          if (sender) peerConnection.removeTrack(sender);
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

      // Cập nhật Peers
      for (const [peerId, peerData] of peersRef.current.entries()) {
        const sender = peerData.peerConnection.getSenders().find(s => s.track?.kind === 'video');
        if (sender) {
          sender.replaceTrack(screenTrack);
        } else {
          // Trường hợp máy không có camera trước đó -> phải addTrack mới
          peerData.peerConnection.addTrack(screenTrack, screenStream);
          
          // Gửi lại OFFER để bên kia nhận track mới
          const offer = await peerData.peerConnection.createOffer();
          await peerData.peerConnection.setLocalDescription(offer);
          publish('/app/voice/signal', {
            type: 'OFFER',
            fromUserId: currentUser?.id,
            toUserId: peerId,
            channelId: currentChannelId,
            sdp: JSON.stringify(offer),
          });
        }
      }

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
  }, [stopScreenShare, publish, currentUser, currentChannelId]);

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
