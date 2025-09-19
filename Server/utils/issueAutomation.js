import cron from "node-cron";
import Issue from "../models/issues.js";
import Worker from "../models/workers.js";

// Map community issue categories to worker job roles (matching actual database values)
const COMMUNITY_CATEGORY_TO_JOBROLE = {
  Streetlight: "Electrician",  // Match actual database value
  Elevator: "Maintenance", 
  Garden: "Maintenance",
  "Common Area": "Maintenance",
  Parking: "Security",
  Security: "Security",
  Waste: "Waste Management",
  Pest: "Pest Control",
  "Other Community": "Maintenance",
  // Add more mappings as needed
};

// Map resident issue categories to worker job roles (matching actual database values)
const RESIDENT_CATEGORY_TO_JOBROLE = {
  Plumbing: "Plumber",         // Match actual database value
  Electrical: "Electrician",   // Match actual database value  
  Security: "Security",        // Match exactly with worker schema
  Maintenance: "Maintenance",   // Match exactly with worker schema
  "Pest Control": "Pest Control", // Match exactly with worker schema
  "Waste Management": "Waste Management", // Match exactly with worker schema
  Other: "Maintenance",        // Default fallback
  // Add more mappings as needed
};

function getRelatedCategories(category) {
  const relatedMap = {
    'Plumbing': ['Electrical'], // Plumbing and electrical often related
    'Electrical': ['Plumbing'],
    'Security': ['Maintenance'], // Security issues might need maintenance
    'Maintenance': [], // Maintenance is general, no specific relations
    'Pest Control': ['Waste Management'], // Pest and waste often related
    'Waste Management': ['Pest Control'],
  };
  
  return relatedMap[category] || [];
}

function selectOptimalWorker(workers, priority = 'Normal') {
  if (!workers.length) return null;
  
  // For urgent issues, prefer workers with least current load
  if (priority === 'Urgent') {
    return workers.sort((a, b) => a.assignedIssues.length - b.assignedIssues.length)[0];
  }
  
  // For high priority, prefer experienced workers (those with more completed issues)
  if (priority === 'High') {
    // For now, use workload as proxy for experience
    // In future, could track completed issues count
    return workers.sort((a, b) => {
      const aLoad = a.assignedIssues.length;
      const bLoad = b.assignedIssues.length;
      
      // If loads are similar (within 2), prefer more experienced worker
      if (Math.abs(aLoad - bLoad) <= 2) {
        // Could add experience metric here
        return aLoad - bLoad;
      }
      return aLoad - bLoad;
    })[0];
  }
  
  // For normal priority, simple round-robin based on workload
  return workers.sort((a, b) => a.assignedIssues.length - b.assignedIssues.length)[0];
}

function getJobRoleForCommunityCategory(category) {
  return COMMUNITY_CATEGORY_TO_JOBROLE[category] || "Maintenance";
}

function getJobRoleForResidentCategory(category) {
  return RESIDENT_CATEGORY_TO_JOBROLE[category] || "Maintenance";
}

