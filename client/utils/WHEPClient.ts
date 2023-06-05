const streamBase = "http://192.168.0.140:8889";
const restartPause = 2000;

const linkToIceServers = (links: any) =>
    links !== null
        ? links.split(", ").map((link: string) => {
              const m = link.match(
                  /^<(.+?)>; rel="ice-server"(; username="(.*?)"; credential="(.*?)"; credential-type="password")?/i,
              );
              const ret = {
                  urls: m ? [m[1]] : [],
                  username: "",
                  credential: "",
                  credentialType: "",
              };

              if (m && m[3] !== undefined) {
                  ret.username = m[3];
                  ret.credential = m[4];
                  ret.credentialType = "password";
              }

              return ret;
          })
        : [];

const parseOffer = (offer: any) => {
    const ret: { iceUfrag: string; icePwd: string; medias: string[] } = {
        iceUfrag: "",
        icePwd: "",
        medias: [],
    };

    for (const line of offer.split("\r\n")) {
        if (line.startsWith("m=")) {
            ret.medias.push(line.slice("m=".length));
        } else if (ret.iceUfrag === "" && line.startsWith("a=ice-ufrag:")) {
            ret.iceUfrag = line.slice("a=ice-ufrag:".length);
        } else if (ret.icePwd === "" && line.startsWith("a=ice-pwd:")) {
            ret.icePwd = line.slice("a=ice-pwd:".length);
        }
    }

    return ret;
};

const generateSdpFragment = (offerData: any, candidates: any) => {
    const candidatesByMedia: any = {};
    for (const candidate of candidates) {
        const mid = candidate.sdpMLineIndex;
        if (candidatesByMedia[mid] === undefined) {
            candidatesByMedia[mid] = [];
        }
        candidatesByMedia[mid].push(candidate);
    }

    let frag =
        "a=ice-ufrag:" + offerData.iceUfrag + "\r\n" + "a=ice-pwd:" + offerData.icePwd + "\r\n";

    let mid = 0;

    for (const media of offerData.medias) {
        if (candidatesByMedia[mid] !== undefined) {
            frag += "m=" + media + "\r\n" + "a=mid:" + mid + "\r\n";

            for (const candidate of candidatesByMedia[mid]) {
                frag += "a=" + candidate.candidate + "\r\n";
            }
        }
        mid++;
    }

    return frag;
};

export default class WHEPClient {
    fetchUrl: string;
    stream: string;
    pc: null | RTCPeerConnection = null;
    restartTimeout: null | number;
    eTag: null | string;
    queuedCandidates: any[];
    offerData: any;

    constructor(stream: string) {
        this.pc = null;
        this.restartTimeout = null;
        this.eTag = "";
        this.queuedCandidates = [];
        this.stream = stream;
        this.fetchUrl = `${streamBase}/cam-${stream}/whep`;

        this.start();
    }

    start() {
        console.log("requesting ICE servers");

        fetch(this.fetchUrl, {
            method: "OPTIONS",
        })
            .then((res) => this.onIceServers(res))
            .catch((err) => {
                console.log("error: " + err);
                this.scheduleRestart();
            });
    }

    onIceServers(res: any) {
        console.log("header link", res.headers.get("Link"));
        this.pc = new RTCPeerConnection({
            iceServers: linkToIceServers(res.headers.get("Link")),
        });

        const direction = "sendrecv";
        this.pc.addTransceiver("video", { direction });
        this.pc.addTransceiver("audio", { direction });

        this.pc.onicecandidate = (evt) => this.onLocalCandidate(evt);
        this.pc.oniceconnectionstatechange = () => this.onConnectionState();

        this.pc.ontrack = (evt) => {
            console.log("new track:", evt.track.kind);
            const videoEl: HTMLVideoElement | null = document.getElementById(
                `video-${this.stream}`,
            ) as HTMLVideoElement;
            if (videoEl) {
                videoEl.srcObject = evt.streams[0];
            }
        };

        this.pc.createOffer().then((desc) => {
            this.offerData = parseOffer(desc.sdp);
            this.pc?.setLocalDescription(desc);

            console.log("sending offer");
            fetch(this.fetchUrl, {
                method: "POST",
                headers: {
                    "Content-Type": "application/sdp",
                },
                body: JSON.stringify(desc),
            })
                .then((res) => {
                    if (res.status !== 201) {
                        throw new Error("bad status code");
                    }
                    this.eTag = res.headers.get("E-Tag");
                    return res.json();
                })
                .then((answer) => this.onRemoteDescription(answer))
                .catch((err) => {
                    console.log("error: " + err);
                    this.scheduleRestart();
                });
        });
    }

    onConnectionState() {
        if (this.restartTimeout !== null) {
            return;
        }

        console.log("peer connection state:", this.pc?.iceConnectionState);

        switch (this.pc?.iceConnectionState) {
            case "disconnected":
                this.scheduleRestart();
        }
    }

    onRemoteDescription(answer: any) {
        if (this.restartTimeout !== null) {
            return;
        }

        this.pc?.setRemoteDescription(new RTCSessionDescription(answer));

        if (this.queuedCandidates.length !== 0) {
            this.sendLocalCandidates(this.queuedCandidates);
            this.queuedCandidates = [];
        }
    }

    onLocalCandidate(evt: any) {
        if (this.restartTimeout !== null) {
            return;
        }

        if (evt.candidate !== null) {
            if (this.eTag === "") {
                this.queuedCandidates.push(evt.candidate);
            } else {
                this.sendLocalCandidates([evt.candidate]);
            }
        }
    }

    sendLocalCandidates(candidates: any) {
        fetch(this.fetchUrl, {
            method: "PATCH",
            headers: {
                "Content-Type": "application/trickle-ice-sdpfrag",
                "If-Match": this.eTag ? this.eTag : "",
            },
            body: generateSdpFragment(this.offerData, candidates),
        })
            .then((res) => {
                if (res.status !== 204) {
                    throw new Error("bad status code");
                }
            })
            .catch((err) => {
                console.log("error: " + err);
                this.scheduleRestart();
            });
    }

    scheduleRestart() {
        if (this.restartTimeout !== null) {
            return;
        }

        if (this.pc !== null) {
            this.pc.close();
            this.pc = null;
        }

        this.restartTimeout = window.setTimeout(() => {
            this.restartTimeout = null;
            this.start();
        }, restartPause);

        this.eTag = "";
        this.queuedCandidates = [];
    }
}
