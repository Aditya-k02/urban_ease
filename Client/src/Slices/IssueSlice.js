import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";

// Fetch resident's issues
export const fetchIssues = createAsyncThunk(
  "issue/fetchIssues",
  async (_, { rejectWithValue }) => {
    try {
      const res = await fetch("http://localhost:3000/resident/issue/data", {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to fetch issues");
      const data = await res.json();
      return data.issues || [];
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

// Raise a new issue
export const raiseIssue = createAsyncThunk(
  "issue/raiseIssue",
  async (issueData, { rejectWithValue }) => {
    try {
      const res = await fetch("http://localhost:3000/resident/issue/raise", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(issueData),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || "Failed to raise issue");
      return data.issue;
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

// Approve (confirm) an issue
export const approveIssue = createAsyncThunk(
  "issue/approveIssue",
  async (issueId, { rejectWithValue }) => {
    try {
      const res = await fetch(`http://localhost:3000/resident/issue/confirmIssue/${issueId}`, {
        method: "POST",
        credentials: "include",
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || "Failed to approve issue");
      return issueId;
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

// Reject an issue resolution
export const rejectIssue = createAsyncThunk(
  "issue/rejectIssue",
  async (issueId, { rejectWithValue }) => {
    try {
      const res = await fetch(`http://localhost:3000/resident/issue/rejectIssueResolution/${issueId}`, {
        method: "POST",
        credentials: "include",
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || "Failed to reject issue");
      return issueId;
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

// Submit feedback for a closed Resident issue
export const submitFeedback = createAsyncThunk(
  "issue/submitFeedback",
  async ({ id, feedback, rating }, { rejectWithValue }) => {
    try {
      const res = await fetch("http://localhost:3000/resident/issue/submitFeedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ id, feedback, rating }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || "Failed to submit feedback");
      return { id, feedback, rating };
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

const IssueSlice = createSlice({
  name: "Issue",
  initialState: {
    issues: [],
    loading: false,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchIssues.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchIssues.fulfilled, (state, action) => {
        state.loading = false;
        state.issues = action.payload;
      })
      .addCase(fetchIssues.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(raiseIssue.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(raiseIssue.fulfilled, (state, action) => {
        state.loading = false;
        if (action.payload) state.issues.unshift(action.payload);
      })
      .addCase(raiseIssue.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(approveIssue.fulfilled, (state, action) => {
        state.issues = state.issues.map(issue =>
          issue._id === action.payload ? { ...issue, status: "Closed" } : issue
        );
      })
      .addCase(rejectIssue.fulfilled, (state, action) => {
        state.issues = state.issues.map(issue =>
          issue._id === action.payload ? { ...issue, status: "Reopened" } : issue
        );
      })
      .addCase(submitFeedback.fulfilled, (state, action) => {
        state.issues = state.issues.map(issue =>
          issue._id === action.payload.id
            ? { ...issue, feedback: action.payload.feedback, rating: action.payload.rating, status: "Payment Pending" }
            : issue
        );
      });
  },
});

export default IssueSlice.reducer;