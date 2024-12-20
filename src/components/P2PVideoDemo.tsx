import "./demo.css";
import { PlaybackOptions } from "./PlaybackOptions";
import { DEBUG_COMPONENT_ENABLED, PLAYERS } from "../constants";
import { useQueryParams } from "../hooks/useQueryParams";
import { HlsjsPlayer } from "./players/hlsjs/Hlsjs";
import { useCallback, useMemo, useRef, useState } from "react";
import { DownloadStatsChart } from "./chart/DownloadStatsChart";
import { NodeNetwork } from "./nodeNetwork/NodeNetwork";
import { DebugTools } from "./debugTools/DebugTools";
import { DownloadStats, PlayerKey } from "../types";
import { HlsjsDPlayer } from "./players/hlsjs/HlsjsDPLayer";
import { HlsjsClapprPlayer } from "./players/hlsjs/HlsjsClapprPlayer";
import { HlsjsPlyr } from "./players/hlsjs/HlsjsPlyr";
import { HlsjsOpenPlayer } from "./players/hlsjs/HlsjsOpenPlayer";
import { Shaka } from "./players/shaka/Shaka";
import { ShakaDPlayer } from "./players/shaka/ShakaDPlayer";
import { ShakaClappr } from "./players/shaka/ShakaClappr";
import { HlsjsMediaElement } from "./players/hlsjs/HlsjsMediaElement";
import { ShakaPlyr } from "./players/shaka/ShakaPlyr";
import { HlsJsP2PEngine } from "@x2-tik-tracker/hlsjs";
import Hls from "hls.js";
import { HlsjsVidstack } from "./players/hlsjs/HlsjsVidstack";
import { PeerDetails } from "@x2-tik-tracker/core";
import { Time } from "@vidstack/react";

type DemoProps = {
  debugToolsEnabled?: boolean;
};

const HlsWithP2PType = HlsJsP2PEngine.injectMixin(Hls);

declare global {
  interface Window {
    shaka?: unknown;
    Hls?: typeof HlsWithP2PType;
    LevelSelector: unknown;
    DashShakaPlayback: unknown;
    Clappr: {
      Player: unknown;
    };
  }
}

const playerComponents = {
  openPlayer_hls: HlsjsOpenPlayer,
  plyr_hls: HlsjsPlyr,
  clappr_hls: HlsjsClapprPlayer,
  dplayer_hls: HlsjsDPlayer,
  hlsjs_hls: HlsjsPlayer,
  shaka: Shaka,
  dplayer_shaka: ShakaDPlayer,
  clappr_shaka: ShakaClappr,
  mediaElement_hls: HlsjsMediaElement,
  plyr_shaka: ShakaPlyr,
  vidstack_hls: HlsjsVidstack,
};

export const P2PVideoDemo = ({ debugToolsEnabled = false }: DemoProps) => {
  const data = useRef<DownloadStats>({
    httpDownloaded: 0,
    p2pDownloaded: 0,
    p2pUploaded: 0,
  });

  const { queryParams, setURLQueryParams } = useQueryParams();

  const [peers, setPeers] = useState<string[]>([]);

  const onChunkDownloaded = useCallback(
    (bytesLength: number, downloadSource: string) => {
      switch (downloadSource) {
        case "http":
          data.current.httpDownloaded += bytesLength;
          break;
        case "p2p":
          data.current.p2pDownloaded += bytesLength;
          break;
        default:
          break;
      }
    // console.log("onChunkDownloaded time: ", Date.now(), "  httpDownloaded: ", data.current.httpDownloaded, "p2pDownloaded: ", data.current.p2pDownloaded);
    },
    [],
  );

  const onChunkUploaded = useCallback((bytesLength: number) => {
    data.current.p2pUploaded += bytesLength;
    // console.log("onChunkUploaded time: ", Date.now(), "  Uploaded: ", data.current.p2pUploaded);
  }, []);

  const onPeerConnect = useCallback((params: PeerDetails) => {
    if (params.streamType !== "main") return;

    setPeers((peers) => {
      return [...peers, params.peerId];
    });
  }, []);

  const onPeerClose = useCallback((params: PeerDetails) => {
    if (params.streamType !== "main") return;

    setPeers((peers) => {
      return peers.filter((peer) => peer !== params.peerId);
    });
  }, []);

  const handlePlaybackOptionsUpdate = (url: string, player: string) => {
    if (!(player in PLAYERS)) return;
    setURLQueryParams({ streamUrl: url, player });
  };

  const renderPlayer = () => {
    const PlayerComponent = playerComponents[queryParams.player as PlayerKey];

    return PlayerComponent ? (
      <PlayerComponent
        streamUrl={queryParams.streamUrl}
        onPeerConnect={onPeerConnect}
        onPeerClose={onPeerClose}
        onChunkDownloaded={onChunkDownloaded}
        onChunkUploaded={onChunkUploaded}
      />
    ) : null;
  };
  
  return (
    <>
      <div className="demo-container">
        <div className="column-1">
          {renderPlayer()}
          <DownloadStatsChart downloadStatsRef={data} />
        </div>

        <div className="column-2">
          <div style={{ display: "flex" }}>
            <PlaybackOptions
              updatePlaybackOptions={handlePlaybackOptionsUpdate}
              currentPlayer={queryParams.player}
              streamUrl={queryParams.streamUrl}
            />
          </div>

          <NodeNetwork peers={peers} />

        </div>
      </div>
      {(debugToolsEnabled || queryParams.debug === DEBUG_COMPONENT_ENABLED) && (
        <DebugTools />
      )}
    </>
  );
};
