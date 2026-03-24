// Global state
let state = {
    currentUser: null,
    currentServer: null,
    currentChannel: null,
    servers: [],
    channels: [],
    messages: [],
    voiceSession: null,
    voiceConnection: null,
    localStream: null,
    peerConnections: new Map(),
    isMicEnabled: true,
    isCameraEnabled: true,
    typingUsers: new Set()
};

// WebSocket connection
let stompClient = null;

// Initialize application
document.addEventListener('DOMContentLoaded', async function() {
    // Get current user from session/auth - MUST wait before doing anything
    await getCurrentUser();
    
    // Setup WebSocket
    connectWebSocket();
    
    // Event listeners
    setupEventListeners();
    
    // Load user's servers
    loadUserServers();
});

function setupEventListeners() {
    // Message input
    const messageInput = document.getElementById('messageInput');
    const sendBtn = document.getElementById('sendBtn');
    
    sendBtn.addEventListener('click', sendMessage);
    messageInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    });
    
    messageInput.addEventListener('input', function() {
        if (stompClient && state.currentChannel) {
            const message = {
                channelId: state.currentChannel.id,
                serverId: state.currentServer.id,
                userId: state.currentUser.id,
                userName: state.currentUser.name,
                userAvatar: state.currentUser.profilePicture,
                action: 'typing'
            };
            stompClient.send(
                `/app/typing/${state.currentServer.id}/${state.currentChannel.id}`,
                {},
                JSON.stringify(message)
            );
        }
    });
    
    // Voice/Video buttons
    document.getElementById('voiceCallBtn').addEventListener('click', startVoiceCall);
    document.getElementById('videoCallBtn').addEventListener('click', startVideoCall);
    document.getElementById('micBtn').addEventListener('click', toggleMic);
    document.getElementById('cameraBtn').addEventListener('click', toggleCamera);
    document.getElementById('endCallBtn').addEventListener('click', endCall);
}

function connectWebSocket() {
    const socket = new SockJS('/ws-chat');
    stompClient = Stomp.over(socket);
    
    stompClient.connect({}, function(frame) {
        console.log('WebSocket conectado:', frame);
        
        // Subscribe to private signaling channel
        stompClient.subscribe('/user/queue/webrtc.signal', handleWebRTCSignal);
    }, function(error) {
        console.error('Erro ao conectar WebSocket:', error);
        // Retry connection after 3 seconds
        setTimeout(connectWebSocket, 3000);
    });
}

async function getCurrentUser() {
    try {
        const response = await fetch('/api/auth/me');
        if (response.ok) {
            const userData = await response.json();
            state.currentUser = {
                id: userData.id,           // MongoDB ObjectId thực
                googleId: userData.googleId,
                name: userData.name,
                email: userData.email,
                profilePicture: userData.picture || 'https://ui-avatars.com/api/?name=' + encodeURIComponent(userData.name)
            };
            console.log('User loaded:', state.currentUser.name);
        } else {
            console.error('Không thể lấy thông tin user, chuyển về trang đăng nhập');
            window.location.href = '/login';
        }
    } catch (error) {
        console.error('Lỗi khi lấy thông tin user:', error);
        window.location.href = '/login';
    }
}

async function loadUserServers() {
    try {
        const response = await fetch(`/api/servers/user/${state.currentUser.id}`);
        if (response.ok) {
            state.servers = await response.json();
            renderServers();
        }
    } catch (error) {
        console.error('Erro ao carregar servidores:', error);
    }
}

function renderServers() {
    const serverList = document.getElementById('serverList');
    serverList.innerHTML = '<div class="server-item" data-server-id="create"><div class="server-name">➕ Novo</div></div>';
    
    state.servers.forEach(server => {
        const item = document.createElement('div');
        item.className = 'server-item';
        item.dataset.serverId = server.id;
        item.innerHTML = `<div class="server-name">${server.name.substring(0, 2).toUpperCase()}</div>`;
        item.addEventListener('click', () => selectServer(server));
        serverList.appendChild(item);
    });
    
    // Create new server button
    serverList.querySelector('[data-server-id="create"]').addEventListener('click', () => {
        showCreateServerModal();
    });
}

