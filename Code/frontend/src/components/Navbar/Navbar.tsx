import React from 'react';
import { AppBar, Toolbar, Typography, Button, Box, IconButton, Tooltip, SvgIcon } from '@mui/material';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import RoomPreferencesRoundedIcon from '@mui/icons-material/RoomPreferencesRounded';
import ExitToAppRoundedIcon from '@mui/icons-material/ExitToAppRounded';
import DashboardRoundedIcon from '@mui/icons-material/DashboardRounded';
import LowPriorityIcon from '@mui/icons-material/LowPriority';
import RepartitionRoundedIcon from '@mui/icons-material/RepartitionRounded';

const Navbar: React.FC = () => {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { isAuthenticated, logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const chosenColor = '#6082B6';

  return (
    <AppBar position="static" sx={{backgroundColor: '#6495ED'}}>
      <Toolbar sx={{gap: 1}}>
        <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
          FlowSensei
        </Typography>
        {isAuthenticated && (
          <>
            <Box display={'flex'} alignItems={'center'} sx={{borderRadius: '50%', backgroundColor: pathname === "/dashboard" ? chosenColor : ''}}>
              <Tooltip title="dashboard">
                <IconButton aria-label="dashboard" component={Link} to="/dashboard" size='large'>
                  <DashboardRoundedIcon fontSize="inherit" />
                </IconButton>
              </Tooltip>
            </Box>
            <Box display={'flex'} alignItems={'center'} sx={{borderRadius: '50%', backgroundColor: pathname === "/priorities" ? chosenColor : ''}}>
              <Tooltip title="priorities">
                <IconButton aria-label="priorities" component={Link} to="/priorities" size='large'>
                  <RoomPreferencesRoundedIcon fontSize="inherit" />
                  {/* <RepartitionRoundedIcon fontSize="inherit" /> */}
                </IconButton>
              </Tooltip>
            </Box>
            <Box display={'flex'} alignItems={'center'} sx={{ borderRadius: '50%' }}>
              <Tooltip title="Logout">
                <IconButton aria-label="exit" size='large' onClick={handleLogout}>
                  <ExitToAppRoundedIcon fontSize="inherit" />
                </IconButton>
              </Tooltip>
            </Box>
            {/* <Button color="inherit" onClick={handleLogout}>
              Logout
            </Button> */}
          </>
        )}
      </Toolbar>
    </AppBar>
  );
};

export default Navbar;

// import React from 'react';
// import { AppBar, Toolbar, Typography, Button, Box } from '@mui/material';
// import { Link, useLocation, useNavigate } from 'react-router-dom';
// import { useAuth } from '../../hooks/useAuth';

// const Navbar: React.FC = () => {
//   const navigate = useNavigate();
//   const { pathname } = useLocation();
//   const { isAuthenticated, logout } = useAuth();

//   const handleLogout = () => {
//     logout();
//     navigate('/');
//   };

//   console.log("pathname: ", pathname);

//   return (
//     <AppBar position="static">
//       <Toolbar>
//         <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
//           FlowSensei
//         </Typography>
//         {isAuthenticated && (
//           <>
//             <Box sx={{ backgroundColor: '#115293', marginRight: '8px' }}>
//               <Button color="inherit" component={Link} to="/hello">
//                 Hello
//               </Button>
//             </Box>
//             <Button color="inherit" component={Link} to="/welcome">
//               Welcome
//             </Button>
//             <Button color="inherit" onClick={handleLogout}>
//               Logout
//             </Button>
//           </>
//         )}
//       </Toolbar>
//     </AppBar>
//   );
// };

// export default Navbar
