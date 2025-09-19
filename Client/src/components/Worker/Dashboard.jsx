/**
 * @license Proprietary
 * @fileoverview Worker Dashboard Component
 * @copyright All rights reserved
 */

import '../../assets/css/Worker/Dashboard.css';
import {CircularProgressbar, buildStyles} from 'react-circular-progressbar';
import 'react-circular-progressbar/dist/styles.css';
import {motion} from 'framer-motion';
import {setDashboardData, setIssues} from '../../Slices/workerSlice';
import {use, useEffect} from 'react';
import {useSelector, useDispatch} from 'react-redux';

export const WorkerDashboard = () => {
    const dispatch = useDispatch();

    useEffect(() => {
        const fetchData = async () => {
            const response = await fetch("http://localhost:3000/worker/getDashboardData", {
                method: "GET",
                headers: {
                    "Content-Type": "application/json"
                },
                credentials: "include"
            });

            const data = await response.json();

            if (data.success) {
                dispatch(setDashboardData(data.worker));
                dispatch(setIssues(data.issues));
            }
        };

        fetchData();
    }, []);

    const issues = useSelector((state) => state ?. worker ?. Issues);


    // ---------- CALCULATIONS ----------
    const calculateRating = (issues) => {
        if (! issues || issues.length === 0) 
            return 0;
        


        let total = 0;
        issues.forEach((issue) => {
            total += issue.rating || 0;
        });

        return total / issues.length;
    };

    const tasksCompleted = issues ?. filter((issue) => issue.status === "Resolved" || issue.status === "Payment Pending") ?. length || 0;

    const newTasks = issues ?. filter((issue) => issue.status === "Pending") ?. length || 0;

    const totalTasks = issues ?. length || 0;

    const workerRating = calculateRating(issues);

    const efficiency = totalTasks === 0 ? 0 : Math.round((tasksCompleted / totalTasks) * 100);


    // ---------- UI ----------
    return (
        <div className="container-fluid px-4 py-3 worker-dashboard">
            <div className="row g-4">
                <div className="col-lg-8 d-flex flex-column">
                    <motion.div className="stats-grid"
                        initial={
                            {
                                opacity: 0,
                                y: 20
                            }
                        }
                        animate={
                            {
                                opacity: 1,
                                y: 0
                            }
                        }
                        transition={
                            {duration: 0.6}
                    }>
                        {/* TOTAL TASKS */}
                        <div className="card info-card shadow-sm">
                            <div className="card-body d-flex flex-column justify-content-center align-items-center py-4">
                                <div className="card-label">Total Tasks</div>
                                <div className="card-value text-success">
                                    {totalTasks} </div>
                                <i className="bi bi-list-task fs-2 text-success mt-2"></i>
                            </div>
                        </div>

                        {
                        console.log(totalTasks)
                    }

                        {/* NEW TASKS */}
                        <div className="card info-card shadow-sm">
                            <div className="card-body d-flex flex-column justify-content-center align-items-center py-4">
                                <div className="card-label">New Tasks</div>
                                <div className="card-value text-warning">
                                    {newTasks} </div>
                                <i className="bi bi-exclamation-circle fs-2 text-warning mt-2"></i>
                            </div>
                        </div>

                        {/* COMPLETED TASKS */}
                        <div className="card info-card shadow-sm">
                            <div className="card-body d-flex flex-column justify-content-center align-items-center py-4">
                                <div className="card-label">Completed Tasks</div>
                                <div className="card-value text-primary">
                                    {tasksCompleted} </div>
                                <i className="bi bi-check-circle fs-2 text-primary mt-2"></i>
                            </div>
                        </div>
                    </motion.div>

                    {/* PERFORMANCE SECTION */}
                    <motion.div className="performance-stats d-flex justify-content-around align-items-center mt-4 py-4 rounded-3 shadow-sm bg-white"
                        initial={
                            {opacity: 0}
                        }
                        animate={
                            {opacity: 1}
                        }
                        transition={
                            {
                                delay: 0.2,
                                duration: 0.8
                            }
                    }>
                        {/* EFFICIENCY */}
                        <motion.div className="stat-circle"
                            style={
                                {width: 150}
                            }
                            whileHover={
                                {scale: 1.08}
                            }
                            transition={
                                {
                                    type: "spring",
                                    stiffness: 300
                                }
                        }>
                            <div className="position-relative chart-hover">
                                <CircularProgressbar value={efficiency}
                                    text={
                                        `${efficiency}%`
                                    }
                                    styles={
                                        buildStyles({pathColor: "#007bff", textColor: "#000", trailColor: "#007bff40", textSize: "16px"})
                                    }/>
                                <i className="bi bi-lightning-charge-fill position-absolute bottom-0 end-0 text-primary fs-5"></i>
                            </div>
                            <div className="text-center mt-2 fw-semibold">
                                Efficiency
                            </div>
                        </motion.div>

                        {/* TASKS COMPLETED GRAPH */}
                        <motion.div className="stat-circle"
                            style={
                                {width: 150}
                            }
                            whileHover={
                                {scale: 1.08}
                            }
                            transition={
                                {
                                    type: "spring",
                                    stiffness: 300
                                }
                        }>
                            <div className="position-relative chart-hover">
                                <CircularProgressbar value={
                                        totalTasks === 0 ? 0 : (tasksCompleted / totalTasks) * 100
                                    }
                                    text={
                                        `${tasksCompleted}/${totalTasks}`
                                    }
                                    styles={
                                        buildStyles({pathColor: "#28a745", textColor: "#000", trailColor: "#28a7465e", textSize: "16px"})
                                    }/>
                                <i className="bi bi-check-circle-fill position-absolute bottom-0 end-0 text-success fs-5"></i>
                            </div>
                            <div className="text-center mt-2 fw-semibold">
                                Tasks Completed
                            </div>
                        </motion.div>

                        {/* RATING */}
                        <motion.div className="stat-circle"
                            style={
                                {width: 150}
                            }
                            whileHover={
                                {scale: 1.08}
                            }
                            transition={
                                {
                                    type: "spring",
                                    stiffness: 300
                                }
                        }>
                            <div className="position-relative chart-hover">
                                <CircularProgressbar value={
                                        (workerRating / 5) * 100
                                    }
                                    text={
                                        `${
                                            workerRating.toFixed(1)
                                        }/5.0`
                                    }
                                    styles={
                                        buildStyles({pathColor: "#ff8c00", textColor: "#000", trailColor: "#ff8c0040", textSize: "16px"})
                                    }/>
                                <i className="bi bi-star-fill position-absolute bottom-0 end-0 text-warning fs-5"></i>
                            </div>
                            <div className="text-center mt-2 fw-semibold">
                                Worker Rating
                            </div>
                        </motion.div>
                    </motion.div>
                </div>

                {/* ----------- NOTIFICATIONS ----------- */}
                <div className="col-lg-4">
                    <motion.div className="notifications h-100 rounded-3 shadow-sm bg-white"
                        initial={
                            {
                                opacity: 0,
                                x: 40
                            }
                        }
                        animate={
                            {
                                opacity: 1,
                                x: 0
                            }
                        }
                        transition={
                            {duration: 0.8}
                    }>
                        <h4 className="text-center p-2 m-0"
                            style={
                                {
                                    backgroundColor: "#83d2ff71",
                                    borderRadius: "8px 8px 0 0"
                                }
                        }>
                            <i className="bi bi-bell-fill me-1"></i>
                            Notifications
                        </h4>

                        <ul className="list-unstyled px-1 py-3">
                            <li className="p-2 rounded-2 shadow-sm border mx-1 d-flex">
                                <div className="rounded-circle border px-2 me-1 d-flex align-items-center bg-danger">
                                    <i className="bi bi-bell-fill text-white"></i>
                                </div>
                                <div className="d-flex flex-column">
                                    Reminder: Complete task
                                    <small className="text-muted ms-2">
                                        5 min ago
                                    </small>
                                </div>
                            </li>
                        </ul>
                    </motion.div>
                </div>
            </div>
        </div>
    );
};
