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
import MenuIcon from '@mui/icons-material/Menu';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import LightModeIcon from '@mui/icons-material/LightMode';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

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
          <TrendingUpIcon sx={{ fontSize: isMobile ? 28 : 32, mr: 1 }} />
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
        <Box sx={{ flexGrow: 1, display: { xs: 'none', md: 'flex' } }}>
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
        
        {/* Mobile menu */}
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
          sx={{ 
            '& .MuiPaper-root': { 
              width: '100%', 
              maxWidth: '300px',
              mt: 1.5 
            } 
          }}
        >
          <MenuItem 
            onClick={handleCloseMobileMenu} 
            component={RouterLink} 
            to="/"
            sx={{ py: 1.5 }} // Larger touch target area
          >
            Analyzer
          </MenuItem>
          <MenuItem 
            onClick={handleCloseMobileMenu} 
            component={RouterLink} 
            to="/screener/nasdaq100"
            sx={{ py: 1.5 }}
          >
            NASDAQ-100 Screener
          </MenuItem>
          <MenuItem 
            onClick={handleCloseMobileMenu} 
            component={RouterLink} 
            to="/screener/sp500"
            sx={{ py: 1.5 }}
          >
            S&P 500 Screener
          </MenuItem>
          <MenuItem 
            onClick={handleCloseMobileMenu} 
            component={RouterLink} 
            to="/screener/mag7"
            sx={{ py: 1.5 }}
          >
            MAG7 Screener
          </MenuItem>
          <MenuItem 
            onClick={handleCloseMobileMenu} 
            component={RouterLink} 
            to="/watchlist"
            sx={{ py: 1.5 }}
          >
            Watchlist
          </MenuItem>
          
          {isAuthenticated ? (
            [
              <MenuItem 
                key="profile" 
                onClick={handleCloseMobileMenu}
                component={RouterLink}
                to="/profile"
                sx={{ py: 1.5 }}
              >
                Profile
              </MenuItem>,
              <MenuItem 
                key="logout" 
                onClick={() => {
                  handleCloseMobileMenu();
                  logout();
                }}
                sx={{ py: 1.5 }}
              >
                Logout
              </MenuItem>,
              <MenuItem 
                key="theme" 
                onClick={() => {
                  toggleTheme();
                  handleCloseMobileMenu();
                }}
                sx={{ py: 1.5 }}
              >
                {theme === 'dark' ? 
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <LightModeIcon fontSize="small" sx={{ mr: 1 }} />
                    Light Mode
                  </Box> : 
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <DarkModeIcon fontSize="small" sx={{ mr: 1 }} />
                    Dark Mode
                  </Box>
                }
              </MenuItem>
            ]
          ) : (
            [
              <MenuItem 
                key="login"
                onClick={handleCloseMobileMenu}
                component={RouterLink}
                to="/login"
                sx={{ py: 1.5 }}
              >
                Login
              </MenuItem>,
              <MenuItem 
                key="register"
                onClick={handleCloseMobileMenu}
                component={RouterLink}
                to="/register"
                sx={{ py: 1.5 }}
              >
                Sign Up
              </MenuItem>
            ]
          )}
        </Menu>
      </Toolbar>
    </AppBar>
  );
};

export default Header;
