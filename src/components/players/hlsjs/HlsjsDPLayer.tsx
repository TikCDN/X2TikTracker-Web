import { useEffect, useRef, useState } from "react";
import { PlayerProps } from "../../../types";
import DPlayer from "dplayer";
import { subscribeToUiEvents } from "../utils";
import { HlsJsP2PEngine } from "@x2-tik-tracker/hlsjs";
import Hls from "hls.js";
import { APP_ID } from "../../../constants";

export const HlsjsDPlayer = ({
  streamUrl,
  onPeerConnect,
  onPeerClose,
  onChunkDownloaded,
  onChunkUploaded,
}: PlayerProps) => {
  const [isHlsSupported, setIsHlsSupported] = useState(true);

  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!Hls.isSupported()) {
      setIsHlsSupported(false);
      return;
    }

    const HlsWithP2P = HlsJsP2PEngine.injectMixin(Hls);

    const hls = new HlsWithP2P({
      p2p: {
        core: {
          useSSL: true,
          appId: APP_ID,
          token: '',
          trackerZone: 'cn', // cn cc
          // 自定义网关地址 - 如果设置了网关地址，trackerZone 配置将无效
          // gatewayUrl: 'https://HOST:PORT/tikcdn/api/v1/gateway'
        },
        onHlsJsCreated(hls) {
          subscribeToUiEvents({
            engine: hls.p2pEngine,
            onPeerConnect,
            onPeerClose,
            onChunkDownloaded,
            onChunkUploaded,
          });
        },
      },
    });

    const player = new DPlayer({
      container: containerRef.current,

      video: {
        url: "",
        type: "customHls",
        customType: {
          customHls: (video: HTMLVideoElement) => {
            hls.attachMedia(video);
            hls.loadSource(streamUrl);
          },
        },
      },
    });

    player.play();

    return () => {
      player.destroy();
      hls.destroy();
    };
  }, [
    streamUrl,
    onPeerConnect,
    onPeerClose,
    onChunkDownloaded,
    onChunkUploaded,
  ]);

  return isHlsSupported ? (
    <div ref={containerRef} className="video-container">
      <video playsInline autoPlay muted />
    </div>
  ) : (
    <div className="error-message">
      <h3>HLS is not supported in this browser</h3>
    </div>
  );
};
