import React, { useState, useEffect } from 'react';
import { 
    Button, 
    Dialog, 
    DialogTitle, 
    DialogContent, 
    DialogActions, 
    TextField,
    Tooltip
} from '@mui/material';
import StarIcon from '@mui/icons-material/Star';
import StarBorderIcon from '@mui/icons-material/StarBorder';

interface WatchlistButtonProps {
    symbol: string;
    companyName: string;
}

const WatchlistButton: React.FC<WatchlistButtonProps> = ({ symbol, companyName }) => {
    const [isInWatchlist, setIsInWatchlist] = useState(false);
    const [itemId, setItemId] = useState<number | null>(null);
    const [openDialog, setOpenDialog] = useState(false);
    const [comment, setComment] = useState('');
    const [currentComment, setCurrentComment] = useState<string | null>(null);

    useEffect(() => {
        checkWatchlistStatus();
    }, [symbol]);

    const checkWatchlistStatus = async () => {
        try {
            const response = await fetch(`/api/watchlist/check/${symbol}`);
            const data = await response.json();
            setIsInWatchlist(data.in_watchlist);
            setItemId(data.item_id);
            setCurrentComment(data.notes || null);
        } catch (error) {
            console.error('Error checking watchlist status:', error);
        }
    };

    const handleAddToWatchlist = () => {
        setOpenDialog(true);
    };

    const handleCloseDialog = () => {
        setOpenDialog(false);
        setComment('');
    };

    const handleSaveComment = async () => {
        try {
            const response = await fetch('/api/watchlist', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    symbol,
                    company_name: companyName,
                    notes: comment.trim() || null
                }),
            });
            const data = await response.json();
            setIsInWatchlist(true);
            setItemId(data.id);
            setCurrentComment(comment.trim() || null);
            handleCloseDialog();
        } catch (error) {
            console.error('Error adding to watchlist:', error);
        }
    };

    const handleRemoveFromWatchlist = async () => {
        try {
            if (itemId) {
                await fetch(`/api/watchlist/${itemId}`, {
                    method: 'DELETE',
                });
                setIsInWatchlist(false);
                setItemId(null);
                setCurrentComment(null);
            }
        } catch (error) {
            console.error('Error removing from watchlist:', error);
        }
    };

    return (
        <>
            <Tooltip title={currentComment || ''} placement="top">
                <Button
                    variant="outlined"
                    color={isInWatchlist ? 'primary' : 'inherit'}
                    onClick={isInWatchlist ? handleRemoveFromWatchlist : handleAddToWatchlist}
                    startIcon={isInWatchlist ? <StarIcon /> : <StarBorderIcon />}
                    size="small"
                >
                    {isInWatchlist ? 'Remove from Watchlist' : 'Add to Watchlist'}
                </Button>
            </Tooltip>

            <Dialog open={openDialog} onClose={handleCloseDialog}>
                <DialogTitle>Add to Watchlist</DialogTitle>
                <DialogContent>
                    <TextField
                        autoFocus
                        margin="dense"
                        label="Add a comment (optional)"
                        type="text"
                        fullWidth
                        multiline
                        rows={4}
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                        inputProps={{ maxLength: 500 }}
                        helperText={`${comment.length}/500 characters`}
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseDialog}>Cancel</Button>
                    <Button onClick={handleSaveComment} variant="contained" color="primary">
                        Add to Watchlist
                    </Button>
                </DialogActions>
            </Dialog>
        </>
    );
};

export default WatchlistButton; 