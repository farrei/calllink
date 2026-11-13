// CallLink - Chamada de Voz P2P com PeerJS + WebRTC
// 100% estático, pronto para GitHub Pages

(function () {
    'use strict';

    // Elementos da UI
    const lobby = document.getElementById('lobby');
    const incomingScreen = document.getElementById('incoming');
    const callScreen = document.getElementById('call-screen');
    const myIdEl = document.getElementById('my-id');
    const copyLinkBtn = document.getElementById('copy-link');
    const remoteIdInput = document.getElementById('remote-id');
    const callBtn = document.getElementById('call-btn');
    const incomingIdEl = document.getElementById('incoming-id');
    const answerBtn = document.getElementById('answer-btn');
    const rejectBtn = document.getElementById('reject-btn');
    const statusEl = document.getElementById('call-status');
    const timerEl = document.getElementById('call-timer');
    const muteBtn = document.getElementById('mute-btn');
    const speakerBtn = document.getElementById('speaker-btn');
    const hangupBtn = document.getElementById('hangup-btn');
    const visualizerCanvas = document.getElementById('visualizer');
    const remoteAudio = document.getElementById('remote-audio');

    // Estado da aplicação
    let peer = null;
    let localStream = null;
    let currentCall = null;
    let isMuted = false;
    let callStartTime = null;
    let timerInterval = null;
    let audioContext = null;
    let analyser = null;
    let animationId = null;
    let ringtoneInterval = null;

    // Constraints de áudio com qualidade
    const mediaConstraints = {
        audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
            sampleRate: 48000
        },
        video: false
    };

    // Configuração PeerJS + STUN
    const peerOptions = {
        config: {
            iceServers: [
                { urls: 'stun:stun.l.google.com:19302' },
                { urls: 'stun:stun1.l.google.com:19302' }
            ]
        }
    };

    // ========== Inicialização ==========
    function init() {
        setupPeer();
        setupEventListeners();
        checkUrlParams();
    }

    function setupPeer() {
        peer = new Peer(undefined, peerOptions);

        peer.on('open', (id) => {
            myIdEl.textContent = id;
            copyLinkBtn.disabled = false;
            callBtn.disabled = false;
            console.log('Peer pronto. ID:', id);
        });

        peer.on('call', (call) => {
            console.log('Chamada recebida de:', call.peer);
            showIncomingCall(call);
        });

        peer.on('error', (err) => {
            console.error('Erro PeerJS:', err);
            showError('Erro de conexão: ' + err.message);
        });

        peer.on('disconnected', () => {
            statusEl.textContent = 'Reconectando...';
            peer.reconnect();
        });
    }

    function checkUrlParams() {
        const params = new URLSearchParams(window.location.search);
        const callId = params.get('call');
        if (callId) {
            remoteIdInput.value = callId;
            // Espera o peer estar aberto antes de ligar
            const tryCall = () => {
                if (peer && peer.open) {
                    startCall(callId);
                } else {
                    setTimeout(tryCall, 300);
                }
            };
            setTimeout(tryCall, 500);
        }
    }

    // ========== Chamadas ==========
    async function startCall(remoteId) {
        if (!remoteId || remoteId === peer.id) {
            showError('ID inválido');
            return;
        }

        try {
            statusEl.textContent = 'Conectando...';
            showScreen(callScreen);

            localStream = await getLocalStream();
            const call = peer.call(remoteId, localStream);
            handleCall(call);
        } catch (err) {
            console.error(err);
            showError('Não foi possível acessar o microfone. Verifique as permissões.');
            showScreen(lobby);
        }
    }

    function showIncomingCall(call) {
        currentCall = call;
        incomingIdEl.textContent = call.peer;
        showScreen(incomingScreen);
        playRingtone();
    }

    async function answerCall() {
        stopRingtone();
        try {
            localStream = await getLocalStream();
            currentCall.answer(localStream);
            handleCall(currentCall);
            showScreen(callScreen);
        } catch (err) {
            console.error(err);
            showError('Erro ao atender a chamada.');
            rejectCall();
        }
    }

    function rejectCall() {
        stopRingtone();
        if (currentCall) {
            currentCall.close();
        }
        currentCall = null;
        showScreen(lobby);
    }

    function handleCall(call) {
        currentCall = call;
        statusEl.textContent = 'Conectando...';

        call.on('stream', (remoteStream) => {
            remoteAudio.srcObject = remoteStream;
            statusEl.textContent = 'Em chamada';
            startTimer();
            setupVisualizer(localStream, remoteStream);
        });

        call.on('close', () => {
            endCall();
        });

        call.on('error', (err) => {
            console.error('Erro na chamada:', err);
            endCall();
        });
    }

    async function getLocalStream() {
        try {
            return await navigator.mediaDevices.getUserMedia(mediaConstraints);
        } catch (err) {
            if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
                throw new Error('Permissão de microfone negada');
            }
            throw err;
        }
    }

    function endCall() {
        if (currentCall) {
            currentCall.close();
            currentCall = null;
        }
        if (localStream) {
            localStream.getTracks().forEach(track => track.stop());
            localStream = null;
        }
        remoteAudio.srcObject = null;
        stopTimer();
        stopVisualizer();
        statusEl.textContent = 'Chamada encerrada';
        setTimeout(() => showScreen(lobby), 800);
    }

    // ========== UI Helpers ==========
    function showScreen(screen) {
        document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
        screen.classList.add('active');
    }

    function showError(message) {
        alert(message); // Em produção poderia ser um toast
    }

    // ========== Timer ==========
    function startTimer() {
        callStartTime = Date.now();
        timerInterval = setInterval(() => {
            const elapsed = Math.floor((Date.now() - callStartTime) / 1000);
            const mins = String(Math.floor(elapsed / 60)).padStart(2, '0');
            const secs = String(elapsed % 60).padStart(2, '0');
            timerEl.textContent = `${mins}:${secs}`;
        }, 1000);
    }

    function stopTimer() {
        if (timerInterval) {
            clearInterval(timerInterval);
            timerInterval = null;
        }
        timerEl.textContent = '00:00';
    }

    // ========== Mute ==========
    function toggleMute() {
        if (!localStream) return;
        isMuted = !isMuted;
        localStream.getAudioTracks().forEach(track => {
            track.enabled = !isMuted;
        });
        muteBtn.classList.toggle('muted', isMuted);
        muteBtn.querySelector('.label').textContent = isMuted ? 'Desmutar' : 'Mudo';
    }

    // ========== Testar Áudio (Web Audio API) ==========
    function testAudio() {
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.frequency.value = 440;
        gain.gain.setValueAtTime(0.15, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.6);
        osc.start();
        osc.stop(ctx.currentTime + 0.6);
    }

    // ========== Ringtone (Web Audio API) ==========
    function playRingtone() {
        stopRingtone();
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        let playing = false;

        function playTone() {
            if (!playing) return;
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.frequency.value = 800;
            gain.gain.setValueAtTime(0.08, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
            osc.start();
            osc.stop(ctx.currentTime + 0.3);
        }

        playing = true;
        playTone();
        ringtoneInterval = setInterval(playTone, 1200);
    }

    function stopRingtone() {
        if (ringtoneInterval) {
            clearInterval(ringtoneInterval);
            ringtoneInterval = null;
        }
    }

    // ========== Visualizador de Áudio ==========
    function setupVisualizer(local, remote) {
        stopVisualizer();
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
        analyser = audioContext.createAnalyser();
        analyser.fftSize = 256;

        // Mistura local + remoto (ou só o que estiver disponível)
        if (local) {
            const localSource = audioContext.createMediaStreamSource(local);
            localSource.connect(analyser);
        }
        if (remote) {
            const remoteSource = audioContext.createMediaStreamSource(remote);
            remoteSource.connect(analyser);
        }

        drawVisualizer();
    }

    function drawVisualizer() {
        if (!analyser) return;
        const ctx = visualizerCanvas.getContext('2d');
        const bufferLength = analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);

        function draw() {
            animationId = requestAnimationFrame(draw);
            analyser.getByteFrequencyData(dataArray);

            ctx.fillStyle = 'rgba(10, 10, 15, 0.4)';
            ctx.fillRect(0, 0, visualizerCanvas.width, visualizerCanvas.height);

            const barWidth = (visualizerCanvas.width / bufferLength) * 2.5;
            let x = 0;

            for (let i = 0; i < bufferLength; i++) {
                const barHeight = (dataArray[i] / 255) * visualizerCanvas.height * 0.8;
                const gradient = ctx.createLinearGradient(0, visualizerCanvas.height, 0, visualizerCanvas.height - barHeight);
                gradient.addColorStop(0, '#00d4aa');
                gradient.addColorStop(1, '#7c4dff');
                ctx.fillStyle = gradient;
                ctx.fillRect(x, visualizerCanvas.height - barHeight, barWidth - 1, barHeight);
                x += barWidth;
            }
        }
        draw();
    }

    function stopVisualizer() {
        if (animationId) {
            cancelAnimationFrame(animationId);
            animationId = null;
        }
        if (audioContext) {
            audioContext.close().catch(() => {});
            audioContext = null;
        }
        analyser = null;
        const ctx = visualizerCanvas.getContext('2d');
        ctx.clearRect(0, 0, visualizerCanvas.width, visualizerCanvas.height);
    }

    // ========== Event Listeners ==========
    function setupEventListeners() {
        copyLinkBtn.addEventListener('click', () => {
            const url = `${window.location.origin}${window.location.pathname}?call=${peer.id}`;
            navigator.clipboard.writeText(url).then(() => {
                const original = copyLinkBtn.textContent;
                copyLinkBtn.textContent = 'Link Copiado!';
                setTimeout(() => copyLinkBtn.textContent = original, 2000);
            }).catch(() => {
                // Fallback
                prompt('Copie o link:', url);
            });
        });

        callBtn.addEventListener('click', () => {
            const id = remoteIdInput.value.trim();
            if (id) startCall(id);
        });

        remoteIdInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') callBtn.click();
        });

        answerBtn.addEventListener('click', answerCall);
        rejectBtn.addEventListener('click', rejectCall);
        muteBtn.addEventListener('click', toggleMute);
        speakerBtn.addEventListener('click', testAudio);
        hangupBtn.addEventListener('click', endCall);
    }

    // Iniciar quando o DOM estiver pronto
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();