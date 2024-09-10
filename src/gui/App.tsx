import GitHubIcon from '@mui/icons-material/GitHub';
import PublishIcon from "@mui/icons-material/Publish";
import GetAppIcon from '@mui/icons-material/GetApp';
import LogoutIcon from "@mui/icons-material/Logout"
import SaveAsIcon from "@mui/icons-material/SaveAs"
import AssignmentIcon from "@mui/icons-material/Assignment"
import ContentPasteIcon from '@mui/icons-material/ContentPaste';
import { useCallback, useState } from 'react';
import { prompt } from 'mdui/functions/prompt.js';
import { alert } from 'mdui/functions/alert.js';
import { confirm } from 'mdui/functions/confirm.js';
import ClearIcon from "@mui/icons-material/Clear"

const fixIcon = {
    marginBottom: '5px',
    marginRight: '5px'
}

function App() {
    const [lastExportedType, setLastExportedType] = useState<"json" | "base64" | "encrypted">("json");
    const [value, setValue] = useState('');

    //#region Handle import
    const handleImport = useCallback(async () => {
        if (!value) {
            alert({
                headline: "Error",
                description: "Please input UFC data first.",
            });
            return;
        }

        let parsedUFC: {
            key: string,
            value: string,
            path: string,
            domain: string
        }[];

        // Try JSON first
        try {
            parsedUFC = JSON.parse(value);
        } catch {
            // Try base64
            try {
                parsedUFC = JSON.parse(atob(value));
            } catch {
                // Test if data is hex (sign of encrypted data)
                if (/^[0-9a-fA-F]+$/.test(value) && !(value.length % 2)) {
                    let k = await new Promise<string>((resolve, reject) => {
                        prompt({
                            headline: "Import encrypted UFC data",
                            description: "Please enter password to decrypt your UFC data",
                            confirmText: "OK",
                            cancelText: "Cancel",
                            onConfirm: (value) => resolve(value),
                            onCancel: () => reject("User cancelled"),
                            closeOnEsc: true,
                            textFieldOptions: {
                                type: "password",
                                autofocus: true                                
                            }
                        });
                    });

                    const te = new TextEncoder();
                    const keyRaw = new Uint8Array(await crypto.subtle.digest('SHA-256', te.encode(k)));
                    const key = await crypto.subtle.importKey('raw', keyRaw, 'AES-CTR', false, ['decrypt']);
                    const e = Uint8Array.from((value.match(/.{2}/g) ?? []).map(v => parseInt(v, 16)));

                    const decrypted = await crypto.subtle.decrypt({
                        name: "AES-CTR",
                        counter: new Uint8Array([
                            0, 0, 0, 0,
                            0, 0, 0, 0,
                            0, 0, 0, 0,
                            0, 0, 0, 1
                        ]),
                        length: 128
                    }, key, e);

                    try {
                        parsedUFC = JSON.parse(new TextDecoder().decode(decrypted));
                    } catch {
                        alert({
                            headline: "Error",
                            description: "Invalid password.",
                        });
                        return;
                    }
                } else {
                    alert({
                        headline: "Error",
                        description: "Invalid UFC data input.",
                    });
                    return;
                }
            }
        }

        if (!parsedUFC || !Array.isArray(parsedUFC)) {
            alert({
                headline: "Error",
                description: "Invalid UFC data input.",
            });
            return;
        }

        const cookies = await chrome.cookies.getAll({
            domain: "facebook.com"
        });

        // Clean all existing FB cookies
        for (let i in cookies) {
            await chrome.cookies.remove({
                url: `https://facebook.com${cookies[i].path}`,
                name: cookies[i].name
            });
        }

        // Set new cookies
        for (let cookie of parsedUFC) {
            if (cookie.domain.endsWith("facebook.com")) {
                await chrome.cookies.set({
                    url: "https://facebook.com" + cookie.path,
                    name: cookie.key,
                    value: cookie.value,
                    expirationDate: (Date.now() / 1000) + (84600 * 365),
                    domain: ".facebook.com"
                });
            }
        }

        // Refresh all Facebook tabs
        const tabs = await chrome.tabs.query({});

        for (let tab of tabs) {
            if (!tab.url || tab.discarded) continue;

            let url = new URL(tab.url);
            if (url.hostname.endsWith("facebook.com")) {
                chrome.tabs.update(tab.id!, {
                    url: tab.url
                });
            }
        }
    }, [value]);
    //#endregion

    //#region Handle export
    const handleExport = useCallback(async (type: "json" | "base64", encryptKey?: string) => {
        const cookies = await chrome.cookies.getAll({
            domain: "facebook.com"
        });

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
                counter: new Uint8Array([
                    0, 0, 0, 0,
                    0, 0, 0, 0,
                    0, 0, 0, 0,
                    0, 0, 0, 1
                ]),
                length: 128
            }, key, te.encode(state));

            state = Array.from(new Uint8Array(crypted)).map(v => v.toString(16).padStart(2, '0')).join('');
        }

        if (type === "json") {
            setValue(state);
            setLastExportedType(encryptKey ? "encrypted" : "json");
            return;
        }

        if (type === "base64") {
            setValue(btoa(state));
            setLastExportedType("base64");
            return;
        }
    }, []);

    const handleExportEncrypted = useCallback(() => {
        prompt({
            headline: "Export encrypted UFC data",
            description: "Please enter password to encrypt your UFC data",
            confirmText: "OK",
            cancelText: "Cancel",
            onConfirm: (value) => handleExport("json", value),
            closeOnEsc: true,
            textFieldOptions: {
                type: "password",
                autofocus: true
            }
        });
    }, [handleExport]);

    const handleExportJSON = useCallback(() => handleExport("json"), [handleExport]);
    const handleExportBase64 = useCallback(() => handleExport("base64"), [handleExport]);
    //#endregion

    //#region Various buttons
    const handleClear = useCallback(() => {
        setValue('');
    }, []);

    const handlePasteData = useCallback(async () => {
        setValue(await navigator.clipboard.readText());
    }, []);

    const handleCopy = useCallback(() => {
        navigator.clipboard.writeText(value);
    }, [value]);

    const handleSave = useCallback(() => {
        const blob = new Blob([value], { type: lastExportedType === "json" ? 'application/json' : 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = lastExportedType === "json" ? 'ufc-facebook.json' :
            lastExportedType === "base64" ? 'ufc-facebook.b64' :
                'ufc-facebook.enc';
        a.click();
        URL.revokeObjectURL(url);
    }, [value, lastExportedType]);

    const deleteState = useCallback(async () => {
        confirm({
            headline: "Soft Logout",
            description: "Are you sure you want to delete local UFC data (soft logout)?",
            confirmText: "Yes",
            cancelText: "No",
            onConfirm: async () => {
                const cookies = await chrome.cookies.getAll({
                    domain: "facebook.com"
                });

                for (let cookie of cookies) {
                    // Keeping recently logged in list
                    if (cookie.name === "sb" || cookie.name === "dbln") continue;

                    await chrome.cookies.remove({
                        url: "https://facebook.com" + cookie.path,
                        name: cookie.name
                    });
                }

                // Refresh all Facebook tabs
                const tabs = await chrome.tabs.query({});

                for (let tab of tabs) {
                    if (!tab.url || tab.discarded) continue;

                    let url = new URL(tab.url);
                    if (url.hostname.endsWith("facebook.com")) {
                        chrome.tabs.update(tab.id!, {
                            url: tab.url
                        });
                    }
                }

                alert({
                    headline: "Success",
                    description: "Local UFC data deleted successfully.",
                });
            }
        })
    }, []);
    //#endregion


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
                        <h3 style={{ marginBottom: 0 }}>C3C UFC Utility</h3>
                        <small style={{ color: 'gray', marginTop: '10px' }}>v2.0.1</small>
                    </div>
                    <div>
                        <mdui-tooltip content="Fork me on GitHub" placement='bottom-end'>
                            <mdui-button-icon href='https://github.com/c3cbot/c3c-ufc-utility' target='_blank' rel="noreferrer">
                                <GitHubIcon />
                            </mdui-button-icon>
                        </mdui-tooltip>
                    </div>
                </mdui-card>
                <div className="content">
                    <div className="action">
                        <mdui-button onClick={handleImport} variant='tonal' slot="trigger" style={{ flex: 1 }}>
                            Import
                            <mdui-icon slot="icon" style={fixIcon}>
                                <PublishIcon />
                            </mdui-icon>
                        </mdui-button>
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
                        <mdui-tooltip variant="rich" onClick={deleteState} placement='top-end' content="Delete local UFC data (logout without UFC invalidation)">
                            <mdui-button-icon variant="outlined">
                                <LogoutIcon />
                            </mdui-button-icon>
                        </mdui-tooltip>
                    </div>
                    <textarea
                        className="mainInput"
                        value={value}
                        onChange={(e) => setValue(e.target.value)}
                    />
                    <div className="action">
                        <mdui-button onClick={handleCopy} variant='filled' slot="trigger" style={{ flex: 1 }}>
                            Copy to clipboard
                            <mdui-icon slot="icon" style={fixIcon}>
                                <AssignmentIcon />
                            </mdui-icon>
                        </mdui-button>
                        <mdui-button onClick={handleSave} variant='filled' slot="trigger" style={{ flex: 1 }}>
                            Save to file
                            <mdui-icon slot="icon" style={fixIcon}>
                                <SaveAsIcon />
                            </mdui-icon>
                        </mdui-button>
                        <mdui-tooltip variant="rich" placement='top-end' content="Paste from clipboard">
                            <mdui-button-icon onClick={handlePasteData} variant="outlined">
                                <ContentPasteIcon />
                            </mdui-button-icon>
                        </mdui-tooltip>
                        <mdui-tooltip variant="rich" placement='top-end' content="Clear">
                            <mdui-button-icon onClick={handleClear} variant="outlined">
                                <ClearIcon />
                            </mdui-button-icon>
                        </mdui-tooltip>
                    </div>
                </div>
            </div>
        </>
    )
}

export default App
