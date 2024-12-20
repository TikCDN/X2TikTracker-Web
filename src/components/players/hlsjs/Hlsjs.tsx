import "./Hlsjs.css";
import { useEffect, useRef, useState } from "react";
import { PlayerProps } from "../../../types";
import { subscribeToUiEvents } from "../utils";
import { HlsJsP2PEngine } from "@x2-tik-tracker/hlsjs";
import Hls from "hls.js";
import { APP_ID } from "../../../constants";

export const HlsjsPlayer = ({
  streamUrl,
  onPeerConnect,
  onPeerClose,
  onChunkDownloaded,
  onChunkUploaded,
}: PlayerProps) => {
  const [isHlsSupported, setIsHlsSupported] = useState(true);

  const videoRef = useRef<HTMLVideoElement>(null);
  const qualityRef = useRef<HTMLSelectElement>(null);

  useEffect(() => {
    if (!videoRef.current) return;
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

    hls.attachMedia(videoRef.current);
    hls.loadSource(streamUrl);

    hls.on(Hls.Events.MANIFEST_PARSED, () => {
      if (!qualityRef.current) return;
      updateQualityOptions(hls, qualityRef.current);
    });

    return () => hls.destroy();
  }, [
    onPeerConnect,
    onPeerClose,
    onChunkDownloaded,
    onChunkUploaded,
    streamUrl,
  ]);

  const updateQualityOptions = (hls: Hls, selectElement: HTMLSelectElement) => {
    if (hls.levels.length < 2) {
      selectElement.style.display = "none";
    } else {
      selectElement.style.display = "block";
      selectElement.options.length = 0;
      selectElement.add(new Option("Auto", "-1"));
      hls.levels.forEach((level, index) => {
        const label = `${level.height}p (${Math.round(level.bitrate / 1000)}k)`;
        selectElement.add(new Option(label, index.toString()));
      });

      selectElement.addEventListener("change", () => {
        hls.currentLevel = parseInt(selectElement.value);
      });
    }
  };

  return isHlsSupported ? (
    <div className="video-container">
      <video
        ref={videoRef}
        style={{ aspectRatio: "auto" }}
        controls
        playsInline
        autoPlay
        muted
      />
      <div className="select-container">
        <select ref={qualityRef} className="quality-selector" />
      </div>
    </div>
  ) : (
    <div className="error-message">
      <h3>HLS is not supported in this browser</h3>
    </div>
  );
};
