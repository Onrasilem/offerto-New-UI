/**
 * Modern Component Library
 * Export all design system components
 */

export { default as theme, colors, typography, spacing, borderRadius, shadows } from '../theme';
export { Button } from './Button';
export { Card } from './Card';
export { Input } from './Input';

// Re-export existing UI components for backward compatibility
export * from './UI';
