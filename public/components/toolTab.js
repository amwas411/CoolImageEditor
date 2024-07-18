export default class ToolTab {
    menu;
    panel;
    menuClass = "cie-block";
    panelClass = "cie-block";
    menuId = "cie-tools-menu";
    panelId = "cie-tools-panel";
    defaultTabId = "";
    tabMapping = {};
    events = {};
    container;
    constructor(config) {
        let menu = document.createElement("div");
        menu.id = this.menuId;
        menu.classList.add(...this.menuClass.split(" "));
        let panel = document.createElement("div");
        panel.id = this.panelId;
        panel.classList.add(...this.panelClass.split(" "));
        this.container = document.createElement("div");
        this.menu = menu;
        this.panel = panel;
        this.events = config?.events || this.events;
        this.container.append(menu, panel);
    }
    reset() {
        this.activateTab(this.defaultTabId);
    }
    appendTab(button, panel, tabId) {
        button.addEventListener('click', (e) => this.onClick(e, tabId));
        let buttonWrap = document.createElement("div");
        buttonWrap.append(button);
        this.menu.append(buttonWrap);
        this.panel.append(panel);
        this.tabMapping[tabId] = {
            button: button,
            panel: panel
        };
    }
    registerDefaultTab(tabId) {
        if (!this.tabMapping.hasOwnProperty(tabId)) {
            throw new Error(`$Tab {tabId} has not been appended`);
        }
        this.defaultTabId = tabId;
    }
    activateTab(tabId) {
        if (!this.tabMapping.hasOwnProperty(tabId)) {
            throw new Error(`$Tab {tabId} has not been appended`);
        }
        for (let panel of this.panel.children) {
            panel.hidden = true;
        }
        for (let button of this.menu.children) {
            button.parentElement?.setAttribute("cie-btn-active", "false");
        }
        this.tabMapping[tabId].panel.hidden = false;
        this.tabMapping[tabId].button.parentElement?.setAttribute("cie-btn-active", "true");
    }
    onClick(e, tabId) {
        this.activateTab(tabId);
        this.events.onClick && this.events.onClick(e, tabId);
    }
}
//# sourceMappingURL=toolTab.js.map