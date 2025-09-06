import React from 'react';
import { Sun, Moon, Monitor } from 'lucide-react';
import { useTheme } from '../../hooks/useTheme';

const Header: React.FC = () => {
  const { theme, setTheme } = useTheme();

  const getThemeIcon = () => {
    switch (theme) {
      case 'light':
        return <Sun className="h-5 w-5" />;
      case 'dark':
        return <Moon className="h-5 w-5" />;
      case 'system':
        return <Monitor className="h-5 w-5" />;
    }
  };

  const getNextTheme = (): 'light' | 'dark' | 'system' => {
    const themes: ('light' | 'dark' | 'system')[] = ['light', 'dark', 'system'];
    const currentIndex = themes.indexOf(theme);
    return themes[(currentIndex + 1) % themes.length];
  };

  const getThemeLabel = (t: 'light' | 'dark' | 'system') => {
    switch (t) {
      case 'light': return 'Light';
      case 'dark': return 'Dark';
      case 'system': return 'System';
    }
  };

  return (
    <header className="bg-white dark:bg-gray-900">
      <div className="flex items-center justify-between px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="w-6 h-6 bg-gray-600 rounded flex items-center justify-center">
            <span className="text-white text-sm">📊</span>
          </div>
          <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
            RAG Document Analysis
          </h1>
        </div>
        
        <div className="flex items-center gap-2">
          {/* Theme Switcher */}
          <button
            onClick={() => setTheme(getNextTheme())}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors group relative"
            aria-label={`Switch to ${getThemeLabel(getNextTheme())} theme`}
          >
            <span className="text-gray-600 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-gray-100">
              {getThemeIcon()}
            </span>
            {/* Tooltip */}
            <span className="absolute -bottom-8 right-0 text-xs bg-gray-900 dark:bg-gray-700 text-white px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
              {getThemeLabel(theme)}
            </span>
          </button>

        </div>
      </div>
    </header>
  );
};

export default Header;