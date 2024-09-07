import { FC } from 'react';
import { Typography, Box, Grid, Paper, Container, Avatar } from '@mui/material';
import { BarChart, PieChart, ShowChart } from '@mui/icons-material';
import {
  BarChart as ReBarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart as RePieChart,
  Pie,
  Cell,
  LineChart,
  Line
} from 'recharts';
import axios from 'axios';

const statisticsData = [
  { id: 1, title: 'Total Devices', value: 50, icon: <Avatar sx={{ bgcolor: 'primary.main' }}><BarChart /></Avatar> },
  { id: 2, title: 'Active Connections', value: 35, icon: <Avatar sx={{ bgcolor: 'secondary.main' }}><PieChart /></Avatar> },
  { id: 3, title: 'Data Usage (GB)', value: 120, icon: <Avatar sx={{ bgcolor: 'success.main' }}><ShowChart /></Avatar> },
];

const barData = [
  { name: 'Jan', connections: 30 },
  { name: 'Feb', connections: 35 },
  { name: 'Mar', connections: 28 },
  { name: 'Apr', connections: 40 },
  { name: 'May', connections: 38 },
  { name: 'Jun', connections: 45 },
  { name: 'Jul', connections: 50 },
  { name: 'Aug', connections: 48 },
  { name: 'Sep', connections: 42 },
  { name: 'Oct', connections: 40 },
  { name: 'Nov', connections: 39 },
  { name: 'Dec', connections: 50 }
];

const pieData = [
  { name: 'WiFi', value: 60 },
  { name: 'Ethernet', value: 25 },
  { name: 'Guest', value: 15 }
];

const lineData = [
  { name: 'Jan', serviceA: 10, serviceB: 12, serviceC: 8, serviceD: 5 },
  { name: 'Feb', serviceA: 15, serviceB: 18, serviceC: 12, serviceD: 8 },
  { name: 'Mar', serviceA: 12, serviceB: 10, serviceC: 14, serviceD: 6 },
  { name: 'Apr', serviceA: 18, serviceB: 20, serviceC: 16, serviceD: 10 },
  { name: 'May', serviceA: 20, serviceB: 22, serviceC: 18, serviceD: 12 },
  { name: 'Jun', serviceA: 16, serviceB: 19, serviceC: 17, serviceD: 14 },
  { name: 'Jul', serviceA: 22, serviceB: 25, serviceC: 21, serviceD: 18 },
  { name: 'Aug', serviceA: 24, serviceB: 28, serviceC: 19, serviceD: 20 },
  { name: 'Sep', serviceA: 18, serviceB: 24, serviceC: 22, serviceD: 16 },
  { name: 'Oct', serviceA: 20, serviceB: 21, serviceC: 24, serviceD: 19 },
  { name: 'Nov', serviceA: 25, serviceB: 27, serviceC: 23, serviceD: 22 },
  { name: 'Dec', serviceA: 28, serviceB: 30, serviceC: 26, serviceD: 24 }
];

const COLORS = ['#0088FE', '#00C49F', '#FFBB28'];

const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, index }: any) => {
  const RADIAN = Math.PI / 180;
  const multiplier = index === 0 ? 0.5 : 0.6;
  const radius = innerRadius + (outerRadius - innerRadius) * multiplier;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);

  return (
    <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central">
      {`${pieData[index].value}`}
    </text>
  );
};

const Dashboard: FC = () => {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column' }}>
      <Container sx={{ mt: 2 }}>
        <Grid container spacing={2}>
          {statisticsData.map((stat) => (
            <Grid item xs={12} sm={6} md={4} key={stat.id}>
              <Paper sx={{ p: 2, display: 'flex', alignItems: 'center' }}>
                {stat.icon}
                <Box sx={{ ml: 2 }}>
                  <Typography variant="h6">{stat.title}</Typography>
                  <Typography variant="h4">{stat.value}</Typography>
                </Box>
              </Paper>
            </Grid>
          ))}
          <Grid item xs={12} md={4}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom>
                Monthly Active Connections
              </Typography>
              <ReBarChart width={350} height={250} data={barData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="connections" name="Total Connections" fill="#8884d8" />
              </ReBarChart>
            </Paper>
          </Grid>
          <Grid item xs={12} md={4}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom>
                Connection Types Distribution
              </Typography>
              <RePieChart width={350} height={250}>
                <Pie
                  data={pieData}
                  cx={175}
                  cy={125}
                  labelLine={false}
                  label={renderCustomizedLabel}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Legend
                  layout="horizontal"
                  align="center"
                  verticalAlign="bottom"
                  iconType="circle"
                />
              </RePieChart>
            </Paper>
          </Grid>
          <Grid item xs={12} md={4}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom>
                Monthly Data Usage By Service (GB)
              </Typography>
              <LineChart width={350} height={250} data={lineData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="serviceA" stroke="#8884d8" name="YouTube" />
                <Line type="monotone" dataKey="serviceB" stroke="#82ca9d" name="Gaming" />
                <Line type="monotone" dataKey="serviceC" stroke="#ffc658" name="Streaming" />
                <Line type="monotone" dataKey="serviceD" stroke="#ff7300" name="Downloads" />
              </LineChart>
            </Paper>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
};

export default Dashboard;
