interface Player {
  id: string;
  position: { x: number; y: number };
  human?: string;
  activity?: {
    description: string;
    emoji?: string;
  };
}

interface PlayerDescription {
  playerId: string;
  name: string;
  character: string;
  description: string;
}

interface PlayerListProps {
  players: Player[];
  playerDescriptions: PlayerDescription[];
  selectedPlayerId: string | null;
  onPlayerSelect: (player: Player) => void;
}

export function PlayerList({ players, playerDescriptions, selectedPlayerId, onPlayerSelect }: PlayerListProps) {
  const getPlayerDescription = (playerId: string) => {
    return playerDescriptions.find((pd) => pd.playerId === playerId);
  };

  return (
    <div style={{
      background: '#1e1e1e',
      border: '2px solid #444',
      borderRadius: '8px',
      padding: '16px',
      maxHeight: '600px',
      overflowY: 'auto'
    }}>
      <h3 style={{ marginTop: 0, marginBottom: '16px', color: '#fff' }}>참여자 목록</h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {players.map((player) => {
          const description = getPlayerDescription(player.id);
          const isSelected = selectedPlayerId === player.id;

          return (
            <div
              key={player.id}
              onClick={() => onPlayerSelect(player)}
              style={{
                background: isSelected ? '#333' : '#2a2a2a',
                border: isSelected ? '2px solid #4CAF50' : '2px solid #3a3a3a',
                borderRadius: '6px',
                padding: '12px',
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => {
                if (!isSelected) {
                  e.currentTarget.style.background = '#333';
                }
              }}
              onMouseLeave={(e) => {
                if (!isSelected) {
                  e.currentTarget.style.background = '#2a2a2a';
                }
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                <span style={{ fontSize: '20px' }}>{player.human ? '🧑' : '🤖'}</span>
                <strong style={{ color: '#fff' }}>{description?.name || player.id}</strong>
                <span style={{
                  fontSize: '10px',
                  padding: '2px 6px',
                  borderRadius: '4px',
                  background: player.human ? '#4CAF50' : '#2196F3',
                  color: '#fff'
                }}>
                  {player.human ? '사용자' : 'AI'}
                </span>
              </div>
              <div style={{ fontSize: '12px', color: '#aaa' }}>
                위치: ({player.position.x}, {player.position.y})
              </div>
              {player.activity && (
                <div style={{ fontSize: '12px', color: '#bbb', marginTop: '4px' }}>
                  {player.activity.emoji && `${player.activity.emoji} `}
                  {player.activity.description}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
