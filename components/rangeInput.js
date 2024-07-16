export default class RangeInput {
  #min = "0";
  #max = "100";
  #step = "1";
  #label = "";
  #value = "50";
  #defaultValue = "50";
  #input;
  #valueLabel;
  container;

  #events = {
    onInput: () => {}
  };

  constructor(config) {
    this.#min = config.min ?? this.#min;
    this.#max = config.max ?? this.#max;
    this.#step = config.step ?? this.#step;
    this.#label = config.label ?? this.#label;
    this.#value = config.value ?? this.#value;
    this.#defaultValue = config.value ?? this.#defaultValue;
    this.#events = config.events ?? this.#events;

    let container = document.createElement("div");
    container.classList.add("cie-tool-wrap");
    
    let input = document.createElement("input");
    input.classList.add("cie-rangePicker");
    input.type = "range";
    input.min = '' + this.#min;
    input.max = '' + this.#max;
    input.step = '' + this.#step;
    input.value = '' + this.#value;
    this.#input = input;

    let labelWrap = document.createElement("div");
    labelWrap.classList.add("cie-tool-label-wrap");

    let label = document.createElement("span");
    label.classList.add(..."cie-text-16 cie-white".split(" "));
    label.textContent = this.#label;
    
    let valueLabel = document.createElement("span");
    valueLabel.classList.add(..."cie-text-16 cie-blue output".split(" "));
    valueLabel.textContent = input.value;
    this.#valueLabel = valueLabel;

    labelWrap.append(label, valueLabel);

    container.append(labelWrap, input);
    this.container = container;
    this.#setListeners();
  }

  #onInput = (e) => {
    this.#valueLabel.textContent = e.target.value;
    this.#events?.onInput(e);
  }
  
  #setListeners() {
    if (!this.#input) {
      return;
    }
    
    this.#input.addEventListener("input", this.#onInput);
  }

  reset() {
    this.#input.value = this.#value = this.#defaultValue;
    this.#valueLabel.textContent = this.#value;
  }
}