import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';

export default defineConfig({
  site: 'https://darkziah.github.io',
  base: '/better-auth-paymongo',
  integrations: [
    starlight({
      title: 'better-auth-paymongo',
      description: 'PayMongo payment plugin for Better-Auth with feature-based billing',
      social: {
        github: 'https://github.com/darkziah/better-auth-paymongo',
      },
      sidebar: [
        { label: 'Introduction', link: '/' },
        {
          label: 'Getting Started',
          items: [
            { label: 'Installation', link: '/getting-started/' },
            { label: 'Quick Start', link: '/getting-started/quick-start/' },
            { label: 'Configuration', link: '/getting-started/configuration/' },
          ],
        },
        {
          label: 'API Reference',
          items: [
            { label: 'Server Plugin', link: '/api/server/' },
            { label: 'Client SDK', link: '/api/client/' },
            { label: 'React Hooks', link: '/api/react/' },
          ],
        },
        {
          label: 'Guides',
          items: [
            { label: 'Organization Billing', link: '/guides/organization-billing/' },
            { label: 'Examples', link: '/guides/examples/' },
          ],
        },
        {
          label: 'Concepts',
          items: [
            { label: 'The Autumn Pattern', link: '/concepts/autumn-pattern/' },
            { label: 'Feature Types', link: '/concepts/feature-types/' },
          ],
        },
      ],
    }),
  ],
});
