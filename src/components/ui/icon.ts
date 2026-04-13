/**
 * Lucide icons wrapped with `withUniwind` so `className` (and `colorClassName`) work on Android.
 * Import icons from here — not from `lucide-react-native` directly.
 */
import type { LucideProps } from 'lucide-react-native';
import type { ComponentType } from 'react';
import { ALargeSmall as LucideALargeSmall, ArrowDown as LucideArrowDown, ArrowLeftIcon as LucideArrowLeftIcon, ArrowRight as LucideArrowRight, ArrowRightIcon as LucideArrowRightIcon, ArrowUp as LucideArrowUp, Banknote as LucideBanknote, Bell as LucideBell, Bot as LucideBot, BotIcon as LucideBotIcon, BotMessageSquare as LucideBotMessageSquare, Brain as LucideBrain, BrainCircuit as LucideBrainCircuit, Calendar as LucideCalendar, Camera as LucideCamera, Check as LucideCheck, ChevronDown as LucideChevronDown, CircleDollarSign as LucideCircleDollarSign, Database as LucideDatabase, DatabaseBackupIcon as LucideDatabaseBackupIcon, DatabaseSearch as LucideDatabaseSearch, DatabaseZap as LucideDatabaseZap, DecimalsArrowRight as LucideDecimalsArrowRight, Download as LucideDownload, Euro as LucideEuro, FileWarning as LucideFileWarning, HelpCircle as LucideHelpCircle, Home as LucideHome, Import as LucideImport, Languages as LucideLanguages, LayoutGrid as LucideLayoutGrid, Lightbulb as LucideLightbulb, Link as LucideLink, ListChecks as LucideListChecks, Pause as LucidePause, Pencil as LucidePencil, PencilOff as LucidePencilOff, PieChart as LucidePieChart, Plus as LucidePlus, PlusIcon as LucidePlusIcon, Printer as LucidePrinter, RefreshCcw as LucideRefreshCcw, ScanLine as LucideScanLine, SendHorizonal as LucideSendHorizonal, Settings as LucideSettings, Share as LucideShare, Shield as LucideShield, Sun as LucideSun, TrashIcon as LucideTrashIcon, TrendingDown as LucideTrendingDown, TrendingUp as LucideTrendingUp, Upload as LucideUpload, User as LucideUser, UserIcon as LucideUserIcon, X as LucideX } from 'lucide-react-native';
import { withUniwind } from 'uniwind';

export type { LucideIcon, LucideProps } from 'lucide-react-native';

/** Use for props that accept any icon from this module (wrapped `withUniwind` components). */
export type UniwindLucideIcon = ComponentType<
  LucideProps & { className?: string; colorClassName?: string; fontClassName?: string }
>;

export const ALargeSmall = withUniwind(LucideALargeSmall);
export const ArrowDown = withUniwind(LucideArrowDown);
export const ArrowLeftIcon = withUniwind(LucideArrowLeftIcon);
export const ArrowRight = withUniwind(LucideArrowRight);
export const ArrowRightIcon = withUniwind(LucideArrowRightIcon);
export const ArrowUp = withUniwind(LucideArrowUp);
export const Banknote = withUniwind(LucideBanknote);
export const Bell = withUniwind(LucideBell);
export const Bot = withUniwind(LucideBot);
export const BotIcon = withUniwind(LucideBotIcon);
export const BotMessageSquare = withUniwind(LucideBotMessageSquare);
export const Brain = withUniwind(LucideBrain);
export const BrainCircuit = withUniwind(LucideBrainCircuit);
export const Calendar = withUniwind(LucideCalendar);
export const Camera = withUniwind(LucideCamera);
export const Check = withUniwind(LucideCheck);
export const ChevronDown = withUniwind(LucideChevronDown);
export const CircleDollarSign = withUniwind(LucideCircleDollarSign);
export const Database = withUniwind(LucideDatabase);
export const DatabaseBackupIcon = withUniwind(LucideDatabaseBackupIcon);
export const DatabaseSearch = withUniwind(LucideDatabaseSearch);
export const DatabaseZap = withUniwind(LucideDatabaseZap);
export const DecimalsArrowRight = withUniwind(LucideDecimalsArrowRight);
export const Download = withUniwind(LucideDownload);
export const Euro = withUniwind(LucideEuro);
export const FileWarning = withUniwind(LucideFileWarning);
export const HelpCircle = withUniwind(LucideHelpCircle);
export const Home = withUniwind(LucideHome);
export const Import = withUniwind(LucideImport);
export const Languages = withUniwind(LucideLanguages);
export const LayoutGrid = withUniwind(LucideLayoutGrid);
export const Lightbulb = withUniwind(LucideLightbulb);
export const Link = withUniwind(LucideLink);
export const ListChecks = withUniwind(LucideListChecks);
export const Pencil = withUniwind(LucidePencil);
export const PencilOff = withUniwind(LucidePencilOff);
export const PieChart = withUniwind(LucidePieChart);
export const Plus = withUniwind(LucidePlus);
export const PlusIcon = withUniwind(LucidePlusIcon);
export const Printer = withUniwind(LucidePrinter);
export const RefreshCcw = withUniwind(LucideRefreshCcw);
export const ScanLine = withUniwind(LucideScanLine);
export const SendHorizonal = withUniwind(LucideSendHorizonal);
export const Share = withUniwind(LucideShare);
export const Shield = withUniwind(LucideShield);
export const Sun = withUniwind(LucideSun);
export const TrashIcon = withUniwind(LucideTrashIcon);
export const TrendingDown = withUniwind(LucideTrendingDown);
export const TrendingUp = withUniwind(LucideTrendingUp);
export const Upload = withUniwind(LucideUpload);
export const User = withUniwind(LucideUser);
export const UserIcon = withUniwind(LucideUserIcon);
export const X = withUniwind(LucideX);
export const Settings = withUniwind(LucideSettings);
export const PauseIcon = withUniwind(LucidePause);
