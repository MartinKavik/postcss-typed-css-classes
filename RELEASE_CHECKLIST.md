# Release Checklist

1. Update `CHANGELOG.md` (content + increment version).
1. Update version also in `package.json`.
1. `npm test`
1. Push.
1. Wait for the CI to go green.
1. Create GitHub release (create a new tag).
1. Pull.
1. `npm publish`
