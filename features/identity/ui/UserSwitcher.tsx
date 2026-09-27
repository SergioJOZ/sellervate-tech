"use client";

import { useTransition } from "react";
import type { SwitcherOption } from "../domain/seed-users";
import { switchUserAction, signOutAction } from "@/app/actions/switch-user";

interface UserSwitcherProps {
  users: SwitcherOption[];
  currentUserKey: string | null;
}

const roleGroupLabel: Record<"team_lead" | "specialist", string> = {
  team_lead: "Team leads",
  specialist: "Specialists",
};

export function UserSwitcher({ users, currentUserKey }: UserSwitcherProps) {
  const [isPending, startTransition] = useTransition();

  const teamLeads = users.filter((u) => u.roleLabel === "team_lead");
  const specialists = users.filter((u) => u.roleLabel === "specialist");

  function handleSwitch(userKey: string) {
    startTransition(async () => {
      const result = await switchUserAction(userKey);
      if (result && !result.ok) {
        // switchUserAction redirects on success, so reaching here means it failed.
        console.error(`Could not switch user: ${result.reason}`);
      }
    });
  }

  function handleSignOut() {
    startTransition(async () => {
      await signOutAction();
    });
  }

  return (
    <div className="dropdown dropdown-end">
      <div
        tabIndex={0}
        role="button"
        className="btn btn-sm btn-ghost"
        aria-busy={isPending}
      >
        {isPending ? "Switching…" : "Switch user"}
      </div>
      <ul
        tabIndex={0}
        className="menu dropdown-content bg-base-200 rounded-box z-10 mt-2 w-56 p-2 shadow-sm"
      >
        {(
          [
            ["team_lead", teamLeads],
            ["specialist", specialists],
          ] as const
        ).map(([role, users]) => (
          <li key={role}>
            <h2 className="menu-title">{roleGroupLabel[role]}</h2>
            <ul>
              {users.map((user) => (
                <li key={user.key}>
                  <button
                    type="button"
                    disabled={isPending}
                    onClick={() => handleSwitch(user.key)}
                    className={
                      user.key === currentUserKey ? "active" : undefined
                    }
                  >
                    {user.displayName}
                    {user.key === currentUserKey ? " (current)" : ""}
                  </button>
                </li>
              ))}
            </ul>
          </li>
        ))}
        <li className="mt-1 border-t border-base-300 pt-1">
          <button type="button" disabled={isPending} onClick={handleSignOut}>
            Sign out
          </button>
        </li>
      </ul>
    </div>
  );
}
