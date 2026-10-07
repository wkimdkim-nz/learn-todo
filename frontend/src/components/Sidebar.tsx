import type { ReactNode } from "react";

export function Sidebar() {
  return (
    <aside className="flex w-60 shrink-0 flex-col gap-6 border-r border-stone-200 bg-stone-100 p-4">
      <div className="text-lg font-semibold tracking-tight">Todo</div>

      <nav className="flex flex-col gap-0.5">
        <SectionLabel>Status</SectionLabel>
        <NavItem active>Any status</NavItem>
        <NavItem>Active</NavItem>
        <NavItem>Completed</NavItem>
      </nav>
    </aside>
  );
}

type SectionLabelProps = {
  children: ReactNode;
};

function SectionLabel({ children }: SectionLabelProps) {
  return (
    <div className="mb-1 px-2 text-[11px] font-semibold tracking-wider text-stone-400 uppercase">
      {children}
    </div>
  );
}

type NavItemProps = {
  active?: boolean;
  children: ReactNode;
};

function NavItem({ active = false, children }: NavItemProps) {
  return (
    <div
      className={`rounded-md px-2 py-1.5 text-sm ${
        active ? "bg-white font-medium shadow-sm" : "text-stone-600"
      }`}
    >
      {children}
    </div>
  );
}
