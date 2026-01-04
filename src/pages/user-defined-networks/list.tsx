import {
    List,
    ShowButton,
    EditButton,
    DeleteButton,
    useDataGrid,
} from "@refinedev/mui";
import { DataGrid, GridColDef } from "@mui/x-data-grid";
import { useDeleteMany } from "@refinedev/core";
import Button from "@mui/material/Button";
import React from "react";

interface UDNRow {
    id: number;
    metadata: {
        name: string;
        namespace: string;
    };
    spec: {
        layer2?: {
            subnets?: string[];
        };
        layer3?: any;
    };
}

export const UserDefinedNetworkList = () => {
    const { dataGridProps } = useDataGrid();
    const { mutate: deleteMany } = useDeleteMany();
    const [rowSelectionModel, setRowSelectionModel] = React.useState<any[]>([]);

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
            minWidth: 200,
            flex: 1,
            valueGetter: (_value, row) => {
                return (row as UDNRow)?.metadata?.name;
            }
        },
        {
            field: "metadata.namespace",
            headerName: "Namespace",
            minWidth: 150,
            valueGetter: (_value, row) => {
                return (row as UDNRow)?.metadata?.namespace || "default";
            }
        },
        {
            field: "spec.layer2",
            headerName: "Type",
            minWidth: 150,
            valueGetter: (_value, row) => {
                if ((row as UDNRow)?.spec?.layer2) return "Layer 2 (Secondary)";
                if ((row as UDNRow)?.spec?.layer3) return "Layer 3 (Primary)";
                return "Unknown";
            }
        },
        {
            field: "spec.layer2.subnets",
            headerName: "Subnet",
            minWidth: 200,
            valueGetter: (_value, row) => {
                const layer2 = (row as UDNRow)?.spec?.layer2;
                if (layer2 && layer2.subnets) {
                    return layer2.subnets.join(", ");
                }
                const layer3 = (row as UDNRow)?.spec?.layer3;
                if (layer3 && layer3.subnets) {
                    return layer3.subnets.map((s: any) => s.cidr).join(", ");
                }
                return "";
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
                                resource: "user_defined_networks",
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
