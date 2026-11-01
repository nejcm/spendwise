/**
 * Lucide icons wrapped with `withUniwind` so `className` (and `colorClassName`) work on Android.
 * Import icons from here — not from `lucide-react-native` directly.
 */
import type { LucideProps } from 'lucide-react-native';
import type { ComponentType } from 'react';
import {
  ALargeSmall as LucideALargeSmall,
  AlertTriangle as LucideAlertTriangle,
  Archive as LucideArchive,
  ArrowDown as LucideArrowDown,
  ArrowDownRight as LucideArrowDownRight,
  ArrowDownUp as LucideArrowDownUp,
  ArrowLeftIcon as LucideArrowLeftIcon,
  ArrowLeftRight as LucideArrowLeftRight,
  ArrowRight as LucideArrowRight,
  ArrowRightIcon as LucideArrowRightIcon,
  ArrowUp as LucideArrowUp,
  ArrowUpRight as LucideArrowUpRight,
  Banknote as LucideBanknote,
  Bell as LucideBell,
  Bot as LucideBot,
  BotIcon as LucideBotIcon,
  BotMessageSquare as LucideBotMessageSquare,
  Brain as LucideBrain,
  BrainCircuit as LucideBrainCircuit,
  Calendar as LucideCalendar,
  Camera as LucideCamera,
  ChartNoAxesColumn as LucideChartNoAxesColumn,
  Check as LucideCheck,
  ChevronDown as LucideChevronDown,
  ChevronLeft as LucideChevronLeft,
  ChevronRight as LucideChevronRight,
  ChevronUp as LucideChevronUp,
  CircleAlert as LucideCircleAlert,
  CircleDollarSign as LucideCircleDollarSign,
  Copy as LucideCopy,
  Database as LucideDatabase,
  DatabaseBackupIcon as LucideDatabaseBackupIcon,
  DatabaseSearch as LucideDatabaseSearch,
  DatabaseZap as LucideDatabaseZap,
  DecimalsArrowRight as LucideDecimalsArrowRight,
  Download as LucideDownload,
  EllipsisVertical as LucideEllipsisVertical,
  Euro as LucideEuro,
  FileWarning as LucideFileWarning,
  GripVertical as LucideGripVertical,
  HelpCircle as LucideHelpCircle,
  Home as LucideHome,
  Import as LucideImport,
  Info as LucideInfo,
  Languages as LucideLanguages,
  LayoutGrid as LucideLayoutGrid,
  Lightbulb as LucideLightbulb,
  Link as LucideLink,
  List as LucideList,
  ListChecks as LucideListChecks,
  ListFilter as LucideListFilter,
  Minus as LucideMinus,
  Paintbrush as LucidePaintbrush,
  Pause as LucidePause,
  Pencil as LucidePencil,
  PencilOff as LucidePencilOff,
  PieChart as LucidePieChart,
  Play as LucidePlay,
  Plus as LucidePlus,
  PlusIcon as LucidePlusIcon,
  Printer as LucidePrinter,
  RefreshCcw as LucideRefreshCcw,
  RepeatIcon as LucideRepeatIcon,
  ScanLine as LucideScanLine,
  Search as LucideSearch,
  Settings as LucideSettings,
  Share as LucideShare,
  Shield as LucideShield,
  SlidersHorizontal as LucideSlidersHorizontal,
  Sparkle as LucideSparkle,
  Sparkles as LucideSparkles,
  SquarePen as LucideSquarePen,
  Sun as LucideSun,
  TrashIcon as LucideTrashIcon,
  TrendingDown as LucideTrendingDown,
  TrendingUp as LucideTrendingUp,
  Upload as LucideUpload,
  User as LucideUser,
  UserIcon as LucideUserIcon,
  X as LucideX,
} from 'lucide-react-native';
import { createElement } from 'react';
import { withUniwind } from 'uniwind';

export type { LucideIcon, LucideProps } from 'lucide-react-native';

/** Use for props that accept any icon from this module (wrapped `withUniwind` components). */
export type UniwindLucideIcon = ComponentType<
  LucideProps & { className?: string; colorClassName?: string; fontClassName?: string }
>;

interface UniwindLucideProps extends LucideProps {
  className?: string;
  colorClassName?: string;
  fontClassName?: string;
}

function createIcon(Icon: ComponentType<LucideProps>): UniwindLucideIcon {
  function IconAdapter({ colorClassName: _colorClassName, fontClassName: _fontClassName, ...props }: UniwindLucideProps) {
    return createElement(Icon, props);
  }

  return withUniwind(IconAdapter) as UniwindLucideIcon;
}

