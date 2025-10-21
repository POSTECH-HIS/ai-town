import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { WorldMap } from "./components/WorldMap";
import { PlayerList } from "./components/PlayerList";
import { PlayerDetailsPanel } from "./components/PlayerDetailsPanel";
import { NewPanel } from "./components/InjectionPanel";

function App() {
  const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(null);

  // useQuery 훅으로 백엔드의 worldStatus를 실시간으로 호출합니다.
  const worldStatus = useQuery(api.world.defaultWorldStatus);

  // 게임 상태를 가져옵니다.
  const worldId = worldStatus?.worldId;
  const gameState = useQuery(api.world.worldState, worldId ? { worldId } : 'skip');
  const gameDescriptions = useQuery(api.world.gameDescriptions, worldId ? { worldId } : 'skip');

  const players = gameState?.world?.players ? Array.from(gameState.world.players.values()) : [];
  const worldMap = gameDescriptions?.worldMap;
  const playerDescriptions = gameDescriptions?.playerDescriptions || [];
  const agentDescriptions = gameDescriptions?.agentDescriptions || [];

  const selectedPlayer = players.find(p => p.id === selectedPlayerId);
  const selectedPlayerDescription = playerDescriptions.find(pd => pd.playerId === selectedPlayerId);
  const selectedAgentDescription = agentDescriptions.find(ad => ad.agentId === selectedPlayerId);

  const handlePlayerClick = (player: any) => {
    setSelectedPlayerId(player.id);
  };

  const handleCloseDetails = () => {
    setSelectedPlayerId(null);
  };

  if (!worldStatus || !gameState || !worldMap) {
    return (
      <div style={{
        padding: '20px',
        fontFamily: 'sans-serif',
        background: '#0d0d0d',
        minHeight: '100vh',
        color: '#fff'
      }}>
        <h1>🔬 Expert Dashboard</h1>
        <p>Roading...</p>
      </div>
    );
  }

  return (
    <div style={{
      padding: '20px',
      fontFamily: 'sans-serif',
      background: '#0d0d0d',
      minHeight: '100vh',
      color: '#fff'
    }}>
      <h1 style={{ marginBottom: '8px' }}>🔬 Expert Dashboard</h1>
      <div style={{
        display: 'flex',
        gap: '8px',
        marginBottom: '20px',
        fontSize: '14px',
        color: '#aaa'
      }}>
        <span>World State: <strong style={{
          color: worldStatus.status === 'running' ? '#4CAF50' : '#f44336'
        }}>{worldStatus.status === 'running' ? 'active' : 'pause'}</strong></span>
        <span>|</span>
        <span>Player: <strong style={{ color: '#fff' }}>{players.length}명</strong></span>
        <span>|</span>
        <span>Map Size: <strong style={{ color: '#fff' }}>{worldMap.width} × {worldMap.height}</strong></span>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 300px 300px',
        gap: '20px',
        alignItems: 'start'
      }}>
        {/* 왼쪽: 맵 */}
        <div>
          <h2 style={{ marginTop: 0 }}>World Map</h2>
          <WorldMap
            width={worldMap.width}
            height={worldMap.height}
            tileDim={worldMap.tileDim}
            players={players}
            onPlayerClick={handlePlayerClick}
          />
        </div>

        {/* 중앙: 참여자 목록 */}
        <div>
          <PlayerList
            players={players}
            playerDescriptions={playerDescriptions}
            selectedPlayerId={selectedPlayerId}
            onPlayerSelect={handlePlayerClick}
          />
        </div>

        {/* 오른쪽: 상세 정보와 새 패널 */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {selectedPlayer && (
            <PlayerDetailsPanel
              player={selectedPlayer}
              playerDescription={selectedPlayerDescription}
              agentDescription={selectedAgentDescription}
              worldId={worldId!}
              onClose={handleCloseDetails}
            />
          )}
          <NewPanel />
        </div>
      </div>
    </div>
  );
}

export default App;
