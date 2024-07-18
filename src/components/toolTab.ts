import Component from "./component";

export default class ToolTab implements Component {
  private menu: HTMLDivElement;
  private panel: HTMLDivElement;
  private menuClass = "cie-block";
  private panelClass = "cie-block";
  private menuId = "cie-tools-menu";
  private panelId = "cie-tools-panel";
  private defaultTabId = "";
  private tabMapping: {[key:string]: {button: HTMLElement, panel: HTMLDivElement}} = {}
  private events: Partial<{
    onClick: ToolTab["onClick"]
  }> = {};
  
  public container;
  
  constructor(config: {
    events: ToolTab["events"]
  }) {
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

  public reset(): void {
    this.activateTab(this.defaultTabId);
  }

  public appendTab(button: HTMLElement, panel: HTMLDivElement, tabId: string): void {
    button.addEventListener('click', (e) => this.onClick(e, tabId));
    let buttonWrap = document.createElement("div");
    buttonWrap.append(button);
    this.menu.append(buttonWrap);
    this.panel.append(panel);
    this.tabMapping[tabId] = {
      button: button,
      panel: panel
    }
  }

  public registerDefaultTab(tabId: string): void {
    if (!this.tabMapping.hasOwnProperty(tabId)) {
      throw new Error(`$Tab {tabId} has not been appended`);
    }
    this.defaultTabId = tabId;
  }

  public activateTab(tabId: string): void {
    if (!this.tabMapping.hasOwnProperty(tabId)) {
      throw new Error(`$Tab {tabId} has not been appended`);
    }
    for (let panel of this.panel.children) {
      (panel as HTMLDivElement).hidden = true;
    }
    
    for (let button of this.menu.children) {
      button.parentElement?.setAttribute("cie-btn-active", "false");
    }

    this.tabMapping[tabId].panel.hidden = false;
    this.tabMapping[tabId].button.parentElement?.setAttribute("cie-btn-active", "true");
  }

  private onClick(e: MouseEvent, tabId: string): void {
    this.activateTab(tabId);
    this.events.onClick && this.events.onClick(e, tabId);
  }
}