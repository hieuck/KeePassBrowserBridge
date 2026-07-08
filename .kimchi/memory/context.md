# Project Context

Keywords: project, purpose, tech-stack, default-branch, package-manager, build, test, repo-url

## Auto-Detection

When this file contains placeholders, the agent should detect the following values automatically on first run and update this file:

```bash
# Project name
project_name=$(basename "$(git rev-parse --show-toplevel)")

# Default branch
default_branch=$(git symbolic-ref refs/remotes/origin/HEAD --short 2>/dev/null | sed 's/origin\///')

# Remote URL
repo_url=$(git remote get-url origin 2>/dev/null)

# Tech stack detection (first match wins)
if [ -f package.json ]; then stack="Node.js"; pkg_manager="npm"; test_cmd="npm test"; build_cmd="npm run build"
elif [ -f pnpm-workspace.yaml ] || [ -f pnpm-lock.yaml ]; then stack="Node.js"; pkg_manager="pnpm"; test_cmd="pnpm test"; build_cmd="pnpm build"
elif [ -f yarn.lock ]; then stack="Node.js"; pkg_manager="yarn"; test_cmd="yarn test"; build_cmd="yarn build"
elif [ -f pyproject.toml ]; then stack="Python"; pkg_manager="poetry"; test_cmd="poetry run pytest"; build_cmd="poetry build"
elif [ -f requirements.txt ]; then stack="Python"; pkg_manager="pip"; test_cmd="pytest"; build_cmd="python setup.py build"
elif [ -f go.mod ]; then stack="Go"; pkg_manager="go modules"; test_cmd="go test ./..."; build_cmd="go build ./..."
elif [ -f Cargo.toml ]; then stack="Rust"; pkg_manager="cargo"; test_cmd="cargo test"; build_cmd="cargo build"
fi
```

## Basics

- **Project name**: {{auto-detect from repo root}}
- **Purpose**: <one sentence — update after first cycle>
- **Default branch**: {{auto-detect from origin/HEAD}}
- **Repository URL**: {{auto-detect from git remote origin}}

## Tech stack

- Language: <auto-detect>
- Framework: <fill in if known>
- Package manager: <auto-detect>
- Build tool: <auto-detect>
- Test framework: <auto-detect>

## Common commands

- Install dependencies: <auto-detect>
- Run tests: <auto-detect>
- Run lint: <auto-detect>
- Build: <auto-detect>
- Deploy staging: <fill in if configured>
- Deploy production: <fill in if configured>

## Notes

- Do not hardcode `main` or `master`. Always detect the default branch dynamically.
- If auto-detection fails, ask the user for the missing values on the first cycle.
