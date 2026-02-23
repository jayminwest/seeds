Analyze all changes since the last release and prepare a new version.

Steps:

1. Find the last release tag: `git describe --tags --abbrev=0 2>/dev/null || echo "none"`
2. If there's a previous tag, review changes: `git log <tag>..HEAD --oneline` and `git diff <tag>..HEAD`
3. Determine the version bump level. **Always use patch unless the user explicitly requests minor or major.**
4. Bump version in both `package.json` and `src/index.ts` using `bun run version:bump <level>`
5. Update `CHANGELOG.md` — move items from [Unreleased] to the new version section with today's date
6. Update `CLAUDE.md` if command counts or structure changed
7. Update `README.md` if CLI reference or stats changed
8. Present a summary of all changes made — do NOT commit or push
