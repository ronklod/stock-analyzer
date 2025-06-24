import React, { useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { 
  AppBar, 
  Box, 
  Toolbar, 
  Typography, 
  Button, 
  IconButton,
  Menu,
  MenuItem,
  Avatar,
  useTheme as useMuiTheme,
  useMediaQuery,
  Popper,
  Grow,
  Paper,
  ClickAwayListener,
  MenuList
} from '@mui/material';
import LogoComponent from './LogoComponent';
import MenuIcon from '@mui/icons-material/Menu';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import LightModeIcon from '@mui/icons-material/LightMode';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

// No need for logoUrl anymore as we're using LogoComponent

// Add global styles for compact menu items
const compactMenuItemStyle = {
  py: 0.5, // Further reduced vertical padding
  minHeight: '32px', // Explicit minimum height
  px: 1.5 // Add horizontal padding for consistency
};

const Header: React.FC = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const muiTheme = useMuiTheme();
  const isMobile = useMediaQuery(muiTheme.breakpoints.down('md'));
  
  const [mobileMenuAnchor, setMobileMenuAnchor] = useState<null | HTMLElement>(null);
  const [userMenuAnchor, setUserMenuAnchor] = useState<null | HTMLElement>(null);
  const [screenerMenuAnchor, setScreenerMenuAnchor] = useState<null | HTMLElement>(null);
  
  const handleOpenMobileMenu = (event: React.MouseEvent<HTMLElement>) => {
    setMobileMenuAnchor(event.currentTarget);
  };
  
  const handleCloseMobileMenu = () => {
    setMobileMenuAnchor(null);
  };
  
  const handleOpenUserMenu = (event: React.MouseEvent<HTMLElement>) => {
    setUserMenuAnchor(event.currentTarget);
  };
  
  const handleCloseUserMenu = () => {
    setUserMenuAnchor(null);
  };
  
  const handleOpenScreenerMenu = (event: React.MouseEvent<HTMLElement>) => {
    setScreenerMenuAnchor(event.currentTarget);
  };
  
  const handleCloseScreenerMenu = () => {
    setScreenerMenuAnchor(null);
  };
  
  const handleLogout = () => {
    logout();
    handleCloseUserMenu();
  };

  return (
    <AppBar position="static" sx={{ 
      backgroundColor: theme === 'dark' ? '#1a1a2e' : '#2c3e50',
      boxShadow: 3
    }}>
      <Toolbar sx={{ 
        justifyContent: 'space-between',
        flexWrap: 'wrap', // Allow wrapping on very small screens
        padding: isMobile ? '0.5rem' : '0.5rem 1rem' // Reduce padding on mobile
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <LogoComponent variant="white" width={isMobile ? 40 : 50} />
          <Typography 
            variant={isMobile ? "h6" : "h5"} 
            component="div" 
            sx={{ 
              fontWeight: 'bold',
              fontSize: isMobile ? '1.1rem' : '1.5rem'
            }}
          >
            Stock Analyzer
          </Typography>
        </Box>
        
        {/* Mobile menu button */}
        {isMobile && (
          <IconButton
            size="large"
            aria-label="menu"
            aria-controls="menu-appbar"
            aria-haspopup="true"
            onClick={handleOpenMobileMenu}
            color="inherit"
          >
            <MenuIcon />
          </IconButton>
        )}
        
        {/* Desktop navigation */}
        <Box sx={{ flexGrow: 1, display: { xs: 'none', md: 'flex' }, ml: 3 }}>
          <Button 
            component={RouterLink} 
            to="/" 
            sx={{ my: 2, color: 'white', display: 'block' }}
          >
            Analyzer
          </Button>
          <Button 
            onClick={handleOpenScreenerMenu}
            sx={{ my: 2, color: 'white', display: 'flex', alignItems: 'center' }}
            endIcon={<ArrowDropDownIcon />}
          >
            Screener
          </Button>
          <Menu
            id="screener-menu"
            anchorEl={screenerMenuAnchor}
            anchorOrigin={{
              vertical: 'bottom',
              horizontal: 'left',
            }}
            keepMounted
            open={Boolean(screenerMenuAnchor)}
            onClose={handleCloseScreenerMenu}
          >
            <MenuItem 
              onClick={handleCloseScreenerMenu} 
              component={RouterLink} 
              to="/screener/nasdaq100"
            >
              NASDAQ-100 Screener
            </MenuItem>
            <MenuItem 
              onClick={handleCloseScreenerMenu} 
              component={RouterLink} 
              to="/screener/sp500"
            >
              S&P 500 Screener
            </MenuItem>
            <MenuItem 
              onClick={handleCloseScreenerMenu} 
              component={RouterLink} 
              to="/screener/mag7"
            >
              MAG7 Screener
            </MenuItem>
          </Menu>
          <Button 
            component={RouterLink} 
            to="/watchlist" 
            sx={{ my: 2, color: 'white', display: 'block' }}
          >
            Watchlist
          </Button>
        </Box>
        
        {/* User section */}
        <Box sx={{ display: { xs: 'none', md: 'flex' } }}>
          {isAuthenticated ? (
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Typography variant="body1" sx={{ mr: 1 }}>
                {user ? (user.displayName || (user.email ? user.email.split('@')[0] : 'User')) : 'User'}
              </Typography>
              <IconButton 
                onClick={handleOpenUserMenu}
                sx={{ p: 0 }}
              >
                <Avatar sx={{ bgcolor: 'secondary.main' }}>
                  {user && (user.displayName || user.email || '?')[0].toUpperCase()}
                </Avatar>
              </IconButton>
              <Menu
                id="user-menu-appbar"
                anchorEl={userMenuAnchor}
                anchorOrigin={{
                  vertical: 'bottom',
                  horizontal: 'right',
                }}
                keepMounted
                transformOrigin={{
                  vertical: 'top',
                  horizontal: 'right',
                }}
                open={Boolean(userMenuAnchor)}
                onClose={handleCloseUserMenu}
              >
                <MenuItem 
                  onClick={handleCloseUserMenu}
                  component={RouterLink}
                  to="/profile"
                >
                  Profile
                </MenuItem>
                {user?.isAdmin && (
                  <MenuItem
                    onClick={handleCloseUserMenu}
                    component={RouterLink}
                    to="/admin"
                  >
                    Admin Dashboard
                  </MenuItem>
                )}
                <MenuItem onClick={handleLogout}>Logout</MenuItem>
              </Menu>
            </Box>
          ) : (
            <Box>
              <Button 
                color="inherit" 
                component={RouterLink} 
                to="/login"
              >
                Login
              </Button>
              <Button 
                variant="outlined" 
                color="inherit" 
                component={RouterLink} 
                to="/register"
                sx={{ ml: 1 }}
              >
                Sign Up
              </Button>
            </Box>
          )}
        </Box>
        
        {/* Theme toggle button */}
        <IconButton 
          onClick={toggleTheme}
          color="inherit"
          sx={{ display: { xs: 'none', md: 'flex' }, ml: 1 }}
          aria-label="toggle theme"
        >
          {theme === 'dark' ? <LightModeIcon /> : <DarkModeIcon />}
        </IconButton>
        
        {/* Mobile menu with grouped items */}
        <Menu
          id="mobile-menu"
          anchorEl={mobileMenuAnchor}
          anchorOrigin={{
            vertical: 'bottom',
            horizontal: 'left',
          }}
          keepMounted
          open={Boolean(mobileMenuAnchor)}
          onClose={handleCloseMobileMenu}
          PaperProps={{
            style: {
              backgroundColor: theme === 'dark' ? '#1a1a2e' : '#ffffff',
              color: theme === 'dark' ? '#ffffff' : 'inherit',
              padding: '4px 0' // Reduce internal padding
            }
          }}
          sx={{ 
            '& .MuiPaper-root': { 
              width: '100%', 
              maxWidth: '290px',
              mt: 1,
              overflowY: 'auto',
              maxHeight: '75vh',
              borderRadius: '12px',
              bgcolor: theme === 'dark' ? '#1a1a2e' : '#ffffff',
              boxShadow: theme === 'dark' 
                ? '0 8px 16px rgba(0, 0, 0, 0.5)' 
                : '0 8px 16px rgba(0, 0, 0, 0.1)',
              color: theme === 'dark' ? '#ffffff' : 'inherit' // Ensure text is white in dark mode
            },
            '& .MuiMenuItem-root': {
              borderRadius: '8px',
              mx: 1,
              my: 0.25, // Reduced vertical margin
              transition: 'all 0.2s ease',
              color: theme === 'dark' ? '#ffffff' : 'inherit', // Ensure menu item text is white in dark mode
              minHeight: '32px' // Set minimum height for all menu items
            },
            '& .MuiTypography-root': {
              color: theme === 'dark' ? '#ffffff' : 'inherit', // Ensure all Typography is white in dark mode
              lineHeight: 1.2 // Tighten line height for all text
            },
            '& .MuiMenuItem-root:hover': {
              bgcolor: theme === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)'
            } 
          }}
        >
          {/* Group 1: Analysis tools */}
          <Box sx={{ 
            pt: 0.25, 
            pb: 0.25,
            borderBottom: '1px solid',
            borderColor: theme === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
          }}>
            <Typography variant="overline" sx={{ 
              display: 'block',
              color: theme === 'dark' ? 'rgba(255, 255, 255, 0.6)' : 'rgba(0, 0, 0, 0.6)',
              px: 2, 
              fontSize: '0.65rem',
              fontWeight: 'bold',
              mb: 0,
              lineHeight: 1.2
            }}>
              Analysis Tools
            </Typography>
            
            <MenuItem 
              onClick={handleCloseMobileMenu} 
              component={RouterLink} 
              to="/"
              sx={compactMenuItemStyle}
            >
              <Box sx={{ 
                display: 'flex', 
                alignItems: 'center',
                color: theme === 'dark' ? '#ffffff' : 'inherit' 
              }}>
                <LogoComponent variant="white" width={20} marginRight="12px" />
                Analyzer
              </Box>
            </MenuItem>
            <MenuItem 
              onClick={handleCloseMobileMenu} 
              component={RouterLink} 
              to="/screener/nasdaq100"
              sx={compactMenuItemStyle}
            >
              <Box sx={{ 
                display: 'flex', 
                alignItems: 'center',
                color: theme === 'dark' ? '#ffffff' : 'inherit' 
              }}>
                <span role="img" aria-label="nasdaq" style={{ marginRight: '12px' }}>📊</span>
                NASDAQ-100 Screener
              </Box>
            </MenuItem>
            <MenuItem 
              onClick={handleCloseMobileMenu} 
              component={RouterLink} 
              to="/screener/sp500"
              sx={compactMenuItemStyle}
            >
              <Box sx={{ 
                display: 'flex', 
                alignItems: 'center',
                color: theme === 'dark' ? '#ffffff' : 'inherit' 
              }}>
                <span role="img" aria-label="sp500" style={{ marginRight: '12px' }}>📈</span>
                S&P 500 Screener
              </Box>
            </MenuItem>
            <MenuItem 
              onClick={handleCloseMobileMenu} 
              component={RouterLink} 
              to="/screener/mag7"
              sx={compactMenuItemStyle}
            >
              <Box sx={{ 
                display: 'flex', 
                alignItems: 'center',
                color: theme === 'dark' ? '#ffffff' : 'inherit' 
              }}>
                <span role="img" aria-label="mag7" style={{ marginRight: '12px' }}>🔍</span>
                MAG7 Screener
              </Box>
            </MenuItem>
            <MenuItem 
              onClick={handleCloseMobileMenu} 
              component={RouterLink} 
              to="/watchlist"
              sx={compactMenuItemStyle}
            >
              <Box sx={{ 
                display: 'flex', 
                alignItems: 'center',
                color: theme === 'dark' ? '#ffffff' : 'inherit' 
              }}>
                <span role="img" aria-label="watchlist" style={{ marginRight: '12px' }}>⭐</span>
                Watchlist
              </Box>
            </MenuItem>
          </Box>
          
          {/* Group 2: User account (when authenticated) */}
          {isAuthenticated && (
            <Box sx={{ 
              pt: 0.25, 
              pb: 0.25,
              borderBottom: '1px solid',
              borderColor: theme === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
            }}>
              {/* User info box */}
              <Box sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                px: 2,
                py: 0.5,
                mb: 0.5 
              }}>
                <Avatar sx={{ 
                  bgcolor: 'secondary.main',
                  width: 32,
                  height: 32
                }}>
                  {user && (user.displayName || user.email || '?')[0].toUpperCase()}
                </Avatar>
                <Box sx={{ ml: 1.5 }}>
                  <Typography variant="body2" sx={{ 
                    fontWeight: 'bold',
                    color: theme === 'dark' ? '#ffffff' : 'inherit',
                    lineHeight: 1.2
                  }}>
                    {user ? (user.displayName || (user.email ? user.email.split('@')[0] : 'User')) : 'User'}
                  </Typography>
                  <Typography variant="caption" sx={{
                    color: theme === 'dark' ? 'rgba(255, 255, 255, 0.7)' : 'text.secondary',
                    fontSize: '0.7rem',
                    lineHeight: 1.1
                  }}>
                    {user?.email}
                  </Typography>
                </Box>
              </Box>
            
              <Typography variant="overline" sx={{ 
                display: 'block',
                color: theme === 'dark' ? 'rgba(255, 255, 255, 0.6)' : 'rgba(0, 0, 0, 0.6)',
                px: 2, 
                fontSize: '0.65rem',
                fontWeight: 'bold',
                mb: 0,
                lineHeight: 1.2
              }}>
                Account
              </Typography>
              
              <MenuItem 
                onClick={handleCloseMobileMenu}
                component={RouterLink}
                to="/profile"
                sx={compactMenuItemStyle}
              >
                <Box sx={{ 
                  display: 'flex', 
                  alignItems: 'center',
                  color: theme === 'dark' ? '#ffffff' : 'inherit' 
                }}>
                  <AccountCircleIcon fontSize="small" sx={{ mr: 1.5 }} />
                  Profile
                </Box>
              </MenuItem>
              
              {user?.isAdmin && (
                <MenuItem 
                  onClick={handleCloseMobileMenu}
                  component={RouterLink}
                  to="/admin"
                  sx={compactMenuItemStyle}
                >
                  <Box sx={{ 
                    display: 'flex', 
                    alignItems: 'center',
                    color: theme === 'dark' ? '#ffb74d' : '#f57c00' // Orange color for admin items
                  }}>
                    <span role="img" aria-label="admin" style={{ marginRight: '12px' }}>⚙️</span>
                    Admin Dashboard
                  </Box>
                </MenuItem>
              )}
            </Box>
          )}
          
          {/* Group 3: Bottom actions */}
          <Box sx={{ 
            pt: 0.5, 
            mt: 'auto',
            display: 'flex',
            flexDirection: 'column'
          }}>
            {/* Bottom action area with theme toggle and logout/auth buttons */}
            <Box sx={{ 
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              borderTop: '1px solid',
              borderColor: theme === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
              mt: 0.5,
              pt: 0.5,
              px: 1.5
            }}>
              {/* Theme Toggle */}
              <Box
                onClick={() => {
                  toggleTheme();
                  handleCloseMobileMenu();
                }}
                sx={{ 
                  display: 'flex', 
                  alignItems: 'center',
                  py: 0.75,
                  cursor: 'pointer',
                  borderRadius: 1,
                  px: 1,
                  '&:hover': {
                    bgcolor: theme === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)'
                  }
                }}
              >
                {theme === 'dark' ? 
                  <Box sx={{ display: 'flex', alignItems: 'center', color: '#ffffff' }}>
                    <LightModeIcon sx={{ mr: 0.5, fontSize: '1rem' }} />
                    <Typography variant="caption" sx={{ color: '#ffffff' }}>Light</Typography>
                  </Box> : 
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <DarkModeIcon sx={{ mr: 0.5, fontSize: '1rem' }} />
                    <Typography variant="caption">Dark</Typography>
                  </Box>
                }
              </Box>
              
              {/* Auth buttons */}
              {isAuthenticated ? (
                <Box
                  onClick={() => {
                    handleCloseMobileMenu();
                    logout();
                  }}
                  sx={{ 
                    display: 'flex',
                    alignItems: 'center',
                    py: 0.75,
                    px: 1.5,
                    bgcolor: theme === 'dark' ? '#f44336' : '#d32f2f',
                    color: '#ffffff',
                    borderRadius: 1,
                    cursor: 'pointer',
                    '&:hover': {
                      bgcolor: theme === 'dark' ? '#d32f2f' : '#c62828',
                    }
                  }}
                >
                  <Typography variant="caption" sx={{ fontWeight: 'medium' }}>
                    Logout
                  </Typography>
                </Box>
              ) : (
                <Box sx={{ 
                  display: 'flex', 
                  gap: 1
                }}>
                  <Box 
                    component={RouterLink} 
                    to="/login"
                    onClick={handleCloseMobileMenu}
                    sx={{ 
                      textDecoration: 'none',
                      color: 'inherit',
                      py: 0.75,
                      px: 1.5,
                      borderRadius: 1,
                      '&:hover': {
                        bgcolor: theme === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)'
                      }
                    }}
                  >
                    <Typography variant="caption">Login</Typography>
                  </Box>
                  <Box 
                    component={RouterLink} 
                    to="/register"
                    onClick={handleCloseMobileMenu}
                    sx={{ 
                      textDecoration: 'none',
                      py: 0.75,
                      px: 1.5,
                      bgcolor: theme === 'dark' ? '#1976d2' : '#2196f3',
                      color: '#ffffff',
                      borderRadius: 1,
                      '&:hover': {
                        bgcolor: theme === 'dark' ? '#1565c0' : '#1976d2',
                      }
                    }}
                  >
                    <Typography variant="caption" sx={{ fontWeight: 'medium' }}>
                      Sign Up
                    </Typography>
                  </Box>
                </Box>
              )}
            </Box>
          </Box>
        </Menu>
      </Toolbar>
    </AppBar>
  );
};

export default Header;
