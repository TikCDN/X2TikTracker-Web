import "plyr/dist/plyr.css";
import { useEffect, useRef, useState } from "react";
import shaka from "../shaka/shaka-import";
import { ShakaP2PEngine } from "@x2-tik-tracker/shaka";
import { PlayerProps } from "../../../types";
import Plyr, { Options } from "plyr";
import { createVideoElements, subscribeToUiEvents } from "../utils";
import { APP_ID } from "../../../constants";

export const ShakaPlyr = ({
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
    if (!containerRef.current) return;
    if (!shaka.Player.isBrowserSupported()) {
      setIsShakaSupported(false);
      return;
    }

    const { videoContainer, videoElement } = createVideoElements();

    containerRef.current.appendChild(videoContainer);

    let plyrPlayer: Plyr | undefined;
    let playerShaka: shaka.Player | undefined;
    let shakaP2PEngine: ShakaP2PEngine | undefined;
    let isCleanedUp = false;

    const cleanup = () => {
      isCleanedUp = true;
      shakaP2PEngine?.destroy();
      void playerShaka?.destroy();
      void plyrPlayer?.destroy();
      videoContainer.remove();
    };

    const initPlayer = async () => {
      const shakaP2PEngineInit = new ShakaP2PEngine(
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
      const shakaPlayerInit = new shaka.Player();

      subscribeToUiEvents({
        engine: shakaP2PEngineInit,
        onPeerConnect,
        onPeerClose,
        onChunkDownloaded,
        onChunkUploaded,
      });

      try {
        await shakaPlayerInit.attach(videoElement);

        playerShaka = shakaPlayerInit;
        shakaP2PEngine = shakaP2PEngineInit;

        if (isCleanedUp) cleanup();
      } catch (error) {
        playerShaka = shakaPlayerInit;
        shakaP2PEngine = shakaP2PEngineInit;

        cleanup();
        // eslint-disable-next-line no-console
        console.error("Error attaching shaka player", error);
      }

      if (isCleanedUp) {
        cleanup();
        return;
      }

      shakaP2PEngineInit.bindShakaPlayer(shakaPlayerInit);
      await shakaPlayerInit.load(streamUrl);

      const levels = shakaPlayerInit.getVariantTracks();
      const quality: Options["quality"] = {
        default: levels[levels.length - 1]?.height ?? 0,
        options: levels
          .map((level) => level.height)
          .filter((height): height is number => height != null)
          .sort((a, b) => a - b),
        forced: true,
        onChange: (newQuality: number) => {
          levels.forEach((level) => {
            if (level.height === newQuality) {
              shakaPlayerInit.configure({
                abr: { enabled: false },
              });
              shakaPlayerInit.selectVariantTrack(level, true);
            }
          });
        },
      };

      plyrPlayer = new Plyr(videoElement, {
        quality,
        autoplay: true,
        muted: true,
      });
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

  return isShakaSupported ? (
    <div ref={containerRef} />
  ) : (
    <div className="error-message">
      <h3>Shaka Player is not supported in this browser</h3>
    </div>
  );
};
