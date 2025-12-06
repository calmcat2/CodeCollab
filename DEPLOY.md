# Deploying CodeCollab to Render

Your application is configured for easy deployment on [Render](https://render.com).

## Prerequisites
- A GitHub repository containing this code.
- A [Render Account](https://dashboard.render.com).

## 🚀 One-Click Deployment (Blueprint)

1.  **Push to GitHub**: Ensure your latest code is pushed to your repository.
2.  **Go to Render Dashboard**: Click "New +" -> "Blueprint".
3.  **Connect Repository**: Select your `CodeCollab` repository.
4.  **Auto-Detection**: Render will detect `render.yaml`.
5.  **Click Apply**: Render will automatically:
    -   Spin up a Managed PostgreSQL database.
    -   Build your Docker image (Frontend + Backend).
    -   Deploy the service.

## ⚙️ How it Works
- **Docker**: Render uses the `Dockerfile` to build the exact same image you use locally.
- **Port**: Render assigns a dynamic port (e.g., 10000). Our `start.sh` script automatically detects this and updates Nginx.
- **Database**: The `render.yaml` automatically links the database connection string to your app via `DATABASE_URL`.

## 🔒 Security
- **HTTPS**: Render provides free SSL/HTTPS automatically.
- **Private Network**: The Database and App communicate over a private network.
- **Secrets**: Manage sensitive keys in the Render Dashboard under "Environment".
