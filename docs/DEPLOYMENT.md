# Deployment Guide

This guide will walk you through the steps to deploy the API Management Platform.

## Prerequisites
- Docker and Docker Compose installed on your server.
- A domain name for the frontend and backend (PocketBase).
- Access to a VPS or local server.

## Steps to Deploy

### 1. Clone the Repository
```bash
git clone https://github.com/TharinduNimesh/apiforge.git
cd apiforge
```

### 2. Configure Environment Variables
Copy the example environment file and update it:
```bash
cp .env.example .env
```

Update the `.env` file with the following structure:

```env
PB_URL=http://localhost:8080
PB_SUPER_ADMIN_KEY=

# Public Frontend URL
APP_PORT=3000 # Change this to the port you want to run the frontend on
APP_URL=http://localhost:3000

# Don't Change the following values
### ------------------------ ###
### - NITRO_PRESET -> used to determine the server environment
### - PB_INTERNAL_URL -> used to communicate with pocketbase inside the docker network
### - REDIS_HOST -> used to communicate with redis inside the docker network
### - REDIS_PORT -> used to communicate with redis inside the docker network
### ------------------------ ###
NITRO_PRESET=bun
PB_INTERNAL_URL=http://pb:8080
REDIS_HOST=redis
REDIS_PORT=6379
```

### 3. Build and Start Docker Services
Run the following command to build and start the Docker containers:
```bash
docker-compose up --build
```

### 4. Set Up PocketBase Superadmin
After the services are up, a URL will be logged in the console for setting up the PocketBase superadmin user. It will look like this:

![Placeholder for PocketBase URL Screenshot](../docs/images/pocketbase-url-placeholder.png)

If you are on a VPS, replace `0.0.0.0:8080` with your server's IP address (e.g., `your-server-ip:8080`). Navigate to this URL in your browser.

### 5. Create Superadmin User
You will see a signup form. Use your email and password to create a superadmin user.

### 6. Import Database Schema
1. Log in to PocketBase.
2. Navigate to **Settings** -> **Import Collections**.
3. Copy the content of the `pb_schema.json` file and paste it into the text area.
4. Click **Continue** to import the schema.

### 7. Generate Superadmin Key
1. Navigate to **Collections** -> **System** -> **_superusers**.
2. Select your user row and click the three dots (placeholder image below):

![Placeholder for Superuser Options Screenshot](../docs/images/superuser-options-placeholder.png)

3. Click **Impersonate** and paste `307584000` (10 years in seconds).
4. Generate a superadmin key and copy it.
5. Stop all containers and paste the key into the `.env` file under `PB_SUPER_ADMIN_KEY`.

### 8. Update Domain Names
Update the `.env` file with the domain names you plan to use for the frontend and PocketBase.

### 9. Restart Docker Services
Rebuild and restart the Docker containers in detached mode:
```bash
docker-compose up --build -d
```

### 10. Configure NGINX
Set up your NGINX server to handle the domains configured in the `.env` file. Ensure DNS records are correctly set up for your domain names.

### 11. Set Up SMTP for PocketBase
1. Create an account on [resend.com](https://resend.com).
2. Register your domain name and create an API key.
3. Log in to the PocketBase dashboard.
4. Navigate to **Settings** -> **Mail Settings**.
5. Configure the SMTP settings as follows:
   - **Sender Name**: Your desired sender name.
   - **Sender Email**: Your desired sender email.
   - **SMTP Host**: `smtp.resend.com`
   - **Port**: `2465`
   - **Username**: `resend`
   - **Password**: The API key generated from Resend.
6. Save the settings.

### 12. Finalize Deployment
Restart the NGINX server and verify that the frontend and backend are accessible via their respective domains.

You are now ready to use the API Management Platform!