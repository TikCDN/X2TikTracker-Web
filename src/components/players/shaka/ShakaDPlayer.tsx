import { ShakaP2PEngine } from "@x2-tik-tracker/shaka";
import { PlayerProps } from "../../../types";
import { useEffect, useRef, useState } from "react";
import DPlayer from "dplayer";
import { subscribeToUiEvents } from "../utils";
import shaka from "./shaka-import";
import { APP_ID } from "../../../constants";

export const ShakaDPlayer = ({
  streamUrl,
  onPeerConnect,
  onPeerClose,
  onChunkDownloaded,
  onChunkUploaded,
}: PlayerProps) => {
  const [isShakaSupported, setIsShakaSupported] = useState(true);

  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    ShakaP2PEngine.registerPlugins(shaka);
    return () => ShakaP2PEngine.unregisterPlugins(shaka);
  }, []);

  useEffect(() => {
    if (!shaka.Player.isBrowserSupported()) {
      setIsShakaSupported(false);
      return;
    }

    const shakaP2PEngine = new ShakaP2PEngine(
      {
        core: {
          useSSL: true,
          appId: APP_ID,
          token: '',
          trackerZone: 'cn', // cn cc
          // 自定义网关地址 - 如果设置了网关地址，trackerZone 配置将无效
          // gatewayUrl: 'https://HOST:PORT/tikcdn/api/v1/gateway'
        },
      },
      shaka,
    );

    const player = new DPlayer({
      container: containerRef.current,
      video: {
        url: "",
        type: "customHlsOrDash",
        customType: {
          customHlsOrDash: (video: HTMLVideoElement) => {
            const shakaPlayer = new shaka.Player();
            void shakaPlayer.attach(video);

            subscribeToUiEvents({
              engine: shakaP2PEngine,
              onPeerConnect,
              onPeerClose,
              onChunkDownloaded,
              onChunkUploaded,
            });

            shakaP2PEngine.bindShakaPlayer(shakaPlayer);
            void shakaPlayer.load(streamUrl);
          },
        },
      },
    });

    return () => {
      shakaP2PEngine.destroy();
      player.destroy();
    };
  }, [
    onChunkDownloaded,
    onChunkUploaded,
    onPeerConnect,
    onPeerClose,
    streamUrl,
  ]);

  return isShakaSupported ? (
    <div ref={containerRef} className="video-container">
      <video playsInline autoPlay muted />
    </div>
  ) : (
    <div className="error-message">
      <h3>Shaka Player is not supported in this browser</h3>
    </div>
  );
};
