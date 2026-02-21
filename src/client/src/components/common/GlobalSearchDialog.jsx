import React, { useState, useCallback, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Dialog, DialogTitle, DialogContent, InputAdornment, TextField,
  List, ListItemButton, ListItemText, ListSubheader, Typography,
  Box, CircularProgress, Divider, IconButton, Chip,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import CloseIcon from '@mui/icons-material/Close';
import FolderIcon from '@mui/icons-material/Folder';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import PeopleIcon from '@mui/icons-material/People';
import BusinessIcon from '@mui/icons-material/Business';
import api from '../../services/api.js';
import { useTranslation } from '../../i18n/I18nContext.jsx';

const SECTION_ICONS = {
  projects: <FolderIcon fontSize="small" sx={{ mr: 1, color: 'primary.main' }} />,
  leads: <TrendingUpIcon fontSize="small" sx={{ mr: 1, color: 'success.main' }} />,
  contacts: <PeopleIcon fontSize="small" sx={{ mr: 1, color: 'info.main' }} />,
  companies: <BusinessIcon fontSize="small" sx={{ mr: 1, color: 'warning.main' }} />,
};

const SECTION_PATHS = {
  projects: (id) => `/projects/${id}`,
  leads: (id) => `/leads/${id}`,
  contacts: (id) => `/contacts/${id}`,
  companies: (id) => `/companies/${id}`,
};

function getLabel(type, item) {
  if (type === 'contacts') return `${item.first_name} ${item.last_name}`;
  if (type === 'leads') return item.title;
  return item.name;
}

function getSubLabel(type, item) {
  if (type === 'contacts') return item.email;
  if (type === 'companies') return item.industry;
  return null;
}

export default function GlobalSearchDialog({ open, onClose }) {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const debounceTimer = useRef(null);
  const inputRef = useRef(null);

  // Reset state when dialog opens
  useEffect(() => {
    if (open) {
      setQuery('');
      setResults(null);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [open]);

  const doSearch = useCallback(async (q) => {
    if (!q || q.trim().length < 2) {
      setResults(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const res = await api.get('/search', { params: { q: q.trim() } });
      setResults(res.data.data || res.data);
    } catch {
      setResults(null);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleChange = (e) => {
    const val = e.target.value;
    setQuery(val);
    clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => doSearch(val), 350);
  };

  const handleSelect = (type, item) => {
    onClose();
    navigate(SECTION_PATHS[type](item.id));
  };

  const hasResults = results && (
    results.projects?.length || results.leads?.length ||
    results.contacts?.length || results.companies?.length
  );

  const SECTIONS = [
    { key: 'projects', label: t('nav.projects') },
    { key: 'leads', label: t('nav.leads') },
    { key: 'contacts', label: t('nav.contacts') },
    { key: 'companies', label: t('nav.companies') },
  ];

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="sm"
      PaperProps={{ sx: { mt: '10vh', verticalAlign: 'top' } }}
      aria-label={t('search.globalSearch', 'Global Search')}
    >
      <DialogTitle sx={{ pb: 0 }}>
        <TextField
          inputRef={inputRef}
          fullWidth
          autoComplete="off"
          placeholder={t('search.placeholder', 'Search projects, leads, contacts, companies…')}
          value={query}
          onChange={handleChange}
          variant="standard"
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                {loading ? <CircularProgress size={18} /> : <SearchIcon />}
              </InputAdornment>
            ),
            endAdornment: query ? (
              <InputAdornment position="end">
                <IconButton size="small" onClick={() => { setQuery(''); setResults(null); }}>
                  <CloseIcon fontSize="small" />
                </IconButton>
              </InputAdornment>
            ) : null,
            disableUnderline: false,
          }}
        />
      </DialogTitle>

      <DialogContent sx={{ px: 0, pt: 1 }}>
        {!query && (
          <Box px={3} py={2}>
            <Typography variant="body2" color="text.secondary">
              {t('search.hint', 'Type at least 2 characters to search across the CRM.')}
            </Typography>
          </Box>
        )}

        {query && query.trim().length < 2 && (
          <Box px={3} py={2}>
            <Typography variant="body2" color="text.secondary">
              {t('search.minChars', 'Please enter at least 2 characters.')}
            </Typography>
          </Box>
        )}

        {!loading && results && !hasResults && query.trim().length >= 2 && (
          <Box px={3} py={2}>
            <Typography variant="body2" color="text.secondary">
              {t('search.noResults', 'No results found for')} &ldquo;{query}&rdquo;.
            </Typography>
          </Box>
        )}

        {!loading && hasResults && SECTIONS.map((section, si) => {
          const items = results[section.key] || [];
          if (!items.length) return null;
          return (
            <React.Fragment key={section.key}>
              {si > 0 && <Divider />}
              <List
                dense
                subheader={
                  <ListSubheader disableSticky sx={{ bgcolor: 'background.paper', lineHeight: '32px' }}>
                    <Box display="flex" alignItems="center">
                      {SECTION_ICONS[section.key]}
                      <Typography variant="overline">{section.label}</Typography>
                    </Box>
                  </ListSubheader>
                }
              >
                {items.map(item => (
                  <ListItemButton key={item.id} onClick={() => handleSelect(section.key, item)}>
                    <ListItemText
                      primary={getLabel(section.key, item)}
                      secondary={getSubLabel(section.key, item)}
                      primaryTypographyProps={{ variant: 'body2', fontWeight: 500 }}
                      secondaryTypographyProps={{ variant: 'caption' }}
                    />
                    {(section.key === 'projects' && item.status) && (
                      <Chip label={item.status} size="small" sx={{ ml: 1 }} />
                    )}
                    {(section.key === 'leads' && item.stage) && (
                      <Chip label={item.stage} size="small" sx={{ ml: 1 }} />
                    )}
                  </ListItemButton>
                ))}
              </List>
            </React.Fragment>
          );
        })}
      </DialogContent>
    </Dialog>
  );
}
