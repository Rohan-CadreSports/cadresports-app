# Testing Mandate

**This app will be thoroughly tested by professional testing agencies before going live.**

Every feature, every edge case, every role-based flow must be built with the assumption that testers will:

- Try every invalid input combination
- Test all role-based access boundaries (player accessing admin routes, operator accessing other operator's leagues, etc.)
- Attempt duplicate registrations, double submissions, race conditions
- Test with 0 data, 1 record, and thousands of records
- Verify every button, form, redirect, and error message works correctly
- Test on slow networks, mobile devices, and different browsers
- Verify data integrity after every create/update/delete operation
- Check that deleted/rejected users cannot access resources they shouldn't
- Verify proper error messages are shown (never raw errors or stack traces)
- Test auth flows: expired sessions, invalid tokens, concurrent logins
- Verify all status transitions are valid (no skipping from DRAFT to COMPLETED)
- Check leaderboard accuracy after score entries, edits, and reversals

**Read this file before every build. No shortcuts. No "it works on my machine." Build it like someone is trying to break it — because they will.**
