import { DataProvider } from "@refinedev/core";
import simpleRestDataProvider from "@refinedev/simple-rest";

const API_URL = "https://api.fake-rest.refine.dev";
const baseDataProvider = simpleRestDataProvider(API_URL);

const MOCK_VMS_KEY = "mock_virtual_machines";
const MOCK_UDNS_KEY = "mock_user_defined_networks";
const MOCK_CUDNS_KEY = "mock_cluster_user_defined_networks";
const MOCK_VM_CLUSTER_INSTANCETYPES_KEY = "mock_vm_cluster_instancetypes";
const MOCK_DATA_VOLUMES_KEY = "mock_data_volumes";
const MOCK_NAMESPACES_KEY = "mock_namespaces";

// Initialize mock data for VirtualMachines if empty
if (!localStorage.getItem(MOCK_VMS_KEY)) {
    const initialData = [
        {
            id: 1,
            apiVersion: "kubevirt.io/v1",
            kind: "VirtualMachine",
            metadata: {
                name: "test-vm-1",
                namespace: "default",
                annotations: { "kubevirt-gui/network-pattern": "Default" }
            },
            spec: {
                instancetype: { name: "u1.small" },
                runStrategy: "Always",
                template: {
                    spec: {
                        domain: {
                            devices: {
                                interfaces: [{ name: "default", masquerade: {} }]
                            },
                            resources: {}
                        },
                        networks: [{ name: "default", pod: {} }]
                    }
                }
            },
            status: { printableStatus: "Running" }
        },
        {
            id: 2,
            apiVersion: "kubevirt.io/v1",
            kind: "VirtualMachine",
            metadata: {
                name: "test-vm-2",
                namespace: "default",
                annotations: { "kubevirt-gui/network-pattern": "Primary" }
            },
            spec: {
                instancetype: { name: "u1.medium" },
                runStrategy: "Always",
                template: {
                    spec: {
                        domain: {
                            devices: {
                                interfaces: [{ name: "default", masquerade: {} }]
                            },
                            resources: {}
                        },
                        networks: [{ name: "default", pod: {} }]
                    }
                }
            },
            status: { printableStatus: "Stopped" }
        },
        {
            id: 3,
            apiVersion: "kubevirt.io/v1",
            kind: "VirtualMachine",
            metadata: {
                name: "test-vm-3",
                namespace: "default",
                annotations: { "kubevirt-gui/network-pattern": "DefaultSecondary" }
            },
            spec: {
                instancetype: { name: "u1.small" },
                runStrategy: "Always",
                template: {
                    spec: {
                        domain: {
                            devices: {
                                interfaces: [
                                    { name: "default", masquerade: {} },
                                    { name: "secondary-0", bridge: {} }
                                ],
                                resources: {}
                            }
                        },
                        networks: [
                            { name: "default", pod: {} },
                            { name: "secondary-0", multus: { networkName: "l2-network" } }
                        ]
                    }
                }
            },
            status: { printableStatus: "Running" }
        }
    ];
    localStorage.setItem(MOCK_VMS_KEY, JSON.stringify(initialData));
}

// Initialize mock data for UserDefinedNetworks if empty
if (!localStorage.getItem(MOCK_UDNS_KEY)) {
    const initialData = [
        {
            id: 1,
            apiVersion: "kubevirt.io/v1",
            kind: "UserDefinedNetwork",
            metadata: { name: "secondary-network", namespace: "default" },
            spec: {
                layer2: {
                    role: "Secondary",
                    subnets: ["10.0.0.0/24"],
                    ipam: { mode: "Enabled", lifecycle: "Persistent" }
                },
                topology: "Layer2"
            }
        },
        {
            id: 2,
            apiVersion: "kubevirt.io/v1",
            kind: "UserDefinedNetwork",
            metadata: { name: "primary-network", namespace: "default" },
            spec: {
                layer3: {
                    role: "Primary",
                    subnets: [{ cidr: "172.16.0.0/16", hostSubnet: 24 }]
                },
                topology: "Layer3"
            }
        }
    ];
    localStorage.setItem(MOCK_UDNS_KEY, JSON.stringify(initialData));
}

