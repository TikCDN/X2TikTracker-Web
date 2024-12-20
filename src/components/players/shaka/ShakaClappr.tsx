import "../clappr.css";
import { useEffect, useRef, useState } from "react";
import { PlayerProps } from "../../../types";
import { ShakaP2PEngine } from "@x2-tik-tracker/shaka";
import { subscribeToUiEvents } from "../utils";
import { useScripts } from "../../../hooks/useScripts";
import { APP_ID } from "../../../constants";

const SCRIPTS = [
  "https://cdn.jsdelivr.net/npm/shaka-player@~4/dist/shaka-player.compiled.min.js",
  "https://cdn.jsdelivr.net/npm/@clappr/player@~0/dist/clappr.min.js",
  "https://cdn.jsdelivr.net/gh/clappr/clappr-level-selector-plugin@~0/dist/level-selector.min.js",
  "https://cdn.jsdelivr.net/npm/dash-shaka-playback@~3/dist/dash-shaka-playback.external.min.js",
];

export const ShakaClappr = ({
  streamUrl,
  onPeerConnect,
  onPeerClose,
  onChunkDownloaded,
  onChunkUploaded,
}: PlayerProps) => {
  useScripts(SCRIPTS);

  const [isClapprLoaded, setIsClapprLoaded] = useState(false);
  const [isShakaSupported, setIsShakaSupported] = useState(true);

  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let intervalId: NodeJS.Timeout | null = null;

    const checkClapprLoaded = () => {
      if (
        window.Clappr &&
        window.LevelSelector &&
        window.DashShakaPlayback &&
        window.shaka.Player
      ) {
        if (intervalId) clearInterval(intervalId);
        setIsClapprLoaded(true);
        ShakaP2PEngine.registerPlugins();
      }
    };

    intervalId = setInterval(checkClapprLoaded, 200);

    return () => {
      if (intervalId) clearInterval(intervalId);
      if (window.shaka) ShakaP2PEngine.unregisterPlugins();
    };
  }, []);

  useEffect(() => {
    if (!containerRef.current || !isClapprLoaded) return;
    if (!window.shaka.Player.isBrowserSupported()) {
      setIsShakaSupported(false);
      return;
    }

    const shakaP2PEngine = new ShakaP2PEngine({
      core: {
        useSSL: true,
        appId: APP_ID,
        token: '',
        trackerZone: 'cn', // cn cc
        // 自定义网关地址 - 如果设置了网关地址，trackerZone 配置将无效
        // gatewayUrl: 'https://HOST:PORT/tikcdn/api/v1/gateway'
      },
    });

    /* eslint-disable  */
    // @ts-ignore
    const clapprPlayer = new Clappr.Player({
      parentId: `#${containerRef.current.id}`,
      source: streamUrl,
      plugins: [window.DashShakaPlayback, window.LevelSelector],
      mute: true,
      autoPlay: true,
      playback: {
        playInline: true,
      },
      shakaOnBeforeLoad: (shakaPlayerInstance: shaka.Player) => {
        subscribeToUiEvents({
          engine: shakaP2PEngine,
          onPeerConnect,
          onPeerClose,
          onChunkDownloaded,
          onChunkUploaded,
        });

        shakaP2PEngine.bindShakaPlayer(shakaPlayerInstance);
      },
      width: "100%",
      height: "100%",
    });

    return () => {
      shakaP2PEngine.destroy();
      clapprPlayer.destroy();
    };
    /* eslint-enable  */
  }, [
    isClapprLoaded,
    onChunkDownloaded,
    onChunkUploaded,
    onPeerConnect,
    onPeerClose,
    streamUrl,
  ]);

  return isShakaSupported ? (
    <div ref={containerRef} id="clappr-player" />
  ) : (
    <div className="error-message">
      <h3>Shaka Player is not supported in this browser</h3>
    </div>
  );
};
