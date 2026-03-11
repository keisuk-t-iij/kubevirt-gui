import React from "react";
import {
    List,
    ShowButton,
    EditButton,
    DeleteButton,
    useDataGrid,
} from "@refinedev/mui";
import { DataGrid, GridColDef } from "@mui/x-data-grid";
import { useDeleteMany, useResourceParams } from "@refinedev/core";
import Button from "@mui/material/Button";

const VM_VARIANT_ANNOTATION = "kubevirt-gui/vm-variant";

const getVmVariant = (row: any) => {
    return row?.metadata?.annotations?.[VM_VARIANT_ANNOTATION] ?? "ike-virtual-private-cluster";
};

interface VMRow {
    id: number;
    metadata: {
        name: string;
        namespace: string;
    };
    spec: {
        instancetype: {
            name: string;
        };
        runStrategy: string;
        template?: {
            spec?: {
                networks?: {
                    name: string;
                    multus?: {
                        networkName: string;
                    };
                }[];
            };
        };
    };
    status: {
        printableStatus: string;
    };
}

export const VirtualMachineList = () => {
    const { dataGridProps } = useDataGrid();
    const { mutate: deleteMany } = useDeleteMany();
    const { resource } = useResourceParams();
    const currentVariant = resource?.meta?.vmVariant as string | undefined;

    // We can use the DataGrid's selection model, but we need to track it to show a delete button
    const [rowSelectionModel, setRowSelectionModel] = React.useState<any[]>([]);

    const filteredRows = React.useMemo(() => {
        const rows = dataGridProps.rows ?? [];

        if (!currentVariant) {
            return rows;
        }

        return rows.filter((row: any) => getVmVariant(row) === currentVariant);
    }, [currentVariant, dataGridProps.rows]);

    const columns: GridColDef[] = [
        {
            field: "id",
            headerName: "ID",
            type: "number",
            minWidth: 50,
        },
        {
            field: "metadata.name",
            headerName: "Name",
            minWidth: 150,
            flex: 1,
            valueGetter: (_value, row) => {
                return (row as VMRow)?.metadata?.name;
            }
        },
        {
            field: "metadata.namespace",
            headerName: "Namespace",
            minWidth: 150,
            valueGetter: (_value, row) => {
                return (row as VMRow)?.metadata?.namespace;
            }
        },
        {
            field: "spec.instancetype.name",
            headerName: "Instance Type",
            minWidth: 150,
            valueGetter: (_value, row) => {
                return (row as VMRow)?.spec?.instancetype?.name;
            }
        },
        {
            field: "metadata.annotations.kubevirt-gui/network-pattern",
            headerName: "Network Config",
            minWidth: 150,
            valueGetter: (_value, row) => {
                return (row as any)?.metadata?.annotations?.["kubevirt-gui/network-pattern"] || "Custom/Unknown";
            }
        },
        {
            field: "secondaryNetworks",
            headerName: "Secondary Networks",
            minWidth: 200,
            valueGetter: (_value, row) => {
                const networkPattern = (row as any)?.metadata?.annotations?.["kubevirt-gui/network-pattern"];
                if (networkPattern === "DefaultSecondary" || networkPattern === "PrimarySecondary") {
                    const networks = (row as VMRow)?.spec?.template?.spec?.networks;
                    if (networks) {
                        return networks
                            .filter(n => n.multus?.networkName)
                            .map(n => n.multus?.networkName)
                            .join(", ");
                    }
                }
                return "";
            }
        },
        {
            field: "status.printableStatus",
            headerName: "Status",
            minWidth: 120,
            valueGetter: (_value, row) => {
                // Determine status. Usually in status.printableStatus for VirtualMachine
                return (row as VMRow)?.status?.printableStatus || "Unknown";
            }
        },
        {
            field: "actions",
            headerName: "Actions",
            sortable: false,
            renderCell: ({ row }) => (
                <>
                    <EditButton hideText recordItemId={row.id} />
                    <ShowButton hideText recordItemId={row.id} />
                    <DeleteButton hideText recordItemId={row.id} />
                </>
            ),
            align: "center",
            headerAlign: "center",
            minWidth: 80,
        },
    ];

    return (
        <List headerButtons={({ defaultButtons }) => (
            <>
                {defaultButtons}
                {rowSelectionModel.length > 0 && (
                    <Button
                        variant="contained"
                        color="error"
                        onClick={() => {
                            deleteMany({
                                resource: "virtual_machines",
                                ids: rowSelectionModel,
                            });
                            setRowSelectionModel([]);
                        }}
                    >
                        Delete Selected
                    </Button>
                )}
            </>
        )}>
            <DataGrid
                {...dataGridProps}
                rows={filteredRows}
                columns={columns}
                autoHeight
                checkboxSelection
                onRowSelectionModelChange={(newRowSelectionModel) => {
                    setRowSelectionModel(newRowSelectionModel as any[]);
                }}
                rowSelectionModel={rowSelectionModel}
            />
        </List>
    );
};
