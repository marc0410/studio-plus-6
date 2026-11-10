import {
  AddCircle,
  ArrowDown2,
  ArrowLeft2,
  ArrowRight2,
  Calendar1,
  CalendarTick,
  Chart2,
  Clock,
  Danger,
  ExportSquare,
  Home2,
  LogoutCurve,
  Menu,
  Moon,
  Profile2User,
  SearchNormal1,
  Setting2,
  Sms,
  Sun1,
  TickCircle,
  UserSquare,
} from "iconsax-react";
import type { Icon } from "iconsax-react";

const portalIcons = {
  add: AddCircle,
  arrowDown: ArrowDown2,
  arrowLeft: ArrowLeft2,
  arrowRight: ArrowRight2,
  calendar: Calendar1,
  calendarTick: CalendarTick,
  chart: Chart2,
  clock: Clock,
  danger: Danger,
  external: ExportSquare,
  home: Home2,
  logout: LogoutCurve,
  menu: Menu,
  moon: Moon,
  people: Profile2User,
  search: SearchNormal1,
  settings: Setting2,
  sms: Sms,
  sun: Sun1,
  tick: TickCircle,
  user: UserSquare,
} satisfies Record<string, Icon>;

export type PortalIconName = keyof typeof portalIcons;

export function PortalIcon({ name, size = 18, className }: { name: PortalIconName; size?: number; className?: string }) {
  const IconComponent = portalIcons[name];
  return <IconComponent aria-hidden="true" focusable="false" className={className} size={size} color="currentColor" variant="Linear" />;
}
