import "openplayerjs/dist/openplayer.min.css";
import OpenPlayerJS from "openplayerjs";
import { useEffect, useRef, useState } from "react";
import { PlayerProps } from "../../../types";
import { HlsJsP2PEngine, HlsWithP2PInstance } from "@x2-tik-tracker/hlsjs";
import Hls from "hls.js";
import { createVideoElements, subscribeToUiEvents } from "../utils";
import { APP_ID } from "../../../constants";

export const HlsjsOpenPlayer = ({
  streamUrl,
  onPeerConnect,
  onPeerClose,
  onChunkDownloaded,
  onChunkUploaded,
}: PlayerProps) => {
  const [isHlsSupported, setIsHlsSupported] = useState(true);

  const playerContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!playerContainerRef.current) return;
    if (!Hls.isSupported()) {
      setIsHlsSupported(false);
      return;
    }

    window.Hls = HlsJsP2PEngine.injectMixin(Hls);

    let isCleanedUp = false;
    let player: OpenPlayerJS | undefined;

    const { videoContainer, videoElement } = createVideoElements({
      videoClassName: "op-player__media",
    });

    playerContainerRef.current.appendChild(videoContainer);

    const cleanup = () => {
      isCleanedUp = true;
      player?.destroy();
      videoElement.remove();
      videoContainer.remove();
      window.Hls = undefined;
    };

    const initPlayer = async () => {
      const playerInit = new OpenPlayerJS(videoElement, {
        hls: {
          p2p: {
            onHlsJsCreated: (hls: HlsWithP2PInstance<Hls>) => {
              subscribeToUiEvents({
                engine: hls.p2pEngine,
                onPeerConnect,
                onPeerClose,
                onChunkDownloaded,
                onChunkUploaded,
              });
            },
            core: {
              useSSL: true,
              appId: APP_ID,
              token: '',
              trackerZone: 'cn', // cn cc
              // 自定义网关地址 - 如果设置了网关地址，trackerZone 配置将无效
              // gatewayUrl: 'https://HOST:PORT/tikcdn/api/v1/gateway'
            },
          },
        },
        controls: {
          layers: {
            left: ["play", "time", "volume"],
            right: ["settings", "fullscreen", "levels"],
            middle: ["progress"],
          },
        },
      });

      playerInit.src = [
        {
          src: streamUrl,
          type: "application/x-mpegURL",
        },
      ];

      try {
        await playerInit.init();

        player = playerInit;
      } catch (error) {
        player = playerInit;

        cleanup();
        // eslint-disable-next-line no-console
        console.error("Error initializing OpenPlayerJS", error);
      }

      if (isCleanedUp) cleanup();
    };

    void initPlayer();

    return () => cleanup();
  }, [
    onChunkDownloaded,
    onChunkUploaded,
    onPeerConnect,
    onPeerClose,
    streamUrl,
  ]);

  return isHlsSupported ? (
    <div ref={playerContainerRef} className="player-container" />
  ) : (
    <div className="error-message">
      <h3>HLS is not supported in this browser</h3>
    </div>
  );
};
