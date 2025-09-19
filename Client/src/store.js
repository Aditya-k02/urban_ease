import { configureStore } from "@reduxjs/toolkit";
import CommonSpace from './Slices/CommonSpaceSlice.js';
import auth from './Slices/authSlice.js'
import IssueSlice from './Slices/IssueSlice.js';
import ManagerIssuesSlice from './Slices/ManagerIssuesSlice.js';
import WorkerTasksSlice from './Slices/WorkerTasksSlice.js';
import worker from './Slices/workerSlice.js';


export const store = configureStore({
  reducer: {
    CommonSpace,
    auth,
    Issue:IssueSlice,
    managerIssues: ManagerIssuesSlice,
    WorkerTasks: WorkerTasksSlice,
    worker
  },
});
