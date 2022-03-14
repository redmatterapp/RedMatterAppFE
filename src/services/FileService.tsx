import axios from "axios";
import userManager from "Components/users/userManager";
import { ExperimentFilesApiFetchParamCreator } from "api_calls/nodejsback";
import { getFile, getWorkspace } from "graph/utils/workspace";
import { store } from "redux/store";
import { File, FileID, Workspace } from "graph/resources/types";
import { createFile } from "graph/resources/files";
import WorkspaceDispatch from "graph/workspaceRedux/workspaceDispatchers";
import {file} from "@babel/types";

const EVENTS_LIMIT = 4000;

export const downloadFileMetadata = async (
  workspaceIsShared: boolean,
  experimentId: string
): Promise<any[]> => {
  let params;
  if (workspaceIsShared) {
    params = ExperimentFilesApiFetchParamCreator(
      {}
    ).experimentFilesWithoutToken(experimentId);
  } else {
    params = ExperimentFilesApiFetchParamCreator({
      accessToken: userManager.getToken(),
    }).experimentFiles(
      userManager.getOrganiztionID(),
      experimentId,
      userManager.getToken()
    );
  }
  //@ts-ignore

  const response = await axios.get(params.url, params.options);

  const files = response.data.files;
  const workspace: Workspace = store.getState().workspace;
  let newFilesIds: FileID[] = [];
  let allFiles: File[] = [];
  for (let newFile of files) {
    let file: any = {};
    file.createdOn = new Date(newFile.createdOn);
    file.name = file.label = newFile.label;
    file.experimentId = newFile.experimentId;
    file.fileSize = newFile.fileSize;
    file.eventCount = newFile.eventCount;
    if (newFile.id in workspace.files.map((e: File) => e.id)) {
      file = { ...getFile(newFile.id), ...file };
    } else {
      file.downloaded = false;
      file.id = newFile.id;
    }
    allFiles.push(file);
    newFilesIds.push(file.id);
  }
  WorkspaceDispatch.SetFiles(allFiles);
  return newFilesIds;
  //return  allFiles;
};

export const downloadFileEvent = async (
  workspaceIsShared: boolean,
  targetFiles: string | string[],
  experimentId: string,
  showNotifications: boolean = true,
  retry: number = 3
): Promise<FileID | FileID[]> => {
  // let notification: Notification;
  // if (showNotifications) {
  //   notification = new Notification("Downloading files");
  // }
  try {
    let files: FileID[] = [];
    if (typeof targetFiles === "string") {
      files = [targetFiles];
    } else {
      files = targetFiles;
    }

    const workspace = getWorkspace();

    for (const fileId of files) {
      const fileQuery = workspace.files.filter((e) => e.id === fileId);
      if (fileQuery.length > 1) {
        throw Error("DUPLICATE-FILE:Multiple files with the same ID present in workspace");
      }
      if (fileQuery.length > 0 && fileQuery[0].downloaded) {
        throw Error("DOWNLOADED-FILE:File already downloaded");
      }
    }
    let downloadingFiles: File[] = files.map((e) => getFile(e));
    downloadingFiles.forEach((e) => {
      e.downloading = true;
    });

    let response;
    let payload: {
      experimentId: string;
      fileIds: string[];
      isShared?: boolean;
      organisationId?: string;
    } = {
      experimentId: experimentId,
      fileIds: files,
    };

    if (workspaceIsShared) {
      payload = { ...payload, isShared: true };
    } else {
      payload = {
        ...payload,
        organisationId: userManager.getOrganiztionID(),
      };
    }

    let token = null;
    try {
      if (!workspaceIsShared) token = userManager.getToken();
    } catch {}

    let headers = {};
    if (token) headers = { token };

    response = await axios.post("/api/events", payload, { headers });

   // console.log(response);

    // if (showNotifications && notification !== null) notification.killNotification();
    // if(response?.data?.length <= 0) throw new Error("Missing Data");

    response.data = response.data.map((e: any) => {
      if (e.events.length > EVENTS_LIMIT) {
        e.events = e.events.slice(0, EVENTS_LIMIT);
      }
      return e;
    });
    const newFileArray = [];
    let killNoti = false;
    for (const file of response.data) {
      let newFile = await createFile({
        //@ts-ignore
        requestData: file,
        //@ts-ignore
        id: file.id,
      });
      //@ts-ignore
      newFile = { ...newFile, ...getFile(file.id) };
      newFile.downloaded = true;
      newFile.downloading = false;
      newFileArray.push(newFile);
      killNoti = true;
    }
    WorkspaceDispatch.SetFiles(newFileArray);
    if (typeof targetFiles === "string") {
      return targetFiles;
    } else {
      return files;
    }
  } catch (err:any){
    // if (showNotifications) {
    //   notification.killNotification();
    // }
    if (err && err?.name === "Error" || err?.message.toString() === "Network Error") throw err;

    if (retry > 0) {
      downloadFileEvent(
        workspaceIsShared,
        targetFiles,
        experimentId,
        (showNotifications = true),
        retry - 1
      );
    } else {
      // if (showNotifications) {
      //   notification.killNotification();
      // }
      throw Error("RETRY-FAILED:File was not downloaded");
    }
  }
};

