import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

export function ThemeToggle() {
  const { isDark, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      title={isDark ? 'تفعيل الوضع الفاتح' : 'تفعيل الوضع الداكن'}
      className="relative w-9 h-9 rounded-xl flex items-center justify-center
        text-foreground hover:text-primary hover:bg-muted transition-colors duration-200"
    >
      {/* Sun icon — visible in dark mode (click to go light) */}
      <span
        className="absolute transition-all duration-300"
        style={{
          opacity: isDark ? 1 : 0,
          transform: isDark ? 'rotate(0deg) scale(1)' : 'rotate(90deg) scale(0.6)',
        }}
      >
        <Sun size={19} />
      </span>

      {/* Moon icon — visible in light mode (click to go dark) */}
      <span
        className="absolute transition-all duration-300"
        style={{
          opacity: isDark ? 0 : 1,
          transform: isDark ? 'rotate(-90deg) scale(0.6)' : 'rotate(0deg) scale(1)',
        }}
      >
        <Moon size={19} />
      </span>
    </button>
  );
}