async function selectServer(server) {
    state.currentServer = server;
    state.currentChannel = null;
    
    // Update active indicator
    document.querySelectorAll('.server-item').forEach(el => el.classList.remove('active'));
    document.querySelector(`[data-server-id="${server.id}"]`).classList.add('active');
    
    // Load channels
    await loadServerChannels(server.id);
    
    // Clear messages
    document.getElementById('messagesArea').innerHTML = '<div class="empty-state"><p>Selecione um canal</p></div>';
    document.getElementById('inputArea').style.display = 'none';
}

async function loadServerChannels(serverId) {
    try {
        const response = await fetch(`/api/channels/server/${serverId}`);
        if (response.ok) {
            state.channels = await response.json();
            renderChannels();
        }
    } catch (error) {
        console.error('Erro ao carregar canais:', error);
    }
}

function renderChannels() {
    const channelsList = document.getElementById('channelsList');
    channelsList.innerHTML = '';
    
    // Text channels
    const textChannels = state.channels.filter(ch => ch.type === 'TEXT');
    const voiceChannels = state.channels.filter(ch => ch.type === 'VOICE');
    
    if (textChannels.length > 0) {
        const textGroup = document.createElement('div');
        textGroup.className = 'channel-group';
        textGroup.innerHTML = '<div class="channel-group-title">CANAIS DE TEXTO</div>';
        
        textChannels.forEach(channel => {
            const item = document.createElement('div');
            item.className = 'channel-item';
            item.innerHTML = `<span class="channel-icon text-icon">#</span><span class="channel-name">${channel.name}</span>`;
            item.addEventListener('click', () => selectChannel(channel));
            textGroup.appendChild(item);
        });
        
        channelsList.appendChild(textGroup);
    }
    
    if (voiceChannels.length > 0) {
        const voiceGroup = document.createElement('div');
        voiceGroup.className = 'channel-group';
        voiceGroup.innerHTML = '<div class="channel-group-title">CANAIS DE VOZ</div>';
        
        voiceChannels.forEach(channel => {
            const item = document.createElement('div');
            item.className = 'channel-item';
            item.innerHTML = `<span class="channel-icon voice-icon">🔊</span><span class="channel-name">${channel.name}</span>`;
            item.addEventListener('click', () => selectChannel(channel));
            voiceGroup.appendChild(item);
        });
        
        channelsList.appendChild(voiceGroup);
    }
    
    // Add channel button
    const addBtn = document.createElement('div');
    addBtn.className = 'channel-item';
    addBtn.style.margin = '8px';
    addBtn.innerHTML = '<span class="channel-icon">➕</span><span class="channel-name">Novo Canal</span>';
    addBtn.addEventListener('click', () => showCreateChannelModal());
    channelsList.appendChild(addBtn);
}

async function selectChannel(channel) {
    state.currentChannel = channel;
    
    // Update active indicator
    document.querySelectorAll('.channel-item').forEach(el => el.classList.remove('active'));
    event.target.closest('.channel-item').classList.add('active');
    
    // Update header
    document.getElementById('headerTitle').textContent = `# ${channel.name}`;
    
    if (channel.type === 'TEXT') {
        // Load text messages
        await loadMessages(channel.id);
        document.getElementById('inputArea').style.display = 'block';
        document.getElementById('voiceCallArea').classList.remove('active');
        
        // Subscribe to WebSocket messages
        if (stompClient) {
            stompClient.subscribe(`/topic/channel/${state.currentServer.id}/${channel.id}`, handleIncomingMessage);
            stompClient.subscribe(`/topic/typing/${state.currentServer.id}/${channel.id}`, handleTypingIndicator);
        }
    } else if (channel.type === 'VOICE') {
        document.getElementById('inputArea').style.display = 'none';
        document.getElementById('voiceCallBtn').style.display = 'inline-block';
        document.getElementById('videoCallBtn').style.display = 'inline-block';
    }
}

async function loadMessages(channelId) {
    try {
        const response = await fetch(`/api/messages/channel/${channelId}`);
        if (response.ok) {
            state.messages = await response.json();
            renderMessages();
        }
    } catch (error) {
        console.error('Erro ao carregar mensagens:', error);
    }
}

