import React, { useContext } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { AppBar, Toolbar, Typography, InputBase, IconButton, Box, useTheme } from '@mui/material';
import { styled, alpha } from '@mui/material/styles';
import SearchIcon from '@mui/icons-material/Search';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import Brightness4Icon from '@mui/icons-material/Brightness4';
import Brightness7Icon from '@mui/icons-material/Brightness7';
import { ColorModeContext } from '../../contexts/themeProvider';

const Search = styled('div')(({ theme }) => ({
  position: 'relative',
  borderRadius: '20px',
  backgroundColor: theme.palette.primary.search,
  '&:hover': {
    backgroundColor: alpha(theme.palette.primary.search, 0.85),
  },
  marginRight: theme.spacing(2),
  marginLeft: 0,
  width: '100%',
  [theme.breakpoints.up('sm')]: {
    marginLeft: theme.spacing(3),
    width: '30%',
  },
}));

const SearchIconWrapper = styled('div')(({ theme }) => ({
  padding: theme.spacing(0, 2),
  height: '100%',
  position: 'absolute',
  pointerEvents: 'none',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  color: theme.palette.getContrastText(theme.palette.primary.search),
}));

const StyledInputBase = styled(InputBase)(({ theme }) => ({
  color: theme.palette.getContrastText(theme.palette.primary.search),
  width: '100%',
  '& .MuiInputBase-input': {
    padding: theme.spacing(1, 1, 1, 0),
    paddingLeft: `calc(1em + ${theme.spacing(4)})`,
    transition: theme.transitions.create('width'),
    width: '100%',
    [theme.breakpoints.up('md')]: {
      width: '20ch',
    },
  },
  '&::placeholder': {
    color: alpha(theme.palette.getContrastText(theme.palette.primary.search), 0.7),
  },
}));

const Header = () => {
  const theme = useTheme();
  const colorMode = useContext(ColorModeContext);

  return (
    <AppBar
      position="static"
      sx={{
        backgroundColor: 'primary.header',
        color: theme.palette.getContrastText(theme.palette.primary.header)
      }}
    >
      <Toolbar>
        <Typography
          variant="h6"
          noWrap
          component={RouterLink}
          to="/"
          sx={{ flexGrow: 1, display: { xs: 'none', sm: 'block' }, textDecoration: 'none', color: 'inherit' }}
        >
          LocXoc
        </Typography>
        <Search>
          <SearchIconWrapper>
            <SearchIcon />
          </SearchIconWrapper>
          <StyledInputBase
            placeholder="Search videos…"
            inputProps={{ 'aria-label': 'search' }}
          />
        </Search>
        <Box sx={{ flexGrow: 1 }} />
        <IconButton
          sx={{
            ml: 1,
            color: theme.palette.getContrastText(theme.palette.primary.header)
          }}
          onClick={colorMode.toggleColorMode}
        >
          {theme.palette.mode === 'dark' ? <Brightness7Icon /> : <Brightness4Icon />}
        </IconButton>
        <IconButton
          size="large"
          edge="end"
          aria-label="account of current user"
          aria-controls="primary-search-account-menu"
          aria-haspopup="true"
          component={RouterLink}
          to="/login"
          sx={{
            color: theme.palette.getContrastText(theme.palette.primary.header)
          }}
        >
          <AccountCircleIcon />
        </IconButton>
      </Toolbar>
    </AppBar>
  );
};

export default Header;