// --------------------------------------------------
// AUTO ASSIGN RESIDENT ISSUE
// --------------------------------------------------
export async function autoAssignResidentIssue(issue) {
  try {
    console.log("=== AUTO ASSIGN RESIDENT ISSUE START ===");
    console.log("Issue ID:", issue._id);
    console.log("Issue Category:", issue.category);
    console.log("Issue Community ID:", issue.community);
    console.log("Issue Community ID type:", typeof issue.community);

    // Use mapped job role for worker search
    const jobRole = getJobRoleForResidentCategory(issue.category);
    
    console.log(`Looking for workers with jobRole: ${jobRole} for issue category: ${issue.category}`);

    // Debug: Check workers in community first
    const allCommunityWorkers = await Worker.find({
      community: issue.community
    });
    console.log(`Total workers in this community: ${allCommunityWorkers.length}`);
    allCommunityWorkers.forEach(w => {
      console.log(`Worker: ${w.name}, JobRoles: [${w.jobRole.join(', ')}], IsActive: ${w.isActive} (type: ${typeof w.isActive}), Community: ${w.community}`);
    });

    // First try: Find workers with exact job role match (temporarily removing isActive filter for debugging)
    let workers = await Worker.find({
      community: issue.community,
      jobRole: { $in: [jobRole] }
    });

    // Filter active workers manually for debugging
    const activeWorkers = workers.filter(w => {
      console.log(`Checking worker ${w.name}: isActive = ${w.isActive} (${typeof w.isActive})`);
      return w.isActive === true || w.isActive === "true" || w.isActive === 1;
    });
    
    workers = activeWorkers;
    console.log(`Found ${workers.length} active workers for jobRole: ${jobRole} after manual filtering`);
    
    // Debug: Check what workers exist with different criteria
    const workersWithJobRole = await Worker.find({
      community: issue.community,
      jobRole: { $in: [jobRole] }
    });
    console.log(`Workers with jobRole ${jobRole} (ignoring isActive): ${workersWithJobRole.length}`);
    
   
    console.log(`All workers in community: ${allCommunityWorkers.map(w => ({ 
      name: w.name, 
      jobRole: w.jobRole, 
      isActive: w.isActive 
    }))}`);

    // Second try: Fallback to Maintenance workers
    if (!workers.length) {
      console.log(`No workers found for jobRole: ${jobRole}, trying with 'Maintenance'`);
      workers = await Worker.find({
        community: issue.community,
        jobRole: { $in: ["Maintenance"] },
        $or: [
          { isActive: true },
          { isActive: "true" },
          { isActive: 1 },
          { isActive: { $ne: false } }
        ]
      });
      console.log(`Found ${workers.length} maintenance workers as fallback`);
    }

    // Third try: Any active worker in the community
    if (!workers.length) {
      console.log("No maintenance workers found, trying any active worker");
      workers = await Worker.find({
        community: issue.community,
        $or: [
          { isActive: true },
          { isActive: "true" },
          { isActive: 1 },
          { isActive: { $ne: false } }
        ]
      });
      console.log(`Found ${workers.length} active workers as last resort`);
    }

    // If still no workers, check if there are any workers at all in this community
    if (!workers.length) {
      const allWorkers = await Worker.find({ community: issue.community });
      console.log(`Total workers in community (active/inactive): ${allWorkers.length}`);
      
      if (allWorkers.length === 0) {
        console.log("No workers exist in this community");
        issue.status = "Pending Assignment";
        issue.remarks = "No workers available in this community";
        await issue.save();
        return { assigned: false, msg: "No workers exist in this community" };
      } else {
        console.log("Workers exist but none are active or match the required job role");
        const allJobRoles = [...new Set(allWorkers.flatMap(w => w.jobRole))];
        console.log("Available job roles in community:", allJobRoles);
        console.log("Inactive workers:", allWorkers.filter(w => !w.isActive).map(w => ({ 
          name: w.name, 
          jobRole: w.jobRole,
          isActive: w.isActive 
        })));
        issue.status = "Pending Assignment";
        issue.remarks = `No active workers with matching job role. Required: ${jobRole}, Available: ${allJobRoles.join(', ')}`;
        await issue.save();
        return { assigned: false, msg: "No active workers with matching job role available" };
      }
    }

    if (workers.length > 0) {
      console.log("Available workers:", workers.map(w => ({ 
        name: w.name, 
        jobRole: w.jobRole, 
        assignedIssues: w.assignedIssues.length,
        isActive: w.isActive 
      })));
    }

    // Smart worker selection based on priority and workload
    const selected = selectOptimalWorker(workers, issue.priority);

    console.log(`Selected worker: ${selected.name} (${selected.assignedIssues.length} assigned issues)`);

    // Assign the issue to the worker
    issue.workerAssigned = selected._id;
    issue.status = "Assigned";
    issue.autoAssigned = true;
    await issue.save();

    // Add issue to worker's assigned issues
    if (!selected.assignedIssues.includes(issue._id)) {
      selected.assignedIssues.push(issue._id);
      await selected.save();
    }

    console.log(`Auto-assigned Resident issue ${issue._id} to worker ${selected.name}`);
    console.log("=== AUTO ASSIGN RESIDENT ISSUE END ===");
    return { assigned: true, worker: selected };
  } catch (err) {
    console.error("Auto assign resident issue error:", err);
    // Update issue status to indicate error
    try {
      issue.status = "Pending Assignment";
      issue.remarks = `Auto-assignment failed: ${err.message}`;
      await issue.save();
    } catch (saveErr) {
      console.error("Error updating issue status after failure:", saveErr);
    }
    return { assigned: false, error: err.message };
  }
}

