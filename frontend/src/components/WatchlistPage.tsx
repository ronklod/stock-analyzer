import React, { useState, useEffect } from 'react';
import {
    Container,
    Typography,
    Paper,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    IconButton,
    Box,
    CircularProgress,
    Tooltip,
    Alert,
    Button,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import CommentIcon from '@mui/icons-material/Comment';
import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useApi } from '../utils/apiClient';

interface WatchlistItem {
    id: number;
    symbol: string;
    company_name: string;
    added_date: string;
    notes: string | null;
}

const WatchlistPage: React.FC = () => {
    const { isAuthenticated } = useAuth();
    const api = useApi();
    const [watchlist, setWatchlist] = useState<WatchlistItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchWatchlist = async () => {
        try {
            setError(null);
            const data = await api.getUserWatchlist();
            setWatchlist(data);
        } catch (error) {
            console.error('Error fetching watchlist:', error);
            setError('Failed to load your watchlist. Please try again later.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (isAuthenticated) {
            fetchWatchlist();
        }
    }, [isAuthenticated]);

    const handleDelete = async (id: number) => {
        try {
            await api.removeFromUserWatchlist(id);
            setWatchlist(watchlist.filter(item => item.id !== id));
        } catch (error) {
            console.error('Error deleting watchlist item:', error);
            setError('Failed to delete item. Please try again.');
        }
    };
    
    // Redirect to login if not authenticated
    if (!isAuthenticated) {
        return <Navigate to="/login" />;
    }

    if (loading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
                <CircularProgress />
            </Box>
        );
    }

    return (
        <Container maxWidth="lg" sx={{ mt: 4 }}>
            <Typography variant="h4" component="h1" gutterBottom>
                My Watchlist
            </Typography>

            {watchlist.length === 0 ? (
                <Paper sx={{ p: 3, textAlign: 'center' }}>
                    <Typography variant="body1">
                        Your watchlist is empty. Add stocks from the screener pages to start tracking them.
                    </Typography>
                </Paper>
            ) : (
                <TableContainer component={Paper}>
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell>Symbol</TableCell>
                                <TableCell>Company Name</TableCell>
                                <TableCell>Added Date</TableCell>
                                <TableCell>Notes</TableCell>
                                <TableCell align="right">Actions</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {watchlist.map((item) => (
                                <TableRow key={item.id}>
                                    <TableCell>
                                        <Link to={`/?ticker=${item.symbol}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                                            {item.symbol}
                                        </Link>
                                    </TableCell>
                                    <TableCell>{item.company_name}</TableCell>
                                    <TableCell>
                                        {new Date(item.added_date).toLocaleDateString()}
                                    </TableCell>
                                    <TableCell>
                                        {item.notes ? (
                                            <Tooltip title={item.notes} placement="top">
                                                <IconButton size="small" sx={{ color: 'primary.main' }}>
                                                    <CommentIcon />
                                                </IconButton>
                                            </Tooltip>
                                        ) : (
                                            '-'
                                        )}
                                    </TableCell>
                                    <TableCell align="right">
                                        <IconButton
                                            onClick={() => handleDelete(item.id)}
                                            color="error"
                                            size="small"
                                        >
                                            <DeleteIcon />
                                        </IconButton>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            )}
        </Container>
    );
};

export default WatchlistPage; 