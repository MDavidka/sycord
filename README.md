# AuthPortal

A secure, high-performance authentication portal built with **Vite**, **TypeScript**, **Tailwind CSS**, and **Appwrite**.

This project demonstrates a complete authentication flow including user registration, login, session management, and a protected dashboard route. It uses Vanilla TypeScript for lightweight, fast DOM manipulation without the overhead of a heavy frontend framework.

## Features

- 🔐 **Complete Auth Flow**: Register, Login, and Logout functionality.
- 🛡️ **Protected Routes**: Secure dashboard accessible only to authenticated users.
- 💾 **Real Backend**: Powered by Appwrite's Authentication and Account APIs.
- 🎨 **Modern UI**: Clean, responsive design built with Tailwind CSS.
- 🌓 **Dark Mode Ready**: Automatically adapts to the user's system preferences.
- ⚡ **Lightning Fast**: Built on Vite with Vanilla TypeScript.

## Tech Stack

- **Frontend Tooling**: [Vite](https://vitejs.dev/)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **Backend/Auth**: [Appwrite](https://appwrite.io/)
- **Deployment Target**: [Cloudflare Pages](https://pages.cloudflare.com/)

## Getting Started

### Prerequisites

Ensure you have [Node.js](https://nodejs.org/) (v18 or higher) installed on your machine.

### Installation

1. Clone the repository or download the source code.
2. Navigate to the project directory:
   ```bash
   cd auth-portal
   ```
3. Install the dependencies:
   ```bash
   npm install
   ```

### Local Development

Start the Vite development server:

```bash
npm run dev
```

The application will be available at `http://localhost:5173` (or the port specified in your terminal).

### Available Scripts

- `npm run dev`: Starts the local development server.
- `npm run build`: Type-checks the code and builds the application for production.
- `npm run preview`: Previews the production build locally.
- `npm run check`: Runs TypeScript compiler checks without emitting files.

## Appwrite Integration

This project is pre-configured to connect to a live Appwrite backend. The configuration is located in `src/appwrite.ts`.

- **Endpoint**: `https://fra.cloud.appwrite.io/v1`
- **Project ID**: `69c2b4a10015a5c19a9f`

### How it works:
1. **Session Management**: When a user logs in, the Appwrite SDK creates a secure session (`account.createEmailPasswordSession`).
2. **Persistence**: Appwrite automatically manages the session cookie/token in the browser.
3. **Verification**: On initial load, `src/main.ts` calls `account.get()` to verify if an active session exists before rendering the application.

*Note: For a production environment, you may want to move the Project ID and Endpoint to environment variables (`.env`).*

## Project Structure

```text
project/
├── index.html              # Main HTML entry point
├── src/
│   ├── main.ts             # Application orchestrator and router
│   ├── appwrite.ts         # Appwrite SDK initialization
│   ├── types.ts            # Shared TypeScript interfaces
│   ├── utils.ts            # Helper functions (DOM, formatting)
│   ├── style.css           # Tailwind directives and CSS variables
│   └── components/         # Modular UI components
│       ├── header.ts       # Navigation header
│       ├── login-form.ts   # Login view
│       ├── register-form.ts# Registration view
│       ├── dashboard.ts    # Protected dashboard view
│       └── ui.ts           # Reusable UI elements (buttons, inputs)
├── package.json            # Dependencies and scripts
├── tsconfig.json           # TypeScript configuration
└── vite.config.ts          # Vite configuration
```

## Deployment

This project is optimized for deployment on **Cloudflare Pages**. 

To deploy:
1. Connect your GitHub repository to Cloudflare Pages.
2. Set the **Framework preset** to `None` or `Vite`.
3. Set the **Build command** to `npm run build`.
4. Set the **Build output directory** to `dist`.

Cloudflare Pages will automatically build and deploy your application.