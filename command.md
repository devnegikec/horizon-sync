## Run a single test on Headless Browser
-- npx playwright test --config=apps/platform-e2e/playwright.config.ts apps/platform-e2e/src/registration.spec.ts --project=chromium --reporter=line

## Run a single test on Headfull browser

-- npx playwright test --config=apps/platform-e2e/playwright.config.ts apps/platform-e2e/src/registration.spec.ts --project=chromium --reporter=line --headed

## run unit test

---
nx test inventory --testPathPattern=apps/inventory/src/test/app/components/items/