// --------------------------------------------------
// AUTO ASSIGN COMMUNITY ISSUE
// --------------------------------------------------
export async function autoAssignCommunityIssue(issue) {
  try {
    console.log("=== AUTO ASSIGN COMMUNITY ISSUE START ===");
    console.log("Issue ID:", issue._id);
    console.log("Issue Category:", issue.category);
    console.log("Issue Community ID:", issue.community);
    console.log("Issue Community ID type:", typeof issue.community);

    // Use mapped job role for worker search
    const jobRole = getJobRoleForCommunityCategory(issue.category);
    
    console.log(`Looking for workers with jobRole: ${jobRole} for community issue category: ${issue.category}`);

    // Debug: Check workers in community first
    const allCommunityWorkers = await Worker.find({
      community: issue.community
    });
    console.log(`Total workers in this community: ${allCommunityWorkers.length}`);
    allCommunityWorkers.forEach(w => {
      console.log(`Worker: ${w.name}, JobRoles: [${w.jobRole.join(', ')}], IsActive: ${w.isActive} (type: ${typeof w.isActive}), Community: ${w.community}`);
    });

    // First try: Find workers with exact job role match (temporarily removing isActive filter for debugging)
    let workers = await Worker.find({
      community: issue.community,
      jobRole: { $in: [jobRole] }
    });

    // Filter active workers manually for debugging
    const activeWorkers = workers.filter(w => {
      console.log(`Checking worker ${w.name}: isActive = ${w.isActive} (${typeof w.isActive})`);
      return w.isActive === true || w.isActive === "true" || w.isActive === 1;
    });
    
    workers = activeWorkers;
    console.log(`Found ${workers.length} active workers for jobRole: ${jobRole} after manual filtering`);

    console.log(`Found ${workers.length} workers for jobRole: ${jobRole}`);

    if (!workers.length) {
      console.log(`No workers found for jobRole: ${jobRole}, trying with 'Maintenance'`);
      // Fallback to maintenance workers
      let fallbackWorkers = await Worker.find({
        community: issue.community,
        jobRole: { $in: ["Maintenance"] }
      });
      
      // Filter active maintenance workers
      const activeFallbackWorkers = fallbackWorkers.filter(w => {
        return w.isActive === true || w.isActive === "true" || w.isActive === 1;
      });
      
      if (!activeFallbackWorkers.length) {
        console.log("No active maintenance workers found as fallback");
        issue.status = "Pending Assignment";
        issue.remarks = `No active workers available. Required: ${jobRole}, tried fallback to Maintenance`;
        await issue.save();
        return { assigned: false, msg: "No worker available" };
      }
      
      workers = activeFallbackWorkers;
      console.log(`Found ${workers.length} active maintenance workers as fallback`);
    }

    if (workers.length > 0) {
      console.log("Available workers:", workers.map(w => ({ 
        name: w.name, 
        jobRole: w.jobRole, 
        assignedIssues: w.assignedIssues.length,
        isActive: w.isActive 
      })));
    }

    const selected = selectOptimalWorker(workers, issue.priority);

    console.log(`Selected worker: ${selected.name} (${selected.assignedIssues.length} assigned issues)`);

    issue.workerAssigned = selected._id;
    issue.status = "Assigned";
    issue.autoAssigned = true;
    await issue.save();

    // Add issue to worker's assigned issues
    if (!selected.assignedIssues.includes(issue._id)) {
      selected.assignedIssues.push(issue._id);
      await selected.save();
    }

    console.log(`Auto-assigned Community issue ${issue._id} to worker ${selected.name}`);
    console.log("=== AUTO ASSIGN COMMUNITY ISSUE END ===");
    return { assigned: true, worker: selected };
  } catch (err) {
    console.error("Auto assign community issue error:", err);
    // Update issue status to indicate error
    try {
      issue.status = "Pending Assignment";
      issue.remarks = `Auto-assignment failed: ${err.message}`;
      await issue.save();
    } catch (saveErr) {
      console.error("Error updating issue status after failure:", saveErr);
    }
    return { assigned: false, error: err.message };
  }
}

