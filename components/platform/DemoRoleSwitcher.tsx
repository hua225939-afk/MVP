"use client";

import { useRouter } from "next/navigation";
import { demoRoles, type DemoRoleId } from "@/data/mock/platform-data";

export function DemoRoleSwitcher({ currentRole }: { currentRole: DemoRoleId }) {
  const router = useRouter();

  return (
    <label className="role-switcher">
      <span>演示角色</span>
      <select
        aria-label="切换演示角色"
        onChange={(event) => router.push(event.target.value)}
        value={demoRoles.find((role) => role.id === currentRole)?.href}
      >
        {demoRoles.map((role) => (
          <option key={role.id} value={role.href}>
            {role.name}
          </option>
        ))}
      </select>
    </label>
  );
}
