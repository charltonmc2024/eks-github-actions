# Erudition Solutions - Adaptive Testing Platform

[![Next.js](https://img.shields.io/badge/Next.js-15.3.0-black)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19.1.0-blue)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3.3-blue)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind%20CSS-4.1.11-38B2AC)](https://tailwindcss.com/)

## 🎓 About

Erudition Solutions is an innovative adaptive testing platform designed to revolutionize standardized test preparation for high school students. Our platform combines AI-powered adaptive mechanics, real-time data analytics, and teacher assistance to create personalized learning experiences that improve educational outcomes.

### Key Features

- **Adaptive Testing**: AI-powered dynamic difficulty adjustment based on student responses
- **Real-time Analytics**: Instant feedback and progress monitoring for teachers and students
- **TEKS/STAAR Alignment**: Purpose-built for Texas Essential Knowledge and Skills compliance
- **Teacher-Created Content**: Empowers educators to create customized assessments
- **Enhanced Security**: Question scrambling and unique test pathways to prevent cheating
- **Reduced Test Time**: Streamlined assessment process for more efficient learning
- **Integration Dashboard**: Seamless integration with existing school systems

## 🚀 Quick Start

### Prerequisites

Before running this project, make sure you have the following installed:

- **Node.js** (version 18.0.0 or higher)
- **npm** (comes with Node.js) or **yarn**
- **Git**

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-username/Erudition-Solution.git
   cd Erudition-Solution
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   yarn install
   ```

3. **Run the development server**
   ```bash
   npm run dev
   # or
   yarn dev
   ```

4. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000) to view the application.

## 📁 Project Structure

```
Erudition-Solution/
├── public/                     # Static assets
│   ├── images/                # Image files
│   └── favicon.ico           # Site favicon
├── src/
│   ├── app/                  # Next.js 13+ App Router
│   │   ├── about/           # About page
│   │   ├── advantages/      # Advantages page
│   │   ├── contact/         # Contact page
│   │   ├── faq/            # FAQ page
│   │   ├── mission-statement/ # Mission statement page
│   │   ├── our-team/       # Team page
│   │   ├── our-team-details/ # Team details page
│   │   ├── school-districts/ # School districts page
│   │   ├── signin/         # Sign in page
│   │   ├── signup/         # Sign up page
│   │   ├── layout.tsx      # Root layout
│   │   ├── page.tsx        # Home page
│   │   └── providers.tsx   # Context providers
│   ├── components/         # Reusable components
│   │   ├── About/         # About page components
│   │   ├── Advantages/    # Advantages components
│   │   ├── Brands/        # Brand components
│   │   ├── Common/        # Common/shared components
│   │   ├── Contact/       # Contact components
│   │   ├── Features/      # Feature components
│   │   ├── Footer/        # Footer component
│   │   ├── Header/        # Header component
│   │   ├── Hero/          # Hero section
│   │   ├── Our-teams/     # Team components
│   │   ├── Pricing/       # Pricing components
│   │   ├── Problem/       # Problem section
│   │   ├── ScrollToTop/   # Scroll to top component
│   │   ├── Solution/      # Solution section
│   │   ├── Testimonials/  # Testimonial components
│   │   └── Video/         # Video components
│   ├── styles/            # Global styles
│   │   └── index.css      # Main CSS file
│   └── types/             # TypeScript type definitions
├── .eslintrc.json         # ESLint configuration
├── .gitignore            # Git ignore rules
├── .prettierrc           # Prettier configuration
├── jsconfig.json         # JavaScript configuration
├── LICENSE               # Project license
├── next.config.js        # Next.js configuration
├── next-env.d.ts         # Next.js TypeScript definitions
├── package.json          # Dependencies and scripts
├── package-lock.json     # Locked dependencies
├── postcss.config.js     # PostCSS configuration
├── README.md             # This file
├── startup-pro.webp      # Startup image
└── tsconfig.json         # TypeScript configuration
```

## 🛠️ Dependencies

### Production Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| `@tailwindcss/postcss` | ^4.1.3 | Tailwind CSS PostCSS plugin |
| `eslint` | ^9.24.0 | Code linting |
| `eslint-config-next` | 15.1.6 | Next.js ESLint configuration |
| `framer-motion` | ^12.19.2 | Animation library |
| `next` | ^15.3.0 | React framework |
| `postcss` | ^8.5.3 | CSS processing |
| `react` | ^19.1.0 | React library |
| `react-countup` | ^6.5.3 | Animated counters |
| `react-dom` | ^19.1.0 | React DOM |
| `react-icons` | ^5.5.0 | Icon library |
| `tailwindcss` | ^4.1.11 | CSS framework |

### Development Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| `@types/node` | ^20.8.9 | Node.js TypeScript types |
| `@types/react` | 19.1.0 | React TypeScript types |
| `@types/react-dom` | 19.1.0 | React DOM TypeScript types |
| `autoprefixer` | ^10.4.17 | CSS autoprefixer |
| `prettier` | ^3.2.5 | Code formatting |
| `prettier-plugin-tailwindcss` | ^0.6.11 | Tailwind CSS Prettier plugin |
| `typescript` | ^5.3.3 | TypeScript compiler |

## 🎨 Available Scripts

```bash
# Development
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint

# Alternative with yarn
yarn dev             # Start development server
yarn build           # Build for production
yarn start           # Start production server
yarn lint            # Run ESLint
```

## 🌐 Deployment

### Deploying to Render

Render is a cloud platform that makes it easy to deploy web applications. Here's how to deploy this Next.js application to Render:

#### 1. Prepare Your Repository

Make sure your code is pushed to a Git repository (GitHub, GitLab, or Bitbucket).

#### 2. Create a Render Account

1. Go to [render.com](https://render.com)
2. Sign up for a free account
3. Connect your Git repository

#### 3. Create a New Web Service

1. **Click "New +"** in your Render dashboard
2. **Select "Web Service"**
3. **Connect your repository**:
   - Choose your Git provider
   - Select the repository containing your Next.js app
   - Click "Connect"

#### 4. Configure the Web Service

Fill in the following details:

- **Name**: `erudition-solutions` (or your preferred name)
- **Environment**: `Node`
- **Region**: Choose the closest to your users
- **Branch**: `main` (or your default branch)
- **Build Command**: `npm install && npm run build`
- **Start Command**: `npm start`

#### 5. Environment Variables (if needed)

If your application requires environment variables:

1. Go to the **Environment** tab in your service settings
2. Add any required environment variables:
   ```
   NODE_ENV=production
   # Add other variables as needed
   ```

#### 6. Deploy

1. Click **"Create Web Service"**
2. Render will automatically build and deploy your application
3. The deployment process typically takes 5-10 minutes
4. Once complete, you'll get a URL like: `https://your-app-name.onrender.com`

#### 7. Custom Domain (Optional)

1. Go to your service settings
2. Click on the **"Custom Domains"** tab
3. Add your domain and follow the DNS configuration instructions

### Alternative Deployment Options

#### Vercel (Recommended for Next.js)

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel
```

#### Netlify

1. Connect your repository to Netlify
2. Set build command: `npm run build`
3. Set publish directory: `.next`
4. Deploy

## 🔧 Configuration

### Next.js Configuration

The application uses a custom Next.js configuration in `next.config.js`:

```javascript
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "cdn.sanity.io",
        port: "",
      },
    ],
  },
};
```

### Tailwind CSS

The project uses Tailwind CSS v4 with PostCSS. Configuration is handled through:
- `postcss.config.js` - PostCSS configuration
- `src/styles/index.css` - Global styles

### TypeScript

TypeScript configuration is in `tsconfig.json` with path aliases:
- `@/*` maps to `./src/*`

## 🎯 Features Overview

### Core Functionality

- **Adaptive Testing Engine**: AI-powered question difficulty adjustment
- **Real-time Analytics**: Live performance tracking and insights
- **Teacher Dashboard**: Comprehensive tools for educators
- **Student Portal**: Personalized learning experience
- **Content Management**: Teacher-created assessment content
- **Security Features**: Anti-cheating measures and data protection

### Educational Focus

- **TEKS Alignment**: Texas Essential Knowledge and Skills compliance
- **STAAR Preparation**: State of Texas Assessments of Academic Readiness
- **Personalized Learning**: Individualized instruction paths
- **Progress Monitoring**: Detailed student performance tracking
- **Equity Focus**: Support for all ability levels

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request


For support and questions:

<!-- - **Email**: [Contact through the website](https://your-domain.com/contact)
- **Website**: [https://your-domain.com](https://your-domain.com)
- **Documentation**: [https://your-domain.com/docs](https://your-domain.com/docs) -->

## 🏢 About Erudition Solutions

Erudition Solutions, LLC is an educational technology company focused on transforming standardized test preparation through innovative adaptive testing solutions. Our mission is to empower students and educators with cutting-edge tools that personalize learning and improve educational outcomes.

### Leadership Team

- **Arnulfo Ninal ** - Chief Executive Officer / Chief Product Owner
- **Dr. Biddolph Billy Uzaka** - Chief Operating Officer / Co-Owner  
- **Carol Wu** - Director of Information Technology / Co-Owner
- **Yshmael Ammonraheem** - Chief Executive Officer / Chief Executive Officer / Chief Technical Officer / Co-Owner / Co-Owner

---

**Version**: 2.2.0  
**Last Updated**: December 2024
# eruditionsolutions
# eruditionsolutions_platform_v2
# eruditionsolutions_landing
