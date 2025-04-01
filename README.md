# BundlrPro - Shopify Bundle Management App

A Next.js application for managing product bundles in Shopify stores.

## Features

- Create and manage product bundles
- Set up bundle discounts and rules
- Customize bundle display on product pages
- Manage bundle inventory
- Track bundle sales and analytics

## Prerequisites

- Node.js 18.x or later
- MongoDB
- Shopify Partner account
- Shopify store with admin access

## Environment Variables

1. Copy the `.env.example` file to `.env.local`:
   ```bash
   cp .env.example .env.local
   ```

2. Update the following environment variables in `.env.local`:
   - `MONGODB_URI`: Your MongoDB connection string
   - `SHOPIFY_API_KEY`: Your Shopify app API key
   - `SHOPIFY_API_SECRET`: Your Shopify app API secret
   - `SHOPIFY_APP_HOST_NAME`: Your app's host name
   - `NEXT_PUBLIC_SHOPIFY_API_KEY`: Your Shopify app API key (public)
   - `NEXT_PUBLIC_SHOPIFY_APP_URL`: Your app's public URL

## Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/lightamadi/BundlrPro.git
   cd BundlrPro
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables as described above

4. Run the development server:
   ```bash
   npm run dev
   ```

## Development

- `npm run dev`: Start the development server
- `npm run build`: Build the production application
- `npm start`: Start the production server
- `npm run lint`: Run ESLint
- `npm run type-check`: Run TypeScript type checking

## Project Structure

```
src/
├── components/     # React components
├── config/        # Configuration files
├── lib/           # Utility functions and shared code
├── models/        # MongoDB models
├── pages/         # Next.js pages and API routes
└── styles/        # Global styles
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details. 