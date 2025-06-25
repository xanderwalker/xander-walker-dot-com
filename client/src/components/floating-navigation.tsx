import { Link } from 'wouter';

interface NavBubbleProps {
  to?: string;
  href?: string;
  emoji: string;
  label: string;
  onClick?: () => void;
}

function NavBubble({ to, href, emoji, label, onClick }: NavBubbleProps) {
  const handleClick = (e: React.MouseEvent) => {
    if (onClick) {
      e.preventDefault();
      onClick();
    }
  };

  const bubbleContent = (
    <div className="text-center">
      <div className="text-2xl mb-1">{emoji}</div>
      <div className="text-xs font-medium">{label}</div>
    </div>
  );

  const bubbleClassName = "nav-bubble w-20 h-20 md:w-24 md:h-24 rounded-full flex items-center justify-center cursor-pointer";

  if (href) {
    return (
      <a 
        href={href} 
        target="_blank" 
        rel="noopener noreferrer"
        className={bubbleClassName}
        onClick={handleClick}
      >
        {bubbleContent}
      </a>
    );
  }

  if (to) {
    return (
      <Link href={to} className={bubbleClassName} onClick={handleClick}>
        {bubbleContent}
      </Link>
    );
  }

  return (
    <button className={bubbleClassName} onClick={handleClick}>
      {bubbleContent}
    </button>
  );
}

export default function FloatingNavigation() {
  return (
    <nav className="relative z-30">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8 max-w-2xl">
        <NavBubble to="/about" emoji="👨‍💻" label="Bio" />
        <NavBubble 
          href="https://linkedin.com" 
          emoji="💼" 
          label="LinkedIn"
        />
        <NavBubble to="/portfolio" emoji="🏪" label="Store" />
        <NavBubble to="/contact" emoji="📫" label="Contact" />
      </div>
    </nav>
  );
}
