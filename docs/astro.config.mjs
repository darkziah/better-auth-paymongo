import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';

export default defineConfig({
  integrations: [
    starlight({
      title: 'better-auth-paymongo',
      description: 'PayMongo payment plugin for Better-Auth with feature-based billing',
      social: {
        github: 'https://github.com/darkziah/better-auth-paymongo',
      },
      sidebar: [
        { label: 'Introduction', link: '/' },
      ],
    }),
  ],
});
