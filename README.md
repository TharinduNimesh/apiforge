# API Management Platform

A robust API management solution built with Nuxt.js and Nuxt UI, offering comprehensive API lifecycle management, rate limiting, and multi-tier access control.

## 📸 Application Screenshots

<div align="center">
  <img src="https://raw.githubusercontent.com/TharinduNimesh/apiforge/refs/heads/main/docs/images/dashboard.png" alt="Dashboard" width="800"/>
  <p><em>Dashboard - API Management Overview</em></p>
  
  <img src="https://raw.githubusercontent.com/TharinduNimesh/apiforge/refs/heads/main/docs/images/stats.png" alt="API Creation" width="800"/>
  <p><em>API Info & Usage Analytics</em></p>
  
  <img src="https://raw.githubusercontent.com/TharinduNimesh/apiforge/refs/heads/main/docs/images/usage.png" alt="Analytics" width="800"/>
  <p><em>API Response Preview</em></p>
</div>

## 🚀 Features

- API Creation and Management
- Role-based Access Control (Admin, Paid, Free users)
- Rate Limiting and Usage Tracking
- API Key Management
- Real-time Monitoring
- Comprehensive Documentation

## 📚 Documentation

- [Project Overview](docs/OVERVIEW.md)
- [Features Documentation](docs/FEATURES.md)
- [Deployment Guide](docs/DEPLOYMENT.md)

## 🛠️ Tech Stack

- Backend: PocketBase (SQLite-based backend)
- Frontend: Nuxt.js with Nuxt UI
- Database: SQLite
- Authentication: PocketBase built-in authentication
- Rate Limiting: Custom implementation

## 🔧 Requirements

- Node.js >= 20
- SQLite >= 3.0
- npm or yarn

## 🔑 Quick Start

```bash
# Clone the repository
git clone https://github.com/TharinduNimesh/api-application.git

# Install dependencies
npm install

# Configure environment
cp .env.example .env

# Start the development server
npm run dev
```

## ⚙️ Environment Setup Reminders

1. Configure PocketBase connection in `.env`:
   ```
   POCKETBASE_URL=http://localhost:8090
   ```

2. Configure additional settings as needed for your environment.

## ⚠️ Important Notice

This is a proprietary client project. All rights reserved. Unauthorized copying, modification, distribution, or use of this software is strictly prohibited. The codebase and its documentation are confidential and intended solely for authorized users.

© 2025 **Eversoft**. All Rights Reserved.
