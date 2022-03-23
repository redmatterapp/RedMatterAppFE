import React, { useEffect } from "react";
import { CSVLink } from "react-csv";
import GetAppIcon from "@material-ui/icons/GetApp";
import { useHistory } from "react-router";
import { makeStyles } from "@material-ui/core/styles";
import { Button } from "@material-ui/core";
import Grid from "@material-ui/core/Grid";
import { snackbarService } from "uno-material-ui";
import CircularProgress from "@material-ui/core/CircularProgress";
import { green } from "@material-ui/core/colors";
import { ArrowLeftOutlined } from "@ant-design/icons";
import userManager from "Components/users/userManager";
import {
  saveWorkspaceStateToServer,
  saveWorkspaceToRemote,
} from "../utils/workspace";
import { Typography } from "antd";
import WorkspaceDispatch from "../workspaceRedux/workspaceDispatchers";
// import IOSSwitch from "../../Components/common/Switch";
import ShareIcon from "@material-ui/core/SvgIcon/SvgIcon";
import MessageModal from "./modals/MessageModal";
import AddFileModal from "./modals/AddFileModal";
import axios from "axios";
import { Debounce } from "../../services/Dbouncer";
import LinkShareModal from "./modals/linkShareModal";
import GateNamePrompt from "./modals/GateNamePrompt";
import { getWorkspace } from "graph/utils/workspace";
import { useSelector } from "react-redux";
import useDidMount from "hooks/useDidMount";
import {
  createDefaultPlotSnapShot,
  getPlotChannelAndPosition,
  formatEnrichedFiles,
  superAlgorithm,
} from "graph/mark-app/Helper";

