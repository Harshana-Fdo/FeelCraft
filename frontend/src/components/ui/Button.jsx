import { Slot } from '@radix-ui/react-slot';
import { cva } from 'class-variance-authority';
import { cn } from '../../utils/classes';

const button = cva('button', {
  variants: { variant: { primary: 'button-primary', outline: 'button-outline', quiet: 'button-quiet', light: 'button-light' } },
  defaultVariants: { variant: 'primary' },
});

export default function Button({ asChild = false, variant, className, ...props }) {
  const Component = asChild ? Slot : 'button';
  return <Component className={cn(button({ variant }), className)} {...(!asChild && { type: 'button' })} {...props} />;
}
