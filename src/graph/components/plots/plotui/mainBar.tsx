import { Button } from "@material-ui/core";
import React, { useEffect } from "react";
import Grid from "@material-ui/core/Grid";
import DeleteIcon from "@material-ui/icons/Delete";
import CameraAltIcon from "@material-ui/icons/CameraAlt";

import MessageModal from "../../modals/MessageModal";
import dataManager from "../../../dataManagement/dataManager";

const classes = {
  main: {
    marginBottom: 10,
    paddingLeft: 2,
    paddingRight: 2,
  },
  mainDelete: {
    backgroundColor: "#6666aa",
  },
  mainButton: {
    backgroundColor: "#66a",
    color: "white",
    marginLeft: 10,
  },
};

export default function MainBar(props: any) {
  const [deleteModalOpen, setDeleteModalOpen] = React.useState(false);
  const [emptySubpopModalOpen, setEmptySubpopModalOpen] = React.useState(false);
  const [ovalGating, setOvalGating] = React.useState(false);
  const [polygonGating, setPolygonGating] = React.useState(false);
  const plot = props.plot;

  const deletePlot = () => {
    dataManager.removePlotFromWorkspace(plot.plotData.id);
  };

  const handleClose = (func: Function) => {
    func(false);
  };

  const ovalGatingSetter = () => {
    if (ovalGating) {
      plot.setGating("Oval", false);
      setOvalGating(false);
    } else {
      plot.setGating("Oval", true);
      setOvalGating(true);
    }
  };

  const polygonGatingSetter = () => {
    if (polygonGating) {
      plot.setGating("Polygon", false);
      setPolygonGating(false);
    } else {
      plot.setGating("Polygon", true);
      setPolygonGating(true);
    }
  };

  useEffect(() => {
    plot.unsetGating = () => {
      setPolygonGating(false);
      setOvalGating(false);
    };
  }, []);

  const downloadCanvasAsImage = () => {
    let downloadLink = document.createElement("a");
    downloadLink.setAttribute(
      "download",
      `workspacename-filename-${plot.plotData.id}.png`
    );
    let canvas = document.getElementById(`canvas-${plot.plotData.id}`);
    //@ts-ignore
    let dataURL = canvas.toDataURL("image/png");
    let url = dataURL.replace(
      /^data:image\/png/,
      "data:application/octet-stream"
    );
    downloadLink.setAttribute("href", url);
    downloadLink.click();
  };

  return (
    <Grid container direction="row" xs={12} style={classes.main}>
      <MessageModal
        open={deleteModalOpen}
        closeCall={{
          f: handleClose,
          ref: setDeleteModalOpen,
        }}
        message={<h2>Are you sure you want to delete this panel?</h2>}
        options={{
          yes: () => {
            deletePlot();
          },
          no: () => {
            handleClose(setDeleteModalOpen);
          },
        }}
      />

      <MessageModal
        open={emptySubpopModalOpen}
        closeCall={{
          f: handleClose,
          ref: setEmptySubpopModalOpen,
        }}
        message={
          <h2 style={{ fontSize: 23, fontWeight: 400 }}>
            You cannot create a subpopulation of a plot that is not gated!
          </h2>
        }
      />

      <Button
        onClick={() => setDeleteModalOpen(true)}
        style={classes.mainDelete}
      >
        <DeleteIcon fontSize="small" style={{ color: "#fff" }}></DeleteIcon>
      </Button>
      {/* <Button
            variant="contained"
            size="medium"
            // onClick={}
            style={classes.mainButton}
          >
            Polygon Gate
          </Button> */}
      <Button
        variant="contained"
        size="medium"
        onClick={() => ovalGatingSetter()}
        style={{
          ...classes.mainButton,
          backgroundColor: ovalGating ? "#6666ee" : "#6666aa",
        }}
      >
        Oval Gate
      </Button>
      <Button
        variant="contained"
        size="medium"
        onClick={() => polygonGatingSetter()}
        style={{
          ...classes.mainButton,
          backgroundColor: polygonGating ? "#6666ee" : "#6666aa",
        }}
      >
        Polygon Gate
      </Button>
      {/* <Button
            variant="contained"
            size="medium"
            // onClick={}
            style={classes.mainButton}
          >
            Quadrant
          </Button> */}
      <Button
        variant="contained"
        size="medium"
        onClick={() => {
          if (plot.plotData.gates.length === 0) {
            setEmptySubpopModalOpen(true);
            return;
          }
          dataManager.createSubpopFromGatesInPlot(plot.plotData.id);
        }}
        style={classes.mainButton}
      >
        Subpop
      </Button>
      <Button
        variant="contained"
        size="medium"
        onClick={() => {
          if (plot.plotData.gates.length === 0) {
            setEmptySubpopModalOpen(true);
            return;
          }
          dataManager.createSubpopFromGatesInPlot(plot.plotData.id, true);
        }}
        style={classes.mainButton}
      >
        Inverse Subpop
      </Button>
      <Button
        onClick={() => downloadCanvasAsImage()}
        style={{ ...classes.mainDelete, marginLeft: 10 }}
      >
        <CameraAltIcon
          fontSize="small"
          style={{ color: "#fff" }}
        ></CameraAltIcon>
      </Button>
    </Grid>
  );
}