// Initialize mock data for ClusterUserDefinedNetworks if empty
if (!localStorage.getItem(MOCK_CUDNS_KEY)) {
    const initialData = [
        {
            id: 1,
            apiVersion: "kubevirt.io/v1",
            kind: "ClusterUserDefinedNetwork",
            metadata: { name: "cluster-secondary-net" },
            spec: {
                network: {
                    topology: "Layer2",
                    layer2: {
                        role: "Secondary",
                        subnets: ["172.16.0.0/16"],
                        ipam: { mode: "Enabled", lifecycle: "Persistent" }
                    }
                },
                namespaceSelector: {
                    matchExpressions: [
                        { key: "kubernetes.io/metadata.name", operator: "In", values: ["default", "my-namespace"] }
                    ]
                }
            }
        },
        {
            id: 2,
            apiVersion: "kubevirt.io/v1",
            kind: "ClusterUserDefinedNetwork",
            metadata: { name: "cluster-localnet" },
            spec: {
                network: {
                    topology: "Localnet",
                    localnet: {
                        role: "Secondary",
                        physicalNetworkName: "localnet-v2357",
                        subnets: ["10.10.25.0/24"],
                        ipam: { mode: "Enabled", lifecycle: "Persistent" }
                    }
                },
                namespaceSelector: {
                    matchExpressions: [
                        { key: "kubernetes.io/metadata.name", operator: "In", values: ["default", "my-namespace"] }
                    ]
                }
            }
        }
    ];
    localStorage.setItem(MOCK_CUDNS_KEY, JSON.stringify(initialData));
}

if (!localStorage.getItem(MOCK_VM_CLUSTER_INSTANCETYPES_KEY)) {
    const initialData = [
        { id: "u1.small", metadata: { name: "u1.small" } },
        { id: "u1.medium", metadata: { name: "u1.medium" } },
        { id: "u1.large", metadata: { name: "u1.large" } },
    ];
    localStorage.setItem(MOCK_VM_CLUSTER_INSTANCETYPES_KEY, JSON.stringify(initialData));
}

const getMockData = (key: string) => JSON.parse(localStorage.getItem(key) || "[]");
const setMockData = (key: string, data: any[]) => localStorage.setItem(key, JSON.stringify(data));

const handleGetList = (_resource: string, key: string) => {
    const data = getMockData(key);
    return {
        data,
        total: data.length,
    };
};

const handleGetOne = (_resource: string, key: string, id: any) => {
    const data = getMockData(key);
    const item = data.find((item: any) => item.id == id);
    return {
        data: item,
    };
};

const handleCreate = (resource: string, key: string, variables: any) => {
    const data = getMockData(key);
    const newItem = {
        id: Math.max(...data.map((i: any) => i.id), 0) + 1,
        ...variables,
        status: resource === "virtual_machines" ? { printableStatus: "Stopped" } : undefined // Default status only for VMs
    };
    data.push(newItem);
    setMockData(key, data);
    return {
        data: newItem,
    } as any;
};

const handleUpdate = (_resource: string, key: string, id: any, variables: any) => {
    const data = getMockData(key);
    const index = data.findIndex((item: any) => item.id == id);
    if (index !== -1) {
        data[index] = { ...data[index], ...variables };
        setMockData(key, data);
        return {
            data: data[index],
        };
    }
    return { data: {} }; // Fallback
};

const handleDeleteOne = (_resource: string, key: string, id: any) => {
    const data = getMockData(key);
    const newData = data.filter((item: any) => item.id != id);
    setMockData(key, newData);
    return {
        data: { id } as any,
    } as any;
};

const handleDeleteMany = (_resource: string, key: string, ids: any[]) => {
    const data = getMockData(key);
    const newData = data.filter((item: any) => !ids.map(String).includes(String(item.id)));
    setMockData(key, newData);
    return {
        data: ids.map(id => ({ id })),
    } as any;
};

// ... existing imports


// ... existing initializations

if (!localStorage.getItem(MOCK_DATA_VOLUMES_KEY)) {
    const initialData = [
        {
            id: 1,
            apiVersion: "cdi.kubevirt.io/v1beta1",
            kind: "DataVolume",
            metadata: { name: "rocky9-datavolume", namespace: "default" },
            spec: {
                pvc: {
                    accessModes: ["ReadWriteOnce"],
                    resources: { requests: { storage: "10Gi" } }
                },
                source: {
                    http: { url: "https://download.rockylinux.org/pub/rocky/9/images/x86_64/Rocky-9-GenericCloud.latest.x86_64.qcow2" }
                }
            }
        },
        {
            id: 2,
            apiVersion: "cdi.kubevirt.io/v1beta1",
            kind: "DataVolume",
            metadata: { name: "test-dv-pvc", namespace: "default" },
            spec: {
                pvc: {
                    accessModes: ["ReadWriteOnce"],
                    resources: { requests: { storage: "20Gi" } }
                },
                source: {
                    pvc: { name: "existing-pvc-name" }
                }
            }
        }
    ];
    localStorage.setItem(MOCK_DATA_VOLUMES_KEY, JSON.stringify(initialData));
}

