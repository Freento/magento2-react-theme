import { gridContainerStyle } from '../lib/gridLayout.js';

// `data-grid` carries the block id so the per-device stylesheet
// (lib/responsiveCss.js) can restate this element's tracks for tablet and
// mobile in server-rendered markup, before the app picks the device itself.
export default function Grid({ children, _blockId, _style, ...props }) {
  return (
    <div data-grid={_blockId} style={gridContainerStyle({ ...props, backgroundColor: _style?.backgroundColor })}>
      {children}
    </div>
  );
}
