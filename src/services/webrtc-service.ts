import { db } from '@/lib/firebase.config';
import {
    collection,
    doc,
    onSnapshot,
    setDoc,
    updateDoc,
    addDoc,
    getDoc,
    query,
    where,
    getDocs,
    deleteDoc,
} from 'firebase/firestore';

// Configuration for ICE servers (STUN/TURN)
const rtcConfig = {
    iceServers: [
        {
            urls: ['stun:stun1.l.google.com:19302', 'stun:stun2.l.google.com:19302'],
        },
    ],
    iceCandidatePoolSize: 10,
};

export const webrtcService = {
    // Re-implementing with cleaner separation
    startHosting: (livestreamId: string, localStream: MediaStream) => {
        const peerConnections: { [userId: string]: RTCPeerConnection } = {};

        const viewersRef = collection(db, 'livestreams', livestreamId, 'viewers');

        const unsubscribe = onSnapshot(viewersRef, (snapshot) => {
            snapshot.docChanges().forEach(async (change) => {
                if (change.type === 'added') {
                    const viewerId = change.doc.id;
                    const pc = new RTCPeerConnection(rtcConfig);
                    peerConnections[viewerId] = pc;

                    // ICE Candidate Queue
                    const candidateQueue: RTCIceCandidate[] = [];

                    localStream.getTracks().forEach(track => pc.addTrack(track, localStream));

                    // ICE Candidates: Creator -> Viewer
                    const creatorCandidatesRef = collection(db, 'livestreams', livestreamId, 'viewers', viewerId, 'creatorCandidates');
                    pc.onicecandidate = (event) => {
                        if (event.candidate) {
                            addDoc(creatorCandidatesRef, event.candidate.toJSON());
                        }
                    };

                    // Create Offer
                    const offer = await pc.createOffer();
                    await pc.setLocalDescription(offer);

                    await setDoc(doc(db, 'livestreams', livestreamId, 'viewers', viewerId), {
                        offer: { type: offer.type, sdp: offer.sdp }
                    }, { merge: true });

                    // Listen for Answer
                    const viewerDocRef = doc(db, 'livestreams', livestreamId, 'viewers', viewerId);
                    onSnapshot(viewerDocRef, async (snap) => {
                        const data = snap.data();
                        if (pc.signalingState === 'have-local-offer' && data?.answer) {
                            const answer = new RTCSessionDescription(data.answer);
                            await pc.setRemoteDescription(answer);

                            // Process queued candidates
                            while (candidateQueue.length > 0) {
                                const candidate = candidateQueue.shift();
                                if (candidate) {
                                    await pc.addIceCandidate(candidate);
                                }
                            }
                        }
                    });

                    // Listen for Viewer Candidates
                    const viewerCandidatesRef = collection(db, 'livestreams', livestreamId, 'viewers', viewerId, 'viewerCandidates');
                    onSnapshot(viewerCandidatesRef, (snap) => {
                        snap.docChanges().forEach(async (change) => {
                            if (change.type === 'added') {
                                const candidate = new RTCIceCandidate(change.doc.data());
                                if (pc.remoteDescription) {
                                    await pc.addIceCandidate(candidate);
                                } else {
                                    candidateQueue.push(candidate);
                                }
                            }
                        });
                    });
                } else if (change.type === 'removed') {
                    // Clean up peer connection when viewer leaves
                    const viewerId = change.doc.id;
                    if (peerConnections[viewerId]) {
                        console.log(`Viewer ${viewerId} left, closing connection`);
                        peerConnections[viewerId].close();
                        delete peerConnections[viewerId];
                    }
                }
            });
        });

        return () => {
            unsubscribe();
            Object.values(peerConnections).forEach(pc => pc.close());
        };
    },

    // Viewer: Join a livestream
    joinStream: async (livestreamId: string, userId: string, onTrack: (stream: MediaStream) => void) => {
        const pc = new RTCPeerConnection(rtcConfig);
        const candidateQueue: RTCIceCandidate[] = [];

        // Add a placeholder document to signal presence
        await setDoc(doc(db, 'livestreams', livestreamId, 'viewers', userId), {
            joined: true
        });

        // Log connection state changes
        pc.oniceconnectionstatechange = () => console.log('ICE State:', pc.iceConnectionState);
        pc.onsignalingstatechange = () => console.log('Signaling State:', pc.signalingState);

        // Handle incoming tracks
        pc.ontrack = (event) => {
            console.log('Received remote track');
            onTrack(event.streams[0]);
        };

        // ICE Candidates: Viewer -> Creator
        const viewerCandidatesRef = collection(db, 'livestreams', livestreamId, 'viewers', userId, 'viewerCandidates');
        pc.onicecandidate = (event) => {
            if (event.candidate) {
                addDoc(viewerCandidatesRef, event.candidate.toJSON());
            }
        };

        // Listen for Offer
        const viewerDocRef = doc(db, 'livestreams', livestreamId, 'viewers', userId);
        const unsubscribeSignaling = onSnapshot(viewerDocRef, async (snapshot) => {
            const data = snapshot.data();
            // Only process offer if we are in stable state and haven't set remote description yet (or it's a new offer)
            // For MVP, we assume one offer.
            if (pc.signalingState === 'stable' && data?.offer) {
                console.log('Received Offer');
                await pc.setRemoteDescription(new RTCSessionDescription(data.offer));

                const answer = await pc.createAnswer();
                await pc.setLocalDescription(answer);

                await updateDoc(viewerDocRef, {
                    answer: { type: answer.type, sdp: answer.sdp }
                });

                // Process queued candidates
                while (candidateQueue.length > 0) {
                    const candidate = candidateQueue.shift();
                    if (candidate) {
                        await pc.addIceCandidate(candidate);
                    }
                }
            }
        });

        // Listen for Creator Candidates
        const creatorCandidatesRef = collection(db, 'livestreams', livestreamId, 'viewers', userId, 'creatorCandidates');
        const unsubscribeCandidates = onSnapshot(creatorCandidatesRef, (snapshot) => {
            snapshot.docChanges().forEach(async (change) => {
                if (change.type === 'added') {
                    const candidate = new RTCIceCandidate(change.doc.data());
                    if (pc.remoteDescription) {
                        await pc.addIceCandidate(candidate);
                    } else {
                        candidateQueue.push(candidate);
                    }
                }
            });
        });

        return () => {
            unsubscribeSignaling();
            unsubscribeCandidates();
            pc.close();
            // Delete viewer doc on exit to trigger 'removed' event for creator
            deleteDoc(viewerDocRef);
        };
    }
};