function renderMessages() {
    const messagesArea = document.getElementById('messagesArea');
    messagesArea.innerHTML = '';
    
    if (state.messages.length === 0) {
        messagesArea.innerHTML = '<div class="empty-state"><p>Sem mensagens ainda</p></div>';
        return;
    }
    
    // Sort messages by timestamp
    const sortedMessages = [...state.messages].sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
    
    sortedMessages.forEach(message => {
        const messageEl = document.createElement('div');
        messageEl.className = 'message';
        
        const time = new Date(message.timestamp).toLocaleTimeString('vi-VN', {
            hour: '2-digit',
            minute: '2-digit'
        });
        
        const initials = (message.userName || 'U').charAt(0).toUpperCase();
        const avatarHtml = message.userAvatar && message.userAvatar.startsWith('http')
            ? `<img src="${message.userAvatar}" alt="${message.userName}" class="message-avatar" onerror="this.outerHTML='<div class=\\'message-avatar\\'>${initials}</div>'">`
            : `<div class="message-avatar">${initials}</div>`;
        
        messageEl.innerHTML = `
            ${avatarHtml}
            <div class="message-content">
                <div class="message-header">
                    <span class="message-author">${escapeHtml(message.userName || 'Unknown')}</span>
                    <span class="message-timestamp">${time}</span>
                </div>
                <div class="message-text">${escapeHtml(message.content)}</div>
            </div>
        `;
        
        messagesArea.appendChild(messageEl);
    });
    
    // Scroll to bottom
    messagesArea.scrollTop = messagesArea.scrollHeight;
}

function handleIncomingMessage(message) {
    const msg = JSON.parse(message.body);
    
    if (msg.action === 'send') {
        // Add to messages
        state.messages.push({
            id: Math.random().toString(36).substr(2, 9),
            channelId: msg.channelId,
            userId: msg.userId,
            userName: msg.userName,
            userAvatar: msg.userAvatar,
            content: msg.content,
            timestamp: new Date().toISOString()
        });
        
        renderMessages();
    }
}

function handleTypingIndicator(message) {
    const msg = JSON.parse(message.body);
    
    if (msg.action === 'typing' && msg.userId !== state.currentUser.id) {
        state.typingUsers.add(msg.userId);
        
        // Show typing indicator
        const messagesArea = document.getElementById('messagesArea');
        let typingEl = document.getElementById('typingIndicator');
        if (!typingEl) {
            typingEl = document.createElement('div');
            typingEl.id = 'typingIndicator';
            typingEl.className = 'message';
            messagesArea.appendChild(typingEl);
        }
        
        const typingNames = Array.from(state.typingUsers).map(id => {
            const channel = state.channels.find(ch => ch.id === state.currentChannel.id);
            return 'Usuário';
        }).join(', ');
        
        typingEl.innerHTML = `
            <div class="message-avatar" style="background: #72767d;"></div>
            <div class="message-content">
                <div class="message-header">
                    <span class="message-author">${typingNames}</span>
                    <span class="message-timestamp">digitando...</span>
                </div>
                <div class="typing-indicator">
                    <div class="typing-dot"></div>
                    <div class="typing-dot"></div>
                    <div class="typing-dot"></div>
                </div>
            </div>
        `;
        
        // Remove after 3 seconds
        setTimeout(() => {
            state.typingUsers.delete(msg.userId);
            if (state.typingUsers.size === 0 && typingEl) {
                typingEl.remove();
            }
        }, 3000);
    }
}

function sendMessage() {
    const input = document.getElementById('messageInput');
    const content = input.value.trim();
    
    if (!content || !state.currentChannel || state.currentChannel.type !== 'TEXT') {
        return;
    }
    
    const message = {
        channelId: state.currentChannel.id,
        serverId: state.currentServer.id,
        userId: state.currentUser.id,
        userName: state.currentUser.name,
        userAvatar: state.currentUser.profilePicture,
        content: content,
        action: 'send'
    };
    
    if (stompClient) {
        stompClient.send(
            `/app/chat/${state.currentServer.id}/${state.currentChannel.id}`,
            {},
            JSON.stringify(message)
        );
    }
    
    input.value = '';
    input.focus();
}

