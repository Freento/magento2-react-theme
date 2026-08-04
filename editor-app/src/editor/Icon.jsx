import {
  Save,
  Trash2,
  X,
  Plus,
  ArrowUp,
  ArrowDown,
  ChevronUp,
  ChevronDown,
  ChevronRight,
  PanelLeftClose,
  PanelLeftOpen,
  Link as LinkIcon,
  Link2Off,
  Layers,
  Settings,
  Eye,
  EyeOff,
  Square,
  Columns,
  LayoutTemplate,
  Type,
  Heading,
  Image as ImageIcon,
  RectangleHorizontal,
  Code,
  Menu,
  LayoutGrid,
  GalleryHorizontalEnd,
  Mail,
  GripVertical,
  ShoppingBag,
  Pipette,
  FileText,
  LayoutPanelTop,
  Check,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  AlignVerticalJustifyStart,
  AlignVerticalJustifyCenter,
  AlignVerticalJustifyEnd,
  BoxSelect,
  PanelTop,
  PanelBottom,
  PanelLeft,
  PanelRight,
  Rows3,
  Columns3,
  Copy,
  Monitor,
  Tablet,
  Smartphone,
  RotateCcw,
  MoveVertical,
  MoveHorizontal,
  Undo2,
  Redo2,
  Truck,
  Shield,
  Lock,
  PlusCircle,
  CreditCard,
  Leaf,
  Star,
  Heart,
  Search,
  User,
} from 'lucide-react';

const BLOCK_ICON_MAP = {
  '⬌': LayoutTemplate,
  '⬍': Columns,
  '☐': Square,
  H: Heading,
  T: Type,
  '🖼': ImageIcon,
  '▢': RectangleHorizontal,
  '⟨⟩': Code,
  '☰': Menu,
  '⧫': LayoutGrid,
  '🛍': ShoppingBag,
  ColumnsH: Columns3,
  Rows: Rows3,
  LayoutTemplate,
  Columns,
  Square,
  Type,
  Heading,
  Image: ImageIcon,
  RectangleHorizontal,
  Code,
  Menu,
  LayoutGrid,
  GalleryHorizontalEnd,
  Mail,
  ShoppingBag,
};

const lineIcon = (children) => function LineIcon({ size = 16, strokeWidth = 1.75, ...rest }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...rest}>
      {children}
    </svg>
  );
};
const LineNone = lineIcon(<>
  <line x1="4" y1="12" x2="20" y2="12" strokeOpacity="0.35" />
  <line x1="6" y1="18" x2="18" y2="6" />
</>);
const LineSolid = lineIcon(<line x1="4" y1="12" x2="20" y2="12" />);
const LineDashed = lineIcon(<line x1="4" y1="12" x2="20" y2="12" strokeDasharray="4 2" />);
const LineDotted = lineIcon(<line x1="4" y1="12" x2="20" y2="12" strokeDasharray="0.1 3" />);
const LineDouble = lineIcon(<>
  <line x1="4" y1="9" x2="20" y2="9" />
  <line x1="4" y1="15" x2="20" y2="15" />
</>);

const fitIcon = (children) => function FitIcon({ size = 16, strokeWidth = 1.75, ...rest }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...rest}>
      {children}
    </svg>
  );
};
const FitCover = fitIcon(<>
  <rect x="4" y="8" width="16" height="9" rx="1.5" strokeDasharray="2 2" strokeOpacity="0.55" />
  <rect x="7" y="3" width="10" height="18" rx="1.5" fill="currentColor" fillOpacity="0.18" />
</>);
const FitContain = fitIcon(<>
  <rect x="3" y="3" width="18" height="18" rx="1.5" />
  <rect x="5" y="8" width="14" height="8" rx="1" fill="currentColor" fillOpacity="0.18" />
</>);
const FitFill = fitIcon(<>
  <rect x="3" y="3" width="18" height="18" rx="1.5" fill="currentColor" fillOpacity="0.18" />
  <path d="M7 12h10" />
  <path d="M9 10 7 12l2 2" />
  <path d="m15 10 2 2-2 2" />
</>);
const FitNone = fitIcon(<>
  <rect x="3" y="3" width="18" height="18" rx="1.5" />
  <rect x="10" y="10" width="4" height="4" rx="0.5" fill="currentColor" fillOpacity="0.35" />
</>);

