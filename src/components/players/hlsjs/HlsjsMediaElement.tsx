import "mediaelement";
import "mediaelement/build/mediaelementplayer.min.css";
import { useEffect, useRef, useState } from "react";
import Hls from "hls.js";
import { HlsJsP2PEngine, HlsWithP2PInstance } from "@x2-tik-tracker/hlsjs";
import { createVideoElements, subscribeToUiEvents } from "../utils";
import { PlayerProps } from "../../../types";
import { APP_ID } from "../../../constants";

export const HlsjsMediaElement = ({
  streamUrl,
  onPeerConnect,
  onPeerClose,
  onChunkDownloaded,
  onChunkUploaded,
}: PlayerProps) => {
  const [isHlsSupported, setIsHlsSupported] = useState(true);

  const containerRef = useRef<HTMLDivElement>(null);
  /* eslint-disable  */
  // @ts-ignore
  useEffect(() => {
    if (!containerRef.current) return;
    if (!Hls.isSupported()) {
      setIsHlsSupported(false);
      return;
    }

    const { videoContainer, videoElement } = createVideoElements();

    containerRef.current.appendChild(videoContainer);

    window.Hls = HlsJsP2PEngine.injectMixin(Hls);

    // @ts-ignore
    const player = new MediaElementPlayer(videoElement.id, {
      iconSprite: "/mejs-controls.svg",
      videoHeight: "100%",
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
    });

    player.setSrc(streamUrl);
    player.load();

    return () => {
      window.Hls = undefined;
      player?.remove();
      videoContainer.remove();
    };
    /* eslint-enable  */
  }, [
    onChunkDownloaded,
    onChunkUploaded,
    onPeerConnect,
    onPeerClose,
    streamUrl,
  ]);

  return isHlsSupported ? (
    <div ref={containerRef} />
  ) : (
    <div className="error-message">
      <h3>HLS is not supported in this browser</h3>
    </div>
  );
};
