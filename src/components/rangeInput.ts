import Component from "./component";

export default class RangeInput implements Component {
  private min = "0";
  private max = "100";
  private step = "1";
  private label = "";
  private value = "50";
  private defaultValue = "50";
  private input: HTMLInputElement;
  private valueLabel: HTMLSpanElement;
  public events: Partial<{
    onInput: RangeInput["onInput"]
  }> = {};
  
  public container;

  constructor(config: {
    min: string,
    max: string,
    step: string,
    label: string,
    value: string,
    events?: RangeInput["events"],
  }) {
    this.min = config.min ?? this.min;
    this.max = config.max ?? this.max;
    this.step = config.step ?? this.step;
    this.label = config.label ?? this.label;
    this.value = config.value ?? this.value;
    this.defaultValue = config.value ?? this.defaultValue;
    this.events = config.events ?? this.events;

    let container = document.createElement("div");
    container.classList.add("cie-tool-wrap");
    
    let input = document.createElement("input");
    input.classList.add("cie-rangePicker");
    input.type = "range";
    input.min = '' + this.min;
    input.max = '' + this.max;
    input.step = '' + this.step;
    input.value = '' + this.value;
    this.input = input;

    let labelWrap = document.createElement("div");
    labelWrap.classList.add("cie-tool-label-wrap");

    let label = document.createElement("span");
    label.classList.add(..."cie-text-16 cie-white".split(" "));
    label.textContent = this.label;
    
    let valueLabel = document.createElement("span");
    valueLabel.classList.add(..."cie-text-16 cie-blue output".split(" "));
    valueLabel.textContent = input.value;
    this.valueLabel = valueLabel;

    labelWrap.append(label, valueLabel);

    container.append(labelWrap, input);
    this.container = container;
    this.input.addEventListener("input", this.onInput);
  }

  public reset(): void {
    this.value = this.defaultValue;
    this.input.value = this.defaultValue;
    this.valueLabel.textContent = this.defaultValue;
  }

  private onInput = (e: Event) => {
    this.valueLabel.textContent = (e.target as HTMLInputElement)?.value;
    this.events.onInput && this.events.onInput(e);
  }
}