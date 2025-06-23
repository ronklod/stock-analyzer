import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
  useTheme
} from '@mui/material';

interface MobileNoteDialogProps {
  open: boolean;
  onClose: () => void;
  symbol: string;
  note: string | null;
}

/**
 * Mobile-friendly dialog to display notes on mobile devices
 * Used as a replacement for tooltips which don't work well on touch devices
 */
const MobileNoteDialog: React.FC<MobileNoteDialogProps> = ({ 
  open, 
  onClose, 
  symbol, 
  note 
}) => {
  const theme = useTheme();

  return (
    <Dialog
      open={open}
      onClose={onClose}
      aria-labelledby="note-dialog-title"
      fullWidth
      maxWidth="xs"
      PaperProps={{
        sx: {
          bgcolor: theme.palette.mode === 'dark' ? '#1a1a2e' : '#ffffff',
          color: '#666',
          borderRadius: '12px',
          boxShadow: theme.palette.mode === 'dark' 
            ? '0 8px 16px rgba(0, 0, 0, 0.5)' 
            : '0 8px 16px rgba(0, 0, 0, 0.1)',
        }
      }}
    >
      <DialogTitle id="note-dialog-title">Note for {symbol}</DialogTitle>
      <DialogContent>
        <DialogContentText sx={{ 
          color: '#666',
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-word'
        }}>
          {note || ''}
        </DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button 
          onClick={onClose} 
          color="primary" 
          variant="contained" 
          size="small"
        >
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default MobileNoteDialog;
