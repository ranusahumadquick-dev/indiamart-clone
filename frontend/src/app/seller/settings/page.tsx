'use client';

import { useRouter } from 'next/navigation';
import { HiOutlineShieldCheck, HiOutlineExclamationTriangle, HiOutlineBell } from "@/lib/icons";

export default function SettingsOverview() {
  const router = useRouter();

  const quickLinks = [
    {
      title: 'Security Settings',
      description: 'Change your password and manage account security',
      icon: HiOutlineShieldCheck,
      href: '/seller/settings/security',
      color: 'blue',
    },
    {
      title: 'Account Management',
      description: 'Deactivate or permanently delete your account',
      icon: HiOutlineExclamationTriangle,
      href: '/seller/settings/account',
      color: 'red',
    },
    {
      title: 'Notifications',
      description: 'Control how you receive notifications',
      icon: HiOutlineBell,
      href: '/seller/settings/notifications',
      color: 'green',
    },
  ];

  return (
    <div className="max-w-2xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Settings</h1>
        <p className="text-gray-600">Manage your account preferences and security</p>
      </div>

      <div className="grid gap-4">
        {quickLinks.map((link) => {
          const Icon = link.icon;
          const colorClass = {
            blue: 'border-blue-200 hover:bg-blue-50',
            red: 'border-red-200 hover:bg-red-50',
            green: 'border-green-200 hover:bg-green-50',
          }[link.color];

          const iconColor = {
            blue: 'text-blue-600',
            red: 'text-red-600',
            green: 'text-green-600',
          }[link.color];

          return (
            <button
              key={link.href}
              onClick={() => router.push(link.href)}
              className={`text-left p-6 border rounded-lg transition ${colorClass}`}
            >
              <div className="flex items-start gap-4">
                <Icon className={`w-6 h-6 ${iconColor} flex-shrink-0 mt-1`} />
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">{link.title}</h3>
                  <p className="text-gray-600 text-sm">{link.description}</p>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      <div className="mt-12 p-6 bg-blue-50 border border-blue-200 rounded-lg">
        <h3 className="font-semibold text-blue-900 mb-2">💡 Need Help?</h3>
        <p className="text-sm text-blue-800">
          Contact our support team if you have any questions about your account settings.
        </p>
      </div>
    </div>
  );
}
