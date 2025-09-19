import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";


const initialState = {
  Worker:[],
  Issues:[],
  loading: false,
  error: null,
};




const WorkerSlice = createSlice({
  name: "CommonSpace",
  initialState,
  reducers: {
    setDashboardData: (state, action) => {
      state.DashboardData = action.payload;
    },
    setIssues: (state, action) => {
      state.Issues = action.payload;
    },
  }
});


export const { setDashboardData,setIssues } = WorkerSlice.actions;

export default WorkerSlice.reducer;