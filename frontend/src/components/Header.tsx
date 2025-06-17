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
  useTheme,
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
import { useAuth } from '../context/AuthContext';

const Header: React.FC = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
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
    <AppBar position="static" color="primary" elevation={3}>
      <Toolbar>
        <TrendingUpIcon sx={{ display: { xs: 'none', md: 'flex' }, mr: 1 }} />
        <Typography
          variant="h6"
          noWrap
          component={RouterLink}
          to="/"
          sx={{
            mr: 2,
            display: 'flex',
            fontWeight: 700,
            color: 'inherit',
            textDecoration: 'none',
            flexGrow: { xs: 1, md: 0 }
          }}
        >
          Stock Analyzer
        </Typography>
        
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
        
        {/* Mobile Menu */}
        <Menu
          id="menu-appbar"
          anchorEl={mobileMenuAnchor}
          anchorOrigin={{
            vertical: 'bottom',
            horizontal: 'right',
          }}
          keepMounted
          transformOrigin={{
            vertical: 'top',
            horizontal: 'right',
          }}
          open={Boolean(mobileMenuAnchor)}
          onClose={handleCloseMobileMenu}
        >
          <MenuItem 
            onClick={handleCloseMobileMenu}
            component={RouterLink}
            to="/"
          >
            Analyzer
          </MenuItem>
          <MenuItem 
            onClick={handleCloseMobileMenu}
            component={RouterLink}
            to="/screener/nasdaq100"
          >
            NASDAQ-100 Screener
          </MenuItem>
          <MenuItem 
            onClick={handleCloseMobileMenu}
            component={RouterLink}
            to="/screener/sp500"
          >
            S&P 500 Screener
          </MenuItem>
          <MenuItem 
            onClick={handleCloseMobileMenu}
            component={RouterLink}
            to="/screener/mag7"
          >
            MAG7 Screener
          </MenuItem>
          <MenuItem 
            onClick={handleCloseMobileMenu}
            component={RouterLink}
            to="/watchlist"
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
              >
                Profile
              </MenuItem>,
              <MenuItem 
                key="logout" 
                onClick={() => {
                  handleCloseMobileMenu();
                  logout();
                }}
              >
                Logout
              </MenuItem>
            ]
          ) : (
            [
              <MenuItem 
                key="login"
                onClick={handleCloseMobileMenu}
                component={RouterLink}
                to="/login"
              >
                Login
              </MenuItem>,
              <MenuItem 
                key="register"
                onClick={handleCloseMobileMenu}
                component={RouterLink}
                to="/register"
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
