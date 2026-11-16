# Contributing

## Propose a change

Search [existing issues](https://github.com/d-roak/coven-of-wits/issues) before opening one. For a bug, include reproduction steps, expected and actual behavior, browser version and a screenshot when useful. The app’s Send feedback button can attach a screenshot and debug details; review them before sending.

Discuss major features or rule changes in an issue before starting. Keep fixes and pull requests focused on one problem. Treat other contributors with respect and keep discussion about the work.

## Set up locally

Install Node.js compatible with the versions in `package.json` and pnpm, then run:

```sh
pnpm install --frozen-lockfile
pnpm dev
```

Vite serves the client on port 5173 and proxies `/ws` and `/api` to the server on port 8787. Export any server environment variables before starting; see `.env.example` and the README. Solo puzzles and bot games do not need GitHub credentials.

## Write the change

- Use TypeScript with strict types. Reject invalid input at network and game-rule boundaries.
- Use pnpm, Vitest and Prettier. Formatting uses tabs, no semicolons and a 120-character print width.
- Use `@phosphor-icons/react` for interface icons and existing CSS tokens for colors. Keep game pieces consistent with the SVG art in `src/client/art/`.
- Keep game rules in pure engines. Boards and bots consume the player’s filtered view; hidden state must stay out of opponent views, history and public shares.
- Add English and Korean interface text. Update the game-text dictionaries when prompts, rules or logs change.
- Prefer visual pieces and staged decisions for compound actions. Check keyboard controls, mobile layout and reduced motion.
- Never commit credentials, `.env` files, personal reports or local feedback receipts. Avoid new dependencies when existing code or platform features suffice.

For a new game, follow Add a game in the README. Include rule sources and document house rules or adaptations. Keep contributed code and artwork original or provide compatible licensing and attribution.

## Verify the change

Run the project gate and formatting check:

```sh
pnpm check
pnpm exec prettier --check .
```

Add focused tests for changed behavior and invalid inputs. Test public contracts rather than private implementation details. Game changes should cover scoring, illegal moves and information visible to each player.

For multiplayer changes, start the server and run:

```sh
pnpm verify:online
# Or verify one game:
pnpm verify:online --game heavy-13
```

For interface changes, check the affected flow in the browser at mobile and desktop widths, in English and Korean. Check the component sheet at `/?kit` when changing shared pieces. Use local or simulated services for feedback tests; do not post test issues or screenshots to GitHub.

## Open a pull request

Create a branch in your fork and open a pull request against `main`. Explain the problem, the resulting behavior and the commands you ran. Add screenshots for interface changes and describe any limits or rule deviations. Update documentation that the change makes inaccurate.

Use a Conventional Commit subject such as `fix(game): reject an occupied tile`. Keep credentials and generated build output out of the diff.

Contributions are provided under the project’s [MIT license](LICENSE). You must have permission to contribute the code and assets you submit.
