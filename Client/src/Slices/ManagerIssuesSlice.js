import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";

const API = "http://localhost:3000/manager/issue";

// GET: manager issues + analytics
export const fetchManagerIssues = createAsyncThunk(
  "managerIssues/fetchManagerIssues",
  async (_, { rejectWithValue }) => {
    try {
      const res = await fetch(`${API}/myIssues`, { credentials: "include" });
      
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.message || `HTTP ${res.status}`);
      }
      
      const data = await res.json();
      
      if (!data.success) {
        throw new Error(data.message || "Failed to fetch issues");
      }

      const issues = [...(data.residentIssues || []), ...(data.communityIssues || [])];
      console.log("Fetched manager issues 555555:", issues);
      return {
        issues,
        analytics: data.analytics || null,
        groupedCommunityIssues: data.groupedCommunityIssues || {},
      };
    } catch (err) {
      console.error("fetchManagerIssues error:", err);
      return rejectWithValue(err.message || "Failed to fetch issues");
    }
  }
);

// GET: issue details by id
export const fetchIssueDetails = createAsyncThunk(
  "managerIssues/fetchIssueDetails",
  async (id, { rejectWithValue }) => {
    try {
      const res = await fetch(`${API}/${id}`, { credentials: "include" });
      
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.message || `HTTP ${res.status}`);
      }
      
      const data = await res.json();
      
      if (!data.success) {
        throw new Error(data.message || "Failed to fetch issue");
      }
      
      return data.issue;
    } catch (err) {
      console.error("fetchIssueDetails error:", err);
      return rejectWithValue(err.message || "Failed to fetch issue details");
    }
  }
);

// POST: assign issue (first time - only if no auto-assignment)
export const assignManagerIssue = createAsyncThunk(
  "managerIssues/assignManagerIssue",
  async ({ id, worker, deadline, remarks }, { rejectWithValue }) => {
    try {
      const res = await fetch(`${API}/assign/${id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ worker, deadline, remarks }),
      });
      
      const data = await res.json();
      
      if (!res.ok || !data.success) {
        throw new Error(data.message || "Assign failed");
      }
      
      return data.issue;
    } catch (err) {
      console.error("assignManagerIssue error:", err);
      return rejectWithValue(err.message || "Failed to assign worker");
    }
  }
);

// POST: reassign (handles auto-assigned + rejected, or manual changes)
export const reassignManagerIssue = createAsyncThunk(
  "managerIssues/reassignManagerIssue",
  async ({ id, newWorker, deadline, remarks }, { rejectWithValue }) => {
    try {
      const res = await fetch(`${API}/reassign/${id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ newWorker, deadline, remarks }),
      });
      
      const data = await res.json();
      
      if (!res.ok || !data.success) {
        throw new Error(data.message || "Reassign failed");
      }
      
      return data.issue;
    } catch (err) {
      console.error("reassignManagerIssue error:", err);
      return rejectWithValue(err.message || "Failed to reassign worker");
    }
  }
);

// POST: close issue
export const closeManagerIssue = createAsyncThunk(
  "managerIssues/closeManagerIssue",
  async ({ id }, { rejectWithValue }) => {
    try {
      const res = await fetch(`${API}/close/${id}`, {
        method: "POST",
        credentials: "include",
      });
      
      const data = await res.json();
      
      if (!res.ok || !data.success) {
        throw new Error(data.message || "Close failed");
      }
      
      return { id, status: "Closed" };
    } catch (err) {
      console.error("closeManagerIssue error:", err);
      return rejectWithValue(err.message || "Failed to close issue");
    }
  }
);

// GET: fetch rejected (auto-assigned but resident rejected) issues
export const fetchRejectedIssues = createAsyncThunk(
  "managerIssues/fetchRejectedIssues",
  async (_, { rejectWithValue }) => {
    try {
      const res = await fetch(`${API}/rejected/pending`, { credentials: "include" });
      
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.message || `HTTP ${res.status}`);
      }
      
      const data = await res.json();
      
      if (!data.success) {
        throw new Error(data.message || "Failed to fetch rejected issues");
      }
      
      return data.issues || [];
    } catch (err) {
      console.error("fetchRejectedIssues error:", err);
      return rejectWithValue(err.message || "Failed to fetch rejected issues");
    }
  }
);