// --------------------------------------------------
// AUTO ASSIGN ISSUE (GENERIC)
// --------------------------------------------------
export async function autoAssignIssue(issue) {
  try {
    // Since jobRole is an array in the schema, use $in operator
    const workers = await Worker.find({
      community: issue.community,
      jobRole: { $in: [issue.category] },
      isActive: true,
    });

    if (!workers.length) {
      return { assigned: false, msg: "No worker available" };
    }

    // Worker with lowest workload
    const selected = workers.sort(
      (a, b) => a.assignedIssues.length - b.assignedIssues.length
    )[0];

    // Assign
    issue.workerAssigned = selected._id;
    issue.status = "Assigned";
    issue.autoAssigned = true;
    await issue.save();

    selected.assignedIssues.push(issue._id);
    await selected.save();

    return { assigned: true, worker: selected };
  } catch (err) {
    console.error("Auto assign error:", err);
    return { assigned: false };
  }
}

// --------------------------------------------------
// CHECK DUPLICATE ISSUE (24 HOURS) - FOR RESIDENTS
// --------------------------------------------------
export async function checkDuplicateIssue(residentId, category, location) {
  const last24 = new Date(Date.now() - 24 * 60 * 60 * 1000);
  
  // Check for exact duplicate first
  const exactDuplicate = await Issue.findOne({
    resident: residentId,
    category,
    location,
    categoryType: "Resident",
    createdAt: { $gte: last24 },
    status: { $ne: "Closed" },
  });
  
  if (exactDuplicate) return exactDuplicate;
  
  // Check for similar issues (same location, related categories)
  const relatedCategories = getRelatedCategories(category);
  if (relatedCategories.length > 0) {
    return Issue.findOne({
      resident: residentId,
      category: { $in: relatedCategories },
      location,
      categoryType: "Resident",
      createdAt: { $gte: last24 },
      status: { $ne: "Closed" },
    });
  }
  
  return null;
}

// --------------------------------------------------
// CHECK DUPLICATE COMMUNITY ISSUE (24 HOURS)
// --------------------------------------------------
export async function checkDuplicateCommunityIssue(category, location) {
  const last24 = new Date(Date.now() - 24 * 60 * 60 * 1000);

  return Issue.findOne({
    category,
    location,
    categoryType: "Community",
    createdAt: { $gte: last24 },
    status: { $ne: "Closed" },
  });
}

// --------------------------------------------------
// FLAG MISASSIGNED ISSUE → REASSIGN
// --------------------------------------------------
export async function flagMisassigned(issueId) {
  const issue = await Issue.findById(issueId);
  if (!issue) return;

  // Add the current worker to misassignedBy array if not already there
  if (issue.workerAssigned && !issue.misassignedBy.includes(issue.workerAssigned.toString())) {
    issue.misassignedBy.push(issue.workerAssigned);
  }

  issue.workerAssigned = null;
  issue.status = "Pending Assignment";
  await issue.save();

  // Reassign based on issue type
  if (issue.categoryType === "Community") {
    await autoAssignCommunityIssue(issue);
  } else {
    await autoAssignResidentIssue(issue);
  }
}