const useStyles = makeStyles((theme) => ({
  header: {
    textAlign: "center",
  },
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
  downloadBtn: {
    marginLeft: 10,
    backgroundColor: "#fff",
    color: "#000",
  },
  downloadBtnLayout: {
    display: "flex",
    alignItems: "center",
    color: "#000",
    "&:hover": {
      color: "#000",
    },
  },
  topButton: {
    marginLeft: 10,
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
  sharedHeaderText: {
    width: "100%",
    textAlign: "center",
    paddingTop: "5px",
    fontSize: "19px",
    fontWeight: 500,
    color: "white",
  },
  backdrop: {
    zIndex: theme.zIndex.drawer + 1,
    color: "#fff",
  },
}));

interface Props {
  experimentId: string;
  sharedWorkspace: boolean;
  plotCallNeeded: boolean;
  renderPlotController: boolean;
  setRenderPlotController: React.Dispatch<React.SetStateAction<boolean>>;
  setPlotCallNeeded: React.Dispatch<React.SetStateAction<boolean>>;
}
const WorkspaceTopBarComponent = ({
  sharedWorkspace,
  experimentId,
  plotCallNeeded,
  renderPlotController,
  setRenderPlotController,
  setPlotCallNeeded,
}: Props) => {
  const classes = useStyles();
  const history = useHistory();
  const workspace = getWorkspace();
  const isLoggedIn = userManager.isLoggedIn();
  const [lastSavedTime, setLastSavedTime] = React.useState(null);
  const [savingWorkspace, setSavingWorkspace] = React.useState(false);
  const [addFileModalOpen, setAddFileModalOpen] = React.useState(false);
  const [clearModal, setClearModal] = React.useState(false);
  const [autoSaveEnabled, setAutoSaveEnabled] = React.useState(false);
  const [linkShareModalOpen, setLinkShareModalOpen] = React.useState(false);
  const [newWorkspaceId, setNewWorkspaceId] = React.useState("");
  const didMount = useDidMount();

  const headers = [
    { label: "File Name", key: "fileName" },
    { label: "Gate Name", key: "gateName" },
    { label: "Percentage", key: "percentage" },
    { label: "X Mean", key: "xMean" },
    { label: "Y Mean", key: "yMean" },
    { label: "X Median", key: "xMedian" },
    { label: "Y Median", key: "yMedian" },
  ];
  const [data, setData] = React.useState<any[]>([]);

  //@ts-ignore
  const plotLength = useSelector((state) => state.workspace.plots.length);

  useEffect(() => {
    if (didMount && plotLength === 0) {
      setRenderPlotController(true);
    }
  }, [plotLength]);

  const handleOpen = (func: Function) => {
    func(true);
  };

  const handleClose = (func: Function) => {
    func(false);
  };

  const handleCloseAndMakePlotControllerTrue = (func: Function) => {
    if (!renderPlotController) {
      setRenderPlotController(true);
    }
    setPlotCallNeeded(false);
    if (renderPlotController) {
      setPlotCallNeeded(true);
    }
    func(false);
  };

  const handleCloseClearWorkspace = (func: Function) => {
    if (!renderPlotController) {
      setRenderPlotController(true);
    }
    setPlotCallNeeded(false);
    if (renderPlotController) {
      setPlotCallNeeded(true);
    }
    func(false);
  };

  const saveWorkspace = async (
    shared: boolean = false,
    currentState: any = null
  ) => {
    setSavingWorkspace(true);
    setLastSavedTime(new Date().toLocaleString());
    try {
      await saveWorkspaceStateToServer(shared, experimentId, currentState);
    } catch (err) {
      await handleError(err);
    }
    setSavingWorkspace(false);
  };

  const handleError = async (error: any) => {
    if (
      error?.name === "Error" ||
      error?.message.toString() === "Network Error"
    ) {
      showMessageBox({
        message: "Connectivity Problem, please check your internet connection",
        saverity: "error",
      });
    } else if (error?.response) {
      if (error.response?.status == 401 || error.response.status == 419) {
        setTimeout(() => {
          userManager.logout();
          history.replace("/login");
        }, 3000);
        showMessageBox({
          message: "Authentication Failed Or Session Time out",
          saverity: "error",
        });
      }
    } else {
      showMessageBox({
        message: error?.message || "Request Failed. May be Time out",
        saverity: error.saverity || "error",
      });
    }
  };

  const showMessageBox = (response: any) => {
    switch (response.saverity) {
      case "error":
        snackbarService.showSnackbar(response?.message, "error");
        break;
      case "success":
        snackbarService.showSnackbar(response?.message, "success");
        break;
      default:
        break;
    }
  };

  var onLinkShareClick = async () => {
    if (isLoggedIn) {
      await saveWorkspace(true);
    } else if (sharedWorkspace) {
      let stateJson = JSON.stringify(workspace);
      let newWorkspaceDB;
      try {
        newWorkspaceDB = await axios.post(
          "/api/upsertSharedWorkspace",
          {
            workspaceId: newWorkspaceId,
            experimentId: experimentId,
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

  const downloadCSV = () => {
    let workspaceState = getWorkspace().workspaceState;
    // @ts-ignore
    const plots =
      workspaceState &&
      // @ts-ignore
      workspaceState?.files?.[getWorkspace()?.selectedFile]?.plots;
    let isSnapShotCreated = false;
    let copyOfFiles: any[] = getWorkspace().files;
    if (plots === null || plots === undefined) {
      const defaultFile = copyOfFiles?.[0];
      const { xAxisLabel, yAxisLabel, xAxisIndex, yAxisIndex } =
        getPlotChannelAndPosition(defaultFile);
      workspaceState = createDefaultPlotSnapShot(
        defaultFile?.id,
        experimentId,
        xAxisLabel,
        yAxisLabel,
        xAxisIndex,
        yAxisIndex
      );
      isSnapShotCreated = true;
    }

    let enrichedFiles: any[] = superAlgorithm(
      copyOfFiles,
      workspaceState,
      true
    );

    enrichedFiles = formatEnrichedFiles(enrichedFiles, workspaceState);
    const csvData = [];

    for (let fileIndex = 0; fileIndex < enrichedFiles.length; fileIndex++) {
      for (
        let statsIndex = 0;
        statsIndex < enrichedFiles[fileIndex].gateStats.length;
        statsIndex++
      ) {
        if (enrichedFiles[fileIndex]?.gateStats[statsIndex]?.percentage) {
          const stat = {
            fileName: enrichedFiles[fileIndex]?.label,
            gateName: enrichedFiles[fileIndex]?.gateStats[statsIndex]?.gateName,
            percentage:
              enrichedFiles[fileIndex]?.gateStats[statsIndex]?.percentage,
            xMean: enrichedFiles[fileIndex]?.gateStats[statsIndex]?.meanX,
            yMean: enrichedFiles[fileIndex]?.gateStats[statsIndex]?.meanY,
            xMedian: enrichedFiles[fileIndex]?.gateStats[statsIndex]?.medianX,
            yMedian: enrichedFiles[fileIndex]?.gateStats[statsIndex]?.medianY,
          };

          csvData.push(stat);
        }
      }
    }
    setData(csvData);
  };

  const _renderToolbar = () => {
    return (
      <Grid
        style={{
          position: "fixed",
          zIndex: 100,
          top: 64,
          backgroundColor: "white",
          paddingTop: 4,
          paddingBottom: 6,
          WebkitBorderBottomLeftRadius: 0,
          WebkitBorderBottomRightRadius: 0,
          minHeight: "43px",
        }}
        container
      >
        <Grid container>
          {workspace.editWorkspace ? (
            <span
              style={{
                display: "flex",
                justifyContent: "space-between",
                width: "100%",
                background: "white",
              }}
            >
              <div>
                <Button
                  disabled={!plotCallNeeded && !renderPlotController}
                  size="small"
                  variant="contained"
                  style={{
                    backgroundColor: "#fafafa",
                  }}
                  className={classes.topButton}
                  startIcon={<ArrowLeftOutlined style={{ fontSize: 15 }} />}
                  onClick={() => {
                    history.goBack();
                  }}
                >
                  Back
                </Button>

                <Button
                  variant="contained"
                  size="small"
                  onClick={() => handleOpen(setAddFileModalOpen)}
                  className={classes.topButton}
                  style={{
                    backgroundColor: "#fafafa",
                  }}
                  disabled={!!workspace?.selectedFile}
                >
                  Plot sample
                </Button>
                <Button
                  disabled={!plotCallNeeded && !renderPlotController}
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
                <Button
                  variant="contained"
                  size="small"
                  onClick={() => downloadCSV()}
                  className={classes.topButton}
                  style={{
                    backgroundColor: "#fafafa",
                  }}
                >
                  <CSVLink
                    headers={headers}
                    data={data}
                    filename="WorkspaceReport.csv"
                    className={classes.downloadBtnLayout}
                  >
                    <GetAppIcon
                      fontSize="small"
                      style={{ marginRight: 10 }}
                    ></GetAppIcon>
                    Download Stats
                  </CSVLink>
                </Button>
                <span>
                  <Button
                    disabled={!plotCallNeeded && !renderPlotController}
                    variant="contained"
                    size="small"
                    onClick={() => saveWorkspace()}
                    className={classes.topButton}
                    style={{
                      backgroundColor: "#fafafa",
                      width: 137,
                    }}
                  >
                    {savingWorkspace ? (
                      <CircularProgress style={{ width: 20, height: 20 }} />
                    ) : (
                      <Typography
                        style={{
                          color:
                            !plotCallNeeded && !renderPlotController
                              ? "rgba(0, 0, 0, 0.26)"
                              : "black",
                        }}
                      >
                        Save Workspace
                      </Typography>
                    )}
                  </Button>
                  {/*<FormControlLabel*/}
                  {/*  style={{*/}
                  {/*    marginLeft: 0,*/}
                  {/*    height: 20,*/}
                  {/*    marginTop: 4,*/}
                  {/*    color: "#333",*/}
                  {/*  }}*/}
                  {/*  label={"Autosave"}*/}
                  {/*  control={*/}
                  {/*    <IOSSwitch*/}
                  {/*      disabled={!plotCallNeeded && !renderPlotController}*/}
                  {/*      checked={autoSaveEnabled}*/}
                  {/*      onChange={() => setAutoSaveEnabled(!autoSaveEnabled)}*/}
                  {/*    />*/}
                  {/*  }*/}
                  {/*/>*/}
                </span>
                {lastSavedTime ? (
                  <span
                    style={{
                      height: "100%",
                      display: "inline-flex",
                    }}
                  >
                    <span
                      style={{
                        color: "#333",
                        fontStyle: "italic",
                      }}
                    >
                      saved at {lastSavedTime}
                    </span>
                  </span>
                ) : null}
              </div>
              <div>
                <Button
                  disabled={!plotCallNeeded}
                  variant="contained"
                  size="small"
                  onClick={() => onLinkShareClick()}
                  className={classes.topButton}
                  style={{
                    backgroundColor: "#fafafa",
                    marginRight: 10,
                  }}
                >
                  <ShareIcon fontSize="small" style={{ marginRight: 10 }} />
                  Share Workspace
                </Button>
              </div>
            </span>
          ) : (
            <span className={classes.sharedHeaderText}>Shared Workspace</span>
          )}
        </Grid>
      </Grid>
    );
  };

  const clearWorkStateFromServer = async () => {
    // let selectedFileID:any = getWorkspace()?.selectedFile;
    // const defaultFile = selectedFileID ? getWorkspace()?.files?.filter(file => file.id === selectedFileID)?.[0] : getWorkspace()?.files?.[0];
    // console.log(defaultFile);
    // console.log(selectedFileID);
    //  const {xAxisLabel, yAxisLabel, xAxisIndex, yAxisIndex} = getPlotChannelAndPosition(defaultFile);
    // const resetState = createDefaultPlotSnapShot(selectedFileID || defaultFile?.id, experimentId, xAxisLabel, yAxisLabel, xAxisIndex, yAxisIndex);
    WorkspaceDispatch.ResetWorkspaceExceptFiles();
    await saveWorkspace(false);
  };

  if (autoSaveEnabled) {
    if (plotCallNeeded) {
      Debounce(() => saveWorkspace(), 5000);
    }
  }
  const renderModal = () => {
    return (
      <>
        <GateNamePrompt />
        {workspace?.files?.length > 0 && (
          <AddFileModal
            open={addFileModalOpen}
            closeCall={{
              f: handleCloseAndMakePlotControllerTrue,
              ref: setAddFileModalOpen,
            }}
            isShared={sharedWorkspace}
            experimentId={experimentId}
            files={getWorkspace()?.files}
            selectedFile={getWorkspace()?.selectedFile}
          />
        )}
        <MessageModal
          open={clearModal}
          closeCall={{
            f: handleCloseClearWorkspace,
            ref: setClearModal,
          }}
          message={
            <div>
              <h2>Are you sure you want to delete the entire workspace?</h2>
              <p style={{ marginLeft: 100, marginRight: 100 }}>
                The links you've shared with "share workspace" will still work,
                if you want to access this in the future, make sure to store
                them.
              </p>
            </div>
          }
          options={{
            yes: () => {
              clearWorkStateFromServer();
            },
            no: () => {
              handleClose(setClearModal);
            },
          }}
        />

        <LinkShareModal
          open={linkShareModalOpen}
          workspaceId={newWorkspaceId}
          closeCall={{ f: handleClose, ref: setLinkShareModalOpen }}
        />
      </>
    );
  };

  const renderToolBarUI = () => {
    return (
      <>
        {/* == MODALS == */}
        {renderModal()}
        {/* == MAIN PANEL == */}
        {_renderToolbar()}
      </>
    );
  };

  return renderToolBarUI();
};

export default WorkspaceTopBarComponent;
