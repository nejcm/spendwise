/**
 * Lucide icons wrapped with `withUniwind` so `className` (and `colorClassName`) work on Android.
 * Import icons from here — not from `lucide-react-native` directly.
 */
import type { LucideProps } from 'lucide-react-native';
import type { ComponentType } from 'react';
import {
  ALargeSmall as LucideALargeSmall,
  AlertTriangle as LucideAlertTriangle,
  ArrowDown as LucideArrowDown,
  ArrowDownRight as LucideArrowDownRight,
  ArrowLeftIcon as LucideArrowLeftIcon,
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
  Check as LucideCheck,
  ChevronDown as LucideChevronDown,
  ChevronLeft as LucideChevronLeft,
  ChevronRight as LucideChevronRight,
  ChevronUp as LucideChevronUp,
  CircleDollarSign as LucideCircleDollarSign,
  Database as LucideDatabase,
  DatabaseBackupIcon as LucideDatabaseBackupIcon,
  DatabaseSearch as LucideDatabaseSearch,
  DatabaseZap as LucideDatabaseZap,
  DecimalsArrowRight as LucideDecimalsArrowRight,
  Download as LucideDownload,
  EllipsisVertical as LucideEllipsisVertical,
  Euro as LucideEuro,
  FileWarning as LucideFileWarning,
  HelpCircle as LucideHelpCircle,
  Home as LucideHome,
  Import as LucideImport,
  Languages as LucideLanguages,
  LayoutGrid as LucideLayoutGrid,
  Lightbulb as LucideLightbulb,
  Link as LucideLink,
  ListChecks as LucideListChecks,
  Paintbrush as LucidePaintbrush,
  Pause as LucidePause,
  Pencil as LucidePencil,
  PencilOff as LucidePencilOff,
  PieChart as LucidePieChart,
  Plus as LucidePlus,
  PlusIcon as LucidePlusIcon,
  Printer as LucidePrinter,
  RefreshCcw as LucideRefreshCcw,
  RepeatIcon as LucideRepeatIcon,
  ScanLine as LucideScanLine,
  SendHorizonal as LucideSendHorizonal,
  Settings as LucideSettings,
  Share as LucideShare,
  Shield as LucideShield,
  SlidersHorizontal as LucideSlidersHorizontal,
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
export const ArrowDown = createIcon(LucideArrowDown);
export const ArrowLeftIcon = createIcon(LucideArrowLeftIcon);
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
export const Check = createIcon(LucideCheck);
export const ChevronDown = createIcon(LucideChevronDown);
export const CircleDollarSign = createIcon(LucideCircleDollarSign);
export const Database = createIcon(LucideDatabase);
export const DatabaseBackupIcon = createIcon(LucideDatabaseBackupIcon);
export const DatabaseSearch = createIcon(LucideDatabaseSearch);
export const DatabaseZap = createIcon(LucideDatabaseZap);
export const DecimalsArrowRight = createIcon(LucideDecimalsArrowRight);
export const Download = createIcon(LucideDownload);
export const EllipsisVertical = createIcon(LucideEllipsisVertical);
export const Euro = createIcon(LucideEuro);
export const FileWarning = createIcon(LucideFileWarning);
export const HelpCircle = createIcon(LucideHelpCircle);
export const Home = createIcon(LucideHome);
export const Import = createIcon(LucideImport);
export const Languages = createIcon(LucideLanguages);
export const LayoutGrid = createIcon(LucideLayoutGrid);
export const Lightbulb = createIcon(LucideLightbulb);
export const Link = createIcon(LucideLink);
export const ListChecks = createIcon(LucideListChecks);
export const Pencil = createIcon(LucidePencil);
export const PencilOff = createIcon(LucidePencilOff);
export const PieChart = createIcon(LucidePieChart);
export const Plus = createIcon(LucidePlus);
export const PlusIcon = createIcon(LucidePlusIcon);
export const Printer = createIcon(LucidePrinter);
export const RefreshCcw = createIcon(LucideRefreshCcw);
export const ScanLine = createIcon(LucideScanLine);
export const SendHorizonal = createIcon(LucideSendHorizonal);
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
export const PauseIcon = createIcon(LucidePause);
export const Paintbrush = createIcon(LucidePaintbrush);
export const ChevronRight = createIcon(LucideChevronRight);
export const ChevronLeft = createIcon(LucideChevronLeft);
export const ChevronUp = createIcon(LucideChevronUp);
export const RepeatIcon = createIcon(LucideRepeatIcon);
export const ArrowUpRight = createIcon(LucideArrowUpRight);
export const ArrowDownRight = createIcon(LucideArrowDownRight);
