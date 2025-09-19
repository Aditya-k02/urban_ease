import React, { useState, useEffect } from "react";
import Header from "./Header";
import SearchBar from "./SearchBar";
import AdminTable from "./AdminTables";
import adminApiClient from "../../services/adminApiClient";
import { useTableFilter } from "../../hooks/useAdminHooks";
import { LoadingOverlay } from "../common/Loader";

export default function CommunityManagers() {
  const [search, setSearch] = useState("");
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const columns = [
    { header: "Name", accessor: "name" },
    { header: "Email", accessor: "email" },
    { header: "Contact", accessor: "contact" },
    { header: "Assigned Communities", accessor: "assigned_communities" },
    { header: "Created Date", accessor: "date" },
  ];

  const actions = [];

  // Fetch Community Managers
  useEffect(() => {
    const fetchManagers = async () => {
      try {
        setLoading(true);
        const json = await adminApiClient.getCommunityManagers();

        if (json.success && json.data?.managers) {
          const formatted = json.data.managers.map((m) => ({
            id: m._id,
            name: m.name,
            email: m.email,
            contact: m.contact || "N/A",
            assigned_communities: m.assignedCommunity
              ? m.assignedCommunity.name
              : "Unassigned",
            date: new Date(m.createdAt).toLocaleDateString("en-IN"),
          }));

          setData(formatted);
        }
      } catch (err) {
        console.error("Error fetching community managers:", err);
        setError("Failed to load data");
      } finally {
        setLoading(false);
      }
    };

    fetchManagers();
  }, []);

  // Use custom filter hook
  const filteredData = useTableFilter(data, {
    search: search,
    searchFields: ['name', 'email', 'assigned_communities'],
  });

  return (
    <>
      {/* Header */}
      <div
        className="sticky-top border-bottom bg-white rounded-3 shadow-sm px-4 py-3 mb-4 d-flex justify-content-between align-items-center"
        style={{ zIndex: 100 }}
      >
        <Header title="Community Managers" />
      </div>

      {/* Filters Row */}
      <div
        className="bg-white rounded-4 shadow-sm mb-4 d-flex align-items-center justify-content-between flex-wrap gap-4 px-4 py-4"
        style={{
          border: "1px solid #f1f5f9",
          minHeight: "84px",
        }}
      >
        <div style={{ flex: "1 1 auto", minWidth: "280px", marginRight: "16px" }}>
          <SearchBar
            placeholder="Search community managers..."
            value={search}
            onChange={setSearch}
          />
        </div>
      </div>

      {/* Data Table */}
      {loading ? (
        <LoadingOverlay message="Loading managers..." />
      ) : error ? (
        <div className="text-center text-danger py-5">{error}</div>
      ) : (
        <AdminTable columns={columns} data={filteredData} actions={actions} />
      )}
    </>
  );
}
