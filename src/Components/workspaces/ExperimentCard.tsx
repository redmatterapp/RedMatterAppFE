import React, { useEffect } from "react";
import { NavLink } from "react-router-dom";
import { snackbarService } from "uno-material-ui";
import axios from "axios";
import userManager from "Components/users/userManager";
import Alert from "@material-ui/lab/Alert";
import {
  Grid,
  Card,
  CardActions,
  CardContent,
  Button,
  Typography,
  Tooltip,
} from "@material-ui/core";

import DeleteIcon from "@material-ui/icons/Delete";
import EditIcon from "@material-ui/icons/Edit";

import { getHumanReadableTimeDifference } from "utils/time";
import { ExperimentApiFetchParamCreator } from "api_calls/nodejsback";
import MessageModal from "graph/components/modals/MessageModal";

const styles = {
  title: {
    fontSize: 14,
    color: "#222",
  },
};

export default function ExperimentCard(props: { data: any; update: Function }) {
  const [files, setFiles] = React.useState([]);
  const [initLoading, setInitLoading] = React.useState(true);
  const getTimeCal = (date: string) => {
    return getHumanReadableTimeDifference(new Date(date), new Date());
  };

  const deleteExperiment = () => {
    const fetchArgs = ExperimentApiFetchParamCreator({
      accessToken: userManager.getToken(),
    }).deleteExperiment(props.data.id, userManager.getToken());
    axios
      .delete(fetchArgs.url, fetchArgs.options)
      .then((e) => {
        snackbarService.showSnackbar("Experiment deleted", "success");
        props.update();
      })
      .catch((e) => {
        snackbarService.showSnackbar(
          "Failure deleting experiment, refresh the page and try again!",
          "error"
        );
        userManager.logout();
      });
  };

  const [open, setOpen] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState("");
  const [deleteConfirmModal, setDeleteConfirmModal] = React.useState(false);
  const [editodal, setEditodal] = React.useState(false);

  const handleClick = () => {
    setOpen(true);
  };

  const handleClose = (
    event: React.SyntheticEvent | React.MouseEvent,
    reason?: string
  ) => {
    if (reason === "clickaway") {
      return;
    }

    setOpen(false);
  };

  return (
    <Grid
      style={{
        padding: 5,
      }}
      xs={6}
      md={4}
      lg={3}
    >
      <MessageModal
        open={deleteConfirmModal}
        closeCall={{
          f: handleClose,
          ref: setDeleteConfirmModal,
        }}
        message={<h2>Are you sure you want to delete this experiment?</h2>}
        options={{
          yes: () => {
            setDeleteConfirmModal(false);
            deleteExperiment();
          },
          no: () => {
            setDeleteConfirmModal(false);
          },
        }}
      />
      <Grid item>
        <Card>
          <NavLink
            to={{
              pathname: `/experiment/${props.data.id}`,
              state: { experimentName: props.data.name },
            }}
          >
            <CardContent style={{ margin: 0, padding: 0, textAlign: "center" }}>
              <div
                style={{
                  backgroundColor: "#6666AA",
                  borderRadius: 10,
                  borderBottomLeftRadius: 0,
                  borderBottomRightRadius: 0,
                }}
              >
                <Typography
                  style={{
                    fontWeight: "bold",
                    color: "#fff",
                    marginBottom: "5px",
                    fontSize: 18,
                    padding: 5,
                  }}
                  color="textPrimary"
                  align="center"
                  gutterBottom
                  noWrap
                >
                  {props.data.name}
                </Typography>
              </div>
              <div>
                <Typography
                  style={styles.title}
                  color="textSecondary"
                  gutterBottom
                >
                  Source: {props.data.source}
                </Typography>
                <Typography
                  style={styles.title}
                  color="textSecondary"
                  gutterBottom
                >
                  {getTimeCal(props.data.createdOn)}
                </Typography>
                <Typography
                  style={styles.title}
                  color="textSecondary"
                  gutterBottom
                >
                  {props.data.isPrivate ? "Private" : "Public"}
                </Typography>
                <Typography
                  style={styles.title}
                  color="textSecondary"
                  gutterBottom
                >
                  {props.data.fileCount} files
                </Typography>
              </div>
            </CardContent>
          </NavLink>
          <CardActions style={{ display: "flex", justifyContent: "center" }}>
            <Tooltip title="Delete experiment">
              <Button
                size="small"
                color="secondary"
                startIcon={<DeleteIcon />}
                variant="outlined"
                onClick={() => setDeleteConfirmModal(true)}
              >
                Delete
              </Button>
            </Tooltip>
          </CardActions>
        </Card>
      </Grid>
    </Grid>
  );
}
