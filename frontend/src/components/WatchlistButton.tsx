import React, { useState, useEffect } from 'react';
import { Button } from '@mui/material';
import StarIcon from '@mui/icons-material/Star';
import StarBorderIcon from '@mui/icons-material/StarBorder';

interface WatchlistButtonProps {
    symbol: string;
    companyName: string;
}

const WatchlistButton: React.FC<WatchlistButtonProps> = ({ symbol, companyName }) => {
    const [isInWatchlist, setIsInWatchlist] = useState(false);
    const [itemId, setItemId] = useState<number | null>(null);

    useEffect(() => {
        checkWatchlistStatus();
    }, [symbol]);

    const checkWatchlistStatus = async () => {
        try {
            const response = await fetch(`/api/watchlist/check/${symbol}`);
            const data = await response.json();
            setIsInWatchlist(data.in_watchlist);
            setItemId(data.item_id);
        } catch (error) {
            console.error('Error checking watchlist status:', error);
        }
    };

    const handleToggleWatchlist = async () => {
        try {
            if (isInWatchlist && itemId) {
                // Remove from watchlist
                await fetch(`/api/watchlist/${itemId}`, {
                    method: 'DELETE',
                });
                setIsInWatchlist(false);
                setItemId(null);
            } else {
                // Add to watchlist
                const response = await fetch('/api/watchlist', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        symbol,
                        company_name: companyName,
                    }),
                });
                const data = await response.json();
                setIsInWatchlist(true);
                setItemId(data.id);
            }
        } catch (error) {
            console.error('Error toggling watchlist:', error);
        }
    };

    return (
        <Button
            variant="outlined"
            color={isInWatchlist ? 'primary' : 'inherit'}
            onClick={handleToggleWatchlist}
            startIcon={isInWatchlist ? <StarIcon /> : <StarBorderIcon />}
            size="small"
        >
            {isInWatchlist ? 'Remove from Watchlist' : 'Add to Watchlist'}
        </Button>
    );
};

export default WatchlistButton; 