import React, { useState, useCallback } from 'react';
import { AnonymityLevelIndicator } from './AnonymityLevelIndicator';
import { AnonymityLevelSetupCard } from './AnonymityLevelSetupCard';

interface AnonymityLevelSetupProps {
    className?: string;
}

export const AnonymityLevelSetup = ({ className }: AnonymityLevelSetupProps) => {
    const [isOpen, setIsOpen] = useState(false);

    const handleClick = useCallback(() => setIsOpen(prevState => !prevState), []);
    const handleClickOutside = useCallback(() => setIsOpen(false), []);

    return (
        <div className={className}>
            <AnonymityLevelIndicator onClick={handleClick} />
            {isOpen && <AnonymityLevelSetupCard onClickOutside={handleClickOutside} />}
        </div>
    );
};