export const ALargeSmall = createIcon(LucideALargeSmall);
export const AlertTriangle = createIcon(LucideAlertTriangle);
export const Archive = createIcon(LucideArchive);
export const ArrowDown = createIcon(LucideArrowDown);
export const ArrowDownUp = createIcon(LucideArrowDownUp);
export const ArrowLeftIcon = createIcon(LucideArrowLeftIcon);
export const ArrowLeftRight = createIcon(LucideArrowLeftRight);
export const ArrowRight = createIcon(LucideArrowRight);
export const ArrowRightIcon = createIcon(LucideArrowRightIcon);
export const ArrowUp = createIcon(LucideArrowUp);
export const Banknote = createIcon(LucideBanknote);
export const Bell = createIcon(LucideBell);
export const Bot = createIcon(LucideBot);
export const BotIcon = createIcon(LucideBotIcon);
export const BotMessageSquare = createIcon(LucideBotMessageSquare);
export const Brain = createIcon(LucideBrain);
export const BrainCircuit = createIcon(LucideBrainCircuit);
export const Calendar = createIcon(LucideCalendar);
export const Camera = createIcon(LucideCamera);
export const ChartNoAxesColumn = createIcon(LucideChartNoAxesColumn);
export const Check = createIcon(LucideCheck);
export const ChevronDown = createIcon(LucideChevronDown);
export const CircleAlert = createIcon(LucideCircleAlert);
export const CircleDollarSign = createIcon(LucideCircleDollarSign);
export const Copy = createIcon(LucideCopy);
export const Database = createIcon(LucideDatabase);
export const DatabaseBackupIcon = createIcon(LucideDatabaseBackupIcon);
export const DatabaseSearch = createIcon(LucideDatabaseSearch);
export const DatabaseZap = createIcon(LucideDatabaseZap);
export const DecimalsArrowRight = createIcon(LucideDecimalsArrowRight);
export const Download = createIcon(LucideDownload);
export const EllipsisVertical = createIcon(LucideEllipsisVertical);
export const Euro = createIcon(LucideEuro);
export const FileWarning = createIcon(LucideFileWarning);
export const GripVertical = createIcon(LucideGripVertical);
export const HelpCircle = createIcon(LucideHelpCircle);
export const Home = createIcon(LucideHome);
export const Import = createIcon(LucideImport);
export const Info = createIcon(LucideInfo);
export const Languages = createIcon(LucideLanguages);
export const LayoutGrid = createIcon(LucideLayoutGrid);
export const ListFilter = createIcon(LucideListFilter);
export const Lightbulb = createIcon(LucideLightbulb);
export const Link = createIcon(LucideLink);
export const Minus = createIcon(LucideMinus);
export const List = createIcon(LucideList);
export const ListChecks = createIcon(LucideListChecks);
export const Pencil = createIcon(LucidePencil);
export const PencilOff = createIcon(LucidePencilOff);
export const PieChart = createIcon(LucidePieChart);
export const PlayIcon = createIcon(LucidePlay);
export const Plus = createIcon(LucidePlus);
export const PlusIcon = createIcon(LucidePlusIcon);
export const Printer = createIcon(LucidePrinter);
export const RefreshCcw = createIcon(LucideRefreshCcw);
export const ScanLine = createIcon(LucideScanLine);
export const Search = createIcon(LucideSearch);
export const Share = createIcon(LucideShare);
export const Shield = createIcon(LucideShield);
export const Sun = createIcon(LucideSun);
export const TrashIcon = createIcon(LucideTrashIcon);
export const TrendingDown = createIcon(LucideTrendingDown);
export const TrendingUp = createIcon(LucideTrendingUp);
export const Upload = createIcon(LucideUpload);
export const User = createIcon(LucideUser);
export const UserIcon = createIcon(LucideUserIcon);
export const X = createIcon(LucideX);
export const Settings = createIcon(LucideSettings);
export const SlidersHorizontal = createIcon(LucideSlidersHorizontal);
export const Sparkle = createIcon(LucideSparkle);
export const Sparkles = createIcon(LucideSparkles);
export const SquarePen = createIcon(LucideSquarePen);
export const PauseIcon = createIcon(LucidePause);
export const Paintbrush = createIcon(LucidePaintbrush);
export const ChevronRight = createIcon(LucideChevronRight);
export const ChevronLeft = createIcon(LucideChevronLeft);
export const ChevronUp = createIcon(LucideChevronUp);
export const RepeatIcon = createIcon(LucideRepeatIcon);
export const ArrowUpRight = createIcon(LucideArrowUpRight);
export const ArrowDownRight = createIcon(LucideArrowDownRight);
