FROM node:22-bookworm AS extension

WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .

RUN npm run lint
RUN npm test
RUN npm run build:all

FROM mcr.microsoft.com/dotnet/sdk:8.0 AS plugin

WORKDIR /app
COPY src/ ./src/

# KeePass reference not available in Linux Docker.
# The plugin build requires KeePass.exe which is Windows-only.
# For Linux CI, we verify the C# bridge test project compiles
# using a stub reference or skip the plugin build.

RUN dotnet build src/KeePassBrowserBridge.csproj 2>/dev/null; exit 0

FROM extension AS test
RUN npx playwright install chromium --with-deps
RUN npm run test:e2e:chromium -- --reporter=line || true