// WebRTC Signaling Handler
function handleWebRTCSignal(message) {
    const signal = JSON.parse(message.body);
    console.log('Recebido sinal WebRTC:', signal.type, 'de:', signal.from);
    
    switch(signal.type) {
        case 'OFFER':
            handleOffer(signal);
            break;
        case 'ANSWER':
            handleAnswer(signal);
            break;
        case 'CANDIDATE':
            handleCandidate(signal);
            break;
    }
}

async function handleOffer(signal) {
    const pc = getOrCreatePeerConnection(signal.from);
    try {
        await pc.setRemoteDescription(new RTCSessionDescription(signal.data));
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        
        sendSignal('ANSWER', signal.from, answer);
    } catch (e) {
        console.error('Erro ao processar Offer:', e);
    }
}

async function handleAnswer(signal) {
    const pc = state.peerConnections.get(signal.from);
    if (pc) {
        try {
            await pc.setRemoteDescription(new RTCSessionDescription(signal.data));
        } catch (e) {
            console.error('Erro ao processar Answer:', e);
        }
    }
}

async function handleCandidate(signal) {
    const pc = getOrCreatePeerConnection(signal.from);
    if (pc) {
        try {
            await pc.addIceCandidate(new RTCIceCandidate(signal.data));
        } catch (e) {
            console.error('Erro ao processar Candidate:', e);
        }
    }
}

function sendSignal(type, to, data) {
    if (stompClient) {
        stompClient.send('/app/webrtc.signal', {}, JSON.stringify({
            type: type,
            from: state.currentUser.id,
            to: to,
            data: data
        }));
    }
}

function getOrCreatePeerConnection(userId) {
    if (state.peerConnections.has(userId)) {
        return state.peerConnections.get(userId);
    }
    
    const pc = new RTCPeerConnection({
        iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
    });
    
    // Add local stream tracks
    if (state.localStream) {
        state.localStream.getTracks().forEach(track => {
            pc.addTrack(track, state.localStream);
        });
    }
    
    pc.onicecandidate = (event) => {
        if (event.candidate) {
            sendSignal('CANDIDATE', userId, event.candidate);
        }
    };
    
    pc.ontrack = (event) => {
        console.log('Recebido track de:', userId);
        const remoteVideo = document.querySelector(`#video-${userId} video`);
        if (remoteVideo) {
            remoteVideo.srcObject = event.streams[0];
        }
    };
    
    state.peerConnections.set(userId, pc);
    return pc;
}

// Voice/Video functions
async function startVoiceCall() {
    console.log('Iniciando chamada de voz...');
    
    try {
        // Get user media
        state.localStream = await navigator.mediaDevices.getUserMedia({ 
            audio: true, 
            video: false 
        });
        
        // Create voice session
        const response = await fetch(
            `/api/voice/session/create?channelId=${state.currentChannel.id}&serverId=${state.currentServer.id}`,
            { method: 'POST' }
        );
        
        if (response.ok) {
            state.voiceSession = await response.json();
            
            // Add participant
            await fetch(
                `/api/voice/session/${state.voiceSession.id}/participant?userId=${state.currentUser.id}&userName=${state.currentUser.name}&userAvatar=${state.currentUser.profilePicture}`,
                { method: 'POST' }
            );
            
            // Show voice call area
            document.getElementById('voiceCallArea').classList.add('active');
            document.getElementById('inputArea').style.display = 'none';
            
            // Load participants and initiate connections
            const sessions = await loadVoiceParticipants();
            if (sessions && sessions.length > 0) {
                const session = sessions[0];
                session.participants
                    .filter(p => p.userId !== state.currentUser.id)
                    .forEach(async participant => {
                        console.log('Iniciando conexão com:', participant.userName);
                        const pc = getOrCreatePeerConnection(participant.userId);
                        const offer = await pc.createOffer();
                        await pc.setLocalDescription(offer);
                        sendSignal('OFFER', participant.userId, offer);
                    });
            }
        }
    } catch (error) {
        console.error('Erro ao iniciar chamada de voz:', error);
        alert('Erro ao acessar microfone: ' + error.message);
    }
}

