# BundlrPro - Shopify Product Bundle App

BundlrPro is a powerful Shopify app that allows merchants to create and manage product bundles with dynamic pricing rules. Built with Next.js, Shopify Polaris, and MongoDB.

## Features

- Create and manage product bundles
- Multiple discount types:
  - Percentage-based discounts
  - Fixed-price bundles
  - Buy X, Get Y Free
  - Tiered discounts
- Dynamic pricing rules
- Real-time bundle price calculations
- Customizable bundle display options
- Bundle analytics and performance tracking

## Tech Stack

- Frontend: React.js with Next.js
- UI Framework: Shopify Polaris
- Backend: Node.js with Express
- Database: MongoDB
- Authentication: Shopify OAuth
- API Integration: Shopify Admin API

## Prerequisites

- Node.js >= 18.0.0
- MongoDB
- Shopify Partner Account
- ngrok or similar tunnel for local development

## Getting Started

1. Clone the repository:
```bash
git clone https://github.com/yourusername/bundlr-pro.git
cd bundlr-pro
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env.local` file with your configuration:
```
MONGODB_URI=mongodb://localhost:27017/bundlr-pro
SHOPIFY_API_KEY=your_api_key_here
SHOPIFY_API_SECRET=your_api_secret_here
SHOPIFY_APP_URL=https://your-app-url.com
SHOPIFY_APP_SCOPES=read_products,write_products,read_orders,write_orders
HOST=your-app-url.com
NEXT_PUBLIC_SHOPIFY_API_KEY=your_api_key_here
```

4. Start the development server:
```bash
npm run dev
```

5. Start ngrok to create a tunnel:
```bash
ngrok http 3000
```

6. Update your Shopify App URL in the Shopify Partner dashboard with your ngrok URL.

## Development

### Project Structure

```
bundlr-pro/
├── src/
│   ├── components/     # React components
│   │   ├── api/      # API routes
│   │   └── index.tsx # Main dashboard
│   ├── models/       # MongoDB models
│   └── lib/          # Utility functions
├── public/           # Static assets
└── package.json
```

### API Endpoints

- `GET /api/bundles` - List all bundles
- `POST /api/bundles` - Create a new bundle
- `GET /api/bundles/:id` - Get bundle details
- `PUT /api/bundles/:id` - Update a bundle
- `DELETE /api/bundles/:id` - Delete a bundle

## Deployment

1. Set up a MongoDB database (e.g., MongoDB Atlas)
2. Deploy to your preferred hosting platform (e.g., Vercel, Heroku)
3. Update environment variables on your hosting platform
4. Update the Shopify App URL in your Shopify Partner dashboard

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For support, email support@bundlrpro.com or open an issue in the GitHub repository. 