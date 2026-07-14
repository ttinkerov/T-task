import Link from 'next/link';
import { cn } from '@/shared/lib/cn';

interface BrandLogoProps {
  href?: string;
  className?: string;
}

function LogoMark() {
  return (
    <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <rect width="32" height="32" rx="9" fill="#BE185D" />
      <rect x="8" y="9" width="4.5" height="14" rx="1.5" fill="white" fillOpacity="0.95" />
      <rect x="13.75" y="9" width="4.5" height="10" rx="1.5" fill="white" fillOpacity="0.75" />
      <rect x="19.5" y="9" width="4.5" height="12" rx="1.5" fill="white" fillOpacity="0.55" />
    </svg>
  );
}

export function BrandLogo({ href = '/', className }: BrandLogoProps) {
  const content = (
    <>
      <span className="tt-brand-logo__mark">
        <LogoMark />
      </span>
      <span className="tt-brand-logo__text">T-task</span>
    </>
  );

  if (!href) {
    return <span className={cn('tt-brand-logo', className)}>{content}</span>;
  }

  return (
    <Link href={href} className={cn('tt-brand-logo', className)}>
      {content}
    </Link>
  );
}
