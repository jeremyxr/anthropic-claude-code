'use client';

import { useSettings } from '@/lib/settings-context';

interface StatusBadgeProps {
  status: string;
  type?: 'initiative' | 'project' | 'milestone' | 'deliverable';
}

export default function StatusBadge({ status, type = 'initiative' }: StatusBadgeProps) {
  const { getStatusColor, getStatusLabel } = useSettings();

  // Get the color from settings (hex code)
  const hexColor = getStatusColor(type, status);

  // Get the display label from settings
  const displayText = getStatusLabel(type, status);

  // Convert hex to lighter version for background (simple approach)
  const hexToRgb = (hex: string) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : { r: 107, g: 115, b: 128 }; // Default gray
  };

  const rgb = hexToRgb(hexColor);
  const bgColor = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.1)`;
  const textColor = hexColor;

  return (
    <span
      className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
      style={{
        backgroundColor: bgColor,
        color: textColor,
        border: `1px solid ${hexColor}33` // 33 = 20% opacity
      }}
    >
      {displayText}
    </span>
  );
}
