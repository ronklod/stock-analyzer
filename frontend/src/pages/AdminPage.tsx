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
  Button,
  Box,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  IconButton,
  Tooltip,
  CircularProgress,
  Alert,
  Card,
  CardContent,
  CardActions,
  Chip,
  Divider,
  useMediaQuery
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import BlockIcon from '@mui/icons-material/Block';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import PersonIcon from '@mui/icons-material/Person';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import EmailIcon from '@mui/icons-material/Email';
import { format } from 'date-fns';
import { useTheme } from '../context/ThemeContext';
import { useApi } from '../utils/apiClient';

interface User {
  id: number;
  email: string;
  display_name: string | null;
  is_active: boolean;
  is_admin: boolean;
  created_at: string;
}

const AdminPage: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [action, setAction] = useState<'delete' | 'disable' | 'enable' | null>(null);
  const { theme } = useTheme();
  const api = useApi();
  const isMobile = useMediaQuery('(max-width:768px)');
  
  const fetchUsers = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/users', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (!response.ok) {
        throw new Error('You do not have admin privileges');
      }
      
      const data = await response.json();
      setUsers(data);
      setError(null);
    } catch (err) {
      console.error('Error fetching users:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleAction = (user: User, actionType: 'delete' | 'disable' | 'enable') => {
    setSelectedUser(user);
    setAction(actionType);
    setDeleteDialogOpen(true);
  };

  const handleConfirmAction = async () => {
    if (!selectedUser || !action) return;
    
    try {
      let response;
      
      switch (action) {
        case 'delete':
          response = await fetch(`/api/admin/users/${selectedUser.id}`, {
            method: 'DELETE',
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
          });
          break;
        case 'disable':
          response = await fetch(`/api/admin/users/${selectedUser.id}/disable`, {
            method: 'PUT',
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
          });
          break;
        case 'enable':
          response = await fetch(`/api/admin/users/${selectedUser.id}/enable`, {
            method: 'PUT',
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
          });
          break;
      }
      
      if (!response?.ok) {
        const errorData = await response?.json();
        throw new Error(errorData?.detail || 'Action failed');
      }
      
      // Refresh user list
      fetchUsers();
    } catch (err) {
      console.error('Error:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setDeleteDialogOpen(false);
      setSelectedUser(null);
      setAction(null);
    }
  };

  const handleCloseDialog = () => {
    setDeleteDialogOpen(false);
    setSelectedUser(null);
    setAction(null);
  };

  const getActionText = () => {
    if (!selectedUser || !action) return '';
    
    switch (action) {
      case 'delete':
        return `delete user ${selectedUser.email}`;
      case 'disable':
        return `disable user ${selectedUser.email}`;
      case 'enable':
        return `enable user ${selectedUser.email}`;
      default:
        return '';
    }
  };

  // Mobile card view to display user information
  const renderMobileUserCards = () => {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {users.map((user) => (
          <Card 
            key={user.id}
            sx={{ 
              bgcolor: !user.is_active 
                ? (theme === 'dark' ? '#402c3c' : '#fff0f0') 
                : (theme === 'dark' ? '#272738' : 'white'),
              boxShadow: 2,
              borderRadius: 2
            }}
          >
            <CardContent sx={{ pb: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1.5 }}>
                <AccountCircleIcon sx={{ fontSize: 40, mr: 1.5, color: theme === 'dark' ? '#aaa' : '#666' }} />
                <Box sx={{ flexGrow: 1 }}>
                  <Typography variant="h6" sx={{ fontSize: '1.1rem', color: theme === 'dark' ? '#ddd' : '#333', wordBreak: 'break-word' }}>
                    {user.email}
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', mt: 0.5 }}>
                    {user.is_admin ? (
                      <Chip 
                        icon={<AdminPanelSettingsIcon />} 
                        label="Admin" 
                        size="small" 
                        color="primary" 
                        sx={{ mr: 1 }} 
                      />
                    ) : (
                      <Chip 
                        icon={<PersonIcon />} 
                        label="User" 
                        size="small" 
                        variant="outlined" 
                        sx={{ mr: 1 }} 
                      />
                    )}
                    <Chip 
                      label={user.is_active ? "Active" : "Disabled"} 
                      size="small" 
                      color={user.is_active ? "success" : "error"} 
                    />
                  </Box>
                </Box>
              </Box>
              
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, mt: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <EmailIcon sx={{ fontSize: 16, mr: 1, color: theme === 'dark' ? '#aaa' : '#666' }} />
                  <Typography variant="body2" sx={{ color: theme === 'dark' ? '#bbb' : '#555' }}>
                    ID: {user.id}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <PersonIcon sx={{ fontSize: 16, mr: 1, color: theme === 'dark' ? '#aaa' : '#666' }} />
                  <Typography variant="body2" sx={{ color: theme === 'dark' ? '#bbb' : '#555' }}>
                    Name: {user.display_name || '-'}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <CalendarTodayIcon sx={{ fontSize: 16, mr: 1, color: theme === 'dark' ? '#aaa' : '#666' }} />
                  <Typography variant="body2" sx={{ color: theme === 'dark' ? '#bbb' : '#555' }}>
                    Created: {new Date(user.created_at).toLocaleDateString()}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
            
            <Divider sx={{ my: 1, opacity: 0.6 }} />
            
            <CardActions sx={{ display: 'flex', justifyContent: 'flex-end', p: 1.5, pt: 0.5 }}>
              {user.is_active ? (
                <Button 
                  onClick={() => handleAction(user, 'disable')}
                  disabled={user.is_admin}
                  color="warning"
                  variant="outlined"
                  startIcon={<BlockIcon />}
                  size="small"
                  sx={{ mr: 1, minWidth: '100px', minHeight: '36px' }}
                >
                  Disable
                </Button>
              ) : (
                <Button 
                  onClick={() => handleAction(user, 'enable')}
                  color="success"
                  variant="outlined"
                  startIcon={<CheckCircleIcon />}
                  size="small"
                  sx={{ mr: 1, minWidth: '100px', minHeight: '36px' }}
                >
                  Enable
                </Button>
              )}
              <Button 
                onClick={() => handleAction(user, 'delete')}
                disabled={user.is_admin}
                color="error"
                variant="outlined"
                startIcon={<DeleteIcon />}
                size="small"
                sx={{ minWidth: '100px', minHeight: '36px' }}
              >
                Delete
              </Button>
            </CardActions>
          </Card>
        ))}
      </Box>
    );
  };

  // Desktop table view
  const renderDesktopTable = () => {
    return (
      <TableContainer component={Paper} sx={{ 
        boxShadow: 1,
        bgcolor: theme === 'dark' ? '#272738' : 'white',
        borderRadius: 1
      }}>
        <Table sx={{ minWidth: 650 }}>
          <TableHead>
            <TableRow sx={{ bgcolor: theme === 'dark' ? '#1e1e2f' : '#f5f5f5' }}>
              <TableCell sx={{ color: theme === 'dark' ? '#fff' : '#333', fontWeight: 'bold' }}>ID</TableCell>
              <TableCell sx={{ color: theme === 'dark' ? '#fff' : '#333', fontWeight: 'bold' }}>Email</TableCell>
              <TableCell sx={{ color: theme === 'dark' ? '#fff' : '#333', fontWeight: 'bold' }}>Display Name</TableCell>
              <TableCell sx={{ color: theme === 'dark' ? '#fff' : '#333', fontWeight: 'bold' }}>Status</TableCell>
              <TableCell sx={{ color: theme === 'dark' ? '#fff' : '#333', fontWeight: 'bold' }}>Role</TableCell>
              <TableCell sx={{ color: theme === 'dark' ? '#fff' : '#333', fontWeight: 'bold' }}>Created</TableCell>
              <TableCell sx={{ color: theme === 'dark' ? '#fff' : '#333', fontWeight: 'bold' }}>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {users.map((user) => (
              <TableRow 
                key={user.id}
                sx={{ 
                  '&:last-child td, &:last-child th': { border: 0 },
                  bgcolor: !user.is_active ? (theme === 'dark' ? '#402c3c' : '#fff0f0') : 'transparent'
                }}
              >
                <TableCell sx={{ color: theme === 'dark' ? '#ddd' : '#333' }}>{user.id}</TableCell>
                <TableCell sx={{ color: theme === 'dark' ? '#ddd' : '#333' }}>{user.email}</TableCell>
                <TableCell sx={{ color: theme === 'dark' ? '#ddd' : '#333' }}>{user.display_name || '-'}</TableCell>
                <TableCell>
                  <Box sx={{ 
                    display: 'inline-flex', 
                    alignItems: 'center',
                    color: user.is_active 
                      ? (theme === 'dark' ? '#90ee90' : 'green') 
                      : (theme === 'dark' ? '#ff9999' : 'red')
                  }}>
                    {user.is_active ? 'Active' : 'Disabled'}
                  </Box>
                </TableCell>
                <TableCell sx={{ color: theme === 'dark' ? '#ddd' : '#333' }}>
                  {user.is_admin ? 'Admin' : 'User'}
                </TableCell>
                <TableCell sx={{ color: theme === 'dark' ? '#ddd' : '#333' }}>
                  {new Date(user.created_at).toLocaleDateString()}
                </TableCell>
                <TableCell>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    {user.is_active ? (
                      <Tooltip title="Disable User">
                        <IconButton 
                          onClick={() => handleAction(user, 'disable')}
                          disabled={user.is_admin}
                          color="warning"
                          size="small"
                        >
                          <BlockIcon />
                        </IconButton>
                      </Tooltip>
                    ) : (
                      <Tooltip title="Enable User">
                        <IconButton 
                          onClick={() => handleAction(user, 'enable')}
                          color="success"
                          size="small"
                        >
                          <CheckCircleIcon />
                        </IconButton>
                      </Tooltip>
                    )}
                    <Tooltip title="Delete User">
                      <IconButton 
                        onClick={() => handleAction(user, 'delete')}
                        disabled={user.is_admin}
                        color="error"
                        size="small"
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Tooltip>
                  </Box>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    );
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Paper sx={{ p: { xs: 2, md: 3 }, boxShadow: 3, bgcolor: theme === 'dark' ? '#1e1e2f' : 'white' }}>
        <Typography variant="h5" component="h1" gutterBottom sx={{ color: theme === 'dark' ? '#fff' : '#333' }}>
          Admin Dashboard - User Management
        </Typography>
        
        {error && (
          <Alert severity="error" sx={{ my: 2 }}>
            {error}
          </Alert>
        )}
        
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
            <CircularProgress />
          </Box>
        ) : (
          <>
            {/* Conditionally render card view for mobile or table for desktop */}
            {isMobile ? renderMobileUserCards() : renderDesktopTable()}
          </>
        )}
      </Paper>
      
      {/* Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={handleCloseDialog}
      >
        <DialogTitle>Confirm Action</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to {getActionText()}?
            {action === 'delete' && " This action cannot be undone."}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog} color="primary">
            Cancel
          </Button>
          <Button 
            onClick={handleConfirmAction} 
            color={action === 'delete' ? 'error' : action === 'disable' ? 'warning' : 'success'} 
            autoFocus
          >
            Confirm
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default AdminPage;
