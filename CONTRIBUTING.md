# Contributing to Alternative Explorer

Thanks for helping improve Alternative Explorer. Bug reports, focused feature proposals, documentation fixes, and pull requests are welcome.

## Before opening an issue

- Check that the issue still occurs in the latest release.
- Search existing issues for the same behavior.
- For bugs, include your Obsidian version, plugin version, platform, reproduction steps, expected behavior, and actual behavior.
- Do not attach private vault content. Replace note names and paths with a minimal synthetic example.

## Development

1. Fork and clone the repository.
2. Install dependencies with `npm install`.
3. Run `npm run dev` while developing.
4. Run `npm run lint`, `npm test`, and `npm run build` before submitting a pull request.

Keep changes narrowly scoped. Update `README.md` when a change affects user-visible behavior, settings, or compatibility. Do not edit the generated `main.js` file by hand.

Agent instructions for work from this repository are in [AGENTS-cloud.md](AGENTS-cloud.md).

## Demo Vault and screenshot

`Demo Vault/` is a local-only, ignored Obsidian vault used for smoke testing and the Community Plugins listing screenshot. Never force-add it or commit its notes, settings, workspace state, plugin data, or copied release artifacts.

To refresh the screenshot, build the plugin, copy `main.js`, `manifest.json`, and `styles.css` to `Demo Vault/.obsidian/plugins/alternative-explorer/`, open the existing prepared workspace in Obsidian's default dark theme, and capture the application window without personal data, notifications, development tools, or unrelated plugins. Store the reviewed image at `assets/alternative-explorer-demo.png`.

## Pull requests

Describe the problem, the chosen fix, and how you verified it. Keep unrelated formatting or refactoring out of the same pull request so the behavioral change remains easy to review.
