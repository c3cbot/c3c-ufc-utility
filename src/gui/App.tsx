import GitHubIcon from '@mui/icons-material/GitHub';
import PublishIcon from "@mui/icons-material/Publish";
import GetAppIcon from '@mui/icons-material/GetApp';
import LogoutIcon from "@mui/icons-material/Logout"
import SaveAsIcon from "@mui/icons-material/SaveAs"
import AssignmentIcon from "@mui/icons-material/Assignment"
import { useCallback, useEffect, useRef, useState } from 'react';
import { prompt } from 'mdui/functions/prompt.js';

const fixIcon = {
    marginBottom: '5px',
    marginRight: '5px'
}

function App() {
    const [value, setValue] = useState('');
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        //#region mdui#338 workaround
        const injectedSheet = new CSSStyleSheet;
        injectedSheet.replaceSync(`.input { padding-right: 16px; } .container { padding-right: 0; }`);
        inputRef.current?.shadowRoot?.adoptedStyleSheets.push(injectedSheet);
        //#endregion

        const handleInputUpdate = () => {
            setValue(inputRef.current?.value || '');
            console.log(inputRef.current?.value);
        };

        inputRef.current?.addEventListener('keydown', handleInputUpdate);

        return () => {
            inputRef.current?.removeEventListener('keydown', handleInputUpdate);
        };
    }, []);

    const handleImportEncrypted = useCallback(() => {
        prompt({
            headline: "Import encrypted FBState",
            description: "Please enter password to decrypt your FBState",
            confirmText: "OK",
            cancelText: "Cancel",
            onConfirm: (value) => console.log("confirmed: " + value),
            onCancel: () => console.log("canceled"),
            textFieldOptions: {
                type: "password"
            }
        });
    }, []);

    const handleExport = useCallback((type: "json" | "base64", encryptKey?: string) => {
        chrome.cookies.getAll({
            domain: "facebook.com"
        }, async function (cookies) {
            const mappedCookies = cookies.map(v => ({
                key: v.name,
                value: v.value,
                domain: "facebook.com",
                path: v.path,
                hostOnly: v.hostOnly,
                creation: new Date().toISOString(),
                lastAccessed: new Date().toISOString()
            }));

            let state = JSON.stringify(mappedCookies, null, "\t");
            if (encryptKey) {
                const te = new TextEncoder();
                const keyRaw = new Uint8Array(await crypto.subtle.digest('SHA-256', te.encode(encryptKey)));
                const key = await crypto.subtle.importKey('raw', keyRaw, 'AES-CTR', false, ['encrypt']);

                const crypted = await crypto.subtle.encrypt({
                    name: "AES-CTR",
                    counter: new Uint32Array([0, 0, 0, 1]),
                    length: 128
                }, key, te.encode(state));

                state = Array.from(new Uint8Array(crypted)).map(v => v.toString(16).padStart(2, '0')).join('');
            }

            if (type === "json") {
                setValue(state);
                return;
            }

            if (type === "base64") {
                setValue(btoa(state));
                return;
            }
        });
    }, []);

    const handleExportEncrypted = useCallback(() => {
        prompt({
            headline: "Export encrypted FBState",
            description: "Please enter password to encrypt your FBState",
            confirmText: "OK",
            cancelText: "Cancel",
            onConfirm: (value) => handleExport("json", value),
            onCancel: () => { },
            textFieldOptions: {
                type: "password"
            }
        });
    }, [handleExport]);

    const handleExportJSON = useCallback(() => handleExport("json"), [handleExport]);
    const handleExportBase64 = useCallback(() => handleExport("base64"), [handleExport]);


    return (
        <>
            <div className="main">
                <mdui-card className="header" variant="filled" style={{
                    width: 'calc(100% - 2rem)',
                    margin: '1rem',
                    height: 'fit-content',
                    padding: '1rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                }}>
                    <div className="mdui-prose" style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                        <h3 style={{ marginBottom: 0 }}>C3C FBState</h3>
                        <small style={{ color: 'gray', marginTop: '10px' }}>v2.0</small>
                    </div>
                    <div>
                        <mdui-tooltip content="Fork me on GitHub">
                            <mdui-button-icon href='//github.com/c3cbot/c3c-fbstate' target='_blank'>
                                <GitHubIcon />
                            </mdui-button-icon>
                        </mdui-tooltip>
                    </div>
                </mdui-card>
                <div className="content">
                    <div className="action">
                        <mdui-dropdown>
                            <mdui-button variant='tonal' slot="trigger" style={{ flex: 1 }}>
                                Import
                                <mdui-icon slot="icon" style={fixIcon}>
                                    <PublishIcon />
                                </mdui-icon>
                            </mdui-button>
                            <mdui-menu>
                                <mdui-menu-item>JSON</mdui-menu-item>
                                <mdui-menu-item onClick={handleImportEncrypted}>Encrypted</mdui-menu-item>
                                <mdui-menu-item>Base64</mdui-menu-item>
                            </mdui-menu>
                        </mdui-dropdown>
                        <mdui-dropdown>
                            <mdui-button variant='tonal' slot="trigger" style={{ flex: 1 }}>
                                Export
                                <mdui-icon slot="icon" style={fixIcon}>
                                    <GetAppIcon />
                                </mdui-icon>
                            </mdui-button>
                            <mdui-menu >
                                <mdui-menu-item onClick={handleExportJSON}>JSON</mdui-menu-item>
                                <mdui-menu-item onClick={handleExportEncrypted}>Encrypted</mdui-menu-item>
                                <mdui-menu-item onClick={handleExportBase64}>Base64</mdui-menu-item>
                            </mdui-menu>
                        </mdui-dropdown>
                        <mdui-tooltip placement='top-end' content="Delete FBState (logout without triggering FBState invalidation)">
                            <mdui-button-icon variant="outlined">
                                <LogoutIcon />
                            </mdui-button-icon>
                        </mdui-tooltip>
                    </div>
                    <mdui-text-field
                        rows={10}
                        style={{
                            fontFamily: 'monospace, consolas'
                        }}
                        variant="outlined"
                        value={value}
                        ref={inputRef}
                    />
                    <div className="action">
                        <mdui-button variant='filled' slot="trigger" style={{ flex: 1 }}>
                            Copy to clipboard
                            <mdui-icon slot="icon" style={fixIcon}>
                                <AssignmentIcon />
                            </mdui-icon>
                        </mdui-button>
                        <mdui-button variant='filled' slot="trigger" style={{ flex: 1 }}>
                            Save to&nbsp;<code>fbstate.json</code>
                            <mdui-icon slot="icon" style={fixIcon}>
                                <SaveAsIcon />
                            </mdui-icon>
                        </mdui-button>
                    </div>
                </div>
            </div>
        </>
    )
}

export default App
