# My Jira - Personal Task Manager

A personal and interactive web application for managing and visualizing your assigned Jira tasks, designed for a responsive, easy-to-use experience. This application connects to the Jira Cloud API via a secure Node.js proxy server.

> **AI-Generated Repository**
>
> **This entire repository, including all code, documentation, and project structure, was generated through collaboration with multiple AI language models including Gemini (Google), Claude (Anthropic) and ChatGPT (OpenAI), Gemini (Google)** The development process was iterative and driven by a series of conversational prompts to build features, design the UI, and structure the application. No single line of code was written manually - everything was generated through AI assistance.

## 🎯 Who Is This For?

This guide is written for **Lineman Wongnai team members** who have never:
- Written code before
- Used Terminal
- Installed development tools
- Set up a web application

The app is pre-configured to work with Lineman Wongnai's Jira instance. If you're from a different organization, you'll need to modify the server configuration.

Don't worry! We'll guide you through every step with detailed instructions. You can choose between Terminal commands or visual methods for many steps.

## ✨ Complete Feature List

### 📥 **Inbox View**
- **Two-pane layout**: Task list on the left, detailed view on the right
- **Smart sorting**: Sort by creation time, last update, or priority
- **Quick actions**: Hover over any task to reveal instant status change buttons
- **Visual indicators**: 
  - Closed tasks show "Closed" label and gray background
  - Selected tasks highlighted with indigo color and left border
  - Priority badges with color coding
  - Time-based badges (overdue, due soon, etc.)
- **Real-time updates**: See changes immediately after actions

### 📋 **Kanban Board**
- **Drag and drop**: Move tasks between columns using @dnd-kit library
- **Status columns**: To Do, In Progress, In Review, Done, Cancelled
- **Visual feedback**: Cards lift slightly when dragging
- **Auto-save**: Status updates automatically sync with Jira
- **Compact view**: See more tasks at once with optimized card design

### 📊 **Gantt Chart**
- **Timeline visualization**: See all tasks on a horizontal timeline
- **Auto-scroll**: Automatically centers on today's date
- **Color coding**: Different colors for different task statuses
- **Duration bars**: Visual representation of task duration
- **Zoom controls**: Adjust timeline scale

### 📈 **Workload View**
- **Dashboard stats**: 
  - Total open tasks
  - Overdue count
  - Tasks due this week
  - Average task age
- **Charts**:
  - Task distribution by status (pie chart)
  - Tasks over time (line chart)
  - Priority breakdown (bar chart)
- **Personal insights**: Track your productivity trends

### 🎨 **UI/UX Features**
- **Collapsible sidebar**: Click chevron to show only icons
- **Mood indicator**: 
  - 😎 = 0 tasks (Chill!)
  - 😊 = 1-3 tasks (Good)
  - 😐 = 4-6 tasks (Busy)
  - 😰 = 7-10 tasks (Stressed)
  - 🤯 = 10+ tasks (Overloaded!)
- **Search**: Find tasks by ID or title
- **Filters**: By status, priority, department, BI category
- **Date range**: Filter tasks by time period
- **Live indicator**: Green "LIVE" badge during office hours

### ⚡ **Task Management**
- **View details**: Full task description, comments, attachments
- **Update status**: Change workflow status with proper transitions
- **Add comments**: Post updates directly to Jira
- **Priority changes**: Update task priority
- **Create tasks**: Add new Jira issues without leaving the app

### 🔄 **Auto-refresh**
- **Office hours**: 8 AM - 7 PM automatic refresh every 10 minutes
- **Manual refresh**: Click refresh button anytime
- **Connection status**: Visual indicators for connection state

-----

## 🚀 Complete Setup Guide for Mac Users

### Prerequisites

You'll need:
1. A Mac computer
2. Your Jira account email and password
3. About 30 minutes for the initial setup

### Step 1: Open Terminal

Terminal is a program on your Mac that lets you control your computer with text commands.

1. Press `Command + Space` on your keyboard
2. Type: **Terminal**
3. Press `Enter`
4. A white or black window will appear - this is Terminal

**Important**: Keep this Terminal window open throughout the entire setup process.

### Step 2: Install Homebrew

Homebrew is a tool that makes it easy to install other programs on your Mac.

1. Copy this entire command (triple-click to select all):
```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```

2. Paste it into Terminal (Command + V)
3. Press `Enter`
4. **It will ask for your Mac password** - type it and press Enter
   - Note: You won't see any characters while typing your password - this is normal!
5. Wait... this might take 5-10 minutes
6. When it's done, you'll see "Installation successful!"

