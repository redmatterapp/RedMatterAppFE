import React from "react";
import { makeStyles } from "@material-ui/core/styles";
import { Button } from "@material-ui/core";
import Modal from "@material-ui/core/Modal";
import { Divider } from "@material-ui/core";

import file1 from "./fcsFile1.tsx";
import file2 from "./fcsFile2.tsx";

const useStyles = makeStyles((theme) => ({
  fileSelectModal: {
    backgroundColor: "#fafafa",
    boxShadow: theme.shadows[6],
    padding: 20,
    width: "800px",
    position: "absolute",
    left: "50%",
    top: "30%",
    marginLeft: "-400px",
    marginTop: "-150px",
    textAlign: "center",
    borderRadius: 10,
    fontFamiliy: "Raleway",
  },
  fileSelectFileContainer: {
    paddingTop: 15,
    paddingLeft: 10,
    paddingRight: 10,
    backgroundColor: "#efefef",
    borderRadius: 5,
    border: "solid #ddd",
    borderWidth: 0.3,
  },
  fileSelectFileContainerHover: {
    paddingTop: 15,
    paddingLeft: 10,
    paddingRight: 10,
    backgroundColor: "#def",
    borderRadius: 5,
    border: "solid #ddd",
    borderWidth: 0.3,
  },
  fileSelectDivider: {
    marginTop: 10,
    marginBottom: 10,
  },
}));

function AddFileModal(props: {
  addFile: Function;
  open: boolean;
  closeCall: { f: Function; ref: Function };
}): JSX.Element {
  const classes = useStyles();

  const [open, setOpen] = React.useState(false);
  const [onHover, setOnHover] = React.useState(-1);

  const handleOpen = () => {
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
  };

  const addFile = (index: number) => {
    props.addFile(getFiles()[index]);
  };

  const generateRandomData = (
    dimesionCount: number,
    maxPoints: number,
    l: number,
    r: number
  ) => {
    if (l > r) throw Error("R must be greater than L");
    const pointCount = Math.round(Math.random() * maxPoints);
    const points: Array<Array<number>> = [];
    for (let i = 0; i < pointCount; i++) {
      let dimesion = [];
      for (let j = 0; j < dimesionCount; j++) {
        dimesion.push(Math.random() * (r - l) + l);
      }
      points.push(dimesion);
    }
    return points;
  };

  const generateRandomAxes = (dimesionCount: number) => {
    const list = [];
    for (let i: number = 0; i < dimesionCount; i++) {
      list.push({
        value: Math.random()
          .toString(36)
          .replace(/[^a-z]+/g, "")
          .substr(0, Math.round(Math.random() * 5 + 2)),
        key: i,
        display: ["lin", "log"][Math.round(Math.random() * 1.5 - 0.5)],
      });
    }
    return list;
  };

  const getFiles = () => {
    return [
      {
        title: "Patient1_experiment2_2020_9_2.fcs",
        information:
          "Source of this file has been ommited. This file has 10k points in 6 dimesions.",
        data: file1.data,
        axes: file1.dimesions,
        lastModified: "2020/9/2",
      },
      {
        title: "Patient1_experiment3_2020_9_3.fcs",
        information:
          "Source of this file has been ommited. This file has 14k points in 11 dimesions.",
        data: file2.data,
        axes: file2.dimesions,
        lastModified: "2020/9/3",
      },
      {
        title: "SmallRandomDataset.fcs",
        information:
          "Generates some axes and points randomly! Around ~50 points, 2 dimesions, ranging from 0 to 100",
        data: generateRandomData(2, 100, 0, 100),
        axes: generateRandomAxes(2),
        lastModified: "Right now!",
      },
      {
        title: "MediumRandomDataset.fcs",
        information:
          "Generates axes and points randomly! Around ~500 points, 10 dimesions, ranging from 0 to 1",
        data: generateRandomData(10, 1000, 0, 1),
        axes: generateRandomAxes(10),
        lastModified: "Right now!",
      },
      {
        title: "LargeRandomDataset.fcs",
        information:
          "Generates many axes and points randomly! Around ~5000 points, 200 dimesions, ranging from -10000 to 1000000",
        data: generateRandomData(200, 3000, -10000, 1000000),
        axes: generateRandomAxes(200),
        lastModified: "Right now!",
      },
    ];
  };

  const files = getFiles();

  return (
    <Modal
      open={props.open}
      onClose={() => {
        props.closeCall.f(props.closeCall.ref);
      }}
    >
      <div className={classes.fileSelectModal}>
        <h2>Open FCS file</h2>

        <p
          style={{
            color: "#777",
            fontSize: 15,
            textAlign: "left",
          }}
        >
          The prototype still doesn't allow for uploading files or saving them,
          but here we have a selection of 3 real fcs files for you to play
          around!
        </p>

        <p>
          <b>Click on the file you want to open:</b>
        </p>

        <div
          style={{
            backgroundColor: "#fff",
            padding: 15,
            textAlign: "left",
            maxHeight: 500,
            overflowY: "scroll",
            border: "solid #ddd",
            borderRadius: 5,
            borderWidth: 0.3,
          }}
        >
          {files.map((e, i) => {
            const divider =
              i == files.length - 1 ? null : (
                <Divider className={classes.fileSelectDivider} />
              );

            const payload = (
              <div key={i.toString() + e.title}>
                <div
                  onMouseEnter={() => setOnHover(i)}
                  onMouseLeave={() => setOnHover(-1)}
                  className={
                    onHover == i
                      ? classes.fileSelectFileContainerHover
                      : classes.fileSelectFileContainer
                  }
                  onClick={() => {
                    addFile(i);
                    props.closeCall.f(props.closeCall.ref);
                  }}
                >
                  <p>
                    <b>Title:</b>{" "}
                    <a
                      style={{
                        color: "#777",
                        fontSize: 16,
                        fontFamily: "Courier New",
                      }}
                    >
                      {e.title}
                    </a>
                  </p>
                  <p>
                    <b>Last Modified:</b> {e.lastModified}
                  </p>
                  <p>
                    <b>Information:</b> {e.information}
                  </p>
                </div>
                {divider}
              </div>
            );

            return payload;
          })}
        </div>
      </div>
    </Modal>
  );
}

export default AddFileModal;