async function startVideoCall() {
    console.log('Iniciando videochamada...');
    
    try {
        // Get user media
        state.localStream = await navigator.mediaDevices.getUserMedia({ 
            audio: true, 
            video: true 
        });
        
        // Create voice session
        const response = await fetch(
            `/api/voice/session/create?channelId=${state.currentChannel.id}&serverId=${state.currentServer.id}`,
            { method: 'POST' }
        );
        
        if (response.ok) {
            state.voiceSession = await response.json();
            
            // Add participant
            await fetch(
                `/api/voice/session/${state.voiceSession.id}/participant?userId=${state.currentUser.id}&userName=${state.currentUser.name}&userAvatar=${state.currentUser.profilePicture}`,
                { method: 'POST' }
            );
            
            // Show voice call area
            document.getElementById('voiceCallArea').classList.add('active');
            document.getElementById('inputArea').style.display = 'none';
            
            // Display local video
            displayLocalVideo();
            
            // Load participants and initiate connections
            const sessions = await loadVoiceParticipants();
            if (sessions && sessions.length > 0) {
                const session = sessions[0];
                session.participants
                    .filter(p => p.userId !== state.currentUser.id)
                    .forEach(async participant => {
                        console.log('Iniciando conexão com:', participant.userName);
                        const pc = getOrCreatePeerConnection(participant.userId);
                        const offer = await pc.createOffer();
                        await pc.setLocalDescription(offer);
                        sendSignal('OFFER', participant.userId, offer);
                    });
            }
        }
    } catch (error) {
        console.error('Erro ao iniciar videochamada:', error);
        alert('Erro ao acessar câmera/microfone: ' + error.message);
    }
}

function displayLocalVideo() {
    const grid = document.getElementById('participantsGrid');
    
    let participant = grid.querySelector('[data-user-id="local"]');
    if (!participant) {
        participant = document.createElement('div');
        participant.className = 'participant-card';
        participant.dataset.userId = 'local';
        participant.innerHTML = `
            <div class="video-container">
                <video id="localVideo" autoplay muted playsinline></video>
            </div>
            <div class="participant-info">
                <span class="participant-name">Você</span>
                <div class="participant-status">
                    <span class="status-icon mic-on" title="Microfone">🎤</span>
                    <span class="status-icon camera-on" title="Câmera">📹</span>
                </div>
            </div>
        `;
        grid.appendChild(participant);
    }
    
    const video = document.getElementById('localVideo');
    if (video && state.localStream) {
        video.srcObject = state.localStream;
    }
}

async function loadVoiceParticipants() {
    try {
        const response = await fetch(`/api/voice/active/${state.currentChannel.id}`);
        if (response.ok) {
            const sessions = await response.json();
            if (sessions.length > 0) {
                const session = sessions[0];
                state.voiceSession = session;
                
                const grid = document.getElementById('participantsGrid');
                grid.innerHTML = '';
                
                // Display local video first
                if (state.localStream) {
                    displayLocalVideo();
                }
                
                // Display other participants
                session.participants
                    .filter(p => p.userId !== state.currentUser.id)
                    .forEach(participant => {
                        const card = document.createElement('div');
                        card.className = 'participant-card';
                        card.dataset.userId = participant.userId;
                        
                        const micIcon = participant.micEnabled ? '🎤' : '🔇';
                        const cameraIcon = participant.cameraEnabled ? '📹' : '📷';
                        const micClass = participant.micEnabled ? 'mic-on' : 'mic-off';
                        const cameraClass = participant.cameraEnabled ? 'camera-on' : 'camera-off';
                        
                        card.innerHTML = `
                            <div class="video-container" id="video-${participant.userId}">
                                <video playsinline autoplay></video>
                            </div>
                            <div class="participant-info">
                                <span class="participant-name">${participant.userName}</span>
                                <div class="participant-status">
                                    <span class="status-icon ${micClass}">${micIcon}</span>
                                    <span class="status-icon ${cameraClass}">${cameraIcon}</span>
                                </div>
                            </div>
                        `;
                        grid.appendChild(card);
                    });
                return sessions;
            }
        }
    } catch (error) {
        console.error('Erro ao carregar participantes:', error);
    }
    return [];
}

function toggleMic() {
    if (state.localStream) {
        state.isMicEnabled = !state.isMicEnabled;
        state.localStream.getAudioTracks().forEach(track => {
            track.enabled = state.isMicEnabled;
        });
        
        const btn = document.getElementById('micBtn');
        btn.classList.toggle('off', !state.isMicEnabled);
        
        // Update in voice session
        if (state.voiceSession) {
            fetch(
                `/api/voice/session/${state.voiceSession.id}/participant/${state.currentUser.id}/mic?enabled=${state.isMicEnabled}`,
                { method: 'PUT' }
            ).then(response => response.json())
            .then(session => {
                state.voiceSession = session;
                loadVoiceParticipants();
            });
        }
    }
}

