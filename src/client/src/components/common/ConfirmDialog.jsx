import React from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, Typography,
} from '@mui/material';
import { useTranslation } from '../../i18n/I18nContext.jsx';

export default function ConfirmDialog({ open, title, message, onConfirm, onCancel, confirmColor = 'error' }) {
  const { t } = useTranslation();
  return (
    <Dialog open={open} onClose={onCancel} maxWidth="xs" fullWidth>
      <DialogTitle>{title || t('common.confirm')}</DialogTitle>
      <DialogContent>
        <Typography>{message || t('common.confirmMessage')}</Typography>
      </DialogContent>
      <DialogActions>
        <Button onClick={onCancel}>{t('common.cancel')}</Button>
        <Button onClick={onConfirm} color={confirmColor} variant="contained">
          {t('common.confirm')}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
