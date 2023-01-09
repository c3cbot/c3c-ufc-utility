// Copyright 2022 BadAimWeeb. All rights reserved. MIT license.

var stringToBlob = function (str, mimetype) {
    var raw = str;
    var rawLength = raw.length;
    var uInt8Array = new Uint8Array(rawLength);

    for (var i = 0; i < rawLength; ++i) {
        uInt8Array[i] = raw.charCodeAt(i);
    }

    var bb = new Blob([uInt8Array.buffer], {
        type: mimetype
    });
    return bb;
};

window.onload = function () {
    function toastNotification(message) {
        var x = document.getElementById("snackbar");
				x.addEventListener("click", function() {
					x.className = x.className.replace("show", "");
				});
        x.innerHTML = message;
        x.className = "show";
        setTimeout(function () {
						x.className = x.className.replace("show", "");
        }, 3000);
    }

    function importFunc(e, encrypted) {
        if (e.currentTarget.files[0]) {
            if (e.currentTarget.files[0].type != "application/json") {
                toastNotification("Invalid file given");
            }
            var fr = new FileReader();
            fr.readAsText(e.currentTarget.files[0], "UTF-8");
            fr.onload = function (evt) {
                try {
                    let data = evt.target.result;

                    if (encrypted) {
                        // Asking for key
                        const pwdKey = prompt("Please enter key to encrypt:");
                        const keyHash = [...sha256(pwdKey || "").match(/.{2}/g)].map(e => parseInt(e, 16));

                        const bytes = aesjs.utils.hex.toBytes(data);
                        const aesCtr = new aesjs.ModeOfOperation.ctr(keyHash);
                        const decryptedData = aesCtr.decrypt(bytes);

                        data = aesjs.utils.utf8.fromBytes(decryptedData);
                    }

                    var j = JSON.parse(data);
                    if (Array.isArray(j)) {
                        chrome.cookies.getAll({
                            domain: "facebook.com"
                        }, async function (cookies) {
                            for (let i in cookies) {
                                await new Promise(resolve => {
                                    chrome.cookies.remove({
                                        url: `https://facebook.com${cookies[i].path}`,
                                        name: cookies[i].name
                                    }, resolve);
                                });
                            }

                            for (let i in j) {
                                if (j[i].domain == "facebook.com") {
                                    await new Promise(resolve => {
                                        chrome.cookies.set({
                                            url: `https://facebook.com${j[i].path}`,
                                            name: j[i].key,
                                            value: j[i].value,
                                            expirationDate: (Date.now() / 1000) + (84600 * 30),
                                            domain: ".facebook.com"
                                        }, resolve);
                                    });
                                }
                            }
                            chrome.tabs.query({
                                active: true
                            }, function (tabs) {
                                var {
                                    host
                                } = new URL(tabs[0].url);
                                if (host.split(".")[1] == "facebook") {
                                    chrome.tabs.update(tabs[0].id, {
                                        url: tabs[0].url
                                    });
                                }
                            });
                        });
                    } else {
                        toastNotification("Invalid JSON file (not a FBState JSON file).");
                    }
                } catch (_) {
                    toastNotification("Failed to load JSON file (malformed?)");
                }
            }
        }
    }

    function exportFunc(encrypted) {
        chrome.cookies.getAll({
            domain: "facebook.com"
        }, function (cookies) {
            var cok = cookies.map(v => ({
                key: v.name,
                value: v.value,
                domain: "facebook.com",
                path: v.path,
                hostOnly: v.hostOnly,
                creation: new Date().toISOString(),
                lastAccessed: new Date().toISOString()
            }));
            var fbstate = JSON.stringify(cok, null, 4);

            if (encrypted) {
                // Asking for key
                let pwdKey = prompt("Please enter key to encrypt:");
                let keyHash = [...sha256(pwdKey || "").match(/.{2}/g)].map(e => parseInt(e, 16));

                let bytes = aesjs.utils.utf8.toBytes(fbstate);
                let aesCtr = new aesjs.ModeOfOperation.ctr(keyHash);
                let encryptedData = aesCtr.encrypt(bytes);
                fbstate = aesjs.utils.hex.fromBytes(encryptedData);
            }
            const yourFbstate = document.getElementById("yourFbstate");
            const btnCopy = document.getElementById("btnCopy");
            const btnDownload = document.getElementById("btnDownload");
            yourFbstate.value = fbstate;

            btnCopy.onclick = function () {
                yourFbstate.select();
                document.execCommand("copy");
                toastNotification('Success! The fbstate was copied to your clipboard');
            };

            btnDownload.onclick = function () {
                var blob = stringToBlob(fbstate, "application/json");
                var url = window.webkitURL || window.URL || window.mozURL || window.msURL;
                var a = document.createElement('a');
                a.download = 'fbstate.json';
                a.href = url.createObjectURL(blob);
                a.textContent = '';
                a.dataset.downloadurl = ['json', a.download, a.href].join(':');
                a.click();
								toastNotification('Success! The fbstate was downloaded ' + a.download);
                a.remove();
            };
        });
    }

    function logout() {
        const result = confirm("Are you sure you want to logout?");
        if (result) {
            chrome.cookies.getAll({
                domain: "facebook.com"
            }, function (cookies) {
                // * it helps you not to lose the list of recently logged in accounts
                cookies = cookies.filter(c => c.name != "sb" && c.name != "dbln");

                for (let i in cookies) {
                    chrome.cookies.remove({
                        url: `https://facebook.com${cookies[i].path}`,
                        name: cookies[i].name
                    });
                }
                chrome.tabs.query({
                    active: true
                }, function (tabs) {
                    const {
                        host
                    } = new URL(tabs[0].url);
                    if (host.split(".")[1] == "facebook") {
                        chrome.tabs.update(tabs[0].id, {
                            url: tabs[0].url
                        });
                    }
                });
            });
        }
    }

    document.getElementById("import").onchange = (e) => importFunc(e, false);
    document.getElementById("importenc").onchange = (e) => importFunc(e, true);

    document.getElementById("export").onclick = () => exportFunc(false);
    document.getElementById("exportenc").onclick = () => exportFunc(true);
    document.getElementById("logout").onclick = () => logout();
    exportFunc(false);
};