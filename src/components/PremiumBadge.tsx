import { Crown } from 'lucide-react';

interface PremiumBadgeProps {
    size?: 'sm' | 'md' | 'lg';
    showLabel?: boolean;
}

export default function PremiumBadge({ size = 'md', showLabel = false }: PremiumBadgeProps) {
    const sizeClasses = {
        sm: 'w-4 h-4',
        md: 'w-5 h-5',
        lg: 'w-6 h-6',
    };

    const textSizes = {
        sm: 'text-xs',
        md: 'text-sm',
        lg: 'text-base',
    };

    return (
        <div className="inline-flex items-center gap-1">
            <Crown className={`${sizeClasses[size]} text-yellow-500`} />
            {showLabel && (
                <span className={`${textSizes[size]} font-medium text-yellow-500`}>
                    Premium
                </span>
            )}
        </div>
    );
}
