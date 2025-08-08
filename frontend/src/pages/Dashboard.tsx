import React from 'react';
import { BarChart3, Users, Package, TrendingUp } from 'lucide-react';
import { H1, H2, H3, TextMD } from '../components/ui/Typography';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Grid, GridItem } from '../components/ui/Grid';
import { Stack, Inline } from '../components/ui/Layout';
import { useAuth } from '../hooks/useAuth';

export function DashboardPage() {
  const { user } = useAuth();
  const stats = [
    {
      title: 'Total Users',
      value: '12,345',
      change: '+12%',
      trend: 'up',
      icon: Users,
    },
    {
      title: 'Products',
      value: '1,234',
      change: '+5%',
      trend: 'up',
      icon: Package,
    },
    {
      title: 'Revenue',
      value: '$45,678',
      change: '+18%',
      trend: 'up',
      icon: TrendingUp,
    },
    {
      title: 'Analytics',
      value: '98.5%',
      change: '-2%',
      trend: 'down',
      icon: BarChart3,
    },
  ];

  const recentActivity = [
    { id: 1, user: 'John Doe', action: 'Created new product', time: '2 minutes ago' },
    { id: 2, user: 'Jane Smith', action: 'Updated user profile', time: '5 minutes ago' },
    { id: 3, user: 'Mike Johnson', action: 'Completed order #12345', time: '10 minutes ago' },
    { id: 4, user: 'Sarah Wilson', action: 'Added new category', time: '15 minutes ago' },
  ];

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div>
        <H1>Welcome back, {user ? `${user.firstName} ${user.lastName}` : 'User'}!</H1>
        <TextMD className="text-muted-foreground mt-2">
          Here's what's happening with your business today.
        </TextMD>
      </div>

      {/* Stats Grid */}
      <Grid cols={1} gap={6} responsive={{ sm: 2, lg: 4 }}>
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <GridItem key={index}>
              <Card className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <TextMD className="text-muted-foreground text-sm">
                      {stat.title}
                    </TextMD>
                    <H3 className="text-2xl font-bold mt-2">{stat.value}</H3>
                    <Inline space="sm" className="mt-2">
                      <Badge 
                        variant={stat.trend === 'up' ? 'success' : 'destructive'}
                        className="text-xs"
                      >
                        {stat.change}
                      </Badge>
                      <TextMD className="text-muted-foreground text-xs">
                        from last month
                      </TextMD>
                    </Inline>
                  </div>
                  <div className="p-3 bg-primary/10 rounded-lg">
                    <Icon className="h-6 w-6 text-primary" />
                  </div>
                </div>
              </Card>
            </GridItem>
          );
        })}
      </Grid>

      {/* Content Grid */}
      <Grid cols={1} gap={8} responsive={{ lg: 3 }}>
        <GridItem span={1} responsive={{ lg: 2 }}>
          {/* Chart Placeholder */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-6">
              <H2>Analytics Overview</H2>
              <Button variant="outline" size="sm">
                View Details
              </Button>
            </div>
            <div className="h-80 bg-muted rounded-lg flex items-center justify-center">
              <div className="text-center">
                <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <TextMD className="text-muted-foreground">
                  Chart component would go here
                </TextMD>
              </div>
            </div>
          </Card>
        </GridItem>

        <GridItem span={1}>
          {/* Recent Activity */}
          <Card className="p-6">
            <H2 className="mb-6">Recent Activity</H2>
            <Stack space="md">
              {recentActivity.map((activity) => (
                <div key={activity.id} className="flex items-start space-x-4">
                  <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <TextMD className="text-sm">
                      <span className="font-medium">{activity.user}</span>{' '}
                      {activity.action}
                    </TextMD>
                    <TextMD className="text-muted-foreground text-xs mt-1">
                      {activity.time}
                    </TextMD>
                  </div>
                </div>
              ))}
            </Stack>
            <Button variant="outline" size="sm" className="w-full mt-4">
              View All Activity
            </Button>
          </Card>
        </GridItem>
      </Grid>

      {/* Quick Actions */}
      <Card className="p-6">
        <H2 className="mb-4">Quick Actions</H2>
        <Inline space="md" wrap={true}>
          <Button variant="default">Add Product</Button>
          <Button variant="outline">Manage Users</Button>
          <Button variant="outline">View Reports</Button>
          <Button variant="outline">Export Data</Button>
        </Inline>
      </Card>
    </div>
  );
}