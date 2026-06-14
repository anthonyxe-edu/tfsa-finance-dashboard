import {
  LayoutDashboard,
  Receipt,
  PiggyBank,
  Target,
  Bell,
  type LucideIcon,
} from "lucide-react";

export type NavItem = { href: string; label: string; icon: LucideIcon };

export const NAV: NavItem[] = [
  { href: "/", label: "Overview", icon: LayoutDashboard },
  { href: "/spending", label: "Spending", icon: Receipt },
  { href: "/tfsa", label: "TFSA", icon: PiggyBank },
  { href: "/goals", label: "Goals & Life", icon: Target },
  { href: "/notifications", label: "Notifications", icon: Bell },
];

export function activeLabel(pathname: string): string {
  const match = NAV.find((n) =>
    n.href === "/" ? pathname === "/" : pathname.startsWith(n.href),
  );
  return match?.label ?? "Overview";
}
