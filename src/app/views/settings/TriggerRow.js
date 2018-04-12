class TriggerRow {
  constructor(){}

  createSelect(className, value, list) {
    let input = document.createElement("select");
    input.setAttribute("class", className);
    for (var i in list) {
      let option = document.createElement("option");
      option.setAttribute("value", list[i]);
      option.innerHTML = list[i];
      //if (list[i] == value){input.selectedIndex = option.index} //Sets the default state of the dropdown
      input.appendChild(option);
    }
    if (value) {
      input.value = value;
    }
    return input;
  }

  createInput(className, value) {
    let input = document.createElement("input");
    input.setAttribute("class", className);
    input.setAttribute("type", "text");
    if (value !== undefined) {
      input.setAttribute("value", value);
    }
    return input;
  }

  createTrash() {
    let trash = document.createElement("img");
    trash.setAttribute("src", "../../images/delete.png");
    trash.setAttribute("class", "delete-button");
    trash.addEventListener("click", function(event) {
      removeTriggerRow(event.target);
    });
    return trash;
  }

}

class PresenceTriggerRow extends TriggerRow {
  constructor(values) {
    super()
    this.stateChange = values.stateChange;
    this.triggerValue = values.triggerValue;
    this.cmd = values.cmd;
  }

  get createElement() {
    let row = document.createElement("div");
    row.setAttribute("class", "trigger-row");
    let stateChangeInput = this.createSelect("stateChange", this.stateChange, [
      "to",
      "from"
    ]);
    let presenceValueInput = this.createSelect(
      "presenceValue",
      this.triggerValue,
      ["available", "away", "busy", "out", "dnd", "meeting", "call"]
    ); //add more values
    let cmdInput = this.createInput("cmd", this.cmd);
    let trash = this.createTrash();
    let inputDiv = document.createElement("div");
    row.appendChild(inputDiv)
    inputDiv.appendChild(stateChangeInput);
    inputDiv.appendChild(presenceValueInput);
    inputDiv.appendChild(cmdInput);
    row.appendChild(trash);
    return row;
  }
}

class CallEventTriggerRow extends TriggerRow {
  constructor(values) {
    super()
    this.triggerValue = values.triggerValue;
    this.cmd = values.cmd;
  }

  get createElement() {
    let row = document.createElement("div");
    row.setAttribute("class", "trigger-row");
    let callEventInput = this.createSelect("callEvent", this.triggerValue, [
      "dial_call_start",
      "call_ring",
      "call_connected",
      "call_end"
    ]);
    let cmdInput = this.createInput("cmd", this.cmd);
    let trash = this.createTrash();
    let inputDiv = document.createElement("div");
    row.appendChild(inputDiv)
    inputDiv.appendChild(callEventInput);
    inputDiv.appendChild(cmdInput);
    row.appendChild(trash);
    return row;
  }
}

function removeTriggerRow(buttonElement) {
  let row = buttonElement.parentElement;
  row.parentElement.removeChild(row);
  return null;
}

module.exports = {
  PresenceTriggerRow,
  CallEventTriggerRow
}
