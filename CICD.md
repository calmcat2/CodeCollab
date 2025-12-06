# CI/CD Pipeline Setup

Your CodeCollab project now has a fully automated CI/CD pipeline enabled via **GitHub Actions**.

## 🛠️ What it does
Every time you push code or open a Pull Request, GitHub will:
1.  **Test Backend**: Run `pytest` to ensure API stability.
2.  **Build Frontend**: Verify TypeScript type safety and build process (`npm run build`).
3.  **Verify Docker**: Build the Docker image to ensure it's deployable.
4.  **Auto-Deploy** (Optional): If configured, trigger a deployment to Render *only if* all tests pass.

## 🚀 How to Enable Auto-Deployment (CD)

By default, Render might deploy every push. To make it strictly dependent on tests passing:

1.  **Go to Render Dashboard**:
    -   Select your **CodeCollab** service.
    -   Go to **Settings** -> **Deploy Hooks**.
    -   Copy the **Deploy Hook URL**.
    -   *(Optional)* Turn **off** "Auto-Deploy" in Render settings if you want GitHub Actions to be the *only* trigger.

2.  **Go to GitHub Repository**:
    -   Settings -> **Secrets and variables** -> **Actions**.
    -   Click **New repository secret**.
    -   Name: `RENDER_DEPLOY_HOOK_URL`
    -   Value: *(Paste the URL from Render)*.

Now, deployment will happen automatically **only after** your tests pass! ✅
