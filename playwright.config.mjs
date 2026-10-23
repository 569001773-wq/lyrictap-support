import {defineConfig,devices} from 'playwright/test';
const live=process.env.LIVE_BASE_URL;
const mobileEngine=process.env.LOCAL_MOBILE==='1'?'chromium':'webkit';
export default defineConfig({
 testDir:'./tests/e2e',fullyParallel:true,workers:process.env.CI?2:2,retries:0,timeout:45000,
 reporter:[['list'],['html',{open:'never'}],['json',{outputFile:'test-results/results.json'}]],
 use:{baseURL:live||'http://127.0.0.1:4173',trace:'retain-on-failure',screenshot:'only-on-failure',acceptDownloads:true},
 projects:[{name:'desktop-chromium',use:{...devices['Desktop Chrome']}},{name:'iPhone-'+mobileEngine,use:{...devices['iPhone 13 Pro'],defaultBrowserType:mobileEngine}},{name:'iPad-'+mobileEngine,use:{...devices['iPad Pro 12.9'],defaultBrowserType:mobileEngine}}],
 webServer:live?undefined:{command:'node site-source/scripts/serve-static.mjs',url:'http://127.0.0.1:4173/lyrictap-support/',reuseExistingServer:!process.env.CI}
});
