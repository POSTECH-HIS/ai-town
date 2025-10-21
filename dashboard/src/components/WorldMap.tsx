import { useEffect, useRef } from 'react';

interface Player {
  id: string;
  position: { x: number; y: number };
  human?: string;
}

interface WorldMapProps {
  width: number;
  height: number;
  tileDim: number;
  players: Player[];
  onPlayerClick: (player: Player) => void;
}

export function WorldMap({ width, height, tileDim, players, onPlayerClick }: WorldMapProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // 배경 그리기 (그리드)
    ctx.fillStyle = '#2a2a2a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // 그리드 라인 그리기
    ctx.strokeStyle = '#3a3a3a';
    ctx.lineWidth = 1;

    for (let x = 0; x <= width; x++) {
      ctx.beginPath();
      ctx.moveTo(x * tileDim, 0);
      ctx.lineTo(x * tileDim, height * tileDim);
      ctx.stroke();
    }

    for (let y = 0; y <= height; y++) {
      ctx.beginPath();
      ctx.moveTo(0, y * tileDim);
      ctx.lineTo(width * tileDim, y * tileDim);
      ctx.stroke();
    }

    // 플레이어 그리기
    players.forEach((player) => {
      const x = player.position.x * tileDim + tileDim / 2;
      const y = player.position.y * tileDim + tileDim / 2;

      // 플레이어 원
      ctx.beginPath();
      ctx.arc(x, y, tileDim / 3, 0, 2 * Math.PI);
      ctx.fillStyle = player.human ? '#4CAF50' : '#2196F3';
      ctx.fill();

      // 테두리
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 2;
      ctx.stroke();

      // 라벨
      ctx.fillStyle = '#fff';
      ctx.font = '10px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(player.human ? '🧑' : '🤖', x, y + 4);
    });
  }, [width, height, tileDim, players]);

  const handleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // 클릭한 위치에 있는 플레이어 찾기
    const clickedPlayer = players.find((player) => {
      const px = player.position.x * tileDim + tileDim / 2;
      const py = player.position.y * tileDim + tileDim / 2;
      const distance = Math.sqrt((x - px) ** 2 + (y - py) ** 2);
      return distance < tileDim / 3;
    });

    if (clickedPlayer) {
      onPlayerClick(clickedPlayer);
    }
  };

  return (
    <canvas
      ref={canvasRef}
      width={width * tileDim}
      height={height * tileDim}
      onClick={handleClick}
      style={{
        border: '2px solid #444',
        borderRadius: '8px',
        cursor: 'pointer',
        maxWidth: '100%',
        height: 'auto',
      }}
    />
  );
}
