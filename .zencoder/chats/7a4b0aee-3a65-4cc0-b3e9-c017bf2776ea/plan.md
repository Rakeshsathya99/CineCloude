# Bug Fix Plan

This plan guides you through systematic bug resolution. Please update checkboxes as you complete each step.

## Phase 1: Investigation

### [x] Bug Reproduction

- ✅ Understood the issue: 500 error on `/api/booking/create` endpoint during Stripe payment checkout
- ✅ Frontend sends booking request but backend fails
- ✅ Error occurs in bookingController.js

### [x] Root Cause Analysis

- ✅ **Issue 1**: Incorrect Stripe import (`stripe` should be `Stripe`)
- ✅ **Issue 2**: Undefined `origin` variable (should use `FRONTEND_URL` env var)
- ✅ **Issue 3**: Typo in .env file `STRIPE_SCRET_KEY` (should be `STRIPE_SECRET_KEY`)
- ✅ **Issue 4**: Incorrect amount calculation for Stripe (`Math.floor(booking.amount) * 100` should be `Math.round(booking.amount * 100)`)

## Phase 2: Resolution

### [x] Fix Implementation

- ✅ Fixed Stripe import from `stripe` to `Stripe`
- ✅ Fixed Stripe instantiation from `new stripe()` to `new Stripe()`
- ✅ Fixed undefined `origin` by using `process.env.FRONTEND_URL` with fallback to `http://localhost:5173`
- ✅ Fixed .env typo: `STRIPE_SCRET_KEY` → `STRIPE_SECRET_KEY`
- ✅ Fixed amount conversion: `Math.floor(booking.amount) * 100` → `Math.round(booking.amount * 100)`
- ✅ Added `FRONTEND_URL=http://localhost:5173` to .env

### [x] Impact Assessment

- No breaking changes
- Fixes maintain backward compatibility
- All fixes are necessary for Stripe payment functionality to work

## Phase 3: Verification

### [ ] Testing & Verification

- Ready for testing: Try booking tickets again with the fixed code
- Verify Stripe session is created successfully
- Check that payment redirect works properly
- Confirm payment link is saved to database

### [ ] Documentation & Cleanup

- Bug fixes documented in this plan
- Code ready for use
- All environment variables properly configured

## Notes

- Update this plan as you discover more about the issue
- Check off completed items using [x]
- Add new steps if the bug requires additional investigation
