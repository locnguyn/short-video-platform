import React, { useContext, useEffect, useState } from 'react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { AppBar, Toolbar, Typography, InputBase, IconButton, Box, useTheme, Avatar, Button, Menu, MenuItem, Badge, ListItemIcon, ListItemText, ListItemSecondaryAction } from '@mui/material';
import { styled, alpha } from '@mui/material/styles';
import SearchIcon from '@mui/icons-material/Search';
import Brightness4Icon from '@mui/icons-material/Brightness4';
import Brightness7Icon from '@mui/icons-material/Brightness7';
import { ColorModeContext } from '../../contexts/themeProvider';
import UserContext from '../../contexts/userContext';
import { Settings, User, VideoIcon, LogOut, Heart, MessageSquareMore, Video, Dot } from 'lucide-react';
import { GET_NOTIFICATIONS, MARK_NOTIFICATION_AS_READ, NEW_NOTIFICATION_SUBSCRIPTION } from '../../GraphQLQueries/notificationQueries';
import { useMutation, useQuery, useSubscription } from '@apollo/client';
import { Notifications, PersonAdd } from '@mui/icons-material';

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

const NotificationMenuItem = styled(MenuItem)(({ theme }) => ({
  display: 'flex',
  alignItems: 'flex-start',
  padding: theme.spacing(1, 2),
  '&:hover': {
    backgroundColor: alpha(theme.palette.primary.main, 0.1),
  },
}));

const getNotificationIcon = (type) => {
  switch (type) {
    case 'NEW_FOLLOWER':
      return <PersonAdd />;
    case 'VIDEO_LIKE':
    case 'COMMENT_LIKE':
      return <Heart fill='red' color='red' />;
    case 'VIDEO_COMMENT':
      return <MessageSquareMore />;
    case 'FOLLOWED_USER_UPLOAD':
      return <Video />;
    default:
      return <Notifications />;
  }
};

const getNotificationLink = (notification) => {
  const { type, actor, video, comment } = notification;
  switch (type) {
    case 'NEW_FOLLOWER':
      return `/${actor.username}`;
    case 'VIDEO_LIKE':
    case 'VIDEO_COMMENT':
    case 'COMMENT_REPLY':
    case 'FOLLOWED_USER_UPLOAD':
    case 'COMMENT_LIKE':
      return `/${video.user.username}/video/${video.id}`;
    default:
      return '/';
  }
};

const Header = () => {
  const theme = useTheme();
  const colorMode = useContext(ColorModeContext);
  const { user, logout } = useContext(UserContext);
  const navigate = useNavigate();
  const [anchorEl, setAnchorEl] = useState(null);
  const [notificationAnchorEl, setNotificationAnchorEl] = useState(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState([]);

  const { data: notificationData, loading: notificationLoading } = useQuery(GET_NOTIFICATIONS, {
    fetchPolicy: 'network-only',
    skip: !user
  });
  const [markAsRead] = useMutation(MARK_NOTIFICATION_AS_READ);
  const { data: newNotificationData } = useSubscription(NEW_NOTIFICATION_SUBSCRIPTION);

  useEffect(() => {
    if (notificationData) {
      setNotifications(notificationData.notifications);
      const unreadNotifications = notificationData.notifications.filter(n => !n.read);
      setUnreadCount(unreadNotifications.length);
    }
  }, [notificationData, user]);

  useEffect(() => {
    if (newNotificationData && newNotificationData.newNotification) {
      console.log(newNotificationData.newNotification)
      setNotifications(prevNotifications => [newNotificationData.newNotification, ...prevNotifications]);
      setUnreadCount(prevCount => prevCount + 1);
    }
  }, [newNotificationData]);

  useEffect(() => {
    if (notificationData) {
      const unreadNotifications = notificationData.notifications.filter(n => !n.read);
      setUnreadCount(unreadNotifications.length);
    }
  }, [notificationData]);

  const handleMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleNotificationOpen = (event) => {
    setNotificationAnchorEl(event.currentTarget);
  };

  const handleNotificationClose = () => {
    setNotificationAnchorEl(null);
  };

  const handleNotificationClick = async (notification) => {
    await markAsRead({ variables: { notificationId: notification.id } });
    setUnreadCount(prevCount => Math.max(0, prevCount - 1));
    setNotifications(prevNotifications =>
      prevNotifications.map(n =>
        n.id === notification.id ? { ...n, read: true } : n
      )
    );
    handleNotificationClose();
    navigate(getNotificationLink(notification));
  };

  const handleLogout = () => {
    setNotifications([]);
    setUnreadCount(0);
    logout();
    handleMenuClose();
    navigate('/');
  };

  return (
    <AppBar
      sx={{
        backgroundColor: theme.palette.custom.header,
        color: theme.palette.text.primary,
        position: "static"
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
        {user && (
          <IconButton
            color="inherit"
            onClick={handleNotificationOpen}
            sx={{
              mr: 1,
              color: theme.palette.custom.icon,
              '&:hover': {
                backgroundColor: theme.palette.custom.hover,
              },
            }}
          >
            <Badge badgeContent={unreadCount} color="error">
              <Notifications />
            </Badge>
          </IconButton>
        )}
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
              <MenuItem onClick={() => navigate(`/${user?.username}`)}>
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
            <Menu
              anchorEl={notificationAnchorEl}
              open={Boolean(notificationAnchorEl)}
              onClose={handleNotificationClose}
              PaperProps={{
                elevation: 0,
                sx: {
                  overflow: 'visible',
                  filter: 'drop-shadow(0px 2px 8px rgba(0,0,0,0.32))',
                  // mt: 1.5,
                  width: 360,
                  maxHeight: 400,
                  overflowY: 'auto',
                  py: 0,
                  '&::-webkit-scrollbar': {
                    width: '6px',
                    backgroundColor: 'transparent',
                  },
                  '&::-webkit-scrollbar-track': {
                    backgroundColor: 'transparent',
                  },
                  '&::-webkit-scrollbar-thumb': {
                    borderRadius: '3px',
                    backgroundColor: 'rgba(0,0,0,0.2)',
                    '&:hover': {
                      backgroundColor: 'rgba(0,0,0,0.3)',
                    },
                  },
                },
              }}
              transformOrigin={{ horizontal: 'right', vertical: 'top' }}
              anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
            >
              {notificationLoading ? (
                <MenuItem>Loading notifications...</MenuItem>
              ) : notifications.length === 0 ? (
                <MenuItem>No notifications</MenuItem>
              ) : (
                notifications.map((notification) => (
                  <NotificationMenuItem
                    key={notification.id}
                    onClick={() => handleNotificationClick(notification)}
                    sx={{
                      backgroundColor: notification.read ? 'inherit' : 'inherit',
                      whiteSpace: 'normal',
                      wordWrap: 'break-word',
                    }}
                  >
                    <ListItemIcon>
                      {getNotificationIcon(notification.type)}
                    </ListItemIcon>
                    <ListItemText
                      primary={notification.content}
                      secondary={new Date(notification.createdAt).toLocaleString()}
                      primaryTypographyProps={{
                        style: {
                          whiteSpace: 'normal',
                          wordWrap: 'break-word',
                        }
                      }}
                    />
                    {
                      !notification.read &&
                      <ListItemSecondaryAction>
                        <Dot size={30} color={theme.palette.primary.light}/>
                      </ListItemSecondaryAction>
                    }
                  </NotificationMenuItem>
                ))
              )}
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
