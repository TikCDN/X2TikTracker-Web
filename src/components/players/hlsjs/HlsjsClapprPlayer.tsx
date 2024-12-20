import "../clappr.css";
import { useEffect, useRef, useState } from "react";
import { PlayerProps } from "../../../types";
import { HlsJsP2PEngine } from "@x2-tik-tracker/hlsjs";
import { subscribeToUiEvents } from "../utils";
import Hls from "hls.js";
import { useScripts } from "../../../hooks/useScripts";
import { APP_ID } from "../../../constants";

const SCRIPTS = [
  "https://cdn.jsdelivr.net/npm/@clappr/player@~0/dist/clappr.min.js",
  "https://cdn.jsdelivr.net/gh/clappr/clappr-level-selector-plugin@~0/dist/level-selector.min.js",
];

export const HlsjsClapprPlayer = ({
  streamUrl,
  onPeerConnect,
  onPeerClose,
  onChunkDownloaded,
  onChunkUploaded,
}: PlayerProps) => {
  useScripts(SCRIPTS);

  const [isClapprLoaded, setIsClapprLoaded] = useState(false);
  const [isHlsSupported, setIsHlsSupported] = useState(true);

  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let intervalId: NodeJS.Timeout | null = null;

    const checkClapprLoaded = () => {
      if (!window.Clappr && !window.LevelSelector) return;
      if (intervalId) clearInterval(intervalId);
      setIsClapprLoaded(true);
    };

    intervalId = setInterval(checkClapprLoaded, 200);

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, []);

  useEffect(() => {
    if (!containerRef.current || !isClapprLoaded) return;
    if (!Hls.isSupported()) {
      setIsHlsSupported(false);
      return;
    }

    const engine = new HlsJsP2PEngine({
      core: {
        useSSL: true,
        appId: APP_ID,
        token: '',
        trackerZone: 'cn', // cn cc
        // 自定义网关地址 - 如果设置了网关地址，trackerZone 配置将无效
        // gatewayUrl: 'https://HOST:PORT/tikcdn/api/v1/gateway'
      },
    });

    subscribeToUiEvents({
      engine,
      onPeerConnect,
      onPeerClose,
      onChunkDownloaded,
      onChunkUploaded,
    });

    /* eslint-disable  */
    // @ts-ignore
    const clapprPlayer = new Clappr.Player({
      parentId: `#${containerRef.current.id}`,
      source: streamUrl,
      mute: true,
      autoPlay: true,
      playback: {
        playInline: true,
        hlsjsConfig: {
          ...engine.getConfigForHlsJs(),
        },
      },
      plugins: [window.LevelSelector],
      width: "100%",
      height: "100%",
    });

    engine.bindHls(() => clapprPlayer.core.getCurrentPlayback()?._hls);

    return () => {
      clapprPlayer.destroy();
      engine.destroy();
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

  return isHlsSupported ? (
    <div ref={containerRef} id="clappr-player" />
  ) : (
    <div className="error-message">
      <h3>HLS is not supported in this browser</h3>
    </div>
  );
};
