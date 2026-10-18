module.exports = {
  apps: [
    {
      name: 'gestor-archivos-movil',
      script: 'server/index.js',
      cwd: '/home/ubuntu/dashboard-gestion-mobile',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '500M',
      env: {
        NODE_ENV: 'production',
        HOST: '127.0.0.1',
        PORT: 3899,
      },
      env_file: '.env',
    },
  ],
};
