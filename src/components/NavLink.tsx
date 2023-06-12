'use client';

import React from 'react';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { clsx } from 'clsx';

export interface NavLinkProps {
  href: string;
  label: string;
}

export const NavLink = ({ href, label }: NavLinkProps) => {
  const pathname = usePathname();
  return (
    <Link
      className={clsx(
        'rounded-md px-3 py-2 text-sm font-medium',
        pathname === href ? 'text-white' : 'text-gray-300 hover:bg-gray-700 hover:text-white'
      )}
      href={href}
    >
      {label}
    </Link>
  );
};
