import React from 'react';
import { InputAdornment, TextField } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import { useTranslation } from '../../i18n/I18nContext.jsx';

export default function SearchBar({ value, onChange, placeholder }) {
  const { t } = useTranslation();
  return (
    <TextField
      size="small"
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder || t('common.search')}
      InputProps={{
        startAdornment: (
          <InputAdornment position="start">
            <SearchIcon fontSize="small" />
          </InputAdornment>
        ),
      }}
      sx={{ minWidth: 240 }}
    />
  );
}
