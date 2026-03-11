import { Refine } from "@refinedev/core";
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
import { Title } from "./components/title";
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
  VirtualMachineVirtualizationCreate,
  VirtualMachineVpcCreate,
  VirtualMachineVirtualizationEdit,
  VirtualMachineVpcEdit,
  VirtualMachineShow,
} from "./pages/virtual-machines";
import {
  DataVolumeList,
  DataVolumeCreate,
  DataVolumeEdit,
  DataVolumeShow,
} from "./pages/data-volumes";
import {
  NamespaceList,
  NamespaceCreate,
  NamespaceEdit,
  NamespaceShow,
} from "./pages/namespaces";

function App() {
  return (
    <BrowserRouter>
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
                    name: "virtual_machines_menu",
                    meta: {
                      label: "Virtual Machines",
                    },
                  },
                  {
                    name: "virtual_machines",
                    identifier: "virtual_machines_virtualization",
                    list: "/virtual-machines/ike-virtualization",
                    create: "/virtual-machines/ike-virtualization/create",
                    edit: "/virtual-machines/ike-virtualization/edit/:id",
                    show: "/virtual-machines/ike-virtualization/show/:id",
                    meta: {
                      canDelete: true,
                      label: "IKE Virtualization",
                      parent: "virtual_machines_menu",
                      vmVariant: "ike-virtualization",
                    },
                  },
                  {
                    name: "virtual_machines",
                    identifier: "virtual_machines_vpc",
                    list: "/virtual-machines/ike-virtual-private-cluster",
                    create: "/virtual-machines/ike-virtual-private-cluster/create",
                    edit: "/virtual-machines/ike-virtual-private-cluster/edit/:id",
                    show: "/virtual-machines/ike-virtual-private-cluster/show/:id",
                    meta: {
                      canDelete: true,
                      label: "IKE Virtual Private Cluster",
                      parent: "virtual_machines_menu",
                      vmVariant: "ike-virtual-private-cluster",
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
                  {
                    name: "namespaces",
                    list: "/namespaces",
                    create: "/namespaces/create",
                    edit: "/namespaces/edit/:id",
                    show: "/namespaces/show/:id",
                    meta: {
                      canDelete: true,
                      label: "Namespaces",
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
                      <ThemedLayout Header={() => <Header sticky />} Title={Title}>
                        <Outlet />
                      </ThemedLayout>
                    }
                  >
                    <Route
                      index
                      element={<NavigateToResource resource="virtual_machines_virtualization" />}
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
                      <Route index element={<NavigateToResource resource="virtual_machines_virtualization" />} />
                      <Route path="ike-virtualization">
                        <Route index element={<VirtualMachineList />} />
                        <Route path="create" element={<VirtualMachineVirtualizationCreate />} />
                        <Route path="edit/:id" element={<VirtualMachineVirtualizationEdit />} />
                        <Route path="show/:id" element={<VirtualMachineShow />} />
                      </Route>
                      <Route path="ike-virtual-private-cluster">
                        <Route index element={<VirtualMachineList />} />
                        <Route path="create" element={<VirtualMachineVpcCreate />} />
                        <Route path="edit/:id" element={<VirtualMachineVpcEdit />} />
                        <Route path="show/:id" element={<VirtualMachineShow />} />
                      </Route>
                    </Route>
                    <Route path="/data-volumes">
                      <Route index element={<DataVolumeList />} />
                      <Route path="create" element={<DataVolumeCreate />} />
                      <Route path="edit/:id" element={<DataVolumeEdit />} />
                      <Route path="show/:id" element={<DataVolumeShow />} />
                    </Route>
                    <Route path="/namespaces">
                      <Route index element={<NamespaceList />} />
                      <Route path="create" element={<NamespaceCreate />} />
                      <Route path="edit/:id" element={<NamespaceEdit />} />
                      <Route path="show/:id" element={<NamespaceShow />} />
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
