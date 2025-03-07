async function DuplicateTabs() {
	const tabs = await browser.tabs.query({ highlighted: true, currentWindow: true });
	tabs.sort((a, b) => b.index - a.index);
	
	for (const tab of tabs) {
		// We need to run the following  synchronously so that the new tabs can be correctly placed after the original tabs
		const newTab = await browser.tabs.duplicate(tab.id);
		// Pin/Unpin as required
		await browser.tabs.update(newTab.id, { pinned: tab.pinned });
		// Move the new tab next to the original tab
		await browser.tabs.move(newTab.id, { index: tab.index + 1 });
	}
}

function TogglePins() {
	browser.tabs.query({ highlighted: true, currentWindow: true }).then((tabs) => {
		// Unpin pinned tabs, in desc order to maintain the order after unpinning
		tabs.filter(tab => tab.pinned).sort((a, b) => b.index - a.index).forEach(tab => {
			browser.tabs.update(tab.id, { pinned: false });
		});
		// Pin Unpinned tabs, in asc order to main the order after pinning
		tabs.filter(tab => !tab.pinned).sort((a, b) => a.index - b.index).forEach(tab => {
			browser.tabs.update(tab.id, { pinned: true });
		});
	});
}

function MoveTabsLeft() {
	browser.tabs.query({ currentWindow: true }).then((tabs) => {
		const pinnedTabsCount = tabs.filter(tab => tab.pinned).length;
		
		// Filter by selected tabs
		tabs = tabs.filter(tab => tab.highlighted);
		
		// Sort selected tabs by asc index
		tabs.sort((a, b) => a.index - b.index);
		
		const consumedIndices = new Set();
		tabs.forEach(tab => {
			let idx = tab.index;
			if (idx === 0 || idx === pinnedTabsCount || consumedIndices.has(idx - 1)) {
				consumedIndices.add(idx);
				return;
			}
			idx -= 1;
			browser.tabs.move(tab.id, { index: idx });
			consumedIndices.add(idx);
		});
	});
}

function MoveTabsRight() {
	browser.tabs.query({ currentWindow: true }).then((tabs) => {
		const lastTabIndex = tabs.length - 1;
		const lastPinnedTabIndex = tabs.filter(tab => tab.pinned).length - 1;
		
		// Filter by selected tabs
		tabs = tabs.filter(tab => tab.highlighted);
		
		// Sort selected tabs by desc index
		tabs.sort((a, b) => b.index - a.index);
		
		const consumedIndices = new Set();
		tabs.forEach(tab => {
			let idx = tab.index;
			if (idx === lastTabIndex || idx === lastPinnedTabIndex || consumedIndices.has(idx + 1)) {
				consumedIndices.add(idx);
				return;
			}
			idx += 1;
			browser.tabs.move(tab.id, { index: idx });
			consumedIndices.add(idx);
		});
	});
}

function MoveTabsToStart() {
	// Query all tabs in the current window
	browser.tabs.query({ currentWindow: true }).then((tabs) => {
		const pinnedTabsCount = tabs.filter(tab => tab.pinned).length;
		
		// Filter by selected tabs
		tabs = tabs.filter(tab => tab.highlighted);
		
		// Sort selected tabs by asc index, and group by pinned and unpinned
		const pinnedTabs = tabs.filter(tab => tab.pinned).sort((a, b) => a.index - b.index);
		const unpinnedTabs = tabs.filter(tab => !tab.pinned).sort((a, b) => a.index - b.index);
		
		let idx = 0;
		pinnedTabs.forEach(tab => {
			browser.tabs.move(tab.id, { index: idx++ });
		});
		
		idx = pinnedTabsCount;
		unpinnedTabs.forEach(tab => {
			browser.tabs.move(tab.id, { index: idx++ });
		});
	});
}

function MoveTabsToEnd() {
	// Query all tabs in the current window
	browser.tabs.query({ currentWindow: true }).then((tabs) => {
		const totalTabsCount = tabs.length;
		const pinnedTabsCount = tabs.filter(tab => tab.pinned).length;
		
		// Filter by selected tabs
		tabs = tabs.filter(tab => tab.highlighted);
		
		// Sort selected tabs by desc index, and group by pinned and unpinned
		const pinnedTabs = tabs.filter(tab => tab.pinned).sort((a, b) => b.index - a.index);
		const unpinnedTabs = tabs.filter(tab => !tab.pinned).sort((a, b) => b.index - a.index);
		
		let idx = pinnedTabsCount - 1;
		pinnedTabs.forEach(tab => {
			browser.tabs.move(tab.id, { index: idx-- });
		});
		
		idx = totalTabsCount - 1;
		unpinnedTabs.forEach(tab => {
			browser.tabs.move(tab.id, { index: idx-- });
		});
	});
}


browser.commands.onCommand.addListener((command) => {
	if (command === "duplicate-tab") {
		DuplicateTabs();
	}
});

browser.commands.onCommand.addListener((command) => {
	if (command === "toggle-pin") {
		TogglePins();
	}
});

browser.commands.onCommand.addListener((command) => {
	if (command === "move-left") {
		MoveTabsLeft();
	}
});

browser.commands.onCommand.addListener((command) => {
	if (command === "move-right") {
		MoveTabsRight();
	}
});

browser.commands.onCommand.addListener((command) => {
	if (command === "move-start") {
		MoveTabsToStart();
	}
});

browser.commands.onCommand.addListener((command) => {
	if (command === "move-end") {
		MoveTabsToEnd();
	}
});
