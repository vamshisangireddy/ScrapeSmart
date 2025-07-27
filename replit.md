# WebScraper Pro Chrome Extension

## Overview

This project is a modern Chrome extension for intelligent web scraping with automatic field detection and multi-format export capabilities. The architecture follows a full-stack approach with a React-based frontend for the extension popup, an Express.js backend for server-side operations, and a Chrome extension content script system for DOM interaction.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

The application uses a hybrid architecture combining:

1. **Chrome Extension Components**: Manifest V3 extension with background service worker, content scripts, and popup interface
2. **React Frontend**: Modern React application with TypeScript, using shadcn/ui components and Tailwind CSS
3. **Express.js Backend**: Lightweight server for API endpoints and data processing
4. **Database Layer**: Drizzle ORM configured for PostgreSQL with Neon Database integration
5. **Build System**: Vite for frontend bundling with ESBuild for server compilation

## Key Components

### Chrome Extension Architecture
- **Manifest V3**: Modern extension manifest with proper permissions for web scraping
- **Background Service Worker**: Handles cross-tab communication and data export functionality
- **Content Scripts**: Injected into web pages for DOM analysis and field detection
- **Popup Interface**: React-based UI served from the extension's popup.html

### Frontend Components
- **Field Detection System**: Automatic identification of scrapable data fields using intelligent selectors
- **Export System**: Multi-format export (CSV, JSON, XML, Excel) with customizable options
- **Template Management**: Save and load scraping configurations for reuse
- **Progress Tracking**: Real-time scraping progress with cancellation support

### Backend Infrastructure
- **Express Server**: RESTful API endpoints for data processing
- **Memory Storage**: In-memory data storage with interface for future database integration
- **Development Setup**: Vite integration for hot reloading in development

### Data Models
- **Detected Fields**: Schema for auto-detected scrapable elements
- **Scraping Templates**: Reusable configurations for specific websites
- **Export Options**: Flexible export configurations with format-specific settings

## Data Flow

1. **Field Detection**: Content script analyzes DOM structure and identifies potential data fields
2. **User Selection**: Popup interface allows users to select desired fields and configure export options
3. **Data Scraping**: Content script extracts data based on user selections
4. **Data Processing**: Background script processes and formats data according to export settings
5. **Export Generation**: Final data is formatted and downloaded in the selected format

## External Dependencies

### Core Technologies
- **React 18**: Frontend framework with hooks and modern patterns
- **TypeScript**: Type-safe development across all layers
- **Tailwind CSS**: Utility-first styling with custom design tokens
- **shadcn/ui**: Modern UI component library with Radix UI primitives

### Database & ORM
- **Drizzle ORM**: Type-safe database operations with PostgreSQL support
- **Neon Database**: Serverless PostgreSQL for cloud deployment
- **Zod**: Runtime type validation for data schemas

### Development Tools
- **Vite**: Fast build tool with HMR support
- **ESBuild**: Fast bundling for server-side code
- **TanStack Query**: Data fetching and caching for React

### Chrome Extension APIs
- **chrome.tabs**: Tab management and communication
- **chrome.scripting**: Dynamic content script injection
- **chrome.storage**: Persistent storage for extension data
- **chrome.downloads**: File download functionality

## Deployment Strategy

### Development Environment
- **Local Development**: Vite dev server with Chrome extension loading
- **Hot Reloading**: Automatic refresh for both frontend and extension components
- **Type Checking**: Continuous TypeScript validation

### Production Build
- **Frontend Build**: Vite builds React app to `dist/public`
- **Server Build**: ESBuild compiles Express server to `dist/index.js`
- **Extension Packaging**: All extension files bundled for Chrome Web Store

### Database Setup
- **Schema Management**: Drizzle migrations in `migrations/` directory
- **Connection**: Environment-based DATABASE_URL configuration
- **Development**: Can work with in-memory storage initially, with easy PostgreSQL integration

The architecture is designed for scalability and maintainability, with clear separation between extension logic, UI components, and server-side operations. The modular design allows for easy feature additions and modifications while maintaining type safety throughout the application.