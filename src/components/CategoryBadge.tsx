import { type Category, CATEGORY_COLORS, CATEGORY_ICONS } from '../types/receipt';

interface Props {
  category: Category;
  size?: 'sm' | 'md';
}

export default function CategoryBadge({ category, size = 'md' }: Props) {
  const color = CATEGORY_COLORS[category];
  const icon = CATEGORY_ICONS[category];

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full font-medium ${
        size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-3 py-1 text-sm'
      }`}
      style={{
        backgroundColor: `${color}15`,
        color: color,
        border: `1px solid ${color}30`,
      }}
    >
      <span>{icon}</span>
      {category}
    </span>
  );
}
