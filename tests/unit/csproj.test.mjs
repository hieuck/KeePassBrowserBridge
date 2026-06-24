import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = (() => {
  try { return fileURLToPath(import.meta.url); }
  catch { return path.join(process.cwd(), 'tests', 'unit', 'csproj.test.mjs'); }
})();
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..', '..');

const csproj = fs.readFileSync(path.join(projectRoot, 'src', 'KeePassBrowserBridge.csproj'), 'utf8');

describe('KeePassBrowserBridge.csproj - build configuration', () => {
  it('should not cause NETSDK1022 duplicate Compile items', () => {
    // The SDK-style project auto-globs all *.cs files. If the .csproj also
    // explicitly lists <Compile Include="..."> for each file, dotnet build
    // fails with NETSDK1022: "Duplicate 'Compile' items were included."
    const hasExplicitCompileItems = csproj.includes('<Compile Include=');
    const hasEnableDefaultCompileItems = csproj.includes('EnableDefaultCompileItems');
    const hasGenerateAssemblyInfo = csproj.includes('GenerateAssemblyInfo');
    assert.ok(
      (!hasExplicitCompileItems || hasEnableDefaultCompileItems) && hasGenerateAssemblyInfo,
      'csproj must either remove explicit <Compile Include> (use SDK globbing) OR add ' +
      '<EnableDefaultCompileItems>false</EnableDefaultCompileItems>. ' +
      'Also must add <GenerateAssemblyInfo>false</GenerateAssemblyInfo> when using manual AssemblyInfo.cs.'
    );
  });

  it('should reference KeePassBrowserBridgeExt.cs', () => {
    assert.ok(
      csproj.includes('KeePassBrowserBridgeExt.cs') || !csproj.includes('<Compile Include='),
      'Missing main extension entry point or use SDK auto-globbing'
    );
  });

  it('should reference ProtocolModels.cs', () => {
    assert.ok(
      csproj.includes('ProtocolModels.cs') || !csproj.includes('<Compile Include='),
      'Missing ProtocolModels.cs or use SDK auto-globbing'
    );
  });

  it('should reference all Bridge service files', () => {
    const services = ['BridgeRequestHandler', 'BridgeSettings', 'BridgeAuthentication',
      'CredentialMutationService', 'CredentialQueryService', 'PairingService',
      'PasskeyService', 'TrustedClientStore', 'LoopbackBridgeServer'];
    for (const svc of services) {
      const found = csproj.includes(`${svc}.cs`) || !csproj.includes('<Compile Include=');
      assert.ok(found, `Missing ${svc}.cs in project or use SDK auto-globbing`);
    }
  });

  it('should reference AssemblyInfo.cs', () => {
    assert.ok(
      csproj.includes('AssemblyInfo.cs') || !csproj.includes('<Compile Include='),
      'Missing AssemblyInfo.cs in project or use SDK auto-globbing'
    );
  });
});
