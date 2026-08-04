import { OverlayIconBtn, IconMinus, IconPlus } from '../overlay/icons.jsx';

export function GridSizeControls({ block, onUpdateProp }) {
  const cols = Math.max(1, Number(block.props?.columns) || 1);
  const rows = Math.max(0, Number(block.props?.rows) || 0);
  const stop = (e) => { e.preventDefault(); e.stopPropagation(); };
  return (
    <div
      style={{
        position: 'absolute', bottom: 0, right: 0,
        display: 'flex', gap: 4, padding: 4,
        background: 'rgba(255,255,255,0.95)',
        borderRadius: '4px 0 0 0',
        zIndex: 11,
      }}
      onMouseDown={stop}
    >
      <span style={{ fontSize: 11, color: '#525252', alignSelf: 'center', padding: '0 4px' }}>
        cols {cols}
      </span>
      <OverlayIconBtn
        title="Remove column"
        onMouseDown={stop}
        onClick={(e) => { stop(e); if (cols > 1) onUpdateProp(block.id, 'columns', cols - 1); }}
      ><IconMinus /></OverlayIconBtn>
      <OverlayIconBtn
        title="Add column"
        onMouseDown={stop}
        onClick={(e) => { stop(e); onUpdateProp(block.id, 'columns', cols + 1); }}
      ><IconPlus /></OverlayIconBtn>
      <span style={{ fontSize: 11, color: '#525252', alignSelf: 'center', padding: '0 4px' }}>
        rows {rows || 'auto'}
      </span>
      <OverlayIconBtn
        title="Remove row (0 = auto)"
        onMouseDown={stop}
        onClick={(e) => { stop(e); if (rows > 0) onUpdateProp(block.id, 'rows', rows - 1); }}
      ><IconMinus /></OverlayIconBtn>
      <OverlayIconBtn
        title="Add row"
        onMouseDown={stop}
        onClick={(e) => { stop(e); onUpdateProp(block.id, 'rows', rows + 1); }}
      ><IconPlus /></OverlayIconBtn>
    </div>
  );
}
