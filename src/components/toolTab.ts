export default class ToolTab {
  private menu: HTMLDivElement;
  private panel: HTMLDivElement;
  private menuClass = "cie-block";
  private panelClass = "cie-block";
  private menuId = "cie-tools-menu";
  private panelId = "cie-tools-panel";
  private activeButtonColor = "#4e8ee5";
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

  public appendTab(button: HTMLElement, panel: HTMLDivElement) {
    button.addEventListener('click', (e) => this.onClick(e, button, panel));
    let buttonWrap = document.createElement("div");
    buttonWrap.append(button);
    this.menu.append(buttonWrap);
    this.panel.append(panel);
  }

  public activateTab(activeButton: HTMLElement, activePanel: HTMLDivElement) {
    for (let panel of this.panel.children) {
      (panel as HTMLDivElement).hidden = true;
    }
    
    for (let button of this.menu.children) {
      button.parentElement?.setAttribute("cie-btn-active", "false");
    }

    activePanel.hidden = false;
    activeButton.parentElement?.setAttribute("cie-btn-active", "true");
  }

  private onClick(e: MouseEvent, activeButton: HTMLElement, activePanel: HTMLDivElement) {
    this.activateTab(activeButton, activePanel);
    this.events.onClick && this.events.onClick(e, activeButton, activePanel);
  }
}