import { defineConfig } from 'vitepress'

export default defineConfig({
  title: 'STEP Clone API',
  description: 'Complete API documentation for the STEP Clone travel safety system',
  base: '/',
  themeConfig: {
    nav: [
      { text: 'Home', link: '/' },
      { text: 'API Reference', link: '/api/' },
      { text: 'Admin Dashboard', link: 'http://localhost:3001' },
      { text: 'GitHub', link: 'https://github.com/step-clone' }
    ],
    sidebar: [
      {
        text: 'Getting Started',
        items: [
          { text: 'Introduction', link: '/' },
          { text: 'Quick Start', link: '/quick-start' },
          { text: 'Authentication', link: '/authentication' },
          { text: 'Error Handling', link: '/error-handling' }
        ]
      },
      {
        text: 'API Reference',
        items: [
          { text: 'Overview', link: '/api/' },
          { text: 'Authentication', link: '/api/auth' },
          { text: 'Users', link: '/api/users' },
          { text: 'Countries', link: '/api/countries' },
          { text: 'Alerts', link: '/api/alerts' },
          { text: 'Travel Plans', link: '/api/travel-plans' },
          { text: 'Notifications', link: '/api/notifications' },
          { text: 'Health Check', link: '/api/health' }
        ]
      },
      {
        text: 'Integration',
        items: [
          { text: 'SDKs', link: '/sdks' },
          { text: 'Webhooks', link: '/webhooks' },
          { text: 'Rate Limiting', link: '/rate-limiting' }
        ]
      }
    ],
    socialLinks: [
      { icon: 'github', link: 'https://github.com/step-clone' }
    ],
    search: {
      provider: 'local'
    },
    footer: {
      message: 'STEP Clone API Documentation',
      copyright: 'Copyright © 2024'
    }
  },
  markdown: {
    theme: {
      light: 'github-light',
      dark: 'github-dark'
    },
    lineNumbers: true
  }
})