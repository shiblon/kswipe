chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.set({enable: false});
  chrome.declarativeContent.onPageChanged.removeRules(undefined, () => {
    chrome.declarativeContent.onPageChanged.addRules([{
      conditions: [
        new chrome.declarativeContent.PageStateMatcher({
          pageUrl: {hostEquals: 'read.amazon.com'},
        }),
      ],
      actions: [
        new chrome.declarativeContent.ShowPageAction(),
      ],
    }]);
  });
});
