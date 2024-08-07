import { FC } from 'react';
import { Typography, Container } from '@mui/material';

const NotFound: FC = () => {
  return (
    <Container maxWidth="sm">
      <Typography variant="h4" component="h1" gutterBottom>
        404 - Page Not Found
      </Typography>
    </Container>
  );
};

export default NotFound;
