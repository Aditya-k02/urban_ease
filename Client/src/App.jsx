import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap-icons/font/bootstrap-icons.css";

import { io } from "socket.io-client";

import ErrorBoundary from "./components/ErrorBoundary";

import { Layout } from "../src/Layout";
import {
  createBrowserRouter,
  createRoutesFromElements,
  Route,
  RouterProvider,
} from "react-router-dom";
import { SignIn } from "./components/SignIn";
import { SignUp } from "./components/SignUp";
import { InterestForm } from "./components/InterestForm";
import { Landingpage } from "./components/LandingPage";

import { ManagerDashboard } from './components/Manager/Dashboard';
import { CommonSpace } from './components/Manager/CommonSpace';
import { ManagerProfile } from './components/Manager/Profile';
import { IssueResolving } from './components/Manager/IssueResolving';
import { Advertisement } from './components/Manager/Advertisement';
import { Payments } from './components/Manager/Payments';
import UserManagement from './components/Manager/UserManagement.jsx';
import Subscription from './components/Manager/Subscription.jsx';
import ManagerSetup from './components/Manager/ManagerSetup.jsx';

import { CommonSpaceBooking } from './components/Resident/CommonSpace';
import { IssueRaising } from './components/Resident/IssueRaising';
import { ResidentDashboard } from './components/Resident/Dashboard';
import { PreApproval } from './components/Resident/PreApproval';
import { ResidentProfile } from './components/Resident/Profile';
import { ResidentPayments } from './components/Resident/ResidentPayments.jsx';
import { ResidentRegister } from './components/Resident/ResidentRegister.jsx';

import { WorkerDashboard } from "./components/Worker/Dashboard";
import { Tasks } from "./components/Worker/Tasks";
import { History } from "./components/Worker/History";
import { WorkerProfile } from "./components/Worker/Profile";

import { SecurityDashboard } from "./components/security/Dashboard.jsx"
import { VisitorManagement } from "./components/security/visitorManagement.jsx";
import { SecurityPreApproval } from "./components/security/preapproval.jsx";
import { SecurityProfile } from "./components/security/profile.jsx";
import SubscriptionExpired from "./components/SubscriptionExpired.jsx";

import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { ProtectedRoute } from "./components/ProtectedRout.jsx";

import AdminLogin from './components/AdminLogin';

import AdminLayout from './components/Admin/AdminLayout';
import { adminRoutes } from "./routes/adminRoutes";

import { AdminAuthProvider } from "./context/AdminAuthContext";
import ProtectedAdminRoute from "./components/Admin/ProtectedAdminRoute";

import React, { useEffect } from "react";
import { useDispatch } from "react-redux";
import { setUser } from "./Slices/authSlice";

import OnboardingPayment from "./components/Onboarding/OnboardingPayment";

function App() {
  const dispatch = useDispatch();

  useEffect(() => {
    fetch("http://localhost:3000/api/auth/getUser", {
      credentials: "include",
    })
      .then(res => res.json())
      .then(data => {
        console.log("user fetched", data);
        if (data.user) {
          dispatch(setUser(data.user));
        }
      });
  }, [dispatch]);



  const router = createBrowserRouter(
    createRoutesFromElements(
      <>
        <Route path="/" element={<Landingpage />} />
        <Route path="/SignIn" element={<SignIn />} />
        <Route path="/SignUp" element={<SignUp />} />
        <Route path="/interestForm" element={<InterestForm />} />

        <Route path='/' element={<Landingpage />} />
        <Route path='/SignIn' element={<SignIn />} />
        <Route path='/SignUp' element={<SignUp />} />
        <Route path='/residentRegister' element={<ResidentRegister />} />
        <Route path='/interestForm' element={<InterestForm />} />

        {/* Public Onboarding Route */}
        <Route path="/onboarding/payment" element={<OnboardingPayment />} />

        {/* Shared page when community subscription is inactive/expired */}
        <Route path="/subscription-expired" element={<SubscriptionExpired />} />

        <Route path='/adminLogin' element={<AdminLogin />} ></Route>

        <Route
          path="/admin/*"
          element={
            <ProtectedAdminRoute>
              <AdminLayout userType="admin" />
            </ProtectedAdminRoute>
          }
        >
          {adminRoutes.map(({ path, element }) => (
            <Route key={path} path={path} element={element} />
          ))}
        </Route>

        <Route element={<ProtectedRoute allowedUserType="CommunityManager" />}>
          <Route path="/manager" element={<Layout userType="manager" />}>
            <Route path="subscription" element={<Subscription />} />
            <Route path="setup" element={<ManagerSetup />} />
            <Route path="dashboard" element={<ManagerDashboard />} />
            <Route path="issueResolving" element={<IssueResolving />} />
            <Route path="commonSpace" element={<CommonSpace />} />
            <Route path="advertisement" element={<Advertisement />} />
            <Route path="payments" element={<Payments />} />
            <Route path="profile" element={<ManagerProfile />} />
            <Route path="userManagement" element={<UserManagement />} />
          </Route>
        </Route>

        <Route element={<ProtectedRoute allowedUserType="Resident" />}>
          <Route path="/resident" element={<Layout userType="Resident" />}>
            <Route path="dashboard" element={<ResidentDashboard />} />
            <Route path="preApproval" element={<PreApproval />} />
            <Route path="commonSpace" element={<CommonSpaceBooking />} />
            <Route path="issueRaising" element={<IssueRaising />} />
            <Route path="payments" element={<ResidentPayments />} />
            <Route path="profile" element={<ResidentProfile />} />
          </Route>
        </Route>

        <Route element={<ProtectedRoute allowedUserType="Worker" />}>
          <Route path="/worker" element={<Layout userType="Worker" />}>
            <Route path="dashboard" element={<WorkerDashboard />} />
            <Route path="tasks" element={<Tasks />} />
            <Route path="history" element={<History />} />
            <Route path="profile" element={<WorkerProfile />} />
          </Route>
        </Route>

        <Route element={<ProtectedRoute allowedUserType="Security" />}>
          <Route path="/security" element={<Layout userType="security" />}>
            <Route path="dashboard" element={<SecurityDashboard />} />
            <Route path="visitorManagement" element={<VisitorManagement />} />
            <Route path="preapproval" element={<SecurityPreApproval />} />
            <Route path="profile" element={<SecurityProfile />} />
          </Route>
        </Route>
      </>
    )
  );

  return (
    <AdminAuthProvider>
      <ErrorBoundary>
        <ToastContainer />
        <RouterProvider router={router} />
      </ErrorBoundary>
    </AdminAuthProvider>
  );
}

export default App;
