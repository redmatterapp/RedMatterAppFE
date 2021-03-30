import React, { useEffect } from "react";
import Checkbox from "@material-ui/core/Checkbox";
import Button from "@material-ui/core/Button";
import TextField from "@material-ui/core/TextField";
import Autocomplete from "@material-ui/lab/Autocomplete";
import CheckBoxOutlineBlankIcon from "@material-ui/icons/CheckBoxOutlineBlank";
import CheckBoxIcon from "@material-ui/icons/CheckBox";
import Grid from "@material-ui/core/Grid";
import dataManager from "../../../classes/dataManager";
import Canvas from "../../../classes/canvas/canvas";
import Gate from "../../../classes/gate/gate";
import { data } from "jquery";

const icon = <CheckBoxOutlineBlankIcon fontSize="small" />;
const checkedIcon = <CheckBoxIcon fontSize="small" />;

const classes = {
  bar: {
    marginTop: 10,
    marginBottom: 10,
  },
};

function useForceUpdate() {
  const [value, setValue] = React.useState(0); // integer state
  return () => setValue((value) => value + 1); // update the state to force render
}

export default function GateBar(props: any) {
  const rerender = useForceUpdate();
  const [gates, setGates] = React.useState([]);
  const [selected, setSelected] = React.useState([]);
  const canvas: Canvas = props.canvas;
  let idCanvasGateUpdate: any = null;
  let idGateUpdate: any = null;

  const getCanvasGates = () => {
    setSelected(canvas.gates.map((e) => e.name));
  };

  const getAllGates = () => {
    const cgates: Gate[] = [];
    dataManager.getAllGates().forEach((v, k) => {
      cgates.push(v);
    });
    setGates(cgates);
  };

  const addGateToCanvas = (gateName: string, selected: boolean) => {
    const gateID = gates.find((gate) => gate.name === gateName).id;
    if (selected) {
      dataManager.removeGateFromCanvas(gateID, canvas.id);
    } else {
      dataManager.addGateToCanvas(gateID, canvas.id);
    }
    update();
  };

  const update = () => {
    getAllGates();
    getCanvasGates();
  };

  useEffect(() => {
    idCanvasGateUpdate = dataManager.addObserver("addGate", update);
    idGateUpdate = dataManager.addObserver("addGateToCanvas", update);
  }, []);

  console.log("i rendered");
  return (
    <Grid xs={12} container direction="column" style={classes.bar}>
      <Autocomplete
        multiple
        options={gates.map((e) => e.name)}
        value={selected.map((e) => e)}
        disableCloseOnSelect
        getOptionLabel={(option) => option}
        renderOption={(option, { selected }) => (
          <Button
            onClick={() => addGateToCanvas(option, selected)}
            style={{ flex: 1, justifyContent: "left" }}
          >
            <Checkbox
              icon={icon}
              checkedIcon={checkedIcon}
              style={{ marginRight: 8, textAlign: "left", padding: 0 }}
              checked={selected}
            />
            {option}
          </Button>
        )}
        style={{ flex: 1 }}
        renderInput={(params) => (
          <TextField
            {...params}
            variant="outlined"
            label="Gates"
            onClick={() => console.log("someone touched me im scared")}
          />
        )}
      />
    </Grid>
  );
}