// Initialize mock data for Namespaces if empty
if (!localStorage.getItem(MOCK_NAMESPACES_KEY)) {
    const initialData = [
        {
            id: 1,
            apiVersion: "v1",
            kind: "Namespace",
            metadata: {
                name: "default",
                annotations: {
                    "kubevirt-gui/default-namespace": "true"
                }
            },
            status: { phase: "Active" }
        }
    ];
    localStorage.setItem(MOCK_NAMESPACES_KEY, JSON.stringify(initialData));
}

// ... existing handlers (getMockData, setMockData, etc.)

export const customDataProvider: DataProvider = {
    ...baseDataProvider,

    getList: async ({ resource, pagination, filters, sorters, meta }) => {
        if (resource === "virtual_machines") return handleGetList(resource, MOCK_VMS_KEY);
        if (resource === "user_defined_networks") return handleGetList(resource, MOCK_UDNS_KEY);
        if (resource === "cluster_user_defined_networks") return handleGetList(resource, MOCK_CUDNS_KEY);
        if (resource === "virtual_machine_cluster_instancetypes") return handleGetList(resource, MOCK_VM_CLUSTER_INSTANCETYPES_KEY);
        if (resource === "data_volumes") return handleGetList(resource, MOCK_DATA_VOLUMES_KEY);
        if (resource === "namespaces") return handleGetList(resource, MOCK_NAMESPACES_KEY);

        return baseDataProvider.getList({ resource, pagination, filters, sorters, meta });
    },

    getOne: async ({ resource, id, meta }) => {
        if (resource === "virtual_machines") return handleGetOne(resource, MOCK_VMS_KEY, id);
        if (resource === "user_defined_networks") return handleGetOne(resource, MOCK_UDNS_KEY, id);
        if (resource === "cluster_user_defined_networks") return handleGetOne(resource, MOCK_CUDNS_KEY, id);
        if (resource === "data_volumes") return handleGetOne(resource, MOCK_DATA_VOLUMES_KEY, id);
        if (resource === "namespaces") return handleGetOne(resource, MOCK_NAMESPACES_KEY, id);

        return baseDataProvider.getOne({ resource, id, meta });
    },

    create: async ({ resource, variables, meta }) => {
        if (resource === "virtual_machines") return handleCreate(resource, MOCK_VMS_KEY, variables);
        if (resource === "user_defined_networks") return handleCreate(resource, MOCK_UDNS_KEY, variables);
        if (resource === "data_volumes") return handleCreate(resource, MOCK_DATA_VOLUMES_KEY, variables);
        if (resource === "namespaces") return handleCreate(resource, MOCK_NAMESPACES_KEY, variables);

        return baseDataProvider.create({ resource, variables, meta });
    },

    update: async ({ resource, id, variables, meta }) => {
        if (resource === "virtual_machines") return handleUpdate(resource, MOCK_VMS_KEY, id, variables);
        if (resource === "user_defined_networks") return handleUpdate(resource, MOCK_UDNS_KEY, id, variables);
        if (resource === "data_volumes") return handleUpdate(resource, MOCK_DATA_VOLUMES_KEY, id, variables);
        if (resource === "namespaces") return handleUpdate(resource, MOCK_NAMESPACES_KEY, id, variables);

        return baseDataProvider.update({ resource, id, variables, meta });
    },

    deleteOne: async ({ resource, id, variables, meta }) => {
        if (resource === "virtual_machines") return handleDeleteOne(resource, MOCK_VMS_KEY, id);
        if (resource === "user_defined_networks") return handleDeleteOne(resource, MOCK_UDNS_KEY, id);
        if (resource === "data_volumes") return handleDeleteOne(resource, MOCK_DATA_VOLUMES_KEY, id);
        if (resource === "namespaces") return handleDeleteOne(resource, MOCK_NAMESPACES_KEY, id);

        return baseDataProvider.deleteOne({ resource, id, variables, meta });
    },

    deleteMany: async ({ resource, ids, variables, meta }) => {
        if (resource === "virtual_machines") return handleDeleteMany(resource, MOCK_VMS_KEY, ids);
        if (resource === "user_defined_networks") return handleDeleteMany(resource, MOCK_UDNS_KEY, ids);
        if (resource === "data_volumes") return handleDeleteMany(resource, MOCK_DATA_VOLUMES_KEY, ids);
        if (resource === "namespaces") return handleDeleteMany(resource, MOCK_NAMESPACES_KEY, ids);

        const data = await Promise.all(
            ids.map(async (id) => {
                const { data } = await baseDataProvider.deleteOne({ resource, id, variables, meta });
                return data;
            }),
        );

        return { data };
    },

    getApiUrl: () => API_URL,
};




