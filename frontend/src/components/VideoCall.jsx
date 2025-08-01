import React from 'react'

//camera.js
export const getLocalStream = async () => {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({
            video: true,
            audio: true,
        });
        return stream;
    } catch (error) {
        console.error("Kamera veya mikrofona erişilemedi:", error);
        return null;
    }
};




// peerConnection.js
export const createPeerConnection1 = () => {
    const peer = new RTCPeerConnection({
        iceServers: [
            {
                urls: "stun:stun.l.google.com:19302",
            },
        ],
    });

    peer.onicecandidate = (event) => {
        if (event.candidate) {
            // ICE candidate socket ile karşı tarafa gönderilecek
            console.log("Yeni ICE Adayı:", event.candidate);
        }
    };

    return peer;
};

//*!!!!!!!!!!!!!!!!
// signaling-server.js (veya mevcut socket sunucu dosyanız)
io.on("connection", (socket) => {
    const userId = socket.handshake.query.userId;
    if (userId) userSocketMap[userId] = socket.id;

    socket.on("call-user", ({ toUserId, offer }) => {
        const receiverSocketId = getReceiverSocketId(toUserId);
        if (receiverSocketId) {
            io.to(receiverSocketId).emit("incoming-call", {
                fromUserId: userId,
                offer,
            });
        }
    });

    socket.on("answer-call", ({ toUserId, answer }) => {
        const receiverSocketId = getReceiverSocketId(toUserId);
        if (receiverSocketId) {
            io.to(receiverSocketId).emit("call-answered", {
                fromUserId: userId,
                answer,
            });
        }
    });

    socket.on("ice-candidate", ({ toUserId, candidate }) => {
        const receiverSocketId = getReceiverSocketId(toUserId);
        if (receiverSocketId) {
            io.to(receiverSocketId).emit("ice-candidate", {
                fromUserId: userId,
                candidate,
            });
        }
    });

    socket.on("disconnect", () => {
        delete userSocketMap[userId];
        io.emit("getOnlineUsers", Object.keys(userSocketMap));
    });
});


// callHelper.js
export const createPeerConnection = (socket, localStream, onRemoteStream) => {
    const peer = new RTCPeerConnection({
        iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
    });

    // Local stream ekleniyor
    localStream.getTracks().forEach((track) => peer.addTrack(track, localStream));

    // ICE candidate oluştuğunda diğer tarafa gönder
    peer.onicecandidate = (event) => {
        if (event.candidate) {
            socket.emit("ice-candidate", {
                toUserId: targetedUserId,
                candidate: event.candidate,
            });
        }
    };

    // Uzak stream geldiğinde UI’ya ilet
    peer.ontrack = (event) => {
        onRemoteStream(event.streams[0]);
    };

    return peer;
};


// çağrı başlatma
const startCall = async (socket, peer, toUserId) => {
    const offer = await peer.createOffer();
    await peer.setLocalDescription(offer);
    socket.emit("call-user", { toUserId, offer });
};

// gelen teklife cevap
socket.on("incoming-call", async ({ fromUserId, offer }) => {
    await peer.setRemoteDescription(new RTCSessionDescription(offer));
    const answer = await peer.createAnswer();
    await peer.setLocalDescription(answer);
    socket.emit("answer-call", { toUserId: fromUserId, answer });
});

// karşıdan gelen cevap
socket.on("call-answered", async ({ answer }) => {
    await peer.setRemoteDescription(new RTCSessionDescription(answer));
});

// ICE candidate alma
socket.on("ice-candidate", async ({ candidate }) => {
    try {
        await peer.addIceCandidate(new RTCIceCandidate(candidate));
    } catch (err) {
        console.error("ICE candidate ekleme hatası:", err);
    }
});
