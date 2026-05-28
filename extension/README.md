# KeePass Browser Bridge Extension

This is the Chrome MV3 companion extension for the KeePassBrowserBridge plugin.

## Developer install

1. Open `chrome://extensions`.
2. Enable Developer mode.
3. Choose Load unpacked.
4. Select this `extension` folder.
5. Open KeePass and enable the KeePassBrowserBridge plugin.
6. Open the extension popup, click Pair, then enter the pairing code shown by KeePass.
7. Optional: enable Auto-fill. The extension only fills automatically when exactly one KeePass entry matches the loaded page URL.

The default bridge endpoint is `http://127.0.0.1:19455/bridge`.

On login pages, the extension injects a small `K` button near detected username/password fields. Clicking it queries KeePass for the current page URL and fills immediately when exactly one login matches.
