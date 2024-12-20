import "@vidstack/react/player/styles/default/theme.css";
import "@vidstack/react/player/styles/default/layouts/video.css";
import {
  MediaPlayer,
  MediaProvider,
  isHLSProvider,
  type MediaProviderAdapter,
} from "@vidstack/react";
import {
  defaultLayoutIcons,
  DefaultVideoLayout,
} from "@vidstack/react/player/layouts/default";
import { PlayerProps } from "../../../types";
import { HlsJsP2PEngine, HlsWithP2PConfig } from "@x2-tik-tracker/hlsjs";
import { subscribeToUiEvents } from "../utils";
import { useCallback } from "react";
import Hls from "hls.js";
import { APP_ID } from "../../../constants";

export const HlsjsVidstack = ({
  streamUrl,
  onPeerConnect,
  onPeerClose,
  onChunkDownloaded,
  onChunkUploaded,
}: PlayerProps) => {
  const onProviderChange = useCallback(
    (provider: MediaProviderAdapter | null) => {
      if (isHLSProvider(provider)) {
        const HlsWithP2P = HlsJsP2PEngine.injectMixin(Hls);

        provider.library = HlsWithP2P as unknown as typeof Hls;

        const config: HlsWithP2PConfig<typeof Hls> = {
          p2p: {
            core: {
              useSSL: true,
              appId: APP_ID,
              token: '',
              trackerZone: 'cn', // cn cc
              // 自定义网关地址 - 如果设置了网关地址，trackerZone 配置将无效
              // gatewayUrl: 'https://HOST:PORT/tikcdn/api/v1/gateway'
            },
            onHlsJsCreated: (hls) => {
              subscribeToUiEvents({
                engine: hls.p2pEngine,
                onPeerConnect,
                onPeerClose,
                onChunkDownloaded,
                onChunkUploaded,
              });
            },
          },
        };

        provider.config = config;
      }
    },
    [
      onChunkDownloaded,
      onChunkUploaded,
      onPeerConnect,
      onPeerClose,
    ],
  );

  return (
    <div className="video-container">
      <MediaPlayer
        autoPlay
        muted
        onProviderChange={onProviderChange}
        src={streamUrl}
        playsInline
      >
        <MediaProvider />
        <DefaultVideoLayout icons={defaultLayoutIcons} />
      </MediaPlayer>
    </div>
  );
};
