# 📊 Sales Dashboard

A modern, responsive **Sales Dashboard** application built with **React.js** and styled with **Tailwind CSS**. This project aims to provide visual insights into sales data using **Recharts** for analytics and **Lucide React** for icons.

## 🚀 Tech Stack

* **Framework:** React.js
* **Styling:** Tailwind CSS
* **Charts:** Recharts
* **Icons:** Lucide React
* **Utilities:** clsx, tailwind-merge, @tanstack/react-query

---

## 🛠️ How to Run This Project

Follow these steps to set up and run the project on your local machine.


## 🟦 Step 1: Prerequisites
Make sure you have **Node.js** installed on your computer.
👉 **Download:** [https://nodejs.org/](https://nodejs.org/) (LTS version)

Check if installed:
```bash
node -v
npm -v
```

##🟦 Step 2: Create or Setup Project
(Note: If you have already cloned this repository, skip to Step 3. If you are building from scratch, follow below)

Open a terminal (CMD / PowerShell / VS Code terminal) and run:

```bash
npx create-react-app sales-dashboard
```
Then go inside the project folder:

```Bash
cd sales-dashboard
```

##🟦 Step 3: Install Extra Dependencies
This project uses several libraries. Install them using:

```Bash

npm install @tanstack/react-query recharts lucide-react clsx tailwind-merge
```

##🟦 Step 4: Configure Tailwind CSS
Tailwind CSS is required for styling.

Initialize Tailwind:

```Bash

npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p

```

##📘Step 5: Start the App
Run the development server:

```Bash
npm start
```

Your sales dashboard will open automatically at: http://localhost:3000


###📘 Create React App Documentation
This project was bootstrapped with Create React App.

Available Scripts
In the project directory, you can run:

npm start
Runs the app in the development mode. Open http://localhost:3000 to view it in your browser. The page will reload when you make changes. You may also see any lint errors in the console.

npm test
Launches the test runner in the interactive watch mode. See the section about running tests for more information.

npm run build
Builds the app for production to the build folder. It correctly bundles React in production mode and optimizes the build for the best performance. The build is minified and the filenames include the hashes. Your app is ready to be deployed! See the section about deployment for more information.

npm run eject
Note: this is a one-way operation. Once you eject, you can't go back! If you aren't satisfied with the build tool and configuration choices, you can eject at any time. This command will remove the single build dependency from your project. Instead, it will copy all the configuration files and the transitive dependencies (webpack, Babel, ESLint, etc) right into your project so you have full control over them. All of the commands except eject will still work, but they will point to the copied scripts so you can tweak them. At this point you're on your own.

Learn More
You can learn more in the Create React App documentation. To learn React, check out the React documentation.
