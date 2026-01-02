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
                    name: "blog_posts",
                    list: "/blog-posts",
                    create: "/blog-posts/create",
                    edit: "/blog-posts/edit/:id",
                    show: "/blog-posts/show/:id",
                    meta: {
                      canDelete: true,
                    },
                  },
                  {
                    name: "categories",
                    list: "/categories",
                    create: "/categories/create",
                    edit: "/categories/edit/:id",
                    show: "/categories/show/:id",
                    meta: {
                      canDelete: true,
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
                    name: "virtual_machine_cluster_instancetypes",
                    list: "/virtual-machine-cluster-instancetypes",
                    meta: {
                      hide: true,
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
                      element={<NavigateToResource resource="blog_posts" />}
                    />
                    <Route path="/blog-posts">
                      <Route index element={<BlogPostList />} />
                      <Route path="create" element={<BlogPostCreate />} />
                      <Route path="edit/:id" element={<BlogPostEdit />} />
                      <Route path="show/:id" element={<BlogPostShow />} />
                    </Route>
                    <Route path="/categories">
                      <Route index element={<CategoryList />} />
                      <Route path="create" element={<CategoryCreate />} />
                      <Route path="edit/:id" element={<CategoryEdit />} />
                      <Route path="show/:id" element={<CategoryShow />} />
                    </Route>
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
