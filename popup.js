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
  function importFunc(e, encrypted) {
    if (e.currentTarget.files[0]) {
      console.log(e.currentTarget.files[0]);
      if (e.currentTarget.files[0].type != "application/json") {
        alert("Invalid file given");
      }
      var fr = new FileReader();
      fr.readAsText(e.currentTarget.files[0], "UTF-8");
      fr.onload = function (evt) {
        try {
          let data = evt.target.result;

          if (encrypted) {
            // Asking for key
            let pwdKey = prompt("Please enter key to encrypt:");
            let keyHash = [...sha256(pwdKey || "").match(/.{2}/g)].map(e => parseInt(e, 16));

            let bytes = aesjs.utils.hex.toBytes(data);
            let aesCtr = new aesjs.ModeOfOperation.ctr(keyHash);
            let decryptedData = aesCtr.decrypt(bytes);

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
            alert("Invalid JSON file (not a FBState JSON file).");
          }
        } catch (_) {
          alert("Failed to load JSON file (malformed?)");
        }
      }
    }
  }
  document.getElementById("import").onchange = (e) => importFunc(e, false);
  document.getElementById("importenc").onchange = (e) => importFunc(e, true);

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
      const btnDownload = document.getElementById("dlFbstate");
      yourFbstate.value = fbstate;

      btnCopy.onclick = function () {
        yourFbstate.select();
        document.execCommand("copy");
        window.alert('Success! The fbstate was copied to your clipboard');
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
        a.remove();
      };
    });
  }
  document.getElementById("export").onclick = () => exportFunc(false);
  document.getElementById("exportenc").onclick = () => exportFunc(true);
  exportFunc(false);
};