import GitHubIcon from '@mui/icons-material/GitHub';
import PublishIcon from "@mui/icons-material/Publish";
import GetAppIcon from '@mui/icons-material/GetApp';
import LogoutIcon from "@mui/icons-material/Logout"
import SaveAsIcon from "@mui/icons-material/SaveAs"
import AssignmentIcon from "@mui/icons-material/Assignment"
import { useCallback } from 'react';
import { prompt } from 'mdui/functions/prompt.js';

const fixIcon = {
    marginBottom: '5px',
    marginRight: '5px'
}

function App() {

    const handleExportEncrypted = useCallback(() => {
        prompt({
            headline: "Export encrypted FBState",
            description: "Please enter password to encrypt your FBState",
            confirmText: "OK",
            cancelText: "Cancel",
            onConfirm: (value) => console.log("confirmed: " + value),
            onCancel: () => console.log("canceled"),
        });
    }, []);

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
                                <mdui-menu-item>Encrypted</mdui-menu-item>
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
                                <mdui-menu-item>JSON</mdui-menu-item>
                                <mdui-menu-item onClick={handleExportEncrypted}>Encrypted</mdui-menu-item>
                                <mdui-menu-item>Base64</mdui-menu-item>
                            </mdui-menu>
                        </mdui-dropdown>
                        <mdui-tooltip content="Logout FBState">
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
                        readonly
                        variant="outlined"
                        value='dkljaskldjaskldjaskljdaklsdjklasjdklasjdklasjdklasjdklasjdkalsjdaskldj'
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
