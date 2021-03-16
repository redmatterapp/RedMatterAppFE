import React from "react";
import { makeStyles } from "@material-ui/core/styles";
import { Button } from "@material-ui/core";
import Grid from "@material-ui/core/Grid";
import TextField from "@material-ui/core/TextField";

import AddFileModal from "./modals/AddFileModal";
import GenerateReportModal from "./modals/GenerateReportModal";
import MessageModal from "./modals/MessageModal";

import Workspace from "../general/workspaces/Workspace";

const useStyles = makeStyles((theme) => ({
  header: {
    textAlign: "center",
  },
  title: {},
  fileSelectModal: {
    backgroundColor: "#efefef",
    boxShadow: theme.shadows[6],
    padding: 20,
    width: "800px",
    position: "absolute",
    left: "50%",
    top: "50%",
    marginLeft: "-400px",
    marginTop: "-150px",
    textAlign: "center",
  },
  fileSelectFileContainer: {
    backgroundColor: "#efefef",
    padding: 10,
    borderRadius: 5,
  },
  fileSelectDivider: {
    marginTop: 10,
    marginBottom: 10,
  },
  topButton: {
    marginLeft: 30,
  },
}));

// ==== Avoid multiple listeners for screen resize ====
let eventListenerSet = false;

function GraphPrototype() {
  const classes = useStyles();

  // == Small screen size notice ==
  const [showSmallScreenNotice, setShowSmallScreenNotice] = React.useState(
    window.innerWidth < 1165
  );

  if (!eventListenerSet) {
    eventListenerSet = true;
    window.addEventListener("resize", () => {
      setShowSmallScreenNotice(window.innerWidth < 1165);
    });
  }

  // == General modal logic ==
  const handleOpen = (func: Function) => {
    func(true);
  };
  const handleClose = (func: Function) => {
    func(false);
  };

  // == Add file modal logic ==
  const [addFileModalOpen, setAddFileModalOpen] = React.useState(false);
  const [generateReportModalOpen, setGenerateReportModalOpen] = React.useState(
    false
  );

  return (
    <div
      style={{
        height: "100%",
      }}
    >
      {/* == MODALS == */}
      <AddFileModal
        open={addFileModalOpen}
        closeCall={{ f: handleClose, ref: setAddFileModalOpen }}
      />

      <GenerateReportModal
        open={generateReportModalOpen}
        closeCall={{ f: handleClose, ref: setGenerateReportModalOpen }}
      />

      {/* <MessageModal
        open={deletePanelModalOpen}
        closeCall={{
          f: handleClose,
          ref: setDeletePanelModalOpen,
        }}
        message={<h2>Are you sure you want to delete this panel?</h2>}
        options={deletePanelModalOptions}
      /> */}

      {/* == NOTICES == */}
      {showSmallScreenNotice ? (
        <div
          style={{
            color: "#555",
            backgroundColor: "#fdd",
            padding: 20,
            paddingBottom: 1,
            paddingTop: 15,
            marginTop: -10,
            textAlign: "center",
          }}
        >
          <p>
            <b>We noticed you are using a small screen</b>
            <br />
            Unfortunately, Red Matter is made with Desktop-sized screens in
            mind. Consider switching devices!
          </p>
        </div>
      ) : null}

      <div
        style={{
          color: "#555",
          backgroundColor: "#dedede",
          paddingBottom: 1,
          paddingTop: 15,
          marginBottom: 30,
          textAlign: "center",
        }}
      >
        <p>
          This is a <b>PROTOTYPE</b> showing basic functionalities we expect to
          add to Red Matter.
          <br />
          You can help us improve or learn more by sending an email to{" "}
          <a href="mailto:redmatterapp@gmail.com">
            <b>redmatterapp@gmail.com</b>
          </a>
          .
        </p>
      </div>

      {/* == MAIN PANEL == */}
      <Grid
        style={{
          marginLeft: "auto",
          marginRight: "auto",
          justifyContent: "center",
          display: "flex",
          marginBottom: 50,
        }}
        lg={12}
        xl={9}
      >
        <Grid
          style={{
            backgroundColor: "#fafafa",
            borderRadius: 10,
            marginLeft: 40,
            marginRight: 40,
            boxShadow: "2px 3px 3px #ddd",
          }}
          xs={12}
        >
          <Grid
            style={{
              backgroundColor: "#66a",
              paddingTop: 20,
              paddingBottom: 19,
              borderRadius: 10,
              WebkitBorderBottomLeftRadius: 0,
              WebkitBorderBottomRightRadius: 0,
            }}
            container
          >
            <Button
              variant="contained"
              size="large"
              onClick={() => handleOpen(setAddFileModalOpen)}
              className={classes.topButton}
              style={{
                backgroundColor: "#fafafa",
              }}
            >
              + Add new file
            </Button>
            <Button
              variant="contained"
              size="large"
              onClick={() => handleOpen(setGenerateReportModalOpen)}
              className={classes.topButton}
              style={{
                backgroundColor: "#fafafa",
              }}
            >
              Generate report
            </Button>
          </Grid>

          <Grid>
            <Workspace></Workspace>
          </Grid>
        </Grid>
      </Grid>
    </div>
  );
}

export default GraphPrototype;
