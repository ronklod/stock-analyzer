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
import { useAuth } from '../context/AuthContext';
import { useApi } from '../utils/apiClient';
import { useNavigate } from 'react-router-dom';

interface WatchlistButtonProps {
    symbol: string;
    companyName: string;
}

const WatchlistButton: React.FC<WatchlistButtonProps> = ({ symbol, companyName }) => {
    const { isAuthenticated } = useAuth();
    const api = useApi();
    const navigate = useNavigate();
    const [isInWatchlist, setIsInWatchlist] = useState(false);
    const [itemId, setItemId] = useState<number | null>(null);
    const [openDialog, setOpenDialog] = useState(false);
    const [comment, setComment] = useState('');
    const [currentComment, setCurrentComment] = useState<string | null>(null);

    useEffect(() => {
        if (isAuthenticated) {
            checkWatchlistStatus();
        }
    }, [symbol, isAuthenticated]);

    const checkWatchlistStatus = async () => {
        if (!isAuthenticated) return;
        try {
            const data = await api.checkUserWatchlist(symbol);
            setIsInWatchlist(data.in_watchlist);
            setItemId(data.item_id);
            setCurrentComment(data.notes || null);
        } catch (error) {
            console.error('Error checking watchlist status:', error);
        }
    };

    const handleAddToWatchlist = () => {
        if (!isAuthenticated) {
            navigate('/login');
            return;
        }
        setOpenDialog(true);
    };

    const handleCloseDialog = () => {
        setOpenDialog(false);
        setComment('');
    };

    const handleSaveComment = async () => {
        try {
            const data = await api.addToUserWatchlist(
                symbol,
                companyName,
                comment.trim() || undefined
            );
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
                await api.removeFromUserWatchlist(itemId);
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
                    className="watchlist-button"
                    sx={{
                        borderColor: isInWatchlist ? undefined : 'rgba(255, 255, 255, 0.5)',
                        color: isInWatchlist ? undefined : 'inherit',
                        '&:hover': {
                            borderColor: isInWatchlist ? undefined : 'rgba(255, 255, 255, 0.8)',
                            backgroundColor: isInWatchlist ? undefined : 'rgba(255, 255, 255, 0.05)'
                        }
                    }}
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