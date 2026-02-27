---
description: Sync the local repository with GitHub and update dependencies
---

This workflow ensures your local code matches the latest version on GitHub and that all necessary libraries are installed.

// turbo-all
1. Fetch latest changes from remote
```bash
git fetch origin
```

2. Pull changes into the current branch (main)
```bash
git pull origin main
```

3. Update frontend dependencies if changed
```bash
npm install
```

4. Update backend dependencies if changed
```bash
cd backend && npm install
```

5. Restart the development server
```bash
# The user usually runs npm start. 
# You may need to restart the 'npm start' command in the terminal.
```