function toggleCamera() {
    if (state.localStream) {
        state.isCameraEnabled = !state.isCameraEnabled;
        state.localStream.getVideoTracks().forEach(track => {
            track.enabled = state.isCameraEnabled;
        });
        
        const btn = document.getElementById('cameraBtn');
        btn.classList.toggle('off', !state.isCameraEnabled);
        
        // Update in voice session
        if (state.voiceSession) {
            fetch(
                `/api/voice/session/${state.voiceSession.id}/participant/${state.currentUser.id}/camera?enabled=${state.isCameraEnabled}`,
                { method: 'PUT' }
            ).then(response => response.json())
            .then(session => {
                state.voiceSession = session;
                loadVoiceParticipants();
            });
        }
    }
}

async function endCall() {
    console.log('Encerrando chamada...');
    
    // Stop all tracks
    if (state.localStream) {
        state.localStream.getTracks().forEach(track => track.stop());
        state.localStream = null;
    }
    
    // Close all peer connections
    state.peerConnections.forEach(pc => pc.close());
    state.peerConnections.clear();
    
    // Remove participant from session
    if (state.voiceSession) {
        await fetch(
            `/api/voice/session/${state.voiceSession.id}/participant/${state.currentUser.id}`,
            { method: 'DELETE' }
        );
        
        // End session if no participants
        await fetch(
            `/api/voice/session/${state.voiceSession.id}/end`,
            { method: 'PUT' }
        );
        
        state.voiceSession = null;
    }
    
    document.getElementById('voiceCallArea').classList.remove('active');
    document.getElementById('inputArea').style.display = 'block';
    document.getElementById('voiceCallBtn').style.display = 'none';
    document.getElementById('videoCallBtn').style.display = 'none';
}

// Server/Channel creation
function showCreateServerModal() {
    document.getElementById('createServerModal').classList.add('active');
}

function showCreateChannelModal() {
    document.getElementById('createChannelModal').classList.add('active');
}

function closeModal(modalId) {
    document.getElementById(modalId).classList.remove('active');
}

async function createServer() {
    const name = document.getElementById('serverName').value.trim();
    const description = document.getElementById('serverDesc').value.trim();
    
    if (!name) {
        alert('Por favor, insira um nome para o servidor');
        return;
    }
    
    try {
        const response = await fetch(
            `/api/servers/create?name=${encodeURIComponent(name)}&description=${encodeURIComponent(description)}&ownerId=${state.currentUser.id}`,
            { method: 'POST' }
        );
        
        if (response.ok) {
            const server = await response.json();
            state.servers.push(server);
            renderServers();
            selectServer(server);
            closeModal('createServerModal');
            document.getElementById('serverName').value = '';
            document.getElementById('serverDesc').value = '';
        }
    } catch (error) {
        console.error('Erro ao criar servidor:', error);
        alert('Erro ao criar servidor');
    }
}

async function createChannel() {
    const name = document.getElementById('channelName').value.trim();
    const type = document.getElementById('channelType').value;
    
    if (!name || !state.currentServer) {
        alert('Por favor, insira um nome para o canal');
        return;
    }
    
    try {
        const response = await fetch(
            `/api/channels/create?serverId=${state.currentServer.id}&name=${encodeURIComponent(name)}&description=&type=${type}&creatorId=${state.currentUser.id}`,
            { method: 'POST' }
        );
        
        if (response.ok) {
            const channel = await response.json();
            state.channels.push(channel);
            renderChannels();
            selectChannel(channel);
            closeModal('createChannelModal');
            document.getElementById('channelName').value = '';
        }
    } catch (error) {
        console.error('Erro ao criar canal:', error);
        alert('Erro ao criar canal');
    }
}

// Utils
function escapeHtml(text) {
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, m => map[m]);
}

// Close modals on outside click
document.addEventListener('click', function(e) {
    if (e.target.classList.contains('modal')) {
        e.target.classList.remove('active');
    }
});
