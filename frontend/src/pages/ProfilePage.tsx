import React, { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import {
  Container,
  Paper,
  Typography,
  Box,
  Button,
  Avatar,
  Divider,
  Card,
  CardContent,
  TextField,
  Alert,
  Collapse,
  IconButton,
  FormControl,
  FormLabel,
  RadioGroup,
  FormControlLabel,
  Radio
} from '@mui/material';
import PersonIcon from '@mui/icons-material/Person';
import LogoutIcon from '@mui/icons-material/Logout';
import LockIcon from '@mui/icons-material/Lock';
import CloseIcon from '@mui/icons-material/Close';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import LightModeIcon from '@mui/icons-material/LightMode';
import './Auth.css';

const ProfilePage: React.FC = () => {
  const { user, logout, isAuthenticated, changePassword, updateProfile } = useAuth();
  const { theme, setThemeMode } = useTheme();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  
  // Display name state
  const [displayName, setDisplayName] = useState(user?.displayName || '');
  const [originalDisplayName, setOriginalDisplayName] = useState(user?.displayName || '');
  const [editingName, setEditingName] = useState(false);
  const [nameError, setNameError] = useState('');
  const [nameSuccess, setNameSuccess] = useState(false);

  // Set initial display name when user is loaded
  React.useEffect(() => {
    if (user) {
      setDisplayName(user.displayName || '');
      setOriginalDisplayName(user.displayName || '');
    }
  }, [user]);

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  const handleLogout = () => {
    logout();
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess(false);

    // Validation
    if (newPassword !== confirmPassword) {
      setPasswordError('New passwords do not match');
      return;
    }

    if (newPassword.length < 8) {
      setPasswordError('Password must be at least 8 characters long');
      return;
    }

    try {
      await changePassword(currentPassword, newPassword);
      setPasswordSuccess(true);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error) {
      if (error instanceof Error) {
        setPasswordError(error.message);
      } else {
        setPasswordError('Failed to change password');
      }
    }
  };

  const togglePasswordForm = () => {
    setShowPasswordForm(!showPasswordForm);
    if (!showPasswordForm) {
      setPasswordError('');
      setPasswordSuccess(false);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    }
  };
  
  const startEditingName = () => {
    setEditingName(true);
    setNameError('');
    setNameSuccess(false);
  };
  
  const cancelEditingName = () => {
    setEditingName(false);
    setDisplayName(originalDisplayName);
    setNameError('');
  };
  
  const handleNameUpdate = async () => {
    if (!displayName || displayName.trim() === '') {
      setNameError('Display name cannot be empty');
      return;
    }
    
    try {
      await updateProfile(displayName);
      setNameSuccess(true);
      setOriginalDisplayName(displayName);
      setEditingName(false);
    } catch (error) {
      if (error instanceof Error) {
        setNameError(error.message);
      } else {
        setNameError('Failed to update display name');
      }
    }
  };

  const handleThemeChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setThemeMode(event.target.value as 'light' | 'dark');
  };

  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
      <Paper elevation={3} sx={{ p: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 4 }}>
          <Avatar sx={{ width: 80, height: 80, mr: 3, bgcolor: 'primary.main' }}>
            {user && ((user.displayName && user.displayName[0]) || (user.email && user.email[0]) || 'U')}
          </Avatar>
          <Box>
            <Typography variant="h4" gutterBottom>
              {user && (user.displayName || 'User')}
            </Typography>
            <Typography variant="body1" color="text.secondary">
              {user && user.email}
            </Typography>
          </Box>
        </Box>

        <Divider sx={{ my: 3 }} />

        <Typography variant="h6" gutterBottom>
          Account Information
        </Typography>

        <Box sx={{ mt: 2 }}>
          <Card variant="outlined" sx={{ mb: 2 }}>
            <CardContent>
              <Typography variant="subtitle2" color="text.secondary">
                Email
              </Typography>
              <Typography variant="body1">
                {user ? user.email : ''}
              </Typography>
            </CardContent>
          </Card>

          <Card variant="outlined" sx={{ mb: 2 }}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box>
                  <Typography variant="subtitle2" color="text.secondary">
                    Display Name
                  </Typography>
                  
                  {!editingName ? (
                    <Typography variant="body1">
                      {user ? (user.displayName || 'Not set') : ''}
                    </Typography>
                  ) : (
                    <Box component="form" sx={{ mt: 1 }}>
                      <TextField
                        fullWidth
                        variant="outlined"
                        size="small"
                        label="Display Name"
                        value={displayName}
                        onChange={(e) => setDisplayName(e.target.value)}
                        error={!!nameError}
                        helperText={nameError}
                        sx={{ mb: 2 }}
                      />
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <Button 
                          variant="contained" 
                          size="small"
                          onClick={handleNameUpdate}
                        >
                          Save
                        </Button>
                        <Button 
                          variant="outlined" 
                          size="small"
                          onClick={cancelEditingName}
                        >
                          Cancel
                        </Button>
                      </Box>
                    </Box>
                  )}
                </Box>
                
                {!editingName && (
                  <Button 
                    variant="outlined" 
                    size="small"
                    onClick={startEditingName}
                  >
                    Edit
                  </Button>
                )}
              </Box>
              
              <Collapse in={nameSuccess}>
                <Alert 
                  severity="success"
                  action={
                    <IconButton
                      aria-label="close"
                      color="inherit"
                      size="small"
                      onClick={() => setNameSuccess(false)}
                    >
                      <CloseIcon fontSize="inherit" />
                    </IconButton>
                  }
                  sx={{ mt: 2 }}
                >
                  Display name updated successfully!
                </Alert>
              </Collapse>
            </CardContent>
          </Card>

          <Card variant="outlined" sx={{ mb: 2 }}>
            <CardContent>
              <Typography variant="subtitle2" color="text.secondary">
                Account ID
              </Typography>
              <Typography variant="body1">
                {user ? user.id : ''}
              </Typography>
            </CardContent>
          </Card>
        </Box>

        <Divider sx={{ my: 3 }} />
        
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6" gutterBottom>
            Security
          </Typography>
          
          <Button
            variant="outlined"
            color="primary"
            startIcon={<LockIcon />}
            onClick={togglePasswordForm}
          >
            {showPasswordForm ? 'Cancel' : 'Change Password'}
          </Button>
        </Box>
        
        <Collapse in={showPasswordForm}>
          <Card variant="outlined" sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Change Password
              </Typography>
              
              <Box component="form" onSubmit={handlePasswordChange} sx={{ mt: 2 }}>
                <TextField
                  fullWidth
                  margin="normal"
                  label="Current Password"
                  type="password"
                  required
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                />
                <TextField
                  fullWidth
                  margin="normal"
                  label="New Password"
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />
                <TextField
                  fullWidth
                  margin="normal"
                  label="Confirm New Password"
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  error={newPassword !== confirmPassword && confirmPassword !== ''}
                  helperText={
                    newPassword !== confirmPassword && confirmPassword !== ''
                      ? "Passwords don't match"
                      : ''
                  }
                />
                
                {passwordError && (
                  <Alert severity="error" sx={{ mt: 2, mb: 2 }}>
                    {passwordError}
                  </Alert>
                )}
                
                {passwordSuccess && (
                  <Alert 
                    severity="success" 
                    sx={{ mt: 2, mb: 2 }}
                    action={
                      <IconButton
                        aria-label="close"
                        color="inherit"
                        size="small"
                        onClick={() => setPasswordSuccess(false)}
                      >
                        <CloseIcon fontSize="inherit" />
                      </IconButton>
                    }
                  >
                    Password changed successfully!
                  </Alert>
                )}
                
                <Button
                  type="submit"
                  variant="contained"
                  color="primary"
                  sx={{ mt: 2 }}
                >
                  Update Password
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Collapse>

        <Divider sx={{ my: 3 }} />
        
        <Typography variant="h6" gutterBottom>
          Appearance
        </Typography>
        
        <Box sx={{ mt: 2 }}>
          <Card variant="outlined" sx={{ mb: 2 }}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box>
                  <Typography variant="subtitle2" color="text.secondary">
                    Theme Mode
                  </Typography>
                </Box>
              </Box>
              
              <FormControl component="fieldset" sx={{ mt: 2 }}>
                <RadioGroup
                  aria-label="theme"
                  name="theme-group"
                  value={theme}
                  onChange={(e) => setThemeMode(e.target.value as 'light' | 'dark')}
                  row
                >
                  <FormControlLabel 
                    value="light" 
                    control={<Radio />} 
                    label={
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <LightModeIcon sx={{ mr: 1 }} />
                        Light Mode
                      </Box>
                    }
                  />
                  <FormControlLabel 
                    value="dark" 
                    control={<Radio />} 
                    label={
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <DarkModeIcon sx={{ mr: 1 }} />
                        Dark Mode
                      </Box>
                    }
                  />
                </RadioGroup>
              </FormControl>
              
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                Choose your preferred appearance. This will change the look of the entire application.
              </Typography>
            </CardContent>
          </Card>
        </Box>

        <Divider sx={{ my: 3 }} />

        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 4 }}>
          <Button
            variant="contained"
            color="error"
            startIcon={<LogoutIcon />}
            onClick={handleLogout}
            sx={{ ml: 2 }}
          >
            Log Out
          </Button>
        </Box>
      </Paper>
    </Container>
  );
};

export default ProfilePage;
