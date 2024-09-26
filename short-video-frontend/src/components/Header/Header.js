import React, { useContext, useState } from 'react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { AppBar, Toolbar, Typography, InputBase, IconButton, Box, useTheme, Avatar, Button, Menu, MenuItem } from '@mui/material';
import { styled, alpha } from '@mui/material/styles';
import SearchIcon from '@mui/icons-material/Search';
import Brightness4Icon from '@mui/icons-material/Brightness4';
import Brightness7Icon from '@mui/icons-material/Brightness7';
import { ColorModeContext } from '../../contexts/themeProvider';
import UserContext from '../../contexts/userContext';
import { Settings, User, VideoIcon, LogOut } from 'lucide-react';

const Search = styled('div')(({ theme }) => ({
  position: 'relative',
  borderRadius: theme.shape.borderRadius,
  backgroundColor: theme.palette.custom.search,
  '&:hover': {
    backgroundColor: alpha(theme.palette.custom.search, 0.85),
  },
  marginRight: theme.spacing(2),
  marginLeft: 0,
  width: '100%',
  [theme.breakpoints.up('sm')]: {
    marginLeft: theme.spacing(3),
    width: '30%',
  },
  borderRadius: '30px'
}));

const SearchIconWrapper = styled('div')(({ theme }) => ({
  padding: theme.spacing(0, 2),
  height: '100%',
  position: 'absolute',
  pointerEvents: 'none',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  color: theme.palette.custom.icon,
}));

const StyledInputBase = styled(InputBase)(({ theme }) => ({
  color: theme.palette.text.primary,
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
    color: theme.palette.text.secondary,
    opacity: 0.7,
  }
}));

const Header = () => {
  const theme = useTheme();
  const colorMode = useContext(ColorModeContext);
  const { user, logout } = useContext(UserContext);
  const navigate = useNavigate();
  const [anchorEl, setAnchorEl] = useState(null);

  const handleMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    logout();
    handleMenuClose();
    navigate('/');
  };

  return (
    <AppBar
      position="static"
      sx={{
        backgroundColor: theme.palette.custom.header,
        color: theme.palette.text.primary,
      }}
    >
      <Toolbar>
        <Typography
          variant="h6"
          noWrap
          component={RouterLink}
          to="/"
          sx={{
            flexGrow: 1,
            display: { xs: 'none', sm: 'block' },
            textDecoration: 'none',
            color: 'inherit',
            fontWeight: 'bold',
          }}
        >
          LocXoc
        </Typography>
        <Search>
          <SearchIconWrapper>
            <SearchIcon />
          </SearchIconWrapper>
          <StyledInputBase
            placeholder="Tìm kiếm…"
            inputProps={{ 'aria-label': 'search' }}
          />
        </Search>
        <Box sx={{ flexGrow: 1 }} />
        <IconButton
          sx={{
            ml: 1,
            color: theme.palette.custom.icon,
            '&:hover': {
              backgroundColor: theme.palette.custom.hover,
            },
          }}
          onClick={colorMode.toggleColorMode}
        >
          {theme.palette.mode === 'dark' ? <Brightness7Icon /> : <Brightness4Icon />}
        </IconButton>
        {user ? (
          <>
            <IconButton
              onClick={handleMenuOpen}
              size="small"
              sx={{ ml: 2 }}
              aria-controls={Boolean(anchorEl) ? 'account-menu' : undefined}
              aria-haspopup="true"
              aria-expanded={Boolean(anchorEl) ? 'true' : undefined}
            >
              <Avatar src={user.profilePicture} sx={{ width: 32, height: 32 }} />
            </IconButton>
            <Menu
              anchorEl={anchorEl}
              id="account-menu"
              open={Boolean(anchorEl)}
              onClose={handleMenuClose}
              onClick={handleMenuClose}
              PaperProps={{
                elevation: 0,
                sx: {
                  overflow: 'visible',
                  filter: 'drop-shadow(0px 2px 8px rgba(0,0,0,0.32))',
                  mt: 1.5,
                  '& .MuiAvatar-root': {
                    width: 32,
                    height: 32,
                    ml: -0.5,
                    mr: 1,
                  },
                },
              }}
              transformOrigin={{ horizontal: 'right', vertical: 'top' }}
              anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
            >
              <MenuItem onClick={() => navigate('/profile')}>
                <User size={16} />
                <Box sx={{ marginLeft: 1 }}>Trang cá nhân</Box>
              </MenuItem>
              <MenuItem onClick={() => navigate('/settings')}>
                <Settings size={16} />
                <Box sx={{ marginLeft: 1 }}>Cài đặt</Box>
              </MenuItem>
              <MenuItem onClick={() => navigate('/creator-tools')}>
                <VideoIcon size={16} />
                <Box sx={{ marginLeft: 1 }}>Công cụ nhà sáng tạo</Box>
              </MenuItem>
              <MenuItem onClick={handleLogout}>
                <LogOut size={16} />
                <Box sx={{ marginLeft: 1 }}>Đăng xuất</Box>
              </MenuItem>
            </Menu>
          </>
        ) : (
          <Button
            sx={{
              backgroundColor: theme.palette.primary.main,
              color: theme.palette.primary.contrastText,
              '&:hover': {
                backgroundColor: theme.palette.primary.dark,
              },
              marginLeft: 1
            }}
            onClick={() => navigate('/login')}
          >
            Đăng nhập
          </Button>
        )}
      </Toolbar>
    </AppBar>
  );
};

export default Header;
