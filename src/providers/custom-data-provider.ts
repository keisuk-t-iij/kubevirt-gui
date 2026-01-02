import { DataProvider } from "@refinedev/core";
import simpleRestDataProvider from "@refinedev/simple-rest";

const API_URL = "https://api.fake-rest.refine.dev";
const baseDataProvider = simpleRestDataProvider(API_URL);

const MOCK_VMS_KEY = "mock_virtual_machines";
const MOCK_UDNS_KEY = "mock_user_defined_networks";
const MOCK_CUDNS_KEY = "mock_cluster_user_defined_networks";
const MOCK_VM_CLUSTER_INSTANCETYPES_KEY = "mock_vm_cluster_instancetypes";

// Initialize mock data for VirtualMachines if empty
if (!localStorage.getItem(MOCK_VMS_KEY)) {
    const initialData = [
        {
            id: 1,
            metadata: { name: "test-vm-1", namespace: "default" },
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
            metadata: { name: "test-vm-2", namespace: "default" },
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
        }
    ];
    localStorage.setItem(MOCK_VMS_KEY, JSON.stringify(initialData));
}

// Initialize mock data for UserDefinedNetworks if empty
if (!localStorage.getItem(MOCK_UDNS_KEY)) {
    const initialData = [
        {
            id: 1,
            metadata: { name: "l2-network", namespace: "default" },
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
            metadata: { name: "l3-network", namespace: "default" },
            spec: {
                layer3: {
                    role: "Primary",
                    subnets: ["10.1.0.0/24"],
                    ipam: { mode: "Enabled", lifecycle: "Persistent" }
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
            metadata: { name: "cluster-l2-net" },
            spec: {
                network: {
                    topology: "Layer2",
                    layer2: {
                        role: "Secondary",
                        subnets: ["172.16.0.0/16"],
                        ipam: { mode: "Enabled" }
                    }
                },
                namespaceSelector: {
                    matchExpressions: [
                        { key: "kubernetes.io/metadata.name", operator: "In", values: ["test-ns"] }
                    ]
                }
            }
        },
        {
            id: 2,
            metadata: { name: "cluster-localnet" },
            spec: {
                network: {
                    topology: "Layer2", // Assumed simplify, usually uses 'localnet' in other contexts but keeping to provided schemas
                },
                namespaceSelector: {
                    matchExpressions: []
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

export const customDataProvider: DataProvider = {
    ...baseDataProvider,

    getList: async ({ resource, pagination, filters, sorters, meta }) => {
        if (resource === "virtual_machines") return handleGetList(resource, MOCK_VMS_KEY);
        if (resource === "user_defined_networks") return handleGetList(resource, MOCK_UDNS_KEY);
        if (resource === "cluster_user_defined_networks") return handleGetList(resource, MOCK_CUDNS_KEY);
        if (resource === "virtual_machine_cluster_instancetypes") return handleGetList(resource, MOCK_VM_CLUSTER_INSTANCETYPES_KEY);

        return baseDataProvider.getList({ resource, pagination, filters, sorters, meta });
    },

    getOne: async ({ resource, id, meta }) => {
        if (resource === "virtual_machines") return handleGetOne(resource, MOCK_VMS_KEY, id);
        if (resource === "user_defined_networks") return handleGetOne(resource, MOCK_UDNS_KEY, id);
        if (resource === "cluster_user_defined_networks") return handleGetOne(resource, MOCK_CUDNS_KEY, id);

        return baseDataProvider.getOne({ resource, id, meta });
    },

    create: async ({ resource, variables, meta }) => {
        if (resource === "virtual_machines") return handleCreate(resource, MOCK_VMS_KEY, variables);
        if (resource === "user_defined_networks") return handleCreate(resource, MOCK_UDNS_KEY, variables);
        // CUDN is read-only, no create handler needed strictly, but good to have if requirements change

        return baseDataProvider.create({ resource, variables, meta });
    },

    update: async ({ resource, id, variables, meta }) => {
        if (resource === "virtual_machines") return handleUpdate(resource, MOCK_VMS_KEY, id, variables);
        if (resource === "user_defined_networks") return handleUpdate(resource, MOCK_UDNS_KEY, id, variables);

        return baseDataProvider.update({ resource, id, variables, meta });
    },

    deleteOne: async ({ resource, id, variables, meta }) => {
        if (resource === "virtual_machines") return handleDeleteOne(resource, MOCK_VMS_KEY, id);
        if (resource === "user_defined_networks") return handleDeleteOne(resource, MOCK_UDNS_KEY, id);

        return baseDataProvider.deleteOne({ resource, id, variables, meta });
    },

    getApiUrl: () => API_URL,
};