// --------------------------------------------------
// CRON: AUTO REASSIGN IF WORKER INACTIVE - SMART TIMING
// --------------------------------------------------
cron.schedule("*/10 * * * *", async () => {
  try {
    const now = new Date();
    const currentHour = now.getHours();
    
    // Different timeouts based on priority and time of day
    let timeoutHours = 2; // Default
    
    // During business hours (9-17), be more aggressive
    if (currentHour >= 9 && currentHour <= 17) {
      timeoutHours = 1.5;
    }
    // During off-hours, be more lenient
    else if (currentHour <= 7 || currentHour >= 22) {
      timeoutHours = 4;
    }
    
    const cutoffTime = new Date(Date.now() - timeoutHours * 60 * 60 * 1000);

    const issues = await Issue.find({
      status: "Assigned",
      updatedAt: { $lte: cutoffTime },
      autoAssigned: true,
    }).populate('resident', 'priority');

    for (const issue of issues) {
      // For urgent issues, timeout faster
      let issueTimeout = timeoutHours;
      if (issue.priority === 'Urgent') {
        issueTimeout = Math.max(0.5, timeoutHours * 0.5);
      } else if (issue.priority === 'High') {
        issueTimeout = Math.max(1, timeoutHours * 0.75);
      }
      
      const issueSpecificCutoff = new Date(Date.now() - issueTimeout * 60 * 60 * 1000);
      
      if (issue.updatedAt <= issueSpecificCutoff) {
        console.log(`Auto reassigning ${issue.categoryType} issue due to inactivity:`, issue._id, `Priority: ${issue.priority}`);
        
        if (issue.categoryType === "Community") {
          await autoAssignCommunityIssue(issue);
        } else {
          await autoAssignResidentIssue(issue);
        }
      }
    }
  } catch (err) {
    console.error("Error in auto reassign cron:", err);
  }
});

// --------------------------------------------------
// CRON: AUTO CLOSE AFTER 48 HOURS WITHOUT CONFIRMATION (BOTH TYPES)
// --------------------------------------------------
cron.schedule("0 * * * *", async () => {
  try {
    const fortyEightHoursAgo = new Date(Date.now() - 48 * 60 * 60 * 1000);

    const issues = await Issue.find({
      status: "Resolved (Awaiting Confirmation)",
      updatedAt: { $lte: fortyEightHoursAgo },
    });

    for (const issue of issues) {
      issue.status = "Auto-Closed";
      await issue.save();
      console.log(`Auto-closed ${issue.categoryType} issue:`, issue._id);
    }
  } catch (err) {
    console.error("Auto close cron error:", err);
  }
});

// --------------------------------------------------
// CRON: SMART ESCALATION BASED ON PRIORITY AND TIME
// --------------------------------------------------
cron.schedule("*/30 * * * *", async () => {
  try {
    const now = new Date();
    
    const stuckIssues = await Issue.find({
      status: "In Progress",
    });

    for (const issue of stuckIssues) {
      let escalationHours = 6; // Default
      
      // Escalate faster for higher priority issues
      switch (issue.priority) {
        case 'Urgent':
          escalationHours = 2;
          break;
        case 'High':
          escalationHours = 4;
          break;
        case 'Normal':
          escalationHours = 6;
          break;
        default:
          escalationHours = 8;
      }
      
      const escalationCutoff = new Date(Date.now() - escalationHours * 60 * 60 * 1000);
      
      if (issue.updatedAt <= escalationCutoff) {
        issue.status = "On Hold";
        issue.remarks = `Auto-escalated after ${escalationHours} hours of no progress. Priority: ${issue.priority}`;
        await issue.save();
        console.log(`Escalated ${issue.categoryType} issue to manager:`, issue._id, `after ${escalationHours}h`);
        
        // Could send notification to manager here
      }
    }
  } catch (err) {
    console.error("Escalation cron error:", err);
  }
});

export default {
  autoAssignIssue,
  autoAssignResidentIssue,
  autoAssignCommunityIssue,
  checkDuplicateIssue,
  checkDuplicateCommunityIssue,
  flagMisassigned,
};
