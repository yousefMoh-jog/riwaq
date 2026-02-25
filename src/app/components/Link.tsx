import { ReactNode } from "react";

interface LinkProps {
  href: string;
  children: ReactNode;
  className?: string;
  onClick?: () => void;
}

export function Link({ href, children, className = "", onClick }: LinkProps) {
  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    
    // Update URL without page reload
    window.history.pushState({}, "", href);
    
    // Dispatch custom event for routing
    window.dispatchEvent(new PopStateEvent("popstate"));
    
    if (onClick) onClick();
  };

  return (
    <a href={href} onClick={handleClick} className={className}>
      {children}
    </a>
  );
}
