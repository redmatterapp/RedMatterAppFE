import React, { useEffect } from "react";
import { makeStyles } from "@material-ui/core/styles";
import { Button, FormControlLabel, Switch } from "@material-ui/core";
import Modal from "@material-ui/core/Modal";
import Divider from "@material-ui/core/Divider";
import TextField from "@material-ui/core/TextField";
import Checkbox from "@material-ui/core/Checkbox";
import Typography from "@material-ui/core/Typography";
import Grid from "@material-ui/core/Grid";

import userManager from "Components/users/userManager";
import { ExperimentApiFetchParamCreator } from "api_calls/nodejsback";
import axios from "axios";
import { useHistory } from "react-router-dom";
import { snackbarService } from "uno-material-ui";
import { useDispatch, useStore } from "react-redux";
import PrototypeForm from "Components/home/PrototypeForm";
import CreateExperimentDialog from "./CreateExperimentDialog";

const useStyles = makeStyles((theme) => ({
  modal: {
    backgroundColor: "#fafafa",
    boxShadow: theme.shadows[6],
    padding: "0px 0 20px",
    width: "800px",
    position: "absolute",
    left: "50%",
    top: "30%",
    marginLeft: "-400px",
    marginTop: "-150px",
    textAlign: "center",
    borderRadius: 10,
  },
}));

//create your forceUpdate hook
function useForceUpdate() {
  const [value, setValue] = React.useState(0); // integer state
  return () => setValue((value) => value + 1); // update the state to force render
}




