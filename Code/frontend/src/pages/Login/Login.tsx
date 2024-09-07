// src/components/Login.tsx

import { useState, FC } from 'react';
import { useNavigate } from 'react-router-dom';
import { Container, Typography, Box, Paper } from '@mui/material';
import { TextField } from '../../components/TextField/TextField';
import { Button } from '../../components/Button/Button';
import { useAuth } from '../../hooks/useAuth';
import { styled } from '@mui/material/styles';
import axios from 'axios';

const LoginPaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(4),
  maxWidth: 500,
  textAlign: 'center',
}));

const Login: FC = () => {
  const [publicIp, setPublicIp] = useState<string>('');
  const [username, setUsername] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleLogin = async () => {
    const isAuthenticated = await login(username, password);

    if (isAuthenticated) {
      navigate('/priorities');
    } else {
      alert('Invalid credentials');
    }
  };

  return (
    <Container sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', height: '86vh'}}>
      <LoginPaper elevation={3}>
        <Typography component="h1" variant="h5">
          Login
        </Typography>
        <Box component="form" sx={{ mt: 1 }}>
          <TextField
            margin="normal"
            required
            fullWidth
            id="username"
            label="Username"
            name="username"
            autoComplete="username"
            autoFocus
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
          <TextField
            margin="normal"
            required
            fullWidth
            name="password"
            label="Password"
            type="password"
            id="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <TextField
            margin="normal"
            required
            fullWidth
            id="public-ip"
            label="Public IP"
            name="public-ip"
            autoComplete="public-ip"
            value={publicIp}
            onChange={(e) => setPublicIp(e.target.value)}
          />
          <Button
            type="button"
            fullWidth
            variant="contained"
            sx={{ mt: 3, mb: 2 }}
            onClick={handleLogin}
          >
            Login
          </Button>
        </Box>
      </LoginPaper>
    </Container>
  );
};

export default Login;
