/**
 * NavigateButton — Shared tab navigation button for crosslinks.
 * Dispatches the custom `pal:navigate` event to switch tabs.
 */

import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from './Button';

interface NavigateButtonProps {
    label: string;
    targetTab: string;
    direction: 'prev' | 'next';
}

export function NavigateButton({ label, targetTab, direction }: NavigateButtonProps) {
    const isNext = direction === 'next';
    const Icon = isNext ? ChevronRight : ChevronLeft;

    return (
        <Button
            variant={isNext ? 'primary' : 'secondary'}
            onClick={() => window.dispatchEvent(new CustomEvent('pal:navigate', { detail: targetTab }))}
            className={isNext ? "pl-4 pr-3" : "pl-3 pr-4"}
        >
            {!isNext && <Icon className="w-4 h-4 mr-2" />}
            {label}
            {isNext && <Icon className="w-4 h-4 ml-2" />}
        </Button>
    );
}
