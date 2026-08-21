# NepMart Frontend - React + Vite

A modern React application built with Vite for the NepMart e-commerce platform, featuring both customer-facing and admin interfaces.

## Features

### Frontend
- **Product Browsing**: Browse products by category (Wooden, Art, Bags, Clay, Jute, Wall, Pasmina)
- **Shopping Cart**: Add/remove products, manage quantities, view totals
- **Responsive Design**: Mobile-friendly interface
- **Real-time Cart Updates**: Cart synchronizes with localStorage
- **Product Images**: Display product images from backend API

### Admin Dashboard
- **Dashboard Overview**: View statistics on products, users, and orders
- **Product Management**: View all products with details
- **User Management**: Manage customer accounts
- **Image Management**: Handle product images
- **Responsive Admin Layout**: Sidebar navigation with main content area

## Project Structure

```
frontend-react/
├── src/
│   ├── admin/
│   │   ├── components/
│   │   │   └── AdminLayout.jsx
│   │   ├── css/
│   │   │   └── (admin styles)
│   │   └── pages/
│   │       ├── Dashboard.jsx
│   │       ├── Products.jsx
│   │       ├── Users.jsx
│   │       └── Images.jsx
│   ├── api/
│   │   └── client.js
│   ├── components/
│   │   └── Header.jsx
│   ├── context/
│   │   └── CartContext.jsx
│   ├── css/
│   │   └── (frontend styles)
│   ├── images/
│   ├── pages/
│   │   ├── Home.jsx
│   │   ├── Shop.jsx
│   │   ├── Cart.jsx
│   │   ├── Checkout.jsx
│   │   ├── Products.jsx
│   │   └── (other pages)
│   ├── App.jsx
│   ├── main.jsx
│   └── index.css
├── index.html
├── package.json
└── vite.config.js
```

## Installation

1. Navigate to the frontend-react directory:
```bash
cd frontend-react
```

2. Install dependencies:
```bash
npm install
```

## Development

Start the development server:
```bash
npm run dev
```

The application will be available at `http://localhost:5174`

## Building

Build for production:
```bash
npm run build
```

## API Configuration

Set `VITE_API_BASE_URL` to your backend URL (e.g., `https://your-backend-url`).

## Routes

### Frontend Routes
- `/` - Home page
- `/shop` - Shop all products
- `/wooden`, `/art`, `/bag`, `/clay`, `/jute`, `/wall`, `/pasmina` - Category pages
- `/cart` - Shopping cart
- `/checkout` - Checkout page
- `/about` - About page
- `/contact` - Contact page

### Admin Routes
- `/admin` - Admin dashboard
- `/admin/products` - Products management
- `/admin/users` - Users management
- `/admin/images` - Images management

## Technologies Used

- **React 18** - UI library
- **Vite** - Build tool and dev server
- **React Router** - Client-side routing
- **Axios** - HTTP client for API calls
- **Context API** - State management for cart

## Features Implemented

✅ Product browsing by category
✅ Shopping cart with add/remove/quantity management
✅ Cart persistence using localStorage
✅ Product images from backend API
✅ Responsive design
✅ Admin dashboard overview
✅ Admin product management
✅ React Router for client-side navigation
✅ API client integration

## Next Steps

To run the project:

1. Ensure the backend is running and `VITE_API_BASE_URL` is configured
2. Navigate to the frontend-react folder
3. Run `npm run dev`
4. Open the app in your browser

For admin panel, navigate to `/admin`
