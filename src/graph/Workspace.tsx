import React, { useEffect, useState } from "react";
import { useStore } from "react-redux";
import axios from "axios";
import { useHistory } from "react-router";
import { useLocation } from "react-router-dom";

import { makeStyles } from "@material-ui/core/styles";
import { Button } from "@material-ui/core";
import Grid from "@material-ui/core/Grid";
import { snackbarService } from "uno-material-ui";
import { ArrowLeftOutlined } from "@ant-design/icons";
import CircularProgress from "@material-ui/core/CircularProgress";
import ShareIcon from "@material-ui/icons/Share";
import { green } from "@material-ui/core/colors";
import AutorenewRoundedIcon from "@material-ui/icons/AutorenewRounded";
import CheckCircleRoundedIcon from "@material-ui/icons/CheckCircleRounded";
import { generateColor } from "graph/utils/color";

import userManager from "Components/users/userManager";
import Gate from "graph/dataManagement/gate/gate";
import PlotData from "graph/dataManagement/plotData";
import { API_CALLS } from "assets/constants/apiCalls";
import { Dbouncer } from "services/Dbouncer";
import HowToUseModal from "./HowToUseModal";
import SmallScreenNotice from "./SmallScreenNotice";
import PrototypeNotice from "./PrototypeNotice";
import { WorkspacesApiFetchParamCreator } from "api_calls/nodejsback";
import MessageModal from "./components/modals/MessageModal";
import AddFileModal from "./components/modals/AddFileModal";
import GateNamePrompt from "./components/modals/GateNamePrompt";
import GenerateReportModal from "./components/modals/GenerateReportModal";
import LinkShareModal from "./components/modals/linkShareModal";
import FCSFile from "graph/dataManagement/fcsFile";
import Plots, { resetPlotSizes } from "./components/workspaces/Plots";
import dataManager from "graph/dataManagement/dataManager";
import WorkspaceStateHelper from "graph/dataManagement/workspaceStateReload";
import SideMenus from "./components/static/SideMenus";
import { String } from "lodash";
import XML from "xml-js";
import { COMMON_CONSTANTS } from "assets/constants/commonConstants";
import { GateState, Point } from "../graph/dataManagement/gate/gate";
import PolygonGate, {
  PolygonGateState,
} from "./dataManagement/gate/polygonGate";

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
    marginLeft: 20,
    marginTop: 5,
    height: "1.9rem",
  },
  savingProgress: {
    marginLeft: "-5px",
    display: "flex",
    marginRight: "3px",
    animation: "App-logo-spin 1.4s linear infinite",
  },
  saved: {
    marginLeft: "-5px",
    display: "flex",
    marginRight: "3px",
    color: green[500],
  },
}));

// ==== Avoid multiple listeners for screen resize ====
let setWorkspaceAlready = false;
let workspaceSharedLocal = false;
const staticFiles = [
  "transduction_1",
  "transduction_2",
  "transduction_3",
  "erica1",
  "erica2",
  "erica3",
].map((e) => {
  return {
    label: e,
    information: "...",
    fromStatic: e,
    fileSize: 0,
    eventCount: 0,
    lastModified: "X/X/X",
  };
});

let flowJoJson = {};
let importFlowJo = false;

