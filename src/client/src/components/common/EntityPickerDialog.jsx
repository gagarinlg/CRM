import React, { useState, useEffect } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, TextField, List, ListItem, ListItemButton,
  ListItemText, ListItemAvatar, Avatar, Typography, CircularProgress,
} from '@mui/material';

export default function EntityPickerDialog({ open, onClose, onSelect, title, fetchItems, getLabel, getSubLabel, getInitials }) {
  const [search, setSearch] = useState('');
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    fetchItems(search)
      .then(data => setItems(Array.isArray(data) ? data : (data.data || [])))
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, [open, search]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleClose = () => { setSearch(''); onClose(); };
  const handleSelect = (item) => { setSearch(''); onSelect(item); };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>{title}</DialogTitle>
      <DialogContent>
        <TextField
          autoFocus
          fullWidth
          size="small"
          placeholder="Search..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          sx={{ mb: 1 }}
        />
        {loading ? (
          <CircularProgress size={24} sx={{ display: 'block', mx: 'auto', my: 2 }} />
        ) : items.length === 0 ? (
          <Typography color="text.secondary" textAlign="center" py={2}>No results</Typography>
        ) : (
          <List dense sx={{ maxHeight: 360, overflow: 'auto' }}>
            {items.map(item => (
              <ListItem key={item.id} disablePadding>
                <ListItemButton onClick={() => handleSelect(item)}>
                  {getInitials && (
                    <ListItemAvatar>
                      <Avatar sx={{ width: 32, height: 32, fontSize: 12 }}>
                        {getInitials(item)}
                      </Avatar>
                    </ListItemAvatar>
                  )}
                  <ListItemText
                    primary={getLabel(item)}
                    secondary={getSubLabel ? getSubLabel(item) : undefined}
                  />
                </ListItemButton>
              </ListItem>
            ))}
          </List>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose}>Cancel</Button>
      </DialogActions>
    </Dialog>
  );
}
