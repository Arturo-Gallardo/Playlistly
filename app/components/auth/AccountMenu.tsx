"use client";

import { signOut } from "next-auth/react";

type AccountMenuProps = {
  email: string | null;
  imageUrl: string | null;
  name: string | null;
};

export function AccountMenu({ email, imageUrl, name }: AccountMenuProps) {
  const fallbackLabel = getFallbackLabel(name, email);

  return (
    <div className="group/account relative">
      <button
        aria-label="open account menu"
        className="relative grid size-9 overflow-hidden rounded-full border border-white/45 bg-white/5 text-xs font-semibold text-white transition hover:border-[#CA3E47]"
        title="Account"
        type="button"
      >
        {imageUrl ? (
          <img
            alt=""
            className="size-full object-cover"
            decoding="async"
            referrerPolicy="no-referrer"
            src={imageUrl}
          />
        ) : (
          <span className="grid size-full place-items-center">{fallbackLabel}</span>
        )}
      </button>

      <div
        className="invisible absolute right-0 top-full w-56 opacity-0 transition before:absolute before:-top-2 before:right-0 before:left-0 before:h-2 before:content-[''] group-hover/account:visible group-hover/account:opacity-100 group-focus-within/account:visible group-focus-within/account:opacity-100"
      >
        <div className="rounded-md border border-white/15 bg-[#111111]/90 p-3 shadow-2xl backdrop-blur">
          <div className="mb-3 min-w-0">
            {name ? (
              <p className="font-control truncate text-xs font-semibold text-white">
                {name}
              </p>
            ) : null}
            {email ? (
              <p className="mt-1 truncate text-[11px] text-white/55">{email}</p>
            ) : null}
          </div>

          <button
            className="toolbar-button w-full text-center"
            onClick={() => void signOut()}
            type="button"
          >
            logout
          </button>
        </div>
      </div>
    </div>
  );
}

function getFallbackLabel(name: string | null, email: string | null) {
  const labelSource = name ?? email ?? "U";
  return labelSource.slice(0, 1).toUpperCase();
}