export const dowloadAllFileEvents = async (
  workspaceIsShared?: boolean,
  experimentId?: string,
  batch?: string[]
) => {
  if (!workspaceIsShared) workspaceIsShared = false;
  if (!experimentId)
    experimentId = store.getState().user.experiment.experimentId;
  let files: string[] = [];
  const workspace = getWorkspace();
  if (workspace.files.length === 0)
    throw Error(
      "FILE-MISSING:Some pre-requirement data is not properly loaded"
    );
  if (batch) {
    files = workspace.files
      .filter((e) => !e.downloaded && batch.includes(e.id))
      .map((e) => e.id);
  } else {
    const workspace = getWorkspace();
    files = workspace.files.filter((e) => !e.downloaded).map((e) => e.id);
  }

  try {
    return await downloadFileEvent(workspaceIsShared, files, experimentId);
  } catch (e) {
    throw e;
  }
};

export const downloadEvents = async (
  workspaceIsShared?: boolean,
  experimentId?: string,
  batch?: string[]
) => {
  if (!workspaceIsShared) workspaceIsShared = false;
  if (!experimentId)
    experimentId = store.getState().user.experiment.experimentId;
  let files: string[] = [];
  const workspace = getWorkspace();
  if (workspace.files.length === 0)
    throw Error(
      "FILE-MISSING:Some pre-requirement data is not properly loaded"
    );
  if (batch) {
    files = workspace.files
      .filter((e) => !e.downloaded && batch.includes(e.id))
      .map((e) => e.id);
  } else {
    const workspace = getWorkspace();
    files = workspace.files.filter((e) => !e.downloaded).map((e) => e.id);
  }
  try {
    return await downloadEvent(workspaceIsShared, files, experimentId);
  } catch (e) {
    throw e;
  }
};

export const downloadEvent = async (
    workspaceIsShared: boolean,
    targetFiles: string | string[],
    experimentId: string,
    showNotifications: boolean = true,
    retry: number = 3
): Promise<any | any[]> => {
  try {
    let files: FileID[] = [];
    if (typeof targetFiles === "string") {
      files = [targetFiles];
    } else {
      files = targetFiles;
    }

    const workspace = getWorkspace();
    for (const fileId of files) {
      const fileQuery = workspace.files.filter((e) => e.id === fileId);
      if (fileQuery.length > 1) {
        throw Error("DUPLICATE-FILE:Multiple files with the same ID present in workspace");
      }
      if (fileQuery.length > 0 && fileQuery[0].downloaded) {
        throw Error("DOWNLOADED-FILE:File already downloaded");
      }
    }

    let response;
    let payload: {
      experimentId: string;
      //fileIds: string[];
      isShared?: boolean;
      organisationId?: string;
    } = {
      experimentId: experimentId,
      //fileIds: files,
    };

    if (workspaceIsShared) {
      payload = { ...payload, isShared: true };
    } else {
      payload = {
        ...payload,
        organisationId: userManager.getOrganiztionID(),
      };
    }

    let token = null;
    try {
      if (!workspaceIsShared) token = userManager.getToken();
    } catch {}

    let headers = {};
    if (token) headers = { token };

    response = await axios.post("/api/file-events", payload, { headers });

    const newFileArray = [];
    for (const fileId of Object.keys(response.data.files)) {
      const remoteFile = response.data.files[fileId];
      let newFile = {...getFile(fileId), ...remoteFile};
      newFile.downloaded = true;
      newFile.downloading = false;
      newFileArray.push(newFile);
    }
    WorkspaceDispatch.SetFiles(newFileArray);
    return files;
  } catch (err:any){
    if (err && err?.name === "Error" || err?.message.toString() === "Network Error") throw err;
    if (retry > 0) {
      downloadEvent(
          workspaceIsShared,
          targetFiles,
          experimentId,
          (showNotifications = true),
          retry - 1
      );
    } else {
      throw Error("RETRY-FAILED:File was not downloaded");
    }
  }
};