function CreateExperimentModal(props: {
  open: boolean;
  closeCall: { f: Function; ref: Function };
  created: Function;
  experiments: string[];
<<<<<<< HEAD
  organizationId:any;
=======
  organizationId: any;
>>>>>>> 117-exceptions-on-expired-login-token
}): JSX.Element {
  const store = useStore();
  const dispatch = useDispatch();
  const classes = useStyles();
  const forceUpdate = useForceUpdate();
<<<<<<< HEAD

=======
>>>>>>> 117-exceptions-on-expired-login-token
  const organizationId = props.organizationId;
  const [name, setName] = React.useState("");
  const [privateExperiment, setPrivateExperiment] = React.useState(false);
  const [formData, setFormData] = React.useState(null);
  const [createExperimentDialog, setCreateExperimentDialog] =
    React.useState(false);
  const [nameError, setNameError] = React.useState(false);




  useEffect(() => {
    //props.redirectIfTokenExpired(organizationId);
    for (const item of [
      "device",
      "cellType",
      "particleSize",
      "fluorophoresCategory",
      "description",
    ]) {
      dispatch({
        type: "EXPERIMENT_FORM_DATA",
        payload: {
          formitem: { key: item, value: null },
        },
      });
    }
  }, [props.open]);



  

  const createExperiment = () => {
    const req = ExperimentApiFetchParamCreator({
      accessToken: userManager.getToken(),
    }).createExperiment(
      { details: formData, name: name, privateExp: privateExperiment, organisationId: organizationId },
      userManager.getToken()
    );
    axios
      .post(req.url, req.options.body, req.options)
      .then((e) => {
        props.closeCall.f(props.closeCall.ref);
        props.created(e.data.id);
        setName("");
      })
      .catch((e) => {
        snackbarService.showSnackbar(
          "Could not create experiment, reload the page and try again!",
          "error"
        );
      });
    dispatch({
      type: "EXPERIMENT_FORM_DATA_CLEAR",
    });
  };

  //THIS FUNCTION VALIDATES THAT REQUIRED FIELDS ARE NOT EMPTY AND OPENS THE SUMMARY DIALOG
  const handleSubmit = () => {
    if (name === "" || name === undefined || name === null) {
      snackbarService.showSnackbar(
        "Experiment name cannot not be empty",
        "warning"
      );
      return;
    }

    if (props.experiments.includes(name)) {
      snackbarService.showSnackbar(
        "An experiment with this name already exists",
        "warning"
      );
      return;
    }

    const valuesToCheck = {
      1: store.getState().user.experiment.cellType,
      2: store.getState().user.experiment.particleSize,
      3: store.getState().user.experiment.fluorophoresCategory,
    };

    //THIS IS A VERY HANDY ES7 WAY TO CHECK ALL ITEMS FROM AN OBJECT
    if (
      Object.values(valuesToCheck).every((item) => item != null) &&
      name != null
    ) {
      setCreateExperimentDialog(true);
    } else {
      snackbarService.showSnackbar(
        "There are still some required fields empty",
        "error"
      );
      return;
    }
    //SET THE FROM DATA STATE SO WE CAN CREATE THE EXPERIMENT FROM THE CREATEWORKSPACE FUNCTION
    setFormData(store.getState().user.experiment);
  };

  const confirmEnabled = () => {
    const valuesToCheck = {
      1: store.getState().user.experiment.cellType,
      2: store.getState().user.experiment.particleSize,
      3: store.getState().user.experiment.fluorophoresCategory,
      4: name,
    };
    return Object.values(valuesToCheck).every(
      (item) => item != null && item != ""
    );
  };

  store.subscribe(() => {
    forceUpdate();
  });

  const handleClose = (func: Function) => {
    func(false);
  };
  const createExperimentFromSummary = (func: Function) => {
    func();
  };
  return (
    <div>
      <CreateExperimentDialog
        open={createExperimentDialog}
        closeCall={{
          f: handleClose,
          ref: setCreateExperimentDialog,
        }}
        name={name}
        sendFunction={{
          f: createExperimentFromSummary,
          ref: createExperiment,
        }}
      />

      <Modal
        open={props.open}
        disableScrollLock={true}
        style={{
          overflow: "scroll",
          padding: "0",
          borderRadius: 10,
        }}
      >
        <div className={classes.modal}>
          <div
            style={{
              backgroundColor: "#6666A9",
              color: "#FFF",
              padding: "6px 0 1px",
              borderRadius: "10px 10px 0 0",
              paddingTop: 15,
            }}
          >
            <h2
              style={{
                color: "#FFF",
              }}
            >
              Create Experiment
            </h2>
          </div>

          <div
            style={{
              marginTop: 15,
            }}
          >
            <Grid
              container
              spacing={3}
              style={{
                paddingLeft: 60,
                paddingRight: 50,
              }}
            >
              <Grid item xs={5}>
                <Typography
                  style={{
                    marginTop: 0,
                    textAlign: "left",
                  }}
                >
                  <span style={{ fontWeight: 300 }}>Your Experiment's Name</span>
                </Typography>
              </Grid>
              <Grid item xs={7}>
                <TextField
                  error={nameError}
                  size="small"
                  variant="outlined"
                  helperText="This Field is Required"
                  label="Experiment Name"
                  onChange={(textField: any) => {
                    setName(textField.target.value);
                    if (
                      textField.target.value != null &&
                      textField.target.value != ""
                    ) {
                      setNameError(false);
                    }
                  }}
                  onBlur={(textField: any) => {
                    if (
                      textField.target.value == null ||
                      textField.target.value == ""
                    ) {
                      setNameError(true);
                    }
                  }}
                  value={name}
                  style={{
                    width: "102%",
                  }}
                ></TextField>
              </Grid>

              <Divider style={{ width: "90%" }}></Divider>

              <Grid item xs={5}>
                <Typography
                  style={{
                    marginTop: 0,
                    textAlign: "left",
                  }}
                >
                  <span style={{ fontWeight: 300 }}>Private experiment</span>
                </Typography>
              </Grid>
              <Grid item xs={7}>
                <FormControlLabel
                  style={{
                    marginTop: "-10px",
                    marginLeft: "-64%",
                  }}
                  control={
                    <Checkbox
                      //@ts-ignore
                      color="primary"
                      inputProps={{ "aria-label": "secondary checkbox" }}
                      checked={privateExperiment}
                      onChange={() => setPrivateExperiment(!privateExperiment)}
                      name="Private workspace"
                      style={{}}
                    />
                  }
                  label={
                    <span style={{ fontSize: "13px" }}>
                      <strong style={{ fontWeight: 300 }}>
                        Private Experiment
                      </strong>
                    </span>
                  }
                />

                {privateExperiment ? (
                  <p
                    style={{
                      fontSize: 10,
                      marginTop: -13,
                      marginBottom: 15,
                      marginLeft: "-20%",
                    }}
                  >
                    No one in your workspace will be able to see this experiment
                  </p>
                ) : null}
              </Grid>
              <Divider
                style={{ width: "90%", marginTop: -7, marginBottom: 10 }}
              ></Divider>
            </Grid>
          </div>

          <PrototypeForm
            //@ts-ignore
            onSend={(e) => {
              setFormData(e);
            }}
          ></PrototypeForm>

          <Divider
            style={{
              marginBottom: 10,
            }}
          ></Divider>

          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              width: "50%",
              marginLeft: "auto",
              marginRight: "auto",
            }}
          >
            <Button
              variant="contained"
              style={{ backgroundColor: "#F44336", color: "white" }}
              onClick={() => {
                props.closeCall.f(props.closeCall.ref);
              }}
            >
              Cancel
            </Button>
            <Button
              variant="contained"
              disabled={!confirmEnabled()}
              style={{
                backgroundColor: confirmEnabled() ? "#6666A9" : "#aaaadb",
                color: "white",
              }}
              onClick={() => {
                handleSubmit();
              }}
            >
              Create
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

export default CreateExperimentModal;
