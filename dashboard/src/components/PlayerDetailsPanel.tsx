import { useQuery } from 'convex/react';
import { api } from '../../../convex/_generated/api';

interface ConversationMessage {
  text: string;
  author: string;
  authorName: string;
  timestamp: number;
}

interface ConversationParticipant {
  playerId: string;
  name: string;
}

interface PlayerConversation {
  conversationId: string;
  participants: ConversationParticipant[];
  messages: ConversationMessage[];
  messageCount: number;
  lastMessageTime: number;
}

interface Player {
  id: string;
  position: { x: number; y: number };
  facing: { dx: number; dy: number };
  speed: number;
  human?: string;
  activity?: {
    description: string;
    emoji?: string;
    until: number;
  };
  pathfinding?: {
    destination: { x: number; y: number };
    started: number;
    state: any;
  };
}

interface PlayerDescription {
  playerId: string;
  name: string;
  character: string;
  description: string;
}

interface AgentDescription {
  agentId: string;
  identity: string;
  plan: string;
}

interface PlayerDetailsPanelProps {
  player: Player | null;
  playerDescription?: PlayerDescription;
  agentDescription?: AgentDescription;
  worldId: string;
  onClose: () => void;
}

export function PlayerDetailsPanel({ player, playerDescription, agentDescription, worldId, onClose }: PlayerDetailsPanelProps) {
  if (!player) return null;

  // 플레이어의 대화 기록 가져오기
  const conversationHistory = useQuery(
    api.messages.playerConversationHistory,
    worldId && player ? { worldId: worldId as any, playerId: player.id } : 'skip'
  ) as PlayerConversation[] | undefined;

  const getFacingDirection = (facing: { dx: number; dy: number }) => {
    if (facing.dx === 1) return '→ Right';
    if (facing.dx === -1) return '← Left';
    if (facing.dy === 1) return '↓ Down';
    if (facing.dy === -1) return '↑ Up';
    return 'pause';
  };

  const formatTimestamp = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div style={{
      background: '#1e1e1e',
      border: '2px solid #444',
      borderRadius: '8px',
      padding: '20px',
      color: '#fff',
      maxHeight: '80vh',
      overflowY: 'auto'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <h3 style={{ margin: 0 }}>Details</h3>
        <button
          onClick={onClose}
          style={{
            background: '#333',
            border: '1px solid #555',
            borderRadius: '4px',
            color: '#fff',
            padding: '4px 12px',
            cursor: 'pointer'
          }}
        >
          Close
        </button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {/* Basic Info */}
        <section>
          <h4 style={{ margin: '0 0 8px 0', color: '#4CAF50' }}>Basic Info</h4>
          <div style={{ background: '#2a2a2a', padding: '12px', borderRadius: '6px' }}>
            <div style={{ marginBottom: '8px' }}>
              <strong>Name:</strong> {playerDescription?.name || player.id}
            </div>
            <div style={{ marginBottom: '8px' }}>
              <strong>Type:</strong> {player.human ? '🧑 Player' : '🤖 AI agent'}
            </div>
            {playerDescription && (
              <>
                <div style={{ marginBottom: '8px' }}>
                  <strong>Character:</strong> {playerDescription.character}
                </div>
                <div>
                  <strong>Description:</strong> {playerDescription.description}
                </div>
              </>
            )}
          </div>
        </section>

        {/* 위치 및 이동 정보 */}
        <section>
          <h4 style={{ margin: '0 0 8px 0', color: '#2196F3' }}>Location & Movement</h4>
          <div style={{ background: '#2a2a2a', padding: '12px', borderRadius: '6px' }}>
            <div style={{ marginBottom: '8px' }}>
              <strong>Current Position:</strong> ({player.position.x.toFixed(1)}, {player.position.y.toFixed(1)})
            </div>
            <div style={{ marginBottom: '8px' }}>
              <strong>Facing Direction:</strong> {getFacingDirection(player.facing)}
            </div>
            <div style={{ marginBottom: '8px' }}>
              <strong>Movement Speed:</strong> {player.speed.toFixed(2)}
            </div>
            {player.pathfinding && (
              <div>
                <strong>Destination:</strong> ({player.pathfinding.destination.x}, {player.pathfinding.destination.y})
                <br />
                <strong>Path Status:</strong> {player.pathfinding.state.kind}
              </div>
            )}
          </div>
        </section>

        {/* 현재 활동 */}
        {player.activity && (
          <section>
            <h4 style={{ margin: '0 0 8px 0', color: '#FF9800' }}>Current Activity</h4>
            <div style={{ background: '#2a2a2a', padding: '12px', borderRadius: '6px' }}>
              <div style={{ fontSize: '16px', marginBottom: '8px' }}>
                {player.activity.emoji && `${player.activity.emoji} `}
                {player.activity.description}
              </div>
              <div style={{ fontSize: '12px', color: '#aaa' }}>
                Finish Time: {new Date(player.activity.until).toLocaleTimeString()}
              </div>
            </div>
          </section>
        )}

        {/* AI 에이전트 정보 */}
        {agentDescription && (
          <section>
            <h4 style={{ margin: '0 0 8px 0', color: '#9C27B0' }}>AI Agent Info</h4>
            <div style={{ background: '#2a2a2a', padding: '12px', borderRadius: '6px' }}>
              <div style={{ marginBottom: '8px' }}>
                <strong>Identity:</strong> {agentDescription.identity}
              </div>
              <div>
                <strong>Plan:</strong> {agentDescription.plan}
              </div>
            </div>
          </section>
        )}

        {/* 대화 기록 */}
        <section>
          <h4 style={{ margin: '0 0 8px 0', color: '#E91E63' }}>💬 Conversation History</h4>
          {!conversationHistory ? (
            <div style={{ background: '#2a2a2a', padding: '12px', borderRadius: '6px', color: '#aaa' }}>
              Loading conversation history...
            </div>
          ) : conversationHistory.length === 0 ? (
            <div style={{ background: '#2a2a2a', padding: '12px', borderRadius: '6px', color: '#aaa' }}>
              No conversation history yet.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {conversationHistory.map((conversation: PlayerConversation, idx: number) => (
                <div
                  key={conversation.conversationId}
                  style={{
                    background: '#2a2a2a',
                    padding: '12px',
                    borderRadius: '6px',
                    border: '1px solid #333'
                  }}
                >
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    marginBottom: '8px',
                    paddingBottom: '8px',
                    borderBottom: '1px solid #444'
                  }}>
                    <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#E91E63' }}>
                      Conversation #{conversationHistory.length - idx}
                    </div>
                    <div style={{ fontSize: '11px', color: '#888' }}>
                      {formatTimestamp(conversation.lastMessageTime)}
                    </div>
                  </div>

                  <div style={{ fontSize: '12px', color: '#aaa', marginBottom: '8px' }}>
                    <strong>Participants:</strong> {conversation.participants.map((p: ConversationParticipant) => p.name).join(', ')}
                  </div>

                  <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '6px',
                    maxHeight: '300px',
                    overflowY: 'auto',
                    padding: '8px',
                    background: '#1e1e1e',
                    borderRadius: '4px'
                  }}>
                    {conversation.messages.map((message: ConversationMessage, msgIdx: number) => (
                      <div
                        key={msgIdx}
                        style={{
                          padding: '8px',
                          borderRadius: '4px',
                          background: message.author === player.id ? '#1a4d2e' : '#2d2d2d',
                          borderLeft: `3px solid ${message.author === player.id ? '#4CAF50' : '#666'}`
                        }}
                      >
                        <div style={{ fontSize: '11px', color: '#aaa', marginBottom: '4px' }}>
                          <strong style={{ color: message.author === player.id ? '#4CAF50' : '#fff' }}>
                            {message.authorName}
                          </strong>
                          <span style={{ marginLeft: '8px', fontSize: '10px' }}>
                            {formatTimestamp(message.timestamp)}
                          </span>
                        </div>
                        <div style={{ fontSize: '13px', color: '#fff', lineHeight: '1.4' }}>
                          {message.text}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div style={{ fontSize: '11px', color: '#666', marginTop: '8px', textAlign: 'right' }}>
                    Total {conversation.messageCount} messages
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
