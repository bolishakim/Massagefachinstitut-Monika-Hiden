import React from 'react';
import { motion } from 'framer-motion';
import { Users, Shield, Settings, Activity } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { useAuth } from '@/hooks/useAuth';
import { usePermissions } from '@/components/layout/ProtectedRoute';

export function DashboardPage() {
  const { user } = useAuth();
  const { isAdmin, isModerator } = usePermissions();

  const stats = [
    {
      title: 'Total Users',
      value: '1,234',
      description: 'Active users in the system',
      icon: Users,
      trend: '+12%',
    },
    {
      title: 'Active Sessions',
      value: '234',
      description: 'Currently logged in users',
      icon: Activity,
      trend: '+5%',
    },
    {
      title: 'Admin Actions',
      value: '45',
      description: 'Admin actions this month',
      icon: Shield,
      trend: '+8%',
    },
    {
      title: 'System Health',
      value: '99.9%',
      description: 'Uptime percentage',
      icon: Settings,
      trend: '+0.1%',
    },
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: 'spring',
        stiffness: 100,
      },
    },
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="text-3xl font-bold mb-2">
          Welcome back, {user?.firstName}! 👋
        </h1>
        <p className="text-muted-foreground">
          Here's what's happening with your application today.
        </p>
      </motion.div>

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
      >
        {stats.map((stat, index) => (
          <motion.div key={stat.title} variants={itemVariants}>
            <Card className="glass hover:bg-accent/50 transition-colors">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {stat.title}
                </CardTitle>
                <stat.icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <p className="text-xs text-muted-foreground">
                  {stat.description}
                </p>
                <div className="flex items-center pt-1">
                  <span className="text-xs text-green-600 font-medium">
                    {stat.trend}
                  </span>
                  <span className="text-xs text-muted-foreground ml-1">
                    from last month
                  </span>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </motion.div>

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-1 lg:grid-cols-2 gap-6"
      >
        <motion.div variants={itemVariants}>
          <Card className="glass">
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>
                Common tasks you can perform
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {isModerator() && (
                <button className="w-full text-left p-3 rounded-lg border hover:bg-accent transition-colors">
                  <div className="flex items-center gap-3">
                    <Users className="h-5 w-5 text-primary" />
                    <div>
                      <div className="font-medium">Manage Users</div>
                      <div className="text-sm text-muted-foreground">
                        View and manage user accounts
                      </div>
                    </div>
                  </div>
                </button>
              )}
              
              <button className="w-full text-left p-3 rounded-lg border hover:bg-accent transition-colors">
                <div className="flex items-center gap-3">
                  <Settings className="h-5 w-5 text-primary" />
                  <div>
                    <div className="font-medium">Profile Settings</div>
                    <div className="text-sm text-muted-foreground">
                      Update your account settings
                    </div>
                  </div>
                </div>
              </button>

              {isAdmin() && (
                <button className="w-full text-left p-3 rounded-lg border hover:bg-accent transition-colors">
                  <div className="flex items-center gap-3">
                    <Shield className="h-5 w-5 text-primary" />
                    <div>
                      <div className="font-medium">System Settings</div>
                      <div className="text-sm text-muted-foreground">
                        Configure system settings
                      </div>
                    </div>
                  </div>
                </button>
              )}
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={itemVariants}>
          <Card className="glass">
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>
                Latest system activities
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {[
                {
                  action: 'User logged in',
                  user: 'john@example.com',
                  time: '5 minutes ago',
                },
                {
                  action: 'Profile updated',
                  user: 'jane@example.com',
                  time: '1 hour ago',
                },
                {
                  action: 'New user registered',
                  user: 'bob@example.com',
                  time: '2 hours ago',
                },
                {
                  action: 'Password reset',
                  user: 'alice@example.com',
                  time: '3 hours ago',
                },
              ].map((activity, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between py-2 border-b last:border-0"
                >
                  <div>
                    <div className="font-medium text-sm">{activity.action}</div>
                    <div className="text-xs text-muted-foreground">
                      {activity.user}
                    </div>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {activity.time}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>
    </div>
  );
}