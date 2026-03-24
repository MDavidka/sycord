# Aura - Modern Phone Brand E-Commerce

A high-performance, minimalist e-commerce frontend for a premium mobile phone brand. Built with Vite, Vanilla TypeScript, and Tailwind CSS, designed for seamless deployment to Cloudflare Pages.

## 🚀 Tech Stack

*   **Framework:** Vite (Vanilla TypeScript)
*   **Styling:** Tailwind CSS (Utility-first, Dark Mode optimized)
*   **State Management:** Local Storage & DOM Manipulation
*   **Backend/BaaS:** Appwrite (Ready for integration)
*   **Deployment:** Cloudflare Pages

## ✨ Features

*   **Premium Aesthetic:** Dark-mode first design system inspired by top-tier tech brands.
*   **Responsive Layout:** Mobile-first approach ensuring a flawless experience across all devices.
*   **Dynamic Cart System:** Slide-out cart drawer with real-time quantity updates and total calculations.
*   **Product Showcase:** High-impact hero sections and detailed product cards with color selection.
*   **Type-Safe:** Strict TypeScript configuration for robust and maintainable code.

## 📁 Project Structure

```text
project/
├── index.html           # Main HTML entry point
├── src/
│   ├── main.ts          # Application orchestrator and state manager
│   ├── types.ts         # Shared TypeScript interfaces (Product, CartItem, etc.)
│   ├── utils.ts         # Helper functions (currency formatting, local storage)
│   ├── style.css        # Design system tokens and Tailwind directives
│   └── components/      # Reusable UI components
│       ├── nav.ts
│       ├── hero.ts
│       ├── feature-grid.ts
│       ├── product-card.ts
│       ├── cart-drawer.ts
│       └── footer.ts
├── public/              # Static assets
├── package.json         # Dependencies and scripts
├── tsconfig.json        # TypeScript configuration
└── vite.config.ts       # Vite build configuration
```

## 🛠️ Local Development Setup

### Prerequisites
*   Node.js (v18 or higher recommended)
*   npm, yarn, or pnpm

### Installation

1.  **Clone the repository** (or download the source code).
2.  **Install dependencies:**
    ```bash
    npm install
    ```
3.  **Start the development server:**
    ```bash
    npm run dev
    ```
4.  Open your browser and navigate to `http://localhost:5173`.

## ☁️ Appwrite Integration Steps

This project is designed to integrate seamlessly with [Appwrite](https://appwrite.io/) for backend services like authentication, database, and storage. Currently, the app uses mock data, but you can connect it to Appwrite by following these steps:

1.  **Create an Appwrite Project:**
    *   Sign up/Log in to your Appwrite Console.
    *   Create a new project (e.g., "Aura E-Commerce").
    *   Add a Web Platform and register your local development URL (`http://localhost:5173`) and production domain.

2.  **Install the Appwrite SDK:**
    ```bash
    npm install appwrite
    ```

3.  **Initialize the Client:**
    Create a new file `src/appwrite.ts`:
    ```typescript
    import { Client, Account, Databases } from 'appwrite';

    const client = new Client()
        .setEndpoint('https://cloud.appwrite.io/v1') // Your Appwrite Endpoint
        .setProject('YOUR_PROJECT_ID');              // Your Project ID

    export const account = new Account(client);
    export const databases = new Databases(client);
    ```

4.  **Set Up Databases:**
    *   Create a Database (e.g., `Store`).
    *   Create a Collection for `Products` with attributes matching the `Product` interface in `src/types.ts` (name, description, price, imageUrl, etc.).
    *   Update `src/main.ts` to fetch products from Appwrite instead of using the `MOCK_PRODUCTS` array.

## 📦 Build & Deployment (Cloudflare Pages)

This project is optimized for deployment on Cloudflare Pages.

1.  **Build the project:**
    ```bash
    npm run build
    ```
    This will generate production-ready static files in the `dist` directory.

2.  **Deploy to Cloudflare Pages:**
    *   Connect your GitHub/GitLab repository to Cloudflare Pages.
    *   Set the **Framework preset** to `None` or `Vite`.
    *   Set the **Build command** to `npm run build`.
    *   Set the **Build output directory** to `dist`.
    *   Add any necessary environment variables (e.g., `VITE_APPWRITE_PROJECT_ID`).
    *   Click **Save and Deploy**.

## 📜 Scripts

*   `npm run dev`: Starts the Vite development server.
*   `npm run build`: Compiles TypeScript and builds the project for production.
*   `npm run preview`: Previews the production build locally.
*   `npm run check`: Runs TypeScript type checking without emitting files.