function Workspace(props: { experimentId: string; poke: Boolean }) {
  const remoteWorkspace = dataManager.isRemoteWorkspace();
  const history = useHistory();
  const isLoggedIn = userManager.isLoggedIn();

  const [sharedWorkspace, setSharedWorkspace] = React.useState(false);
  const [newWorkspaceId, setNewWorkspaceId] = React.useState("");
  const [savingWorkspace, setSavingWorkspace] = React.useState(false);
  const [initPlot, setInitPlot] = React.useState(false);
  const inputFile = React.useRef(null);
  const [fileUploadInputValue, setFileUploadInputValue] = React.useState("");
  const location = useLocation();
  const saveWorkspace = Dbouncer.debounce(() => upsertWorkSpace(false));

  const verifyWorkspace = async (workspaceId: string) => {
    let workspaceData;
    try {
      workspaceData = await axios.post(
        "/api/verifyWorkspace",
        {
          workspaceId: workspaceId,
          experimentId: props.experimentId,
        },
        {}
      );
      dataManager.setWorkspaceIsShared(workspaceData.data["isShared"]);
      setSharedWorkspace(workspaceData.data["isShared"]);
    } catch (e) {
      snackbarService.showSnackbar(
        "Could not verify the workspace, reload the page and try again!",
        "error"
      );
    }
    workspaceSharedLocal = workspaceData.data["isShared"];
    initPlots(workspaceData.data["isShared"]);
    if (workspaceData && workspaceData.data["isShared"])
      loadWorkspaceStatsToDM(
        workspaceData.data["isShared"],
        JSON.parse(workspaceData.data["state"])
      );
  };

  const getWorkspace = async () => {
    let workspaceData;
    try {
      workspaceData = await axios.post(
        "/api/getWorkspace",
        {
          experimentId: props.experimentId,
        },
        {
          headers: {
            token: userManager.getToken(),
          },
        }
      );
      if (workspaceData.data["state"])
        await loadWorkspaceStatsToDM(
          false,
          JSON.parse(workspaceData.data["state"])
        );
    } catch (e) {
      snackbarService.showSnackbar(
        "Could not verify the workspace, reload the page and try again!",
        "error"
      );
    }
    initPlots();
  };

  useEffect(() => {
    dataManager.setExperimentId(props.experimentId);

    let workspaceId = new URLSearchParams(location.search).get("id");
    if (workspaceId) {
      verifyWorkspace(workspaceId);
    } else {
      getWorkspace();
    }

    var downloadedListner = dataManager.addObserver("updateDownloaded", () => {
      setDownloadedFiles(dataManager.downloaded);
      if (
        importFlowJo &&
        dataManager.files.length == dataManager.downloaded.length
      ) {
        initiateParseFlowJo(flowJoJson);
        importFlowJo = false;
        flowJoJson = {};
      }
    });

    var downloadingListner = dataManager.addObserver(
      "updateDownloadingFiles",
      () => {
        setDownloadingFiles(dataManager.downloadingFiles);
      }
    );

    // let updateWorkspaceListner = dataManager.addObserver(
    //   "updateWorkspace",
    //   () => {
    //     if (dataManager.letUpdateBeCalledForAutoSave) {
    //       autoSaveWorkspace();
    //     }
    //   }
    // );

    dataManager.letUpdateBeCalledForAutoSave = true;
    return () => {
      setWorkspaceAlready = false;
      dataManager.clearWorkspace();
      setDownloadedFiles([]);
      setDownloadingFiles([]);
      //dataManager.removeObserver("updateWorkspace", updateWorkspaceListner);
      dataManager.removeObserver("updateDownloadingFiles", downloadingListner);
      dataManager.removeObserver("updateDownloaded", downloadedListner);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const autoSaveWorkspace = () => {
    if (!workspaceSharedLocal) {
      setSavingWorkspace(true);
      saveWorkspace();
    }
  };

  const initPlots = async (workSpaceShared: boolean = false) => {
    if (observerAdded === false) {
      setObserverAdded(true);
      dataManager.addObserver(
        "addNewGateToWorkspace",
        (e: any) => {
          if (!importFlowJo) getNameAndOpenModal(e);
        },
        true
      );
    }
    if (props.experimentId !== undefined && !setWorkspaceAlready) {
      setWorkspaceAlready = true;
      dataManager.setWorkspaceID(props.experimentId);
      dataManager.addObserver("setWorkspaceLoading", () => {
        const isLoading = dataManager.isWorkspaceLoading();
        setLoading(isLoading);
        if (!isLoading) {
          setLoadModal(false);
        }
      });
    }

    if (
      !workSpaceShared &&
      process.env.REACT_APP_ENFORCE_LOGIN_TO_ANALYSE === "true" &&
      !isLoggedIn
    ) {
      history.push("/login");
    }

    await dataManager.downloadFileMetadata();

    setInitPlot(true);
  };

  const classes = useStyles();
  const [loading, setLoading] = React.useState(false);

  const upsertWorkSpace = (isShared: boolean = false) => {
    setSavingWorkspace(true);
    let stateJson = dataManager.getWorkspaceJSON();
    const updateWorkSpace = WorkspacesApiFetchParamCreator({
      accessToken: userManager.getToken(),
    }).upsertWorkSpace(userManager.getToken(), {
      experimentId: props.experimentId,
      state: stateJson,
      isShared: isShared,
    });
    axios
      .post(
        updateWorkSpace.url,
        updateWorkSpace.options.body,
        updateWorkSpace.options
      )
      .then((e) => {
        setNewWorkspaceId(e.data.workspaceId);
        setSavingWorkspace(false);
        // snackbarService.showSnackbar("Workspace saved!", "success");
      })
      .catch((e) => {
        setSavingWorkspace(false);
        snackbarService.showSnackbar(
          "Could not save the workspace, reload the page and try again!",
          "error"
        );
      });
  };

  // == General modal logic ==
  const handleOpen = (func: Function) => {
    func(true);
  };
  const handleClose = (func: Function) => {
    func(false);
  };

  // == Add file modal logic ==
  const [linkShareModalOpen, setLinkShareModalOpen] = React.useState(false);
  const [addFileModalOpen, setAddFileModalOpen] = React.useState(false);
  const [generateReportModalOpen, setGenerateReportModalOpen] =
    React.useState(false);
  const [loadModal, setLoadModal] = React.useState(false);
  const [clearModal, setClearModal] = React.useState(false);

  const [observerAdded, setObserverAdded] = React.useState(false);
  const [gateToSend, setGateToSend] = React.useState(null);
  const [namePromptOpen, setNamePromptOpen] = React.useState(false);
  const [downloadedFiles, setDownloadedFiles] = React.useState([]);
  const [downloadingFiles, setDownloadingFiles] = React.useState([]);

  const getNameAndOpenModal = (gate: Gate) => {
    setNamePromptOpen(true);
    setGateToSend(gate);
  };

  const renameGate = (newName: String) => {
    dataManager.getGate(gateToSend[0].id).update({ name: newName });
    setNamePromptOpen(false);
    dataManager.workspaceUpdated();
    resetPlotSizes();
    dataManager
      .getAllPlots()
      .filter(
        (e) =>
          e.plot.gates.filter((g) => g.gate.id === gateToSend[0].id).length > 0
      )
      .forEach((e) => dataManager.getPlotRendererForPlot(e.plotID).draw());
  };

  var getFiles = async (isShared: boolean, fileIds: Array<string>) => {
    let url = isShared ? API_CALLS.sharedFileEvents : API_CALLS.fileEvents;
    let headers = isShared
      ? {}
      : {
          token: userManager.getToken(),
        };

    let datas = await axios.post(
      url,
      {
        experimentId: props.experimentId,
        fileIds: fileIds,
      },
      {
        headers: headers,
      }
    );

    return datas.data;
  };

  var loadWorkspaceStatsToDM = async (
    workspaceShared: boolean,
    workspaceStatearg: any
  ) => {
    if (workspaceStatearg) {
      setLoading(true);
      let workspaceStateReload = new WorkspaceStateHelper(workspaceStatearg);
      let stateFileIds = workspaceStateReload.getFileIds();
      if (stateFileIds && stateFileIds.length) {
        setDownloadingFiles(stateFileIds);
        let eventFiles = await getFiles(workspaceShared, stateFileIds);
        dataManager.updateDownloaded(eventFiles);
        if (!dataManager.ready()) {
          dataManager.createWorkspace();
        }
        for (let i = 0; i < eventFiles.length; i++) {
          workspaceStateReload.addFile(eventFiles[i]);
        }
        dataManager.loadWorkspace(JSON.stringify(workspaceStatearg));
      }
    }
    setLoading(false);
  };

  const handleDownLoadFileEvents = async (fileIds: any[]) => {
    dataManager.downloadFileEvents(fileIds);
  };

  const addFile = (index: number) => {
    if (!dataManager.ready()) {
      snackbarService.showSnackbar("Something went wrong, try again!", "error");
      return;
    }

    const file: any = remoteWorkspace
      ? downloadedFiles[index]
      : staticFiles[index];
    let newFile: FCSFile;

    newFile = new FCSFile({
      name: file.title,
      id: file.id,
      src: "remote",
      axes: file.channels.map((e: any) => e.value),
      data: file.events,
      plotTypes: file.channels.map((e: any) => e.display),
      remoteData: file,
    });
    const fileID = dataManager.addNewFileToWorkspace(newFile);
    const plot = new PlotData();
    plot.file = dataManager.getFile(fileID);
    plot.setupPlot();
    dataManager.addNewPlotToWorkspace(plot);
  };

  var onLinkShareClick = async () => {
    if (isLoggedIn) {
      upsertWorkSpace(true);
    } else if (sharedWorkspace) {
      let stateJson = dataManager.getWorkspaceJSON();
      let newWorkspaceDB;
      try {
        newWorkspaceDB = await axios.post(
          "/api/upsertSharedWorkspace",
          {
            workspaceId: newWorkspaceId,
            experimentId: props.experimentId,
            state: stateJson,
          },
          {}
        );
        setNewWorkspaceId(newWorkspaceDB.data);
      } catch (e) {
        snackbarService.showSnackbar(
          "Could not save shared workspace, reload the page and try again!",
          "error"
        );
      }
    }
    handleOpen(setLinkShareModalOpen);
  };

  const showFile = async (e: any) => {
    e.preventDefault();
    const reader = new FileReader();
    reader.onload = async (e) => {
      let text: any = e.target.result;
      var options = {
        compact: true,
        ignoreComment: true,
        alwaysChildren: true,
      };
      var result = XML.xml2json(text, options);
      console.log(result);
      result = JSON.parse(result);
      importFlowJo = true;
      setLoading(true);
      setFileUploadInputValue("");
      if (dataManager.files.length == downloadedFiles.length) {
        initiateParseFlowJo(result);
      } else {
        flowJoJson = result;
        let fileIds = dataManager.files.map((x) => x.id);
        handleDownLoadFileEvents(fileIds);
        snackbarService.showSnackbar(
          "File events are getting downloaded then import will happen!!",
          "warning"
        );
      }
    };
    reader.readAsText(e.target.files[0]);
  };

  const initiateParseFlowJo = async (flowJoJson: any) => {
    await parseFlowJoJson(flowJoJson);
    setTimeout(() => {
      setLoading(false);
      importFlowJo = false;
    }, 4000);
  };

  const getFileOrSkipThisSample = (filesUsed: any, channelsInfo: any) => {
    let files = dataManager.downloaded.filter((x) => !filesUsed.includes(x.id));
    let channels = channelsInfo.map((x: any) => {
      return `${x.channelName} - ${x.channelName}`;
    });
    let fileCanbeUsed = true;
    let fileId;
    for (let i = 0; i < files.length; i++) {
      let file = files[i];
      let axes = file.channels.map((x: any) => {
        let value = x.value;
        if (x.display == "bi") {
          value = value.replace("Comp-", "");
          return value;
        }
        return value;
      });
      for (let j = 0; j < axes.length; j++) {
        if (!channels.includes(axes[j])) {
          fileCanbeUsed = false;
          break;
        }
      }
      if (fileCanbeUsed) {
        fileId = file.id;
        break;
      }
    }

    return { fileId: fileId ? fileId : null };
  };

  const parseFlowJoJson = async (flowJoJson: any) => {
    let workspace = flowJoJson["Workspace"];
    let filesUsed: any = [];
    if (
      workspace &&
      workspace["SampleList"] &&
      workspace["SampleList"]["Sample"]
    ) {
      let sample = workspace["SampleList"]["Sample"];
      let samples = [];
      if (sample.length == undefined) samples.push(sample);
      else samples = sample;
      for (let i = 0; i < samples.length; i++) {
        let sampleNode = samples[i]["SampleNode"];
        let plot = new PlotData();

        let transformations = samples[i]["Transformations"];
        let channelsInfo: any = [];
        if (transformations) {
          let logTransformations = transformations["transforms:log"];
          if (logTransformations && logTransformations.length == undefined)
            logTransformations = [logTransformations];
          let linearTransformations = transformations["transforms:linear"];
          if (
            linearTransformations &&
            linearTransformations.length == undefined
          )
            linearTransformations = [linearTransformations];
          if (logTransformations && logTransformations.length > 0) {
            channelsInfo = channelsInfo.concat(
              parseChannels(logTransformations, "bi")
            );
          }
          if (linearTransformations && linearTransformations.length > 0) {
            channelsInfo = channelsInfo.concat(
              parseChannels(linearTransformations, "lin")
            );
          }
        }
        let fileObj = getFileOrSkipThisSample(filesUsed, channelsInfo);
        let fileId = fileObj.fileId;
        if (fileId) {
          filesUsed.push(fileId);
          let mainGraphAxis = sampleNode["Graph"]["Axis"];
          let xAxis = mainGraphAxis.find(
            (x: any) => x["_attributes"].dimension == "x"
          );
          let yAxis = mainGraphAxis.find(
            (x: any) => x["_attributes"].dimension == "y"
          );
          let xAxisName = xAxis["_attributes"].name;
          let yAxisName = yAxis["_attributes"].name;
          plot.xAxis = `${xAxisName} - ${xAxisName}`;
          plot.yAxis = `${yAxisName} - ${yAxisName}`;
          let xChannelInfo = channelsInfo.find(
            (x: any) => x.channelName == xAxisName
          );
          let yChannelInfo = channelsInfo.find(
            (x: any) => x.channelName == yAxisName
          );
          plot.setXAxisPlotType(xChannelInfo.type);
          plot.setYAxisPlotType(yChannelInfo.type);
          addNewPlot(plot, fileId);

          if (
            sampleNode["Subpopulations"] &&
            Object.keys(sampleNode["Subpopulations"]).length > 0
          ) {
            parseSubpopulation(
              plot,
              fileId,
              sampleNode["Subpopulations"],
              channelsInfo
            );
          }
        }
      }
    }
    for (let i = 0; i < flowJoPlots.length; i++) {
      dataManager.addNewPlotToWorkspace(flowJoPlots[i], false);
    }
  };

  const parseChannels = (transformations: any, type: string) => {
    let channelArray = [];
    for (let i = 0; i < transformations.length; i++) {
      let transformationAttributes = transformations[i]["_attributes"];

      let rangeMin;
      let rangeMax;
      if (type == "bi") {
        rangeMin = "0";
        rangeMax = Math.pow(
          10,
          parseFloat(transformationAttributes["transforms:decades"])
        ).toString();
      } else {
      }
      rangeMin = transformationAttributes["transforms:minRange"];
      rangeMax = transformationAttributes["transforms:maxRange"];
      let channelName =
        transformations[i]["data-type:parameter"]["_attributes"][
          "data-type:name"
        ];
      channelArray.push({
        channelName: channelName,
        rangeMin: rangeMin,
        rangeMax: rangeMax,
        type: type,
      });
    }
    return channelArray;
  };

  const [flowJoPlots, setFlowJoPlots] = useState([]);

  const addNewPlot = (plot: PlotData, fileID: string) => {
    plot.file = dataManager.getFile(fileID);
    plot.setupPlot(false);
    flowJoPlots.push(plot);
    setFlowJoPlots(flowJoPlots);
  };

  const parseSubpopulation = (
    plot: PlotData,
    fileId: string,
    subPopulation: any,
    channelsInfo: any
  ) => {
    let populations = subPopulation["Population"];
    if (populations) {
      if (populations.length == undefined) {
        populations = [populations];
      }

      for (let i = 0; i < populations.length; i++) {
        let newPlot = new PlotData();
        let population = populations[i];
        let graph = population["Graph"];
        let axis = graph["Axis"];
        let xAxis = axis.find((x: any) => x["_attributes"].dimension == "x");
        let yAxis = axis.find((x: any) => x["_attributes"].dimension == "y");
        let xAxisName = xAxis["_attributes"].name;
        let yAxisName = yAxis["_attributes"].name;
        newPlot.xAxis = `${xAxisName} - ${xAxisName}`;
        newPlot.yAxis = `${yAxisName} - ${yAxisName}`;
        let xChannelInfo = channelsInfo.find(
          (x: any) => x.channelName == xAxisName
        );
        let yChannelInfo = channelsInfo.find(
          (x: any) => x.channelName == yAxisName
        );
        newPlot.setXAxisPlotType(xChannelInfo.type);
        newPlot.setYAxisPlotType(yChannelInfo.type);

        if (population["Gate"]) {
          let gateAssign: PolygonGateState = {
            name: population["_attributes"].name,
            xAxis: `${xAxisName} - ${xAxisName}`,
            yAxis: `${yAxisName} - ${yAxisName}`,
            color: generateColor(),
            xAxisType: xChannelInfo.type,
            yAxisType: yChannelInfo.type,
            parents: [],
            points: [],
            xAxisOriginalRanges: [xChannelInfo.rangeMin, xChannelInfo.rangeMax],
            yAxisOriginalRanges: [yChannelInfo.rangeMin, yChannelInfo.rangeMax],
          };
          let polygonGate = new PolygonGate(gateAssign);
          let gate = population["Gate"];
          let gateType = Object.keys(gate).filter((x) => x != "_attributes")[0];
          parseGateType(
            gateType,
            gate,
            polygonGate,
            xChannelInfo,
            yChannelInfo
          );
          newPlot.population.push({ gate: polygonGate, inverseGating: false });
          plot.gates.push({
            gate: polygonGate,
            inverseGating: false,
            displayOnlyPointsInGate: false,
          });
          dataManager.addNewGateToWorkspace(polygonGate);
          addNewPlot(newPlot, fileId);
          if (population["Subpopulations"]) {
            parseSubpopulation(
              newPlot,
              fileId,
              population["Subpopulations"],
              channelsInfo
            );
          }
        }
      }
    }
  };

  const getRangeMinMaxIfPropertyNotThere = (
    attributes: any,
    property: string,
    returnValueIfPropertyNotFound: string
  ) => {
    if (property in attributes) {
      return attributes[property];
    }

    return returnValueIfPropertyNotFound;
  };

  const parseGateType = (
    gateType: string,
    gate: any,
    polygonGate: PolygonGate,
    xChannelInfo: any,
    yChannelInfo: any
  ) => {
    let gateDimensions: any;
    let xAxisDimension: any;
    let yAxisDimension: any;
    switch (gateType) {
      case COMMON_CONSTANTS.FLOW_JO.GATE_TYPE.RECTANGLE:
        let gateRectangle = gate[gateType];
        gateDimensions = gateRectangle["gating:dimension"];

        xAxisDimension = gateDimensions[0];
        yAxisDimension = gateDimensions[1];

        let xMax = getRangeMinMaxIfPropertyNotThere(
          xAxisDimension["_attributes"],
          "gating:max",
          xChannelInfo.rangeMax
        );
        let xMin = getRangeMinMaxIfPropertyNotThere(
          xAxisDimension["_attributes"],
          "gating:min",
          "0"
        );
        let yMax = getRangeMinMaxIfPropertyNotThere(
          yAxisDimension["_attributes"],
          "gating:max",
          yChannelInfo.rangeMax
        );
        let yMin = getRangeMinMaxIfPropertyNotThere(
          yAxisDimension["_attributes"],
          "gating:min",
          "0"
        );

        polygonGate.points.push({ x: xMin, y: yMin });
        polygonGate.points.push({ x: xMax, y: yMin });
        polygonGate.points.push({ x: xMax, y: yMax });
        polygonGate.points.push({ x: xMin, y: yMax });

        break;
      case COMMON_CONSTANTS.FLOW_JO.GATE_TYPE.ECLIPSE:
        break;
      case COMMON_CONSTANTS.FLOW_JO.GATE_TYPE.POLYGON:
        let gatePolygon = gate[gateType];

        gateDimensions = gatePolygon["gating:dimension"];

        let xAxisDimensionIndex = 0;
        let yAxisDimensionIndex = 1;

        xAxisDimension = gateDimensions[xAxisDimensionIndex];
        yAxisDimension = gateDimensions[yAxisDimensionIndex];

        let gateVertexs = gatePolygon["gating:vertex"];

        for (let i = 0; i < gateVertexs.length; i++) {
          let gateVertice = gateVertexs[i];
          let x =
            gateVertice["gating:coordinate"][xAxisDimensionIndex][
              "_attributes"
            ]["data-type:value"];
          let y =
            gateVertice["gating:coordinate"][yAxisDimensionIndex][
              "_attributes"
            ]["data-type:value"];
          polygonGate.points.push({ x: x, y: y });
        }

        break;
    }
  };

  return (
    <div
      style={{
        height: "100%",
        padding: 0,
      }}
    >
      {/* == MODALS == */}
      {initPlot ? (
        <div>
          <GateNamePrompt open={namePromptOpen} sendName={renameGate} />

          <AddFileModal
            open={addFileModalOpen}
            closeCall={{ f: handleClose, ref: setAddFileModalOpen }}
            isShared={sharedWorkspace}
            downloaded={downloadedFiles}
            downloading={downloadingFiles}
            filesMetadata={dataManager.files}
            onDownloadFileEvents={(fileIds) => {
              handleDownLoadFileEvents(fileIds);
            }}
            addFileToWorkspace={(index) => {
              addFile(index);
            }}
          />

          <GenerateReportModal
            open={generateReportModalOpen}
            closeCall={{ f: handleClose, ref: setGenerateReportModalOpen }}
          />

          <LinkShareModal
            open={linkShareModalOpen}
            workspaceId={newWorkspaceId}
            closeCall={{ f: handleClose, ref: setLinkShareModalOpen }}
          />
        </div>
      ) : null}

      <MessageModal
        open={loadModal}
        closeCall={{ f: handleClose, ref: setLoadModal }}
        message={
          <div>
            <h2>Loading workspace</h2>
            <h4 style={{ color: "#777" }}>
              Please wait, we are collecting your files from the servers...
            </h4>
            <CircularProgress style={{ marginTop: 20, marginBottom: 20 }} />
          </div>
        }
        noButtons={true}
      />

      <MessageModal
        open={clearModal}
        closeCall={{
          f: handleClose,
          ref: setClearModal,
        }}
        message={
          <div>
            <h2>Are you sure you want to delete the entire workspace?</h2>
            <p style={{ marginLeft: 100, marginRight: 100 }}>
              The links you've shared with "share workspace" will still work, if
              you want to access this in the future, make sure to store them.
            </p>
          </div>
        }
        options={{
          yes: () => {
            dataManager.clearWorkspace(true);
          },
          no: () => {
            handleClose(setClearModal);
          },
        }}
      />

      {/* == STATIC ELEMENTS == */}
      <SideMenus></SideMenus>

      {/* == NOTICES == */}
      <SmallScreenNotice />
      <PrototypeNotice experimentId={props.experimentId} />

      {/* == MAIN PANEL == */}
      <Grid
        style={{
          marginTop: 10,
          marginLeft: 0,
          marginRight: 0,
          justifyContent: "center",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <Grid
          style={{
            backgroundColor: "#fafafa",
            borderRadius: 10,
            marginLeft: 40,
            marginRight: 40,
            boxShadow: "2px 3px 3px #ddd",
          }}
        >
          {initPlot ? (
            <div>
              <Grid
                style={{
                  backgroundColor: "#66a",
                  paddingTop: 2,
                  paddingBottom: 6,
                  borderRadius: 10,
                  WebkitBorderBottomLeftRadius: 0,
                  WebkitBorderBottomRightRadius: 0,
                }}
                container
              >
                <Grid container>
                  {sharedWorkspace ? null : (
                    <Button
                      size="small"
                      variant="contained"
                      style={{
                        backgroundColor: "#fafafa",
                      }}
                      className={classes.topButton}
                      startIcon={<ArrowLeftOutlined style={{ fontSize: 15 }} />}
                      onClick={() => {
                        dataManager.letUpdateBeCalledForAutoSave = false;
                        history.goBack();
                      }}
                    >
                      Back
                    </Button>
                  )}

                  <Button
                    variant="contained"
                    size="small"
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
                    size="small"
                    onClick={() => handleOpen(setGenerateReportModalOpen)}
                    className={classes.topButton}
                    style={{
                      backgroundColor: "#fafafa",
                    }}
                  >
                    Generate report
                  </Button>
                  <HowToUseModal />
                  {/* Uncomment below to have a "print state" button */}

                  {props.poke === false ? (
                    sharedWorkspace ? null : (
                      <Button
                        variant="contained"
                        size="small"
                        onClick={() => upsertWorkSpace()}
                        className={classes.topButton}
                        style={{
                          backgroundColor: "#fafafa",
                        }}
                      >
                        {/* {savingWorkspace ? (
                          <div className={classes.savingProgress}>
                            <AutorenewRoundedIcon />
                          </div>
                        ) : (
                          <div className={classes.saved}>
                            <CheckCircleRoundedIcon />
                          </div>
                        )} */}
                        Save Workspace
                      </Button>
                    )
                  ) : null}

                  {props.poke === false ? (
                    <Button
                      variant="contained"
                      size="small"
                      onClick={() => handleOpen(setClearModal)}
                      className={classes.topButton}
                      style={{
                        backgroundColor: "#fafafa",
                      }}
                    >
                      Clear
                    </Button>
                  ) : null}
                  <Button
                    variant="contained"
                    size="small"
                    className={classes.topButton}
                    style={{
                      backgroundColor: "#fafafa",
                    }}
                    onClick={() => {
                      inputFile.current.click();
                    }}
                  >
                    <input
                      type="file"
                      id="file"
                      ref={inputFile}
                      value={fileUploadInputValue}
                      accept=".wsp"
                      style={{ display: "none" }}
                      onChange={(e) => {
                        showFile(e);
                      }}
                    />
                    Import Flow Jo
                  </Button>
                </Grid>
                {process.env.REACT_APP_NO_WORKSPACES === "true" ? null : (
                  <Grid
                    style={{
                      textAlign: "right",
                      paddingRight: 20,
                    }}
                  >
                    {props.poke === true ? (
                      <Button
                        variant="contained"
                        size="large"
                        onClick={() => onLinkShareClick()}
                        className={classes.topButton}
                        style={{
                          backgroundColor: "#fafafa",
                        }}
                      >
                        <ShareIcon
                          fontSize="small"
                          style={{
                            marginRight: 10,
                          }}
                        ></ShareIcon>
                        Share Workspace
                      </Button>
                    ) : null}
                  </Grid>
                )}
              </Grid>

              <Grid>
                {!loading ? (
                  <Plots
                    {...{
                      sharedWorkspace: sharedWorkspace,
                      experimentId: props.experimentId,
                    }}
                  ></Plots>
                ) : (
                  <Grid
                    container
                    style={{
                      height: 400,
                      backgroundColor: "#fff",
                      borderBottomLeftRadius: 10,
                      borderBottomRightRadius: 10,
                      textAlign: "center",
                    }}
                    justify="center"
                    alignItems="center"
                    alignContent="center"
                  >
                    <CircularProgress></CircularProgress>
                  </Grid>
                )}
              </Grid>
            </div>
          ) : (
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                padding: "100px",
              }}
            >
              <CircularProgress style={{ marginTop: 20, marginBottom: 20 }} />
            </div>
          )}
        </Grid>
      </Grid>
    </div>
  );
}

export default Workspace;
