import React from "react";

const AdminDashboardPage = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome to the HSM Admin Dashboard. Manage your platform from here.
        </p>
      </div>

      {/* Dashboard stats cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-lg border bg-card p-6 shadow-sm">
          <div className="flex items-center justify-between space-y-0 pb-2">
            <h3 className="text-sm font-medium tracking-tight">Total Users</h3>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              className="h-4 w-4 text-muted-foreground"
            >
              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
          </div>
          <div className="text-2xl font-bold">1,234</div>
          <p className="text-xs text-muted-foreground">
            +20.1% from last month
          </p>
        </div>

        <div className="rounded-lg border bg-card p-6 shadow-sm">
          <div className="flex items-center justify-between space-y-0 pb-2">
            <h3 className="text-sm font-medium tracking-tight">Active Services</h3>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              className="h-4 w-4 text-muted-foreground"
            >
              <rect width="20" height="14" x="2" y="5" rx="2" />
              <line x1="2" x2="22" y1="10" y2="10" />
            </svg>
          </div>
          <div className="text-2xl font-bold">456</div>
          <p className="text-xs text-muted-foreground">
            +18.2% from last month
          </p>
        </div>

        <div className="rounded-lg border bg-card p-6 shadow-sm">
          <div className="flex items-center justify-between space-y-0 pb-2">
            <h3 className="text-sm font-medium tracking-tight">Service Providers</h3>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              className="h-4 w-4 text-muted-foreground"
            >
              <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
            </svg>
          </div>
          <div className="text-2xl font-bold">89</div>
          <p className="text-xs text-muted-foreground">
            +12 new this week
          </p>
        </div>

        <div className="rounded-lg border bg-card p-6 shadow-sm">
          <div className="flex items-center justify-between space-y-0 pb-2">
            <h3 className="text-sm font-medium tracking-tight">Revenue</h3>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              className="h-4 w-4 text-muted-foreground"
            >
              <line x1="12" x2="12" y1="2" y2="22" />
              <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
            </svg>
          </div>
          <div className="text-2xl font-bold">$45,231</div>
          <p className="text-xs text-muted-foreground">
            +4.5% from last month
          </p>
        </div>
      </div>

      {/* Recent activity section */}
      <div className="rounded-lg border bg-card p-6 shadow-sm">
        <h2 className="text-lg font-semibold mb-4">Recent Activity</h2>
        <div className="space-y-4">
          <div className="flex items-center gap-4 text-sm">
            <div className="h-2 w-2 rounded-full bg-green-500" />
            <span className="flex-1">New user registration: john@example.com</span>
            <span className="text-muted-foreground">2 minutes ago</span>
          </div>
          <div className="flex items-center gap-4 text-sm">
            <div className="h-2 w-2 rounded-full bg-blue-500" />
            <span className="flex-1">Service request #1234 assigned to Provider #56</span>
            <span className="text-muted-foreground">15 minutes ago</span>
          </div>
          <div className="flex items-center gap-4 text-sm">
            <div className="h-2 w-2 rounded-full bg-yellow-500" />
            <span className="flex-1">Payment processed for order #9876</span>
            <span className="text-muted-foreground">1 hour ago</span>
          </div>
          <div className="flex items-center gap-4 text-sm">
            <div className="h-2 w-2 rounded-full bg-purple-500" />
            <span className="flex-1">New service provider application submitted</span>
            <span className="text-muted-foreground">3 hours ago</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboardPage;
