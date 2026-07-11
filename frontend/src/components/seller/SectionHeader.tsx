'use client';

import React from 'react';

interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  borderColor?: 'blue' | 'green' | 'purple' | 'orange' | 'red' | 'indigo';
  icon?: React.ReactNode;
  action?: React.ReactNode;
}

export default function SectionHeader({
  title,
  subtitle,
  borderColor = 'blue',
  icon,
  action,
}: SectionHeaderProps) {
  const borderColorMap = {
    blue: 'border-blue-600',
    green: 'border-green-600',
    purple: 'border-purple-600',
    orange: 'border-orange-600',
    red: 'border-red-600',
    indigo: 'border-indigo-600',
  };

  return (
    <div className="flex items-center justify-between gap-4 pl-4 border-l-4 animate-fade-in">
      <div className={`${borderColorMap[borderColor]}`}>
        <div className="flex items-center gap-3 mb-2">
          {icon && <div className="text-2xl">{icon}</div>}
          <h3 className="text-2xl font-bold text-gray-900">{title}</h3>
        </div>
        {subtitle && <p className="text-gray-600 text-sm">{subtitle}</p>}
      </div>
      {action && <div>{action}</div>}

      <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-fade-in {
          animation: fadeIn 0.5s ease-out;
        }
      `}</style>
    </div>
  );
}
