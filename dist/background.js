chrome.commands.onCommand.addListener(e=>{e==="toggle-panel"&&chrome.tabs.query({active:!0,currentWindow:!0},a=>{chrome.tabs.sendMessage(a[0].id,{command:"toggle-panel"})})});
