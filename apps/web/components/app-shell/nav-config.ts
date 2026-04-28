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
  Settings as SettingsIcon,
  type LucideIcon,
} from 'lucide-react';

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  /** Optional grouping label rendered above the section. */
  group?: string;
}

export const NAV_ITEMS: NavItem[] = [
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, group: 'Overview' },

  { label: 'Bowtie Library', href: '/bowties', icon: Library, group: 'Bowties' },
  { label: 'New Bowtie', href: '/bowties/new', icon: Plus, group: 'Bowties' },
  { label: 'Bowtie Workspace', href: '/bowties/bt-off-001', icon: Workflow, group: 'Bowties' },

  { label: 'Barrier Register', href: '/barriers', icon: Shield, group: 'Barriers' },
  { label: 'Barrier Health', href: '/barrier-health', icon: HeartPulse, group: 'Barriers' },
  { label: 'Performance Standards', href: '/performance-standards', icon: Gauge, group: 'Barriers' },

  { label: 'Risk Register', href: '/risks', icon: TriangleAlert, group: 'Risk' },
  { label: 'Actions', href: '/actions', icon: CheckSquare, group: 'Risk' },
  { label: 'Verifications', href: '/verifications', icon: ClipboardCheck, group: 'Risk' },

  { label: 'Incidents & Learnings', href: '/incidents', icon: Lightbulb, group: 'Assurance' },
  { label: 'MOC Impact', href: '/moc', icon: GitBranch, group: 'Assurance' },
  { label: 'Audits', href: '/audits', icon: ScrollText, group: 'Assurance' },

  { label: 'Reports', href: '/reports', icon: FileText, group: 'Library' },
  { label: 'Templates', href: '/templates', icon: FileStack, group: 'Library' },

  { label: 'Settings', href: '/settings', icon: SettingsIcon, group: 'System' },
];
