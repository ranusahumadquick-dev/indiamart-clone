'use client';

import { useRouter, usePathname } from 'next/navigation';
import { HiOutlineShieldCheck, HiOutlineExclamationTriangle, HiOutlineBell, HiOutlinePhone, HiOutlineClipboardDocumentList } from "@/lib/icons";

const settingsNav = [
  {
    label: 'Security',
    href: '/seller/settings/security',
    icon: HiOutlineShieldCheck,
    description: 'Change password and manage authentication',
  },
  {
    label: 'Account',
    href: '/seller/settings/account',
    icon: HiOutlineExclamationTriangle,
    description: 'Deactivate or delete your account',
  },
  {
    label: 'Notifications',
    href: '/seller/settings/notifications',
    icon: HiOutlineBell,
    description: 'Manage notification preferences',
  },
  {
    label: 'Contact Information',
    href: '/seller/settings/contact',
    icon: HiOutlinePhone,
    description: 'Update contact details',
  },
  {
    label: 'Requirements',
    href: '/seller/settings/requirements',
    icon: HiOutlineClipboardDocumentList,
    description: 'Manage buyer requirements',
  },
];

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();

  return (
    <div className="flex gap-6 max-w-7xl mx-auto">
      {/* Sidebar Navigation */}
      <div className="w-64 flex-shrink-0 sticky top-24 h-fit">
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
            <h2 className="font-bold text-gray-900">Settings</h2>
          </div>
          <nav className="divide-y divide-gray-200">
            {settingsNav.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <button
                  key={item.href}
                  onClick={() => router.push(item.href)}
                  className={`w-full text-left px-6 py-4 flex items-start gap-3 transition ${
                    isActive
                      ? 'bg-blue-50 border-l-4 border-blue-600'
                      : 'hover:bg-gray-50'
                  }`}
                >
                  <Icon className={`w-5 h-5 flex-shrink-0 mt-0.5 ${
                    isActive ? 'text-blue-600' : 'text-gray-500'
                  }`} />
                  <div className="min-w-0">
                    <p className={`font-medium text-sm ${
                      isActive ? 'text-blue-900' : 'text-gray-900'
                    }`}>
                      {item.label}
                    </p>
                    <p className="text-xs text-gray-600 line-clamp-1">
                      {item.description}
                    </p>
                  </div>
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 min-w-0">
        {children}
      </div>
    </div>
  );
}
