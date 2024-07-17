export default class ToolTab {
    menu;
    panel;
    menuClass = "cie-block";
    panelClass = "cie-block";
    menuId = "cie-tools-menu";
    panelId = "cie-tools-panel";
    activeButtonColor = "#4e8ee5";
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
    appendTab(button, panel) {
        button.addEventListener('click', (e) => this.onClick(e, button, panel));
        let buttonWrap = document.createElement("div");
        buttonWrap.append(button);
        this.menu.append(buttonWrap);
        this.panel.append(panel);
    }
    activateTab(activeButton, activePanel) {
        for (let panel of this.panel.children) {
            panel.hidden = true;
        }
        for (let button of this.menu.children) {
            button.parentElement?.setAttribute("cie-btn-active", "false");
        }
        activePanel.hidden = false;
        activeButton.parentElement?.setAttribute("cie-btn-active", "true");
    }
    onClick(e, activeButton, activePanel) {
        this.activateTab(activeButton, activePanel);
        this.events.onClick && this.events.onClick(e, activeButton, activePanel);
    }
}
//# sourceMappingURL=toolTab.js.map