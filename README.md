# KeePass Browser Bridge

Clean-room KeePass 2.x browser integration inspired by KeePassRPC and KeePassXC-Browser.

## Current Status

MVP development has started. The first slice is a KeePass plugin skeleton with the Tools menu and persistent enable setting.

## Local Build

From this repository:

```powershell
& "C:\Windows\Microsoft.NET\Framework64\v4.0.30319\csc.exe" /nologo /target:library /optimize+ /out:"..\KeePassBrowserBridge.dll" /reference:"..\..\KeePass.exe" /reference:"C:\Windows\Microsoft.NET\Framework64\v4.0.30319\System.dll" /reference:"C:\Windows\Microsoft.NET\Framework64\v4.0.30319\System.Drawing.dll" /reference:"C:\Windows\Microsoft.NET\Framework64\v4.0.30319\System.Windows.Forms.dll" ".\src\Bridge\BridgeSettings.cs" ".\src\KeePassBrowserBridgeExt.cs" ".\src\Properties\AssemblyInfo.cs"
```
