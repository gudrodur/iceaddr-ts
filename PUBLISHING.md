# Publishing to npm

**Held intentionally.** The GitHub repo is public, but the npm package is **not
published yet** — we want to give Sveinbjörn Þórðarson (author of `iceaddr`) a
heads-up first as a courtesy (see `docs/outreach-sveinbjorn.md`). Publish once
he's had a chance to respond.

## Checklist (run after the Sveinbjörn heads-up)

1. Confirm the name is free:
   ```sh
   npm view stadfangaskra
   ```
   If taken, fall back to a scoped name (`@gudrodur/stadfangaskra`) and update
   `name` in `package.json`.
2. Log in: `npm login`.
3. Verify the build + tests are green:
   ```sh
   pnpm run build && pnpm run check
   ```
4. Dry-run to inspect the tarball contents (should be `dist/` + `NOTICE.md` +
   `README.md` + `LICENSE` only):
   ```sh
   npm publish --dry-run
   ```
5. Publish:
   ```sh
   npm publish --access public
   ```
6. Tag the release:
   ```sh
   git tag v0.1.0 && git push --tags
   ```

## After publishing

- Point the `xj-greenfield` monorepo's `@xj/shared` at the published package (or
  keep the local copy) — tracked in `xj-greenfield` issue #491.
- Consider a short post / link from the `iceaddr` README (coordinate with
  Sveinbjörn / Jökull).
