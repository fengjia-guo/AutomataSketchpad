import { BoardConfig, defaultBoardConfig, Transform } from "./InfiniteBoard"

export interface BoardObjectProps {
  transform: Transform, 
  boardRef: React.RefObject<HTMLDivElement>
  boardConfig?: BoardConfig
}

export const mainLineColor = '#2563eb'; 
export const lineColor = '#c5c7cb';

export const GridLayer: React.FC<BoardObjectProps> = (props) => {
  const boardConfig = props.boardConfig || defaultBoardConfig;
  const boardRef = props.boardRef;
  const gridSize = boardConfig.gridSize;
  const transform = props.transform;

  const renderGrid = () => {
    if (!boardRef.current) return null;

    const rect = boardRef.current.getBoundingClientRect();
    const scaledGridSize = gridSize * transform.scale;
    
    // Calculate the grid offset to create seamless infinite appearance
    const offsetX = ((transform.x % scaledGridSize) + scaledGridSize) % scaledGridSize;
    const offsetY = ((transform.y % scaledGridSize) + scaledGridSize) % scaledGridSize;
    
    // Calculate how many grid lines we need to fill the screen plus extra buffer
    const extraLines = 3;
    const horizontalLines = Math.ceil(rect.width / scaledGridSize) + extraLines * 2;
    const verticalLines = Math.ceil(rect.height / scaledGridSize) + extraLines * 2;
    
    const lines = [];
    let key = 0;

    // Vertical lines
    for (let i = -extraLines; i <= horizontalLines; i++) {
      const x = offsetX + i * scaledGridSize - extraLines * scaledGridSize;
      
      // Calculate the actual grid coordinate for this line
      const gridX = Math.round((x - transform.x) / scaledGridSize) * gridSize;
      const isMainLine = gridX === 0;
      
      lines.push(
        <line
          key={`v-${key++}`}
          x1={x}
          y1={-extraLines * scaledGridSize}
          x2={x}
          y2={rect.height + extraLines * scaledGridSize}
          stroke={isMainLine ? mainLineColor : lineColor}
          strokeWidth={isMainLine ? 2 : 1}
          opacity={Math.min(1, Math.max(0.2, transform.scale * 0.8))}
        />
      );
    }

    // Horizontal lines
    for (let i = -extraLines; i <= verticalLines; i++) {
      const y = offsetY + i * scaledGridSize - extraLines * scaledGridSize;
      
      // Calculate the actual grid coordinate for this line
      const gridY = Math.round((y - transform.y) / scaledGridSize) * gridSize;
      const isMainLine = gridY === 0;
      
      lines.push(
        <line
          key={`h-${key++}`}
          x1={-extraLines * scaledGridSize}
          y1={y}
          x2={rect.width + extraLines * scaledGridSize}
          y2={y}
          stroke={isMainLine ? mainLineColor : lineColor}
          strokeWidth={isMainLine ? 2 : 1}
          opacity={Math.min(1, Math.max(0.2, transform.scale * 0.8))}
        />
      );
    }

    return lines;
  };

  return renderGrid();
}
