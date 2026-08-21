@echo off
cd /d e:\jessy-luxury-website\jessy-luxury
npx playwright test "e2e/settings/authorization.spec.ts" --reporter=list 1> auth-spec-out.log 2>&1
echo __DONE_%ERRORLEVEL__>> auth-spec-out.log