const charIcon = ({ chars, italic = false, line = null }) =>
  function CharIcon({ size = 16, strokeWidth = 1.75, ...rest }) {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
        {...rest}
      >
        <text
          x="12"
          y="17"
          fill="currentColor"
          stroke="none"
          textAnchor="middle"
          fontFamily="system-ui, -apple-system, 'Segoe UI', sans-serif"
          fontSize="13"
          fontWeight="600"
          fontStyle={italic ? 'italic' : 'normal'}
        >
          {chars}
        </text>
        {line === 'under' && <line x1="6" y1="20" x2="18" y2="20" />}
        {line === 'through' && <line x1="6" y1="13.5" x2="18" y2="13.5" />}
        {line === 'over' && <line x1="6" y1="5" x2="18" y2="5" />}
      </svg>
    );
  };

const StyleNormal = charIcon({ chars: 'A' });
const StyleItalic = charIcon({ chars: 'A', italic: true });

const DecorNone = charIcon({ chars: 'A' });
const DecorUnderline = charIcon({ chars: 'A', line: 'under' });
const DecorLineThrough = charIcon({ chars: 'A', line: 'through' });
const DecorOverline = charIcon({ chars: 'A', line: 'over' });

const CaseMixed = charIcon({ chars: 'Aa' });
const CaseUpper = charIcon({ chars: 'AA' });
const CaseLower = charIcon({ chars: 'aa' });
const CaseCap = charIcon({ chars: 'Ab' });

function CornerRadius({ size = 14, strokeWidth = 1.75, ...rest }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...rest}
    >
      <path d="M5 19 V11 a6 6 0 0 1 6 -6 h8" />
    </svg>
  );
}

export const UI = {
  Save,
  Trash: Trash2,
  Close: X,
  Plus,
  ChevronUp,
  ChevronDown,
  ChevronRight,
  ArrowUp,
  ArrowDown,
  GripVertical,
  PanelClose: PanelLeftClose,
  PanelOpen: PanelLeftOpen,
  Link: LinkIcon,
  Unlink: Link2Off,
  Layers,
  Settings,
  Eye,
  EyeOff,
  Pipette,
  Page: LayoutPanelTop,
  Check,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  AlignTop: AlignVerticalJustifyStart,
  AlignMiddle: AlignVerticalJustifyCenter,
  AlignBottom: AlignVerticalJustifyEnd,
  BorderAll: BoxSelect,
  BorderTop: PanelTop,
  BorderBottom: PanelBottom,
  BorderLeft: PanelLeft,
  BorderRight: PanelRight,
  LineNone,
  LineSolid,
  LineDashed,
  LineDotted,
  LineDouble,
  FitCover,
  FitContain,
  FitFill,
  FitNone,
  StyleNormal,
  StyleItalic,
  DecorNone,
  DecorUnderline,
  DecorLineThrough,
  DecorOverline,
  CaseMixed,
  CaseUpper,
  CaseLower,
  CaseCap,
  CornerRadius,
  GapV: MoveVertical,
  GapH: MoveHorizontal,
  Rows: Rows3,
  ColumnsH: Columns3,
  Copy,
  Monitor,
  Tablet,
  Phone: Smartphone,
  Reset: RotateCcw,
  UndoArrow: Undo2,
  RedoArrow: Redo2,
  Truck,
  Shield,
  Refresh: RotateCcw,
  Lock,
  PlusCircle,
  CreditCard,
  Leaf,
  Star,
  Heart,
  Search,
  User,
};

export function BlockIcon({ name, size = 16 }) {
  const Cmp = BLOCK_ICON_MAP[name];
  if (!Cmp) return <span style={{ fontSize: size - 2 }}>{name}</span>;
  return <Cmp size={size} strokeWidth={1.75} />;
}
