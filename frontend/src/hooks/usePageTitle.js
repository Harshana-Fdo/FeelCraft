import { useEffect } from 'react';

export function usePageTitle(title) {
  useEffect(() => {
    document.title = title ? `${title} | FeelCraft` : 'FeelCraft — Every feeling deserves a beautiful expression.';
  }, [title]);
}
