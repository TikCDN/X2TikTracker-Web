import "plyr/dist/plyr.css";
import Plyr, { Options } from "plyr";
import { useEffect, useRef, useState } from "react";
import { PlayerProps } from "../../../types";
import Hls from "hls.js";
import { HlsJsP2PEngine } from "@x2-tik-tracker/hlsjs";
import { createVideoElements, subscribeToUiEvents } from "../utils";
import { APP_ID } from "../../../constants";

export const HlsjsPlyr = ({
  streamUrl,
  onPeerConnect,
  onPeerClose,
  onChunkDownloaded,
  onChunkUploaded,
}: PlayerProps) => {
  const [isHlsSupported, setIsHlsSupported] = useState(true);

  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    if (!Hls.isSupported()) {
      setIsHlsSupported(false);
      return;
    }

    let player: Plyr | undefined;

    const { videoContainer, videoElement } = createVideoElements();

    containerRef.current.appendChild(videoContainer);

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

    hls.on(Hls.Events.MANIFEST_PARSED, () => {
      const levels = hls.levels;

      const quality: Options["quality"] = {
        default: levels[levels.length - 1].height,
        options: levels.map((level) => level.height),
        forced: true,
        onChange: (newQuality: number) => {
          levels.forEach((level, levelIndex) => {
            if (level.height === newQuality) {
              hls.currentLevel = levelIndex;
            }
          });
        },
      };

      player = new Plyr(videoElement, {
        quality,
        autoplay: true,
        muted: true,
      });
    });

    hls.attachMedia(videoElement);
    hls.loadSource(streamUrl);

    return () => {
      player?.destroy();
      videoContainer.remove();
      hls.destroy();
    };
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
