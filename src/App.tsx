import { GitHubBanner, Refine } from "@refinedev/core";
import { DevtoolsPanel, DevtoolsProvider } from "@refinedev/devtools";
import { RefineKbar, RefineKbarProvider } from "@refinedev/kbar";

import {
  ErrorComponent,
  RefineSnackbarProvider,
  ThemedLayout,
  useNotificationProvider,
} from "@refinedev/mui";

import CssBaseline from "@mui/material/CssBaseline";
import GlobalStyles from "@mui/material/GlobalStyles";
import routerProvider, {
  DocumentTitleHandler,
  NavigateToResource,
  UnsavedChangesNotifier,
} from "@refinedev/react-router";

// import dataProvider from "@refinedev/simple-rest";
import { BrowserRouter, Outlet, Route, Routes } from "react-router";
import { customDataProvider } from "./providers/custom-data-provider";
import { Header } from "./components/header";
import { ColorModeContextProvider } from "./contexts/color-mode";
import {
  BlogPostCreate,
  BlogPostEdit,
  BlogPostList,
  BlogPostShow,
} from "./pages/blog-posts";
import {
  CategoryCreate,
  CategoryEdit,
  CategoryList,
  CategoryShow,
} from "./pages/categories";
import {
  UserDefinedNetworkList,
  UserDefinedNetworkCreate,
  UserDefinedNetworkEdit,
  UserDefinedNetworkShow,
} from "./pages/user-defined-networks";
import {
  ClusterUserDefinedNetworkList,
  ClusterUserDefinedNetworkShow,
} from "./pages/cluster-user-defined-networks";
import {
  VirtualMachineList,
  VirtualMachineCreate,
  VirtualMachineEdit,
  VirtualMachineShow,
} from "./pages/virtual-machines";
import {
  DataVolumeList,
  DataVolumeCreate,
  DataVolumeEdit,
  DataVolumeShow,
} from "./pages/data-volumes";

function App() {
  return (
    <BrowserRouter>
      <GitHubBanner />
      <RefineKbarProvider>
        <ColorModeContextProvider>
          <CssBaseline />
          <GlobalStyles styles={{ html: { WebkitFontSmoothing: "auto" } }} />
          <RefineSnackbarProvider>
            <DevtoolsProvider>
              <Refine
                dataProvider={customDataProvider}
                notificationProvider={useNotificationProvider}
                routerProvider={routerProvider}
                resources={[
                  {
                    name: "virtual_machines",
                    list: "/virtual-machines",
                    create: "/virtual-machines/create",
                    edit: "/virtual-machines/edit/:id",
                    show: "/virtual-machines/show/:id",
                    meta: {
                      canDelete: true,
                      label: "Virtual Machines",
                    },
                  },
                  {
                    name: "data_volumes",
                    list: "/data-volumes",
                    create: "/data-volumes/create",
                    edit: "/data-volumes/edit/:id",
                    show: "/data-volumes/show/:id",
                    meta: {
                      canDelete: true,
                      label: "Data Volumes",
                    },
                  },
                  {
                    name: "user_defined_networks",
                    list: "/user-defined-networks",
                    create: "/user-defined-networks/create",
                    edit: "/user-defined-networks/edit/:id",
                    show: "/user-defined-networks/show/:id",
                    meta: {
                      canDelete: true,
                      label: "User Defined Networks",
                    },
                  },
                  {
                    name: "cluster_user_defined_networks",
                    list: "/cluster-user-defined-networks",
                    show: "/cluster-user-defined-networks/show/:id",
                    meta: {
                      canDelete: false,
                      label: "Cluster User Defined Networks",
                    }
                  },
                ]}
                options={{
                  syncWithLocation: true,
                  warnWhenUnsavedChanges: true,
                  projectId: "JRzruS-jZsaFF-NONd6x",
                }}
              >
                <Routes>
                  <Route
                    element={
                      <ThemedLayout Header={() => <Header sticky />}>
                        <Outlet />
                      </ThemedLayout>
                    }
                  >
                    <Route
                      index
                      element={<NavigateToResource resource="virtual_machines" />}
                    />
                    <Route path="/user-defined-networks">
                      <Route index element={<UserDefinedNetworkList />} />
                      <Route path="create" element={<UserDefinedNetworkCreate />} />
                      <Route path="edit/:id" element={<UserDefinedNetworkEdit />} />
                      <Route path="show/:id" element={<UserDefinedNetworkShow />} />
                    </Route>
                    <Route path="/cluster-user-defined-networks">
                      <Route index element={<ClusterUserDefinedNetworkList />} />
                      <Route path="show/:id" element={<ClusterUserDefinedNetworkShow />} />
                    </Route>
                    <Route path="/virtual-machines">
                      <Route index element={<VirtualMachineList />} />
                      <Route path="create" element={<VirtualMachineCreate />} />
                      <Route path="edit/:id" element={<VirtualMachineEdit />} />
                      <Route path="show/:id" element={<VirtualMachineShow />} />
                    </Route>
                    <Route path="/data-volumes">
                      <Route index element={<DataVolumeList />} />
                      <Route path="create" element={<DataVolumeCreate />} />
                      <Route path="edit/:id" element={<DataVolumeEdit />} />
                      <Route path="show/:id" element={<DataVolumeShow />} />
                    </Route>
                    <Route path="*" element={<ErrorComponent />} />
                  </Route>
                </Routes>

                <RefineKbar />
                <UnsavedChangesNotifier />
                <DocumentTitleHandler />
              </Refine>
              <DevtoolsPanel />
            </DevtoolsProvider>
          </RefineSnackbarProvider>
        </ColorModeContextProvider>
      </RefineKbarProvider>
    </BrowserRouter>
  );
}

export default App;
