## Project Setup

### Pre-requisites

[Node.js 22.15+](https://nodejs.org/en/download/current)

[pnpm](https://pnpm.io/installation)

### Install

```bash
$ pnpm install
```

### Development

```bash
$ pnpm run dev
```

### Build

```bash
$ pnpm run typecheck
$ pnpm run build
$ pnpm build:win
```

### Development Notes

- If Electron fails to install, ensure that your installation process is using the `.npmrc` file configured for the mirror. In my experience, the main npm distribution of Electron often fails, and using the mirror resolves the issue.
- - If it still fails try to run: `node node_modules/electron/install.js`
- - If that also fails, delete everything inside `node_modules/electron/`, then download [Electron@38.7.0](https://github.com/electron/electron/releases/tag/v38.7.0). Extract the source code into `node_modules/electron/`, and run: `node node_modules/electron/install.js`
- When adding new packages, install them as `devDependencies` using: `pnpm i -D <package_name>`. Only add a package as a regular dependency if it is explicitly required at build runtime.
