import {defineConfig} from '@playwright/test';
export default defineConfig({
  testDir:'./tests/browser',
  timeout:45000,
  fullyParallel:false,
  workers:1,
  use:{baseURL:'http://127.0.0.1:5173',viewport:{width:1440,height:900},screenshot:'only-on-failure',trace:'retain-on-failure'},
  webServer:{command:'npm run dev -- --port 5173',url:'http://127.0.0.1:5173',reuseExistingServer:true},
});