// GET: workers for assignment
export const fetchWorkers = createAsyncThunk(
  "managerIssues/fetchWorkers",
  async (_, { rejectWithValue }) => {
    try {
      const res = await fetch("http://localhost:3000/manager/workers", { credentials: "include" });
      
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.message || `HTTP ${res.status}`);
      }
      
      const data = await res.json();
      
      if (!data.success) {
        throw new Error(data.message || "Failed to fetch workers");
      }
      
      return data.workers || [];
    } catch (err) {
      console.error("fetchWorkers error:", err);
      return rejectWithValue(err.message || "Failed to fetch workers");
    }
  }
);

const initialState = {
  issues: [],
  rejectedIssues: [],
  analytics: null,
  groupedCommunityIssues: {},
  issueDetails: null,
  workers: [],
  loading: false,
  rejectedLoading: false,
  workersLoading: false,
  error: null,
};

const managerIssuesSlice = createSlice({
  name: "managerIssues",
  initialState,
  reducers: {
    clearIssueDetails: (state) => {
      state.issueDetails = null;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // fetch list
      .addCase(fetchManagerIssues.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchManagerIssues.fulfilled, (state, action) => {
        state.loading = false;
        state.issues = action.payload.issues || [];
        state.analytics = action.payload.analytics;
        state.groupedCommunityIssues = action.payload.groupedCommunityIssues;
      })
      .addCase(fetchManagerIssues.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Failed to fetch issues";
        state.issues = [];
      })

      // fetch details
      .addCase(fetchIssueDetails.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchIssueDetails.fulfilled, (state, action) => {
        state.loading = false;
        state.issueDetails = action.payload;
      })
      .addCase(fetchIssueDetails.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // assign
      .addCase(assignManagerIssue.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(assignManagerIssue.fulfilled, (state, action) => {
        state.loading = false;
        const updated = action.payload;
        const idx = state.issues.findIndex((i) => i._id === updated._id);
        if (idx !== -1) {
          state.issues[idx] = { ...state.issues[idx], ...updated };
        } else {
          state.issues.unshift(updated);
        }
      })
      .addCase(assignManagerIssue.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Failed to assign worker";
      })

      // reassign
      .addCase(reassignManagerIssue.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(reassignManagerIssue.fulfilled, (state, action) => {
        state.loading = false;
        const updated = action.payload;
        const idx = state.issues.findIndex((i) => i._id === updated._id);
        if (idx !== -1) {
          state.issues[idx] = { ...state.issues[idx], ...updated };
        }
      })
      .addCase(reassignManagerIssue.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Failed to reassign worker";
      })

      // close
      .addCase(closeManagerIssue.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(closeManagerIssue.fulfilled, (state, action) => {
        state.loading = false;
        const { id, status } = action.payload;
        const idx = state.issues.findIndex((i) => i._id === id);
        if (idx !== -1) {
          state.issues[idx].status = status;
        }
      })
      .addCase(closeManagerIssue.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Failed to close issue";
      })

      // fetch rejected issues (auto-assigned but resident rejected)
      .addCase(fetchRejectedIssues.pending, (state) => {
        state.rejectedLoading = true;
      })
      .addCase(fetchRejectedIssues.fulfilled, (state, action) => {
        state.rejectedLoading = false;
        state.rejectedIssues = action.payload || [];
      })
      .addCase(fetchRejectedIssues.rejected, (state, action) => {
        state.rejectedLoading = false;
        state.rejectedIssues = [];
      })

      // fetch workers
      .addCase(fetchWorkers.pending, (state) => {
        state.workersLoading = true;
      })
      .addCase(fetchWorkers.fulfilled, (state, action) => {
        state.workersLoading = false;
        state.workers = action.payload || [];
      })
      .addCase(fetchWorkers.rejected, (state, action) => {
        state.workersLoading = false;
        state.workers = [];
      });
  },
});

export const { clearIssueDetails, clearError } = managerIssuesSlice.actions;
export default managerIssuesSlice.reducer;