**Troubleshooting Homebrew Installation:**
- If you see "Command Line Tools for Xcode" popup, click "Install" and wait
- If it says Homebrew is already installed, that's fine! Continue to the next step

### Step 3: Install Required Programs

Now we'll install Node.js and Git using Homebrew.

1. Copy and paste this command:
```bash
brew install node git
```

2. Press `Enter`
3. Wait for it to finish (2-5 minutes)

To verify everything installed correctly, run these commands one by one:
```bash
node --version
```
(Should show something like `v20.10.0`)

```bash
git --version
```
(Should show something like `git version 2.39.0`)

### Step 4: Create a Folder for Your Projects

Let's create a special folder on your Desktop for this app:

```bash
cd ~/Desktop
mkdir MyProjects
cd MyProjects
```

### Step 5: Download the Project

Copy and paste this command (replace `<repository-url>` with the actual URL from GitHub):
```bash
git clone <repository-url>
```

For example:
```bash
git clone https://github.com/username/my-jira-tasks.git
```

Then enter the project folder:
```bash
cd my-jira-tasks
```

### Step 6: Install Project Dependencies

This downloads all the helper programs the app needs:

```bash
npm install
```

Wait for it to finish (this might take 3-5 minutes and show a lot of text - that's normal!)

**Note**: The project uses @dnd-kit for drag-and-drop functionality, which is already included in package.json.

### Step 7: Get Your Jira API Token

1. Keep Terminal open, but switch to your web browser
2. Go to this website: https://id.atlassian.com/manage-profile/security/api-tokens
3. Log in with your **Lineman Wongnai Jira account** (your work email and password)
4. Click the blue **"Create API token"** button
5. Name it: **My Jira Tasks**
6. Click **"Create"**
7. **IMPORTANT**: Click "Copy" to copy the token
8. Open TextEdit (Command + Space, type TextEdit, press Enter)
9. Paste the token there temporarily so you don't lose it

### Step 8: Create Your Configuration File (.env)

You can create this file using either Terminal OR Finder. Choose the method you're most comfortable with:

#### Option A: Using Terminal (Recommended)
```bash
nano .env
```

Type exactly this (replace with your actual values):
```
JIRA_EMAIL=your.email@company.com
JIRA_TOKEN=paste_your_token_here
```

Save and exit:
- Press `Control + X`
- Press `Y` to confirm
- Press `Enter`

#### Option B: Using Finder (Visual Method)
1. Open Finder
2. Navigate to: Desktop → MyProjects → my-jira-tasks
3. Open TextEdit (Command + Space, type TextEdit)
4. Click Format menu → Make Plain Text
5. Type exactly this (replace with your values):
   ```
   JIRA_EMAIL=your.email@company.com
   JIRA_TOKEN=paste_your_token_here
   ```
6. Save the file:
   - Press Command + S
   - Navigate to your project folder
   - **IMPORTANT**: Name it exactly `.env` (with the dot)
   - If macOS warns about the dot, click "Use ."
   - Make sure "Hide Extension" is unchecked

### Step 9: Verify the Server File

The project already includes a `server.js` file that's pre-configured to work with Lineman Wongnai's Jira instance. You can verify it exists:

```bash
ls server.js
```

You should see `server.js` listed. This file is already set up to:
- Connect to `https://linemanwongnai.atlassian.net`
- Use your credentials from the `.env` file
- Handle all API requests securely

**Note**: If you're using a different Jira instance (not Lineman Wongnai), you'll need to edit the server.js file:

#### To Edit for Different Jira Domain (Optional):
```bash
nano server.js
```

Find this line:
```javascript
const jiraUrl = `https://linemanwongnai.atlassian.net${jiraPath}`;
```

Change `linemanwongnai` to your company's Jira subdomain.

Save with Control + X, Y, Enter.

### Step 10: Create Start Script

Let's create an easy way to start the app:

1. In Terminal:
```bash
nano start-app.sh
```

2. Paste this:
```bash
#!/bin/bash
echo "Starting My Jira Tasks App..."
echo "Starting backend server..."
node server.js &
SERVER_PID=$!
echo "Backend server started with PID $SERVER_PID"
echo "Starting frontend app..."
npm start
echo "Shutting down backend server..."
kill $SERVER_PID
```

3. Save (Control + X, Y, Enter)

4. Make it executable:
```bash
chmod +x start-app.sh
```

### Step 11: Start the Application

Run the app:
```bash
./start-app.sh
```

Your browser should open automatically after about 30 seconds!

### Step 12: Configure the App

1. In the web browser, look for the ⚙️ (gear) icon in the left sidebar
2. Click it
3. Enter your **Project Key** (e.g., `PROJ`, `BUSINT`, `LMW`)
   - This is the letters before the dash in tickets (e.g., LMW-123 → LMW)
4. Click "Save & Close"

**Note**: The app is pre-configured for Lineman Wongnai's Jira (`linemanwongnai.atlassian.net`). If you're using a different Jira instance, you'll need to modify the server.js file as described in Step 9.

## 🎉 You're Done!

Your Jira tasks should now appear in the app!

-----

## 🔄 How to Get the Latest Updates

### Quick Update (Do This Weekly)

1. Open Terminal
2. Go to your project folder:
```bash
cd ~/Desktop/MyProjects/my-jira-tasks
```

3. Get the latest code:
```bash
git pull
```

4. Update dependencies:
```bash
npm install
```

5. Start the app:
```bash
./start-app.sh
```

### If Git Pull Shows Errors

Sometimes your local files might conflict with updates. Here's the safe way to update:

1. Save your configuration:
```bash
cp .env ~/Desktop/env-backup.txt
```

2. Reset everything to match the latest version:
```bash
git fetch origin
git reset --hard origin/main
```
(Note: Use `origin/master` if `main` doesn't work)

3. Restore your configuration:
```bash
cp ~/Desktop/env-backup.txt .env
```

4. Update and restart:
```bash
npm install
./start-app.sh
```

## 📅 Daily Usage

### Starting the App Each Day

1. Open Terminal
2. Navigate to the project:
```bash
cd ~/Desktop/MyProjects/my-jira-tasks
```

3. Start the app:
```bash
./start-app.sh
```

### Stopping the App

Press `Control + C` in the Terminal window

### Creating a Desktop Shortcut

Let's make it even easier to start the app:

1. Open Terminal and run:
```bash
nano ~/Desktop/Start-Jira-Tasks.command
```

2. Paste this:
```bash
#!/bin/bash
cd ~/Desktop/MyProjects/my-jira-tasks
./start-app.sh
```

3. Save (Control + X, Y, Enter)

4. Make it executable:
```bash
chmod +x ~/Desktop/Start-Jira-Tasks.command
```

Now you can double-click "Start-Jira-Tasks" on your Desktop to start the app!

## 🆘 Common Problems and Solutions

### "Command not found" Error
```bash
echo 'export PATH="/opt/homebrew/bin:$PATH"' >> ~/.zshrc
source ~/.zshrc
```

### "Permission denied" Error
Add `sudo` before the command and enter your Mac password:
```bash
sudo npm install
```

### No Tasks Showing Up
1. Check your Project Key is correct (case-sensitive!)
2. Verify you have tasks assigned to you in Jira
3. Check your .env file has correct email and token:
```bash
cat .env
```

### Port Already in Use Error
Kill all Node processes:
```bash
killall node
```

### App Won't Start
1. Delete node_modules and reinstall:
```bash
rm -rf node_modules
npm install
```

### Lost Your API Token
1. Go back to https://id.atlassian.com/manage-profile/security/api-tokens
2. Create a new token
3. Update your .env file (see Step 8)

### Can't See .env File in Finder
Files starting with a dot are hidden by default. To see them:
1. In Finder, press `Command + Shift + .` (period)
2. Hidden files will appear slightly faded

## 💡 Pro Tips

### See Your Git Status
```bash
git status
```

### Check What Changed in Latest Update
```bash
git log --oneline -5
```

### Create an Alias for Quick Start
Add this to your Terminal configuration:
```bash
echo 'alias jira="cd ~/Desktop/MyProjects/my-jira-tasks && ./start-app.sh"' >> ~/.zshrc
source ~/.zshrc
```

Now you can just type `jira` in Terminal to start the app!

### View Error Logs
If something goes wrong, check the Terminal window for red error messages. They usually tell you exactly what's wrong.

## 📚 Technologies Used

- **React 19.1.0**: The latest version for building the user interface
- **@dnd-kit**: Modern drag-and-drop library (replaced react-beautiful-dnd)
- **Recharts**: For beautiful data visualizations
- **Tailwind CSS 4**: For styling without writing CSS
- **Lucide React**: For consistent, modern icons
- **Express 5**: Backend server framework
- **Node.js**: JavaScript runtime
- **Pre-configured for**: Lineman Wongnai Jira (`linemanwongnai.atlassian.net`)

## 🤝 Getting Help

If something doesn't work:
1. Take a screenshot of the error
2. Note which step you're on
3. Try the relevant solution from Common Problems
4. Restart your Mac and try again
5. Ask someone technical - show them this README and the error

Remember: Every developer started exactly where you are now!

## 📄 License

This project is open source and available under the [MIT License](LICENSE).