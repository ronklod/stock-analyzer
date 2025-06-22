import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { CircularProgress, Box } from '@mui/material';

interface AdminRouteProps {
  redirectTo?: string;
}

const AdminRoute: React.FC<AdminRouteProps> = ({ redirectTo = '/profile' }) => {
  const { isAuthenticated, user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <Box 
        display="flex" 
        justifyContent="center" 
        alignItems="center" 
        minHeight="100vh"
      >
        <CircularProgress />
      </Box>
    );
  }

  // Check if user is authenticated and is an admin
  if (isAuthenticated && user && user.isAdmin) {
    return <Outlet />;
  }
  
  // Redirect to the specified path if not admin
  return <Navigate to={redirectTo} />;
};

export default AdminRoute;
