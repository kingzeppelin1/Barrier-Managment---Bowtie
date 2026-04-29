import {
  LayoutDashboard,
  Library,
  Plus,
  Workflow,
  Shield,
  HeartPulse,
  Gauge,
  TriangleAlert,
  CheckSquare,
  ClipboardCheck,
  Lightbulb,
  GitBranch,
  ScrollText,
  FileText,
  FileStack,
  Sparkles,
  Settings as SettingsIcon,
  type LucideIcon,
} from 'lucide-react';

/**
 * Navigation config — labels are i18n keys, resolved at render time via
 * useTranslations('nav.items'). Group keys map into nav.groups.
 */
export interface NavItem {
  /** i18n key under `nav.items`. */
  labelKey: string;
  href: string;
  icon: LucideIcon;
  /** i18n key under `nav.groups`. */
  groupKey?: string;
}

export const NAV_ITEMS: NavItem[] = [
  { labelKey: 'dashboard', href: '/dashboard', icon: LayoutDashboard, groupKey: 'overview' },

  { labelKey: 'bowtieLibrary', href: '/bowties', icon: Library, groupKey: 'bowties' },
  { labelKey: 'newBowtie', href: '/bowties/new', icon: Plus, groupKey: 'bowties' },
  { labelKey: 'bowtieWorkspace', href: '/bowties/bt-off-001', icon: Workflow, groupKey: 'bowties' },

  { labelKey: 'barrierRegister', href: '/barriers', icon: Shield, groupKey: 'barriers' },
  { labelKey: 'barrierHealth', href: '/barrier-health', icon: HeartPulse, groupKey: 'barriers' },
  { labelKey: 'performanceStandards', href: '/performance-standards', icon: Gauge, groupKey: 'barriers' },

  { labelKey: 'riskRegister', href: '/risks', icon: TriangleAlert, groupKey: 'risk' },
  { labelKey: 'actions', href: '/actions', icon: CheckSquare, groupKey: 'risk' },
  { labelKey: 'verifications', href: '/verifications', icon: ClipboardCheck, groupKey: 'risk' },

  { labelKey: 'incidents', href: '/incidents', icon: Lightbulb, groupKey: 'assurance' },
  { labelKey: 'moc', href: '/moc', icon: GitBranch, groupKey: 'assurance' },
  { labelKey: 'audits', href: '/audits', icon: ScrollText, groupKey: 'assurance' },

  { labelKey: 'aiCoachInbox', href: '/ai-coach', icon: Sparkles, groupKey: 'assurance' },

  { labelKey: 'reports', href: '/reports', icon: FileText, groupKey: 'library' },
  { labelKey: 'templates', href: '/templates', icon: FileStack, groupKey: 'library' },

  { labelKey: 'settings', href: '/settings', icon: SettingsIcon, groupKey: 'system' },
];
